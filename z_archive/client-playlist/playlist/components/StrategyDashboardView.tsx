// src/components/StrategyDashboardView.tsx
"use client";

import React, { useState } from 'react';
import {
  Search,
  Star,
  ChevronDown,
  Notebook,
  Calendar,
  Edit2,
  Trash2,
  FileText
} from 'lucide-react';
import { safeString, getInitials } from '@/lib/utils';
import { TaskItem, TeamMember } from '@/components/TaskEditorModal';

// --- Exported Sub-Component Interfaces ---

export interface PriorityMultiSelectProps {
  priorities: string[];
  selected: string[];
  onChange: (priorities: string[]) => void;
}

function PriorityMultiSelect({ priorities, selected, onChange }: PriorityMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const togglePriority = (p: string) => {
    if (selected.includes(p)) {
      onChange(selected.filter((item) => item !== p));
    } else {
      onChange([...selected, p]);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-center gap-2 border-2 border-brand-primary bg-white px-4 py-2 font-khand font-bold text-xs text-brand-primary uppercase tracking-wider shadow-sm"
      >
        PRIORITY {selected.length > 0 ? "(" + selected.length + ")" : ''}
        <ChevronDown className={"w-4 h-4 transition-transform " + (isOpen ? 'rotate-180' : '')} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-48 bg-white border-2 border-brand-primary p-2 shadow-xl rounded-none">
          <div className="flex justify-between items-center mb-2 pb-1 border-b border-brand-primary/20">
            <span className="font-khand text-xs font-bold uppercase text-brand-primary">Filter Priority</span>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="font-khand text-[10px] font-bold text-brand-red uppercase hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
            {priorities.map((p) => {
              const isChecked = selected.includes(p);
              return (
                <label key={p} className="flex items-center gap-2 px-2 py-1 hover:bg-brand-frost cursor-pointer font-khand text-xs font-bold uppercase text-brand-primary">
                  <input type="checkbox" checked={isChecked} onChange={() => togglePriority(p)} className="accent-brand-primary" />
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

interface InteractiveLinkProps {
  url: string;
  followLink?: (url: string) => void;
}

const InteractiveLink = ({ url, followLink }: InteractiveLinkProps) => {
  const [showCard, setShowCard] = useState(false);
  const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)\//);
  const fileId = fileIdMatch ? fileIdMatch[1] : null;
  const thumbnailUrl = fileId ? "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w500" : null;

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => followLink && followLink(url)}
        className="text-brand-cyan font-semibold underline hover:text-brand-teal transition-colors inline text-left break-all"
      >
        {url}
      </button>

      <button
        type="button"
        onMouseEnter={() => setShowCard(true)}
        onMouseLeave={() => setShowCard(false)}
        className="ml-1 text-slate-400 hover:text-brand-primary"
      >
        <FileText className="w-4 h-4" />
      </button>

      {showCard && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-64 bg-white border border-brand-primary p-3 shadow-xl">
          <p className="font-bold text-xs mb-1">Spreadsheet Document Attachment</p>
          {thumbnailUrl && (
            <img src={thumbnailUrl} alt="Preview" className="w-full h-auto object-cover max-h-32 mb-2" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          )}
          <p className="text-[10px] text-brand-primary break-all mb-1">{url}</p>
          <p className="text-[10px] text-slate-500 leading-tight">This live asset is safely mapped directly within your Google Workbook database rows. Click the anchor address text above to open this target workspace view.</p>
        </div>
      )}
    </span>
  );
};

const renderTextWithLinks = (text?: string, followLink?: (url: string) => void) => {
  if (!text) return '';
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return <InteractiveLink key={i} url={part} followLink={followLink} />;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
};

// --- Exported Strategy Group Interface ---

export interface StrategyGroup {
  name: string;
  tasks: TaskItem[];
  total: number;
  completed: number;
}

// --- Exported Main View Props Interface ---

export interface StrategyDashboardViewProps {
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  parsedStatusColors: Record<string, { bg: string; fg: string }>;
  getStatusStyle: (status: string) => React.CSSProperties;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  allPrioritiesList: string[];
  priorityFilters: string[];
  setPriorityFilters: (priorities: string[]) => void;
  coreFilter: string;
  setCoreFilter: React.Dispatch<React.SetStateAction<string>>;
  personFilter: string;
  setPersonFilter: (person: string) => void;
  parsedTeam: TeamMember[];
  strategyGroupsList: StrategyGroup[];
  tacticalFilters: Record<string, string | null>;
  setTacticalFilters: React.Dispatch<React.SetStateAction<Record<string, string | null>>>;
  expandedStrategies: Record<string, boolean>;
  setExpandedStrategies: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  expandedTasks: Record<number, boolean>;
  setExpandedTasks: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  cycleStatus: (task: TaskItem, e: React.MouseEvent) => void;
  openEditModalTrigger: (task: TaskItem, e: React.MouseEvent) => void;
  deleteItem: (index_: number) => void;
  followLink?: (url: string) => void;
  parsedTasks: TaskItem[];
  getPriorityStyle: (task: TaskItem) => React.CSSProperties;
  getDependencyStatus: (dependency?: string) => string | null;
}

export default function StrategyDashboardView({
  statusFilter,
  setStatusFilter,
  parsedStatusColors,
  getStatusStyle,
  searchTerm,
  setSearchTerm,
  allPrioritiesList,
  priorityFilters,
  setPriorityFilters,
  coreFilter,
  setCoreFilter,
  personFilter,
  setPersonFilter,
  parsedTeam,
  strategyGroupsList,
  tacticalFilters,
  setTacticalFilters,
  expandedStrategies,
  setExpandedStrategies,
  expandedTasks,
  setExpandedTasks,
  cycleStatus,
  openEditModalTrigger,
  deleteItem,
  followLink,
  parsedTasks,
  getPriorityStyle,
  getDependencyStatus
}: StrategyDashboardViewProps) {

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Row 1: Status Filter Buttons */}
      <div className="w-full flex flex-wrap justify-start items-center gap-2 pb-1 md:pb-0">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={"px-4 pt-2.5 pb-2 rounded-none text-sm font-bold transition-all border-2 whitespace-nowrap font-khand uppercase tracking-wide text-left " + (
            statusFilter === 'ALL' ? 'bg-brand-primary text-brand-powder border-brand-primary shadow-sm' : 'bg-white text-brand-primary border-brand-primary/30 hover:bg-slate-50'
          )}
        >
          ALL ITEMS
        </button>
        {Object.keys(parsedStatusColors).map((status) => {
          const style = getStatusStyle(status);
          const isSelected = statusFilter === status;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={isSelected ? style : {}}
              className={"px-4 pt-2.5 pb-2 rounded-none text-sm font-bold transition-all border-2 whitespace-nowrap font-khand uppercase tracking-wide text-left " + (
                isSelected ? 'shadow-sm font-bold' : 'bg-white text-brand-primary border-brand-primary/30 hover:bg-slate-50'
              )}
            >
              {status}
            </button>
          );
        })}
      </div>

      {/* Row 2: Search Bar and Core/Priority/Team Filters */}
      <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-30">

        {/* Search Input */}
        <div className="relative w-full lg:w-96 h-10 lg:h-14 self-start flex items-center">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="search actions, strategies, or descriptions"
            className="w-full h-full pl-10 pr-4 bg-white border border-brand-primary rounded-none focus:ring-2 focus:ring-brand-cyan outline-none transition-all shadow-sm text-xs lowercase"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <PriorityMultiSelect priorities={allPrioritiesList} selected={priorityFilters} onChange={setPriorityFilters} />

          {/* Core Filter Button */}
          <button
            type="button"
            onClick={() => setCoreFilter((prev) => prev === 'CORE' ? 'ALL' : 'CORE')}
            className={"flex items-center justify-center gap-1.5 px-4 py-2 border-2 border-brand-primary font-khand font-bold text-xs uppercase tracking-wider transition-colors shadow-sm " + (
              coreFilter === 'CORE'
                ? 'bg-brand-primary text-brand-powder'
                : 'bg-white text-brand-primary hover:bg-brand-frost'
            )}
          >
            <Star className={"w-4 h-4 " + (coreFilter === 'CORE' ? 'fill-brand-powder text-brand-powder' : 'fill-none text-brand-primary')} />
            <span>CORE</span>
          </button>
        </div>

        {/* Team Members Filter Array */}
        <div className="flex flex-wrap gap-4 items-center justify-start lg:justify-end min-w-0">
          <span className="font-khand font-bold text-3xl tracking-wider text-brand-cyan pt-0.5 shrink-0 uppercase mr-2">MEMBERS</span>
          <div className="flex gap-2 items-center flex-wrap pb-2 w-full sm:w-auto overflow-visible">
            <button
              onClick={() => setPersonFilter('ALL')}
              className={"w-10 h-10 flex items-center justify-center rounded-full border-2 transition-all font-khand text-sm font-bold tracking-wide uppercase pt-0.5 shrink-0 " + (
                personFilter === 'ALL' ? 'bg-brand-cyan text-brand-yellow border-brand-cyan' : 'bg-transparent text-brand-cyan border-brand-cyan hover:bg-brand-frost'
              )}
              title="All Team Members"
            >
              ALL
            </button>
            {parsedTeam.map((member, pIdx) => {
              const initials = getInitials(member.fullName);
              const isSelected = personFilter === member.fullName;
              return (
                <div key={pIdx} className="relative group shrink-0 hover:z-50">
                  <button
                    onClick={() => setPersonFilter(member.fullName)}
                    className={"w-10 h-10 flex items-center justify-center rounded-full border-2 transition-all font-khand text-lg font-bold tracking-wide uppercase pt-0.5 " + (
                      isSelected ? 'bg-brand-cyan text-brand-yellow border-brand-cyan' : 'bg-transparent text-brand-cyan border-brand-cyan hover:bg-brand-frost'
                    )}
                  >
                    {initials}
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap bg-brand-primary text-brand-powder px-2 py-1 text-[10px] font-bold font-khand uppercase tracking-wider z-50 shadow-xl border border-brand-powder/20 pointer-events-none">
                    {member.fullName}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3: Strategy Groups Lists */}
      <div className="space-y-6">
        {strategyGroupsList.map((group) => {
          const isExp = !!expandedStrategies[group.name];

          const tacticalsInGroup = Array.from(
            new Set(group.tasks.map((task) => safeString(task.tactical).toUpperCase().trim()).filter(Boolean))
          ).sort();

          const requestedTactical = tacticalFilters[group.name];
          const activeTactical = (requestedTactical && tacticalsInGroup.includes(requestedTactical)) ? requestedTactical : null;

          const tasksToRender = activeTactical ? group.tasks.filter(
            (task) => safeString(task.tactical).toUpperCase().trim() === activeTactical
          ) : group.tasks;

          const progress = group.tasks.length > 0 ? Math.round(
            (group.tasks.filter((task) => task.status === 'COMPLETED').length / group.tasks.length) * 100
          ) : 0;

          return (
            <div key={group.name} className="bg-white rounded-none shadow-md border-3 border-brand-primary overflow-hidden transition-shadow hover:shadow-lg">

              {/* Group Header Accordion */}
              <div onClick={() => setExpandedStrategies((p) => ({ ...p, [group.name]: !isExp }))} className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/40 border-b border-slate-100">
                <div className="flex items-center gap-4 flex-1">
                  <div className={"p-2 rounded-none transition-transform " + (isExp ? 'rotate-0' : '-rotate-90')}>
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <div className="flex items-center flex-wrap gap-2">
                      <h3 className="font-bold text-brand-primary text-lg font-khand uppercase tracking-wide pt-0.5">
                        {group.name.toUpperCase()}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider font-khand uppercase pt-0.5">
                        {group.tasks.length} Action Items
                      </span>
                      {group.completed > 0 && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-none overflow-hidden">
                            <div className="h-full bg-brand-cyan" style={{ width: progress + "%" }} />
                          </div>
                          <span className="text-[10px] font-bold font-khand uppercase pt-0.5 text-brand-cyan">
                            {Math.round(progress)}% COMPLETE
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Group Contents (Expanded) */}
              {isExp && (
                <div>
                  {/* Tactical Filter Sub-menu */}
                  {tacticalsInGroup.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 border-x-2 border-b border-brand-primary/20 bg-white px-5 py-3">
                      <span className="mr-1 font-khand text-xs font-bold uppercase tracking-wider text-brand-primary"> Filter by Tactical: </span>
                      <button
                        type="button"
                        onClick={() => setTacticalFilters((previous) => ({ ...previous, [group.name]: null }))}
                        className={"border px-3 py-1 font-khand text-xs font-bold uppercase tracking-wide transition-colors " + (
                          !activeTactical ? 'border-brand-primary bg-brand-primary text-brand-powder' : 'border-brand-primary bg-brand-frost text-brand-primary hover:bg-brand-frost/80'
                        )}
                      >
                        All
                      </button>
                      {tacticalsInGroup.map((tactical) => (
                        <button
                          key={tactical}
                          type="button"
                          onClick={() => setTacticalFilters((previous) => ({ ...previous, [group.name]: previous[group.name] === tactical ? null : tactical }))}
                          className={"border px-3 py-1 font-khand text-xs font-bold uppercase tracking-wide transition-colors " + (
                            activeTactical === tactical ? 'border-brand-primary bg-brand-primary text-brand-powder' : 'border-brand-primary bg-brand-frost text-brand-primary hover:bg-brand-frost/80'
                          )}
                        >
                          {tactical}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Tasks Table */}
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-225">
                      <thead className="bg-slate-50/40 border-b border-slate-100">
                        <tr>
                          <th className="px-6 pt-4.5 pb-4 text-sm font-bold text-brand-primary uppercase tracking-wider font-khand">Status</th>
                          <th className="px-6 pt-4.5 pb-4 text-sm font-bold text-brand-primary uppercase tracking-wider font-khand">Action Item Details</th>
                          <th className="px-4 py-4 text-sm font-bold text-brand-primary uppercase tracking-wider font-khand hidden sm:table-cell">Rank</th>
                          <th className="px-4 py-4 text-sm font-bold text-brand-primary uppercase tracking-wider font-khand hidden sm:table-cell">Priority</th>
                          <th className="px-6 py-4 text-sm font-bold text-brand-primary uppercase tracking-wider font-khand hidden md:table-cell">Lead Resource</th>
                          <th className="px-6 py-4 text-sm font-bold text-brand-primary uppercase tracking-wider font-khand hidden lg:table-cell">Due Date</th>
                          <th className="px-6 py-4 text-right text-sm font-bold text-brand-primary uppercase tracking-wider font-khand">Edit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {tasksToRender.map((task) => {
                          const isTaskExpanded = !!expandedTasks[task.id];
                          const depStatus = getDependencyStatus(task.dependency);
                          const isBlocker = parsedTasks.some((other) => other.dependency && other.dependency.toUpperCase().startsWith(task.sort.toUpperCase())) && task.status.toUpperCase() !== 'COMPLETED';
                          const isItemDone = ["COMPLETED", "FUTURE TBD", "SKIPPED"].includes(task.status.toUpperCase());

                          return (
                            <React.Fragment key={task.id}>
                              {/* Main Task Row */}
                              <tr
                                onClick={(task.notes || task.actionDescription) ? () => setExpandedTasks((prev) => ({ ...prev, [task.id]: !isTaskExpanded })) : undefined}
                                className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                              >
                                <td className="px-6 py-4 align-middle">
                                  <button onClick={(e) => cycleStatus(task, e)} style={getStatusStyle(task.status)} className="flex items-center gap-2 px-3 pt-2 pb-1.5 rounded-none text-xs font-bold border transition-all hover:scale-105 active:scale-95 shadow-sm font-khand uppercase tracking-wider">
                                    {task.status}
                                  </button>
                                </td>
                                <td className="px-6 py-4 align-middle">
                                  <div className="flex flex-col">
                                    <div className="flex items-start gap-2">
                                      {task.coreFunction && <Star className="w-4 h-4 text-brand-yellow fill-brand-yellow mt-0.5 shrink-0" />}
                                      <span className="font-roboto font-normal text-brand-primary text-sm leading-snug group-hover:text-brand-cyan transition-colors">
                                        {task.action}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                      {task.tactical && <span className="text-[10px] text-brand-primary/70 font-bold font-khand tracking-wider pt-0.5">{task.tactical}</span>}
                                      {task.notes && <span className="text-[10px] bg-brand-frost text-brand-primary font-bold px-1.5 pt-1 pb-0.5 rounded-none flex items-center gap-1 font-khand uppercase tracking-wide border border-brand-primary"><Notebook className="w-2.5 h-2.5" />Note</span>}
                                      {isBlocker && <span className="text-[10px] font-bold font-khand uppercase bg-brand-red text-brand-powder px-2 pt-1 pb-0.5 rounded-none">Blocking Item</span>}
                                      {task.dependency && depStatus && depStatus !== 'COMPLETED' && <span className="text-[10px] font-bold font-khand uppercase bg-brand-purple text-brand-orange px-2 pt-1 pb-0.5 rounded-none">Dependency Not Met</span>}
                                      {task.dependency && depStatus === 'COMPLETED' && !isItemDone && <span className="text-[10px] font-bold font-khand uppercase bg-brand-orange text-brand-cyan px-2 pt-1 pb-0.5 rounded-none">Item Dependency Met</span>}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4 hidden sm:table-cell align-middle">
                                  {task.rank ? (
                                    <span className="inline-block border-2 border-brand-primary px-2 py-0.5 font-mono text-xs font-bold text-brand-primary">
                                      {String(task.rank).padStart(3, '0')}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 font-mono text-xs">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-4 hidden sm:table-cell align-middle">
                                  {task.priority ? (
                                    <span style={getPriorityStyle(task)} className="inline-block px-2.5 pt-1.25 pb-.75 font-khand text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                      {task.priority}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 font-khand text-xs">-</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 hidden md:table-cell align-middle">
                                  <div className="flex items-center gap-2 text-brand-primary">
                                    <div className="w-6 h-6 rounded-none bg-slate-100 border flex items-center justify-center pt-0.5 text-xs font-bold font-khand uppercase">
                                      {task.lead?.[0] || '?'}
                                    </div>
                                    <span className="text-xs font-semibold">{task.lead.toUpperCase()}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 hidden lg:table-cell align-middle">
                                  <div className="flex items-center gap-2 text-brand-primary">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span className="text-xs font-bold uppercase">{task.dueDate}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right align-middle">
                                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => openEditModalTrigger(task, e)} className="p-1.5 text-brand-primary hover:text-brand-cyan"><Edit2 className="w-3.5 h-3.5" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); deleteItem(task.index_); }} className="p-1.5 text-brand-primary hover:text-brand-red"><Trash2 className="w-3.5 h-3.5" /></button>
                                  </div>
                                </td>
                              </tr>

                              {/* Expanded Task Details Row */}
                              {isTaskExpanded && (task.actionDescription || task.notes) && (
                                <tr className="bg-slate-50/30">
                                  <td colSpan={7} className="px-6 py-4">
                                    <div className="bg-white p-4 rounded-none border border-brand-primary/30 shadow-inner space-y-4">
                                      {task.actionDescription && (
                                        <div>
                                          <p className="text-[10px] font-bold text-brand-primary/60 uppercase tracking-widest flex items-center gap-1 font-khand mb-1 pb-16 pt-0.5">
                                            <FileText className="w-3.5 h-3.5" />
                                            <span>Action Item Description</span>
                                          </p>
                                          <p className="font-roboto font-normal text-xs text-brand-primary leading-relaxed whitespace-pre-wrap">
                                            {renderTextWithLinks(task.actionDescription, followLink)}
                                          </p>
                                        </div>
                                      )}
                                      {task.notes && (
                                        <div className="pt-3 border-t border-dashed">
                                          <p className="text-[10px] font-bold text-brand-primary/60 uppercase tracking-widest flex items-center gap-1 font-khand mb-1 pb-16 pt-0.5">
                                            <Notebook className="w-3.5 h-3.5" />
                                            <span>Strategy Notes</span>
                                          </p>
                                          <p className="font-roboto font-normal text-xs text-brand-primary leading-relaxed whitespace-pre-wrap">
                                            {renderTextWithLinks(task.notes, followLink)}
                                          </p>
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
  );
}