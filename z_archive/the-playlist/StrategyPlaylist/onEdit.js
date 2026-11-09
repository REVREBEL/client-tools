/**
 * @fileoverview Central Edit Trigger & Activity Audit Logger.
 * Captures user manual edits and bulk API updates, utilizing PropertiesService
 * state caching to accurately identify previous values during bulk edits.
 */

// ==========================================
// 1. SIMPLE TRIGGER ENTRY POINT
// ==========================================

/**
 * Standard Google Apps Script simple trigger.
 * Fires automatically on every user or API edit.
 * 
 * @param {GoogleAppsScript.Events.SheetsOnEdit} e - The edit event object.
 */
function onEdit(e) {
  try {
    const lock = LockService.getScriptLock();
    if (lock.tryLock(15000)) {
      try {
        logSheetActivity(e);
      } finally {
        lock.releaseLock();
      }
    } else {
      console.log('>>> [onEdit] Lock unavailable. Execution skipped.');
    }
  } catch (err) {
    console.error(`>>> [onEdit] Execution error: ${err.toString()}`);
  }
}

// ==========================================
// 2. CORE LOGGING LOGIC WITH STATE CACHING
// ==========================================

/**
 * Logs primary user activity and handles bulk API row updates with state comparison.
 * 
 * @param {GoogleAppsScript.Events.SheetsOnEdit} e - The edit event object.
 */
