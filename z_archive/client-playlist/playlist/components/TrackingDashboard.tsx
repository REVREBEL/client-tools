"use client";

import React from 'react';
import { formatValue, safeString } from '../lib/utils';

export default function TrackingDashboard({
trackingSubTab,
setTrackingSubTab,
blockingItemsCount,
trackingStats,
metPercentage,
waitingOnHoldCount,
parentProgressList,
teamProgressStats
}) {
// Utilizing Tailwind v4 classes defined in globals.css instead of inline styles
const getActiveClass = (isActive) =>
isActive
? 'bg-brand-primary text-brand-powder'
: 'text-slate-500 hover:text-brand-primary';

return (


  {/* Sub-navigation Tabs */}
  <div className="flex justify-center mb-8">
    <div className="flex border-[2px] border-brand-primary bg-slate-200/50 p-1 rounded-none">
      <button 
        onClick={() => setTrackingSubTab('overview')} 
        className={`px-6 pt-[12px] pb-[10px] font-khand font-bold text-sm transition-all rounded-none uppercase ${getActiveClass(trackingSubTab === 'overview')}`}
      >
        Overview
      </button>
      <button 
        onClick={() => setTrackingSubTab('team-progress')} 
        className={`px-6 pt-[12px] pb-[10px] font-khand font-bold text-sm transition-all rounded-none uppercase ${getActiveClass(trackingSubTab === 'team-progress')}`}
      >
        Team Progress
      </button>
    </div>
  </div>

  {/* Overview Tab Content */}
  {trackingSubTab === 'overview' && (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      
      {/* Left Column: Metric Squares */}
      <div className="lg:col-span-1 max-w-[280px] w-full mx-auto lg:mx-0 space-y-4 flex flex-col justify-start">
        
        {/* Blocking Items */}
        <div className="bg-white p-[30px] border-[3px] border-brand-primary rounded-none flex flex-col justify-center aspect-square w-full">
          <div className="flex flex-col h-full justify-center -space-y-2">
            <span className="text-[7.5rem] font-black font-khand text-brand-primary leading-none tracking-tight -mb-2">
              {formatValue(blockingItemsCount)}
            </span>
            <div className="text-4xl font-bold font-khand uppercase tracking-wide text-brand-primary leading-[0.8] pt-[4px]">
              BLOCKING<span className="block">ITEMS</span>
            </div>
          </div>
        </div>

        {/* Dependencies Met (Progress Bar) */}
        <div className="bg-white p-[30px] border-[3px] border-brand-primary rounded-none flex flex-col justify-center min-h-[160px] w-full">
          <div className="flex flex-col h-full justify-center -space-y-1">
            <div className="flex items-center justify-between w-full gap-2">
              <span className="w-1/4 text-[7.5rem] font-black font-khand text-brand-primary leading-none tracking-tight shrink-0 pt-[4px] -mb-2">
                {formatValue(trackingStats.metCount)}
              </span>
              <div className="w-2/4 flex flex-col justify-center pl-4 pr-1">
                <span className="text-2xl font-normal font-roboto text-brand-powder text-right pr-1 pt-[2px] leading-none mb-1">
                  {metPercentage}%
                </span>
                <div className="w-full h-5 bg-brand-powder rounded-none overflow-hidden border border-brand-primary/20">
                  <div className="h-full bg-brand-primary" style={{ width: `${metPercentage}%` }} />
                </div>
              </div>
            </div>
            <div className="text-4xl font-bold font-khand uppercase tracking-wide text-brand-primary leading-[0.8] pt-[4px] mt-2">
              DEPENDENCIES<span className="block">MET</span>
            </div>
          </div>
        </div>

        {/* Waiting / On-Hold */}
        <div className="bg-brand-yellow p-[30px] border-[3px] border-brand-yellow rounded-none flex flex-col justify-center aspect-square w-full">
          <div className="flex flex-col h-full justify-center -space-y-2">
            <span className="text-[7.5rem] font-black font-khand text-brand-cyan leading-none tracking-tight -mb-2">
              {formatValue(waitingOnHoldCount)}
            </span>
            <div className="text-4xl font-bold font-khand uppercase tracking-wide text-brand-cyan leading-[0.8] pt-[4px]">
              WAITING<span className="block">ON-HOLD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Progress by Parent Item */}
      <div className="lg:col-span-3 space-y-6 w-full">
        <div className="bg-white p-[42px] border-[3px] border-brand-primary shadow-sm rounded-none space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-2xl font-bold font-khand uppercase tracking-wide pt-[2px] text-brand-primary">
              Progress by Parent Item
            </h2>
          </div>
          <div className="space-y-3">
            {parentProgressList.map((parent, pIdx) => {
              const radius = 18;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (parent.percentage / 100) * circumference;
              
              return (
                <div key={pIdx} className="bg-white p-4 border-[2px] border-brand-primary flex items-center justify-between gap-4 rounded-none hover:border-brand-cyan transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-bold font-khand text-brand-primary tracking-wide text-base pt-[2px]">
                      {safeString(parent.name).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 44 44">
                      <circle className="text-slate-100" strokeWidth="4" stroke="currentColor" fill="transparent" r={radius} cx="22" cy="22" />
                      <circle 
                        className="text-brand-primary"
                        strokeWidth="4" 
                        strokeDasharray={circumference} 
                        strokeDashoffset={strokeDashoffset} 
                        strokeLinecap="square" 
                        stroke="currentColor" 
                        fill="transparent" 
                        r={radius} 
                        cx="22" cy="22" 
                      />
                    </svg>
                    <span className="text-xl font-bold font-khand text-slate-400 w-12 text-right pt-[2px]">
                      {parent.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  )}

  {/* Team Progress Tab Content */}
  {trackingSubTab === 'team-progress' && (
    <div className="space-y-6">
      <div>
        <h3 className="text-3xl font-bold font-khand uppercase tracking-wide text-brand-primary pt-[2px]">
          Team Progress
        </h3>
      </div>
      <div className="space-y-4">
        {teamProgressStats.map((teamStats, teamIdx) => {
          const firstName = safeString(teamStats.fullName).split(' ')[0].toUpperCase();
          
          return (
            <div key={teamIdx} className="bg-white border-[3px] border-brand-primary p-4 flex flex-row items-center justify-between gap-4 rounded-none shadow-sm hover:border-brand-cyan transition-colors w-full h-[120px]">
              
              <div className="flex items-center gap-4 h-full flex-1">
                
                {/* Total Count */}
                <div className="border-[2px] border-brand-primary px-4 pt-[10px] pb-[8px] flex flex-col items-center justify-center text-center bg-slate-50 h-full w-[120px] rounded-none shrink-0">
                  <span className="text-5xl font-extrabold font-khand text-brand-primary leading-none pt-[2px]">
                    {formatValue(teamStats.total)}
                  </span>
                  <span className="text-xs font-bold text-slate-500 font-khand uppercase tracking-wider mt-0.5 leading-none pt-[2px]">
                    Total Items
                  </span>
                </div>

                {/* Status Breakdown Row */}
                <div className="flex items-center gap-3 h-full justify-start">
                  
                  {/* Not Started */}
                  <div className={`bg-brand-frost rounded-none text-center h-full aspect-square flex flex-col items-center justify-center shrink-0 ${teamStats.notStarted > 0 ? 'border-[2px] border-brand-primary' : 'border-0'}`}>
                    <span className="text-4xl font-bold font-khand leading-none text-brand-primary block pt-[2px]">
                      {formatValue(teamStats.notStarted)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 font-khand uppercase block mt-0.5 leading-none pt-[2px]">
                      Not Started
                    </span>
                  </div>

                  {/* Waiting */}
                  <div className={`bg-brand-yellow rounded-none text-center h-full aspect-square flex flex-col items-center justify-center shrink-0 ${teamStats.waiting > 0 ? 'border-[2px] border-brand-primary' : 'border-0'}`}>
                    <span className="text-4xl font-bold font-khand leading-none text-brand-red block pt-[2px]">
                      {formatValue(teamStats.waiting)}
                    </span>
                    <span className="text-[10px] font-bold text-brand-red/80 font-khand uppercase block mt-0.5 leading-none pt-[2px]">
                      Waiting
                    </span>
                  </div>

                  {/* In Progress */}
                  <div className={`bg-brand-cyan rounded-none text-center h-full aspect-square flex flex-col items-center justify-center shrink-0 ${teamStats.inProgress > 0 ? 'border-[2px] border-brand-primary' : 'border-0'}`}>
                    <span className="text-4xl font-bold font-khand leading-none text-brand-yellow block pt-[2px]">
                      {formatValue(teamStats.inProgress)}
                    </span>
                    <span className="text-[10px] font-bold text-brand-yellow/90 font-khand uppercase block mt-0.5 leading-none pt-[2px]">
                      In Progress
                    </span>
                  </div>

                  {/* Completed */}
                  <div className={`bg-brand-primary rounded-none text-center h-full aspect-square flex flex-col items-center justify-center shrink-0 ${teamStats.completed > 0 ? 'border-[2px] border-brand-primary' : 'border-0'}`}>
                    <span className="text-4xl font-bold font-khand leading-none text-brand-powder block pt-[2px]">
                      {formatValue(teamStats.completed)}
                    </span>
                    <span className="text-[10px] font-bold text-brand-powder/90 font-khand uppercase block mt-0.5 leading-none pt-[2px]">
                      Completed
                    </span>
                  </div>

                </div>
              </div>

              {/* Right Aligned Name */}
              <div className="text-right shrink-0 pr-4">
                <span className="text-4xl font-bold font-khand text-brand-primary uppercase tracking-wide block pt-[4px]">
                  {firstName}
                </span>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  )}
</div>


);
}