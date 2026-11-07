import * as Survey from "survey-core";
import "survey-core/defaultV2.css";
import "./styles.css";

const normalizeConfiguredApiBase = (url) => {
  const normalizedPath = url.pathname.replace(/\/$/, "");
  if (!normalizedPath || normalizedPath === "/") {
    url.pathname = "/api";
  }
  return url.toString().replace(/\/$/, "");
};

const resolveApiBase = () => {
  if (window.__API_BASE__) {
    return window.__API_BASE__.replace(/\/$/, "");
  }

  const origin = window.location?.origin;
  const pageHost = window.location?.hostname;
  const configuredApiBase = import.meta.env.VITE_API_BASE;

  if (configuredApiBase) {
    const trimmedApiBase = configuredApiBase.replace(/\/$/, "");
    try {
      const configuredUrl = new URL(trimmedApiBase, origin || undefined);
      const configuredHost = configuredUrl.hostname;
      const isLocalApiHost = ["localhost", "127.0.0.1", "::1"].includes(configuredHost);
      const isLocalPageHost = ["localhost", "127.0.0.1", "::1"].includes(pageHost);

      if (!isLocalApiHost || isLocalPageHost) {
        return normalizeConfiguredApiBase(configuredUrl);
      }
    } catch {
      return trimmedApiBase;
    }
  }

  if (origin && origin !== "null") {
    return `${origin.replace(/\/$/, "")}/api`;
  }

  return "http://127.0.0.1:4010/api";
};

const apiBase = resolveApiBase();

const pageBreakType = "pagebreak";

class PageBreak extends Survey.Question {
  getType() {
    return pageBreakType;
  }
}

const ensureRuntimeSchema = () => {
  ["page", "panel", "question"].forEach((className) => {
    if (!Survey.Serializer.findProperty?.(className, "scope")) {
      Survey.Serializer.addProperty(className, {
        name: "scope",
        default: "default",
        category: "general",
        visible: false
      });
    }
  });

  if (!Survey.Serializer.findClass?.(pageBreakType)) {
    Survey.Serializer.addClass(pageBreakType, [], () => new PageBreak(""), "question");
  }
};
const query = new URLSearchParams(window.location.search);
const queryToken = (query.get("token") || "").trim();
const isEmbedded = query.get("embed") === "1";
const warningDebugEnabled = query.get("debugWarnings") === "1"
  || window.localStorage?.getItem("surveyjs:debugWarnings") === "1";

const refreshBtn = document.getElementById("refreshStats");
const hotelNameEl = document.getElementById("statsHotelName");
const hotelNameValueEl = document.getElementById("statsHotelNameValue");
const overallPercentEl = document.getElementById("statsOverallPercent");
const statsMetaEl = document.getElementById("statsMeta");
const statsStatusEl = document.getElementById("statsStatus");
const summaryCardsEl = document.getElementById("statsSummaryCards");
const groupsEl = document.getElementById("statsGroupSections");

let activeToken = queryToken;
ensureRuntimeSchema();

document.body.classList.toggle("stats-embed-mode", isEmbedded);

const DISPLAY_PROGRESS_SUFFIX = "_display_progress";
const STATUS_DYNAMIC_SUFFIX = "_dynamic_status";
const MAX_WARNING_LOG_REPEATS = 1;

const clampPercent = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
};

const formatDateTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
};

const normalizeKey = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const humanizeKey = (value) =>
  String(value || "")
    .replace(/^panel\./i, "")
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase()) || "Item";

const hasAnswer = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
};

const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (["true", "1", "yes", "y", "complete", "completed"].includes(v)) return true;
    if (["false", "0", "no", "n", "not started", "not stated", ""].includes(v)) return false;
  }
  return !!value;
};

const normalizeStatus = (value) => {
  if (value == null) return "Not Started";
  const v = String(value).trim().toLowerCase();
  if (!v || ["not started", "not stated", "not-started", "false", "0", "no"].includes(v)) return "Not Started";
  if (["in-progress", "in progress", "inprogress"].includes(v)) return "In-Progress";
  if (["complete", "completed", "true", "1", "yes"].includes(v)) return "Complete";
  if (v.includes("progress")) return "In-Progress";
  if (v.includes("complete")) return "Complete";
  if (v.includes("not")) return "Not Started";
  return "Not Started";
};

