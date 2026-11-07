import * as Survey from "survey-knockout-ui";
import "survey-core/defaultV2.css";
import "./styles.css";
import { SurveyPDF } from "survey-pdf";
import { Question, Serializer } from "survey-core";

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
const bootQuery = new URLSearchParams(window.location.search);
const warningDebugEnabled = bootQuery.get("debugWarnings") === "1"
  || window.localStorage?.getItem("surveyjs:debugWarnings") === "1";
const MAX_WARNING_LOG_REPEATS = 1;

class PageBreak extends Question {
  getType() {
    return pageBreakType;
  }
}

const ensureRuntimeSchema = () => {
  ["page", "panel", "question"].forEach((className) => {
    if (!Serializer.findProperty?.(className, "scope")) {
      Serializer.addProperty(className, {
        name: "scope",
        default: "default",
        category: "general",
        visible: false
      });
    }
  });

  if (!Serializer.findClass?.(pageBreakType)) {
    Serializer.addClass(pageBreakType, [], () => new PageBreak(""), "question");
  }
};

const slugInput = document.getElementById("slug");
const loadBtn = document.getElementById("load");
const surveyList = document.getElementById("surveyList");
const tokenInput = document.getElementById("token");
const loadTokenBtn = document.getElementById("loadToken");
const pdfBtn = document.getElementById("downloadPdf");
const saveStatusEl = document.getElementById("saveStatus");
const lastSavedEl = document.getElementById("lastSaved");
const progressStatusEl = document.getElementById("progressStatus");
const statsModalEl = document.getElementById("statsModal");
const statsFrameEl = document.getElementById("statsFrame");
const closeStatsModalBtn = document.getElementById("closeStatsModal");
const openStatsTabBtn = document.getElementById("openStatsTab");

let currentModel = null;
let currentSlug = "";
let currentToken = "";
const themeCache = new Map();

ensureRuntimeSchema();

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
  originalWarn: console.warn.bind(console),
  entries: new Map()
};

const listRunnerWarnings = () =>
  [...warningInspector.entries.entries()].map(([message, entry]) => ({
    count: entry.count,
    message,
    firstSeenAt: entry.firstSeenAt,
    sampleStack: entry.sampleStack
  }));

const installRunnerWarningInspector = () => {
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

    if (warningInspector.enabled) {
      if (existing.count <= 3) {
        warningInspector.originalWarn(...args);
        if (existing.count === 1 && existing.sampleStack) {
          warningInspector.originalWarn(`[Runner warning stack]\n${existing.sampleStack}`);
        }
      }
    } else if (existing.count <= MAX_WARNING_LOG_REPEATS) {
      warningInspector.originalWarn(...args);
    }
  };

  window.getRunnerWarnings = () => listRunnerWarnings();
  window.dumpRunnerWarnings = () => {
    const rows = listRunnerWarnings().sort((a, b) => b.count - a.count);
    console.table(rows.map((row) => ({
      count: row.count,
      message: row.message.length > 220 ? `${row.message.slice(0, 220)}...` : row.message
    })));
    rows.forEach((row, index) => {
      console.log(`#${index + 1} (x${row.count}) ${row.message}`);
      if (row.sampleStack) console.log(row.sampleStack);
    });
    return rows;
  };

  if (warningInspector.enabled) {
    warningInspector.originalWarn(
      "[Runner] Warning inspector enabled. Run dumpRunnerWarnings() in DevTools for grouped warnings."
    );
  }
};

installRunnerWarningInspector();

const setSaveStatus = (text) => {
  if (saveStatusEl) saveStatusEl.textContent = text;
};

const setLastSaved = (value) => {
  if (!lastSavedEl) return;
  if (!value) {
    lastSavedEl.textContent = "";
    return;
  }
  const d = new Date(value);
  lastSavedEl.textContent = Number.isNaN(d.getTime()) ? "" : `Last saved: ${d.toLocaleString()}`;
};

const setProgressStatus = (text) => {
  if (progressStatusEl) progressStatusEl.textContent = text;
};

const hasAnswer = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
};

const calculateCompletionPercent = (model) => {
  const questions = model?.getAllQuestions?.() || [];
  const required = questions.filter((q) => q.isRequired);
  if (!required.length) return 0;
  const answered = required.filter((q) => {
    if (typeof q.isEmpty === "function") return !q.isEmpty();
    return hasAnswer(q.value);
  }).length;
  return Number(((answered / required.length) * 100).toFixed(2));
};

