// src/components/TaskEditorModal.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, ChevronDown, Calendar, Star } from 'lucide-react';
import { 
  safeString, 
  extractSortIndex, 
  toISODate, 
  parsePickerDate, 
  formatPickerLabel 
} from '@/lib/utils';
import { CALENDAR_MONTHS, PRIORITY_LEVELS } from '@/lib/constants';

// --- Type Definitions ---

export interface TaskItem {
  id: number;
  index_: number;
  strategy: string;
  tactical: string;
  lead: string;
  action: string;
  actionDescription?: string;
  notes?: string;
  dueDate?: string;
  rawDueDate?: string;
  coreFunction?: boolean;
  rank?: string | number;
  priority?: string;
  priorityBg?: string;
  priorityFg?: string;
  status: string;
  sort: string;
  dependency?: string;
}

export interface TeamMember {
  index_?: number;
  fullName: string;
  email?: string;
}

export interface TaskPayload {
  strategy: string;
  tactical: string;
  lead: string;
  action: string;
  actionDescription: string;
  notes: string;
  coreFunction: boolean;
  dueDate: string;
  rank: string;
  priority: string;
  status: string;
  sort: string;
  dependency: string;
}

export interface TaskEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: TaskPayload) => void;
  editingTaskId: number | null;
  parsedTasks: TaskItem[];
  parsedTeam: TeamMember[];
  parsedStatusColors: Record<string, { bg: string; fg: string }>;
  getGroupPrefix: (tacticalName: string, tasks: TaskItem[], currentTaskId?: number | null) => string;
}

// --- Local Sub-Components ---

interface SearchableDependencySelectProps {
  tasks: TaskItem[];
  editingTaskId: number | null;
  value: string;
  onChange: (val: string) => void;
}

