/**
 * @fileoverview Helper tools, custom UI menu creation, range sync utilities,
 * sequential numbering realignment, and Drive file synchronization.
 */

// ==========================================
// 1. TRIGGER / MENU CREATION
// ==========================================

/**
 * Automatically runs when the spreadsheet is opened.
 * Creates a custom menu in the Google Sheets user interface.
 * 
 * @returns {void}
 */
function onOpen() {
  Logger.log("onOpen: Triggered. Starting custom menu generation.");
  try {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('Helper Tools')
      .addItem('Run Sequential Sync (Clear & Insert)', 'runClearRangeInsertArrayFormula')
      .addItem('1. Clear Configured Range', 'clearConfiguredRange')
      .addItem('2. Insert Setup Sync Formula', 'insertSyncFormula')
      .addItem('3. Realign All Column Pairs', 'realignAllColumnPairs')
      .addItem('Sync Resources Files with Drive', 'syncFilesFromDrive')
      .addToUi();
    Logger.log("onOpen: Custom menu 'Helper Tools' created successfully.");
  } catch (error) {
    Logger.log("onOpen: Failed to build custom UI menu. Error: " + error.toString());
  }
}


// ==========================================
// 2. SEQUENTIAL CLEAR & INSERT CONTROLLER
// ==========================================

/**
 * Orchestrates the sequential flow:
 * 1. Clears the configured range.
 * 2. Waits for a success confirmation.
 * 3. Inserts the sync formula.
 * 
 * @returns {void}
 */
