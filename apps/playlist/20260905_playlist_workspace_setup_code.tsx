import React, { useState, useMemo, useEffect } from 'react';
import { Users, Palette, Trash2, Plus, FileText, Sparkles, RefreshCw, Sliders, ExternalLink, Flag } from 'lucide-react';

const fontStyles = `
/* Local Fallback Overrides */
@font-face {
  font-family: 'Fallback-Arial-Narrow';
  src: local('Arial Narrow');
  size-adjust: 105%;
  ascent-override: 90%;
  descent-override: 15%;
}

@font-face {
  font-family: 'Fallback-Bahnschrift';
  src: local('Bahnschrift');
  size-adjust: 95%;
  font-weight: 700;
  font-stretch: condensed;
}

/* Utility & Typography Classes */
.font-khand {
  font-family: 'Khand', 'Fallback-Bahnschrift', 'Avenir Next Condensed', 'Oswald', 'Helvetica Neue Condensed', 'Franklin Gothic Demi Cond', 'Fallback-Arial-Narrow', sans-serif;
}

.font-roboto {
  font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.border-3 { border-width: 3px; }
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
.animate-in { animation: fadeIn 0.15s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
`;

const RevRebelLogo = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1180 174.8" className={className}>
    <path fill="currentColor" d="M634,41.5c.5,0,1,0,1.4,0,24.9,0,49.9,0,74.8,0,2.8,0,4.9-1.5,4.7-5.1-.2-10.4,0-20.4,0-30.8,0-2.2-1.3-3.5-3.5-3.6-41.6,0-83.3-.1-124.9,0-1.9,.3-2.9,1.4-3.1,3.2,0,27.5,0,54.9,0,82.4,0,27.5-.1,55,0,82.5,.2,1.7,1.4,2.8,3.1,3,41.7,0,83.5,0,125.2,0,2.2-.2,3.3-2.1,3.1-4.2,0-10.3,0-20.7,0-31,.3-3.3-1.9-4.5-4.9-4.2-25.4,0-50.7,0-76.1,0-1.3,0-1.6-.4-1.6-1.6,0-.3,0-.6,0-.9,0-7.8,0-15.7,0-23.5,0-1.5,.3-1.7,1.7-1.8,16.1,0,32.2,.2,48.3,0,2.1-.2,3.2-1.9,3-3.9,0-10.4,0-20.9,0-31.3,0-2-.9-3.6-3-3.9-15.7-.3-31.5,0-47.2-.1-.4,0-.8,0-1.3,0-1.3,0-1.5-.3-1.6-1.6,0-7.2,0-14.3,0-21.5,0-.2,0-.4,0-.6,0-1.3,.3-1.6,1.7-1.6Z"/>
    <path fill="currentColor" d="M991.9,134c-26-.2-52,0-78,0-1.3,0-1.6-.4-1.7-1.6,0-7.9,0-15.8,0-23.7,0-1.2-.1-2.6,1.5-2.5,16.2-.1,32.4,.1,48.7,0,2.4-.2,3.3-2.3,3.1-4.5,0-10.1,0-20.1,0-30.2,.2-2.1-.6-4-2.9-4.3-16.2-.4-32.5,0-48.8-.2-1.7,0-1.5-1.4-1.5-2.6,0-6.6,0-13.3,0-19.9,0-2.8,0-2.8,2.8-2.8,25.4,0,50.7,.2,76.1,.2,2.9,0,4-2.1,3.8-4.7,0-10.6,.1-21.3,0-31.9-.2-2.4-2.5-3-4.6-3-41.2,0-82.3,0-123.5,0-2.1,.2-3.2,1.4-3.3,3.5,0,27.4,0,54.7,0,82.1,0,27,0,54,0,81,0,3.3,1.2,4.3,4.8,4.3,41,0,81.9,0,123,.4,2.8,0,3.9-2,3.7-4.5,0-10.1,0-20.2,0-30.4,.2-2.1-.7-4.3-3.1-4.4Z"/>
    <path fill="currentColor" d="M195.9,41.1c24.9,0,49.7,0,74.6,0,4,.6,3.5-2.4,3.3-4.8,0-10,0-20,0-30,.3-3.3-1.3-5.1-4.6-4.8-39.6,0-79.3,0-118.9,0-3.6,0-4.6,1-4.6,4.7,0,27.1,0,54.2,0,81.3,0,27.6,0,55.1,0,82.7,.1,1.8,1.2,3,3,3.2,40.2,0,80.4,0,120.6,0,2.8,0,4.5-1.1,4.5-4.6-.1-10.1,0-20.2,0-30.3,0-3.3-1.3-4.6-4.6-4.6-24.8,0-49.5,0-74.3,0-1.4,0-1.6-.3-1.6-1.7,0-8.2,0-16.4,0-24.5,0-1.4,.2-1.6,1.6-1.7,15.7,0,31.5,.2,47.3,0,2.2-.2,3-2.3,2.8-4.3,0-10.2,0-20.4,0-30.6,.3-3.4-1.8-4.5-4.8-4.5-15.1,0-30.2,0-45.3,0-1.4,0-1.5-.2-1.6-1.5,0-7.1,0-14.2,0-21.3q0-2.6,2.7-2.6Z"/>
    <path fill="currentColor" d="M432.6,2.3c-14.6-.6-29.4,0-44-.2-3-.2-4.6,1.1-5.1,3.9-8.6,34.4-16.3,69.2-25.5,103.4-.2,0-.4,0-.5,0-9.2-34.4-17.4-69.2-26.3-103.7-.7-2.8-1.8-3.6-4.7-3.6-15.1,.2-30.4-.4-45.5,.2-2.1,.4-2.5,2.5-1.8,4.2,17,54.6,34,109.1,51,163.7,.6,2.2,2.8,3.1,4.9,3.1,14.3,0,28.6,0,43,0,2.9,.2,4.6-1.5,5.2-4.1,17-54,34-108,51-162,.8-2,.9-4.4-1.6-5Z"/>
    <path fill="currentColor" d="M1133.4,137.2c-.2-1.9-1.4-3-3.3-3.2-26.4,0-52.7,0-79.1,0q-2.9,0-2.9-2.9c0-41.6,0-83.3,0-124.9,0-2.8-1.3-4.1-4.2-4.1-13.5,0-27,0-40.6,0-2.8,0-4.1,1.3-4.1,4,0,27.1,0,54.3,0,81.4,0,27.5,0,55,0,82.5,.1,1.9,1.4,3.2,3.3,3.3,42.2,0,84.3,0,126.5,0,3,0,4.3-1.2,4.3-4.1,0-10.7,0-21.4,0-32.1Z"/>
    <path fill="currentColor" d="M836.7,85.1c10.1-5.7,17.6-13.5,19.6-25,3.4-17.8-1.2-39.4-18.6-48.6-13.4-7.3-29-9.2-44.1-9.4-23.6-.1-47.1,0-70.7,0-2.3,.2-3.6,1.4-3.6,3.7,0,54.7,0,109.3,0,164,.1,2.3,1.4,3.5,3.7,3.6,23.8,0,47.7,0,71.5,0,15.7,0,31.7-2.8,45.3-10.8,17.5-9.5,22.9-30.2,19.4-48.5-2.5-14-10.3-22.2-22.5-29Zm-66.7-43.5c7.7,0,15.3,0,23,0,10.5,.2,18.2,5.3,16.2,16.5-1.3,8-10.5,10.3-17.6,10.3-7.2,0-14.4,0-21.5,0-1.7,0-1.9-.2-1.9-1.9,0-7.7,0-15.4,0-23,0-1.7,.2-1.9,1.9-1.9Zm40.8,82.4c-2.4,9.5-12.9,10.1-21.2,10-6.7,0-13.3,0-20,0-1.8,0-1.5-1.2-1.6-2.6,0-7.6,0-15.3,0-22.9,0-2.6,0-2.7,2.8-2.7,4.2,0,8.5,0,12.7,0,0,0,0,0,0-.1,4.5,.1,9,.2,13.5,.4,2.5,.1,4.9,.7,7.2,1.7,6.5,2.7,8.1,9.9,6.6,16.1Z"/>
    <path fill="currentColor" d="M109.6,104.9c-.7-1.4-.5-1.8,.9-2.4,24.4-9,35.5-34.2,29.9-58.5C135.7,18,110,1.5,84.1,2.1c-26.4-.1-52.8,0-79.3,0C2.6,1.9,.5,2.6,.2,5.2c-.3,54.3,0,108.7-.1,163,0,2.4,.4,4.9,3.3,5.1,14.2,0,28.3,0,42.5,0,2.5-.3,3.3-2.4,3.1-4.6,0-19.9,0-39.9,0-59.8,.1-.9,.4-1.3,1.4-1.3,3.5,0,7.1,0,10.6,0,1.3,0,1.7,1.2,2.2,2.1,9.3,20.3,18.6,40.6,27.9,60.8,.9,1.9,2.3,2.8,4.3,2.8,14.6,0,29.2,0,43.7,0,2,0,4.3-1.1,3.5-3.4-10.6-21.8-22.1-43.3-33-65Zm-22.9-35.7c-3.4,2.3-7.3,3.3-11.4,3.3-3.9,0-7.8,0-11.7,0s-8.6,0-12.8,0c-1.7,0-2-.2-2-1.9,0-9.1,0-18.2,0-27.2,0-1.5,.3-1.8,1.9-1.8,8.5,0,17,0,25.5,0,4.7,0,8.9,1.7,12.5,4.9,5.8,5.2,6.7,16.9-2,22.7Z"/>
    <path fill="currentColor" d="M580.4,169.8c-10.5-21.5-21.8-42.8-32.6-64.2-1.2-2.3-1.2-2.3,1.3-3.3,40.2-15.3,40.2-73.8,3.3-92.8-9.5-5.2-19.7-7.3-30.4-7.3-26.7-.1-53.5,0-80.2,0-3.2,.1-4,2.2-3.8,5.1,0,54.4,0,108.7,0,163.1,.2,2.3,2.3,3.4,4.5,3.1,13.3,0,26.5,0,39.8,0,2.3,.2,4.4-.8,4.5-3.2,0-20.3,0-40.6,0-60.9,0-1.3,.3-1.6,1.6-1.6,3.4,0,6.9,0,10.3,0,1.5-.1,1.9,1.2,2.4,2.3,9.3,20.2,18.6,40.4,27.8,60.6,.9,1.9,2.2,2.9,4.4,2.9,14.6,0,29.2,0,43.7,0,2.1,0,4.3-1.2,3.4-3.5Zm-49.4-111.8c-.6,10.1-9.7,14.5-18,14.5-8,0-16.1,0-24.1,0-.8,0-2.1,0-2.1-1-.1-9.3,0-18.6,0-27.9,0-1.9,.2-2.1,2.1-2.1,8.3,0,16.7,0,25,0,9.2,0,18,6.8,17.1,16.4Z"/>
    <ellipse fill="currentColor" cx="1158.2" cy="150.5" rx="21.8" ry="21.1"/>
  </svg>
);

