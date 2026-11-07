import { SurveyCreator } from "survey-creator-knockout";
import { Action, ComputedUpdater, Question, Serializer, SvgRegistry } from "survey-core";
import { DefaultFonts, SurveyHelper } from "survey-creator-core";
import "survey-core/defaultV2.css";
import "survey-creator-core/survey-creator-core.css";
import "./styles.css";

const pageBreakToolboxIcon = `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.75 16V19C20.75 20.52 19.52 21.75 18 21.75H6C4.48 21.75 3.25 20.52 3.25 19V16C3.25 15.59 3.59 15.25 4 15.25C4.41 15.25 4.75 15.59 4.75 16V19C4.75 19.69 5.31 20.25 6 20.25H18C18.69 20.25 19.25 19.69 19.25 19V16C19.25 15.59 19.59 15.25 20 15.25C20.41 15.25 20.75 15.59 20.75 16ZM18 2.25H6C4.48 2.25 3.25 3.48 3.25 5V8C3.25 8.41 3.59 8.75 4 8.75C4.41 8.75 4.75 8.41 4.75 8V5C4.75 4.31 5.31 3.75 6 3.75H18C18.69 3.75 19.25 4.31 19.25 5V8C19.25 8.41 19.59 8.75 20 8.75C20.41 8.75 20.75 8.41 20.75 8V5C20.75 3.48 19.52 2.25 18 2.25ZM4 12.75H5C5.41 12.75 5.75 12.41 5.75 12C5.75 11.59 5.41 11.25 5 11.25H4C3.59 11.25 3.25 11.59 3.25 12C3.25 12.41 3.59 12.75 4 12.75ZM20 11.25H19C18.59 11.25 18.25 11.59 18.25 12C18.25 12.41 18.59 12.75 19 12.75H20C20.41 12.75 20.75 12.41 20.75 12C20.75 11.59 20.41 11.25 20 11.25ZM10 12.75C10.41 12.75 10.75 12.41 10.75 12C10.75 11.59 10.41 11.25 10 11.25H9C8.59 11.25 8.25 11.59 8.25 12C8.25 12.41 8.59 12.75 9 12.75H10ZM15 12.75C15.41 12.75 15.75 12.41 15.75 12C15.75 11.59 15.41 11.25 15 11.25H14C13.59 11.25 13.25 11.59 13.25 12C13.25 12.41 13.59 12.75 14 12.75H15Z" /></svg>`;
const pageMergeActionIcon = `<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M8.5 5.75V7H9.75C10.16 7 10.5 7.34 10.5 7.75C10.5 8.16 10.16 8.5 9.75 8.5H8.5V9.75C8.5 10.16 8.16 10.5 7.75 10.5C7.34 10.5 7 10.16 7 9.75V8.5H5.75C5.34 8.5 5 8.16 5 7.75C5 7.34 5.34 7 5.75 7H7V5.75C7 5.34 7.34 5 7.75 5C8.16 5 8.5 5.34 8.5 5.75ZM12.75 1H2.75C1.79 1 1 1.79 1 2.75V5.75C1 6.16 1.34 6.5 1.75 6.5C2.16 6.5 2.5 6.16 2.5 5.75V2.75C2.5 2.61 2.61 2.5 2.75 2.5H12.75C12.89 2.5 13 2.61 13 2.75V5.75C13 6.16 13.34 6.5 13.75 6.5C14.16 6.5 14.5 6.16 14.5 5.75V2.75C14.5 1.79 13.71 1 12.75 1ZM13.75 9C13.34 9 13 9.34 13 9.75V12.75C13 12.89 12.89 13 12.75 13H2.75C2.61 13 2.5 12.89 2.5 12.75V9.75C2.5 9.34 2.16 9 1.75 9C1.34 9 1 9.34 1 9.75V12.75C1 13.71 1.79 14.5 2.75 14.5H12.75C13.71 14.5 14.5 13.71 14.5 12.75V9.75C14.5 9.34 14.16 9 13.75 9Z" /></svg>`;
const pageBreakType = "pagebreak";
const scopeChoices = ["all", "default", "revenue", "distribution", "digital", "social"];
let fontsInitialized = false;