function SearchableDependencySelect({ tasks, editingTaskId, value, onChange }: SearchableDependencySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const options = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return tasks
      .filter((task) => task.id !== editingTaskId)
      .filter((task) => {
        if (!normalizedQuery) return true;
        return [task.sort, task.action, task.status, task.tactical].some((field) =>
          safeString(field).toLowerCase().includes(normalizedQuery)
        );
      })
      .sort((a, b) => a.sort.localeCompare(b.sort, undefined, { numeric: true, sensitivity: 'base' }));
  }, [tasks, editingTaskId, query]);

  const selectedTask = tasks.find((task) => (task.sort + " " + task.action).trim() === value.trim());

  const selectTask = (task: TaskItem | null) => {
    onChange(task ? (task.sort + " " + task.action) : '');
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <input type="hidden" name="dependency" value={value} />
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 border border-brand-primary bg-white px-4 py-2.5 text-left text-brand-primary rounded-none focus:outline-none focus:ring-2 focus:ring-brand-cyan"
      >
        <span className="truncate font-roboto text-sm font-normal uppercase">
          {selectedTask 
            ? selectedTask.sort + " " + selectedTask.action + " (" + selectedTask.status + ")" 
            : 'No Blocking Dependency'}
        </span>
        <ChevronDown className={"h-4 w-4 shrink-0 transition-transform " + (isOpen ? 'rotate-180' : '')} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 z-70 mb-1 overflow-hidden border-2 border-brand-primary bg-white shadow-2xl rounded-none">
          <div className="sticky top-0 border-b border-brand-primary bg-brand-frost p-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-primary/60" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search code, task, status, or group"
                className="w-full border border-brand-primary bg-white py-2 pl-9 pr-3 font-roboto text-sm font-normal uppercase text-brand-primary outline-none focus:ring-2 focus:ring-brand-cyan"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-brand-primary hover:bg-white transition-colors"
              aria-label="Close dropdown"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="max-h-105 overflow-y-auto custom-scrollbar">
            <button
              type="button"
              onClick={() => selectTask(null)}
              className={"block w-full border-b border-slate-100 px-4 py-4 text-left font-khand text-xs font-bold uppercase transition-colors " + (
                !value ? 'bg-brand-primary text-white' : 'text-brand-red bg-red-50 hover:bg-red-100'
              )}
            >
              {value ? 'Remove Current Dependency' : 'No Blocking Dependency'}
            </button>

            {options.map((task) => {
              const optVal = task.sort + " " + task.action;
              const isSelected = value === optVal;
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => selectTask(task)}
                  className={"block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-brand-frost " + (
                    isSelected ? 'bg-brand-primary text-white' : 'text-brand-primary'
                  )}
                >
                  <span className="block font-khand text-xs font-bold uppercase">
                    {task.sort} {task.action}
                  </span>
                  <span className={"mt-0.5 block font-khand text-[10px] font-bold uppercase " + (
                    isSelected ? 'text-white/70' : 'text-slate-400'
                  )}>
                    {task.status} · {task.tactical || 'No Tactical Group'}
                  </span>
                </button>
              );
            })}
            {options.length === 0 && (
              <div className="px-4 py-8 text-center font-khand text-xs font-bold uppercase text-slate-400">
                No matching action items
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="sticky bottom-0 block w-full border-t border-brand-primary/10 px-4 py-4 text-center font-khand text-sm font-bold uppercase text-brand-primary bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              Close Selection Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface BetterDatePickerProps {
  value: string;
  onChange: (val: string) => void;
}

function BetterDatePicker({ value, onChange }: BetterDatePickerProps) {
  const selectedDate = parsePickerDate(value);
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState<Date>(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

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

  const selectDate = (date: Date) => {
    onChange(toISODate(date));
    setIsOpen(false);
  };

  const selectToday = () => {
    const today = new Date();
    onChange(toISODate(today));
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between border border-brand-primary bg-white px-4 py-2 text-left text-brand-primary rounded-none focus:outline-none focus:ring-2 focus:ring-brand-cyan"
      >
        <span className={"font-roboto text-sm font-normal uppercase " + (value ? 'text-brand-primary' : 'text-slate-400')}>
          {value ? formatPickerLabel(value) : 'Select Due Date'}
        </span>
        <Calendar className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-70 mt-1 border-2 border-brand-primary bg-white p-3 shadow-2xl rounded-none w-[225%] min-w-[320px]">
          <div className="mb-4 flex items-center justify-between bg-brand-primary px-3 py-2 text-brand-powder">
            <button type="button" onClick={previousMonth} className="px-2 font-khand text-lg font-bold">‹</button>
            <span className="font-khand text-base font-bold uppercase tracking-wider">
              {CALENDAR_MONTHS[month]} {year}
            </span>
            <button type="button" onClick={nextMonth} className="px-2 font-khand text-lg font-bold">›</button>
          </div>
          <div className="mb-1 grid grid-cols-7 gap-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={day + "-" + i} className="py-0 text-center font-khand text-xl font-bold uppercase text-slate-400">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date) => {
              const dateISO = toISODate(date);
              const isSelected = dateISO === selectedISO;
              const isToday = dateISO === todayISO;
              const isOutsideMonth = date.getMonth() !== month;
              return (
                <button
                  key={dateISO}
                  type="button"
                  onClick={() => selectDate(date)}
                  className={"flex aspect-square items-center justify-center border font-khand text-2xl font-bold transition-colors " + (
                    isSelected ? 'border-brand-primary bg-brand-primary text-brand-powder' 
                    : isToday ? 'border-brand-cyan bg-brand-frost text-brand-primary' 
                    : isOutsideMonth ? 'border-transparent text-slate-300 hover:bg-slate-50' 
                    : 'border-transparent text-brand-primary hover:bg-brand-frost'
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-brand-primary/20 pt-3">
            <button type="button" onClick={() => { onChange(''); setIsOpen(false); }} className="font-khand text-xl font-bold uppercase text-brand-red hover:underline">Clear</button>
            <button type="button" onClick={selectToday} className="bg-brand-yellow px-3 pb-1.25 pt-1.75 font-khand text-xl font-bold uppercase text-brand-red hover:bg-brand-yellow/80 transition-colors">Today</button>
            <button type="button" onClick={() => setIsOpen(false)} className="font-khand text-xl font-bold uppercase text-brand-primary hover:underline">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main Task Editor Modal Component ---

export default function TaskEditorModal({
  isOpen,
  onClose,
  onSave,
  editingTaskId,
  parsedTasks,
  parsedTeam,
  parsedStatusColors,
  getGroupPrefix,
}: TaskEditorModalProps) {
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

  useEffect(() => {
    if (isOpen) {
      if (editingTaskId !== null) {
        const task = parsedTasks.find((t) => t.id === editingTaskId);
        if (task) {
          setFormStrategyVal(task.strategy || '');
          setFormTacticalVal(task.tactical || '');
          setFormSortNumVal(String(extractSortIndex(task.sort)).padStart(3, '0'));
          setFormStrategyError('');
          setActionCount(task.action ? task.action.length : 0);
          setFormNumError('');
          setFormDueDate(task.rawDueDate || task.dueDate || '');
          setFormCoreFunction(task.coreFunction || false);
          setFormPriorityVal(task.priority || '');
          setFormRankVal(task.rank ? String(task.rank).padStart(3, '0') : '000');
          setFormDependency(task.dependency || '');
        }
      } else {
        setFormStrategyVal('');
        setFormTacticalVal('');
        setFormSortNumVal('001');
        setFormStrategyError('');
        setActionCount(0);
        setFormNumError('');
        setFormDueDate(toISODate(new Date()));
        setFormCoreFunction(false);
        setFormPriorityVal('');
        setFormRankVal('000');
        setFormDependency('');
      }
    }
  }, [isOpen, editingTaskId, parsedTasks]);

  if (!isOpen) return null;

  const handleStrategyChange = (value: string) => {
    setFormStrategyVal(value);
    setFormStrategyError(
      value.trim().length < 10 ? 'Strategy parent item must be at least 10 characters.' : ''
    );
  };

  const handleTacticalChange = (value: string) => {
    setFormTacticalVal(value);
    const sameGroup = parsedTasks.filter(
      (t) => t.tactical.toUpperCase().trim() === value.toUpperCase().trim() && t.id !== editingTaskId
    );
    const maxVal = sameGroup.reduce((max, t) => {
      const num = extractSortIndex(t.sort);
      return num > max ? num : max;
    }, 0);
    setFormSortNumVal(String(maxVal + 1).padStart(3, '0'));
    setFormNumError('');
  };

  const handleSortNumChange = (numVal: string, currentTactical: string) => {
    const cleanedNum = numVal.replace(/\D/g, '').substring(0, 3);
    setFormSortNumVal(cleanedNum);
    const prefix = getGroupPrefix(currentTactical, parsedTasks, editingTaskId);
    const fullCode = prefix + cleanedNum.padStart(3, '0');
    if (parsedTasks.some((t) => t.id !== editingTaskId && t.sort === fullCode)) {
      setFormNumError("Number code " + cleanedNum + " is already in use within this sequence group!");
    } else {
      setFormNumError('');
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formStrategyVal.trim().length < 10) return;

    const formData = new FormData(e.currentTarget);
    const tactical = formTacticalVal.trim();
    const prefix = getGroupPrefix(tactical, parsedTasks, editingTaskId);
    const finalSortCode = prefix + formSortNumVal.padStart(3, '0');

    const payload: TaskPayload = {
      strategy: formStrategyVal.trim(),
      tactical: tactical,
      lead: String(formData.get('lead') || 'Unassigned'),
      action: String(formData.get('action') || '').substring(0, 150),
      actionDescription: String(formData.get('actionDescription') || ''),
      notes: String(formData.get('notes') || ''),
      coreFunction: formCoreFunction,
      dueDate: formDueDate,
      rank: formRankVal,
      priority: formPriorityVal,
      status: String(formData.get('status') || Object.keys(parsedStatusColors)[0]),
      sort: finalSortCode,
      dependency: formDependency,
    };

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-none shadow-2xl w-full max-w-4xl my-8 overflow-hidden border-[3px] border-brand-primary animate-in fade-in zoom-in duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-baseline justify-between px-8 py-5 border-b border-brand-primary/30 shrink-0 bg-white">
          <h2 className="text-2xl font-bold font-khand uppercase tracking-wider text-brand-primary border-0.5">
            {editingTaskId !== null ? "Edit Tactical Action Item" : "Create Tactical Action Item"}
          </h2>
          <span className="text-[10px] text-slate-400 font-medium italic hidden sm:inline">
            Update and manage tactical execution items, dependencies, and schedules
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 transition-colors"
            aria-label="Close Modal"
          >
            <X className="w-6 h-6 text-brand-primary" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden min-h-0 bg-white">
          <div className="flex-1 overflow-y-auto p-8 space-y-6 pb-64">
            
            {/* Strategy Parent Item */}
            <div>
              <div className="flex justify-between items-baseline mb-1.5">
                <label className="font-khand text-sm font-bold uppercase tracking-wider text-brand-primary">
                  Strategy Parent Item <span className="text-brand-red font-bold ml-0.5">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Minimum 10+ characters</span>
              </div>
              <input
                type="text"
                name="strategy"
                required
                minLength={10}
                value={formStrategyVal}
                onChange={(e) => handleStrategyChange(e.target.value)}
                className={"w-full px-4 py-2 border rounded-none outline-none focus:ring-2 focus:ring-brand-cyan text-sm font-roboto font-normal uppercase " + (
                  formStrategyError ? 'border-brand-red text-brand-red bg-red-50' : 'border-brand-primary text-brand-primary'
                )}
                placeholder="Website Offers + Merchandising"
              />
              {formStrategyError && (
                <p className="text-[11px] text-brand-red font-bold font-khand mt-1 border-0.5">{formStrategyError}</p>
              )}
            </div>

            {/* Tactical Sub-Item & Team Lead */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-khand text-sm font-bold uppercase tracking-wider text-brand-primary mb-1.5">
                  Tactical Sub-Item <span className="text-brand-red font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  name="tactical"
                  required
                  value={formTacticalVal}
                  onChange={(e) => handleTacticalChange(e.target.value)}
                  className="w-full px-4 py-2 border border-brand-primary rounded-none outline-none focus:ring-2 focus:ring-brand-cyan text-sm font-roboto font-normal text-brand-primary"
                  placeholder="Create Offer Copy"
                />
              </div>
              <div>
                <label className="block font-khand text-sm font-bold uppercase tracking-wider text-brand-primary mb-1.5">
                  Team Lead <span className="text-brand-red font-bold ml-0.5">*</span>
                </label>
                <div className="relative">
                  <select
                    name="lead"
                    defaultValue={editingTaskId !== null ? parsedTasks.find((t) => t.id === editingTaskId)?.lead : "Unassigned"}
                    className="w-full px-4 py-2.5 border border-brand-primary rounded-none outline-none focus:ring-2 focus:ring-brand-cyan text-sm bg-white text-brand-primary appearance-none font-roboto font-normal uppercase"
                  >
                    <option value="Unassigned">Unassigned</option>
                    {parsedTeam.map((member, idx) => (
                      <option key={idx} value={member.fullName}>
                        {member.fullName.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Sequence Group, Status, & Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
              <div className="md:col-span-6 border border-brand-primary/30 bg-brand-frost/40 p-3 rounded-none grid grid-cols-2 gap-3 h-18.5">
                <div>
                  <label className="block font-khand text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 whitespace-nowrap">
                    Sequence Group Prefix
                  </label>
                  <div className="px-1 py-1 font-khand font-bold text-sm text-slate-600 tracking-wider">
                    {getGroupPrefix(formStrategyVal, parsedTasks, editingTaskId) || 'STRT'}
                  </div>
                </div>
                <div>
                  <label className="block font-khand text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 whitespace-nowrap">
                    Sequence Number Portion <span className="text-brand-red font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value={formSortNumVal}
                    placeholder="001"
                    maxLength={3}
                    onChange={(e) => handleSortNumChange(e.target.value, formStrategyVal)}
                    className={"w-full px-2 py-1 border rounded-none outline-none font-roboto text-sm text-center font-normal text-brand-primary bg-white focus:ring-2 focus:ring-brand-cyan " + (
                      formNumError ? 'border-brand-red text-brand-red bg-red-50' : 'border-brand-primary'
                    )}
                  />
                </div>
              </div>
              <div className="md:col-span-3">
                <label className="block font-khand text-sm font-bold uppercase tracking-wider text-brand-primary mb-1.5">
                  Status <span className="text-brand-red font-bold ml-0.5">*</span>
                </label>
                <div className="relative">
                  <select
                    name="status"
                    defaultValue={editingTaskId !== null ? parsedTasks.find((t) => t.id === editingTaskId)?.status : Object.keys(parsedStatusColors)[0]}
                    className="w-full px-4 py-2.5 border border-brand-primary rounded-none outline-none focus:ring-2 focus:ring-brand-cyan text-sm bg-white uppercase font-roboto font-normal text-brand-primary appearance-none"
                  >
                    {Object.keys(parsedStatusColors).map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary pointer-events-none" />
                </div>
              </div>
              <div className="md:col-span-3">
                <label className="block font-khand text-sm font-bold uppercase tracking-wider text-brand-primary mb-1.5">
                  Due Date <span className="text-brand-red font-bold ml-0.5">*</span>
                </label>
                <BetterDatePicker
                  key={"due-date-" + (editingTaskId ?? 'new')}
                  value={formDueDate}
                  onChange={setFormDueDate}
                />
              </div>
            </div>

            {/* Action Item Title */}
            <div>
              <div className="flex justify-between items-baseline mb-1.5">
                <label className="font-khand text-sm font-bold uppercase tracking-wider text-brand-primary">
                  Action Item Title (Short Description) <span className="text-brand-red font-bold ml-0.5">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  {150 - actionCount} characters remaining
                </span>
              </div>
              <input
                type="text"
                name="action"
                required
                maxLength={150}
                onChange={(e) => setActionCount(e.currentTarget.value.length)}
                defaultValue={editingTaskId !== null ? parsedTasks.find((t) => t.id === editingTaskId)?.action : ""}
                className="w-full px-4 py-2 border border-brand-primary rounded-none outline-none focus:ring-2 focus:ring-brand-cyan text-sm text-brand-primary font-roboto font-normal"
                placeholder="Review Copy & Offer Details"
              />
            </div>

            {/* Description & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-khand text-sm font-bold uppercase tracking-wider text-brand-primary mb-1.5 pb-6">
                  Action Item Description
                </label>
                <textarea
                  name="actionDescription"
                  defaultValue={editingTaskId !== null ? parsedTasks.find((t) => t.id === editingTaskId)?.actionDescription : ""}
                  className="w-full px-4 py-2.5 border border-brand-primary rounded-none outline-none focus:ring-2 focus:ring-brand-cyan text-sm min-h-35 text-brand-primary font-roboto font-normal leading-relaxed"
                  placeholder="- Who it is for&#10;- What the guest gets&#10;- How to book&#10;- Any restrictions"
                />
              </div>
              <div>
                <label className="block font-khand text-sm font-bold uppercase tracking-wider text-brand-primary mb-1.5 pb-6">
                  Strategy Notes
                </label>
                <textarea
                  name="notes"
                  defaultValue={editingTaskId !== null ? parsedTasks.find((t) => t.id === editingTaskId)?.notes : ""}
                  className="w-full px-4 py-2.5 border border-brand-primary rounded-none outline-none focus:ring-2 focus:ring-brand-cyan text-sm min-h-35 text-brand-primary font-roboto font-normal leading-relaxed"
                  placeholder="Working Draft Version Link:&#10;https://docs.google.com/document/..."
                />
              </div>
            </div>

            {/* Core Function, Priority, Rank */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-brand-frost/40 p-5 border border-brand-primary/30">
              <div>
                <button
                  type="button"
                  onClick={() => setFormCoreFunction((prev) => !prev)}
                  className="flex items-center gap-3 group focus:outline-none text-left w-full"
                >
                  <div className={"p-2 border-2 transition-all shrink-0 " + (
                    formCoreFunction ? 'bg-brand-primary border-brand-primary' : 'bg-white border-brand-primary/30 group-hover:border-brand-primary'
                  )}>
                    <Star className={"w-5 h-5 transition-colors " + (
                      formCoreFunction ? 'text-brand-yellow fill-brand-yellow' : 'text-slate-300'
                    )} />
                  </div>
                  <div>
                    <p className="font-khand text-sm font-bold uppercase tracking-wider text-brand-primary leading-none mb-1">
                      Core Function
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">Flag for core reporting</p>
                  </div>
                </button>
              </div>

              <div>
                <label className="block font-khand text-sm font-bold uppercase tracking-wider text-brand-primary mb-1">
                  Priority
                </label>
                <div className="relative">
                  <select
                    name="priority"
                    value={formPriorityVal}
                    onChange={(e) => setFormPriorityVal(e.target.value)}
                    className="w-full px-3 py-2 border border-brand-primary rounded-none outline-none focus:ring-2 focus:ring-brand-cyan text-sm bg-white uppercase font-roboto font-normal text-brand-primary appearance-none"
                  >
                    <option value="">None / Unassigned</option>
                    {PRIORITY_LEVELS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block font-khand text-sm font-bold uppercase tracking-wider text-brand-primary mb-1">
                  Rank Number
                </label>
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
                  className="w-full px-3 py-2 border border-brand-primary rounded-none outline-none focus:ring-2 focus:ring-brand-cyan font-mono text-sm text-center font-bold text-brand-primary bg-white"
                />
              </div>
            </div>

            {/* Dependency */}
            <div>
              <label className="block font-khand text-sm font-bold uppercase tracking-wider text-brand-primary mb-1.5">
                Action Item Dependency (Blocking item)
              </label>
              <SearchableDependencySelect
                key={"dependency-" + (editingTaskId ?? 'new')}
                tasks={parsedTasks}
                editingTaskId={editingTaskId}
                value={formDependency}
                onChange={setFormDependency}
              />
            </div>
            <div className="h-16 shrink-0" />
          </div>

          {/* Action Buttons Footer */}
          <div className="flex items-center justify-between px-8 py-5 border-t border-brand-primary/20 bg-slate-50 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="border-2 border-brand-primary text-brand-primary hover:bg-brand-frost transition-colors px-6 py-2 rounded-none font-khand font-bold text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-cyan"
            >
              Discard Changes
            </button>
            <button
              type="submit"
              disabled={!!formStrategyError || !!formNumError || formStrategyVal.trim().length < 10}
              className="bg-brand-primary text-brand-powder hover:bg-brand-primary/90 transition-colors px-6 py-2.5 rounded-none font-khand font-bold text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:ring-offset-2"
            >
              Save Action Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}