const calculateSectionProgress = (model) => {
  const pages = model?.pages || [];
  return pages.map((page) => {
    const questions = page.questions || [];
    const required = questions.filter((q) => q.isRequired);
    if (!required.length) {
      return { name: page.title || page.name || "Section", percent: 0 };
    }
    const answered = required.filter((q) => {
      if (typeof q.isEmpty === "function") return !q.isEmpty();
      return hasAnswer(q.value);
    }).length;
    return {
      name: page.title || page.name || "Section",
      percent: Number(((answered / required.length) * 100).toFixed(2))
    };
  });
};

const syncProgressUi = (model) => {
  const percent = calculateCompletionPercent(model);
  const sections = calculateSectionProgress(model).slice(0, 2);
  const sectionText = sections.map((s) => `${s.name}: ${s.percent}%`).join(" | ");
  setProgressStatus(`Progress: ${percent}%${sectionText ? ` | ${sectionText}` : ""}`);
};

const debounce = (fn, waitMs) => {
  let timeoutId = null;
  return (...args) => {
    if (timeoutId) window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => fn(...args), waitMs);
  };
};

const refreshSurveyList = async () => {
  if (!surveyList) return;
  surveyList.disabled = true;
  try {
    const r = await fetch(`${apiBase}/surveys?limit=100`);
    if (!r.ok) throw new Error(await r.text());
    const items = await r.json();
    const selectedSlug = (slugInput?.value || "").trim();

    surveyList.innerHTML = '<option value="">Load saved survey...</option>';
    items.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.slug;
      option.textContent = `${item.title || item.slug} (${item.slug})`;
      surveyList.appendChild(option);
    });

    if (selectedSlug) surveyList.value = selectedSlug;
  } catch (error) {
    console.error("[Runner] refresh survey list:", error);
  } finally {
    surveyList.disabled = false;
  }
};

const setRunnerMode = (isClientMode) => {
  document.body.classList.toggle("runner-client-mode", !!isClientMode);
};

const getStatsUrl = (token, embed = false, bustCache = false) => {
  const trimmed = String(token || "").trim();
  if (!trimmed) return "";
  const params = new URLSearchParams({ token: trimmed });
  if (embed) params.set("embed", "1");
  if (bustCache) params.set("_", String(Date.now()));
  return `stats.html?${params.toString()}`;
};

const updateStatsLinks = () => {
  const hasToken = !!currentToken;
  if (openStatsTabBtn) {
    openStatsTabBtn.disabled = !hasToken;
  }
};

const closeStatsModal = () => {
  if (!statsModalEl) return;
  statsModalEl.classList.remove("is-open");
  statsModalEl.setAttribute("aria-hidden", "true");
  document.body.classList.remove("stats-modal-open");
};

const openStatsModal = () => {
  if (!currentToken) {
    alert("Load an onboarding token to view stats.");
    return;
  }
  if (statsFrameEl) {
    statsFrameEl.src = getStatsUrl(currentToken, true, true);
  }
  if (statsModalEl) {
    statsModalEl.classList.add("is-open");
    statsModalEl.setAttribute("aria-hidden", "false");
  }
  document.body.classList.add("stats-modal-open");
};

const notifyStatsFrame = () => {
  if (!statsModalEl?.classList.contains("is-open")) return;
  statsFrameEl?.contentWindow?.postMessage({ type: "surveyjs_runner_refresh_stats" }, window.location.origin);
};