const BRAND_COLORS = {
  primary: "#163666",
  teal: "#047C97",
  cyan: "#00A6B6",
  aqua: "#71C9C5",
  powder: "#B2D3DE",
  yellow: "#FACA78",
  orange: "#F37D59",
  red: "#E05047",
  purple: "#8E456A",
  frost: "#EFF5F6",
  successGreen: "#00A6B6"
};

const DEFAULT_STATUS_COLORS = {
  'NOT STARTED': { bg: BRAND_COLORS.frost, fg: BRAND_COLORS.primary },
  'IN-PROGRESS': { bg: BRAND_COLORS.cyan, fg: '#FFFFFF' },
  'WAITING': { bg: BRAND_COLORS.yellow, fg: BRAND_COLORS.red },
  'ON-HOLD': { bg: BRAND_COLORS.powder, fg: BRAND_COLORS.primary },
  'COMPLETED': { bg: BRAND_COLORS.primary, fg: BRAND_COLORS.powder },
  'FUTURE TBD': { bg: BRAND_COLORS.purple, fg: BRAND_COLORS.orange },
  'SKIPPED': { bg: BRAND_COLORS.red, fg: BRAND_COLORS.powder }
};

function App({ data = [], updateItem, deleteItem, insertItem, moveItem, followLink }) {
  useEffect(() => {
    const styleId = "revrebel-direct-fonts";
    if (document.getElementById(styleId)) return;

    const styleTag = document.createElement("style");
    styleTag.id = styleId;
    styleTag.textContent = `
/* 1. Remote @font-face declarations MUST come first */
@font-face {
  font-family: 'Khand';
  font-style: normal;
  font-weight: 600 700;
  font-display: swap;
  src: url('https://fonts.gstatic.com/s/khand/v15/TwA0-mR39ThU2TMBMIFG.woff2') format('woff2');
}

@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2') format('woff2');
}

@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmVUlfBBc-.woff2') format('woff2');
}

/* 2. Fallbacks & CSS utility classes injected after */
${fontStyles}
`;
    document.head.appendChild(styleTag);

    // 3. Wait for DOM stylesheet parsing before triggering font checks
    if (document.fonts) {
      document.fonts.ready.then(() => {
        Promise.all([
          document.fonts.load('600 16px "Khand"'),
          document.fonts.load('700 16px "Khand"'),
          document.fonts.load('400 16px "Roboto"'),
          document.fonts.load('600 16px "Roboto"')
        ]).catch((error) => {
          console.warn("Some dashboard fonts failed to render:", error);
        });
      });
    }
  }, []);

  // --- Form Input States ---
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [projectEditValue, setProjectEditValue] = useState('');
  
  const [editingTeamIndex, setEditingTeamIndex] = useState(null);
  const [teamEditValues, setTeamEditValues] = useState({ fullName: '', email: '', emailOptIn: true });
  
  const [editingStatusIndex, setEditingStatusIndex] = useState(null);
  const [statusEditValues, setStatusEditValues] = useState({ label: '', bg: '', fg: '' });
  const [newColorLabel, setNewColorLabel] = useState('');
  const [newColorBg, setNewColorBg] = useState('');
  const [newColorFg, setNewColorFg] = useState('');

  const [editingPriorityIndex, setEditingPriorityIndex] = useState(null);
  const [priorityEditValues, setPriorityEditValues] = useState({ label: '', bg: '', fg: '' });
  const [newPriorityLabel, setNewPriorityLabel] = useState('');
  const [newPriorityBg, setNewPriorityBg] = useState('');
  const [newPriorityFg, setNewPriorityFg] = useState('');

  const [lastSyncTime, setLastSyncTime] = useState(() => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + " " + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  });

  // --- Header/Column Identification ---
  const headerRow = useMemo(() => {
    const h = data.find(d => d.index_ === 0);
    return h ? h.row : [];
  }, [data]);

  const COL_PROJECT_NAME = 0;
  const ROW_PROJECT_NAME = 1;
  const ROW_DASHBOARD_URL = 4;

  const COL_TEAM_FIRST = useMemo(() => {
    const idx = headerRow.indexOf("FIRST NAME");
    return idx !== -1 ? idx : 3;
  }, [headerRow]);

  const COL_TEAM_LAST = useMemo(() => {
    const idx = headerRow.indexOf("LAST NAME");
    return idx !== -1 ? idx : 4;
  }, [headerRow]);

  const COL_TEAM_FULL = useMemo(() => {
    const idx = headerRow.indexOf("FULL NAME");
    return idx !== -1 ? idx : 5;
  }, [headerRow]);

  const COL_TEAM_EMAIL = useMemo(() => {
    const idx = headerRow.indexOf("EMAIL");
    return idx !== -1 ? idx : 6;
  }, [headerRow]);

  const COL_TEAM_OPT_OUT = useMemo(() => {
    const idx = headerRow.indexOf("EMAIL OPT OUT");
    return idx !== -1 ? idx : 7;
  }, [headerRow]);

  const COL_STATUS_NAME = useMemo(() => {
    const idx = headerRow.indexOf("STATUS");
    return idx !== -1 ? idx : 13;
  }, [headerRow]);

  const COL_STATUS_BG = useMemo(() => {
    let idx = headerRow.indexOf("STATUS BG COLOR");
    if (idx === -1) idx = headerRow.indexOf("BACKGROUND HEX COLOR");
    return idx !== -1 ? idx : 14;
  }, [headerRow]);

  const COL_STATUS_FG = useMemo(() => {
    let idx = headerRow.indexOf("STATUS FONT COLOR");
    if (idx === -1) idx = headerRow.indexOf("FONT HEX COLOR");
    return idx !== -1 ? idx : 15;
  }, [headerRow]);

  const COL_PRIORITY_NAME = useMemo(() => {
    const idx = headerRow.indexOf("PRIORITY");
    return idx !== -1 ? idx : 18;
  }, [headerRow]);

  const COL_PRIORITY_BG = useMemo(() => {
    const idx = headerRow.indexOf("PRIORITY BG COLOR");
    return idx !== -1 ? idx : 19;
  }, [headerRow]);

  const COL_PRIORITY_FG = useMemo(() => {
    const idx = headerRow.indexOf("PRIORITY FONT COLOR");
    return idx !== -1 ? idx : 20;
  }, [headerRow]);

  // --- Data Parsing ---
  const projectName = useMemo(() => {
    const row = data.find(d => d.index_ === ROW_PROJECT_NAME);
    return row?.row[COL_PROJECT_NAME] || "NEW PROJECT";
  }, [data]);

  const dashboardUrl = useMemo(() => {
    const row = data.find(d => d.index_ === ROW_DASHBOARD_URL);
    return row?.row[COL_PROJECT_NAME] || "";
  }, [data]);

  const teamMembers = useMemo(() => {
    return data
      .filter(item => item.index_ > 0 && item.row && item.row[COL_TEAM_FULL])
      .map(item => {
        const optOutVal = item.row[COL_TEAM_OPT_OUT];
        const isOptOut = optOutVal === true || String(optOutVal).toUpperCase() === 'TRUE';
        return {
          index_: item.index_,
          fullName: item.row[COL_TEAM_FULL],
          email: item.row[COL_TEAM_EMAIL] || '',
          firstName: item.row[COL_TEAM_FIRST] || '',
          lastName: item.row[COL_TEAM_LAST] || '',
          emailOptOut: isOptOut,
        };
      });
  }, [data, COL_TEAM_FULL, COL_TEAM_EMAIL, COL_TEAM_FIRST, COL_TEAM_LAST, COL_TEAM_OPT_OUT]);

  const statusConfigs = useMemo(() => {
    return data
      .filter(item => item.index_ > 0 && item.row && item.row[COL_STATUS_NAME])
      .map(item => {
        const label = item.row[COL_STATUS_NAME];
        const defaultColors = DEFAULT_STATUS_COLORS[label] || { bg: BRAND_COLORS.frost, fg: BRAND_COLORS.primary };
        return {
          index_: item.index_,
          label: label,
          bg: item.row[COL_STATUS_BG] || defaultColors.bg,
          fg: item.row[COL_STATUS_FG] || defaultColors.fg,
        };
      });
  }, [data, COL_STATUS_NAME, COL_STATUS_BG, COL_STATUS_FG]);

  const priorityConfigs = useMemo(() => {
    return data
      .filter(item => item.index_ > 0 && item.row && item.row[COL_PRIORITY_NAME])
      .map(item => ({
        index_: item.index_,
        label: item.row[COL_PRIORITY_NAME],
        bg: item.row[COL_PRIORITY_BG] || BRAND_COLORS.frost,
        fg: item.row[COL_PRIORITY_FG] || BRAND_COLORS.primary,
      }));
  }, [data, COL_PRIORITY_NAME, COL_PRIORITY_BG, COL_PRIORITY_FG]);

  // --- Helpers ---
  const getContrastColor = (hex) => {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#') || hex.length < 7) return '#163666';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.55 ? '#163666' : '#FFFFFF';
  };

  const triggerSync = () => {
    const now = new Date();
    setLastSyncTime(now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + " " + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
  };

  const handleSaveProjectName = () => {
    const update = Array(1).fill(undefined);
    update[COL_PROJECT_NAME] = projectEditValue;
    updateItem(ROW_PROJECT_NAME, update);
    setIsEditingProjectName(false);
    triggerSync();
  };

  const handleStartEditTeam = (member) => {
    setEditingTeamIndex(member.index_);
    setTeamEditValues({
      fullName: member.fullName,
      email: member.email,
      emailOptIn: !member.emailOptOut
    });
  };

  const handleSaveTeamMember = (index_) => {
    const names = teamEditValues.fullName.trim().split(' ');
    const first = names[0] || '';
    const last = names.length > 1 ? names.slice(1).join(' ') : '';
    const maxCol = Math.max(COL_TEAM_EMAIL, COL_TEAM_OPT_OUT);
    const update = Array(maxCol + 1).fill(undefined);
    update[COL_TEAM_FIRST] = first;
    update[COL_TEAM_LAST] = last;
    update[COL_TEAM_FULL] = teamEditValues.fullName;
    update[COL_TEAM_EMAIL] = teamEditValues.email;
    update[COL_TEAM_OPT_OUT] = !teamEditValues.emailOptIn;
    updateItem(index_, update);
    setEditingTeamIndex(null);
    triggerSync();
  };

  const handleStartEditStatus = (config) => {
    setEditingStatusIndex(config.index_);
    setStatusEditValues({ label: config.label, bg: config.bg, fg: config.fg });
  };

  const handleSaveStatus = (index_) => {
    const update = Array(COL_STATUS_FG + 1).fill(undefined);
    update[COL_STATUS_NAME] = statusEditValues.label;
    update[COL_STATUS_BG] = statusEditValues.bg;
    update[COL_STATUS_FG] = statusEditValues.fg;
    updateItem(index_, update);
    setEditingStatusIndex(null);
    triggerSync();
  };

  const handleStartEditPriority = (config) => {
    setEditingPriorityIndex(config.index_);
    setPriorityEditValues({ label: config.label, bg: config.bg, fg: config.fg });
  };

  const handleSavePriority = (index_) => {
    const update = Array(COL_PRIORITY_FG + 1).fill(undefined);
    update[COL_PRIORITY_NAME] = priorityEditValues.label;
    update[COL_PRIORITY_BG] = priorityEditValues.bg;
    update[COL_PRIORITY_FG] = priorityEditValues.fg;
    updateItem(index_, update);
    setEditingPriorityIndex(null);
    triggerSync();
  };

  const handleAddTeamMember = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const fullName = formData.get('memberName');
    if (!fullName) return;

    const names = fullName.trim().split(' ');
    const first = names[0] || '';
    const last = names.length > 1 ? names.slice(1).join(' ') : '';
    const email = `${first.toLowerCase()}.${last.toLowerCase()}@revrebel.io`.replace(/\.\./g, '.');

    const emptyRow = data.find(d => d.index_ > 0 && d.row && !d.row[COL_TEAM_FULL]);
    const maxCol = Math.max(COL_TEAM_EMAIL, COL_TEAM_OPT_OUT);
    const update = Array(maxCol + 1).fill(undefined);
    update[COL_TEAM_FIRST] = first;
    update[COL_TEAM_LAST] = last;
    update[COL_TEAM_FULL] = fullName;
    update[COL_TEAM_EMAIL] = email;
    update[COL_TEAM_OPT_OUT] = false;

    if (emptyRow) {
      updateItem(emptyRow.index_, update);
    } else {
      insertItem(undefined, update);
    }
    
    e.currentTarget.reset();
    triggerSync();
  };

  const handleDeleteTeamMember = (index_) => {
    const maxCol = Math.max(COL_TEAM_EMAIL, COL_TEAM_OPT_OUT);
    const clearUpdate = Array(maxCol + 1).fill(undefined);
    clearUpdate[COL_TEAM_FIRST] = null;
    clearUpdate[COL_TEAM_LAST] = null;
    clearUpdate[COL_TEAM_FULL] = null;
    clearUpdate[COL_TEAM_EMAIL] = null;
    clearUpdate[COL_TEAM_OPT_OUT] = null;
    updateItem(index_, clearUpdate);
    triggerSync();
  };

  const handleAddStatus = (e) => {
    e.preventDefault();
    const label = newColorLabel.toUpperCase().trim();
    if (!label) return;

    const bg = newColorBg || '#FFFFFF';
    const fg = newColorFg || '#000000';

    const existing = statusConfigs.find(s => s.label === label);
    const update = Array(COL_STATUS_FG + 1).fill(undefined);
    update[COL_STATUS_NAME] = label;
    update[COL_STATUS_BG] = bg;
    update[COL_STATUS_FG] = fg;

    if (existing) {
      updateItem(existing.index_, update);
    } else {
      const emptyRow = data.find(d => d.index_ > 0 && d.row && !d.row[COL_STATUS_NAME]);
      if (emptyRow) {
        updateItem(emptyRow.index_, update);
      } else {
        insertItem(undefined, update);
      }
    }

    setNewColorLabel('');
    setNewColorBg('');
    setNewColorFg('');
    triggerSync();
  };

  const handleAddPriority = (e) => {
    e.preventDefault();
    const label = newPriorityLabel.toUpperCase().trim();
    if (!label) return;

    const bg = newPriorityBg || '#FFFFFF';
    const fg = newPriorityFg || '#000000';

    const existing = priorityConfigs.find(s => s.label === label);
    const update = Array(COL_PRIORITY_FG + 1).fill(undefined);
    update[COL_PRIORITY_NAME] = label;
    update[COL_PRIORITY_BG] = bg;
    update[COL_PRIORITY_FG] = fg;

    if (existing) {
      updateItem(existing.index_, update);
    } else {
      const emptyRow = data.find(d => d.index_ > 0 && d.row && !d.row[COL_PRIORITY_NAME]);
      if (emptyRow) {
        updateItem(emptyRow.index_, update);
      } else {
        insertItem(undefined, update);
      }
    }

    setNewPriorityLabel('');
    setNewPriorityBg('');
    setNewPriorityFg('');
    triggerSync();
  };

  if (!data || data.length === 0) return null;

  return (
    <div className="min-h-screen bg-[#EFF5F6] text-[#163666] font-roboto p-4 md:p-8 animate-in">
      <div className="max-w-7xl mx-auto">
        {/* Navigation / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#163666]/10 pb-6 mb-8">
          <div className="flex items-center gap-3">
            <RevRebelLogo className="h-[28px] w-auto text-[#163666]" />
            <div className="w-[1px] h-6 bg-[#163666]/30 hidden sm:block mx-2"></div>
            <div className="flex items-center gap-1.5 text-[#047C97]">
              <Sliders className="w-4 h-4" />
              <span className="font-khand font-bold text-xs uppercase tracking-wide">Configuration Settings</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {dashboardUrl && (
              <button 
                onClick={() => followLink(dashboardUrl)}
                className="font-khand font-bold px-4 py-2 bg-[#00A6B6] text-[#FACA78] border-2 border-[#00A6B6] uppercase text-xs tracking-wide hover:bg-[#163666] hover:border-[#163666] hover:text-[#B2D3DE] transition-all shadow-sm flex items-center gap-2"
              >
                Go to Playlist <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="flex items-center gap-2 bg-[#163666]/5 px-3 py-2 border border-[#163666]/20">
              <RefreshCw className="w-3.5 h-3.5 text-[#047C97]" />
              <span className="font-khand font-bold text-[10px] uppercase text-[#163666]/80">
                Synced: {lastSyncTime}
              </span>
            </div>
          </div>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="font-khand font-bold text-4xl uppercase tracking-tight text-[#163666]">
            Workspace Setup
          </h1>
          <p className="font-roboto text-[#163666]/70 text-sm mt-1">
            Manage global parameters, core team members, status color coding, and priorities.
          </p>
        </div>

        {/* Global Parameter Block */}
        <div className="bg-white p-6 border-3 border-[#163666] shadow-sm mb-8">
          <div className="flex items-center gap-2 mb-3 text-[#047C97]">
            <FileText className="w-4 h-4" />
            <span className="font-khand font-bold text-xs uppercase tracking-wider">Core Identity</span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="font-khand font-bold block text-[11px] text-[#163666] uppercase mb-1.5 tracking-wider">
                Project Title
              </label>
              <div className="flex items-end gap-3">
                <input 
                  type="text" 
                  value={isEditingProjectName ? projectEditValue : projectName} 
                  onChange={(e) => setProjectEditValue(e.target.value)}
                  disabled={!isEditingProjectName}
                  className={`font-khand font-bold flex-1 px-4 py-3 border-2 border-[#163666] text-[#163666] outline-none uppercase text-sm tracking-wide ${!isEditingProjectName ? 'bg-gray-50 opacity-80' : 'bg-white focus:ring-2 focus:ring-[#047C97]'}`}
                />
                <button 
                  onClick={() => {
                    if (isEditingProjectName) handleSaveProjectName();
                    else { setProjectEditValue(projectName); setIsEditingProjectName(true); }
                  }}
                  className="font-khand font-bold h-12 px-8 bg-[#163666] text-[#B2D3DE] uppercase text-xs tracking-widest hover:opacity-90 transition-opacity"
                >
                  {isEditingProjectName ? 'Save' : 'Edit'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Left Column: Team (60%) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white p-6 md:p-8 border-3 border-[#163666] shadow-sm h-full flex flex-col">
              <div className="flex items-center gap-3 border-b-2 border-[#163666]/10 pb-4 mb-6">
                <Users className="w-6 h-6 text-[#047C97]" />
                <h2 className="font-khand font-bold text-2xl uppercase tracking-wide">
                  Project Team Members
                </h2>
              </div>

              {/* Add Team Member Form */}
              <form onSubmit={handleAddTeamMember} className="p-4 md:p-6 bg-[#EFF5F6] border border-[#163666]/30 mb-6">
                <p className="font-khand font-bold text-xs text-[#163666] uppercase tracking-wider mb-4">Add New Resource</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <input 
                      type="text" 
                      name="memberName" 
                      required 
                      placeholder="Enter full name (e.g. Shawn Cioto)" 
                      className="font-roboto w-full h-11 px-3 bg-white border-2 border-[#163666] text-sm text-[#163666] outline-none focus:border-[#047C97]" 
                    />
                  </div>
                  <div>
                    <button 
                      type="submit" 
                      className="font-khand font-bold w-full h-11 text-[#B2D3DE] text-sm uppercase tracking-wider flex items-center justify-center hover:opacity-90 transition-opacity bg-[#163666]"
                    >
                      <Plus className="w-4 h-4 mr-1.5" /> Add Member
                    </button>
                  </div>
                </div>
              </form>

              {/* Team List */}
              <div className="grid grid-cols-1 gap-2">
                {teamMembers.map((member) => (
                  <div key={member.index_} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border-2 border-[#163666] hover:border-[#047C97] transition-all gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="font-khand font-bold w-10 h-10 bg-[#EFF5F6] flex items-center justify-center text-[#163666] text-lg uppercase border border-[#163666] shrink-0">
                        {member.fullName[0]}
                      </div>
                      <div className="flex-1">
                        {editingTeamIndex === member.index_ ? (
                          <div className="space-y-2 py-1">
                            <input 
                              className="font-khand font-bold block w-full px-2 py-1 text-xs border border-[#163666] uppercase" 
                              value={teamEditValues.fullName} 
                              onChange={e => setTeamEditValues({...teamEditValues, fullName: e.target.value})} 
                            />
                            <input 
                              className="font-roboto block w-full px-2 py-1 text-xs border border-[#163666]" 
                              value={teamEditValues.email} 
                              onChange={e => setTeamEditValues({...teamEditValues, email: e.target.value})} 
                            />
                            <label className="flex items-center gap-2 font-khand font-bold text-xs uppercase text-[#163666] cursor-pointer pt-1">
                              <input 
                                type="checkbox" 
                                checked={teamEditValues.emailOptIn} 
                                onChange={e => setTeamEditValues({...teamEditValues, emailOptIn: e.target.checked})} 
                                className="w-4 h-4 accent-[#00A6B6] border-2 border-[#163666]"
                              />
                              EMAIL OPT IN
                            </label>
                          </div>
                        ) : (
                          <>
                            <p className="font-khand font-bold text-[#163666] text-sm uppercase leading-none">{member.fullName}</p>
                            <p className="font-roboto text-xs text-[#163666]/60 mt-1.5">{member.email}</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <span className={`font-khand font-bold px-2.5 py-1 text-[10px] uppercase tracking-wider border ${
                        member.emailOptOut 
                          ? 'bg-[#E05047]/10 text-[#E05047] border-[#E05047]/30' 
                          : 'bg-[#00A6B6]/10 text-[#00A6B6] border-[#00A6B6]/30'
                      }`}>
                        {member.emailOptOut ? 'EMAIL OPT OUT' : 'EMAIL OPT IN'}
                      </span>
                      <button onClick={() => editingTeamIndex === member.index_ ? handleSaveTeamMember(member.index_) : handleStartEditTeam(member)} className="font-khand font-bold px-3 py-1.5 text-[10px] uppercase border border-[#163666]/20 hover:bg-[#163666] hover:text-[#B2D3DE] transition-all tracking-widest">
                        {editingTeamIndex === member.index_ ? 'Save' : 'Edit'}
                      </button>
                      <button onClick={() => handleDeleteTeamMember(member.index_)} className="p-2 text-[#163666]/30 hover:text-[#E05047] hover:bg-[#E05047]/5 transition-all" title={`Remove ${member.fullName}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {teamMembers.length === 0 && (
                  <div className="font-khand font-bold py-12 text-center border-2 border-dashed border-[#163666]/20 text-[#163666]/40 uppercase text-xs tracking-widest">
                    No team members defined
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Status & Priority Colors (40%) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Status Colors Section */}
            <div className="bg-white p-6 md:p-8 border-3 border-[#163666] shadow-sm flex flex-col">
              <div className="flex items-center gap-3 border-b-2 border-[#163666]/10 pb-4 mb-6">
                <Palette className="w-6 h-6 text-[#047C97]" />
                <h2 className="font-khand font-bold text-2xl uppercase tracking-wide">
                  Status Colors
                </h2>
              </div>

              {/* Status List */}
              <div className="space-y-2 mb-6 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                {statusConfigs.map((config) => (
                  <div 
                    key={config.label}
                    className="font-khand font-bold flex items-center justify-between p-3 border-2 border-[#163666] text-xs shadow-sm"
                    style={{ backgroundColor: config.bg, color: getContrastColor(config.bg) }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-4 h-4 border border-black/30 shrink-0 shadow-inner" style={{ backgroundColor: config.fg }} title="Font Color Selection" />
                      {editingStatusIndex === config.index_ ? (
                        <input className="font-khand font-bold bg-transparent border-b border-current outline-none uppercase tracking-wider w-24" value={statusEditValues.label} onChange={e => setStatusEditValues({...statusEditValues, label: e.target.value})} />
                      ) : (
                        <span className="uppercase tracking-wider truncate">{config.label}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="font-roboto text-[10px] shrink-0 opacity-90">
                        <span className="px-1.5 py-0.5 bg-white/80 text-[#163666] border border-black/10 font-mono">{config.bg}</span>
                      </div>
                      <button 
                        onClick={() => editingStatusIndex === config.index_ ? handleSaveStatus(config.index_) : handleStartEditStatus(config)} 
                        className="font-khand font-bold px-2 py-1 border text-[9px] uppercase tracking-widest hover:opacity-90 transition-opacity bg-[#163666] text-[#B2D3DE] border-[#163666]"
                      >
                        {editingStatusIndex === config.index_ ? 'Save' : 'Edit'}
                      </button>
                    </div>
                  </div>
                ))}
                {statusConfigs.length === 0 && (
                  <div className="font-khand font-bold py-8 text-center border-2 border-dashed border-[#163666]/20 text-[#163666]/40 uppercase text-xs tracking-widest">
                    No status colors mapped
                  </div>
                )}
              </div>

              {/* Add/Edit Status Form */}
              <form onSubmit={handleAddStatus} className="p-4 bg-[#EFF5F6] border border-[#163666]/30 space-y-4">
                <div className="flex items-center gap-2 text-[#163666]/80 border-b border-[#163666]/15 pb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <p className="font-khand font-bold text-xs text-[#163666] uppercase tracking-wider">Status Color Config</p>
                </div>

                <div>
                  <label className="font-khand font-bold block text-[10px] text-[#163666] mb-1 uppercase">Status Name</label>
                  <input 
                    type="text" 
                    value={newColorLabel}
                    onChange={(e) => setNewColorLabel(e.target.value)}
                    placeholder="e.g. IN-REVIEW" 
                    required 
                    className="font-khand font-bold w-full px-3 py-2 border-2 border-[#163666] text-xs outline-none bg-white uppercase text-[#163666] focus:border-[#047C97]" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-khand font-bold block text-[10px] text-[#163666] mb-1 uppercase">STATUS BG</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={newColorBg}
                        onChange={(e) => setNewColorBg(e.target.value)}
                        placeholder="#FFFFFF" 
                        className="font-roboto w-full px-3 py-2 border-2 border-[#163666] text-[11px] outline-none bg-white text-[#163666]" 
                      />
                      <input 
                        type="color" 
                        value={newColorBg.startsWith('#') && newColorBg.length === 7 ? newColorBg : '#ffffff'}
                        onChange={(e) => setNewColorBg(e.target.value)}
                        className="w-8 h-8 p-0 border-none cursor-pointer shrink-0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-khand font-bold block text-[10px] text-[#163666] mb-1 uppercase">STATUS FONT</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={newColorFg}
                        onChange={(e) => setNewColorFg(e.target.value)}
                        placeholder="#000000" 
                        className="font-roboto w-full px-3 py-2 border-2 border-[#163666] text-[11px] outline-none bg-white text-[#163666]" 
                      />
                      <input 
                        type="color" 
                        value={newColorFg.startsWith('#') && newColorFg.length === 7 ? newColorFg : '#000000'}
                        onChange={(e) => setNewColorFg(e.target.value)}
                        className="w-8 h-8 p-0 border-none cursor-pointer shrink-0"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="font-khand font-bold w-full py-2.5 text-[#B2D3DE] hover:opacity-90 transition-opacity text-xs uppercase tracking-widest bg-[#163666]"
                >
                  Save Status Color
                </button>
              </form>
            </div>

            {/* Priority Settings Block */}
            <div className="bg-white p-6 md:p-8 border-3 border-[#163666] shadow-sm flex flex-col">
              <div className="flex items-center gap-3 border-b-2 border-[#163666]/10 pb-4 mb-6">
                <Flag className="w-6 h-6 text-[#047C97]" />
                <h2 className="font-khand font-bold text-2xl uppercase tracking-wide">
                  Priority Colors
                </h2>
              </div>

              {/* Priority List */}
              <div className="space-y-2 mb-6 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                {priorityConfigs.map((config) => (
                  <div 
                    key={config.label}
                    className="font-khand font-bold flex items-center justify-between p-3 border-2 border-[#163666] text-xs shadow-sm"
                    style={{ backgroundColor: config.bg, color: getContrastColor(config.bg) }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-4 h-4 border border-black/30 shrink-0 shadow-inner" style={{ backgroundColor: config.fg }} title="Font Color Selection" />
                      {editingPriorityIndex === config.index_ ? (
                        <input className="font-khand font-bold bg-transparent border-b border-current outline-none uppercase tracking-wider w-24" value={priorityEditValues.label} onChange={e => setPriorityEditValues({...priorityEditValues, label: e.target.value})} />
                      ) : (
                        <span className="uppercase tracking-wider truncate">{config.label}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="font-roboto text-[10px] shrink-0 opacity-90">
                        <span className="px-1.5 py-0.5 bg-white/80 text-[#163666] border border-black/10 font-mono">{config.bg}</span>
                      </div>
                      <button 
                        onClick={() => editingPriorityIndex === config.index_ ? handleSavePriority(config.index_) : handleStartEditPriority(config)} 
                        className="font-khand font-bold px-2 py-1 border text-[9px] uppercase tracking-widest hover:opacity-90 transition-opacity bg-[#163666] text-[#B2D3DE] border-[#163666]"
                      >
                        {editingPriorityIndex === config.index_ ? 'Save' : 'Edit'}
                      </button>
                    </div>
                  </div>
                ))}
                {priorityConfigs.length === 0 && (
                  <div className="font-khand font-bold py-8 text-center border-2 border-dashed border-[#163666]/20 text-[#163666]/40 uppercase text-xs tracking-widest">
                    No priority colors mapped
                  </div>
                )}
              </div>

              {/* Add/Edit Priority Form */}
              <form onSubmit={handleAddPriority} className="p-4 bg-[#EFF5F6] border border-[#163666]/30 space-y-4">
                <div className="flex items-center gap-2 text-[#163666]/80 border-b border-[#163666]/15 pb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <p className="font-khand font-bold text-xs text-[#163666] uppercase tracking-wider">Priority Color Config</p>
                </div>

                <div>
                  <label className="font-khand font-bold block text-[10px] text-[#163666] mb-1 uppercase">Priority Name</label>
                  <input 
                    type="text" 
                    value={newPriorityLabel}
                    onChange={(e) => setNewPriorityLabel(e.target.value)}
                    placeholder="e.g. CRITICAL" 
                    required 
                    className="font-khand font-bold w-full px-3 py-2 border-2 border-[#163666] text-xs outline-none bg-white uppercase text-[#163666] focus:border-[#047C97]" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-khand font-bold block text-[10px] text-[#163666] mb-1 uppercase">PRIORITY BG</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={newPriorityBg}
                        onChange={(e) => setNewPriorityBg(e.target.value)}
                        placeholder="#FFFFFF" 
                        className="font-roboto w-full px-3 py-2 border-2 border-[#163666] text-[11px] outline-none bg-white text-[#163666]" 
                      />
                      <input 
                        type="color" 
                        value={newPriorityBg.startsWith('#') && newPriorityBg.length === 7 ? newPriorityBg : '#ffffff'}
                        onChange={(e) => setNewPriorityBg(e.target.value)}
                        className="w-8 h-8 p-0 border-none cursor-pointer shrink-0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-khand font-bold block text-[10px] text-[#163666] mb-1 uppercase">PRIORITY FONT</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={newPriorityFg}
                        onChange={(e) => setNewPriorityFg(e.target.value)}
                        placeholder="#000000" 
                        className="font-roboto w-full px-3 py-2 border-2 border-[#163666] text-[11px] outline-none bg-white text-[#163666]" 
                      />
                      <input 
                        type="color" 
                        value={newPriorityFg.startsWith('#') && newPriorityFg.length === 7 ? newPriorityFg : '#000000'}
                        onChange={(e) => setNewPriorityFg(e.target.value)}
                        className="w-8 h-8 p-0 border-none cursor-pointer shrink-0"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="font-khand font-bold w-full py-2.5 text-[#B2D3DE] hover:opacity-90 transition-opacity text-xs uppercase tracking-widest bg-[#163666]"
                >
                  Save Priority Color
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Global Footer info */}
        <div className="mt-12 pt-8 border-t border-[#163666]/10 flex justify-end opacity-40">
          <RevRebelLogo className="h-[20px] w-auto text-[#163666]" />
        </div>
      </div>
    </div>
  );
}