/**
 * @fileoverview Central Global Configurations & Constants.
 * Shared across all script files in the project.
 */

// ==========================================
// ENVIRONMENT / MODE CONFIGURATION
// ==========================================

/** 
 * @constant {boolean} IS_DEV_MODE 
 * Mode toggle switch. 
 * Set to TRUE for testing (redirects ALL emails to DEV_EMAIL).
 * Set to FALSE for live production (sends emails to actual recipients).
 */
const IS_DEV_MODE = true;

/** 
 * @constant {string} DEV_EMAIL 
 * The single email address where ALL test emails will be sent when IS_DEV_MODE = true.
 */
const DEV_EMAIL = "theplaylist@revrebel.io";


// ==========================================
// WORKSHEET NAMES
// ==========================================
const DATA_SHEET_NAME = "Action Items";
const LOG_SHEET_NAME = "Activity Log";
const SETUP_SHEET_NAME = "Setup";
const SUMMARY_TAB_NAME = "Weekly Summaries";
const CLEAR_SHEET_NAME = "Action Items";
const TARGET_SHEET_NAME = "Action Items";
const REALIGN_SHEET_NAME = "Action Items";

// ==========================================
// COLUMN HEADERS
// ==========================================
const HEADER_ITEM_SORT = "ITEM SORT";
const HEADER_ACTION_ITEM = "ACTION ITEM";
const HEADER_STATUS = "STATUS";
const HEADER_DEPENDENCY = "ACTION ITEM DEPENDENCY";
const HEADER_TEAM_LEAD = "TEAM LEAD";
const HEADER_DUE_DATE = "DUE DATE";

// ==========================================
// COLUMN LETTERS
// ==========================================
const COL_DEPENDENCY = "O";

// ==========================================
// EMAIL ENGINE CONFIGURATION
// ==========================================
const SENDER_EMAIL_ALIAS = "theplaylist@revrebel.io";
const TRIGGER_NAME_NEW_TASK = "Send Email When New Task is Assigned";
const TRIGGER_WEEKLY_UPDATE = "Send Weekly Project Updates Updates";

/** 
 * @constant {string} WEB_APP_URL 
 * Fallback Web App URL if ScriptApp.getService().getUrl() is executed before deployment.
 */
const WEB_APP_URL = "https://script.google.com/macros/s/YOUR_PUBLISHED_SCRIPT_ID/exec";

/**
 * Retrieves the published Web App URL dynamically at runtime using ScriptApp.
 * Falls back to WEB_APP_URL constant if running in editor test mode.
 * Automatically encodes and appends the target user's email as a query parameter.
 * 
 * @param {string} [email] - Target user email address.
 * @returns {string} Dynamic, fully-formatted opt-out Web App URL.
 */
function getWebAppUrl(email) {
  let baseUrl = "";
  try {
    baseUrl = ScriptApp.getService().getUrl();
  } catch (err) {
    console.warn(">>> [getWebAppUrl] ScriptApp.getService().getUrl() unavailable:", err);
  }

  if (!baseUrl || baseUrl.trim() === "") {
    baseUrl = (typeof WEB_APP_URL !== "undefined" && WEB_APP_URL) ? WEB_APP_URL : "";
  }

  if (!baseUrl) return "#";

  const encodedEmail = email ? encodeURIComponent(String(email).trim()) : "";
  return email ? `${baseUrl}?email=${encodedEmail}&action=optout` : baseUrl;
}

// ==========================================
// NAMED RANGES & FALLBACKS
// ==========================================
const NAMED_RANGE_PROJECT_NAME = "project_name";
const NAMED_RANGE_DASHBOARD_URL = "dashboard_url";
const FALLBACK_DASHBOARD_URL = "https://revrebel.io";

// ==========================================
// CLEAR & SYNC FORMULA CONFIGURATION
// ==========================================
const CLEAR_RANGE = "AN2:BG";
const TARGET_CELL = "AN1";
const FORMULA_TO_INSERT = '=ARRAYFORMULA(IF(Setup!A:Q="", "", Setup!A:Q))';

// ==========================================
// NUMBERING / ALIGNMENT CONFIGURATION
// ==========================================
const COLUMN_PAIRS = [
  { codeHeader: "ITEM SORT", nameHeader: "TACTICAL ITEM" },
  { codeHeader: "ITEM NO", nameHeader: "ACTION ITEM" }
];
const PADDING_WIDTH = 3;