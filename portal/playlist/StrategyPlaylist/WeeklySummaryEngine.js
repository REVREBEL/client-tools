/**
 * @fileoverview Weekly Executive Summary Engine for REVREBEL Strategy Playlist.
 * Aggregates weekly activity logs, open action items, approaching due dates,
 * and items needing attention into the 'weekly-playlist-update.html' template.
 * All sheet interactions are 100% header-driven.
 */

/**
 * Executes the weekly summary workflow.
 * Builds the comprehensive payload object consumed by 'weekly-playlist-update.html'.
 * 
 * @returns {void}
 */
function runWeeklySummaryWorkflow() {
  console.log("--- [WeeklySummaryEngine] Starting Weekly Summary Workflow ---");
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const setupSheetName = (typeof SETUP_SHEET_NAME !== "undefined" && SETUP_SHEET_NAME) ? SETUP_SHEET_NAME : "Setup";
  const setupSheet = ss.getSheetByName(setupSheetName);

  if (!setupSheet) {
    console.error(`>>> [WeeklySummaryEngine] Error: "${setupSheetName}" tab not found.`);
    return;
  }

  const triggerWeeklyName = (typeof TRIGGER_WEEKLY_UPDATE !== "undefined" && TRIGGER_WEEKLY_UPDATE) ? TRIGGER_WEEKLY_UPDATE : "Send Weekly Project Updates Updates";
  if (!isEmailTriggerActive(setupSheet, triggerWeeklyName)) {
    console.log(`>>> [WeeklySummaryEngine] Trigger "${triggerWeeklyName}" is INACTIVE in Setup tab. Aborting workflow.`);
    return;
  }

  const playlistName = (typeof NAMED_RANGE_PROJECT_NAME !== "undefined") ? safeGetNamedRangeValue(ss, NAMED_RANGE_PROJECT_NAME, ss.getName()) : ss.getName();
  const dashboardUrl = (typeof NAMED_RANGE_DASHBOARD_URL !== "undefined") ? safeGetNamedRangeValue(ss, NAMED_RANGE_DASHBOARD_URL, FALLBACK_DASHBOARD_URL) : "https://revrebel.io";

  console.log(`>>> [WeeklySummaryEngine] Config Loaded -> Playlist Name: "${playlistName}" | Dashboard URL: "${dashboardUrl}"`);

  const weeklyPayload = buildWeeklySummaryPayload(ss, playlistName, dashboardUrl);

  const userDirectory = loadUserDirectory(setupSheet);
  const recipients = Object.values(userDirectory).filter(user => user.optOut !== true && user.email !== "");

  if (recipients.length === 0) {
    console.log(">>> [WeeklySummaryEngine] No eligible (non-opted-out) recipients found.");
    return;
  }

  const devModeActive = (typeof IS_DEV_MODE !== "undefined") ? IS_DEV_MODE : false;
  console.log(`>>> [WeeklySummaryEngine] Dispatching weekly email to ${recipients.length} user(s)... (IS_DEV_MODE = ${devModeActive})`);

  recipients.forEach(user => {
    const userOptOutUrl = (typeof getWebAppUrl === "function") ? getWebAppUrl(user.email) : "#";
    
    const userPayload = Object.assign({}, weeklyPayload, {
      FIRST_NAME: user.firstName,
      OPT_OUT_URL: userOptOutUrl,
      optOutUrl: userOptOutUrl
    });

    const emailHtml = renderWeeklyEmailHTML(userPayload);
    
    sendSafeEmail(user.email, `REVREBEL | Weekly Project Update & Progress Summary`, "", {
      htmlBody: emailHtml,
      name: "REVREBEL Playlist"
    });
  });

  console.log("--- [WeeklySummaryEngine] Weekly Workflow Complete ---");
}

/**
 * Aggregates past week activity logs and open action items into the full payload 
 * expected by 'weekly-playlist-update.html'. Fully header-driven.
 * 
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss - Active spreadsheet instance.
 * @param {string} playlistName - Workspace title.
 * @param {string} dashboardUrl - Dashboard URL.
 * @returns {Object} Complete payload object for the HTML template.
 */