function runClearRangeInsertArrayFormula() {
  Logger.log("runClearRangeInsertArrayFormula: Starting workflow sequential execution...");

  const isComplete = clearConfiguredRange();

  if (isComplete === true) {
    Logger.log("runClearRangeInsertArrayFormula: Step 1 success verified. Proceeding to Step 2.");
    insertSyncFormula();
  } else {
    Logger.log("runClearRangeInsertArrayFormula: Step 1 failed or returned false. Aborting Step 2.");
    SpreadsheetApp.getUi().alert(
      'Process Aborted', 
      'The range could not be cleared, so the formula was not inserted. Check execution logs.', 
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/** 
 * Clears the contents of a range pre-defined in the script configuration. 
 * 
 * @returns {boolean} True if the clear operation succeeded, false otherwise. 
 */
function clearConfiguredRange() { 
  Logger.log("clearConfiguredRange: Execution initiated."); 
  const ss = SpreadsheetApp.getActiveSpreadsheet(); 
  const sheet = ss.getSheetByName(CLEAR_SHEET_NAME);  
  
  if (!sheet) { 
    Logger.log(`clearConfiguredRange: CRITICAL ERROR. Sheet "${CLEAR_SHEET_NAME}" does not exist.`); 
    return false; 
  }  
  
  try { 
    Logger.log(`clearConfiguredRange: Fetching range "${CLEAR_RANGE}"...`); 
    const range = sheet.getRange(CLEAR_RANGE);  
    
    Logger.log(`clearConfiguredRange: Clearing content inside "${CLEAR_SHEET_NAME}!${CLEAR_RANGE}"`); 
    
    range.setValue(null);
    range.clearContent();  
    range.clearDataValidations();
    
    SpreadsheetApp.flush();   
    
    Logger.log("clearConfiguredRange: Success. Content cleared and changes flushed."); 
    return true; 
  } catch (error) { 
    Logger.log(`clearConfiguredRange: ERROR. Failed to clear range. Exception: ${error.toString()}`); 
    return false; 
  }
}

/**
 * Reads global configuration variables to write an ARRAYFORMULA 
 * directly into a target cell on a designated worksheet.
 * 
 * @returns {boolean} True if the formula insertion succeeded, false otherwise.
 */
function insertSyncFormula() {
  Logger.log("insertSyncFormula: Execution initiated.");
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const targetSheet = ss.getSheetByName(TARGET_SHEET_NAME);
  
  if (!targetSheet) {
    Logger.log(`insertSyncFormula: CRITICAL ERROR. Sheet named "${TARGET_SHEET_NAME}" does not exist.`);
    return false;
  }

  try {
    Logger.log(`insertSyncFormula: Target sheet accessed. Targeting cell "${TARGET_CELL}"...`);
    const cell = targetSheet.getRange(TARGET_CELL);
    
    Logger.log(`insertSyncFormula: Injecting formula -> ${FORMULA_TO_INSERT}`);
    cell.setFormula(FORMULA_TO_INSERT);
    
    SpreadsheetApp.flush();
    
    Logger.log(`insertSyncFormula: Success. Formula written to ${TARGET_SHEET_NAME}!${TARGET_CELL}`);
    return true;
  } catch (error) {
    Logger.log(`insertSyncFormula: ERROR. Failed to write formula to cell. Exception: ${error.toString()}`);
    return false;
  }
}


// ==========================================
// 3. COLUMN REALIGNMENT & NUMBERING ENGINE
// ==========================================

/**
 * Loops through each configured column pair, processes the realignment logic,
 * and updates the sheet.
 * 
 * @returns {void}
 */
function realignAllColumnPairs() {
  Logger.log("realignAllColumnPairs: Starting multi-column alignment task...");
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(REALIGN_SHEET_NAME);
  
  if (!sheet) {
    Logger.log(`realignAllColumnPairs: CRITICAL ERROR. Sheet "${REALIGN_SHEET_NAME}" not found.`);
    return;
  }
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    Logger.log("realignAllColumnPairs: No data rows found to process.");
    return;
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  COLUMN_PAIRS.forEach((pair, index) => {
    Logger.log(`\n--- Processing Pair #${index + 1}: [${pair.codeHeader}] <-> [${pair.nameHeader}] ---`);
    
    const sortCodeColIdx = headers.indexOf(pair.codeHeader) + 1;
    const itemNameColIdx = headers.indexOf(pair.nameHeader) + 1;
    
    if (sortCodeColIdx === 0 || itemNameColIdx === 0) {
      Logger.log(`Error: Missing columns on sheet for pair. Column "${pair.codeHeader}" index: ${sortCodeColIdx}, Column "${pair.nameHeader}" index: ${itemNameColIdx}. Skipping this pair.`);
      return;
    }
    
    try {
      realignSinglePair(sheet, sortCodeColIdx, itemNameColIdx, lastRow, pair.codeHeader, pair.nameHeader);
    } catch (error) {
      Logger.log(`Error running realignment for pair [${pair.codeHeader} <-> ${pair.nameHeader}]: ${error.toString()}`);
    }
  });
  
  Logger.log("\nrealignAllColumnPairs: Multi-column alignment completed.");
}

/**
 * Runs the realignment logic for a single target column pair.
 */
function realignSinglePair(sheet, sortCodeColIdx, itemNameColIdx, lastRow, codeHeader, nameHeader) {
  const sortCodeValues = sheet.getRange(2, sortCodeColIdx, lastRow - 1, 1).getValues();
  const itemNameValues = sheet.getRange(2, itemNameColIdx, lastRow - 1, 1).getValues();
  
  const rows = [];
  const codeRegex = /^([A-Za-z]+)(\d+)$/;
  
  for (let i = 0; i < sortCodeValues.length; i++) {
    const rowNum = i + 2;
    const rawSortCode = String(sortCodeValues[i][0]).trim();
    const rawItemName = String(itemNameValues[i][0]).trim();
    const cleanItemName = cleanString(rawItemName);
    
    let prefix = "";
    let num = null;
    let status = "blank";
    
    if (rawSortCode) {
      const match = rawSortCode.match(codeRegex);
      if (match) {
        prefix = match[1].toUpperCase();
        num = parseInt(match[2], 10);
        status = "existing";
      }
    }
    
    rows.push({
      rowNum: rowNum,
      rawSortCode: rawSortCode,
      rawItemName: rawItemName,
      cleanItemName: cleanItemName,
      prefix: prefix,
      num: num,
      status: status,
      newCode: ""
    });
  }
  
  const existingPrefixes = new Set();
  const itemNameToPrefix = {};
  const prefixLastNumber = {};
  
  rows.forEach(row => {
    if (row.status !== "existing" || !row.cleanItemName) return;
    
    if (isPrefixValid(row.prefix, row.cleanItemName)) {
      row.status = "aligned";
      existingPrefixes.add(row.prefix);
      
      if (!itemNameToPrefix[row.cleanItemName]) {
        itemNameToPrefix[row.cleanItemName] = row.prefix;
      }
      
      prefixLastNumber[row.prefix] = Math.max(prefixLastNumber[row.prefix] || 0, row.num);
    } else {
      row.status = "misaligned";
    }
  });
  
  rows.forEach(row => {
    if (!row.cleanItemName) return;
    if (!itemNameToPrefix[row.cleanItemName]) {
      const resolved = resolvePrefix(row.cleanItemName, existingPrefixes);
      itemNameToPrefix[row.cleanItemName] = resolved;
      Logger.log(`[${nameHeader}] Mapped Item: "${row.rawItemName}" -> Prefix: "${resolved}"`);
    }
  });
  
  const misalignedPrefixes = new Set();
  rows.forEach(row => {
    if (row.status === "misaligned") {
      misalignedPrefixes.add(row.prefix);
    }
  });
  
  rows.forEach(row => {
    if (row.prefix && misalignedPrefixes.has(row.prefix)) {
      row.status = "realign_pool";
    }
  });
  
  const groupedByPrefix = {};
  rows.forEach(row => {
    if (row.status === "realign_pool") {
      if (!groupedByPrefix[row.prefix]) {
        groupedByPrefix[row.prefix] = [];
      }
      groupedByPrefix[row.prefix].push(row);
    }
  });
  
  Object.keys(groupedByPrefix).forEach(oldPrefix => {
    const pool = groupedByPrefix[oldPrefix];
    
    const groupedByItem = {};
    pool.forEach(row => {
      if (!groupedByItem[row.cleanItemName]) {
        groupedByItem[row.cleanItemName] = [];
      }
      groupedByItem[row.cleanItemName].push(row);
    });
    
    const groupsArray = Object.keys(groupedByItem).map(itemName => {
      const groupRows = groupedByItem[itemName];
      const minSortVal = Math.min(...groupRows.map(r => r.num !== null ? r.num : r.rowNum));
      return {
        itemName: itemName,
        rows: groupRows,
        minSortVal: minSortVal
      };
    });
    
    groupsArray.sort((a, b) => a.minSortVal - b.minSortVal);
    
    groupsArray.forEach(group => {
      group.rows.sort((a, b) => (a.num !== null ? a.num : a.rowNum) - (b.num !== null ? b.num : b.rowNum));
      
      const targetPrefix = itemNameToPrefix[group.itemName];
      
      group.rows.forEach(row => {
        const nextNum = (prefixLastNumber[targetPrefix] || 0) + 1;
        prefixLastNumber[targetPrefix] = nextNum;
        
        row.newCode = targetPrefix + String(nextNum).padStart(PADDING_WIDTH, '0');
        row.status = "realigned";
      });
    });
  });
  
  rows.forEach(row => {
    if (row.status === "blank" && row.cleanItemName) {
      const targetPrefix = itemNameToPrefix[row.cleanItemName];
      const nextNum = (prefixLastNumber[targetPrefix] || 0) + 1;
      prefixLastNumber[targetPrefix] = nextNum;
      
      row.newCode = targetPrefix + String(nextNum).padStart(PADDING_WIDTH, '0');
      row.status = "processed_blank";
    }
  });
  
  const outputValues = [];
  let updateCount = 0;
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    let finalCode = row.rawSortCode;
    
    if (row.newCode) {
      finalCode = row.newCode;
      updateCount++;
      Logger.log(`[${codeHeader} | Row ${row.rowNum}]: Realigned -> "${row.rawSortCode || 'BLANK'}" to "${row.newCode}"`);
    }
    outputValues.push([finalCode]);
  }
  
  if (updateCount > 0) {
    sheet.getRange(2, sortCodeColIdx, outputValues.length, 1).setValues(outputValues);
    SpreadsheetApp.flush();
    Logger.log(`realignSinglePair: Successfully updated ${updateCount} rows in column "${codeHeader}".`);
  } else {
    Logger.log(`realignSinglePair: Column "${codeHeader}" is fully aligned. No updates needed.`);
  }
}

/**
 * Cleans item description strings by stripping out punctuation and spaces.
 */
function cleanString(str) {
  if (!str) return "";
  return str.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

/**
 * Validates whether an existing code's prefix aligns with the item name.
 */
function isPrefixValid(prefix, cleanName) {
  if (!prefix || !cleanName || prefix.length !== 4) return false;
  
  if (cleanName.length < 4) {
    cleanName = cleanName.padEnd(4, 'X');
  }
  
  if (prefix === cleanName.substring(0, 4)) return true;
  
  const firstThree = cleanName.substring(0, 3);
  if (prefix.substring(0, 3) !== firstThree) return false;
  
  const lastChar = prefix.charAt(3);
  for (let i = 4; i < cleanName.length; i++) {
    if (cleanName.charAt(i) === lastChar) {
      return true;
    }
  }
  return false;
}

/**
 * Generates a unique 4-character prefix for an item.
 */
function resolvePrefix(cleanName, existingPrefixes) {
  if (cleanName.length < 4) {
    cleanName = cleanName.padEnd(4, 'X');
  }
  
  let prefix = cleanName.substring(0, 4);
  if (!existingPrefixes.has(prefix)) {
    existingPrefixes.add(prefix);
    return prefix;
  }
  
  const firstThree = cleanName.substring(0, 3);
  let charIndex = 4;
  
  while (charIndex < cleanName.length) {
    prefix = firstThree + cleanName.charAt(charIndex);
    if (!existingPrefixes.has(prefix)) {
      existingPrefixes.add(prefix);
      return prefix;
    }
    charIndex++;
  }
  
  let suffixNum = 1;
  while (existingPrefixes.has(firstThree + suffixNum)) {
    suffixNum++;
  }
  prefix = firstThree + suffixNum;
  existingPrefixes.add(prefix);
  return prefix;
}


// ==========================================
// 4. DRIVE FILE LINK SYNCHRONIZATION ENGINE
// ==========================================

/**
 * Main function to synchronize Drive folder files with the spreadsheet.
 */
function syncFilesFromDrive() {
  var targetSheetName = 'Resource Hub';
  var folderId = '1jB7581EJjIWYRDPUHp9yfvqudXLNwfYD'; 
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(targetSheetName);
  
  if (!sheet) {
    SpreadsheetApp.getUi().alert('Error: The tab named "' + targetSheetName + '" was not found. Sync canceled.');
    return;
  }
  
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  
  if (values.length === 0 || values[0].length === 0) {
    SpreadsheetApp.getUi().alert('The "' + targetSheetName + '" sheet is empty. Please add headers to Row 1.');
    return;
  }
  
  var headers = values[0];
  var nameColIdx = headers.indexOf("RESOURCE FILE NAME");
  var linkColIdx = headers.indexOf("RESOURCE LINK");
  
  if (nameColIdx === -1 || linkColIdx === -1) {
    SpreadsheetApp.getUi().alert('Missing required columns on "' + targetSheetName + '"! Ensure Row 1 has exactly "RESOURCE FILE NAME" and "RESOURCE LINK".');
    return;
  }
  
  var filesByName = {};
  var filesByUrl = {};
  try {
    var parentFolder = DriveApp.getFolderById(folderId);
    getAllFilesInFolder(parentFolder, filesByName, filesByUrl);
  } catch (e) {
    SpreadsheetApp.getUi().alert('Error accessing the Drive Folder. Check permissions or the Folder ID.');
    return;
  }
  
  var filesInSheet = {};
  
  for (var i = values.length - 1; i > 0; i--) {
    var row = values[i];
    var fileName = row[nameColIdx];
    
    if (!fileName || fileName.toString().trim() === "") continue;
    fileName = fileName.toString().trim();
    
    var linkCell = sheet.getRange(i + 1, linkColIdx + 1);
    
    var existingUrl = null;
    var cellFormula = linkCell.getFormula();
    var rtv = linkCell.getRichTextValue();
    var richTextUrl = rtv ? rtv.getLinkUrl() : null;
    
    if (cellFormula && cellFormula.toUpperCase().includes('HYPERLINK')) {
      var match = cellFormula.match(/=HYPERLINK\s*\(\s*["']([^"']+)["']/i);
      if (match && match[1]) {
        existingUrl = match[1].trim();
      }
    } else if (richTextUrl) {
      existingUrl = richTextUrl.trim();
    }
    
    if (existingUrl) {
      if (filesByUrl.hasOwnProperty(existingUrl)) {
        var actualName = filesByUrl[existingUrl];
        if (fileName !== actualName) {
          sheet.getRange(i + 1, nameColIdx + 1).setValue(actualName);
        }
        filesInSheet[actualName] = true;
      } else {
        if (filesByName.hasOwnProperty(fileName)) {
          var correctUrl = filesByName[fileName];
          linkCell.setFormula('=HYPERLINK("' + correctUrl + '", "[ VIEW RESOURCE ]")');
          filesInSheet[fileName] = true;
        } else {
          sheet.deleteRow(i + 1);
        }
      }
    } else {
      if (filesByName.hasOwnProperty(fileName)) {
        var correctUrl = filesByName[fileName];
        linkCell.setFormula('=HYPERLINK("' + correctUrl + '", "[ VIEW RESOURCE ]")');
        filesInSheet[fileName] = true;
      } else {
        sheet.deleteRow(i + 1);
      }
    }
  }
  
  for (var fName in filesByName) {
    if (!filesInSheet.hasOwnProperty(fName)) {
      var fUrl = filesByName[fName];
      
      var newRow = new Array(headers.length).fill("");
      newRow[nameColIdx] = fName;
      newRow[linkColIdx] = '=HYPERLINK("' + fUrl + '", "[ VIEW RESOURCE ]")';
      
      sheet.appendRow(newRow);
    }
  }
  
  SpreadsheetApp.getUi().alert('Sync Complete for "' + targetSheetName + '"!');
}

/**
 * Recursive helper function to traverse folders and collect files into maps.
 */
function getAllFilesInFolder(folder, filesByName, filesByUrl) {
  var files = folder.getFiles();
  while (files.hasNext()) {
    var file = files.next();
    var name = file.getName().trim();
    var url = file.getUrl();
    
    filesByName[name] = url;
    filesByUrl[url] = name;
  }
  
  var subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    getAllFilesInFolder(subfolders.next(), filesByName, filesByUrl);
  }
}