function logSheetActivity(e) {
  if (!e || !e.range) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const range = e.range;
  const sheet = range.getSheet();
  const sheetName = sheet.getName();
  const editedRow = range.getRow();
  const editedCol = range.getColumn();
  const numRows = range.getNumRows();
  const numCols = range.getNumColumns();

  const targetLogSheet = (typeof LOG_SHEET_NAME !== "undefined" && LOG_SHEET_NAME) ? LOG_SHEET_NAME : "Activity Log";
  if (sheetName === targetLogSheet || editedRow < 2) return;

  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return;

  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  const colSortIdx = findHeaderColumnIndex(headers, "ITEM SORT");
  const colActionIdx = findHeaderColumnIndex(headers, "ACTION ITEM");
  const colStatusIdx = findHeaderColumnIndex(headers, "STATUS");
  const colDepIdx = findHeaderColumnIndex(headers, "ACTION ITEM DEPENDENCY");
  const colLeadIdx = findHeaderColumnIndex(headers, "TEAM LEAD");
  const colDueDateIdx = findHeaderColumnIndex(headers, "DUE DATE");

  const rowValues = sheet.getRange(editedRow, 1, 1, headers.length).getValues()[0];
  const itemSort = colSortIdx > 0 ? String(rowValues[colSortIdx - 1]).trim() : "";
  const actionItem = colActionIdx > 0 ? String(rowValues[colActionIdx - 1]).trim() : "";
  const activeUser = Session.getActiveUser().getEmail() || (e.user ? e.user.email : "") || "Active User";
  const taskIdentifier = `${itemSort} ${actionItem}`.trim();

  // CASE 0: Bulk Row Update from Canvas App
  if (numRows === 1 && numCols > 5) {
    const scriptProps = PropertiesService.getScriptProperties();
    const rawSnapshot = scriptProps.getProperty("ROW_STATUS_SNAPSHOT");
    const statusSnapshot = rawSnapshot ? JSON.parse(rawSnapshot) : {};
    
    const previousStatus = statusSnapshot[editedRow] || "Unknown / Initial State";
    const currentStatus = colStatusIdx > 0 ? String(rowValues[colStatusIdx - 1]).trim() : "Blank";

    if (previousStatus !== currentStatus) {
      const statusCellA1 = `'${sheetName}'!${sheet.getRange(editedRow, colStatusIdx).getA1Notation()}`;
      const userSummary = `Status changed to "${currentStatus}" for task "${taskIdentifier}" via Canvas App`;
      const sysLog = `Bulk API write on ${range.getA1Notation()} (Previous Cached Status: "${previousStatus}")`;
      
      writeAuditLog(activeUser, statusCellA1, previousStatus, currentStatus, userSummary, sysLog, false, "User");

      statusSnapshot[editedRow] = currentStatus;
      scriptProps.setProperty("ROW_STATUS_SNAPSHOT", JSON.stringify(statusSnapshot));

      if (currentStatus.toLowerCase() === "complete" || currentStatus.toLowerCase() === "completed") {
        const healingResults = healBrokenDependencies();
        if (healingResults && healingResults.count > 0) {
            // (Logging for healing is handled inside the CASE 2 block)
        }
      }
    } else {
      // Log generic system update if status didn't change, to keep user reports clean
      const sysSummary = `Canvas App Row Update: Status of "${taskIdentifier || 'Row ' + editedRow}" is unchanged ("${currentStatus}")`;
      const sysLog = `Bulk edit via API on range ${range.getA1Notation()} (No status change detected)`;
      writeAuditLog("System", range.getA1Notation(), currentStatus, currentStatus, sysSummary, sysLog, true, "System");
    }
    return;
  }

  // SINGLE CELL EDITS
  const oldValue = e.oldValue ? String(e.oldValue).trim() : "";
  const newValue = e.value ? String(e.value).trim() : String(range.getValue() || "").trim();
  const cellCoordinate = `'${sheetName}'!${range.getA1Notation()}`;

  if (editedCol === colActionIdx && oldValue !== "" && newValue !== "" && oldValue !== newValue) {
    const userSummary = `Action Item Description updated to "${newValue}"`;
    const sysLog = `Title updated for task ${itemSort || 'Row ' + editedRow}`;
    writeAuditLog(activeUser, cellCoordinate, oldValue, newValue, userSummary, sysLog, false, "User");
  } 
  else if (editedCol === colStatusIdx && oldValue !== newValue) {
    const oldStatus = oldValue || "Blank";
    const newStatus = newValue || "Blank";
    const userSummary = `Status Change from ${oldStatus} to ${newStatus}`;
    const sysLog = `Manual status edit on cell ${cellCoordinate}`;
    writeAuditLog(activeUser, cellCoordinate, oldStatus, newStatus, userSummary, sysLog, false, "User", true);

    const scriptProps = PropertiesService.getScriptProperties();
    const rawSnapshot = scriptProps.getProperty("ROW_STATUS_SNAPSHOT");
    const statusSnapshot = rawSnapshot ? JSON.parse(rawSnapshot) : {};
    statusSnapshot[editedRow] = newStatus;
    scriptProps.setProperty("ROW_STATUS_SNAPSHOT", JSON.stringify(statusSnapshot));

    if (newStatus.toLowerCase() === "complete" || newStatus.toLowerCase() === "completed") {
        const healingResults = healBrokenDependencies();
        if (healingResults && healingResults.count > 0) {
            const depSheet = ss.getSheetByName(healingResults.sheetName);
            if (depSheet) {
                const depColHeader = (typeof HEADER_DEPENDENCY !== "undefined") ? HEADER_DEPENDENCY : "ACTION ITEM DEPENDENCY";
                const depColIdxHealing = findHeaderColumnIndex(headers, depColHeader);
                if (depColIdxHealing > 0) {
                    healingResults.changes.forEach(change => {
                        depSheet.getRange(change.row, depColIdxHealing).setValue(change.newValue);
                    });
                }
            }
            const rangeSummary = (healingResults.firstRow === healingResults.lastRow) ? `Row ${healingResults.firstRow}` : `Rows ${healingResults.firstRow}–${healingResults.lastRow}`;
            const healSummary = `Status change to "${newStatus}" triggered automatic dependency healing.`;
            const healSysLog = `Auto-healed ${healingResults.count} dependency reference(s) across ${rangeSummary}.`;
            writeAuditLog("System Auto-Healer", `'${healingResults.sheetName}'`, healingResults.oldValue, healingResults.newValue, healSummary, healSysLog, true, "System");
        }
    }
  } 
  else if (editedCol === colActionIdx && (!oldValue || oldValue === "") && newValue !== "") {
    const dueDateRaw = colDueDateIdx > 0 ? rowValues[colDueDateIdx - 1] : "";
    const dueDate = dueDateRaw instanceof Date ? Utilities.formatDate(dueDateRaw, Session.getScriptTimeZone(), "yyyy-MM-dd") : String(dueDateRaw).trim();
    const teamLead = colLeadIdx > 0 ? String(rowValues[colLeadIdx - 1]).trim() : "Unassigned";
    const userSummary = `New Action Item Added: ${newValue}, due on ${dueDate || 'N/A'} and assigned to ${teamLead || 'Unassigned'}`;
    const sysLog = `New task row created on Row ${editedRow}`;
    writeAuditLog(activeUser, cellCoordinate, "", newValue, userSummary, sysLog, false, "User");
  } 
  else if (oldValue !== newValue) {
    const headerName = headers[editedCol - 1] ? String(headers[editedCol - 1]).trim() : `Col ${editedCol}`;
    const userSummary = `Changed "${headerName}" in Row ${editedRow} from "${oldValue}" to "${newValue}"`;
    const sysLog = `Direct cell edit on ${cellCoordinate}`;
    writeAuditLog(activeUser, cellCoordinate, oldValue, newValue, userSummary, sysLog, false, "User");
  }
}