const normalizeConfiguredApiBase = (url) => {
  const normalizedPath = url.pathname.replace(/\/$/, "");
  if (!normalizedPath || normalizedPath === "/") {
    url.pathname = "/api";
  }
  return url.toString().replace(/\/$/, "");
};

const customThemeFonts = [
  { fontPath: "fontbase64_robotomonoregular", fontFamily: "RobotoMono-Regular" },
  { fontPath: "fontbase64_robotomonoitalic", fontFamily: "RobotoMono-Italic" }
];
const themeFontOptions = [
  "Khand, sans-serif",
  "'Fira Code', monospace",
  "'General Sans', sans-serif",
  "Supreme, sans-serif",
  "'Noto Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif",
  "Pacifico, cursive",
  "Barlow, sans-serif",
  "'Logic Monoscript', monospace",
  "RobotoMono-Regular, monospace",
  "RobotoMono-Italic, monospace"
];

class PageBreak extends Question {
  getType() {
    return pageBreakType;
  }
}

const registerScopeProperty = (className) => {
  try {
    if (Serializer.findProperty?.(className, "scope")) return;
    Serializer.addProperty(className, {
      name: "scope",
      title: "Scope",
      category: "general",
      choices: scopeChoices,
      visibleIndex: 2
    });
  } catch (error) {
    reportBootError(`register scope property for ${className}`, error);
  }
};