const getQuestionValue = (model, questionName, options = {}) => {
  const preferCalculated = options.preferCalculated === true;
  if (!preferCalculated) {
    const storedValue = model.getValue(questionName);
    if (storedValue !== undefined) return storedValue;
  }
  const q = model.getQuestionByName(questionName);
  if (q && q.value !== undefined) return q.value;
  return model.getValue(questionName);
};

const setKnownVariables = (model, clientData) => {
  if (!clientData || typeof clientData !== "object") return;

  const aliasMap = {
    hotel_name: ["hotel_name", "hotelName", "hotel"],
    location: ["location", "hotel_location", "hotelLocation", "city"],
    pms_system: ["pms_system", "pmsSystem", "pms"],
    crs_system: ["crs_system", "crsSystem", "crs"],
    rate_shopping_tool: ["rate_shopping_tool", "rateShoppingTool", "rate_shopping", "rateShopping"],
    rms_system: ["rms_system", "rmsSystem", "rms"],
    google_drive_folder_id: ["google_drive_folder_id", "googleDriveFolderId", "drive_folder_id", "driveFolderId"],
    google_drive_folder_url: ["google_drive_folder_url", "googleDriveFolderUrl", "drive_folder_url", "driveFolderUrl"]
  };

  Object.entries(clientData).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    const aliases = aliasMap[key] || [key];
    aliases.forEach((alias) => {
      model.setVariable(alias, value);
      const question = model.getQuestionByName(alias);
      if (question && !hasAnswer(question.value)) {
        model.setValue(alias, value);
      }
    });
  });
};

const findStatusQuestionForPrefix = (model, prefix) => {
  const candidates = [
    `${prefix}${STATUS_DYNAMIC_SUFFIX}`,
    `${prefix}_status`,
    `${prefix}_access_status`,
    `${prefix}_item_status`,
    `${prefix}_matrix_status`,
    `${prefix}_granted_status`
  ];
  for (const name of candidates) {
    const q = model.getQuestionByName(name);
    if (q) return q;
  }

  const prefixNorm = normalizeKey(prefix);
  const allQuestions = model.getAllQuestions?.() || [];
  let best = null;
  let bestScore = 0;
  for (const q of allQuestions) {
    const qName = String(q?.name || "");
    const qNameNorm = normalizeKey(qName);
    if (!qNameNorm.includes("status")) continue;
    let score = 0;
    if (qNameNorm.startsWith(prefixNorm)) score += 4;
    if (qNameNorm.includes(prefixNorm)) score += 2;
    if (score > bestScore) {
      best = q;
      bestScore = score;
    }
  }
  return best;
};

