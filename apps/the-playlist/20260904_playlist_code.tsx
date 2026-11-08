import React, { useEffect, useMemo, useState } from 'react';
import { 
  ChevronDown, 
  Edit2, 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  X, 
  Calendar, 
  BarChart3, 
  Layout, 
  AlertCircle,
  Star,
  Clock, 
  GripVertical,
  Move,
  ArrowUp,
  ArrowDown,
  PieChart,
  Settings,
  Notebook
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Configuration & Styling ---

const CALENDAR_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const BRAND_COLORS = {
  primary: "#163666",
  cyan: "#00A6B6",
  powder: "#B2D3DE",
  yellow: "#FACA78",
  orange: "#F37D59",
  red: "#E05047",
  purple: "#8E456A",
  frost: "#EFF5F6",
  successGreen: "#10b981",
  teal: "#047C97"
};

const DEFAULT_STATUS_COLORS = {
  "NOT STARTED": { bg: BRAND_COLORS.frost, fg: BRAND_COLORS.primary },
  "IN-PROGRESS": { bg: BRAND_COLORS.cyan, fg: "#FFFFFF" },
  "WAITING": { bg: BRAND_COLORS.yellow, fg: BRAND_COLORS.red },
  "VERIFICATION CHECKS": { bg: BRAND_COLORS.cyan, fg: "#FFFFFF" },
  "FAILED VERIFICATION": { bg: BRAND_COLORS.yellow, fg: BRAND_COLORS.red },
  "NO RESPONSE": { bg: BRAND_COLORS.orange, fg: BRAND_COLORS.red },
  "ON-HOLD": { bg: BRAND_COLORS.powder, fg: BRAND_COLORS.primary },
  "COMPLETED": { bg: BRAND_COLORS.primary, fg: BRAND_COLORS.powder },
  "FUTURE TBD": { bg: BRAND_COLORS.purple, fg: BRAND_COLORS.orange },
  "SKIPPED": { bg: BRAND_COLORS.red, fg: BRAND_COLORS.powder },
};

const fontStyles = `
  /* Local Fallback Overrides */
  @font-face { font-family: 'Fallback-Arial-Narrow'; src: local('Arial Narrow'); size-adjust: 105%; ascent-override: 90%; descent-override: 15%; }
  @font-face { font-family: 'Fallback-Bahnschrift'; src: local('Bahnschrift'); size-adjust: 95%; font-weight: 700; font-stretch: 88%; }
  /* Utility & Typography Classes */
  .font-khand { font-family: 'Khand', 'Fallback-Bahnschrift', 'Avenir Next Condensed', 'Oswald', 'Helvetica Neue Condensed', 'Franklin Gothic Demi Cond', 'Fallback-Arial-Narrow', sans-serif; font-weight: 700; }
  .font-roboto { font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif; }
  .border-3 { border-width: 3px; }
  .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  .animate-in { animation: fadeIn 0.15s ease-out; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
`;

// --- Module-Scoped Pure Helper Functions ---

const safeString = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    if (val.text !== undefined) return String(val.text);
    return JSON.stringify(val);
  }
  return String(val);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const str = safeString(dateStr).trim();
  if (['TBD', 'SKIPPED', 'PENDING', 'DATE', 'UNSCHEDULED'].includes(str.toUpperCase())) {
    return str;
  }
  const monthMatch = str.match(/(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d+)/i);
  if (monthMatch) {
    const month = monthMatch[1];
    const day = monthMatch[2];
    const formattedMonth = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
    return `${formattedMonth} ${day}`;
  }
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const mIdx = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    return `${CALENDAR_MONTHS[mIdx]} ${day}`;
  }
  return str;
};

const getCleanLetters = (str) => safeString(str).replace(/[^A-Za-z]/g, '').toUpperCase();

const extractSortIndex = (sortVal) => {
  if (!sortVal) return 0;
  const match = safeString(sortVal).match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
};

const extractPrefix = (sortVal) => {
  if (!sortVal) return '';
  const match = safeString(sortVal).match(/^([A-Z\s]+)/i);
  return match ? match[1].toUpperCase().trim() : '';
};

const getInitials = (name) => {
  const parts = safeString(name).trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatValue = (val) => (val === undefined || val === null ? 0 : val);

const toISODate = date => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateToView = (dateStr) => {
  const now = new Date();
  if (!dateStr) return now;
  const cleanStr = safeString(dateStr).trim();
  const isoMatch = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, 1);
  }
  const match = cleanStr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d+)/i);
  if (match) {
    const mName = match[1].toLowerCase();
    const mIdx = CALENDAR_MONTHS.findIndex(m => m.toLowerCase().startsWith(mName));
    if (mIdx !== -1) {
      return new Date(now.getFullYear(), mIdx, 1);
    }
  }
  return now;
};

const parsePickerDate = value => {
  if (!value) return new Date();
  const isoMatch = safeString(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  }
  const textMatch = safeString(value).match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d+)/i);
  if (textMatch) {
    const monthIndex = CALENDAR_MONTHS.findIndex(month => month.toLowerCase().startsWith(textMatch[1].toLowerCase()));
    if (monthIndex !== -1) return new Date(new Date().getFullYear(), monthIndex, Number(textMatch[2]));
  }
  return new Date();
};

const formatPickerLabel = value => {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(parsePickerDate(value));
};

// --- Priority Helper & Components ---



