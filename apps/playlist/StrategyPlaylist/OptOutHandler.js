/**
 * @fileoverview Web App GET request handler for email opt-outs.
 * Handles unsubscribe and resubscribe requests, dynamically locates Column I (EMAIL) 
 * and Column J (EMAIL OPT OUT) on the Setup tab by header name, updates checkbox values,
 * and serves OptOutLandingPage.html.
 */

/**
 * Serves the HTML landing page and processes opt-out / resubscribe parameter actions.
 * 
 * @param {Object} e - The HTTP GET event object.
 * @returns {GoogleAppsScript.HTML.HtmlOutput} Evaluated HTML landing page.
 */
function doGet(e) {
  console.log(">>> [OptOutHandler] doGet requested with parameters:", JSON.stringify(e ? e.parameter : {}));

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const setupSheetName = (typeof SETUP_SHEET_NAME !== "undefined" && SETUP_SHEET_NAME) ? SETUP_SHEET_NAME : "Setup";
  const setupSheet = ss.getSheetByName(setupSheetName);

  const emailParam = (e && e.parameter && e.parameter.email) ? String(e.parameter.email).trim() : "";
  const actionParam = (e && e.parameter && e.parameter.action) ? String(e.parameter.action).trim().toLowerCase() : "";

  const isResubscribe = (actionParam === "resubscribe");
  let isOptedOut = false;
  let userStatusMessage = "";

  if (emailParam && setupSheet) {
    if (isResubscribe) {
      setUserOptOutStatus(setupSheet, emailParam, false);
      isOptedOut = false;
      userStatusMessage = "You have successfully resubscribed to updates.";
    } else {
      isOptedOut = setUserOptOutStatus(setupSheet, emailParam, true);
      userStatusMessage = "You have been opted out of automated email updates.";
    }
  } else {
    userStatusMessage = "Your preferences have been updated.";
  }

  const targetDashboardRange = (typeof NAMED_RANGE_DASHBOARD_URL !== "undefined") ? NAMED_RANGE_DASHBOARD_URL : "dashboard_url";
  const dashboardUrl = safeGetNamedRangeValue(ss, targetDashboardRange, "https://revrebel.io");

  try {
    const template = HtmlService.createTemplateFromFile("OptOutLandingPage");
    
    // Direct top-level template variable bindings
    template.USER_EMAIL = emailParam;
    template.userEmail = emailParam;
    template.email = emailParam;

    template.IS_OPTED_OUT = isOptedOut;
    template.isOptedOut = isOptedOut;

    template.RESUBSCRIBED = isResubscribe;
    template.resubscribed = isResubscribe;
    template.isResubscribed = isResubscribe;
    template.IS_RESUBSCRIBED = isResubscribe;

    template.STATUS_MESSAGE = userStatusMessage;
    template.statusMessage = userStatusMessage;

    template.DASHBOARD_URL = dashboardUrl;
    template.dashboardUrl = dashboardUrl;

    // Scoped payload object
    template.payload = {
      DASHBOARD_URL: dashboardUrl,
      dashboardUrl: dashboardUrl,
      USER_EMAIL: emailParam,
      userEmail: emailParam,
      email: emailParam,
      IS_OPTED_OUT: isOptedOut,
      isOptedOut: isOptedOut,
      RESUBSCRIBED: isResubscribe,
      resubscribed: isResubscribe,
      isResubscribed: isResubscribe,
      IS_RESUBSCRIBED: isResubscribe,
      STATUS_MESSAGE: userStatusMessage
    };

    return template
      .evaluate()
      .setTitle("THE PLAYLIST | Email Preferences")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag("viewport", "width=device-width, initial-scale=1.0");
  } catch (err) {
    console.error(">>> [OptOutHandler] Error rendering OptOutLandingPage.html:", err.toString());
    return HtmlService.createHtmlOutput(`<h2>Error loading page</h2><p>${err.toString()}</p>`);
  }
}

/**
 * Searches for target email under the header "EMAIL" and updates checkbox under header "EMAIL OPT OUT".
 * Fully header-driven without hardcoded column indexes.
 * 
 * @param {GoogleAppsScript.Spreadsheet.Sheet} setupSheet - Setup worksheet object.
 * @param {string} targetEmail - Target email address.
 * @param {boolean} optOutValue - True to check box (opt-out), false to uncheck.
 * @returns {boolean} Success status.
 */
function setUserOptOutStatus(setupSheet, targetEmail, optOutValue) {
  if (!setupSheet || !targetEmail) return false;

  const data = setupSheet.getDataRange().getValues();
  let colEmailIdx = -1;
  let colOptOutIdx = -1;
  let headerRowIdx = -1;

  // Locate EMAIL and EMAIL OPT OUT headers dynamically across all rows
  for (let r = 0; r < data.length; r++) {
    for (let c = 0; c < data[r].length; c++) {
      const val = String(data[r][c]).toUpperCase().trim();
      if (val === "EMAIL") colEmailIdx = c;
      if (val === "EMAIL OPT OUT") colOptOutIdx = c;
    }
    if (colEmailIdx !== -1 && colOptOutIdx !== -1) {
      headerRowIdx = r;
      break;
    }
  }

  if (colEmailIdx === -1 || colOptOutIdx === -1) {
    console.error(">>> [OptOutHandler] ERROR: Could not locate 'EMAIL' or 'EMAIL OPT OUT' headers on Setup tab.");
    return false;
  }

  const cleanTarget = targetEmail.toLowerCase().trim();

  for (let r = headerRowIdx + 1; r < data.length; r++) {
    const rowEmail = String(data[r][colEmailIdx]).toLowerCase().trim();
    if (rowEmail === cleanTarget) {
      const targetCell = setupSheet.getRange(r + 1, colOptOutIdx + 1);
      targetCell.setValue(optOutValue);
      SpreadsheetApp.flush();
      console.log(`>>> [OptOutHandler] Updated Opt-Out for ${targetEmail} on row ${r + 1} to ${optOutValue}`);
      return true;
    }
  }

  console.warn(`>>> [OptOutHandler] Could not find email "${targetEmail}" in Setup tab.`);
  return false;
}

/**
 * Safely fetches named range value without throwing ReferenceErrors.
 */
function safeGetNamedRangeValue(ss, rangeName, fallback) {
  try {
    if (typeof getNamedRangeValue === "function") {
      return getNamedRangeValue(ss, rangeName, fallback);
    }
    const range = ss.getRangeByName(rangeName);
    if (range) {
      const val = String(range.getValue()).trim();
      if (val !== "") return val;
    }
  } catch (e) {
    console.warn(`>>> [OptOutHandler] Warning getting named range "${rangeName}":`, e.toString());
  }
  return fallback;
}