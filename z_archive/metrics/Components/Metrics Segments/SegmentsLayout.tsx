import React, { useState } from 'react';
import { Filter, Layers } from 'lucide-react';

const MONTH_ORDER = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const BRAND_COLORS = {
  primary: "#163666",
  cyan: "#00A6B6",
  aqua: "#71C9C5",
  powder: "#B2D3DE",
  frost: "#EFF5F6",
  white: "#fafafa"
};

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Khand:wght@600;700&family=Roboto:wght@400;500;700&display=swap');
  .font-khand { font-family: 'Khand', sans-serif; }
  .font-roboto { font-family: 'Roboto', sans-serif; }
  .hover-text-dynamic:hover {
    color: var(--hover-color) !important;
  }
`;

export default function ShellApp() {
  // Global Navigation & Filter States
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('YEAR');
  const [selectedSegment, setSelectedSegment] = useState('ALL');

  // Hardcoded defaults for the shell demonstration
  const propertyName = "REBEL HOTEL";
  const roomsConfig = 188;
  const years = ['2026', '2025'];
  const segmentOptions = ['TRANSIENT', 'GROUP', 'CONTRACT']; // Example segments for the dropdown
  
  // Determine if the segment filter should be visible based on the active tab
  const showSegmentFilter = (activeTab === 'trends' || activeTab === 'pickup & pace' || activeTab === 'pace');
  
  // Calculate scope labels for the footer
  const scopeTitle = selectedMonth === 'YEAR' ? 'FULL YEAR' : (selectedMonth === 'YTD' ? 'YTD' : selectedMonth);
  const periodLabel = `${selectedYear} ${scopeTitle}`;

  return (
    <div className="min-h-screen font-roboto pb-12" style={{ backgroundColor: BRAND_COLORS.frost, color: BRAND_COLORS.primary }}>
      <style>{fontStyles}</style>

      {/* GLOBAL HEADER BLOCK */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm" style={{ borderColor: `${BRAND_COLORS.aqua}33` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-6">
            
            {/* Top Row: Logo & Filters */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              
              {/* SVG Logo */}
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

              {/* Global Filters */}
              <div className="flex items-center gap-3">
                {showSegmentFilter && (
                  <div className="flex items-center p-1.5 rounded-none border shadow-sm animate-in fade-in duration-300" style={{ backgroundColor: BRAND_COLORS.frost, borderColor: `${BRAND_COLORS.primary}33` }}>
                    <Layers size={14} className="ml-2" style={{ color: BRAND_COLORS.cyan }} />
                    <select
                      value={selectedSegment}
                      onChange={(e) => setSelectedSegment(e.target.value)}
                      className="bg-transparent border-none text-xs font-bold focus:ring-0 py-1 pl-2 pr-8 cursor-pointer font-khand uppercase tracking-wider"
                      style={{ color: BRAND_COLORS.primary }}
                    >
                      <option value="ALL">ALL SEGMENTS</option>
                      {segmentOptions.map(seg => (
                        <option key={seg} value={seg}>{seg}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center p-1.5 rounded-none border shadow-sm" style={{ backgroundColor: BRAND_COLORS.frost, borderColor: `${BRAND_COLORS.primary}33` }}>
                  <Filter size={14} className="ml-2" style={{ color: BRAND_COLORS.cyan }} />
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold focus:ring-0 py-1 pl-2 pr-8 cursor-pointer font-khand uppercase tracking-wider"
                    style={{ color: BRAND_COLORS.primary }}
                  >
                    <option value="YEAR">FULL YEAR</option>
                    <option value="YTD">YTD VIEW</option>
                    {MONTH_ORDER.map(m => <option key={m} value={m}>{m} VIEW</option>)}
                  </select>
                </div>

                <div className="flex items-center p-1.5 rounded-none border shadow-sm" style={{ backgroundColor: BRAND_COLORS.frost, borderColor: `${BRAND_COLORS.primary}33` }}>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold focus:ring-0 py-1 pl-2 pr-8 cursor-pointer font-khand uppercase tracking-wider"
                    style={{ color: BRAND_COLORS.primary }}
                  >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Property Title & Room Count */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 border-t pt-4">
              <h1 className="text-4xl font-bold tracking-tight font-khand uppercase pt-[2px]" style={{ color: BRAND_COLORS.primary }}>
                {propertyName} METRICS
              </h1>
              <div className="text-2xl font-bold font-khand uppercase tracking-wider text-slate-400">
                {roomsConfig} Rooms
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="inline-flex border-[2px] p-1 bg-white" style={{ borderColor: BRAND_COLORS.primary }}>
              {[
                { id: 'overview', label: 'overview' },
                { id: 'trends', label: 'monthly trends' },
                { id: 'segments', label: 'segment analysis' },
                { id: 'pickup & pace', label: 'pickup & pace' }
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => {
                    setActiveTab(id);
                    setSelectedSegment('ALL');
                  }}
                  className={`px-5 py-2 text-sm font-khand font-bold uppercase tracking-wider transition-all ${
                    activeTab === id ? '' : 'text-slate-500 hover-text-dynamic'
                  }`}
                  style={activeTab === id ? { backgroundColor: BRAND_COLORS.primary, color: BRAND_COLORS.powder } : { '--hover-color': BRAND_COLORS.primary }}
                >
                  {label}
                </button>
              ))}
            </div>

          </div>
        </div>
      </header>

      {/* MAIN CONTENT PLACEHOLDER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 min-h-[50vh]">
        
        {activeTab === 'overview' && (
            <div className="flex items-center justify-center h-64 border-4 border-dashed border-[#163666]/20 bg-white">
                <p className="font-khand font-bold text-xl text-[#163666]/50 uppercase tracking-widest">Overview Tab Content Will Render Here</p>
            </div>
        )}

        {activeTab === 'trends' && (
            <div className="flex items-center justify-center h-64 border-4 border-dashed border-[#163666]/20 bg-white">
                <p className="font-khand font-bold text-xl text-[#163666]/50 uppercase tracking-widest">Monthly Trends Content Will Render Here</p>
            </div>
        )}

        {activeTab === 'segments' && (
            <div className="flex items-center justify-center h-64 border-4 border-dashed border-[#163666]/20 bg-white">
                <p className="font-khand font-bold text-xl text-[#163666]/50 uppercase tracking-widest">Segment Analysis Content Will Render Here</p>
            </div>
        )}

        {activeTab === 'pickup & pace' && (
            <div className="flex items-center justify-center h-64 border-4 border-dashed border-[#163666]/20 bg-white">
                <p className="font-khand font-bold text-xl text-[#163666]/50 uppercase tracking-widest">Pickup & Pace Content Will Render Here</p>
            </div>
        )}

      </main>

      {/* GLOBAL FOOTER BLOCK */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-8 flex justify-between items-center text-[9px] font-khand font-bold uppercase tracking-widest" style={{ color: `${BRAND_COLORS.primary}80` }}>
        <span>METRICS BY REVREBEL</span>
        <span>BASED ON SELECTED PERIOD: {periodLabel}</span>
      </footer>
      
    </div>
  );
}