/**
 * @fileoverview Core Dependency Auto-Healing Engine.
 * Safely updates dependency strings while preserving Named Range Data Validation rules.
 * Fully header-driven without reliance on hardcoded column indexes or letters.
 */

/**
 * Scans dependency columns, calculates required updates, and returns the changes.
 * This function no longer writes directly to the sheet or logs its own activity.
 *
 * @returns {Object|null} An object containing the changes to be applied, or null if no changes are needed.
 */
function healBrokenDependencies() {
  console.log("--- [healBrokenDependencies] Starting calculation process ---");
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = (typeof DATA_SHEET_NAME !== "undefined" && DATA_SHEET_NAME) ? DATA_SHEET_NAME : "Action Items";
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    console.error(`[healBrokenDependencies] Sheet "${sheetName}" not found.`);
    return null;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    console.log("[healBrokenDependencies] No data rows found to process.");
    return null;
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const targetSort = (typeof HEADER_ITEM_SORT !== "undefined") ? HEADER_ITEM_SORT : "ITEM SORT";
  const targetAction = (typeof HEADER_ACTION_ITEM !== "undefined") ? HEADER_ACTION_ITEM : "ACTION ITEM";
  const targetDep = (typeof HEADER_DEPENDENCY !== "undefined") ? HEADER_DEPENDENCY : "ACTION ITEM DEPENDENCY";

  const colSortIdx = findHeaderColumnIndex(headers, targetSort);
  const colActionIdx = findHeaderColumnIndex(headers, targetAction);
  const colDepIdx = findHeaderColumnIndex(headers, targetDep);

  if (colSortIdx === 0 || colActionIdx === 0 || colDepIdx === 0) {
    console.error(`[healBrokenDependencies] ERROR: Missing required headers.`);
    return null;
  }

  const sortValues = sheet.getRange(2, colSortIdx, lastRow - 1, 1).getValues();
  const actionValues = sheet.getRange(2, colActionIdx, lastRow - 1, 1).getValues();
  const depValues = sheet.getRange(2, colDepIdx, lastRow - 1, 1).getValues();

  const sortCodeToConcatMap = {};
  for (let r = 0; r < sortValues.length; r++) {
    const itemSort = String(sortValues[r][0]).trim();
    const actionItem = String(actionValues[r][0]).replace(/\s+/g, ' ').trim();
    if (itemSort && actionItem) {
      sortCodeToConcatMap[itemSort] = `${itemSort} ${actionItem}`;
    }
  }

  const changesToApply = [];
  let sampleOldValue = "";
  let sampleNewValue = "";

  for (let r = 0; r < depValues.length; r++) {
    const currentRowNumber = r + 2;
    const originalValue = String(depValues[r][0]).trim();
    if (!originalValue) continue;

    const tokens = originalValue.match(/\b([A-Za-z0-9-_]+)\b/g) || [];
    const matchedCodes = tokens.filter(token => sortCodeToConcatMap[token]);
    
    if (matchedCodes.length > 0) {
      const uniqueMatchedCodes = [...new Set(matchedCodes)];
      const healedString = uniqueMatchedCodes.map(code => sortCodeToConcatMap[code]).join(", ");

      if (originalValue !== healedString) {
        if (!sampleOldValue) sampleOldValue = originalValue;
        sampleNewValue = healedString;
        
        changesToApply.push({
          row: currentRowNumber,
          newValue: healedString,
          oldValue: originalValue
        });
      }
    }
  }

  if (changesToApply.length > 0) {
    console.log(`[healBrokenDependencies] Calculated ${changesToApply.length} dependency changes to apply.`);
    const firstRow = Math.min(...changesToApply.map(c => c.row));
    const lastRow = Math.max(...changesToApply.map(c => c.row));

    return {
      count: changesToApply.length,
      sheetName: sheetName,
      changes: changesToApply,
      firstRow: firstRow,
      lastRow: lastRow,
      oldValue: sampleOldValue, // Sample of the first old value
      newValue: sampleNewValue  // Sample of the last new value
    };
  } else {
    console.log("[healBrokenDependencies] Scan complete. No dependencies needed healing.");
    return null;
  }
}

/**
 * Searches row headers for target text flexible match.
 * 
 * @param {Array<string>} headers - Header row values.
 * @param {string} targetText - Search header name.
 * @returns {number} 1-based column index.
 */
function findHeaderColumnIndex(headers, targetText) {
  if (!headers || !headers.length) return 0;

  const cleanTarget = String(targetText).toUpperCase().trim();

  // 1. Exact match
  for (let c = 0; c < headers.length; c++) {
    const val = String(headers[c]).toUpperCase().trim();
    if (val === cleanTarget) return c + 1;
  }

  // 2. Partial match or plural match
  for (let c = 0; c < headers.length; c++) {
    const val = String(headers[c]).toUpperCase().trim();
    if (val.includes(cleanTarget) || cleanTarget.includes(val) || (cleanTarget.startsWith("DEPENDEN") && val.startsWith("DEPENDEN"))) {
      return c + 1;
    }
  }

  return 0;
}

/**
 * Writes data values to a range safely without destroying Data Validation rules.
 * 
 * @param {GoogleAppsScript.Spreadsheet.Range} range - Target range.
 * @param {Array<Array<string>>} values - Values array to write.
 */
function writeWithValidationRetry(range, values) {
  try {
    SpreadsheetApp.flush();
    range.setValues(values);
    SpreadsheetApp.flush();
    console.log(`>>> [POST-WRITE SUCCESS] Standard write succeeded for ${range.getA1Notation()}`);
  } catch (error) {
    console.warn(`>>> [WRITE RETRY TRIGGERED] Validation cache not ready (${error.toString()}). Pausing 2.5s and retrying...`);
    
    Utilities.sleep(2500);
    SpreadsheetApp.flush();

    try {
      range.setValues(values);
      SpreadsheetApp.flush();
      console.log(`>>> [POST-WRITE SUCCESS] Retry write succeeded for ${range.getA1Notation()}`);
    } catch (retryError) {
      console.warn(`>>> [SAFE VALIDATION RELAXATION] Allowing invalid inputs temporarily to preserve Named Range configuration...`);
      
      const validations = range.getDataValidations();
      const relaxedValidations = validations.map(row => 
        row.map(rule => rule ? rule.copy().setAllowInvalid(true).build() : null)
      );

      range.setDataValidations(relaxedValidations);
      range.setValues(values);
      SpreadsheetApp.flush();

      range.setDataValidations(validations);
      console.log(`>>> [POST-WRITE SUCCESS] Safe relaxed write succeeded for ${range.getA1Notation()}`);
    }
  }
}