// ==========================================
// 3. INITIALIZATION HELPER
// ==========================================

/**
 * Builds an initial state snapshot of all status values in the sheet.
 * Run this function once manually or via onOpen to prime the cache.
 */
function initializeStatusSnapshot() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = (typeof DATA_SHEET_NAME !== "undefined" && DATA_SHEET_NAME) ? DATA_SHEET_NAME : "Action Items";
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) return;

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return;

  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const colStatusIdx = findHeaderColumnIndex(headers, "STATUS");
  if (colStatusIdx === 0) return;

  const statusValues = sheet.getRange(2, colStatusIdx, lastRow - 1, 1).getValues();
  const snapshot = {};

  for (let r = 0; r < statusValues.length; r++) {
    const rowNum = r + 2;
    snapshot[rowNum] = String(statusValues[r][0]).trim();
  }

  PropertiesService.getScriptProperties().setProperty("ROW_STATUS_SNAPSHOT", JSON.stringify(snapshot));
  console.log(`>>> [initializeStatusSnapshot] Initialized state snapshot for ${Object.keys(snapshot).length} rows.`);
}

// ==========================================
// 4. AUDIT LOG WRITER & HELPERS
// ==========================================

/**
 * Appends an entry to the Activity Log tab dynamically based on column headers.
 */