const registerScopeProperties = () => {
  registerScopeProperty("page");
  registerScopeProperty("panel");
  registerScopeProperty("question");
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


const reportBootError = (label, error) => {
  const message = `[Creator Boot] ${label}: ${error?.message || String(error)}`;
  console.error(message, error);
  let panel = document.getElementById("creatorBootError");
  if (!panel) {
    panel = document.createElement("pre");
    panel.id = "creatorBootError";
    panel.style.margin = "8px 16px";
    panel.style.padding = "10px";
    panel.style.background = "#fff1f0";
    panel.style.border = "1px solid #ffa39e";
    panel.style.borderRadius = "4px";
    panel.style.whiteSpace = "pre-wrap";
    panel.style.font = "12px/1.4 monospace";
    document.body.prepend(panel);
  }
  panel.textContent = message;
};

const clearBootError = () => {
  const panel = document.getElementById("creatorBootError");
  if (panel) panel.remove();
};

const safeRun = (label, fn) => {
  try {
    return fn();
  } catch (error) {
    reportBootError(label, error);
    return undefined;
  }
};

const addThemeFontOptions = () => {
  themeFontOptions.forEach((fontValue) => {
    if (!DefaultFonts.includes(fontValue)) {
      DefaultFonts.push(fontValue);
    }
  });
};

const loadFont = async ({ serverHosts, fontPath, fontFamily }) => {
  for (const serverHost of serverHosts) {
    try {
      const fontUrl = `${serverHost}/api/${fontPath}`;
      const response = await fetch(fontUrl);
      if (!response.ok) continue;
      const base64Font = await response.text();
      const style = document.createElement("style");
      style.innerHTML = `@font-face { font-family: '${fontFamily}'; src: url(data:application/x-font-woff;charset=utf-8;base64,${base64Font}) format('truetype'); }`;
      document.head.appendChild(style);
      return true;
    } catch {
      // Try next host candidate.
    }
  }
  return false;
};

const initThemeFonts = async () => {
  if (fontsInitialized) return;
  fontsInitialized = true;
  addThemeFontOptions();

  const serverHosts = ["https://surveyjs.io"]; // or ["https://surveyjs.io", window.location.origin]

  if (!serverHosts.includes("https://surveyjs.io")) {
    serverHosts.push("https://surveyjs.io");
  }
  await Promise.all(customThemeFonts.map((font) => loadFont({ serverHosts, ...font })));
};


const initCreator = () => {
  registerScopeProperties();
  initThemeFonts();
  const creator = safeRun("create SurveyCreator", () => new SurveyCreator({
    showLogicTab: true,
    showThemeTab: true,
    isAutoSave: false,
    showCreatorThemeSettings: true
  }));
  if (!creator) return;

  safeRun("render creator", () => creator.render("creator"));

  const slugInput = document.getElementById("slug");
  const titleInput = document.getElementById("title");
  const saveBtn = document.getElementById("save");
  const loadBtn = document.getElementById("load");
  const deleteSurveyBtn = document.getElementById("deleteSurvey");
  const surveyList = document.getElementById("surveyList");
  const themeList = document.getElementById("themeList");
  const loadThemeBtn = document.getElementById("loadTheme");
  const saveThemeDbBtn = document.getElementById("saveThemeDb");
  const deleteThemeDbBtn = document.getElementById("deleteThemeDb");
  const downloadBtn = document.getElementById("download");

  const cloneTheme = (theme) => JSON.parse(JSON.stringify(theme ?? {}));
  const isSurveyThemePayload = (theme) =>
    !!theme && typeof theme === "object" && ("colorPalette" in theme || "isPanelless" in theme || "backgroundImage" in theme);
  const normalizeCreatorThemePayload = (rawTheme) => {
    if (!rawTheme || typeof rawTheme !== "object") return null;
    let theme = rawTheme;
    if (theme.theme && typeof theme.theme === "object") {
      theme = theme.theme;
    }
    const normalized = cloneTheme(theme);
    if (isSurveyThemePayload(normalized)) {
      throw new Error("This looks like a Survey Theme. Load it from the Themes tab.");
    }
    if (Object.keys(normalized).length === 0) {
      return null;
    }
    if (!normalized.themeName) {
      normalized.themeName = creator.creatorTheme?.themeName || "sc2020";
    }
    if (normalized.cssVariables && typeof normalized.cssVariables !== "object") {
      delete normalized.cssVariables;
    }
    return normalized;
  };
  const serializeCreatorTheme = () => {
    const model = creator.creatorTheme;
    if (model && typeof model.toJSON === "function") {
      return model.toJSON();
    }
    return cloneTheme(model);
  };
  const applyCreatorThemeSafely = (theme) => {
    const normalized = normalizeCreatorThemePayload(theme);
    if (!normalized) {
      throw new Error("Saved theme is empty or invalid. Re-save this theme to the database and try again.");
    }
    const previousTab = creator.activeTab;
    const shouldRestoreTab = previousTab && previousTab !== "designer";
    if (shouldRestoreTab) {
      creator.activeTab = "designer";
    }
    try {
      creator.applyCreatorTheme(normalized);
    } catch (error) {
      const message = String(error?.message || "");
      if (message.includes("scaleCssVariables")) {
        throw new Error("Creator theme engine was not ready. Switch to the Designer tab and load again.");
      }
      throw error;
    } finally {
      if (shouldRestoreTab) {
        creator.activeTab = previousTab;
      }
    }
  };
  const themeTabPlugin = creator.themeEditor;

  const setCreatorData = (slug, title, jsonSchema) => {
    if (slugInput) slugInput.value = slug;
    if (titleInput) titleInput.value = title || slug;
    if (surveyList) surveyList.value = slug;
    creator.JSON = jsonSchema;
  };

  const loadSurvey = async (slugValue) => {
    const slug = (slugValue || slugInput?.value || "").trim();
    if (!slug) return alert("Enter a slug to load.");
    try {
      const r = await fetch(`${apiBase}/surveys/${encodeURIComponent(slug)}`);
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setCreatorData(data.slug, data.title, data.json_schema);
    } catch (error) {
      alert("Load failed: " + error.message);
    }
  };

  const refreshSurveyList = async () => {
    if (!surveyList) return;
    surveyList.disabled = true;
    try {
      const r = await fetch(`${apiBase}/surveys?limit=100`);
      if (!r.ok) throw new Error(await r.text());
      const items = await r.json();
      surveyList.innerHTML = '<option value="">Load saved survey...</option>';
      items.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.slug;
        option.textContent = `${item.title || item.slug} (${item.slug})`;
        surveyList.appendChild(option);
      });
      clearBootError();
    } catch (error) {
      reportBootError("refresh survey list", error);
    } finally {
      surveyList.disabled = false;
    }
  };

  const refreshThemeList = async () => {
    if (!themeList) return;
    themeList.disabled = true;
    try {
      const r = await fetch(`${apiBase}/themes`);
      if (!r.ok) throw new Error(await r.text());
      const items = await r.json();
      themeList.innerHTML = '<option value="">Load saved theme...</option>';
      items.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.name;
        option.textContent = item.name;
        themeList.appendChild(option);
      });
      clearBootError();
    } catch (error) {
      reportBootError("refresh theme list", error);
    } finally {
      themeList.disabled = false;
    }
  };

  const readApiError = async (response) => {
    const text = await response.text();
    if (!text) return `HTTP ${response.status}`;
    try {
      const payload = JSON.parse(text);
      return payload.error || text;
    } catch {
      return text;
    }
  };

  const parseDbThemeRecord = (raw) => {
    if (!raw || typeof raw !== "object") {
      throw new Error("Saved theme payload is invalid.");
    }

    if (raw.kind === "creator" || raw.kind === "survey") {
      return { kind: raw.kind, theme: cloneTheme(raw.theme) };
    }

    if (raw.theme && typeof raw.theme === "object") {
      const nested = raw.theme;
      if (isSurveyThemePayload(nested)) {
        return { kind: "survey", theme: cloneTheme(nested) };
      }
      return { kind: "creator", theme: cloneTheme(nested) };
    }

    if (isSurveyThemePayload(raw)) {
      return { kind: "survey", theme: cloneTheme(raw) };
    }

    return { kind: "creator", theme: cloneTheme(raw) };
  };

  const applySurveyThemeSafely = (theme) => {
    const normalized = cloneTheme(theme);
    if (!normalized?.themeName) {
      throw new Error("Saved survey theme is invalid.");
    }
    if (!themeTabPlugin) {
      throw new Error("Survey Theme tab is unavailable in this build.");
    }
    try {
      themeTabPlugin.addTheme?.(normalized);
    } catch {
      // Ignore duplicate theme registration.
    }
    themeTabPlugin.themeModel?.setTheme?.(normalized);
    creator.theme = normalized;
    creator.activeTab = "theme";
  };

  const serializeThemeForDb = () => {
    const isSurveyTab = creator.activeTab === "theme";
    if (isSurveyTab) {
      const surveyTheme = cloneTheme(creator.theme || themeTabPlugin?.getCurrentTheme?.());
      if (!surveyTheme?.themeName) {
        throw new Error("No active survey theme to save from the Theme tab.");
      }
      return { kind: "survey", theme: surveyTheme };
    }

    const serializedTheme = serializeCreatorTheme();
    const normalizedTheme = normalizeCreatorThemePayload(serializedTheme);
    if (!normalizedTheme) {
      throw new Error("Creator theme is empty or invalid.");
    }
    return { kind: "creator", theme: normalizedTheme };
  };

  const loadThemeFromDb = async (nameValue) => {
    const name = (nameValue || themeList?.value || "").trim();
    if (!name) return alert("Select a saved theme to load.");
    try {
      const r = await fetch(`${apiBase}/themes?name=${encodeURIComponent(name)}`);
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      const record = parseDbThemeRecord(data.theme);
      if (record.kind === "survey") {
        applySurveyThemeSafely(record.theme);
      } else {
        const normalizedTheme = normalizeCreatorThemePayload(record.theme);
        if (!normalizedTheme) {
          throw new Error("Saved creator theme is empty.");
        }
        applyCreatorThemeSafely(normalizedTheme);
      }
      if (themeList) themeList.value = data.name;
    } catch (error) {
      alert("Failed to load theme: " + error.message);
    }
  };

  const saveThemeToDb = async () => {
    const selectedExistingName = (themeList?.value || "").trim();
    let finalName = selectedExistingName;
    if (!finalName) {
      const suggestedName = slugInput?.value || "custom-theme";
      const prompted = window.prompt("Enter a theme name to save", suggestedName || "");
      if (!prompted) return;
      finalName = prompted.trim();
    }
    if (!finalName) return;
    try {
      const payload = {
        name: finalName,
        theme: serializeThemeForDb()
      };
      const r = await fetch(`${apiBase}/themes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!r.ok) throw new Error(await r.text());
      alert(`Theme saved (${payload.theme.kind}).`);
      await refreshThemeList();
      if (themeList) themeList.value = payload.name;
    } catch (error) {
      alert("Failed to save theme: " + error.message);
    }
  };

  const deleteThemeFromDb = async () => {
    const name = (themeList?.value || "").trim();
    if (!name) return alert("Select a saved theme to delete.");
    const confirmed = window.confirm(`Delete theme "${name}" from database?`);
    if (!confirmed) return;
    try {
      const response = await fetch(`${apiBase}/themes/${encodeURIComponent(name)}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error(await readApiError(response));
      alert(`Theme "${name}" deleted.`);
      if (themeList) themeList.value = "";
      await refreshThemeList();
    } catch (error) {
      alert("Failed to delete theme: " + error.message);
    }
  };

  const deleteSurveyFromDb = async () => {
    const slug = (slugInput?.value || surveyList?.value || "").trim();
    if (!slug) return alert("Select or enter a survey slug to delete.");
    const confirmed = window.confirm(`Delete survey "${slug}" from database?\n\nThis also deletes related responses and onboarding records.`);
    if (!confirmed) return;
    try {
      const response = await fetch(`${apiBase}/surveys/${encodeURIComponent(slug)}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error(await readApiError(response));
      alert(`Survey "${slug}" deleted.`);
      if (surveyList) surveyList.value = "";
      if (slugInput) slugInput.value = "";
      if (titleInput) titleInput.value = "";
      await refreshSurveyList();
    } catch (error) {
      alert("Failed to delete survey: " + error.message);
    }
  };

  safeRun("configure theme editor", () => {
    if (themeTabPlugin && "advancedModeEnabled" in themeTabPlugin) {
      themeTabPlugin.advancedModeEnabled = true;
    }
    if (creator.showCreatorThemeSettings && typeof creator.openCreatorThemeSettings === "function") {
      creator.openCreatorThemeSettings();
    }
  });

  safeRun("register page break feature", () => {
    if (!Serializer.findClass(pageBreakType)) {
      Serializer.addClass(pageBreakType, [], () => new PageBreak(""), "question");
    }

    SvgRegistry.registerIconFromSvg("icon-toolbox-pagebreak", pageBreakToolboxIcon);
    SvgRegistry.registerIconFromSvg("icon-action-pagemerge", pageMergeActionIcon);

    const isPageBreak = (el) => el?.getType?.() === pageBreakType;
    const moveElementsToPage = (page, elements) => {
      elements.forEach((el) => {
        el.parent.removeElement(el);
        page.addElement(el);
      });
    };

    const tryAddEvent = (source, eventName, handler) => {
      if (source?.[eventName]?.add) {
        source[eventName].add(handler);
        return true;
      }
      return false;
    };

    const dragAllowHandler = (_, options) => {
      try {
        const q = options.draggedElement;
        if (!isPageBreak(q)) return;
        const el = options.toElement;
        options.allow = !!el && !el.isPanel && (!el.parent || el.parent.isPage);
        if (el.isPage && el.elements.length < 2) options.allow = false;
        if (options.allow && el.page) {
          const elements = el.page.elements;
          if (options.insertBefore && elements.indexOf(options.insertBefore) === 0) options.allow = false;
          if (options.insertAfter && elements.indexOf(options.insertAfter) === elements.length - 1) options.allow = false;
        }
      } catch (error) {
        reportBootError("page break drag validation", error);
      }
    };

    const questionAddedHandler = (_, options) => {
      try {
        const q = options.question;
        if (!isPageBreak(q)) return;
        const curPage = q.page;
        const index = curPage.indexOf(q);
        q.delete();
        const elements = [];
        for (let i = index; i < curPage.elements.length; i += 1) elements.push(curPage.elements[i]);
        const survey = creator.survey;
        const newPageName = SurveyHelper.getNewPageName(survey.pages);
        const newPageIndex = survey.pages.indexOf(curPage) + 1;
        const newPage = survey.addNewPage(newPageName, newPageIndex);
        moveElementsToPage(newPage, elements);
        creator.selectElement(newPage);
      } catch (error) {
        reportBootError("page break split handler", error);
      }
    };

    const pageActionHandler = (_, options) => {
      try {
        const page = options?.element || options?.obj;
        if (!page || !page.isPage) return;
        const targetActions = options?.actions || options?.items;
        if (!Array.isArray(targetActions)) return;
        const action = new Action({
          id: "page_merge",
          visible: new ComputedUpdater(() => page.visibleIndex > 0),
          title: "Merge with previous page",
          iconName: "icon-action-pagemerge",
          iconSize: 16,
          action: () => {
            const pages = creator.survey.pages;
            const index = pages.indexOf(page);
            if (index >= 1) {
              creator.startUndoRedoTransaction("merge page");
              moveElementsToPage(pages[index - 1], [].concat(page.elements));
              page.delete();
              creator.stopUndoRedoTransaction();
            }
          }
        });
        targetActions.push(action);
      } catch (error) {
        reportBootError("page merge action", error);
      }
    };

    const hasDragHook = tryAddEvent(creator, "onDragDropAllow", dragAllowHandler)
      || tryAddEvent(creator.survey, "onDragDropAllow", dragAllowHandler);
    const hasQuestionAddedHook = tryAddEvent(creator, "onQuestionAdded", questionAddedHandler)
      || tryAddEvent(creator.survey, "onQuestionAdded", questionAddedHandler);
    const hasPageActionHook = tryAddEvent(creator, "onElementGetActions", pageActionHandler)
      || tryAddEvent(creator, "onDefineElementMenuItems", pageActionHandler);

    if (!hasDragHook) {
      console.warn("[Creator Boot] page break drag-drop validation hook unavailable");
    }
    if (!hasQuestionAddedHook) {
      console.warn("[Creator Boot] page break split hook unavailable; toolbox item will be disabled");
      return;
    }
    if (!hasPageActionHook) {
      console.warn("[Creator Boot] page merge action hook unavailable");
    }

    if (!creator.toolbox?.addItem) {
      throw new Error("toolbox.addItem unavailable");
    }
    creator.toolbox.addItem(
      {
        name: "page_break",
        title: "Page Break",
        iconName: "icon-toolbox-pagebreak",
        showInToolboxOnly: true,
        json: { type: pageBreakType }
      },
      0
    );
  });

  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const slug = (slugInput?.value || "").trim();
      const title = (titleInput?.value || "").trim() || slug;
      if (!slug) return alert("Enter a slug");
      try {
        const r = await fetch(`${apiBase}/surveys`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, title, json_schema: creator.JSON })
        });
        if (!r.ok) throw new Error(await r.text());
        alert("Saved.");
        refreshSurveyList();
      } catch (error) {
        alert("Save failed: " + error.message);
      }
    });
  }

  if (loadBtn) loadBtn.addEventListener("click", () => loadSurvey());

  if (surveyList) {
    surveyList.addEventListener("change", () => {
      if (slugInput) {
        slugInput.value = surveyList.value || "";
      }
    });
  }

  if (slugInput) {
    slugInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
      }
    });
  }

  if (loadThemeBtn) loadThemeBtn.addEventListener("click", () => loadThemeFromDb());
  if (themeList) {
    themeList.addEventListener("change", () => {
      // Selection only; loading is explicit via "Load Theme".
    });
  }
  if (saveThemeDbBtn) saveThemeDbBtn.addEventListener("click", () => saveThemeToDb());
  if (deleteThemeDbBtn) deleteThemeDbBtn.addEventListener("click", () => deleteThemeFromDb());
  if (deleteSurveyBtn) deleteSurveyBtn.addEventListener("click", () => deleteSurveyFromDb());

  const initialSlug = new URLSearchParams(window.location.search).get("slug");
  if (initialSlug && slugInput) {
    slugInput.value = initialSlug;
  }

  refreshSurveyList();
  refreshThemeList();

  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(creator.JSON, null, 2));
      const a = document.createElement("a");
      a.href = dataStr;
      a.download = "survey.json";
      a.click();
    });
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCreator);
} else {
  initCreator();
}