const setRunnerStylesheet = (themeHref, themeName = "") => {
  if (themeName) {
    document.documentElement.setAttribute("data-theme", themeName);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }

  let link = document.getElementById("runnerThemeStylesheet");
  if (!themeHref) {
    if (link) link.remove();
    return;
  }
  if (!link) {
    link = document.createElement("link");
    link.id = "runnerThemeStylesheet";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  link.href = themeHref;
};

const isSurveyThemePayload = (theme) =>
  !!theme && typeof theme === "object" && ("colorPalette" in theme || "isPanelless" in theme || "cssVariables" in theme);

const parseDbThemeRecord = (rawTheme) => {
  if (!rawTheme || typeof rawTheme !== "object") return null;
  if (rawTheme.kind === "survey" || rawTheme.kind === "creator") {
    return {
      kind: rawTheme.kind,
      theme: rawTheme.theme && typeof rawTheme.theme === "object" ? rawTheme.theme : null
    };
  }
  if (rawTheme.theme && typeof rawTheme.theme === "object") {
    if (isSurveyThemePayload(rawTheme.theme)) {
      return { kind: "survey", theme: rawTheme.theme };
    }
    return { kind: "creator", theme: rawTheme.theme };
  }
  if (isSurveyThemePayload(rawTheme)) {
    return { kind: "survey", theme: rawTheme };
  }
  return { kind: "creator", theme: rawTheme };
};

const resolveRunnerThemeConfig = async (themeRef) => {
  const raw = String(themeRef || "").trim();
  if (!raw) return { themeName: "", cssHref: null, surveyTheme: null };
  if (themeCache.has(raw)) return themeCache.get(raw);

  const fromUrl = /^https?:\/\//i.test(raw) ? raw : null;
  const fromCssPath = !fromUrl && raw.endsWith(".css")
    ? (raw.startsWith("/") ? raw : `/${raw}`)
    : null;

  const baseConfig = {
    themeName: raw,
    cssHref: fromUrl || fromCssPath,
    surveyTheme: null
  };

  if (baseConfig.cssHref) {
    themeCache.set(raw, baseConfig);
    return baseConfig;
  }

  try {
    const response = await fetch(`${apiBase}/themes?name=${encodeURIComponent(raw)}`);
    if (response.ok) {
      const data = await response.json();
      const parsed = parseDbThemeRecord(data.theme);
      if (parsed?.kind === "survey" && parsed.theme) {
        const config = { ...baseConfig, surveyTheme: parsed.theme };
        themeCache.set(raw, config);
        return config;
      }
    }
  } catch (error) {
    console.warn("[Runner] theme lookup failed:", error);
  }

  const fallback = { ...baseConfig, cssHref: `/themes/${raw}.css` };
  themeCache.set(raw, fallback);
  return fallback;
};

const cloneTheme = (theme) => JSON.parse(JSON.stringify(theme ?? {}));
const normalizeKey = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const applyRunnerThemeToModel = (model, themeConfig) => {
  setRunnerStylesheet(themeConfig?.cssHref || null, themeConfig?.themeName || "");
  if (!themeConfig?.surveyTheme || !model?.applyTheme) return;
  try {
    model.applyTheme(cloneTheme(themeConfig.surveyTheme));
  } catch (error) {
    console.warn("[Runner] survey theme apply failed:", error);
  }
};

const buildGoogleDriveFolderUrl = (folderId) => {
  const id = String(folderId || "").trim();
  if (!id) return "";
  return `https://drive.google.com/drive/folders/${encodeURIComponent(id)}`;
};

const injectDriveFolderLinksIntoElements = (elements, folderId, folderUrl) => {
  if (!Array.isArray(elements)) return [];
  const nextElements = [];
  const existingNames = new Set(elements.map((item) => String(item?.name || "")).filter(Boolean));
  const safeFolderUrl = escapeHtml(folderUrl);
  const linkHtml = `<div class="sv-drive-folder-link"><a class="sd-btn sd-btn--action" href="${safeFolderUrl}" target="_blank" rel="noopener noreferrer">Open Assets Folder</a></div>`;

  for (const element of elements) {
    if (!element || typeof element !== "object") continue;
    const nextElement = { ...element };
    if (Array.isArray(element.elements)) {
      nextElement.elements = injectDriveFolderLinksIntoElements(element.elements, folderId, folderUrl);
    }
    if (Array.isArray(element.templateElements)) {
      nextElement.templateElements = injectDriveFolderLinksIntoElements(element.templateElements, folderId, folderUrl);
    }
    if (Array.isArray(element.rows)) {
      nextElement.rows = element.rows.map((row) => {
        if (!row || typeof row !== "object") return row;
        if (!Array.isArray(row.elements)) return { ...row };
        return {
          ...row,
          elements: injectDriveFolderLinksIntoElements(row.elements, folderId, folderUrl)
        };
      });
    }

    nextElements.push(nextElement);

    const isFileUpload = String(nextElement.type || "").toLowerCase() === "file";
    const uploadName = String(nextElement.name || "").trim();
    const linkName = uploadName ? `${uploadName}_drive_folder_link` : "";
    if (isFileUpload) {
      nextElement.storeDataAsText = false;
      nextElement.waitForUpload = true;
      if (nextElement.allowMultiple === undefined) {
        nextElement.allowMultiple = true;
      }
    }
    if (isFileUpload && linkName && !existingNames.has(linkName)) {
      existingNames.add(linkName);
      nextElements.push({
        type: "html",
        name: linkName,
        html: linkHtml
      });
    }
  }

  return nextElements;
};

const injectDriveFolderLinks = (surveyJson, folderId) => {
  const normalizedFolderId = String(folderId || "").trim();
  if (!normalizedFolderId || !surveyJson || typeof surveyJson !== "object") return surveyJson;
  const folderUrl = buildGoogleDriveFolderUrl(normalizedFolderId);
  if (!folderUrl) return surveyJson;

  const nextSurveyJson = JSON.parse(JSON.stringify(surveyJson));
  const pages = Array.isArray(nextSurveyJson.pages) ? nextSurveyJson.pages : [];
  nextSurveyJson.pages = pages.map((page) => {
    if (!page || typeof page !== "object") return page;
    return {
      ...page,
      elements: injectDriveFolderLinksIntoElements(page.elements, normalizedFolderId, folderUrl)
    };
  });
  return nextSurveyJson;
};

const uploadStatusCandidates = (uploadQuestionName) => {
  const raw = String(uploadQuestionName || "").trim();
  if (!raw) return [];
  const base = raw
    .replace(/_?upload$/i, "")
    .replace(/^upload_?/i, "")
    .replace(/__+/g, "_")
    .replace(/^_|_$/g, "");
  if (!base) return [];
  return [
    `${base}_status`,
    `${base}_matrix_status`,
    `${base}_access_status`,
    `${base}_item_status`,
    `${base}_upload_status`
  ];
};

const getUploadedFileNames = (value) => {
  if (!Array.isArray(value)) return [];
  const names = value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") return item.file || item.name || item.title || "";
      return "";
    })
    .map((name) => String(name || "").trim())
    .filter(Boolean);
  return [...new Set(names)];
};