function buildWeeklySummaryPayload(ss, playlistName, dashboardUrl) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
  const nextSevenDays = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

  const reportStartDateStr = Utilities.formatDate(sevenDaysAgo, Session.getScriptTimeZone(), "MMM d, yyyy");
  const reportEndDateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "MMM d, yyyy");

  const activityLogs = fetchPastWeekActivityLogs(ss);
  
  const newItems = [];
  const statusUpdates = [];

  activityLogs.forEach(entry => {
    const summaryText = entry.summary;
    if (summaryText.toLowerCase().includes("new action item added")) {
      newItems.push({
        actionItem: summaryText.replace(/^New Action Item Added:\s*/i, ''),
        assignedTo: entry.user || "Unassigned",
        summary: entry.summary,
        newValue: entry.summary
      });
    } else if (summaryText.toLowerCase().includes("status change")) {
      statusUpdates.push({
        actionItem: entry.cell || "Action Item",
        oldValue: entry.oldVal || "Previous",
        newValue: entry.newVal || "Updated"
      });
    }
  });

  const hasMovement = (newItems.length > 0 || statusUpdates.length > 0);

  const dataSheetName = (typeof DATA_SHEET_NAME !== "undefined" && DATA_SHEET_NAME) ? DATA_SHEET_NAME : "Action Items";
  const actionSheet = ss.getSheetByName(dataSheetName);

  const dueThisWeek = [];
  const needsAttentionMap = {};
  const overdue = [];

  if (actionSheet && actionSheet.getLastRow() > 1) {
    const headers = actionSheet.getRange(1, 1, 1, actionSheet.getLastColumn()).getValues()[0];
    
    // Dynamic Header Index Resolution
    const colActionIdx = findHeaderIndex(headers, typeof HEADER_ACTION_ITEM !== "undefined" ? HEADER_ACTION_ITEM : "ACTION ITEM");
    const colStatusIdx = findHeaderIndex(headers, typeof HEADER_STATUS !== "undefined" ? HEADER_STATUS : "STATUS");
    const colLeadIdx = findHeaderIndex(headers, typeof HEADER_TEAM_LEAD !== "undefined" ? HEADER_TEAM_LEAD : "TEAM LEAD");
    const colDueDateIdx = findHeaderIndex(headers, typeof HEADER_DUE_DATE !== "undefined" ? HEADER_DUE_DATE : "DUE DATE");

    const rows = actionSheet.getRange(2, 1, actionSheet.getLastRow() - 1, headers.length).getValues();

    rows.forEach(r => {
      const actionItem = colActionIdx !== -1 ? String(r[colActionIdx]).trim() : "";
      const status = colStatusIdx !== -1 ? String(r[colStatusIdx]).toUpperCase().trim() : "";
      const teamLead = colLeadIdx !== -1 ? String(r[colLeadIdx]).trim() : "Unassigned";
      const rawDueDate = colDueDateIdx !== -1 ? r[colDueDateIdx] : null;

      if (!actionItem || status === "COMPLETED" || status === "SKIPPED") return;

      let dueDateObj = null;
      if (rawDueDate instanceof Date) {
        dueDateObj = rawDueDate;
      } else if (rawDueDate && String(rawDueDate).trim() !== "") {
        dueDateObj = new Date(rawDueDate);
      }

      const formattedDueDate = dueDateObj ? Utilities.formatDate(dueDateObj, Session.getScriptTimeZone(), "yyyy-MM-dd") : "";

      if (!dueDateObj || isNaN(dueDateObj.getTime())) {
        if (!needsAttentionMap[teamLead]) {
          needsAttentionMap[teamLead] = 0;
        }
        needsAttentionMap[teamLead]++;
      } else if (dueDateObj < now && formattedDueDate !== Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd")) {
        overdue.push({
          actionItem: actionItem,
          assignedTo: teamLead,
          dueDate: formattedDueDate
        });
      } else if (dueDateObj >= now && dueDateObj <= nextSevenDays) {
        dueThisWeek.push({
          actionItem: actionItem,
          dueDate: formattedDueDate,
          assignedTo: teamLead
        });
      }
    });
  }

  const needsAttention = Object.keys(needsAttentionMap).map(userKey => ({
    user: userKey,
    itemDetail: "Missing Due Dates",
    count: needsAttentionMap[userKey]
  }));

  return {
    PLAYLIST_NAME: playlistName,
    DASHBOARD_URL: dashboardUrl,
    report_start_date: reportStartDateStr,
    report_end_date: reportEndDateStr,
    HAS_MOVEMENT: hasMovement,
    newItems: newItems,
    statusUpdates: statusUpdates,
    HAS_DUE_THIS_WEEK: dueThisWeek.length > 0,
    dueThisWeek: dueThisWeek,
    HAS_NEEDS_ATTENTION: needsAttention.length > 0,
    needsAttention: needsAttention,
    HAS_OVERDUE: overdue.length > 0,
    overdue: overdue
  };
}