const stripStatusLabel = (title) => {
  const cleaned = String(title || "")
    .replace(/\b(item|access)?\s*status\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned;
};

const isMeaningfulPanelTitle = (title) => {
  const normalized = String(title || "").trim();
  if (!normalized) return false;
  if (/status$/i.test(normalized)) return false;
  if (/display progress/i.test(normalized)) return false;
  return true;
};

const findGroupNameForQuestion = (question) => {
  let node = question;
  while (node?.parent) {
    const parent = node.parent;
    if (parent?.isPanel) {
      const panelName = String(parent.name || "");
      const panelTitle = String(parent.title || "").trim();
      if (panelName.endsWith("_group")) {
        return panelTitle || humanizeKey(panelName.replace(/_group$/i, ""));
      }
    }
    node = parent;
  }
  const pageTitle = String(question?.page?.title || question?.page?.name || "").trim();
  return pageTitle || "General";
};

const findPanelTitleFromAncestors = (question, options = {}) => {
  const includeGroupPanels = options.includeGroupPanels === true;
  let node = question;
  while (node?.parent) {
    const parent = node.parent;
    if (parent?.isPanel) {
      const panelName = String(parent.name || "");
      if (!includeGroupPanels && /_group$/i.test(panelName)) {
        node = parent;
        continue;
      }
      const title = String(parent.title || "").trim();
      if (isMeaningfulPanelTitle(title)) {
        return title;
      }
    }
    node = parent;
  }
  return "";
};

const findSubgroupNameForQuestion = (question) =>
  findPanelTitleFromAncestors(question, { includeGroupPanels: false });

const findItemLabel = (model, prefix, displayQuestion, statusQuestion) => {
  const fromStatusTitle = stripStatusLabel(statusQuestion?.title);
  if (fromStatusTitle) return fromStatusTitle;

  const labelCandidates = [
    `${prefix}_input`,
    `${prefix}_question`,
    `${prefix}_name`,
    prefix
  ];
  for (const name of labelCandidates) {
    const q = model.getQuestionByName(name);
    const title = String(q?.title || "").trim();
    if (title && !/display progress/i.test(title)) return title;
  }

  const displayTitle = String(displayQuestion?.title || "").trim();
  if (displayTitle && !/display progress/i.test(displayTitle)) return displayTitle;

  const fromPanelTitle = findPanelTitleFromAncestors(statusQuestion || displayQuestion);
  if (fromPanelTitle) return fromPanelTitle;

  if (typeof model.getPanelByName === "function") {
    const panel = model.getPanelByName(prefix);
    const panelTitle = String(panel?.title || "").trim();
    if (panelTitle && !/status/i.test(panelTitle)) return panelTitle;
  }

  return humanizeKey(prefix);
};

const collectTemplateQuestions = (elements, output = []) => {
  if (!Array.isArray(elements)) return output;
  for (const element of elements) {
    if (!element || typeof element !== "object") continue;
    const elementType = String(element.getType?.() || element.type || "").toLowerCase();
    const elementName = String(element.name || "").trim();
    const isContainer = elementType === "panel" || elementType === "page" || elementType === "flowpanel";
    if (elementName && !isContainer) {
      output.push(element);
    }
    if (Array.isArray(element.elements)) {
      collectTemplateQuestions(element.elements, output);
    }
    if (Array.isArray(element.templateElements)) {
      collectTemplateQuestions(element.templateElements, output);
    }
    if (Array.isArray(element.rows)) {
      for (const row of element.rows) {
        collectTemplateQuestions(row?.elements, output);
      }
    }
  }
  return output;
};

const resolvePanelTemplateString = (template, row) => {
  if (!template) return "";
  const raw = String(template || "");
  const resolved = raw.replace(/\{panel\.([^}]+)\}/gi, (_match, key) => {
    const value = row && typeof row === "object" ? row[key] : "";
    return String(value || "").trim();
  });
  return resolved.replace(/\s+/g, " ").trim();
};

const findPanelDynamicRowLabel = (prefix, row, panelDynamicQuestion, rowIndex) => {
  const candidateNames = [
    `${prefix}_name`,
    `${prefix}_title`,
    `${prefix}_label`,
    "channel_partner_name",
    "channel_partner",
    "partner_name",
    "name"
  ];
  for (const candidate of candidateNames) {
    const value = String(row?.[candidate] || "").trim();
    if (value) return value;
  }

  const templateTitle = resolvePanelTemplateString(panelDynamicQuestion?.templateTitle, row)
    .replace(/\s+access request$/i, "")
    .trim();
  if (templateTitle) return templateTitle;

  return `${humanizeKey(prefix)} ${rowIndex + 1}`;
};