const findUploadStatusQuestion = (model, uploadQuestionName) => {
  const uploadQuestion = model.getQuestionByName(uploadQuestionName);
  if (!uploadQuestion) return null;

  const direct = uploadStatusCandidates(uploadQuestionName)
    .map((candidate) => model.getQuestionByName(candidate))
    .find(Boolean);
  if (direct) return direct;

  const uploadPageName = uploadQuestion.page?.name || "";
  const base = String(uploadQuestionName || "")
    .replace(/_?upload$/i, "")
    .replace(/^upload_?/i, "")
    .replace(/^_|_$/g, "");
  const baseTokens = base.split("_").map((token) => normalizeKey(token)).filter(Boolean);
  if (!baseTokens.length) return null;

  const questions = model.getAllQuestions?.() || [];
  let best = null;
  let bestScore = 0;
  for (const question of questions) {
    if (!question || question === uploadQuestion) continue;
    const questionName = String(question.name || "");
    const questionNameNorm = normalizeKey(questionName);
    const questionTitle = String(question.title || "").toLowerCase();
    const isStatusField = questionNameNorm.includes("status") || questionTitle.includes("status");
    if (!isStatusField) continue;

    let tokenScore = 0;
    for (const token of baseTokens) {
      if (!token) continue;
      if (questionNameNorm.includes(token)) {
        tokenScore += 3;
      } else if (token.length >= 4 && questionNameNorm.includes(token.slice(0, 4))) {
        tokenScore += 1;
      }
    }
    if (!tokenScore) continue;

    let score = tokenScore;
    if (uploadPageName && question.page?.name === uploadPageName) score += 3;
    if (questionNameNorm.startsWith(normalizeKey(base))) score += 2;
    if (score > bestScore) {
      best = question;
      bestScore = score;
    }
  }
  return best;
};

