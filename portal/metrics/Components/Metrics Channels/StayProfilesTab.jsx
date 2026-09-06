import React, { useState, useMemo, useEffect } from 'react';

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
  white: "#fafafa"
};

const MONTH_ORDER = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Khand:wght@600;700&family=Roboto:wght@400;500;700&display=swap');
  .font-khand { font-family: 'Khand', sans-serif; }
  .font-roboto { font-family: 'Roboto', sans-serif; }
  .hover-text-dynamic:hover { color: var(--hover-color) !important; }
`;

const factorial = (n) => {
  if (n <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
};

const safeString = (val) => (val !== null && val !== undefined) ? String(val).trim() : '';

export default function App({ data = [] }) {
  const [selectedMonth, setSelectedMonth] = useState('YTD');
  const [selectedYear, setSelectedYear] = useState('');
  const [profileMetricType, setProfileMetricType] = useState('CHANNEL'); // 'CHANNEL' | 'SOURCE' | 'SUBSOURCE'
  const [selectedChannelProfile, setSelectedChannelProfile] = useState('ALL');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Parsing Multi-Tier Metrics Data
  const parsedData = useMemo(() => {
    const result = {
      years: [],
      roomsConfig: 188,
      propertyName: "REBEL HOTEL",
      channelRows: [],
      sourceRows: [],
      subsourceRows: []
    };

    if (!data || !data.length) return result;

    const headers = data[0]?.row || [];
    const findCol = (str) => headers.findIndex(h => safeString(h).toLowerCase() === str.toLowerCase());
    const findColMulti = (candidates) => {
      for (const c of candidates) {
        const cleanCand = c.toLowerCase().replace(/\s+/g, '');
        const idx = headers.findIndex(h => safeString(h).toLowerCase().replace(/\s+/g, '') === cleanCand);
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const map = {
      property: findCol("PROPERTY"),
      rooms: findCol("ROOMS"),
      channelYear: findCol("channel_year"),
      channelMonth: findCol("channel_stay_month"),
      channelMetric: findCol("channel_metric"),
      channelMetricCode: findCol("channel_metric_code"),
      channelResn: findCol("channel_no_resn"),
      channelNights: findCol("channel_nights"),
      channelLead: findCol("channel_lead_days"),
      sourceYear: findColMulti(["source_year"]),
      sourceMonth: findColMulti(["source_stay_month"]),
      sourceMetric: findCol("source_metric"),
      sourceResn: findCol("source_no_resn"),
      sourceNights: findCol("source_nights"),
      sourceLead: findCol("source_lead_days"),
      subsourceYear: findColMulti(["subsource_year"]),
      subsourceMonth: findColMulti(["subsource_stay_month"]),
      subsourceMetric: findColMulti(["subsource_metric"]),
      subsourceResn: findColMulti(["subsource_no_resn"]),
      subsourceNights: findColMulti(["subsource_nights"]),
      subsourceLead: findColMulti(["subsource_lead_days"])
    };

    if (data[2]) {
      if (map.property !== -1) result.propertyName = safeString(data[2].row[map.property]) || result.propertyName;
      if (map.rooms !== -1) result.roomsConfig = Number(data[2].row[map.rooms]) || result.roomsConfig;
    }

    data.forEach((item, idx) => {
      if (idx <= 1) return;
      const r = item.row;
      if (!r) return;

      if (map.channelYear !== -1 && r[map.channelYear]) {
        const yr = Number(r[map.channelYear]);
        if (!isNaN(yr)) {
          const metricVal = safeString(r[map.channelMetric] !== undefined ? r[map.channelMetric] : r[map.channelMetricCode]);
          result.channelRows.push({
            year: yr,
            month: safeString(r[map.channelMonth]).toUpperCase(),
            metric: metricVal,
            channel: metricVal,
            resn: Number(r[map.channelResn]) || 0,
            nights: Number(r[map.channelNights]) || 0,
            lead: Number(r[map.channelLead]) || 0
          });
        }
      }

      if (map.sourceMetric !== -1 && r[map.sourceMetric]) {
        const yr = map.sourceYear !== -1 && r[map.sourceYear] ? Number(r[map.sourceYear]) : 2026;
        result.sourceRows.push({
          year: isNaN(yr) ? 2026 : yr,
          month: map.sourceMonth !== -1 && r[map.sourceMonth] ? safeString(r[map.sourceMonth]).toUpperCase() : 'JAN',
          metric: safeString(r[map.sourceMetric]),
          resn: Number(r[map.sourceResn]) || 0,
          nights: Number(r[map.sourceNights]) || 0,
          lead: Number(r[map.sourceLead]) || 0
        });
      }

      if (map.subsourceMetric !== -1 && r[map.subsourceMetric]) {
        const yr = map.subsourceYear !== -1 && r[map.subsourceYear] ? Number(r[map.subsourceYear]) : 2026;
        result.subsourceRows.push({
          year: isNaN(yr) ? 2026 : yr,
          month: map.subsourceMonth !== -1 && r[map.subsourceMonth] ? safeString(r[map.subsourceMonth]).toUpperCase() : 'JAN',
          metric: safeString(r[map.subsourceMetric]),
          resn: Number(r[map.subsourceResn]) || 0,
          nights: Number(r[map.subsourceNights]) || 0,
          lead: Number(r[map.subsourceLead]) || 0
        });
      }
    });

    const yrSet = new Set(result.channelRows.map(r => String(r.year)).concat(result.sourceRows.map(r => String(r.year))).concat(result.subsourceRows.map(r => String(r.year))));
    result.years = yrSet.size > 0 ? Array.from(yrSet).sort().reverse() : ["2026", "2025"];
    return result;
  }, [data]);

  const { years, roomsConfig, propertyName, channelRows, sourceRows, subsourceRows } = parsedData;

  useEffect(() => {
    if (years.length > 0 && (!selectedYear || !years.includes(selectedYear))) {
      setSelectedYear(years[0]);
    }
  }, [years, selectedYear]);

  const activeMonthsList = useMemo(() => {
    if (selectedMonth === 'YEAR') return MONTH_ORDER;
    if (selectedMonth === 'YTD') return MONTH_ORDER.slice(0, 7);
    return [selectedMonth];
  }, [selectedMonth]);

  const channelsList = useMemo(() => Array.from(new Set(channelRows.map(d => safeString(d.metric || d.channel)).filter(b => Boolean(b) && b.toUpperCase() !== 'TOTAL'))).sort(), [channelRows]);
  const sourcesList = useMemo(() => Array.from(new Set(sourceRows.map(d => safeString(d.metric)).filter(b => Boolean(b) && b.toUpperCase() !== 'TOTAL'))).sort(), [sourceRows]);
  const subsourcesList = useMemo(() => Array.from(new Set(subsourceRows.map(d => safeString(d.metric)).filter(b => Boolean(b) && b.toUpperCase() !== 'TOTAL'))).sort(), [subsourceRows]);

  const currentMetricOptions = useMemo(() => {
    if (profileMetricType === 'SOURCE') return sourcesList.length > 0 ? sourcesList : channelsList;
    if (profileMetricType === 'SUBSOURCE') return subsourcesList.length > 0 ? subsourcesList : channelsList;
    return channelsList;
  }, [profileMetricType, sourcesList, subsourcesList, channelsList]);

  // Statistical Baseline Aggregation & Poisson Distribution Calculation
  const stayProfilesMetrics = useMemo(() => {
    let activeSet = channelRows;
    if (profileMetricType === 'SOURCE') activeSet = sourceRows.length > 0 ? sourceRows : channelRows;
    if (profileMetricType === 'SUBSOURCE') activeSet = subsourceRows.length > 0 ? subsourceRows : channelRows;

    const yrNum = Number(selectedYear) || 2026;
    let filtered = activeSet.filter(d => (d.year === yrNum || !d.year) && activeMonthsList.includes(d.month));

    const isAll = !selectedChannelProfile || selectedChannelProfile.toUpperCase().startsWith('ALL');
    if (!isAll) {
      filtered = filtered.filter(d => safeString(d.metric || d.channel).toUpperCase() === safeString(selectedChannelProfile).toUpperCase());
    }

    const totalNights = filtered.reduce((sum, d) => sum + (d.nights || 0), 0);
    const totalRes = filtered.reduce((sum, d) => sum + (d.resn || 0), 0);
    const leadSum = filtered.reduce((sum, d) => sum + (d.lead || 0), 0);
    const leadCount = filtered.filter(d => (d.lead || 0) > 0).length || filtered.length;

    let targetALOS = (totalRes > 0 && isFinite(totalNights / totalRes)) ? totalNights / totalRes : 2.5;
    let targetLead = (leadCount > 0 && isFinite(leadSum / leadCount)) ? leadSum / leadCount : 15;

    const poisson = (lambda, k) => {
      const safeLambda = Math.max(0.1, isFinite(lambda) ? lambda : 1);
      return (Math.pow(safeLambda, k) * Math.exp(-safeLambda)) / factorial(k);
    };

    const hasStays = filtered.length > 0 && (totalNights > 0 || totalRes > 0);
    if (!hasStays && !isAll) {
      return { stayNights: [0, 0, 0, 0, 0, 0, 0], leadTimes: [0, 0, 0, 0, 0, 0, 0], hasData: false };
    }

    const rawStay = Array.from({ length: 7 }, (_, i) => poisson(Math.max(0.5, targetALOS - 0.5), i + 1));
    const sumStay = rawStay.reduce((a, b) => a + b, 0) || 1;
    const stayNightsPct = rawStay.map(v => Math.round((v / sumStay) * 100));

    const rawLead = Array.from({ length: 7 }, (_, i) => poisson(Math.max(0.1, targetLead / 10), i));
    const sumLead = rawLead.reduce((a, b) => a + b, 0) || 1;
    const leadTimePct = rawLead.map(v => Math.round((v / sumLead) * 100));

    return { stayNights: stayNightsPct, leadTimes: leadTimePct, hasData: true };
  }, [channelRows, sourceRows, subsourceRows, profileMetricType, selectedChannelProfile, selectedYear, activeMonthsList]);

  const scopeTitle = selectedMonth === 'YEAR' ? 'FULL YEAR' : (selectedMonth === 'YTD' ? 'YTD' : selectedMonth);
  const periodLabel = `${selectedYear || '2026'} ${scopeTitle}`;

  return (
    <div className="min-h-screen font-roboto select-none" style={{ backgroundColor: BRAND_COLORS.frost, color: BRAND_COLORS.primary }}>
      <style dangerouslySetInnerHTML={{ __html: fontStyles }} />

      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm" style={{ borderColor: `${BRAND_COLORS.aqua}33` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
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

              <div className="flex items-center gap-3">
                <div className="flex items-center p-1.5 border shadow-sm bg-white" style={{ borderColor: `${BRAND_COLORS.primary}33` }}>
                  <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent border-none text-xs font-bold py-1 pl-2 pr-8 cursor-pointer font-khand uppercase tracking-wider" style={{ color: BRAND_COLORS.primary }}>
                    <option value="YEAR">FULL YEAR</option>
                    <option value="YTD">YTD VIEW</option>
                    {MONTH_ORDER.map(m => <option key={m} value={m}>{m} VIEW</option>)}
                  </select>
                </div>

                <div className="flex items-center p-1.5 border shadow-sm bg-white" style={{ borderColor: `${BRAND_COLORS.primary}33` }}>
                  <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-transparent border-none text-xs font-bold py-1 pl-2 pr-8 cursor-pointer font-khand uppercase tracking-wider" style={{ color: BRAND_COLORS.primary }}>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 border-t pt-4" style={{ borderColor: `${BRAND_COLORS.primary}1A` }}>
              <h1 className="text-3xl sm:text-4xl font-khand font-bold uppercase tracking-wide leading-none pt-[2px]" style={{ color: BRAND_COLORS.primary }}>
                STAY PROFILES | {propertyName}
              </h1>
              <div className="text-xl sm:text-2xl font-khand font-bold uppercase tracking-wider opacity-60 pt-[2px]" style={{ color: BRAND_COLORS.primary }}>
                {roomsConfig} ROOMS
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Source Metric Control Bar */}
        <div className="bg-white p-6 border-[3px] rounded-none flex justify-between items-center flex-wrap gap-4" style={{ borderColor: BRAND_COLORS.primary }}>
          <div>
            <h3 className="font-khand uppercase font-bold tracking-wider text-xl pt-[2px]" style={{ color: BRAND_COLORS.primary }}>
              SOURCE METRIC
            </h3>
            <p className="font-roboto font-normal text-xs text-slate-500 mt-0.5">
              Distributions update dynamically based on selected metric parameters.
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {/* Toggle: CHANNEL / SOURCE / SUB SOURCE */}
            <div className="flex border-[2px] p-1 bg-white" style={{ borderColor: BRAND_COLORS.primary }}>
              {['CHANNEL', 'SOURCE', 'SUBSOURCE'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setProfileMetricType(type);
                    setSelectedChannelProfile('ALL');
                  }}
                  className={`px-4 pt-[8px] pb-1.5 text-xs font-khand font-bold uppercase tracking-wider transition-all ${
                    profileMetricType === type ? '' : 'text-slate-500 hover-text-dynamic'
                  }`}
                  style={
                    profileMetricType === type 
                      ? { backgroundColor: BRAND_COLORS.primary, color: BRAND_COLORS.powder } 
                      : { '--hover-color': BRAND_COLORS.primary }
                  }
                >
                  {type === 'SUBSOURCE' ? 'SUB SOURCE' : type}
                </button>
              ))}
            </div>

            {/* Metric Dropdown Selector */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="border-[2px] bg-white px-4 pt-[10px] pb-2 font-khand font-bold text-sm flex items-center justify-between gap-2 w-[260px] sm:w-[280px]"
                style={{ borderColor: BRAND_COLORS.primary, color: BRAND_COLORS.primary }}
              >
                <span className="pt-[2px] truncate">{profileMetricType}: {selectedChannelProfile}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {isProfileDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border-[2px] shadow-xl z-50 w-full max-h-48 overflow-y-auto" style={{ borderColor: BRAND_COLORS.primary }}>
                  <div 
                    onClick={() => {
                      setSelectedChannelProfile('ALL');
                      setIsProfileDropdownOpen(false);
                    }}
                    className="px-4 py-2 hover:bg-[#EFF5F6] cursor-pointer text-xs font-khand font-bold uppercase pt-[2px]" style={{ color: BRAND_COLORS.primary }}
                  >
                    ALL {profileMetricType === 'SUBSOURCE' ? 'SUB SOURCES' : `${profileMetricType}S`}
                  </div>
                  {currentMetricOptions.map(m => (
                    <div 
                      key={m} 
                      onClick={() => {
                        setSelectedChannelProfile(m);
                        setIsProfileDropdownOpen(false);
                      }}
                      className="px-4 py-2 hover:bg-[#EFF5F6] cursor-pointer text-xs font-khand font-bold uppercase pt-[2px] truncate" style={{ color: BRAND_COLORS.primary }}
                    >
                      {m}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Graphics Distribution Cards */}
        <div className="bg-white border-[3px] p-10 md:p-14 rounded-none shadow-md space-y-12 relative" style={{ borderColor: BRAND_COLORS.primary }}>

          {!stayProfilesMetrics.hasData && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-khand font-bold uppercase p-3 tracking-wider">
              No stay records found for {selectedChannelProfile} during {periodLabel}. Defaulting to aggregate baseline patterns.
            </div>
          )}

          {/* SECTION 1: STAY DURATION */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-10">
            <div className="lg:max-w-xs w-full shrink-0">
              <h4 className="font-khand uppercase font-bold text-xl tracking-wider leading-none pt-[2px]" style={{ color: BRAND_COLORS.primary }}>
                LENGTH OF STAY
              </h4>
            </div>

            <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {[
                { label: "1 NIGHT", style:   { backgroundColor: BRAND_COLORS.primary, color: '#b9c3d1' } },
                { label: "2 NIGHTS", style:  { backgroundColor: BRAND_COLORS.teal,    color: '#b4d8e0' } },
                { label: "3 NIGHTS", style:  { backgroundColor: BRAND_COLORS.cyan,    color: '#b3e4e9' } },
                { label: "4 NIGHTS", style:  { backgroundColor: BRAND_COLORS.aqua,    color: BRAND_COLORS.primary } },
                { label: "5 NIGHTS", style:  { backgroundColor: BRAND_COLORS.powder,  color: BRAND_COLORS.teal } },
                { label: "6 NIGHTS", style:  { backgroundColor: BRAND_COLORS.frost, border: `2px solid ${BRAND_COLORS.cyan}`, color: BRAND_COLORS.cyan } },
                { label: "7+ NIGHTS", style: { backgroundColor: BRAND_COLORS.white, border: `2px solid ${BRAND_COLORS.aqua}`, color: BRAND_COLORS.aqua } }
              ].map((block, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <span className="text-xs sm:text-sm font-bold font-khand uppercase mb-1 whitespace-nowrap pt-[2px]" style={{ color: BRAND_COLORS.primary }}>
                    {block.label}
                  </span>
                  <div className="w-full aspect-square flex flex-col justify-center items-center rounded-none shadow-sm transition-transform hover:scale-105" style={block.style}>
                    <span className="text-2xl md:text-3xl font-khand font-bold tracking-normal leading-none pt-[2px]" style={{ color: block.style.color }}>
                      {String(stayProfilesMetrics.stayNights[idx] || 0).padStart(2, '0')}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: BOOKING LEAD TIME */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6">
            <div className="lg:max-w-xs w-full shrink-0">
              <h4 className="font-khand uppercase font-bold text-xl tracking-wider leading-none pt-[2px]" style={{ color: BRAND_COLORS.primary }}>
                LEAD DAYS
              </h4>
            </div>

            <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {[
                { label: "0-3 DAYS",   style: { backgroundColor: BRAND_COLORS.yellow,  color: '#feefd7' } },
                { label: "4-6 DAYS",   style: { backgroundColor: '#ff914d',  color: '#ffdeca' } },
                { label: "7-14 DAYS",  style: { backgroundColor: BRAND_COLORS.orange, color: '#fbd8cd' } },
                { label: "15-29 DAYS", style: { backgroundColor: BRAND_COLORS.red, color: BRAND_COLORS.yellow } },
                { label: "30-45 DAYS", style: { backgroundColor: '#cf3b4b', color: '#ff914d' } },
                { label: "61-90 DAYS", style: { backgroundColor: '#b4126d', color: BRAND_COLORS.orange } },
                { label: "91+ DAYS",   style: { backgroundColor: BRAND_COLORS.purple, color: BRAND_COLORS.red } }
              ].map((block, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <span className="text-xs sm:text-sm font-bold font-khand uppercase mb-1 whitespace-nowrap pt-[2px]" style={{ color: BRAND_COLORS.primary }}>
                    {block.label}
                  </span>
                  <div className="w-full aspect-square flex flex-col justify-center items-center rounded-none shadow-sm transition-transform hover:scale-105" style={block.style}>
                    <span className="text-2xl md:text-3xl font-khand font-bold tracking-normal leading-none pt-[2px]" style={{ color: block.style.color }}>
                      {String(stayProfilesMetrics.leadTimes[idx] || 0).padStart(2, '0')}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 flex justify-between items-center text-[9px] font-khand font-bold uppercase tracking-widest opacity-80">
        <span>METRICS BY REVREBEL</span>
        <span>BASED ON SELECTED PERIOD: {periodLabel}</span>
      </footer>
    </div>
  );
}