const extractPanelDynamicTrackedItems = (model) => {
  const questions = model.getAllQuestions?.() || [];
  const panelDynamicQuestions = questions.filter(
    (question) => String(question?.getType?.() || "").toLowerCase() === "paneldynamic"
  );
  const items = [];

  for (const panelDynamicQuestion of panelDynamicQuestions) {
    const valueName = String(panelDynamicQuestion?.valueName || panelDynamicQuestion?.name || "").trim();
    if (!valueName) continue;
    const rows = model.getValue(valueName);
    if (!Array.isArray(rows) || !rows.length) continue;

    const templateQuestions = collectTemplateQuestions(panelDynamicQuestion?.templateElements || []);
    if (!templateQuestions.length) continue;

    const displayQuestions = templateQuestions.filter((question) =>
      String(question?.name || "").endsWith(DISPLAY_PROGRESS_SUFFIX)
    );
    if (!displayQuestions.length) continue;

    const groupName = String(panelDynamicQuestion?.title || findGroupNameForQuestion(panelDynamicQuestion) || "")
      .trim() || "General";

    rows.forEach((row, rowIndex) => {
      if (!row || typeof row !== "object") return;
      displayQuestions.forEach((displayQuestion) => {
        const displayName = String(displayQuestion?.name || "");
        if (!displayName) return;
        const prefix = displayName.slice(0, -DISPLAY_PROGRESS_SUFFIX.length);
        const rowDisplayValue = row[displayName];
        const defaultDisplayValue = displayQuestion?.defaultValue ?? displayQuestion?.defaultValueExpression;
        const shouldDisplay = parseBoolean(
          rowDisplayValue === undefined ? (defaultDisplayValue === undefined ? true : defaultDisplayValue) : rowDisplayValue
        );
        if (!shouldDisplay) return;

        const statusCandidates = [
          `${prefix}${STATUS_DYNAMIC_SUFFIX}`,
          `${prefix}_status`,
          `${prefix}_access_status`,
          `${prefix}_item_status`,
          `${prefix}_matrix_status`,
          `${prefix}_granted_status`,
          "access_status"
        ];
        let rawStatus;
        for (const statusName of statusCandidates) {
          const value = row?.[statusName];
          if (value === undefined || value === null) continue;
          if (typeof value === "string" && !value.trim()) continue;
          rawStatus = value;
          break;
        }
        if (rawStatus === undefined) {
          const templateStatusQuestion = templateQuestions.find((question) =>
            statusCandidates.includes(String(question?.name || ""))
          );
          rawStatus = templateStatusQuestion?.defaultValue ?? templateStatusQuestion?.defaultValueExpression;
        }

        items.push({
          prefix: `${prefix}__row_${rowIndex + 1}`,
          groupName,
          subgroupName: "",
          itemLabel: findPanelDynamicRowLabel(prefix, row, panelDynamicQuestion, rowIndex),
          status: normalizeStatus(rawStatus)
        });
      });
    });
  }

  return items;
};

const dedupeTrackedItems = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.prefix}::${item.groupName}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const buildTrackedItems = (model) => {
  const questions = model.getAllQuestions?.() || [];
  const displayQuestions = questions.filter((q) => String(q?.name || "").endsWith(DISPLAY_PROGRESS_SUFFIX));
  const panelDynamicItems = extractPanelDynamicTrackedItems(model);
  const displayPrefixState = new Map();

  const items = [];
  if (displayQuestions.length) {
    for (const displayQuestion of displayQuestions) {
      const displayName = String(displayQuestion.name || "");
      const prefix = displayName.slice(0, -DISPLAY_PROGRESS_SUFFIX.length);
      const storedDisplayValue = model.getValue(displayName);
      const calculatedDisplayValue = getQuestionValue(model, displayName, { preferCalculated: true });
      const defaultDisplayValue = displayQuestion?.defaultValue ?? displayQuestion?.defaultValueExpression;
      const resolvedDisplayValue = storedDisplayValue === undefined || storedDisplayValue === null
        ? (calculatedDisplayValue === undefined || calculatedDisplayValue === null ? defaultDisplayValue : calculatedDisplayValue)
        : storedDisplayValue;
      const shouldDisplay = parseBoolean(resolvedDisplayValue);
      displayPrefixState.set(prefix, shouldDisplay);
      if (!shouldDisplay) continue;

      const statusQuestion = findStatusQuestionForPrefix(model, prefix);
      const rawStatus = statusQuestion
        ? getQuestionValue(model, statusQuestion.name)
        : getQuestionValue(model, `${prefix}${STATUS_DYNAMIC_SUFFIX}`);
      const normalizedStatus = normalizeStatus(rawStatus);
      const groupName = findGroupNameForQuestion(displayQuestion);
      const itemLabel = findItemLabel(model, prefix, displayQuestion, statusQuestion);

      items.push({
        prefix,
        groupName,
        subgroupName: findSubgroupNameForQuestion(statusQuestion || displayQuestion),
        itemLabel,
        status: normalizedStatus
      });
    }
  }

  const fallbackStatusQuestions = questions.filter((q) => {
    const name = String(q?.name || "");
    return (
      name.endsWith(STATUS_DYNAMIC_SUFFIX) ||
      /_status$/i.test(name) ||
      /_access_status$/i.test(name)
    );
  });

  for (const statusQuestion of fallbackStatusQuestions) {
    const name = String(statusQuestion.name || "");
    const prefix = name
      .replace(new RegExp(`${STATUS_DYNAMIC_SUFFIX}$`, "i"), "")
      .replace(/_access_status$/i, "")
      .replace(/_status$/i, "");
    if (!prefix) continue;
    if (displayPrefixState.has(prefix) && displayPrefixState.get(prefix) === false) continue;

    const rawStatus = getQuestionValue(model, name);
    items.push({
      prefix,
      groupName: findGroupNameForQuestion(statusQuestion),
      subgroupName: findSubgroupNameForQuestion(statusQuestion),
      itemLabel: findItemLabel(model, prefix, statusQuestion, statusQuestion),
      status: normalizeStatus(rawStatus)
    });
  }

  return dedupeTrackedItems([...items, ...panelDynamicItems]);
};