const applyUploadedFileListToStatus = (statusQuestion, fileNames) => {
  if (!statusQuestion) return;
  if (!Object.prototype.hasOwnProperty.call(statusQuestion, "__uploadBaseDescription")) {
    statusQuestion.__uploadBaseDescription = String(statusQuestion.description || "");
  }
  const baseDescription = statusQuestion.__uploadBaseDescription || "";
  const suffix = fileNames.length
    ? `Uploaded files (${fileNames.length}): ${fileNames.join(", ")}`
    : "Uploaded files: none yet.";
  statusQuestion.description = baseDescription ? `${baseDescription}\n${suffix}` : suffix;
};

const syncUploadStatusForQuestion = (model, uploadQuestionName) => {
  const uploadQuestion = model.getQuestionByName(uploadQuestionName);
  if (!uploadQuestion || String(uploadQuestion.getType?.() || "").toLowerCase() !== "file") return;
  const fileNames = getUploadedFileNames(model.getValue(uploadQuestionName));
  const statusQuestion = findUploadStatusQuestion(model, uploadQuestionName);
  applyUploadedFileListToStatus(statusQuestion, fileNames);
  model.setVariable(`${uploadQuestionName}_uploaded_files`, fileNames.join(", "));
};

const syncUploadStatuses = (model) => {
  const questions = model.getAllQuestions?.() || [];
  questions.forEach((question) => {
    if (!question || String(question.getType?.() || "").toLowerCase() !== "file") return;
    syncUploadStatusForQuestion(model, question.name);
  });
};

const deepSort = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => deepSort(item));
  }
  if (typeof value !== "object" || value === null) return value;
  return Object.keys(value)
    .sort()
    .reduce((acc, key) => {
      acc[key] = deepSort(value[key]);
      return acc;
    }, {});
};

const groupByPrefix = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  return Object.keys(data).reduce((acc, key) => {
    const rawKey = String(key || "");
    const divider = rawKey.indexOf("_");
    const groupName = divider > 0 ? rawKey.slice(0, divider) : "general";
    if (!acc[groupName]) acc[groupName] = {};
    acc[groupName][rawKey] = data[key];
    return acc;
  }, {});
};

const wireDynamicStatuses = (model, opts = {}) => {
  const conditionSuffix = opts.conditionSuffix ?? "_condition_value";
  const statusSuffix = opts.statusSuffix ?? "_dynamic_status";
  model.clearInvisibleValues = "none";

  const toStatus = (conditionValue) => {
    if (typeof conditionValue === "string") {
      const normalized = conditionValue.trim().toLowerCase();
      if (["complete", "completed", "true", "yes", "1"].includes(normalized)) return "Complete";
      if (["in-progress", "in progress"].includes(normalized)) return "In-Progress";
      if (["not started", "false", "no", "0", ""].includes(normalized)) return "Not Started";
      return "Complete";
    }

    if (conditionValue === true) return "Complete";
    if (conditionValue === false) return "Not Started";
    if (conditionValue == null) return "Not Started";
    if (Array.isArray(conditionValue)) return conditionValue.length ? "Complete" : "Not Started";
    if (typeof conditionValue === "object") return Object.keys(conditionValue).length ? "Complete" : "Not Started";
    if (typeof conditionValue === "number") return conditionValue !== 0 ? "Complete" : "Not Started";
    return conditionValue ? "Complete" : "Not Started";
  };

  const getConditionValue = (conditionName) => {
    const question = model.getQuestionByName(conditionName);
    if (question) {
      const questionValue = question.value;
      if (questionValue !== undefined) return questionValue;
    }
    return model.getValue(conditionName);
  };

  const updateFromConditionName = (conditionName) => {
    if (!conditionName || !conditionName.endsWith(conditionSuffix)) return;
    const prefix = conditionName.slice(0, -conditionSuffix.length);
    const statusName = `${prefix}${statusSuffix}`;
    const statusQuestion = model.getQuestionByName(statusName);
    if (!statusQuestion) return;

    const conditionValue = getConditionValue(conditionName);
    const statusValue = toStatus(conditionValue);
    if (model.getValue(statusName) !== statusValue) {
      model.setValue(statusName, statusValue);
    }
  };

  const updateAll = () => {
    const questions = model.getAllQuestions?.() || [];
    questions.forEach((question) => updateFromConditionName(question?.name));
  };

  window.setTimeout(updateAll, 0);
  model.onValueChanged.add(() => updateAll());
  model.onCompleting.add(() => updateAll());
};