/**
 * Dynamic header index search helper.
 */
function findHeaderIndex(headers, targetName) {
  if (!headers || !headers.length) return -1;
  const cleanTarget = String(targetName).toUpperCase().trim();
  for (let c = 0; c < headers.length; c++) {
    if (String(headers[c]).toUpperCase().trim() === cleanTarget) {
      return c;
    }
  }
  return -1;
}

/**
 * Extracts log entries from the Activity Log tab generated within the last 7 days.
 * Dynamic header resolution included.
 */
function fetchPastWeekActivityLogs(ss) {
  const logSheetName = (typeof LOG_SHEET_NAME !== "undefined" && LOG_SHEET_NAME) ? LOG_SHEET_NAME : "Activity Log";
  const logSheet = ss.getSheetByName(logSheetName);
  const logEntries = [];

  if (!logSheet || logSheet.getLastRow() < 2) return logEntries;

  const headers = logSheet.getRange(1, 1, 1, logSheet.getLastColumn()).getValues()[0];
  const colTime = findHeaderIndex(headers, "TIMESTAMP");
  const colUser = findHeaderIndex(headers, "USER");
  const colCell = findHeaderIndex(headers, "CELL / RANGE");
  const colOld = findHeaderIndex(headers, "OLD VALUE");
  const colNew = findHeaderIndex(headers, "NEW VALUE");
  const colSum = findHeaderIndex(headers, "SUMMARY");
  const colSys = findHeaderIndex(headers, "SYSTEM LOG");
  const colFrom = findHeaderIndex(headers, "CHANGE FROM");

  const data = logSheet.getRange(2, 1, logSheet.getLastRow() - 1, headers.length).getValues();
  const now = new Date().getTime();
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

  for (let r = 0; r < data.length; r++) {
    const rawTime = colTime !== -1 ? data[r][colTime] : data[r][0];
    const timestamp = new Date(rawTime).getTime();
    const user = colUser !== -1 ? String(data[r][colUser]).trim() : String(data[r][1]).trim();
    const cell = colCell !== -1 ? String(data[r][colCell]).trim() : String(data[r][2]).trim();
    const oldVal = colOld !== -1 ? String(data[r][colOld]).trim() : String(data[r][3]).trim();
    const newVal = colNew !== -1 ? String(data[r][colNew]).trim() : String(data[r][4]).trim();
    const summary = colSum !== -1 ? String(data[r][colSum]).trim() : String(data[r][5]).trim();
    const sysLog = colSys !== -1 ? String(data[r][colSys]).trim() : String(data[r][6]).trim();
    const changeFrom = colFrom !== -1 ? String(data[r][colFrom]).trim() : String(data[r][7]).trim();

    if (now - timestamp <= sevenDaysInMs && summary && changeFrom.toUpperCase() !== "SYSTEM") {
      logEntries.push({
        timestamp: rawTime,
        user: user,
        cell: cell,
        oldVal: oldVal,
        newVal: newVal,
        summary: summary,
        sysLog: sysLog,
        changeFrom: changeFrom
      });
    }
  }

  return logEntries;
}

/**
 * Loads and evaluates the 'weekly-playlist-update.html' template using the payload object.
 * 
 * @param {Object} payload - Complete payload structure matching 'weekly-playlist-update.html'.
 * @returns {string} Evaluated HTML email string.
 */
function renderWeeklyEmailHTML(payload) {
  try {
    const htmlTemplate = HtmlService.createTemplateFromFile('weekly-playlist-update');
    
    htmlTemplate.payload = payload;

    htmlTemplate.FIRST_NAME = payload.FIRST_NAME;
    htmlTemplate.PLAYLIST_NAME = payload.PLAYLIST_NAME;
    htmlTemplate.DASHBOARD_URL = payload.DASHBOARD_URL;
    htmlTemplate.OPT_OUT_URL = payload.OPT_OUT_URL;
    htmlTemplate.optOutUrl = payload.optOutUrl;

    const compiledHtml = htmlTemplate.evaluate().getContent();
    console.log(">>> [renderWeeklyEmailHTML] Successfully evaluated 'weekly-playlist-update.html' template.");
    return compiledHtml;
  } catch (templateError) {
    console.error(`>>> [renderWeeklyEmailHTML] Error evaluating 'weekly-playlist-update.html': ${templateError.toString()}`);
    throw templateError;
  }
}