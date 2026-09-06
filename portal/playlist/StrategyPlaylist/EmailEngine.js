/**
 * @fileoverview Email Notification & Batching Engine for REVREBEL Strategy Playlist.
 * Handles task queuing, 1-hour delayed batch dispatches, Setup tab directory parsing,
 * DEV/PROD environment mode filtering, and template rendering via 'new-item-added.html'.
 * All sheet interactions are 100% header-driven without hardcoded column indexes.
 */

/**
 * Centralized email dispatcher enforcing DEV mode safeguards.
 * 
 * @param {string} targetEmail - Intended recipient email address.
 * @param {string} subject - Email subject line.
 * @param {string} body - Plain text email body fallback.
 * @param {Object} options - GmailApp options (htmlBody, name, from, etc.).
 * @returns {void}
 */
function sendSafeEmail(targetEmail, subject, body, options) {
  let recipient = targetEmail;
  let finalSubject = subject;

  if (typeof IS_DEV_MODE !== "undefined" && IS_DEV_MODE) {
    const devAddress = (typeof DEV_EMAIL !== "undefined" && DEV_EMAIL) ? DEV_EMAIL : "playlist@revrebel.io";
    recipient = devAddress;
    finalSubject = `[DEV MODE - Target: ${targetEmail}] ${subject}`;
    console.log(`>>> [DEV MODE ACTIVE] Intercepted email intended for "${targetEmail}". Redirecting to "${recipient}"`);
  }

  if (!recipient) {
    console.warn(`>>> [sendSafeEmail] WARNING: No valid recipient address provided. Dispatch skipped.`);
    return;
  }

  try {
    const senderAlias = (typeof SENDER_EMAIL_ALIAS !== "undefined" && SENDER_EMAIL_ALIAS) ? SENDER_EMAIL_ALIAS : "";
    const dispatchOptions = Object.assign({}, options);
    if (senderAlias) {
      dispatchOptions.from = senderAlias;
    }

    GmailApp.sendEmail(recipient, finalSubject, body, dispatchOptions);
    console.log(`>>> [sendSafeEmail] Email successfully dispatched to: "${recipient}" (Subject: "${finalSubject}")`);
  } catch (err) {
    console.error(`>>> [sendSafeEmail] ERROR sending email to "${recipient}": ${err.toString()}`);
  }
}

/**
 * Pushes a newly created task into the Script Properties queue.
 */
function queueTaskForEmail(taskData) {
  console.log(">>> [EmailEngine] Queuing new task for email dispatch...");
  const scriptProps = PropertiesService.getScriptProperties();
  
  const rawQueue = scriptProps.getProperty("EMAIL_TASK_QUEUE");
  const queue = rawQueue ? JSON.parse(rawQueue) : [];
  
  queue.push({
    tacticalItem: taskData.tacticalItem || "Strategy Task",
    actionItem: taskData.actionItem || "New Task",
    dueDate: taskData.dueDate || "N/A",
    teamLead: taskData.teamLead || "Unassigned",
    timestamp: new Date().getTime()
  });

  scriptProps.setProperty("EMAIL_TASK_QUEUE", JSON.stringify(queue));
  console.log(`>>> [EmailEngine] Task queued successfully. Total items in queue: ${queue.length}`);

  scheduleBatchEmailTrigger();
}

/**
 * Creates a single-shot delayed trigger 1 hour in the future.
 */
function scheduleBatchEmailTrigger() {
  const scriptProps = PropertiesService.getScriptProperties();
  const existingTriggerId = scriptProps.getProperty("BATCH_EMAIL_TRIGGER_ID");

  if (existingTriggerId) {
    console.log(">>> [EmailEngine] Batch email trigger is already scheduled.");
    return;
  }

  const trigger = ScriptApp.newTrigger("sendBatchedTaskEmails")
    .timeBased()
    .after(60 * 60 * 1000)
    .create();

  scriptProps.setProperty("BATCH_EMAIL_TRIGGER_ID", trigger.getUniqueId());
  console.log(`>>> [EmailEngine] 1-Hour delayed trigger created with ID: ${trigger.getUniqueId()}`);
}

/**
 * Executes 1 hour after tasks are queued. Validates trigger settings, 
 * checks user opt-out status, builds HTML email payloads, and dispatches emails.
 */