const setKnownVariables = (model, clientData) => {
  if (!clientData || typeof clientData !== "object") return;

  const aliasMap = {
    hotel_name: ["hotel_name", "hotelName", "hotel"],
    location: ["location", "hotel_location", "hotelLocation", "city"],
    pms_system: ["pms_system", "pmsSystem", "pms"],
    crs_system: ["crs_system", "crsSystem", "crs"],
    sales_catering_system: ["sales_catering_system", "salesCateringSystem", "s_c_system", "sc_system", "s+c_system"],
    rate_shopping_tool: ["rate_shopping_tool", "rateShoppingTool", "rate_shopping", "rateShopping"],
    rms_system: ["rms_system", "rmsSystem", "rms"],
    website_cms: ["website_cms", "websiteCms", "cms"],
    google_drive_folder_id: ["google_drive_folder_id", "googleDriveFolderId", "drive_folder_id", "driveFolderId"],
    google_drive_folder_url: ["google_drive_folder_url", "googleDriveFolderUrl", "drive_folder_url", "driveFolderUrl"]
  };

  const setQuestionIfEmpty = (name, value) => {
    const question = model.getQuestionByName(name);
    if (question && !hasAnswer(question.value)) {
      model.setValue(name, value);
    }
  };

  Object.entries(clientData).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    const aliases = aliasMap[key] || [key];
    aliases.forEach((alias) => {
      model.setVariable(alias, value);
      setQuestionIfEmpty(alias, value);
    });
  });

  const canonicalValues = {
    hotelname: clientData.hotel_name,
    hotellocation: clientData.location,
    location: clientData.location,
    pmssystem: clientData.pms_system,
    crssystem: clientData.crs_system,
    salescateringsystem: clientData.sales_catering_system,
    scsystem: clientData.sales_catering_system,
    rateshoppingtool: clientData.rate_shopping_tool,
    rmssystem: clientData.rms_system,
    websitecms: clientData.website_cms,
    cms: clientData.website_cms,
    googledrivefolderid: clientData.google_drive_folder_id,
    googledrivefolderurl: clientData.google_drive_folder_url
  };
  const questions = model.getAllQuestions?.() || [];
  questions.forEach((question) => {
    if (!question || hasAnswer(question.value)) return;
    const questionKey = normalizeKey(question.name);
    for (const [canonicalKey, canonicalValue] of Object.entries(canonicalValues)) {
      if (!canonicalValue) continue;
      if (questionKey.includes(canonicalKey)) {
        model.setValue(question.name, canonicalValue);
        break;
      }
    }
  });
};

const addStatsNavigation = (model) => {
  if (!currentToken || typeof model?.addNavigationItem !== "function") return;
  try {
    model.addNavigationItem({
      id: "view_stats",
      title: "[Progress]",
      action: openStatsModal,
      css: "sv-stats-nav",
      innerCss: "sd-btn",
      visibleIndex: 49
    });
  } catch (error) {
    console.warn("[Runner] unable to add Stats navigation button:", error);
  }
};

const addManualSaveNavigation = (model) => {
  if (!currentToken || typeof model?.addNavigationItem !== "function") return;
  try {
    model.addNavigationItem({
      id: "save_now",
      title: "[Save]",
      action: () => saveDraft(model),
      css: "sv-save-now-nav",
      innerCss: "sd-btn",
      visibleIndex: 50
    });
  } catch (error) {
    console.warn("[Runner] unable to add Save navigation button:", error);
  }
};

function getSelectedPartnersFromMatrix(model) {
  const rows = model.getValue("channel_partners") || [];
  const names = rows
    .map((r) => {
      const comment = typeof r?.partnerComment === "string" ? r.partnerComment.trim() : "";
      return comment || r?.partner;
    })
    .filter(Boolean);
  return [...new Set(names)];
}

function syncPartnerPanelsFromMatrix(model) {
  const selected = getSelectedPartnersFromMatrix(model);
  const pd = model.getQuestionByName("partner_details");
  if (!pd) return;

  const current = pd.value || [];
  const next = selected.map((name) => {
    const existing = current.find((p) => p.partner_name === name);
    return existing || { partner_name: name, access_status: "Not Started" };
  });

  pd.value = next;
  pd.panelCount = next.length;
}