const aggregateProgress = (items) => {
  const summary = {
    "Not Started": 0,
    "In-Progress": 0,
    Complete: 0,
    Total: 0
  };

  const groupMap = new Map();
  for (const item of items) {
    const status = item.status;
    if (!summary[status] && summary[status] !== 0) continue;
    summary[status] += 1;
    summary.Total += 1;

    if (!groupMap.has(item.groupName)) {
      groupMap.set(item.groupName, {
        name: item.groupName,
        items: [],
        counts: { "Not Started": 0, "In-Progress": 0, Complete: 0, Total: 0 }
      });
    }
    const group = groupMap.get(item.groupName);
    group.items.push(item);
    group.counts[status] += 1;
    group.counts.Total += 1;
  }

  const groups = [...groupMap.values()].map((group) => ({
    ...group,
    percent: group.counts.Total
      ? clampPercent(Number(((group.counts.Complete / group.counts.Total) * 100).toFixed(0)))
      : 0
  }));

  const overallPercent = summary.Total
    ? clampPercent(Number(((summary.Complete / summary.Total) * 100).toFixed(0)))
    : 0;

  return { summary, groups, overallPercent };
};

const renderSummaryCards = (summary) => {
  if (!summaryCardsEl) return;
  summaryCardsEl.innerHTML = "";

  const cards = [
    { label: "Not Started", value: summary["Not Started"], className: "is-not-started" },
    { label: "In-Progress", value: summary["In-Progress"], className: "is-in-progress" },
    { label: "Complete", value: summary.Complete, className: "is-complete" },
    { label: "Total", value: summary.Total, className: "is-total" }
  ];

  cards.forEach((card) => {
    const item = document.createElement("article");
    item.className = `stats-count-card ${card.className}`;
    item.innerHTML = `
      <p class="stats-count-label">${card.label}</p>
      <p class="stats-count-value">${card.value}</p>
    `;
    summaryCardsEl.appendChild(item);
  });
};

