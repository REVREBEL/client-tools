// src/components/MetricsRibbon.tsx
"use client";

import React from 'react';
import { formatValue } from '@/lib/utils';

export interface MetricsRibbonProps {
  overallStats: Record<string, number>;
  parsedStatusColors: Record<string, { bg: string; fg: string }>;
  getStatusStyle: (status: string) => React.CSSProperties;
}

export default function MetricsRibbon({
  overallStats,
  parsedStatusColors,
  getStatusStyle,
}: MetricsRibbonProps) {
  return (
    <div className="bg-white p-8.5 border-[3px] border-brand-primary shadow-md rounded-none mb-8 flex flex-col lg:flex-row items-center gap-6">
      {/* Total Count Box */}
      <div className="flex flex-col items-center justify-center text-center px-4 min-w-37.5">
        <span className="text-5xl md:text-6xl lg:text-8xl font-black font-khand tracking-normal leading-none text-brand-primary">
          {formatValue(overallStats.total)}
        </span>
        <span className="text-lg md:text-xl font-bold tracking-widest font-khand uppercase -mt-2 md:-mt-3 pt-0.5 text-brand-primary">
          Action Items
        </span>
      </div>

      {/* Divider Line */}
      <div className="hidden lg:block w-1.5 h-24 self-center bg-brand-primary" />

      {/* Dynamic Status Blocks */}
      <div className="flex-1 w-full flex flex-wrap gap-2">
        {Object.keys(parsedStatusColors).map((status) => {
          const count = overallStats[status.toUpperCase()] || 0;
          const upper = status.toUpperCase();

          // Always show Completed and In-Progress, even if 0. Hide others if 0.
          const isAlwaysShown =
            upper === 'COMPLETED' || upper === 'IN-PROGRESS' || upper === 'IN PROGRESS';
          if (count === 0 && !isAlwaysShown) return null;

          const style = getStatusStyle(status);

          // Format labels for specific lengthy statuses
          let label = status.toLowerCase();
          if (upper === 'VERIFICATION CHECKS') label = 'verifying';
          if (upper === 'FAILED VERIFICATION') label = 'failed';

          return (
            <div
              key={status}
              className="flex-1 min-w-20 aspect-square flex flex-col items-center justify-center p-1.5 text-center rounded-none"
              style={{ backgroundColor: style.backgroundColor }}
            >
              <span
                className="text-3xl sm:text-4xl md:text-5xl font-black font-khand leading-none tracking-normal"
                style={{ color: style.color }}
              >
                {formatValue(count)}
              </span>
              <span
                className="text-[10px] sm:text-xs font-bold font-khand uppercase tracking-wider -mt-1 pt-0.5 leading-tight wrap-break-words max-w-full px-0.5"
                style={{ color: style.color }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}