function sendBatchedTaskEmails() {
  console.log("--- [EmailEngine] Processing batched task emails ---");
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const setupSheetName = (typeof SETUP_SHEET_NAME !== "undefined" && SETUP_SHEET_NAME) ? SETUP_SHEET_NAME : "Setup";
  const setupSheet = ss.getSheetByName(setupSheetName);

  const scriptProps = PropertiesService.getScriptProperties();
  scriptProps.deleteProperty("BATCH_EMAIL_TRIGGER_ID");

  if (!setupSheet) {
    console.error(`>>> [EmailEngine] Error: "${setupSheetName}" tab not found.`);
    return;
  }

  const triggerName = (typeof TRIGGER_NAME_NEW_TASK !== "undefined" && TRIGGER_NAME_NEW_TASK) ? TRIGGER_NAME_NEW_TASK : "Send Email When New Task is Assigned";
  if (!isEmailTriggerActive(setupSheet, triggerName)) {
    console.log(`>>> [EmailEngine] Email trigger "${triggerName}" is inactive in Setup tab. Aborting dispatch.`);
    scriptProps.deleteProperty("EMAIL_TASK_QUEUE");
    return;
  }

  const rawQueue = scriptProps.getProperty("EMAIL_TASK_QUEUE");
  if (!rawQueue) {
    console.log(">>> [EmailEngine] Queue is empty. Nothing to send.");
    return;
  }
  const queue = JSON.parse(rawQueue);

  const userDirectory = loadUserDirectory(setupSheet);

  const tasksByUser = {};
  queue.forEach(task => {
    const leadKey = task.teamLead.toLowerCase().trim();
    if (!tasksByUser[leadKey]) {
      tasksByUser[leadKey] = [];
    }
    tasksByUser[leadKey].push(task);
  });

  const playlistName = (typeof NAMED_RANGE_PROJECT_NAME !== "undefined") ? safeGetNamedRangeValue(ss, NAMED_RANGE_PROJECT_NAME, ss.getName()) : ss.getName();
  const dashboardUrl = (typeof NAMED_RANGE_DASHBOARD_URL !== "undefined") ? safeGetNamedRangeValue(ss, NAMED_RANGE_DASHBOARD_URL, FALLBACK_DASHBOARD_URL) : "https://revrebel.io";

  Object.keys(tasksByUser).forEach(userKey => {
    const user = userDirectory[userKey];
    
    if (!user) {
      console.warn(`>>> [EmailEngine] Could not find user details on Setup tab for: "${userKey}". Skipping.`);
      return;
    }

    if (user.optOut === true) {
      console.log(`>>> [EmailEngine] User ${user.fullName} (${user.email}) has OPTED OUT. Email skipped.`);
      return;
    }

    if (!user.email) {
      console.warn(`>>> [EmailEngine] No email address listed for user ${user.fullName}. Skipping.`);
      return;
    }

    const userTasks = tasksByUser[userKey];
    const userOptOutUrl = (typeof getWebAppUrl === "function") ? getWebAppUrl(user.email) : "#";

    const formattedNewItems = userTasks.map(t => ({
      actionItem: t.actionItem,
      dueDate: t.dueDate,
      summary: t.dueDate,
      newValue: t.dueDate,
      assignedTo: t.teamLead,
      tacticalItem: t.tacticalItem
    }));

    const htmlBody = renderTaskEmailHTML(user.firstName, formattedNewItems, playlistName, dashboardUrl, userOptOutUrl);

    sendSafeEmail(user.email, `REVREBEL | New Task Assignment (${userTasks.length})`, "", {
      htmlBody: htmlBody,
      name: "REVREBEL Playlist"
    });
  });

  scriptProps.deleteProperty("EMAIL_TASK_QUEUE");
  console.log("--- [EmailEngine] Batch email dispatch completed ---");
}

/**
 * Scans the Setup sheet dynamically to check if a specific trigger is set to ACTIVE = TRUE.
 * Searches for "EMAIL TRIGGERS" and "ACTIVE" column headers dynamically.
 */
