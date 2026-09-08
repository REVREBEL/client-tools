// src/lib/constants.ts

"use strict";
exports.__esModule = true;
exports.BRAND_COLORS = exports.PRIORITY_LEVELS = exports.CALENDAR_MONTHS = void 0;

exports.PRIORITY_LEVELS = [
    "CRITICAL",
    "MAJOR",
    "ELEVATED",
    "MEDIUM",
    "LOW"
];

export const BRAND_COLORS = {
  primary: "#163666",
  cyan: "#00A6B6",
  powder: "#B2D3DE",
  aqua: "#71c9c5",
  yellow: "#FACA78",
  orange: "#F37D59",
  red: "#E05047",
  purple: "#8E456A",
  frost: "#EFF5F6",
  successGreen: "#71c9c5",
  teal: "#047C97",
  smoke: "#FAFAFA"
} as const;


export const DEFAULT_STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  "NOT STARTED": { bg: "#EFF5F6", fg: "#163666" },
  "IN-PROGRESS": { bg: "#00A6B6", fg: "#FFFFFF" },
  "WAITING": { bg: "#FACA78", fg: "#E05047" },
  "VERIFICATION CHECKS": { bg: "#00A6B6", fg: "#FFFFFF" },
  "FAILED VERIFICATION": { bg: "#FACA78", fg: "#E05047" },
  "NO RESPONSE": { bg: "#F37D59", fg: "#E05047" },
  "ON-HOLD": { bg: "#B2D3DE", fg: "#163666" },
  "COMPLETED": { bg: "#163666", fg: "#B2D3DE" },
  "FUTURE TBD": { bg: "#8E456A", fg: "#F37D59" },
  "SKIPPED": { bg: "#E05047", fg: "#B2D3DE" },
};


// src/lib/constants.ts

export const CALENDAR_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const PRIORITY_LEVELS = [
  "CRITICAL",
  "MAJOR",
  "ELEVATED",
  "MEDIUM",
  "LOW",
] as const;