const renderGroups = (groups) => {
  if (!groupsEl) return;
  groupsEl.innerHTML = "";

  if (!groups.length) {
    groupsEl.innerHTML = `<section class="stats-group-card"><p class="stats-meta">No displayable progress items found.</p></section>`;
    return;
  }

  groups.forEach((group) => {
    const section = document.createElement("section");
    section.className = "stats-group-card";

    const renderRows = (items, options = {}) =>
      items.map((item) => {
        const statusClass =
          item.status === "Complete"
            ? "is-complete"
            : item.status === "In-Progress"
              ? "is-in-progress"
              : "is-not-started";
        const rowClass = options.indented ? "stats-item-row is-sub-item" : "stats-item-row";
        return `
          <div class="${rowClass}">
            <span class="stats-item-name">${item.itemLabel}</span>
            <span class="stats-item-status ${statusClass}">${item.status}</span>
          </div>
        `;
      }).join("");

    const subgroupBuckets = new Map();
    group.items.forEach((item) => {
      const subgroupName = String(item.subgroupName || "").trim();
      if (!subgroupName || subgroupName === group.name) return;
      if (!subgroupBuckets.has(subgroupName)) subgroupBuckets.set(subgroupName, []);
      subgroupBuckets.get(subgroupName).push(item);
    });

    const multiItemSubgroups = new Set(
      [...subgroupBuckets.entries()]
        .filter(([, items]) => items.length >= 2)
        .map(([subgroupName]) => subgroupName)
    );

    const renderedSubgroups = new Set();
    const blocks = [];
    for (const item of group.items) {
      const subgroupName = String(item.subgroupName || "").trim();
      if (subgroupName && multiItemSubgroups.has(subgroupName)) {
        if (renderedSubgroups.has(subgroupName)) continue;
        renderedSubgroups.add(subgroupName);
        blocks.push(`
          <section class="stats-subgroup">
            <h4 class="stats-subgroup-title">${subgroupName}</h4>
            <div class="stats-items-list is-subgrouped">
              ${renderRows(subgroupBuckets.get(subgroupName), { indented: true })}
            </div>
          </section>
        `);
        continue;
      }
      blocks.push(renderRows([item]));
    }

    const rowsHtml = blocks.join("");

    section.innerHTML = `
      <div class="stats-group-header">
        <h3>${group.name}</h3>
        <div class="stats-group-meter" aria-label="${group.name} completion ${group.percent}%">
          <span style="height:${group.percent}%"></span>
        </div>
        <p class="stats-group-percent">${group.percent}%</p>
      </div>
      <div class="stats-items-list">${rowsHtml}</div>
    `;
    groupsEl.appendChild(section);
  });
};

const setOverview = ({ hotelName, overallPercent, lastSaved, itemCount }) => {
  if (hotelNameValueEl) {
    hotelNameValueEl.textContent = hotelName || "Unknown Hotel";
  } else if (hotelNameEl) {
    hotelNameEl.textContent = hotelName || "Unknown Hotel";
  }
  if (overallPercentEl) overallPercentEl.textContent = `${overallPercent}%`;
  if (statsMetaEl) {
    const parts = [];
    const saved = formatDateTime(lastSaved);
    if (saved) parts.push(`Last saved: ${saved}`);
    parts.push(`${itemCount} tracked item${itemCount === 1 ? "" : "s"}`);
    statsMetaEl.textContent = parts.join(" | ");
  }
};

const setStatusText = (text) => {
  if (statsStatusEl) statsStatusEl.textContent = text || "";
};

const serializeWarnArg = (arg) => {
  if (typeof arg === "string") return arg;
  if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
};

const warningInspector = {
  enabled: warningDebugEnabled,
  installed: false,
  originalWarn: null,
  entries: new Map()
};

const listWarningEntries = () =>
  [...warningInspector.entries.entries()].map(([message, entry]) => ({
    count: entry.count,
    message,
    firstSeenAt: entry.firstSeenAt,
    sampleStack: entry.sampleStack
  }));

const installWarningInspector = () => {
  if (!warningInspector.enabled || warningInspector.installed) return;
  warningInspector.installed = true;
  warningInspector.originalWarn = console.warn.bind(console);

  console.warn = (...args) => {
    const message = args.map(serializeWarnArg).join(" | ") || "(empty warning)";
    const stack = (new Error().stack || "")
      .split("\n")
      .slice(2, 8)
      .join("\n");
    const existing = warningInspector.entries.get(message) || {
      count: 0,
      firstSeenAt: new Date().toISOString(),
      sampleStack: stack
    };
    existing.count += 1;
    if (!existing.sampleStack && stack) existing.sampleStack = stack;
    warningInspector.entries.set(message, existing);

    if (existing.count <= 3) {
      warningInspector.originalWarn(...args);
      if (existing.count === 1 && existing.sampleStack) {
        warningInspector.originalWarn(`[Stats warning stack]\n${existing.sampleStack}`);
      }
    }
  };

  window.getStatsWarnings = () => listWarningEntries();
  window.dumpStatsWarnings = () => {
    const rows = listWarningEntries().sort((a, b) => b.count - a.count);
    console.table(rows.map((row) => ({
      count: row.count,
      message: row.message.length > 220 ? `${row.message.slice(0, 220)}...` : row.message
    })));
    rows.forEach((row, index) => {
      console.log(`#${index + 1} (x${row.count}) ${row.message}`);
      if (row.sampleStack) {
        console.log(row.sampleStack);
      }
    });
    return rows;
  };

  warningInspector.originalWarn(
    "[Stats] Warning inspector enabled. Run dumpStatsWarnings() in DevTools for grouped warnings."
  );
};