function isEmailTriggerActive(setupSheet, triggerName) {
  if (!setupSheet) return false;

  const data = setupSheet.getDataRange().getValues();
  let colTriggerIdx = -1;
  let colActiveIdx = -1;
  let headerRowIdx = -1;

  for (let r = 0; r < data.length; r++) {
    for (let c = 0; c < data[r].length; c++) {
      const val = String(data[r][c]).toUpperCase().trim();
      if (val === "EMAIL TRIGGERS" || val === "EMAIL TRIGGER") colTriggerIdx = c;
      if (val === "ACTIVE" || val === "IS ACTIVE") colActiveIdx = c;
    }
    if (colTriggerIdx !== -1 && colActiveIdx !== -1) {
      headerRowIdx = r;
      break;
    }
  }

  if (headerRowIdx === -1) {
    console.warn(`>>> [isEmailTriggerActive] Could not locate 'EMAIL TRIGGERS' or 'ACTIVE' headers on Setup tab.`);
    return false;
  }

  const cleanTrigger = String(triggerName).toLowerCase().trim();

  for (let r = headerRowIdx + 1; r < data.length; r++) {
    const rowTrigger = String(data[r][colTriggerIdx]).toLowerCase().trim();
    if (rowTrigger === cleanTrigger) {
      const activeVal = data[r][colActiveIdx];
      return (activeVal === true || String(activeVal).toUpperCase().trim() === "TRUE" || String(activeVal).toUpperCase().trim() === "YES");
    }
  }

  return false;
}

/**
 * Dynamic header-driven parser for User Directory table on the Setup tab.
 */
function loadUserDirectory(setupSheet) {
  const data = setupSheet.getDataRange().getValues();
  const userMap = {};

  let headerRowIdx = -1;
  let colFirst = -1, colLast = -1, colFull = -1, colEmail = -1, colOptOut = -1;

  for (let r = 0; r < data.length; r++) {
    for (let c = 0; c < data[r].length; c++) {
      const val = String(data[r][c]).toUpperCase().trim();
      if (val === "FIRST NAME") colFirst = c;
      if (val === "LAST NAME") colLast = c;
      if (val === "FULL NAME") colFull = c;
      if (val === "EMAIL") colEmail = c;
      if (val === "EMAIL OPT OUT") colOptOut = c;
    }
    if (colEmail !== -1 && (colFirst !== -1 || colFull !== -1)) {
      headerRowIdx = r;
      break;
    }
  }

  if (headerRowIdx === -1) {
    console.error(">>> [EmailEngine] Could not locate User Directory headers on Setup tab.");
    return userMap;
  }

  for (let r = headerRowIdx + 1; r < data.length; r++) {
    const firstName = colFirst !== -1 ? String(data[r][colFirst]).trim() : "";
    const lastName = colLast !== -1 ? String(data[r][colLast]).trim() : "";
    const fullName = colFull !== -1 ? String(data[r][colFull]).trim() : `${firstName} ${lastName}`.trim();
    const email = colEmail !== -1 ? String(data[r][colEmail]).trim() : "";
    const optOut = colOptOut !== -1 ? (data[r][colOptOut] === true || String(data[r][colOptOut]).toUpperCase().trim() === "TRUE") : false;

    if (fullName) {
      userMap[fullName.toLowerCase()] = {
        firstName: firstName || fullName.split(" ")[0],
        lastName: lastName,
        fullName: fullName,
        email: email,
        optOut: optOut
      };
    }
  }

  return userMap;
}

/**
 * Renders task assignment email HTML template using 'new-item-added.html'.
 */
function renderTaskEmailHTML(firstName, newItems, playlistName, dashboardUrl, optOutUrl) {
  const targetDashboard = dashboardUrl || "https://revrebel.io";
  const targetOptOut = optOutUrl || ((typeof getWebAppUrl === "function") ? getWebAppUrl() : "#");

  try {
    const htmlTemplate = HtmlService.createTemplateFromFile('new-item-added');
    
    htmlTemplate.FIRST_NAME = firstName;
    htmlTemplate.PLAYLIST_NAME = playlistName;
    htmlTemplate.DASHBOARD_URL = targetDashboard;
    htmlTemplate.OPT_OUT_URL = targetOptOut;
    htmlTemplate.optOutUrl = targetOptOut;
    htmlTemplate.newItems = newItems;

    htmlTemplate.payload = {
      FIRST_NAME: firstName,
      PLAYLIST_NAME: playlistName,
      DASHBOARD_URL: targetDashboard,
      OPT_OUT_URL: targetOptOut,
      optOutUrl: targetOptOut,
      newItems: newItems
    };

    const compiledHtml = htmlTemplate.evaluate().getContent();
    console.log(">>> [renderTaskEmailHTML] Successfully evaluated 'new-item-added.html' template.");
    return compiledHtml;
  } catch (templateError) {
    console.error(`>>> [renderTaskEmailHTML] Error evaluating 'new-item-added.html': ${templateError.toString()}`);
    throw templateError;
  }
}