// src/lib/utils.ts

export const CALENDAR_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const safeString = (val: any) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    if (val.text !== undefined) return String(val.text);
    return JSON.stringify(val);
  }
  return String(val);
};

export const formatValue = (val: any) => (val === undefined || val === null ? 0 : val);

export const formatDate = (dateStr: any) => {
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

export const getCleanLetters = (str: any) => safeString(str).replace(/[^A-Za-z]/g, '').toUpperCase();

export const extractSortIndex = (sortVal: any) => {
  if (!sortVal) return 0;
  const match = safeString(sortVal).match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
};

export const extractPrefix = (sortVal: any) => {
  if (!sortVal) return '';
  const match = safeString(sortVal).match(/^([A-Z\s]+)/i);
  return match ? match[1].toUpperCase().trim() : '';
};

export const getInitials = (name: any) => {
  const parts = safeString(name).trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const toISODate = (date: Date) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseDateToView = (dateStr: any) => {
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

export const parsePickerDate = (value: any) => {
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

export const formatPickerLabel = (value: any) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(parsePickerDate(value));
};


/**
 * Generates or resolves a 4-character sequence group prefix based on the tactical item name.
 * Checks existing tasks to preserve established prefixes for matching tactical groups.
 *
 * @param tacticalName - Name of the tactical item or group.
 * @param tasks - Array of parsed task items.
 * @param currentTaskId - Optional ID of the task currently being edited to exclude from lookup.
 * @returns A 4-character uppercase group prefix code.
 */
export const getGroupPrefix = (
  tacticalName: string,
  tasks: Array<{ id: number; sort?: string; tactical?: string }>,
  currentTaskId?: number | null
): string => {
  if (!tacticalName || !tacticalName.trim()) return 'TASK';

  const cleanStr = safeString(tacticalName).replace(/[^A-Za-z]/g, '').toUpperCase();
  const defaultPrefix = cleanStr.substring(0, 4).padEnd(4, 'X');

  const tacticalToCodeMap: Record<string, string> = {};

  tasks.forEach((t) => {
    if (currentTaskId !== null && currentTaskId !== undefined && t.id === currentTaskId) {
      return;
    }
    const match = safeString(t.sort).match(/^([A-Z]{4})/i);
    if (match && t.tactical) {
      const normKey = safeString(t.tactical).toUpperCase().trim();
      tacticalToCodeMap[normKey] = match[1].toUpperCase();
    }
  });

  const normTac = safeString(tacticalName).toUpperCase().trim();
  if (tacticalToCodeMap[normTac]) {
    return tacticalToCodeMap[normTac];
  }

  return defaultPrefix;
};