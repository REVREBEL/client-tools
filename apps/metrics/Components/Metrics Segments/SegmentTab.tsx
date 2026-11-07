import React, { useMemo, useState } from "react";
import { Clock } from "lucide-react";

const BRAND_COLORS = {
  primary: "#163666",
  teal: "#047C97",
  cyan: "#00A6B6",
  aqua: "#71C9C5",
  powder: "#B2D3DE",
  frost: "#EFF5F6",
};

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Khand:wght@600;700&family=Roboto:wght@400;500;700&display=swap');
  .font-khand { font-family: 'Khand', sans-serif; }
  .font-roboto { font-family: 'Roboto', sans-serif; }
`;

type SegmentRow = {
  row?: unknown[];
};

type SegmentAccumulator = {
  metric: string;
  revenue: number;
  nights: number;
  leadSum: number;
  count: number;
};

type AggregatedSegment = SegmentAccumulator & {
  adr: number;
  avgLead: number;
};

type SegmentAnalysisTabProps = {
  data?: SegmentRow[];
};

const safeString = (value: unknown) =>
  value !== null && value !== undefined ? String(value).trim() : "";

const toNumber = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(Math.round(value));

const formatPreciseCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export default function SegmentAnalysisTab({
  data = [],
}: SegmentAnalysisTabProps) {
  const [selectedYear, setSelectedYear] = useState("2026");

  const aggregatedSegments = useMemo<AggregatedSegment[]>(() => {
    if (!data.length) return [];

    const headers = data[0]?.row ?? [];
    const yearColumn = headers.findIndex(
      (header) => safeString(header).toLowerCase() === "segment_year",
    );
    const metricColumn = headers.findIndex(
      (header) => safeString(header).toLowerCase() === "segment_metric",
    );
    const revenueColumn = headers.findIndex(
      (header) => safeString(header).toLowerCase() === "segment_revenue",
    );
    const nightsColumn = headers.findIndex(
      (header) => safeString(header).toLowerCase() === "segment_nights",
    );
    const leadColumn = headers.findIndex(
      (header) => safeString(header).toLowerCase() === "segment_lead_days",
    );

    const requiredColumns = [
      yearColumn,
      metricColumn,
      revenueColumn,
      nightsColumn,
      leadColumn,
    ];

    if (requiredColumns.some((column) => column < 0)) return [];

    const segmentMap: Record<string, SegmentAccumulator> = {};

    data.forEach((item, index) => {
      if (index <= 1 || !item.row) return;

      const row = item.row;
      if (safeString(row[yearColumn]) !== selectedYear) return;

      const metric = safeString(row[metricColumn]).toUpperCase();
      if (!metric || metric === "TOTAL" || metric === "COMPLIMENTARY") return;

      const segment =
        segmentMap[metric] ??
        (segmentMap[metric] = {
          metric,
          revenue: 0,
          nights: 0,
          leadSum: 0,
          count: 0,
        });

      segment.revenue += toNumber(row[revenueColumn]);
      segment.nights += toNumber(row[nightsColumn]);
      segment.leadSum += toNumber(row[leadColumn]);
      segment.count += 1;
    });

    return Object.values(segmentMap)
      .map((segment) => ({
        ...segment,
        adr: segment.nights > 0 ? segment.revenue / segment.nights : 0,
        avgLead: segment.count > 0 ? segment.leadSum / segment.count : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [data, selectedYear]);

  const totalRevenue = useMemo(
    () =>
      aggregatedSegments.reduce(
        (sum, segment) => sum + segment.revenue,
        0,
      ),
    [aggregatedSegments],
  );

  return (
    <div
      className="min-h-screen font-roboto pb-12"
      style={{
        backgroundColor: BRAND_COLORS.frost,
        color: BRAND_COLORS.primary,
      }}
    >
      <style>{fontStyles}</style>

      <header className="bg-white border-b p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-khand font-bold uppercase">
            SEGMENT ANALYSIS
          </h1>
          <select
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
            className="border p-2 font-khand text-xs font-bold uppercase"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        <div
          className="bg-[#fafafa] border-[3px] p-8"
          style={{ borderColor: BRAND_COLORS.primary }}
        >
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-khand uppercase font-bold">
              Detailed Segment Breakdown
            </h3>
            <div className="px-4 py-2 border bg-white">
              <span className="text-xs uppercase font-bold text-slate-500 mr-2">
                Total Rev:
              </span>
              <span
                className="text-xl font-bold font-khand"
                style={{ color: BRAND_COLORS.cyan }}
              >
                {formatCurrency(totalRevenue)}
              </span>
            </div>
          </div>

          <table className="w-full text-left font-roboto">
            <thead className="text-[11px] font-khand uppercase border-b">
              <tr>
                <th className="px-6 py-4">Distribution Segment</th>
                <th className="px-6 py-4">Revenue</th>
                <th className="px-6 py-4">% Mix</th>
                <th className="px-6 py-4">Total Nights</th>
                <th className="px-6 py-4">ADR</th>
                <th className="px-6 py-4">Lead Window</th>
              </tr>
            </thead>
            <tbody>
              {aggregatedSegments.map((segment) => (
                <tr
                  key={segment.metric}
                  className="border-b hover:bg-slate-50 text-sm"
                >
                  <td className="px-6 py-4 font-bold">{segment.metric}</td>
                  <td className="px-6 py-4 font-bold">
                    {formatCurrency(segment.revenue)}
                  </td>
                  <td
                    className="px-6 py-4 font-bold"
                    style={{ color: BRAND_COLORS.cyan }}
                  >
                    {totalRevenue > 0
                      ? ((segment.revenue / totalRevenue) * 100).toFixed(1)
                      : "0.0"}
                    %
                  </td>
                  <td className="px-6 py-4">
                    {formatNumber(segment.nights)}
                  </td>
                  <td
                    className="px-6 py-4 font-bold"
                    style={{ color: BRAND_COLORS.cyan }}
                  >
                    {formatPreciseCurrency(segment.adr)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-slate-100 font-bold uppercase">
                      <Clock size={12} /> {Math.round(segment.avgLead)}d
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