installWarningInspector();

const runWithWarningDedup = (fn) => {
  const originalWarn = console.warn.bind(console);
  const warningCounts = new Map();
  console.warn = (...args) => {
    const key = args.map(serializeWarnArg).join(" | ") || "(empty warning)";
    const nextCount = (warningCounts.get(key) || 0) + 1;
    warningCounts.set(key, nextCount);
    if (nextCount <= MAX_WARNING_LOG_REPEATS) {
      originalWarn(...args);
    }
  };

  try {
    return { result: fn(), warningCounts };
  } finally {
    console.warn = originalWarn;
  }
};

const loadStatsByToken = async (token) => {
  const trimmed = String(token || "").trim();
  if (!trimmed) {
    setStatusText("Missing token.");
    if (summaryCardsEl) summaryCardsEl.innerHTML = "";
    if (groupsEl) groupsEl.innerHTML = "";
    setOverview({ hotelName: "", overallPercent: 0, lastSaved: "", itemCount: 0 });
    return;
  }

  try {
    if (refreshBtn) refreshBtn.disabled = true;
    setStatusText("Loading...");

    const onboardingRes = await fetch(`${apiBase}/onboarding/${encodeURIComponent(trimmed)}`);
    if (!onboardingRes.ok) throw new Error(await onboardingRes.text());
    const onboarding = await onboardingRes.json();

    const buildItems = () => {
      const model = new Survey.Model(onboarding?.survey_json || { pages: [] });
      model.clearInvisibleValues = "none";
      const sourceData = onboarding?.final_data && typeof onboarding.final_data === "object"
        ? onboarding.final_data
        : onboarding?.draft_data && typeof onboarding.draft_data === "object"
          ? onboarding.draft_data
          : {};
      model.data = sourceData;
      setKnownVariables(model, onboarding?.client || {});
      return buildTrackedItems(model);
    };

    const { result: items, warningCounts } = warningDebugEnabled
      ? { result: buildItems(), warningCounts: new Map() }
      : runWithWarningDedup(buildItems);

    if (!warningDebugEnabled) {
      const suppressedWarnings = [...warningCounts.values()].reduce(
        (sum, count) => sum + Math.max(0, count - MAX_WARNING_LOG_REPEATS),
        0
      );
      if (suppressedWarnings > 0) {
        console.info(`[Stats] Suppressed ${suppressedWarnings} duplicate warning(s) while loading progress.`);
      }
    }

    const { summary, groups, overallPercent } = aggregateProgress(items);

    setOverview({
      hotelName: onboarding?.client?.hotel_name || "",
      overallPercent,
      lastSaved: onboarding?.last_saved_at || "",
      itemCount: summary.Total
    });
    renderSummaryCards(summary);
    renderGroups(groups);
    setStatusText("Loaded.");
  } catch (error) {
    setStatusText(`Failed to load stats: ${error.message || "Unknown error"}`);
    if (summaryCardsEl) summaryCardsEl.innerHTML = "";
    if (groupsEl) groupsEl.innerHTML = "";
    setOverview({ hotelName: "", overallPercent: 0, lastSaved: "", itemCount: 0 });
  } finally {
    if (refreshBtn) refreshBtn.disabled = false;
  }
};

if (refreshBtn) {
  refreshBtn.addEventListener("click", () => loadStatsByToken(activeToken));
}

window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin) return;
  if (event.data?.type === "surveyjs_runner_refresh_stats") {
    loadStatsByToken(activeToken);
  }
});

loadStatsByToken(activeToken);
