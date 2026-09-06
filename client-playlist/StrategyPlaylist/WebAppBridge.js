/**
 * @fileoverview HTTP bridge for the authenticated REVREBEL Client Portal.
 * Keeps Google Sheets and the existing Apps Script workflow engine as the
 * Playlist source of truth while the React UI is moved into Webflow Cloud.
 *
 * Configure Script Property PORTAL_API_TOKEN with the same secret used as
 * PLAYLIST_APPS_SCRIPT_TOKEN in Webflow Cloud.
 */

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const expectedToken = PropertiesService.getScriptProperties().getProperty("PORTAL_API_TOKEN") || "";
    const suppliedToken = String(payload.token || "");

    if (!expectedToken || suppliedToken !== expectedToken) {
      return apiJsonResponse_({ ok: false, error: "Unauthorized" }, 401);
    }

    const action = String(payload.action || "");
    const requestedBy = String(payload.requestedBy || "Portal User");

    if (action === "updateRow") {
      const result = apiUpdatePlaylistRow_(payload.rowNumber, payload.values || {}, requestedBy);
      return apiJsonResponse_({ ok: true, result: result }, 200);
    }

    if (action === "insertRow") {
      const result = apiInsertPlaylistRow_(payload.values || {}, requestedBy);
      return apiJsonResponse_({ ok: true, result: result }, 201);
    }

    return apiJsonResponse_({ ok: false, error: "Unsupported action" }, 400);
  } catch (error) {
    console.error(">>> [WebAppBridge] API error:", error);
    return apiJsonResponse_({ ok: false, error: String(error && error.message ? error.message : error) }, 500);
  }
}

function apiUpdatePlaylistRow_(rowNumber, values, requestedBy) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = (typeof DATA_SHEET_NAME !== "undefined" && DATA_SHEET_NAME) ? DATA_SHEET_NAME : "Action Items";
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error(`Sheet "${sheetName}" was not found.`);

  const row = Number(rowNumber);
  if (!Number.isInteger(row) || row < 2 || row > sheet.getMaxRows()) {
    throw new Error("A valid Playlist rowNumber is required.");
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(value) {
    return String(value || "").trim();
  });

  const changes = [];
  Object.keys(values).forEach(function(header) {
    const column = headers.indexOf(header) + 1;
    if (column < 1) return;

    const cell = sheet.getRange(row, column);
    const oldValue = cell.getValue();
    const newValue = values[header];
    const oldText = oldValue === null || oldValue === undefined ? "" : String(oldValue);
    const newText = newValue === null || newValue === undefined ? "" : String(newValue);
    if (oldText === newText) return;

    cell.setValue(newValue);
    changes.push({ header: header, oldValue: oldText, newValue: newText });

    // Apps Script / Sheets API writes do not fire a user onEdit trigger. Invoke
    // the existing logging/dependency workflow explicitly with an edit-shaped event.
    onEdit({
      range: cell,
      oldValue: oldText,
      value: newText,
      user: { email: requestedBy }
    });
  });

  SpreadsheetApp.flush();
  return { rowNumber: row, changes: changes };
}

function apiInsertPlaylistRow_(values, requestedBy) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = (typeof DATA_SHEET_NAME !== "undefined" && DATA_SHEET_NAME) ? DATA_SHEET_NAME : "Action Items";
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error(`Sheet "${sheetName}" was not found.`);

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(value) {
    return String(value || "").trim();
  });
  const rowNumber = Math.max(2, sheet.getLastRow() + 1);
  const rowValues = headers.map(function(header) {
    return Object.prototype.hasOwnProperty.call(values, header) ? values[header] : "";
  });
  sheet.getRange(rowNumber, 1, 1, rowValues.length).setValues([rowValues]);
  SpreadsheetApp.flush();

  const actionColumn = headers.indexOf((typeof HEADER_ACTION_ITEM !== "undefined" && HEADER_ACTION_ITEM) ? HEADER_ACTION_ITEM : "ACTION ITEM") + 1;
  if (actionColumn > 0 && rowValues[actionColumn - 1] !== "") {
    const actionCell = sheet.getRange(rowNumber, actionColumn);
    onEdit({
      range: actionCell,
      oldValue: "",
      value: String(rowValues[actionColumn - 1]),
      user: { email: requestedBy }
    });
  }

  return { rowNumber: rowNumber };
}

function apiJsonResponse_(payload, status) {
  // Apps Script ContentService does not expose arbitrary HTTP status codes for
  // web-app responses, so include the intended status in the JSON body as well.
  payload.status = status;
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