const attachUploadHandler = (model) => {
  model.onUploadFiles.add(async (_sender, options) => {
    if (!currentToken) {
      options.callback("error", "Upload requires a valid onboarding token.");
      return;
    }
    try {
      const formData = new FormData();
      options.files.forEach((file) => formData.append("files", file, file.name));

      const response = await fetch(`${apiBase}/onboarding/${encodeURIComponent(currentToken)}/upload`, {
        method: "POST",
        body: formData
      });
      if (!response.ok) throw new Error(await response.text());
      const payload = await response.json();
      const files = (payload.files || []).map((item) => ({
        file: item.name,
        content: item.content
      }));
      options.callback("success", files);
      window.setTimeout(() => {
        if (options?.question?.name) {
          syncUploadStatusForQuestion(model, options.question.name);
        }
      }, 0);
    } catch (error) {
      options.callback("error", error.message || "Upload failed.");
    }
  });
};

const saveDraft = async (model) => {
  if (!currentToken) return;
  const payload = {
    draft_data: model.data || {},
    current_page: model.currentPageNo || 0,
    completion_percent: calculateCompletionPercent(model)
  };

  try {
    setSaveStatus("Saving...");
    const response = await fetch(`${apiBase}/onboarding/${encodeURIComponent(currentToken)}/draft`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    setSaveStatus("Saved");
    setLastSaved(data.last_saved_at);
    notifyStatsFrame();
  } catch (error) {
    setSaveStatus("Save failed");
    console.error("[Runner] autosave failed:", error);
  }
};

const attachAutosave = (model) => {
  if (!currentToken) return;
  const debouncedSave = debounce(() => saveDraft(model), 1500);
  model.onValueChanged.add((_sender, options) => {
    syncPartnerPanelsFromMatrix(model);
    if (options?.question && String(options.question.getType?.() || "").toLowerCase() === "file") {
      syncUploadStatusForQuestion(model, options.question.name);
    }
    syncProgressUi(model);
    debouncedSave();
  });
  model.onCurrentPageChanged.add(() => {
    syncProgressUi(model);
    debouncedSave();
  });
};

const configurePdfButton = (surveyJson) => {
  if (!pdfBtn) return;
  pdfBtn.disabled = false;
  pdfBtn.onclick = () => {
    const pdf = new SurveyPDF(surveyJson, { fontSize: 12 });
    pdf.data = currentModel?.data || {};
    pdf.save(`${currentSlug || "survey"}.pdf`);
  };
};

const wireCompletionHandler = (model) => {
  model.onComplete.add(async (sender) => {
    const sortedFlatData = deepSort(sender.data || {});
    const grouped = groupByPrefix(sortedFlatData);
    const finalOutput = deepSort(grouped);
    window.__surveyFinalOutput = finalOutput;
    console.log("[Runner] grouped final output:", finalOutput);

    try {
      if (currentToken) {
        const response = await fetch(`${apiBase}/onboarding/${encodeURIComponent(currentToken)}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            final_data: sortedFlatData,
            completion_percent: calculateCompletionPercent(model)
          })
        });
        if (!response.ok) throw new Error(await response.text());
      } else {
        await fetch(`${apiBase}/responses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            survey_slug: currentSlug,
            response_data: sortedFlatData,
            meta: { ua: navigator.userAgent }
          })
        });
      }
      setSaveStatus("Completed");
      notifyStatsFrame();
      alert("Response saved.");
    } catch (error) {
      alert("Save failed: " + error.message);
    }
  });
};

const buildAndRenderModel = ({ surveyJson, clientData, draftData, currentPageNo, slug, themeConfig = null }) => {
  currentSlug = slug || "";
  const surveyWithDriveLinks = injectDriveFolderLinks(surveyJson, clientData?.google_drive_folder_id);
  const model = new Survey.Model(surveyWithDriveLinks);
  currentModel = model;

  applyRunnerThemeToModel(model, themeConfig);
  setKnownVariables(model, clientData || {});
  syncPartnerPanelsFromMatrix(model);

  if (draftData && typeof draftData === "object") {
    model.data = draftData;
    if (Number.isFinite(currentPageNo)) {
      const pageNo = Math.max(parseInt(currentPageNo, 10) || 0, 0);
      model.currentPageNo = pageNo;
    }
  }

  attachUploadHandler(model);
  attachAutosave(model);
  wireDynamicStatuses(model);
  addStatsNavigation(model);
  addManualSaveNavigation(model);
  wireCompletionHandler(model);
  configurePdfButton(surveyWithDriveLinks);
  syncUploadStatuses(model);
  syncProgressUi(model);

  model.render("surveyContainer");
};