function PriorityMultiSelect({ priorities, selected, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const togglePriority = (p) => {
    if (selected.includes(p)) {
      onChange(selected.filter(item => item !== p));
    } else {
      onChange([...selected, p]);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-2 border-[2px] border-[#163666] bg-white px-4 py-2 font-khand font-bold text-xs text-[#163666] uppercase tracking-wider shadow-sm"
      >
        <span>PRIORITY {selected.length > 0 ? `(${selected.length})` : ''}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-48 bg-white border-[2px] border-[#163666] p-2 shadow-xl rounded-none">
          <div className="flex justify-between items-center mb-2 pb-1 border-b border-[#163666]/20">
            <span className="font-khand text-xs font-bold uppercase text-[#163666]">Filter Priority</span>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="font-khand text-[10px] font-bold text-[#E05047] uppercase hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
            {priorities.map(p => {
              const isChecked = selected.includes(p);
              return (
                <label key={p} className="flex items-center gap-2 px-2 py-1 hover:bg-[#EFF5F6] cursor-pointer font-khand text-xs font-bold uppercase text-[#163666]">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => togglePriority(p)}
                    className="accent-[#163666]"
                  />
                  <span>{p}</span>
                </label>
              );
            })}
            {priorities.length === 0 && (
              <div className="text-[10px] text-slate-400 p-2 text-center font-khand uppercase">No priorities found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const InteractiveLink = ({ url, followLink }) => {
  const [showCard, setShowCard] = useState(false);
  const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  const fileId = fileIdMatch ? fileIdMatch[1] : null;
  const thumbnailUrl = fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w500` : null;

  return (
    <span className="relative group inline-block">
      <button type="button" onClick={() => followLink && followLink(url)} className="text-cyan-600 font-semibold underline hover:text-cyan-700 transition-colors inline text-left break-all">
        {url}
      </button>
      <button type="button" onMouseEnter={() => setShowCard(true)} onMouseLeave={() => setShowCard(false)} className="ml-1 text-slate-400 hover:text-[#163666]">
        <Notebook className="w-3 h-3 inline" />
      </button>
      {showCard && (
        <span className="absolute left-0 bottom-full mb-2 w-72 bg-white border-[2px] border-[#163666] p-3 shadow-xl z-50 rounded-none animate-in fade-in zoom-in-95 duration-100">
          <span className="block text-[10px] font-bold font-khand text-[#047C97] uppercase tracking-wider mb-1">Spreadsheet Document Attachment</span>
          {thumbnailUrl && (
            <div className="mb-2 border border-slate-200 overflow-hidden bg-slate-50">
              <img src={thumbnailUrl} alt="Preview" className="w-full h-auto object-cover max-h-32" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
          )}
          <span className="block text-xs text-[#163666] font-medium break-all mb-2">{url}</span>
          <span className="block text-[9px] font-mono text-slate-400 leading-tight">This live asset is safely mapped directly within your Google Workbook database rows. Click the anchor address text above to open this target workspace view.</span>
        </span>
      )}
    </span>
  );
};

const renderTextWithLinks = (text, followLink) => {
  if (!text) return '';
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return <InteractiveLink key={i} url={part} followLink={followLink} />;
    }
    return part;
  });
};

function SearchableDependencySelect({ tasks, editingTaskId, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  
  const options = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return tasks
      .filter(task => task.id !== editingTaskId)
      .filter(task => {
        if (!normalizedQuery) return true;
        return [task.sort, task.action, task.status, task.tactical].some(field => safeString(field).toLowerCase().includes(normalizedQuery));
      })
      .sort((a, b) => a.sort.localeCompare(b.sort, undefined, { numeric: true, sensitivity: 'base' }));
  }, [tasks, editingTaskId, query]);

  const selectedTask = tasks.find(task => `${task.sort} ${task.action}` === value);
  
  const selectTask = task => {
    onChange(task ? `${task.sort} ${task.action}` : '');
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <input type="hidden" name="dependency" value={value} />
      <button type="button" onClick={() => setIsOpen(c => !c)} className="flex w-full items-center justify-between gap-3 border border-[#163666] bg-white px-4 py-2.5 text-left text-[#163666] rounded-none focus:outline-none">
        <span className="truncate font-roboto text-sm font-normal uppercase">
          {selectedTask ? `${selectedTask.sort} ${selectedTask.action} (${selectedTask.status})` : 'No Blocking Dependency'}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 z-[70] mb-1 overflow-hidden border-[2px] border-[#163666] bg-white shadow-2xl rounded-none">
          <div className="sticky top-0 border-b border-[#163666] bg-[#EFF5F6] p-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#163666]/60" />
              <input autoFocus type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search code, task, status, or group" className="w-full border border-[#163666] bg-white py-2 pl-9 pr-3 font-roboto text-sm font-normal uppercase text-[#163666] outline-none" />
            </div>
            <button type="button" onClick={() => setIsOpen(false)} className="p-1 text-[#163666] hover:bg-white transition-colors" aria-label="Close dropdown"><X className="w-5 h-5" /></button>
          </div>
          <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
            <button 
              type="button" 
              onClick={() => selectTask(null)} 
              className={`block w-full border-b border-slate-100 px-4 py-4 text-left font-khand text-xs font-bold uppercase transition-colors ${
                !value ? 'bg-[#163666] text-white' : 'text-[#E05047] bg-rose-50 hover:bg-rose-100'
              }`}
            >
              {value ? 'Remove Current Dependency' : 'No Blocking Dependency'}
            </button>
            {options.map(task => {
              const optVal = `${task.sort} ${task.action}`;
              const isSelected = value === optVal;
              return (
                <button key={task.id} type="button" onClick={() => selectTask(task)} className={`block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-[#EFF5F6] ${isSelected ? 'bg-[#163666] text-white' : 'text-[#163666]'}`}>
                  <span className="block font-khand text-xs font-bold uppercase">{task.sort} {task.action}</span>
                  <span className={`mt-0.5 block font-khand text-[10px] font-bold uppercase ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>{task.status} · {task.tactical || 'No Tactical Group'}</span>
                </button>
              );
            })}
            {options.length === 0 && (
              <div className="px-4 py-8 text-center font-khand text-xs font-bold uppercase text-slate-400">No matching action items</div>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="sticky bottom-0 block w-full border-t border-[#163666]/10 px-4 py-4 text-center font-khand text-sm font-bold uppercase text-[#163666] bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              Close Selection Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BetterDatePicker({ value, onChange }) {
  const selectedDate = parsePickerDate(value);
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const todayISO = toISODate(new Date());
  const selectedISO = value ? toISODate(parsePickerDate(value)) : '';
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1);
  gridStart.setDate(1 - firstOfMonth.getDay());
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
  const previousMonth = () => setVisibleMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setVisibleMonth(new Date(year, month + 1, 1));
  const selectDate = date => { onChange(toISODate(date)); setIsOpen(false); };
  const selectToday = () => {
    const today = new Date();
    onChange(toISODate(today));
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button type="button" onClick={() => setIsOpen(c => !c)} className="flex w-full items-center justify-between border border-[#163666] bg-white px-4 py-2 text-left text-[#163666] rounded-none">
        <span className={`font-roboto text-sm font-normal uppercase ${value ? 'text-[#163666]' : 'text-slate-400'}`}>
          {value ? formatPickerLabel(value) : 'Select Due Date'}
        </span>
        <Calendar className="h-4 w-4" />
      </button>
      {isOpen && (
        <div className="absolute right-0 z-[70] mt-1 border-[2px] border-[#163666] bg-white p-3 shadow-2xl rounded-none w-[225%] min-w-[320px]">
          <div className="mb-4 flex items-center justify-between bg-[#163666] px-3 py-2 text-[#B2D3DE]">
            <button type="button" onClick={previousMonth} className="px-2 font-khand text-lg font-bold">‹</button>
            <span className="font-khand text-base font-bold uppercase tracking-wider">{CALENDAR_MONTHS[month]} {year}</span>
            <button type="button" onClick={nextMonth} className="px-2 font-khand text-lg font-bold">›</button>
          </div>
          <div className="mb-1 grid grid-cols-7 gap-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={`${day}-${i}`} className="py-0 text-center font-khand text-xl font-bold uppercase text-slate-400">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(date => {
              const dateISO = toISODate(date);
              const isSelected = dateISO === selectedISO;
              const isToday = dateISO === todayISO;
              const isOutsideMonth = date.getMonth() !== month;
              return (
                <button key={dateISO} type="button" onClick={() => selectDate(date)} className={`flex aspect-square items-center justify-center border font-khand text-2xl font-bold transition-colors ${isSelected ? 'border-[#163666] bg-[#163666] text-[#B2D3DE]' : isToday ? 'border-[#00A6B6] bg-[#EFF5F6] text-[#163666]' : isOutsideMonth ? 'border-transparent text-slate-300 hover:bg-slate-50' : 'border-transparent text-[#163666] hover:bg-[#EFF5F6]'}`}>
                  {date.getDate()}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[#163666]/20 pt-3">
            <button type="button" onClick={() => { onChange(''); setIsOpen(false); }} className="font-khand text-xl font-bold uppercase text-[#E05047]">Clear</button>
            <button type="button" onClick={selectToday} className="bg-[#FACA78] px-3 pb-[5px] pt-[7px] font-khand text-xl font-bold uppercase text-[#E05047]">Today</button>
            <button type="button" onClick={() => setIsOpen(false)} className="font-khand text-xl font-bold uppercase text-[#163666]">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SortableSequencerTask({ task, position, total, disabled, onMove, getStatusStyle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, disabled });
  const rowStyle = { 
    transform: CSS.Transform.toString(transform), 
    transition, 
    opacity: isDragging ? 0.45 : 1, 
    zIndex: isDragging ? 10 : undefined 
  };

  return (
    <div ref={setNodeRef} style={rowStyle} className={`flex items-center gap-4 p-4 bg-white hover:bg-slate-50 transition-colors ${isDragging ? 'shadow-lg border-y border-[#163666]/30' : 'border-b border-[#163666]/10'}`}>
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-400 p-1 hover:text-[#163666] transition-colors">
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="flex items-center gap-1 shrink-0 bg-slate-100 border p-1 font-mono font-bold text-[10px]">
        <span className="px-1 text-[#163666]/60">{extractPrefix(task.sort)}</span>
        <select value={position} onChange={(event) => onMove(position, Number(event.target.value))} className="w-14 border bg-white px-1 py-1 text-center font-mono text-xs font-bold text-[#163666]" aria-label={`Sequence position for ${task.action}`}>
          {Array.from({ length: total }, (_, index) => (
            <option key={index + 1} value={index + 1}>{String(index + 1).padStart(3, '0')}</option>
          ))}
        </select>
      </div>
      <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
        <div className="col-span-6">
          <p className="font-bold text-sm text-[#163666] truncate uppercase">{safeString(task.action)}</p>
        </div>
        <div className="col-span-3">
          <div style={getStatusStyle(task.status)} className="px-2 pt-[5px] pb-[3px] text-[10px] font-bold font-khand uppercase tracking-wider text-center border shadow-sm truncate">
            {task.status}
          </div>
        </div>
        <div className="col-span-3 text-right flex flex-col items-end justify-center">
           <span className="text-[11px] font-bold font-khand uppercase text-[#163666]">
             {task.dueDate || 'No Date'}
           </span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button type="button" disabled={disabled || position === 1} onClick={() => onMove(position, position - 1)} className="p-1.5 border bg-white hover:bg-[#EFF5F6] disabled:opacity-30 text-[#163666]"><ArrowUp className="w-4 h-4" /></button>
        <button type="button" disabled={disabled || position === total} onClick={() => onMove(position, position + 1)} className="p-1.5 border bg-white hover:bg-[#EFF5F6] disabled:opacity-30 text-[#163666]"><ArrowDown className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

// --- Main App Entry Point ---

function App({ data = [], updateItem, deleteItem, insertItem, moveItem, followLink }) {
  useEffect(() => {
    const styleId = "revrebel-direct-fonts";
    if (document.getElementById(styleId)) return;

    // Inject direct @font-face definitions + fontStyles into document head
    const styleTag = document.createElement("style");
    styleTag.id = styleId;
    styleTag.textContent = `
      ${fontStyles}

      /* Khand (SemiBold & Bold) */
      @font-face {
        font-family: 'Khand';
        font-style: normal;
        font-weight: 600 700;
        font-display: swap;
        src: url('https://fonts.gstatic.com/s/khand/v15/TwA0-mR39ThU2TMBMIFG.woff2') format('woff2');
      }

      /* Roboto 400 (Regular) */
      @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-weight: 400;
        font-display: swap;
        src: url('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2') format('woff2');
      }

      /* Roboto 600 (SemiBold) */
      @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-weight: 600;
        font-display: swap;
        src: url('https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmVUlfBBc-.woff2') format('woff2');
      }
    `;
    document.head.appendChild(styleTag);

    // Trigger explicit browser font loading checks
    Promise.all([
      document.fonts.load('600 16px "Khand"'),
      document.fonts.load('700 16px "Khand"'),
      document.fonts.load('400 16px "Roboto"'),
      document.fonts.load('600 16px "Roboto"')
    ]).catch((error) => {
      console.warn("Some dashboard fonts failed to render:", error);
    });
  }, []);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStrategies, setExpandedStrategies] = useState({});
  const [expandedTasks, setExpandedTasks] = useState({});
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [personFilter, setPersonFilter] = useState('ALL');
  const [tacticalFilters, setTacticalFilters] = useState({});
  const [coreFilter, setCoreFilter] = useState('ALL');
  const [priorityFilters, setPriorityFilters] = useState([]);

  const [formStrategyVal, setFormStrategyVal] = useState('');
  const [formTacticalVal, setFormTacticalVal] = useState('');
  const [formSortNumVal, setFormSortNumVal] = useState('001');
  const [formStrategyError, setFormStrategyError] = useState('');
  const [formNumError, setFormNumError] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formDependency, setFormDependency] = useState('');
  const [formCoreFunction, setFormCoreFunction] = useState(false);
  const [formPriorityVal, setFormPriorityVal] = useState('');
  const [formRankVal, setFormRankVal] = useState('000');
  const [actionCount, setActionCount] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  const [sequencerStrategy, setSequencerStrategy] = useState('');
  const [sequencerOrderIds, setSequencerOrderIds] = useState([]);
  const [isSequencerSaving, setIsSequencerSaving] = useState(false);
  const [sequencerError, setSequencerError] = useState('');
  const [trackingSubTab, setTrackingSubTab] = useState('overview');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // --- Scan Headers ---
  const headerIdx = data.findIndex(d => d.row && d.row.some(cell => {
    const s = safeString(cell).toUpperCase();
    return s.includes("STRATEGY PARENT ITEM") || s.includes("MAIN STRATEGY");
  }));

  const headerRow = useMemo(() => {
    return headerIdx !== -1 ? data[headerIdx].row : (data[0]?.row || []);
  }, [data, headerIdx]);

  const taskCols = useMemo(() => {
    const row = headerRow;
    const getCol = (exactCands, fallback) => {
      let idx = row.findIndex(cell => exactCands.some(cand => safeString(cell).toUpperCase().trim() === cand.toUpperCase()));
      if (idx !== -1) return idx;
      idx = row.findIndex(cell => safeString(cell).toUpperCase().includes(exactCands[0].toUpperCase()));
      return idx !== -1 ? idx : fallback;
    };
    const taskStatusIdx = row.findIndex((cell, i) => i < 40 && safeString(cell).toUpperCase().trim() === "STATUS");
    return {
      strategy: getCol(["STRATEGY PARENT ITEM", "MAIN STRATEGY"], 5),
      tactical: getCol(["TACTICAL ITEM"], 6),
      lead: getCol(["TEAM LEAD", "ASSIGNED"], 7),
      action: getCol(["ACTION ITEM"], 8),
      actionDescription: getCol(["ACTION ITEM DESCRIPTION"], 9),
      notes: getCol(["NOTES"], 10),
      coreFunction: getCol(["CORE FUNCTION"], 11),
      dueDate: getCol(["DUE DATE"], 12),
      rank: getCol(["RANK"], 13),
      priority: getCol(["PRIORITY"], 14),
      status: taskStatusIdx !== -1 ? taskStatusIdx : 15,
      priorityBg: getCol(["PRIORITY BG COLOR", "PRIORITY BG"], -1),
      priorityFg: getCol(["PRIORITY FONT COLOR", "PRIORITY FONT"], -1),
      sort: getCol(["ITEM SORT", "ITEM NO"], 2),
      dependency: getCol(["ACTION ITEM DEPENDENCY"], 16)
    };
  }, [headerRow]);

  const teamCols = useMemo(() => {
    const row = headerRow;
    const findCol = (name, fallback) => {
      const idx = row.findIndex(c => safeString(c).toUpperCase().includes(name));
      return idx !== -1 ? idx : fallback;
    };
    return { first: findCol("FIRST NAME", 44), last: findCol("LAST NAME", 45), full: findCol("FULL NAME", 46), email: findCol("EMAIL", 47) };
  }, [headerRow]);

  const statusCols = useMemo(() => {
    const row = headerRow;
    const findCol = (candidates, fallback) => {
      const idx = row.findIndex(cell => candidates.some(cand => safeString(cell).toUpperCase().includes(cand.toUpperCase())));
      return idx !== -1 ? idx : fallback;
    };
    const statusTableStatusIdx = row.findIndex((cell, i) => i >= 40 && safeString(cell).toUpperCase().trim() === "STATUS");
    return {
      statusName: statusTableStatusIdx !== -1 ? statusTableStatusIdx : 54,
      bgHex: findCol(["STATUS BG COLOR", "BACKGROUND HEX COLOR", "BACKGROUND HEX"], 55),
      fgHex: findCol(["STATUS FONT COLOR", "FONT HEX COLOR", "FONT HEX"], 56)
    };
  }, [headerRow]);

  const targetHyperlink = useMemo(() => {
    const row5 = data.find(d => d.index_ === 4);
    if (row5 && row5.row && row5.row[2]) {
      const cellVal = safeString(row5.row[2]).trim();
      if (cellVal.toLowerCase().startsWith('http')) return cellVal;
    }
    const setupCol = (data[0]?.row || []).findIndex(c => safeString(c).toUpperCase().includes("WORKSPACE SETUP URL"));
    if (setupCol !== -1 && data[1]) {
      const val = safeString(data[1].row[setupCol]).trim();
      if (val.startsWith('http')) return val;
    }
    return '';
  }, [data]);

  const parsedStatusColors = useMemo(() => {
    const colors = { ...DEFAULT_STATUS_COLORS };
    data.forEach(item => {
      if (item.index_ === headerIdx) return;
      const r = item.row;
      if (!r) return;
      const statusName = safeString(r[statusCols.statusName]).toUpperCase().trim();
      if (statusName) {
        const bg = safeString(r[statusCols.bgHex]).trim();
        const fg = safeString(r[statusCols.fgHex]).trim();
        colors[statusName] = { 
          bg: bg || DEFAULT_STATUS_COLORS[statusName]?.bg || BRAND_COLORS.frost, 
          fg: fg || DEFAULT_STATUS_COLORS[statusName]?.fg || BRAND_COLORS.primary,
          index_: item.index_ 
        };
      }
    });
    return colors;
  }, [data, headerIdx, statusCols]);

  const parsedTasks = useMemo(() => {
    return data.filter(d => d.index_ !== headerIdx).map(item => {
      const r = item.row || [];
      const rawRank = taskCols.rank !== -1 ? r[taskCols.rank] : undefined;
      const rankNum = rawRank !== null && rawRank !== undefined && rawRank !== '' ? parseInt(safeString(rawRank), 10) : null;
      const formattedRank = rankNum !== null && !isNaN(rankNum) ? String(rankNum).padStart(3, '0') : (safeString(rawRank) ? safeString(rawRank).padStart(3, '0') : '');

      return {
        id: item.index_,
        index_: item.index_,
        strategy: safeString(r[taskCols.strategy]) || 'UNCATEGORIZED',
        tactical: safeString(r[taskCols.tactical]) || '',
        lead: safeString(r[taskCols.lead]) || 'UNASSIGNED',
        action: safeString(r[taskCols.action]).substring(0, 150),
        actionDescription: safeString(r[taskCols.actionDescription]) || '',
        notes: safeString(r[taskCols.notes]) || '',
        dueDate: formatDate(r[taskCols.dueDate]),
        coreFunction: r[taskCols.coreFunction] === true || safeString(r[taskCols.coreFunction]).toLowerCase() === 'true',
        rawDueDate: r[taskCols.dueDate],
        rank: formattedRank,
        priority: safeString(r[taskCols.priority]).trim(),
        priorityBg: safeString(taskCols.priorityBg !== -1 ? r[taskCols.priorityBg] : '').trim(),
        priorityFg: safeString(taskCols.priorityFg !== -1 ? r[taskCols.priorityFg] : '').trim(),
        status: (safeString(r[taskCols.status]) || 'NOT STARTED').toUpperCase().trim(),
        sort: safeString(r[taskCols.sort]) || '',
        dependency: safeString(r[taskCols.dependency]) || ''
      };
    }).filter(t => t.action && t.action.trim() !== "" && t.action.trim().toUpperCase() !== "ACTION ITEM");
  }, [data, headerIdx, taskCols]);

  const parsedTeam = useMemo(() => {
    const members = [];
    const seen = new Set();
    data.forEach(item => {
      if (item.index_ === headerIdx) return;
      const r = item.row;
      if (!r) return;
      const first = safeString(r[teamCols.first]).trim();
      const last = safeString(r[teamCols.last]).trim();
      const full = safeString(r[teamCols.full]).trim() || `${first} ${last}`.trim();
      if (full && full.toUpperCase() !== 'UNASSIGNED' && !seen.has(full)) {
        members.push({ index_: item.index_, fullName: full, email: safeString(r[teamCols.email]) });
        seen.add(full);
      }
    });
    if (members.length > 0) return members;
    const uniqueLeads = Array.from(new Set(parsedTasks.map(t => t.lead).filter(l => l && l.toUpperCase() !== 'UNASSIGNED'))).sort();
    return uniqueLeads.map((lead, idx) => ({ fullName: lead, email: `${lead.toLowerCase().replace(/\s+/g, '')}@example.com` }));
  }, [data, headerIdx, teamCols, parsedTasks]);

  const processedTasksList = useMemo(() => {
    const filtered = parsedTasks.filter(task => {
      const matchSearch = task.action.toLowerCase().includes(searchTerm.toLowerCase()) || task.strategy.toLowerCase().includes(searchTerm.toLowerCase()) || task.tactical.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || task.status === statusFilter;
      const matchPerson = personFilter === 'ALL' || task.lead === personFilter;
      const matchCore = coreFilter === 'ALL' || (coreFilter === 'CORE' && task.coreFunction);
      const matchPriority = priorityFilters.length === 0 || priorityFilters.includes(task.priority);
      return matchSearch && matchStatus && matchPerson && matchCore && matchPriority;
    });
    return filtered.sort((a, b) => a.sort.localeCompare(b.sort, undefined, { numeric: true, sensitivity: 'base' }));
  }, [parsedTasks, searchTerm, statusFilter, personFilter, coreFilter, priorityFilters]);

  const allPrioritiesList = useMemo(() => {
    const set = new Set();
    parsedTasks.forEach(t => { if (t.priority) set.add(t.priority); });
    return Array.from(set).sort();
  }, [parsedTasks]);

  const strategyGroupsList = useMemo(() => {
    const groups = {};
    processedTasksList.forEach(task => {
      const sName = task.strategy || 'UNCATEGORIZED';
      if (!groups[sName]) groups[sName] = { name: sName, tasks: [], total: 0, completed: 0 };
      groups[sName].tasks.push(task);
      groups[sName].total++;
      if (task.status.toUpperCase() === 'COMPLETED') groups[sName].completed++;
    });
    return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
  }, [processedTasksList]);

  const overallStats = useMemo(() => {
    const counts = { total: parsedTasks.length };
    Object.keys(parsedStatusColors).forEach(status => counts[status.toUpperCase()] = 0);
    parsedTasks.forEach(t => {
      const s = t.status.toUpperCase();
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [parsedTasks, parsedStatusColors]);

  const waitingOnHoldCount = useMemo(() => {
    return parsedTasks.filter(t => ['WAITING', 'ON-HOLD'].includes(t.status.toUpperCase())).length;
  }, [parsedTasks]);

  const blockingItemsCount = useMemo(() => {
    return parsedTasks.filter(task => {
      const blocksSomething = parsedTasks.some(t => {
        if (!t.dependency) return false;
        const match = String(t.dependency).trim().match(/^([A-Z]+0*\d+)/i);
        if (!match) return false;
        return match[1].toUpperCase() === task.sort.toUpperCase();
      });
      return blocksSomething && task.status !== 'COMPLETED';
    }).length;
  }, [parsedTasks]);

  const getDependencyStatus = (depStr) => {
    if (!depStr) return null;
    const match = depStr.trim().match(/^([A-Z]+0*\d+)/i);
    if (!match) return null;
    const blockCode = match[1].toUpperCase();
    const found = parsedTasks.find(t => t.sort.toUpperCase() === blockCode);
    return found ? found.status.toUpperCase() : null;
  };

  const trackingStats = useMemo(() => {
    const deps = parsedTasks.filter(t => t.dependency && t.dependency.trim() !== "");
    const metCount = deps.filter(t => getDependencyStatus(t.dependency) === 'COMPLETED').length;
    return { total: deps.length, metCount };
  }, [parsedTasks]);

  const metPercentage = useMemo(() => 
    trackingStats.total === 0 ? 100 : Math.round((trackingStats.metCount / trackingStats.total) * 100),
  [trackingStats]);

  const getStatCount = (key) => overallStats[key.toUpperCase()] || 0;

  const activeTacticalList = useMemo(() => Array.from(new Set(parsedTasks.map(t => t.tactical).filter(Boolean))).sort(), [parsedTasks]);

  const parentProgressList = useMemo(() => {
    const categories = {};
    parsedTasks.forEach(task => {
      const sName = task.strategy || 'UNCATEGORIZED';
      if (!categories[sName]) categories[sName] = { name: sName, total: 0, completed: 0 };
      categories[sName].total++;
      if (task.status.toUpperCase() === 'COMPLETED') categories[sName].completed++;
    });
    return Object.values(categories).map(s => ({ ...s, percentage: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0 })).sort((a, b) => a.name.localeCompare(b.name));
  }, [parsedTasks]);

  const teamProgressStats = useMemo(() => {
    return parsedTeam.map(member => {
      const userTasks = parsedTasks.filter(t => t.lead === member.fullName);
      return { 
        fullName: member.fullName, 
        total: userTasks.length, 
        notStarted: userTasks.filter(t => t.status.toUpperCase() === 'NOT STARTED').length, 
        waiting: userTasks.filter(t => t.status.toUpperCase() === 'WAITING').length, 
        inProgress: userTasks.filter(t => t.status.toUpperCase() === 'IN-PROGRESS').length, 
        completed: userTasks.filter(t => t.status.toUpperCase() === 'COMPLETED').length 
      };
    });
  }, [parsedTeam, parsedTasks]);

  const cycleStatus = (task, e) => {
    e.stopPropagation();
    const statuses = Object.keys(parsedStatusColors);
    const curIdx = statuses.indexOf(task.status.toUpperCase());
    if (curIdx === -1) return;
    const nextStatus = statuses[(curIdx + 1) % statuses.length];
    const originalRow = data.find(d => d.index_ === task.index_)?.row || [];
    const updatedRow = [...originalRow];
    updatedRow[taskCols.status] = nextStatus;
    updateItem(task.index_, updatedRow);
  };

  const getGroupPrefix = (tacticalName, allTasks, currentTaskId = null) => {
    if (!tacticalName) return 'TASK';
    const cleanStr = getCleanLetters(tacticalName);
    const defaultPrefix = cleanStr.substring(0, 4).padEnd(4, 'X');
    const tacticalToCodeMap = {};
    parsedTasks.forEach(t => {
      if (t.id === currentTaskId) return;
      const match = safeString(t.sort).match(/^([A-Z]{4})/i);
      if (match && t.tactical) tacticalToCodeMap[safeString(t.tactical).toUpperCase().trim()] = match[1].toUpperCase();
    });
    const normTac = safeString(tacticalName).toUpperCase().trim();
    if (tacticalToCodeMap[normTac]) return tacticalToCodeMap[normTac];
    return defaultPrefix;
  };

  const handleSaveTask = (e) => {
    e.preventDefault();
    if (formStrategyVal.trim().length < 10) return;
    const formData = new FormData(e.currentTarget);
    const tactical = formTacticalVal.trim();
    const prefix = getGroupPrefix(tactical, parsedTasks, editingTaskId);
    const finalSortCode = prefix + formSortNumVal.padStart(3, '0');
    
    const rowValues = [];
    rowValues[taskCols.strategy] = formStrategyVal.trim();
    rowValues[taskCols.tactical] = tactical;
    rowValues[taskCols.lead] = formData.get('lead');
    rowValues[taskCols.action] = String(formData.get('action') || '').substring(0, 150);
    rowValues[taskCols.actionDescription] = formData.get('actionDescription');
    rowValues[taskCols.notes] = formData.get('notes');
    rowValues[taskCols.coreFunction] = formCoreFunction;
    rowValues[taskCols.dueDate] = formDueDate;
    if (taskCols.rank !== -1) rowValues[taskCols.rank] = formRankVal;
    if (taskCols.priority !== -1) rowValues[taskCols.priority] = formPriorityVal;
    rowValues[taskCols.status] = formData.get('status');
    rowValues[taskCols.sort] = finalSortCode;
    rowValues[taskCols.dependency] = formDependency;

    if (editingTaskId !== null) updateItem(editingTaskId, rowValues);
    else insertItem(undefined, rowValues);

    setIsAddingTask(false);
    setEditingTaskId(null);
  };

  const handleSelectSequencerTab = () => {
    const selectionIsValid = activeTacticalList.includes(sequencerStrategy);
    if (!selectionIsValid) setSequencerStrategy(activeTacticalList[0] || '');
    setActiveTab('sequencer');
  };

  const sequencerTasksList = useMemo(() => {
    if (!sequencerStrategy) return [];
    return parsedTasks
      .filter(task => task.tactical.toUpperCase().trim() === sequencerStrategy.toUpperCase().trim())
      .sort((a, b) => a.sort.localeCompare(b.sort, undefined, { numeric: true, sensitivity: 'base' }));
  }, [parsedTasks, sequencerStrategy]);

  const sequencerTaskIdsKey = useMemo(() => sequencerTasksList.map(task => String(task.id)).sort().join('|'), [sequencerTasksList]);

  useEffect(() => {
    setSequencerOrderIds(currentIds => {
      const currentKey = currentIds.map(id => String(id)).sort().join('|');
      if (currentKey === sequencerTaskIdsKey) return currentIds;
      return sequencerTasksList.map(task => task.id);
    });
  }, [sequencerStrategy, sequencerTaskIdsKey, sequencerTasksList]);

  const orderedSequencerTasks = useMemo(() => {
    const taskMap = new Map(sequencerTasksList.map(task => [task.id, task]));
    const orderedTasks = sequencerOrderIds.map(id => taskMap.get(id)).filter(Boolean);
    const includedIds = new Set(orderedTasks.map(task => task.id));
    sequencerTasksList.forEach(task => { if (!includedIds.has(task.id)) orderedTasks.push(task); });
    return orderedTasks;
  }, [sequencerTasksList, sequencerOrderIds]);

  const persistSequenceOrder = async (orderedTasks) => {
    if (orderedTasks.length === 0) return;
    const prefix = getGroupPrefix(orderedTasks[0].tactical, parsedTasks);
    for (let index = 0; index < orderedTasks.length; index += 1) {
      const task = orderedTasks[index];
      const nextSortCode = prefix + String(index + 1).padStart(3, '0');
      if (task.sort === nextSortCode) continue;
      const originalRow = data.find(item => item.index_ === task.id)?.row || [];
      if (originalRow.length === 0) continue;
      const updatedRow = [...originalRow];
      updatedRow[taskCols.sort] = nextSortCode;
      await Promise.resolve(updateItem(task.id, updatedRow));
    }
  };

  const commitSequencerOrder = async (nextTasks) => {
    if (isSequencerSaving) return;
    const previousOrderIds = orderedSequencerTasks.map(task => task.id);
    setSequencerOrderIds(nextTasks.map(task => task.id));
    setSequencerError('');
    setIsSequencerSaving(true);
    try {
      await persistSequenceOrder(nextTasks);
    } catch (error) {
      setSequencerOrderIds(previousOrderIds);
      setSequencerError('The sequence could not be saved. The previous order was restored.');
    } finally {
      setIsSequencerSaving(false);
    }
  };

  const handleSequencerMove = (oldIndex, newIndex) => {
    if (isSequencerSaving || oldIndex === newIndex || newIndex < 0 || newIndex >= orderedSequencerTasks.length) return;
    const nextTasks = arrayMove([...orderedSequencerTasks], oldIndex, newIndex);
    void commitSequencerOrder(nextTasks);
  };

  const handleSequencerDragEnd = (event) => {
    const { active, over } = event;
    if (isSequencerSaving || !over || active.id === over.id) return;
    const oldIndex = orderedSequencerTasks.findIndex(task => String(task.id) === String(active.id));
    const newIndex = orderedSequencerTasks.findIndex(task => String(task.id) === String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    handleSequencerMove(oldIndex, newIndex);
  };

  const handleStrategyChange = (value) => {
    setFormStrategyVal(value);
    setFormStrategyError(value.trim().length < 10 ? 'Strategy parent item must be at least 10 characters.' : '');
  };

  const handleTacticalChange = (value, taskId = null) => {
    setFormTacticalVal(value);
    const sameGroup = parsedTasks.filter(t => t.tactical.toUpperCase().trim() === value.toUpperCase().trim() && t.id !== taskId);
    const maxVal = sameGroup.reduce((max, t) => {
      const num = extractSortIndex(t.sort);
      return num > max ? num : max;
    }, 0);
    setFormSortNumVal(String(maxVal + 1).padStart(3, '0'));
    setFormNumError('');
  };

  const handleSortNumChange = (numVal, currentTactical, taskId = null) => {
    const cleanedNum = numVal.replace(/\D/g, '').substring(0, 3);
    setFormSortNumVal(cleanedNum);
    const prefix = getGroupPrefix(currentTactical, parsedTasks, taskId);
    const fullCode = prefix + cleanedNum.padStart(3, '0');
    if (parsedTasks.some(t => t.id !== taskId && t.sort === fullCode)) setFormNumError(`Number code ${cleanedNum} is already in use within this sequence group!`);
    else setFormNumError('');
  };

  const openEditModalTrigger = (task, e) => {
    e.stopPropagation();
    setEditingTaskId(task.id);
    setFormStrategyVal(task.strategy);
    setFormTacticalVal(task.tactical);
    setFormSortNumVal(String(extractSortIndex(task.sort)).padStart(3, '0'));
    setFormStrategyError('');
    setActionCount(task.action ? task.action.length : 0);
    setFormNumError('');
    setFormDueDate(task.rawDueDate || task.dueDate || '');
    setFormCoreFunction(task.coreFunction || false);
    setFormPriorityVal(task.priority || '');
    setFormRankVal(task.rank ? String(task.rank).padStart(3, '0') : '000');
    setFormDependency(task.dependency || '');
    setViewDate(parseDateToView(task.dueDate));
    setShowDatePicker(false);
    setIsAddingTask(true);
  };

  const getStatusStyle = (status) => {
    const s = String(status || '').toUpperCase().trim();
    const style = parsedStatusColors[s];
    const hasBorder = ['ON-HOLD', 'NOT STARTED', 'NOT-STARTED', 'ON HOLD'].includes(s);
    if (style && style.bg && style.fg) {
      return {
        backgroundColor: style.bg,
        color: style.fg,
        borderColor: style.fg,
        borderWidth: hasBorder ? '2px' : '0px',
        borderStyle: hasBorder ? 'solid' : 'none'
      };
    }
    return {
      backgroundColor: '#163666',
      color: '#B2D3DE',
      borderColor: '#B2D3DE',
      borderWidth: hasBorder ? '2px' : '0px',
      borderStyle: hasBorder ? 'solid' : 'none'
    };
  };

  const priorityCols = useMemo(() => {
    const row = headerRow;
    const findCol = (candidates, fallback) => {
      const idx = row.findIndex(cell => candidates.some(cand => safeString(cell).toUpperCase().includes(cand.toUpperCase())));
      return idx !== -1 ? idx : fallback;
    };
    const priorityTablePriorityIdx = row.findIndex((cell, i) => i >= 40 && safeString(cell).toUpperCase().trim() === "PRIORITY");
    return {
      priorityName: priorityTablePriorityIdx !== -1 ? priorityTablePriorityIdx : 59,
      bgHex: findCol(["PRIORITY BG COLOR", "BACKGROUND HEX COLOR"], 60),
      fgHex: findCol(["PRIORITY FONT COLOR", "FONT HEX COLOR"], 61)
    };
  }, [headerRow]);

  const parsedPriorityColors = useMemo(() => {
    const colors = {};
    data.forEach(item => {
      if (item.index_ === headerIdx) return;
      const r = item.row;
      if (!r) return;
      const pName = safeString(r[priorityCols.priorityName]).toUpperCase().trim();
      if (pName) {
        const bg = safeString(r[priorityCols.bgHex]).trim();
        const fg = safeString(r[priorityCols.fgHex]).trim();
        if (bg || fg) {
          colors[pName] = { bg, fg };
        }
      }
    });
    return colors;
  }, [data, headerIdx, priorityCols]);

  const getPriorityStyle = (task) => {
    const p = safeString(task?.priority || task).toUpperCase().trim();
    const bg = task?.priorityBg || parsedPriorityColors[p]?.bg;
    const fg = task?.priorityFg || parsedPriorityColors[p]?.fg;

    if (bg && fg) {
      return {
        backgroundColor: bg,
        color: fg,
        border: 'none'
      };
    }
    return {
      backgroundColor: '#163666',
      color: '#B2D3DE',
      border: 'none'
    };
  };

  const displayProjectName = useMemo(() => {
    const projCol = (data[0]?.row || []).findIndex(c => safeString(c).toUpperCase().includes("PROJECT NAME"));
    if (projCol !== -1 && data[1]) return safeString(data[1].row[projCol]);
    return "PROJECT STRATEGY DASHBOARD";
  }, [data]);

  const getActiveStyles = (isActive) => isActive ? { backgroundColor: BRAND_COLORS.primary, color: '#B2D3DE' } : {};

  if (data.length === 0) return null;

  return (
    <>
      <div className="font-roboto min-h-screen bg-[#EFF5F6] text-[#163666] custom-scrollbar">
        <div className="max-w-[1800px] mx-auto p-4 md:p-6 lg:p-8 overflow-x-hidden">
        
        {/* Navigation & Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center h-[35px]">
            <svg id="a" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1180 174.8" className="h-full w-auto">
              <defs><style>{`.b{fill:#1c3766;}`}</style></defs>
              <path className="b" d="M634,41.5c.5,0,1,0,1.4,0,24.9,0,49.9,0,74.8,0,2.8,0,4.9-1.5,4.7-5.1-.2-10.4,0-20.4,0-30.8,0-2.2-1.3-3.5-3.5-3.6-41.6,0-83.3-.1-124.9,0-1.9,.3-2.9,1.4-3.1,3.2,0,27.5,0,54.9,0,82.4,0,27.5-.1,55,0,82.5,.2,1.7,1.4,2.8,3.1,3,41.7,0,83.5,0,125.2,0,2.2-.2,3.3-2.1,3.1-4.2,0-10.3,0-20.7,0-31,.3-3.3-1.9-4.5-4.9-4.2-25.4,0-50.7,0-76.1,0-1.3,0-1.6-.4-1.6-1.6,0-.3,0-.6,0-.9,0-7.8,0-15.7,0-23.5,0-1.5,.3-1.7,1.7-1.8,16.1,0,32.2,.2,48.3,0,2.1-.2,3.2-1.9,3-3.9,0-10.4,0-20.9,0-31.3,0-2-.9-3.6-3-3.9-15.7-.3-31.5,0-47.2-.1-.4,0-.8,0-1.3,0-1.3,0-1.5-.3-1.6-1.6,0-7.2,0-14.3,0-21.5,0-.2,0-.4,0-.6,0-1.3,.3-1.6,1.7-1.6Z" />
              <path className="b" d="M991.9,134c-26-.2-52,0-78,0-1.3,0-1.6-.4-1.7-1.6,0-7.9,0-15.8,0-23.7,0-1.2-.1-2.6,1.5-2.5,16.2-.1,32.4,.1,48.7,0,2.4-.2,3.3-2.3,3.1-4.5,0-10.1,0-20.1,0-30.2,.2-2.1-.6-4-2.9-4.3-16.2-.4-32.5,0-48.8-.2-1.7,0-1.5-1.4-1.5-2.6,0-6.6,0-13.3,0-19.9,0-2.8,0-2.8,2.8-2.8,25.4,0,50.7,.2,76.1,.2,2.9,0,4-2.1,3.8-4.7,0-10.6,.1-21.3,0-31.9-.2-2.4-2.5-3-4.6-3-41.2,0-82.3,0-123.5,0-2.1,.2-3.2,1.4-3.3,3.5,0,27.4,0,54.7,0,82.1,0,27,0,54,0,81,0,3.3,1.2,4.3,4.8,4.3,41,0,81.9,0,123,.4,2.8,0,3.9-2,3.7-4.5,0-10.1,0-20.2,0-30.4,.2-2.1-.7-4.3-3.1-4.4Z" />
              <path className="b" d="M195.9,41.1c24.9,0,49.7,0,74.6,0,4,.6,3.5-2.4,3.3-4.8,0-10,0-20,0-30,.3-3.3-1.3-5.1-4.6-4.8-39.6,0-79.3,0-118.9,0-3.6,0-4.6,1-4.6,4.7,0,27.1,0,54.2,0,81.3,0,27.6,0,55.1,0,82.7,.1,1.8,1.2,3,3,3.2,40.2,0,80.4,0,120.6,0,2.8,0,4.5-1.1,4.5-4.6-.1-10.1,0-20.2,0-30.3,0-3.3-1.3-4.6-4.6-4.6-24.8,0-49.5,0-74.3,0-1.4,0-1.6-.3-1.6-1.7,0-8.2,0-16.4,0-24.5,0-1.4,.2-1.6,1.6-1.7,15.7,0,31.5,.2,47.3,0,2.2-.2,3-2.3,2.8-4.3,0-10.2,0-20.4,0-30.6,.3-3.4-1.8-4.5-4.8-4.5-15.1,0-30.2,0-45.3,0-1.4,0-1.5-.2-1.6-1.5,0-7.1,0-14.2,0-21.3q0-2.6,2.7-2.6Z" />
              <path className="b" d="M432.6,2.3c-14.6-.6-29.4,0-44-.2-3-.2-4.6,1.1-5.1,3.9-8.6,34.4-16.3,69.2-25.5,103.4-.2,0-.4,0-.5,0-9.2-34.4-17.4-69.2-26.3-103.7-.7-2.8-1.8-3.6-4.7-3.6-15.1,.2-30.4-.4-45.5,.2-2.1,.4-2.5,2.5-1.8,4.2,17,54.6,34,109.1,51,163.7,.6,2.2,2.8,3.1,4.9,3.1,14.3,0,28.6,0,43,0,2.9,.2,4.6-1.5,5.2-4.1,17-54,34-108,51-162,.8-2,.9-4.4-1.6-5Z" />
              <path className="b" d="M1133.4,137.2c-.2-1.9-1.4-3-3.3-3.2-26.4,0-52.7,0-79.1,0q-2.9,0-2.9-2.9c0-41.6,0-83.3,0-124.9,0-2.8-1.3-4.1-4.2-4.1-13.5,0-27,0-40.6,0-2.8,0-4.1,1.3-4.1,4,0,27.1,0,54.3,0,81.4,0,27.5,0,55,0,82.5,.1,1.9,1.4,3.2,3.3,3.3,42.2,0,84.3,0,126.5,0,3,0,4.3-1.2,4.3-4.1,0-10.7,0-21.4,0-32.1Z" />
              <path className="b" d="M836.7,85.1c10.1-5.7,17.6-13.5,19.6-25,3.4-17.8-1.2-39.4-18.6-48.6-13.4-7.3-29-9.2-44.1-9.4-23.6-.1-47.1,0-70.7,0-2.3,.2-3.6,1.4-3.6,3.7,0,54.7,0,109.3,0,164,.1,2.3,1.4,3.5,3.7,3.6,23.8,0,47.7,0,71.5,0,15.7,0,31.7-2.8,45.3-10.8,17.5-9.5,22.9-30.2,19.4-48.5-2.5-14-10.3-22.2-22.5-29Zm-66.7-43.5c7.7,0,15.3,0,23,0,10.5,.2,18.2,5.3,16.2,16.5-1.3,8-10.5,10.3-17.6,10.3-7.2,0-14.4,0-21.5,0-1.7,0-1.9-.2-1.9-1.9,0-7.7,0-15.4,0-23,0-1.7,.2-1.9,1.9-1.9Zm40.8,82.4c-2.4,9.5-12.9,10.1-21.2,10-6.7,0-13.3,0-20,0-1.8,0-1.5-1.2-1.6-2.6,0-7.6,0-15.3,0-22.9,0-2.6,0-2.7,2.8-2.7,4.2,0,8.5,0,12.7,0,0,0,0,0,0-.1,4.5,.1,9,.2,13.5,.4,2.5,.1,4.9,.7,7.2,1.7,6.5,2.7,8.1,9.9,6.6,16.1Z" />
              <path className="b" d="M109.6,104.9c-.7-1.4-.5-1.8,.9-2.4,24.4-9,35.5-34.2,29.9-58.5C135.7,18,110,1.5,84.1,2.1c-26.4-.1-52.8,0-79.3,0C2.6,1.9,.5,2.6,.2,5.2c-.3,54.3,0,108.7-.1,163,0,2.4,.4,4.9,3.3,5.1,14.2,0,28.3,0,42.5,0,2.5-.3,3.3-2.4,3.1-4.6,0-19.9,0-39.9,0-59.8,.1-.9,.4-1.3,1.4-1.3,3.5,0,7.1,0,10.6,0,1.3,0,1.7,1.2,2.2,2.1,9.3,20.3,18.6,40.6,27.9,60.8,.9,1.9,2.3,2.8,4.3,2.8,14.6,0,29.2,0,43.7,0,2,0,4.3-1.1,3.5-3.4-10.6-21.8-22.1-43.3-33-65Zm-22.9-35.7c-3.4,2.3-7.3,3.3-11.4,3.3-3.9,0-7.8,0-11.7,0s-8.6,0-12.8,0c-1.7,0-2-.2-2-1.9,0-9.1,0-18.2,0-27.2,0-1.5,.3-1.8,1.9-1.8,8.5,0,17,0,25.5,0,4.7,0,8.9,1.7,12.5,4.9,5.8,5.2,6.7,16.9-2,22.7Z" />
              <path className="b" d="M580.4,169.8c-10.5-21.5-21.8-42.8-32.6-64.2-1.2-2.3-1.2-2.3,1.3-3.3,40.2-15.3,40.2-73.8,3.3-92.8-9.5-5.2-19.7-7.3-30.4-7.3-26.7-.1-53.5,0-80.2,0-3.2,.1-4,2.2-3.8,5.1,0,54.4,0,108.7,0,163.1,.2,2.3,2.3,3.4,4.5,3.1,13.3,0,26.5,0,39.8,0,2.3,.2,4.4-.8,4.5-3.2,0-20.3,0-40.6,0-60.9,0-1.3,.3-1.6,1.6-1.6,3.4,0,6.9,0,10.3,0,1.5-.1,1.9,1.2,2.4,2.3,9.3,20.2,18.6,40.4,27.8,60.6,.9,1.9,2.2,2.9,4.4,2.9,14.6,0,29.2,0,43.7,0,2.1,0,4.3-1.2,3.4-3.5Zm-49.4-111.8c-.6,10.1-9.7,14.5-18,14.5-8,0-16.1,0-24.1,0-.8,0-2.1,0-2.1-1-.1-9.3,0-18.6,0-27.9,0-1.9,.2-2.1,2.1-2.1,8.3,0,16.7,0,25,0,9.2,0,18,6.8,17.1,16.4Z" />
              <ellipse className="b" cx="1158.2" cy="150.5" rx="21.8" ry="21.1" />
            </svg>
          </div>
          <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-none w-fit border-[2px] border-[#163666]">
            <button onClick={() => setActiveTab('dashboard')} style={getActiveStyles(activeTab === 'dashboard')} className={`px-5 pt-[12px] pb-[10px] rounded-none text-base font-bold tracking-wide transition-all font-khand uppercase ${activeTab === 'dashboard' ? '' : 'text-slate-500 hover:text-[#163666]'}`}>STRATEGY ITEMS</button>
            <button onClick={() => setActiveTab('tracking')} style={getActiveStyles(activeTab === 'tracking')} className={`px-5 pt-[12px] pb-[10px] rounded-none text-base font-bold tracking-wide transition-all font-khand uppercase ${activeTab === 'tracking' ? '' : 'text-slate-500 hover:text-[#163666]'}`}>Tracking Dashboard</button>
            <button onClick={() => handleSelectSequencerTab()} style={getActiveStyles(activeTab === 'sequencer')} className={`px-5 pt-[12px] pb-[10px] rounded-none text-base font-bold tracking-wide transition-all font-khand uppercase ${activeTab === 'sequencer' ? '' : 'text-slate-500 hover:text-[#163666]'}`}>Sequence Arranger</button>
            <button onClick={() => targetHyperlink && followLink(targetHyperlink)} className="px-5 pt-[12px] pb-[10px] rounded-none text-sm font-bold tracking-wide transition-all font-khand text-slate-500 hover:text-[#163666] uppercase"> Settings </button>
          </div>
        </div>

        {/* Identity Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight font-khand uppercase pt-[2px]" style={{ color: BRAND_COLORS.primary }}>{displayProjectName.toUpperCase()}</h1>
          </div>
          <button onClick={() => { setEditingTaskId(null); setFormStrategyVal(''); setFormSortNumVal('001'); setFormStrategyError(''); setFormNumError(''); setActionCount(0); const t = new Date(); setFormDueDate(toISODate(t)); setFormCoreFunction(false); setFormPriorityVal(''); setFormRankVal('000'); setFormDependency(''); setViewDate(t); setShowDatePicker(false); setIsAddingTask(true); }} className="flex items-center gap-2 px-5 pt-[14px] pb-[12px] rounded-none font-bold shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 font-khand tracking-wide uppercase" style={{ backgroundColor: BRAND_COLORS.primary, color: '#B2D3DE' }} >
            <Plus className="w-5 h-5" /><span className="pt-[2px]">New Task</span>
          </button>
        </div>

        {/* 8-Box Ribbon Layout */}
        {(activeTab === 'dashboard' || activeTab === 'tracking') && (
          <div className="bg-white p-[34px] border-[3px] border-[#163666] shadow-md rounded-none mb-8">
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="flex flex-col items-center justify-center text-center px-4 min-w-[150px]">
                <span className="text-5xl md:text-6xl lg:text-8xl font-black font-khand tracking-normal leading-none" style={{ color: BRAND_COLORS.primary }}>{formatValue(overallStats.total)}</span>
                <span className="text-lg md:text-xl font-bold tracking-[0.1em] font-khand uppercase -mt-2 md:-mt-3 pt-[2px]" style={{ color: BRAND_COLORS.primary }}>Action Items</span>
              </div>
              <div className="hidden lg:block w-1.5 h-24 self-center" style={{ backgroundColor: BRAND_COLORS.primary }} />
              <div className="flex-1 w-full flex flex-wrap gap-2">
                {Object.keys(parsedStatusColors).map(status => {
                  const count = getStatCount(status);
                  const upper = status.toUpperCase();
                  const isAlwaysShown = upper === 'COMPLETED' || upper === 'IN-PROGRESS' || upper === 'IN PROGRESS';
                  if (count === 0 && !isAlwaysShown) return null;

                  const style = getStatusStyle(status);
                  let label = status.toLowerCase();
                  if (upper === 'VERIFICATION CHECKS') label = 'verifying';
                  if (upper === 'FAILED VERIFICATION') label = 'failed';

                  return (
                    <div key={status} className="flex-1 min-w-[80px] aspect-square flex flex-col items-center justify-center p-1.5 text-center rounded-none" style={{ backgroundColor: style.backgroundColor }}>
                      <span className="text-3xl sm:text-4xl md:text-5xl font-black font-khand leading-none tracking-normal" style={{ color: style.color }}>{formatValue(count)}</span>
                      <span className="text-[10px] sm:text-xs font-bold font-khand uppercase tracking-wider -mt-1 pt-[2px] leading-tight break-words max-w-full px-0.5" style={{ color: style.color }}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TRACKING VIEW METRICS */}
        {activeTab === 'tracking' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex justify-center mb-8">
              <div className="flex border-[2px] border-[#163666] bg-slate-200/50 p-1 rounded-none">
                <button onClick={() => setTrackingSubTab('overview')} style={getActiveStyles(trackingSubTab === 'overview')} className={`px-6 pt-[12px] pb-[10px] font-khand font-bold text-sm transition-all rounded-none uppercase ${trackingSubTab === 'overview' ? '' : 'text-slate-500 hover:text-[#163666]'}`}>Overview</button>
                <button onClick={() => setTrackingSubTab('team-progress')} style={getActiveStyles(trackingSubTab === 'team-progress')} className={`px-6 pt-[12px] pb-[10px] font-khand font-bold text-sm transition-all rounded-none uppercase ${trackingSubTab === 'team-progress' ? '' : 'text-slate-500 hover:text-[#163666]'}`}>Team Progress</button>
              </div>
            </div>
            {trackingSubTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 max-w-[280px] w-full mx-auto lg:mx-0 space-y-4 flex flex-col justify-start">
                  <div className="bg-white p-[30px] border-[3px] border-[#163666] rounded-none flex flex-col justify-center aspect-square w-full">
                    <div className="flex flex-col h-full justify-center -space-y-2">
                      <span className="text-[7.5rem] font-black font-khand text-[#163666] leading-none tracking-tight -mb-2">{formatValue(blockingItemsCount)}</span>
                      <div className="text-4xl font-bold font-khand uppercase tracking-wide text-[#163666] leading-[0.8] pt-[4px]">BLOCKING<span className="block">ITEMS</span></div>
                    </div>
                  </div>
                  <div className="bg-white p-[30px] border-[3px] border-[#163666] rounded-none flex flex-col justify-center min-h-[160px] w-full">
                    <div className="flex flex-col h-full justify-center -space-y-1">
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="w-1/4 text-[7.5rem] font-black font-khand text-[#163666] leading-none tracking-tight shrink-0 pt-[4px] -mb-2">{formatValue(trackingStats.metCount)}</span>
                        <div className="w-2/4 flex flex-col justify-center pl-4 pr-1">
                          <span className="text-2xl font-normal font-roboto text-[#B2D3DE] text-right pr-1 pt-[2px] leading-none mb-1">{metPercentage}%</span>
                          <div className="w-full h-5 bg-[#B2D3DE] rounded-none overflow-hidden border border-[#163666]/20"><div className="h-full bg-[#163666]" style={{ width: `${metPercentage}%` }} /></div>
                        </div>
                      </div>
                      <div className="text-4xl font-bold font-khand uppercase tracking-wide text-[#163666] leading-[0.8] pt-[4px] mt-2">DEPENDENCIES<span className="block">MET</span></div>
                    </div>
                  </div>
                  <div className="bg-[#FACA78] p-[30px] border-[3px] border-[#FACA78] rounded-none flex flex-col justify-center aspect-square w-full">
                    <div className="flex flex-col h-full justify-center -space-y-2">
                      <span className="text-[7.5rem] font-black font-khand text-[#00A6B6] leading-none tracking-tight -mb-2">{formatValue(waitingOnHoldCount)}</span>
                      <div className="text-4xl font-bold font-khand uppercase tracking-wide text-[#00A6B6] leading-[0.8] pt-[4px]">WAITING<span className="block">ON-HOLD</span></div>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-3 space-y-6 w-full">
                  <div className="bg-white p-[42px] border-[3px] border-[#163666] shadow-sm rounded-none space-y-6">
                    <div className="border-b border-slate-100 pb-4"><h2 className="text-2xl font-bold font-khand uppercase tracking-wide pt-[2px]" style={{ color: BRAND_COLORS.primary }}>Progress by Parent Item</h2></div>
                    <div className="space-y-3">
                      {parentProgressList.map((parent, pIdx) => {
                        const radius = 18;
                        const circumference = 2 * Math.PI * radius;
                        const strokeDashoffset = circumference - (parent.percentage / 100) * circumference;
                        return (
                          <div key={pIdx} className="bg-white p-4 border-[2px] border-[#163666] flex items-center justify-between gap-4 rounded-none hover:border-cyan-600 transition-colors">
                            <div className="flex items-center gap-3"><span className="font-bold font-khand text-[#163666] tracking-wide text-base pt-[2px]">{safeString(parent.name).toUpperCase()}</span></div>
                            <div className="flex items-center gap-4 shrink-0">
                              <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 44 44">
                                <circle className="text-slate-100" strokeWidth="4" stroke="currentColor" fill="transparent" r={radius} cx="22" cy="22" />
                                <circle strokeWidth="4" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="square" stroke={BRAND_COLORS.primary} fill="transparent" r={radius} cx="22" cy="22" />
                              </svg>
                              <span className="text-xl font-bold font-khand text-slate-400 w-12 text-right pt-[2px]">{parent.percentage}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {trackingSubTab === 'team-progress' && (
              <div className="space-y-6">
                <div><h3 className="text-3xl font-bold font-khand uppercase tracking-wide text-[#163666] pt-[2px]">Team Progress</h3></div>
                <div className="space-y-4">
                  {teamProgressStats.map((teamStats, teamIdx) => {
                    const firstName = safeString(teamStats.fullName).split(' ')[0].toUpperCase();
                    return (
                      <div key={teamIdx} className="bg-white border-[3px] border-[#163666] p-4 flex flex-row items-center justify-between gap-4 rounded-none shadow-sm hover:border-cyan-600 transition-colors w-full h-[120px]">
                        <div className="flex items-center gap-4 h-full flex-1">
                          <div className="border-[2px] border-[#163666] px-4 pt-[10px] pb-[8px] flex flex-col items-center justify-center text-center bg-slate-50 h-full w-[120px] rounded-none shrink-0">
                            <span className="text-5xl font-extrabold font-khand text-[#163666] leading-none pt-[2px]">{formatValue(teamStats.total)}</span>
                            <span className="text-xs font-bold text-slate-500 font-khand uppercase tracking-wider mt-0.5 leading-none pt-[2px]">Total Items</span>
                          </div>
                          <div className="flex items-center gap-3 h-full justify-start">
                            <div className={`bg-[#EFF5F6] rounded-none text-center h-full aspect-square flex flex-col items-center justify-center shrink-0 ${teamStats.notStarted > 0 ? 'border-[2px] border-[#163666]' : 'border-0'}`}>
                              <span className="text-4xl font-bold font-khand leading-none text-[#163666] block pt-[2px]">{formatValue(teamStats.notStarted)}</span>
                              <span className="text-[10px] font-bold text-slate-400 font-khand uppercase block mt-0.5 leading-none pt-[2px]">Not Started</span>
                            </div>
                            <div className={`bg-[#FACA78] rounded-none text-center h-full aspect-square flex flex-col items-center justify-center shrink-0 ${teamStats.waiting > 0 ? 'border-[2px] border-[#163666]' : 'border-0'}`}><span className="text-4xl font-bold font-khand leading-none text-[#E05047] block pt-[2px]">{formatValue(teamStats.waiting)}</span><span className="text-[10px] font-bold text-[#E05047]/80 font-khand uppercase block mt-0.5 leading-none pt-[2px]">Waiting</span></div>
                            <div className={`bg-[#00A6B6] rounded-none text-center h-full aspect-square flex flex-col items-center justify-center shrink-0 ${teamStats.inProgress > 0 ? 'border-[2px] border-[#163666]' : 'border-0'}`}><span className="text-4xl font-bold font-khand leading-none text-[#FACA78] block pt-[2px]">{formatValue(teamStats.inProgress)}</span><span className="text-[10px] font-bold text-[#FACA78]/90 font-khand uppercase block mt-0.5 leading-none pt-[2px]">In Progress</span></div>
                            <div className={`bg-[#163666] rounded-none text-center h-full aspect-square flex flex-col items-center justify-center shrink-0 ${teamStats.completed > 0 ? 'border-[2px] border-[#163666]' : 'border-0'}`}><span className="text-4xl font-bold font-khand leading-none text-[#B2D3DE] block pt-[2px]">{formatValue(teamStats.completed)}</span><span className="text-[10px] font-bold text-[#B2D3DE]/90 font-khand uppercase block mt-0.5 leading-none pt-[2px]">Completed</span></div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 pr-4"><span className="text-4xl font-bold font-khand text-[#163666] uppercase tracking-wide block pt-[4px]">{firstName}</span></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SEQUENCE ARRANGER */}
        {activeTab === 'sequencer' && (
          <div className="space-y-6 bg-white p-8 border-[3px] border-[#163666] rounded-none animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div><h2 className="text-2xl font-bold font-khand uppercase tracking-wide pt-[2px]">Sequence Arranger</h2><p className="text-slate-500 text-xs mt-1">Select a tactical group, drag tasks, use the position dropdown, or click the arrows to reorder.</p></div>
              <div className="min-w-[240px]">
                <label className="block text-[11px] font-bold uppercase font-khand tracking-wider mb-1.5 pt-[2px]">Select Tactical Group</label>
                <select value={sequencerStrategy} onChange={(event) => { setSequencerStrategy(event.target.value); setSequencerError(''); }} className="w-full rounded-none border-[2px] border-[#163666] bg-white px-3 pb-[8px] pt-[10px] font-khand text-xs font-bold uppercase text-[#163666]">
                  {activeTacticalList.map(tactical => (
                    <option key={tactical} value={tactical}>{tactical.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>
            {isSequencerSaving && (
              <div className="flex items-center gap-2 text-[#163666] font-khand font-bold uppercase text-xs animate-pulse">
                <Clock className="w-4 h-4" /> Saving sequence…
              </div>
            )}
            {sequencerError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-xs font-bold font-khand uppercase">
                {sequencerError}
              </div>
            )}
            {orderedSequencerTasks.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed"><p className="text-slate-500 font-khand uppercase text-sm">No tasks assigned to this tactical item.</p></div>
            ) : (
              <div className="border-[2px] border-[#163666] rounded-none divide-y divide-[#163666]/30 overflow-hidden">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSequencerDragEnd}>
                  <SortableContext items={orderedSequencerTasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
                    {orderedSequencerTasks.map((task, index) => (
                      <SortableSequencerTask 
                        key={task.id} 
                        task={task} 
                        position={index + 1} 
                        total={orderedSequencerTasks.length} 
                        disabled={isSequencerSaving} 
                        getStatusStyle={getStatusStyle}
                        onMove={(oldPos, newPos) => handleSequencerMove(oldPos - 1, newPos - 1)} 
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </div>
        )}

        {/* --- STRATEGY ITEMS DASHBOARD CHANNELS --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Status Filter Buttons (Row 2) */}
            <div className="w-full flex flex-wrap justify-start items-center gap-2 pb-1 md:pb-0">
              <button onClick={() => setStatusFilter('ALL')} style={getActiveStyles(statusFilter === 'ALL')} className={`px-4 pt-[10px] pb-[8px] rounded-none text-sm font-bold transition-all border-[2px] whitespace-nowrap font-khand uppercase tracking-wide text-left ${statusFilter === 'ALL' ? 'border-[#163666] shadow-sm' : 'bg-white text-[#163666] border-[#163666]/30 hover:bg-slate-50'}`}> ALL ITEMS </button>
              {Object.keys(parsedStatusColors).map(status => {
                const style = getStatusStyle(status);
                const isSelected = statusFilter === status;
                return (
                  <button key={status} onClick={() => setStatusFilter(status)} style={isSelected ? style : {}} className={`px-4 pt-[10px] pb-[8px] rounded-none text-sm font-bold transition-all border-[2px] whitespace-nowrap font-khand uppercase tracking-wide text-left ${isSelected ? 'shadow-sm font-bold' : 'bg-white text-[#163666] border-[#163666]/30 hover:bg-slate-50'}`}> {status} </button>
                );
              })}
            </div>

            {/* Parallel Search Bar and Filters (Row 3) */}
            <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-30">
              <div className="relative w-full lg:w-96 h-10 lg:h-14 self-start flex items-center">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="search actions, strategies, or descriptions" className="w-full h-full pl-10 pr-4 bg-white border border-[#163666] rounded-none focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-xs lowercase" />
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                {/* Multi-select PRIORITY Filter */}
                <PriorityMultiSelect priorities={allPrioritiesList} selected={priorityFilters} onChange={setPriorityFilters} />

                {/* Single CORE Filter Button */}
                <button
                  type="button"
                  onClick={() => setCoreFilter(prev => prev === 'CORE' ? 'ALL' : 'CORE')}
                  className={`flex items-center justify-center gap-1.5 px-4 py-2 border-[2px] border-[#163666] font-khand font-bold text-xs uppercase tracking-wider transition-colors shadow-sm ${
                    coreFilter === 'CORE'
                      ? 'bg-[#163666] text-[#B2D3DE]'
                      : 'bg-white text-[#163666] hover:bg-[#EFF5F6]'
                  }`}
                >
                  <Star className={`w-4 h-4 ${coreFilter === 'CORE' ? 'fill-[#B2D3DE] text-[#B2D3DE]' : 'fill-none text-[#163666]'}`} />
                  <span>CORE</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-4 items-center justify-start lg:justify-end min-w-0">
                <span className="font-khand font-bold text-3xl tracking-wider text-[#00A6B6] pt-[2px] shrink-0 uppercase mr-2">MEMBERS</span>
                <div className="flex gap-2 items-center flex-wrap pb-2 w-full sm:w-auto overflow-visible">
                  <button onClick={() => setPersonFilter('ALL')} className={`w-10 h-10 flex items-center justify-center rounded-full border-2 transition-all font-khand text-sm font-bold tracking-wide uppercase pt-[2px] shrink-0 ${personFilter === 'ALL' ? 'bg-[#00a6b6] text-[#faca78] border-[#00a6b6]' : 'bg-transparent text-[#00a6b6] border-[#00a6b6] hover:bg-[#EFF5F6]'}`} title="All Team Members"> ALL </button>
                  {parsedTeam.map((member, pIdx) => {
                    const initials = getInitials(member.fullName);
                    const isSelected = personFilter === member.fullName;
                    return (
                      <div key={pIdx} className="relative group shrink-0 hover:z-50">
                        <button onClick={() => setPersonFilter(member.fullName)} className={`w-10 h-10 flex items-center justify-center rounded-full border-2 transition-all font-khand text-lg font-bold tracking-wide uppercase pt-[2px] ${isSelected ? 'bg-[#00a6b6] text-[#faca78] border-[#00a6b6]' : 'bg-transparent text-[#00a6b6] border-[#00a6b6] hover:bg-[#EFF5F6]'}`}> {initials} </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap bg-[#163666] text-[#B2D3DE] px-2 py-1 text-[10px] font-bold font-khand uppercase tracking-wider z-50 shadow-xl border border-[#B2D3DE]/20 pointer-events-none">
                          {member.fullName}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {strategyGroupsList.map(group => {
                const isExp = !!expandedStrategies[group.name];

                // Only show tactical options that remain available after the
                // global search, status, and person filters have been applied.
                const tacticalsInGroup = Array.from(
                  new Set(
                    group.tasks
                      .map(task => safeString(task.tactical).toUpperCase().trim())
                      .filter(Boolean)
                  )
                ).sort();

                const requestedTactical = tacticalFilters[group.name];

                // Prevent an unavailable tactical selection from hiding every row.
                const activeTactical = tacticalsInGroup.includes(requestedTactical) ? requestedTactical : null;

                const tasksToRender = activeTactical ? group.tasks.filter(
                  task => safeString(task.tactical).toUpperCase().trim() === activeTactical
                ) : group.tasks;

                const progress = group.tasks.length > 0 ? Math.round(
                  (group.tasks.filter(task => task.status === 'COMPLETED').length / group.tasks.length) * 100
                ) : 0;

                return (
                  <div key={group.name} className="bg-white rounded-none shadow-md border-[3px] border-[#163666] overflow-hidden transition-shadow hover:shadow-lg">
                    <div onClick={() => setExpandedStrategies(p => ({ ...p, [group.name]: !isExp }))} className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/40 border-b border-slate-100">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`p-2 rounded-none transition-transform ${isExp ? 'rotate-0' : '-rotate-90'}`}><ChevronDown className="w-5 h-5 text-slate-400" /></div>
                        <div>
                          <div className="flex items-center flex-wrap gap-2">
                            <h3 className="font-bold text-slate-900 text-lg font-khand uppercase tracking-wide pt-[2px]" style={{ color: BRAND_COLORS.primary }}>{group.name.toUpperCase()}</h3>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] font-bold text-slate-400 tracking-wider font-khand uppercase pt-[2px]">{group.tasks.length} Action Items</span>
                            {group.completed > 0 && (
                              <div className="flex items-center gap-1.5">
                                <div className="w-16 h-1.5 bg-slate-100 rounded-none overflow-hidden"><div className="h-full" style={{ width: `${progress}%`, backgroundColor: BRAND_COLORS.cyan }} /></div>
                                <span className="text-[10px] font-bold font-khand uppercase pt-[2px]" style={{ color: BRAND_COLORS.cyan }}>{Math.round(progress)}% COMPLETE</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {isExp && (
                      <div>
                        {tacticalsInGroup.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 border-x-2 border-b border-[#163666]/20 bg-white px-5 py-3">
                            <span className="mr-1 font-khand text-xs font-bold uppercase tracking-wider text-[#163666]"> Filter by Tactical: </span>
                            <button
                              type="button"
                              onClick={() => setTacticalFilters(previous => ({ ...previous, [group.name]: null }))}
                              className={`border px-3 py-1 font-khand text-xs font-bold uppercase tracking-wide transition-colors ${
                                !activeTactical ? 'border-[#163666] bg-[#163666] text-[#B2D3DE]' : 'border-[#163666] bg-[#EFF5F6] text-[#163666] hover:bg-[#EFF5F6]/80'
                              }`}
                            >
                              All
                            </button>
                            {tacticalsInGroup.map(tactical => (
                              <button
                                key={tactical}
                                type="button"
                                onClick={() => setTacticalFilters(previous => ({ ...previous, [group.name]: previous[group.name] === tactical ? null : tactical }))}
                                className={`border px-3 py-1 font-khand text-xs font-bold uppercase tracking-wide transition-colors ${
                                  activeTactical === tactical ? 'border-[#163666] bg-[#163666] text-[#B2D3DE]' : 'border-[#163666] bg-[#EFF5F6] text-[#163666] hover:bg-[#EFF5F6]/80'
                                }`}
                              >
                                {tactical}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                          <thead className="bg-slate-50/40 border-b border-slate-100">
                            <tr>
                              <th className="px-6 pt-[18px] pb-[16px] text-sm font-bold text-[#163666] uppercase tracking-wider font-khand">Status</th>
                              <th className="px-6 pt-[18px] pb-[16px] text-sm font-bold text-[#163666] uppercase tracking-wider font-khand">Action Item Details</th>
                              <th className="px-4 py-4 text-sm font-bold text-[#163666] uppercase tracking-wider font-khand hidden sm:table-cell">Rank</th>
                              <th className="px-4 py-4 text-sm font-bold text-[#163666] uppercase tracking-wider font-khand hidden sm:table-cell">Priority</th>
                              <th className="px-6 py-4 text-sm font-bold text-[#163666] uppercase tracking-wider font-khand hidden md:table-cell">Lead Resource</th>
                              <th className="px-6 py-4 text-sm font-bold text-[#163666] uppercase tracking-wider font-khand hidden lg:table-cell">Due Date</th>
                              <th className="px-6 py-4 text-right text-sm font-bold text-[#163666] uppercase tracking-wider font-khand">Edit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {tasksToRender.map(task => {
                              const isTaskExpanded = !!expandedTasks[task.id];
                              const depStatus = getDependencyStatus(task.dependency);
                              const isBlocker = parsedTasks.some(other => other.dependency && other.dependency.toUpperCase().startsWith(task.sort.toUpperCase())) && task.status.toUpperCase() !== 'COMPLETED';
                              const isItemDone = ["COMPLETED", "FUTURE TBD", "SKIPPED"].includes(task.status.toUpperCase());

                              return (
                                <React.Fragment key={task.id}>
                                  <tr onClick={(task.notes || task.actionDescription) ? () => setExpandedTasks(prev => ({ ...prev, [task.id]: !isTaskExpanded })) : undefined} className="group hover:bg-slate-50/50 transition-colors cursor-pointer">
                                    <td className="px-6 py-4 align-middle">
                                      <button onClick={(e) => cycleStatus(task, e)} style={getStatusStyle(task.status)} className="flex items-center gap-2 px-3 pt-[8px] pb-[6px] rounded-none text-xs font-bold border transition-all hover:scale-105 active:scale-95 shadow-sm font-khand uppercase tracking-wider">{task.status}</button>
                                    </td>
                                    <td className="px-6 py-4 align-middle">
                                      <div className="flex flex-col">
                                        <div className="flex items-start gap-2">
                                          {task.coreFunction && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mt-0.5 shrink-0" />}
                                          <span className="font-roboto font-normal text-[#163666] text-sm leading-snug group-hover:text-cyan-600">{task.action}</span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                          {task.tactical && <span className="text-[10px] text-[#163666]/70 font-bold font-khand tracking-wider pt-[2px]">{task.tactical}</span>}
                                          {task.notes && <span className="text-[10px] bg-[#eff5f6] text-[#163666] font-bold px-1.5 pt-[4px] pb-[2px] rounded-none flex items-center gap-1 font-khand uppercase tracking-wide border border-[#163666]"><Notebook className="w-2.5 h-2.5" />Note</span>}
                                          {isBlocker && <span className="text-[10px] font-bold font-khand uppercase bg-[#e05047] text-[#B2D3dE] px-2 pt-[4px] pb-[2px] rounded-none">Blocking Item</span>}
                                          {task.dependency && depStatus && depStatus !== 'COMPLETED' && <span className="text-[10px] font-bold font-khand uppercase bg-[#8e456a] text-[#f37d59] px-2 pt-[4px] pb-[2px] rounded-none">Dependency Not Met</span>}
                                          {task.dependency && depStatus === 'COMPLETED' && !isItemDone && <span className="text-[10px] font-bold font-khand uppercase bg-[#f37d59] text-[#00a6b6] px-2 pt-[4px] pb-[2px] rounded-none">Item Dependency Met</span>}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 hidden sm:table-cell align-middle">
                                      {task.rank ? (
                                        <span className="inline-block border-[2px] border-[#163666] px-2 py-0.5 font-mono text-xs font-bold text-[#163666]">
                                          {String(task.rank).padStart(3, '0')}
                                        </span>
                                      ) : (
                                        <span className="text-slate-300 font-mono text-xs">-</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-4 hidden sm:table-cell align-middle">
                                      {task.priority ? (
                                        <span style={getPriorityStyle(task)} className="inline-block px-2.5 pt-[5px] pb-[3px] font-khand text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                          {task.priority}
                                        </span>
                                      ) : (
                                        <span className="text-slate-300 font-khand text-xs">-</span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 hidden md:table-cell align-middle">
                                      <div className="flex items-center gap-2 text-[#163666]"><div className="w-6 h-6 rounded-none bg-slate-100 border flex items-center justify-center pt-[2px] text-xs font-bold font-khand uppercase">{task.lead?.[0] || '?'}</div><span className="text-xs font-semibold">{task.lead.toUpperCase()}</span></div>
                                    </td>
                                    <td className="px-6 py-4 hidden lg:table-cell align-middle">
                                      <div className="flex items-center gap-2 text-[#163666]">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span className="text-xs font-bold uppercase">{task.dueDate}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-right align-middle">
                                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => openEditModalTrigger(task, e)} className="p-1.5 text-[#163666] hover:text-cyan-600"><Edit2 className="w-3.5 h-3.5" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); deleteItem(task.index_); }} className="p-1.5 text-[#163666] hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                      </div>
                                    </td>
                                  </tr>
                                  {isTaskExpanded && (task.actionDescription || task.notes) && (
                                    <tr className="bg-slate-50/30">
                                      <td colSpan={7} className="px-6 py-4">
                                        <div className="bg-white p-4 rounded-none border border-[#163666]/30 shadow-inner space-y-4">
                                          {task.actionDescription && (
                                            <div>
                                              <p className="text-[10px] font-bold text-[#163666]/60 uppercase tracking-widest flex items-center gap-1 font-khand mb-1 pb-16 pt-[2px]"><FileText className="w-3.5 h-3.5" /><span>Action Item Description</span></p>
                                              <p className="font-roboto font-normal text-xs text-[#163666] leading-relaxed whitespace-pre-wrap">{renderTextWithLinks(task.actionDescription, followLink)}</p>
                                            </div>
                                          )}
                                          {task.notes && (
                                            <div className="pt-3 border-t border-dashed">
                                              <p className="text-[10px] font-bold text-[#163666]/60 uppercase tracking-widest flex items-center gap-1 font-khand mb-1 pb-16 pt-[2px]"><Notebook className="w-3.5 h-3.5" /><span>Strategy Notes</span></p>
                                              <p className="font-roboto font-normal text-xs text-[#163666] leading-relaxed whitespace-pre-wrap">{renderTextWithLinks(task.notes, followLink)}</p>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Floating Summary Footer for Mobile Viewports */}
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#163666] text-[#B2D3DE] px-6 py-3 rounded-none shadow-2xl flex items-center gap-4 z-40 whitespace-nowrap border border-white/10">
          <div className="flex items-center gap-1.5 font-khand uppercase tracking-wide pt-[2px]">
            <div className="w-2 h-2 rounded-none bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold">{overallStats.COMPLETED || 0} COMPLETED</span>
          </div>
          <div className="w-[1px] h-3 bg-white/20" />
          <span className="text-xs font-bold text-slate-400 font-khand uppercase tracking-wide pt-[2px]">{overallStats.total} ACTIONS</span>
        </div>

      </div>

      {/* PARAMETERS MODAL DIALOG */}
      {isAddingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-none shadow-2xl w-full max-w-4xl my-8 overflow-hidden border-[3px] border-[#163666] animate-in fade-in zoom-in duration-150 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-baseline justify-between px-8 py-5 border-b border-[#163666]/30 shrink-0 bg-white">
              <h2 className="text-2xl font-bold font-khand uppercase tracking-wider text-[#163666] pt-[2px]">
                {editingTaskId !== null ? "Edit Tactical Action Item" : "Create Tactical Action Item"}
              </h2>
              <span className="text-[10px] text-slate-400 font-medium italic hidden sm:inline">
                Update and manage tactical execution items, dependencies, and schedules
              </span>
              <button type="button" onClick={() => { setIsAddingTask(false); setEditingTaskId(null); }} className="p-2 hover:bg-slate-100"><X className="w-6 h-6 text-[#163666]" /></button>
            </div>
            
            {/* Modal Form Container with Scrollable Area and Pinned Footer */}
            <form onSubmit={handleSaveTask} className="flex-1 flex flex-col overflow-hidden min-h-0 bg-white">
              <div className="flex-1 overflow-y-auto p-8 space-y-6 pb-64">
                {/* Row 1: Strategy Parent Item */}
                <div>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <label className="font-khand text-sm font-bold uppercase tracking-wider text-[#163666]"> Strategy Parent Item <span className="text-[#E05047] font-bold ml-0.5">*</span> </label>
                    <span className="text-[10px] text-slate-400 font-medium">Minimum 10+ characters</span>
                  </div>
                  <input type="text" name="strategy" required minLength={10} value={formStrategyVal} onChange={(e) => handleStrategyChange(e.target.value)} className={`w-full px-4 py-2 border rounded-none outline-none focus:ring-2 focus:ring-blue-500 text-sm font-roboto font-normal uppercase ${formStrategyError ? 'border-red-500 text-red-500 bg-red-50' : 'border-[#163666] text-[#163666]'}`} placeholder="Website Offers + Merchandising" />
                  {formStrategyError && <p className="text-[11px] text-red-500 font-bold font-khand mt-1 pt-[2px]">{formStrategyError}</p>}
                </div>

                {/* Row 2: Tactical Sub-Item & Team Lead */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-khand text-sm font-bold uppercase tracking-wider text-[#163666] mb-1.5"> Tactical Sub-Item <span className="text-[#E05047] font-bold ml-0.5">*</span> </label>
                    <input type="text" name="tactical" required value={formTacticalVal} onChange={(e) => handleTacticalChange(e.target.value, editingTaskId)} className="w-full px-4 py-2 border border-[#163666] rounded-none outline-none focus:ring-2 focus:ring-blue-500 text-sm font-roboto font-normal text-[#163666]" placeholder="Create Offer Copy" />
                  </div>
                  <div>
                    <label className="block font-khand text-sm font-bold uppercase tracking-wider text-[#163666] mb-1.5"> Team Lead <span className="text-[#E05047] font-bold ml-0.5">*</span> </label>
                    <div className="relative">
                      <select name="lead" defaultValue={editingTaskId !== null ? parsedTasks.find(t => t.id === editingTaskId)?.lead : "Unassigned"} className="w-full px-4 py-2.5 border border-[#163666] rounded-none outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-[#163666] appearance-none font-roboto font-normal uppercase">
                        <option value="Unassigned">Unassigned</option>
                        {parsedTeam.map((member, idx) => (
                          <option key={idx} value={member.fullName}> {member.fullName.toUpperCase()} </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#163666] pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Row 3: Sequence Group, Status, & Due Date Calendar */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                  <div className="md:col-span-6 border border-[#163666]/30 bg-[#EFF5F6]/40 p-3 rounded-none grid grid-cols-2 gap-3 h-[74px]">
                    <div>
                      <label className="block font-khand text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 whitespace-nowrap"> Sequence Group Prefix </label>
                      <div className="px-1 py-1 font-khand font-bold text-sm text-slate-600 tracking-wider"> {getGroupPrefix(formStrategyVal, parsedTasks, editingTaskId) || 'STRT'} </div>
                    </div>
                    <div>
                      <label className="block font-khand text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 whitespace-nowrap"> Sequence Number Portion <span className="text-[#E05047] font-bold ml-0.5">*</span> </label>
                      <input type="text" value={formSortNumVal} placeholder="001" maxLength={3} onChange={(e) => handleSortNumChange(e.target.value, formStrategyVal, editingTaskId)} className={`w-full px-2 py-1 border rounded-none outline-none font-roboto text-sm text-center font-normal text-[#163666] bg-white ${formNumError ? 'border-red-500 text-red-500 bg-red-50' : 'border-[#163666]'}`} />
                    </div>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block font-khand text-sm font-bold uppercase tracking-wider text-[#163666] mb-1.5"> Status <span className="text-[#E05047] font-bold ml-0.5">*</span> </label>
                    <div className="relative">
                      <select name="status" defaultValue={editingTaskId !== null ? parsedTasks.find(t => t.id === editingTaskId)?.status : Object.keys(parsedStatusColors)[0]} className="w-full px-4 py-2.5 border border-[#163666] rounded-none outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white uppercase font-roboto font-normal text-[#163666] appearance-none">
                        {Object.keys(parsedStatusColors).map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#163666] pointer-events-none" />
                    </div>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block font-khand text-sm font-bold uppercase tracking-wider text-[#163666] mb-1.5"> Due Date <span className="text-[#E05047] font-bold ml-0.5">*</span> </label>
                    <BetterDatePicker key={`due-date-${editingTaskId ?? 'new'}`} value={formDueDate} onChange={setFormDueDate} />
                  </div>
                </div>

                {/* Row 4: Action Item Title (Short Description) */}
                <div>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <label className="font-khand text-sm font-bold uppercase tracking-wider text-[#163666]"> Action Item Title (Short Description) <span className="text-[#E05047] font-bold ml-0.5">*</span> </label>
                    <span className="text-[10px] text-slate-400 font-medium"> {150 - actionCount} characters remaining </span>
                  </div>
                  <input type="text" name="action" required maxLength={150} onChange={(e) => setActionCount(e.currentTarget.value.length)} defaultValue={editingTaskId !== null ? parsedTasks.find(t => t.id === editingTaskId)?.action : ""} className="w-full px-4 py-2 border rounded-none outline-none focus:ring-2 focus:ring-blue-500 text-sm text-[#163666] font-roboto font-normal" placeholder="Review Copy & Offer Details" />
                </div>

                {/* Row 5: Action Item Description & Strategy Notes Textareas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-khand text-sm font-bold uppercase tracking-wider text-[#163666] mb-1.5 pb-6"> Action Item Description </label>
                    <textarea name="actionDescription" defaultValue={editingTaskId !== null ? parsedTasks.find(t => t.id === editingTaskId)?.actionDescription : ""} className="w-full px-4 py-2.5 border border-[#163666] rounded-none outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[140px] text-[#163666] font-roboto font-normal leading-relaxed" placeholder="- Who it is for&#10;- What the guest gets&#10;- How to book&#10;- Any restrictions" />
                  </div>
                  <div>
                    <label className="block font-khand text-sm font-bold uppercase tracking-wider text-[#163666] mb-1.5 pb-6"> Strategy Notes </label>
                    <textarea name="notes" defaultValue={editingTaskId !== null ? parsedTasks.find(t => t.id === editingTaskId)?.notes : ""} className="w-full px-4 py-2.5 border border-[#163666] rounded-none outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[140px] text-[#163666] font-roboto font-normal leading-relaxed" placeholder="Working Draft Version Link:&#10;https://docs.google.com/document/..." />
                  </div>
                </div>

                {/* Core Function, Priority, and Rank Section (3-Column Layout) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-[#EFF5F6]/40 p-5 border border-[#163666]/30">
                  <div>
                    <button 
                      type="button" 
                      onClick={() => setFormCoreFunction(!formCoreFunction)}
                      className="flex items-center gap-3 group focus:outline-none text-left w-full"
                    >
                      <div className={`p-2 border-[2px] transition-all shrink-0 ${formCoreFunction ? 'bg-[#163666] border-[#163666]' : 'bg-white border-[#163666]/30 group-hover:border-[#163666]'}`}>
                        <Star className={`w-5 h-5 transition-colors ${formCoreFunction ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
                      </div>
                      <div>
                        <p className="font-khand text-sm font-bold uppercase tracking-wider text-[#163666] leading-none mb-1">Core Function</p>
                        <p className="text-[10px] text-slate-400 font-medium">Flag for core reporting</p>
                      </div>
                    </button>
                  </div>

                  <div>
                    <label className="block font-khand text-sm font-bold uppercase tracking-wider text-[#163666] mb-1"> Priority </label>
                    <div className="relative">
                      <select name="priority" value={formPriorityVal} onChange={(e) => setFormPriorityVal(e.target.value)} className="w-full px-3 py-2 border border-[#163666] rounded-none outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white uppercase font-roboto font-normal text-[#163666] appearance-none">
                        <option value="">None / Unassigned</option>
                        {["CRITICAL", "MAJOR", "ELEVATED", "MEDIUM", "LOW"].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#163666] pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-khand text-sm font-bold uppercase tracking-wider text-[#163666] mb-1"> Rank Number </label>
                    <input
                      type="text"
                      name="rank"
                      value={formRankVal}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '');
                        setFormRankVal(digits ? String(parseInt(digits, 10)).padStart(3, '0') : '000');
                      }}
                      placeholder="000"
                      maxLength={4}
                      className="w-full px-3 py-2 border border-[#163666] rounded-none outline-none font-mono text-sm text-center font-bold text-[#163666] bg-white"
                    />
                  </div>
                </div>

                {/* Row 6: Action Item Dependency */}
                <div>
                  <label className="block font-khand text-sm font-bold uppercase tracking-wider text-[#163666] mb-1.5"> Action Item Dependency (Blocking item) </label>
                  <SearchableDependencySelect key={`dependency-${editingTaskId ?? 'new'}`} tasks={parsedTasks} editingTaskId={editingTaskId} value={formDependency} onChange={setFormDependency} />
                </div>
                <div className="h-16 shrink-0" />
              </div>
              {/* Pinned Action Buttons Footer Row */}
              <div className="flex items-center justify-between px-8 py-5 border-t border-[#163666]/20 bg-slate-50 shrink-0">
                <button type="button" onClick={() => { setIsAddingTask(false); setEditingTaskId(null); }} className="border-[2px] border-[#163666] text-[#163666] hover:bg-[#EFF5F6] transition-colors px-6 py-2 rounded-none font-khand font-bold text-sm uppercase tracking-wider focus:outline-none"> Discard Changes </button>
                <button type="submit" disabled={!!formStrategyError || !!formNumError || formStrategyVal.trim().length < 10} className="bg-[#163666] text-white hover:bg-[#163666]/90 transition-colors px-6 py-2.5 rounded-none font-khand font-bold text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none" style={{ color: '#B2D3DE' }}> Save Action Item </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </>
  );
}