function writeAuditLog(user, cellRange, oldValue, newValue, summary, systemLog, isSystem, changeFrom, enableDeduplication = false) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const logSheetName = (typeof LOG_SHEET_NAME !== "undefined" && LOG_SHEET_NAME) ? LOG_SHEET_NAME : "Activity Log";
    let logSheet = ss.getSheetByName(logSheetName);

    if (!logSheet) {
      logSheet = ss.insertSheet(logSheetName);
      logSheet.appendRow(["TIMESTAMP", "USER", "CELL / RANGE", "OLD VALUE", "NEW VALUE", "SUMMARY", "SYSTEM LOG", "CHANGE FROM"]);
      logSheet.getRange("1:1").setFontWeight("bold");
    }

    const headers = logSheet.getRange(1, 1, 1, logSheet.getLastColumn()).getValues()[0];
    const now = new Date();

    if (enableDeduplication && changeFrom === "User" && logSheet.getLastRow() > 1) {
      const lastRowIdx = logSheet.getLastRow();
      const lastRowValues = logSheet.getRange(lastRowIdx, 1, 1, headers.length).getValues()[0];
      
      const colTimestamp = findHeaderColumnIndex(headers, "TIMESTAMP");
      const colCell = findHeaderColumnIndex(headers, "CELL / RANGE");

      const lastTimestamp = colTimestamp > 0 ? new Date(lastRowValues[colTimestamp - 1]) : new Date(0);
      const lastCell = colCell > 0 ? String(lastRowValues[colCell - 1]) : "";
      const minutesDifference = (now.getTime() - lastTimestamp.getTime()) / (1000 * 60);

      if (lastCell === cellRange && minutesDifference <= 5) {
        const rowDataToUpdate = [...lastRowValues];
        const colNew = findHeaderColumnIndex(headers, "NEW VALUE");
        const colSummary = findHeaderColumnIndex(headers, "SUMMARY");
        if (colTimestamp > 0) rowDataToUpdate[colTimestamp - 1] = now;
        if (colNew > 0) rowDataToUpdate[colNew - 1] = newValue;
        if (colSummary > 0) rowDataToUpdate[colSummary - 1] = summary;
        
        logSheet.getRange(lastRowIdx, 1, 1, rowDataToUpdate.length).setValues([rowDataToUpdate]);
        console.log(`>>> [writeAuditLog] Deduplicated and updated entry for ${cellRange}`);
        return;
      }
    }

    const colMap = {
      timestamp: findHeaderColumnIndex(headers, "TIMESTAMP"),
      user: findHeaderColumnIndex(headers, "USER"),
      cell: findHeaderColumnIndex(headers, "CELL / RANGE"),
      old: findHeaderColumnIndex(headers, "OLD VALUE"),
      new: findHeaderColumnIndex(headers, "NEW VALUE"),
      summary: findHeaderColumnIndex(headers, "SUMMARY"),
      sysLog: findHeaderColumnIndex(headers, "SYSTEM LOG"),
      changeFrom: findHeaderColumnIndex(headers, "CHANGE FROM")
    };
    
    const rowData = new Array(headers.length).fill("");
    if (colMap.timestamp > 0) rowData[colMap.timestamp - 1] = now;
    if (colMap.user > 0) rowData[colMap.user - 1] = user || "Unknown";
    if (colMap.cell > 0) rowData[colMap.cell - 1] = cellRange || "";
    if (colMap.old > 0) rowData[colMap.old - 1] = oldValue || "";
    if (colMap.new > 0) rowData[colMap.new - 1] = newValue || "";
    if (colMap.summary > 0) rowData[colMap.summary - 1] = summary || "";
    if (colMap.sysLog > 0) rowData[colMap.sysLog - 1] = systemLog || "";
    if (colMap.changeFrom > 0) rowData[colMap.changeFrom - 1] = changeFrom || (isSystem ? "System" : "User");

    logSheet.appendRow(rowData);
    console.log(`>>> [writeAuditLog] New entry recorded for ${cellRange} (Origin: ${changeFrom})`);
  } catch (err) {
    console.error(`>>> [writeAuditLog] ERROR writing to log: ${err.toString()}`);
  }
}

/**
 * Finds unblocked dependent rows when a task is completed.
 */
function findUnblockedDependencies(sheet, colDepIdx, taskIdentifier) {
  const unblockedList = [];
  if (colDepIdx === 0) return unblockedList;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return unblockedList;
  const depValues = sheet.getRange(2, colDepIdx, lastRow - 1, 1).getValues();
  for (let r = 0; r < depValues.length; r++) {
    const depText = String(depValues[r][0]).trim();
    if (depText && depText.includes(taskIdentifier)) {
      unblockedList.push(`Row ${r + 2}`);
    }
  }
  return unblockedList;
}

/**
 * Helper to locate a column index (1-based) by header name.
 */
function findHeaderColumnIndex(headers, targetHeader) {
  if (!headers || !headers.length) return 0;
  const cleanTarget = String(targetHeader).trim().toUpperCase();
  for (let i = 0; i < headers.length; i++) {
    const cleanHeader = String(headers[i]).trim().toUpperCase();
    if (cleanHeader === cleanTarget) {
      return i + 1;
    }
  }
  // Fallback for partial match if exact match is not found
  for (let i = 0; i < headers.length; i++) {
    const cleanHeader = String(headers[i]).trim().toUpperCase();
    if (cleanHeader.includes(cleanTarget)) {
      return i + 1;
    }
  }
  return 0;
}