const loadSurveyBySlug = async (slugValue) => {
  const slug = (slugValue || slugInput?.value || "").trim();
  if (!slug) {
    alert("Enter slug");
    return;
  }
  const r = await fetch(`${apiBase}/surveys/${encodeURIComponent(slug)}`);
  if (!r.ok) {
    alert("Load failed: " + (await r.text()));
    return;
  }
  const data = await r.json();
  currentToken = "";
  setRunnerMode(false);
  closeStatsModal();
  if (tokenInput) tokenInput.value = "";
  if (slugInput) slugInput.value = data.slug || slug;
  if (surveyList) surveyList.value = data.slug || slug;
  updateStatsLinks();
  setSaveStatus("Loaded");
  setLastSaved(null);
  setRunnerStylesheet(null, "");
  buildAndRenderModel({
    surveyJson: data.json_schema,
    clientData: {},
    draftData: null,
    currentPageNo: 0,
    slug: data.slug || slug
  });
};

const loadOnboardingByToken = async (tokenValue) => {
  const token = (tokenValue || tokenInput?.value || "").trim();
  if (!token) {
    alert("Enter onboarding token");
    return;
  }
  const r = await fetch(`${apiBase}/onboarding/${encodeURIComponent(token)}`);
  if (!r.ok) {
    alert("Load failed: " + (await r.text()));
    return;
  }
  const data = await r.json();
  const themeConfig = await resolveRunnerThemeConfig(data.theme);
  currentToken = token;
  setRunnerMode(true);
  closeStatsModal();
  currentSlug = data.survey_slug || "";
  updateStatsLinks();
  if (tokenInput) tokenInput.value = token;
  if (slugInput) slugInput.value = data.survey_slug || "";
  if (surveyList && data.survey_slug) surveyList.value = data.survey_slug;
  setSaveStatus("Loaded");
  setLastSaved(data.last_saved_at || null);
  buildAndRenderModel({
    surveyJson: data.survey_json,
    clientData: data.client || {},
    draftData: data.draft_data || null,
    currentPageNo: data.current_page,
    slug: data.survey_slug || "",
    themeConfig
  });
};

if (loadBtn) {
  loadBtn.addEventListener("click", () => {
    loadSurveyBySlug();
  });
}

if (loadTokenBtn) {
  loadTokenBtn.addEventListener("click", () => {
    loadOnboardingByToken();
  });
}

if (slugInput) {
  slugInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      loadSurveyBySlug();
    }
  });
}

if (tokenInput) {
  tokenInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      loadOnboardingByToken();
    }
  });
}

if (surveyList) {
  surveyList.addEventListener("change", () => {
    if (!surveyList.value) return;
    if (slugInput) slugInput.value = surveyList.value;
    loadSurveyBySlug(surveyList.value);
  });
}

if (openStatsTabBtn) {
  openStatsTabBtn.addEventListener("click", () => {
    if (!currentToken) return;
    window.open(getStatsUrl(currentToken, false, true), "_blank", "noopener,noreferrer");
  });
}

if (closeStatsModalBtn) {
  closeStatsModalBtn.addEventListener("click", closeStatsModal);
}

if (statsModalEl) {
  statsModalEl.addEventListener("click", (event) => {
    if (event.target === statsModalEl) {
      closeStatsModal();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && statsModalEl?.classList.contains("is-open")) {
    closeStatsModal();
  }
});

updateStatsLinks();
refreshSurveyList();

const queryToken = bootQuery.get("token");
const querySlug = bootQuery.get("slug");
if (queryToken) {
  setRunnerMode(true);
  if (tokenInput) tokenInput.value = queryToken;
  loadOnboardingByToken(queryToken);
} else if (querySlug) {
  setRunnerMode(false);
  if (slugInput) slugInput.value = querySlug;
  loadSurveyBySlug(querySlug);
} else {
  setRunnerMode(false);
}
