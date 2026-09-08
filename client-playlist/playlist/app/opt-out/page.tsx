// src/app/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TopNavigation, 
  MetricsRibbon, 
  StrategyDashboardView, 
  SequenceArrangerView, 
  TaskEditorModal,
  TaskItem,
  TeamMember,
  TaskPayload
} from '@/components';
import { 
  safeString, 
  formatDate, 
  getCleanLetters, 
  getGroupPrefix 
} from '@/lib/utils';
import { DEFAULT_STATUS_COLORS } from '@/lib/constants';
import { 
  PointerSensor, 
  KeyboardSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent 
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { EditTrackerProvider, useEditTracker } from '@/src/context/EditTrackerContext';

function DashboardContent() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Context Hooks for Audit Logging
  const { trackStatusChange, trackTaskCreation, trackTaskEdit } = useEditTracker();

  // Tab & Filter States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tracking' | 'sequencer'>('dashboard');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [personFilter, setPersonFilter] = useState('ALL');
  const [coreFilter, setCoreFilter] = useState('ALL');
  const [priorityFilters, setPriorityFilters] = useState<string[]>([]);
  const [tacticalFilters, setTacticalFilters] = useState<Record<string, string | null>>({});
  const [expandedStrategies, setExpandedStrategies] = useState<Record<string, boolean>>({});
  const [expandedTasks, setExpandedTasks] = useState<Record<number, boolean>>({});

  // Sequencer States
  const [sequencerStrategy, setSequencerStrategy] = useState('');
  const [isSequencerSaving, setIsSequencerSaving] = useState(false);
  const [sequencerError, setSequencerError] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Data Fetching
  const fetchData = async () => {
    try {
      const res = await fetch('/api/sheets');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load sheet data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Header Column Scanning
  const headerIdx = useMemo(() => {
    return data.findIndex((d) => d.row && d.row.some((cell: any) => {
      const s = safeString(cell).toUpperCase();
      return s.includes("STRATEGY PARENT ITEM") || s.includes("MAIN STRATEGY");
    }));
  }, [data]);

  const headerRow = useMemo(() => {
    return headerIdx !== -1 ? data[headerIdx].row : (data[0]?.row || []);
  }, [data, headerIdx]);

  const taskCols = useMemo(() => {
    const row = headerRow;
    const getCol = (exactCands: string[], fallback: number) => {
      let idx = row.findIndex((cell: any) => exactCands.some((cand) => safeString(cell).toUpperCase().trim() === cand.toUpperCase()));
      if (idx !== -1) return idx;
      idx = row.findIndex((cell: any) => safeString(cell).toUpperCase().includes(exactCands[0].toUpperCase()));
      return idx !== -1 ? idx : fallback;
    };
    const taskStatusIdx = row.findIndex((cell: any, i: number) => i < 40 && safeString(cell).toUpperCase().trim() === "STATUS");
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
      sort: getCol(["ITEM SORT", "ITEM NO"], 2),
      dependency: getCol(["ACTION ITEM DEPENDENCY"], 16),
    };
  }, [headerRow]);

  const parsedStatusColors = useMemo(() => {
    return DEFAULT_STATUS_COLORS;
  }, []);

  const parsedTasks = useMemo<TaskItem[]>(() => {
    return data
      .filter((d) => d.index_ !== headerIdx)
      .map((item) => {
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
          status: (safeString(r[taskCols.status]) || 'NOT STARTED').toUpperCase().trim(),
          sort: safeString(r[taskCols.sort]) || '',
          dependency: safeString(r[taskCols.dependency]) || '',
        };
      })
      .filter((t) => t.action && t.action.trim() !== "" && t.action.trim().toUpperCase() !== "ACTION ITEM");
  }, [data, headerIdx, taskCols]);

  const parsedTeam = useMemo<TeamMember[]>(() => {
    const uniqueLeads = Array.from(new Set(parsedTasks.map((t) => t.lead).filter((l) => l && l.toUpperCase() !== 'UNASSIGNED'))).sort();
    return uniqueLeads.map((lead) => ({ fullName: lead, email: lead.toLowerCase().replace(/\s+/g, '') + '@example.com' }));
  }, [parsedTasks]);

  const processedTasksList = useMemo(() => {
    return parsedTasks.filter((task) => {
      const matchSearch = task.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          task.strategy.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          task.tactical.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || task.status === statusFilter;
      const matchPerson = personFilter === 'ALL' || task.lead === personFilter;
      const matchCore = coreFilter === 'ALL' || (coreFilter === 'CORE' && task.coreFunction);
      const matchPriority = priorityFilters.length === 0 || priorityFilters.includes(task.priority || '');
      return matchSearch && matchStatus && matchPerson && matchCore && matchPriority;
    }).sort((a, b) => a.sort.localeCompare(b.sort, undefined, { numeric: true, sensitivity: 'base' }));
  }, [parsedTasks, searchTerm, statusFilter, personFilter, coreFilter, priorityFilters]);

  const allPrioritiesList = useMemo(() => {
    const set = new Set<string>();
    parsedTasks.forEach((t) => { if (t.priority) set.add(t.priority); });
    return Array.from(set).sort();
  }, [parsedTasks]);

  const strategyGroupsList = useMemo(() => {
    const groups: Record<string, { name: string; tasks: TaskItem[]; total: number; completed: number }> = {};
    processedTasksList.forEach((task) => {
      const sName = task.strategy || 'UNCATEGORIZED';
      if (!groups[sName]) groups[sName] = { name: sName, tasks: [], total: 0, completed: 0 };
      groups[sName].tasks.push(task);
      groups[sName].total++;
      if (task.status.toUpperCase() === 'COMPLETED') groups[sName].completed++;
    });
    return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
  }, [processedTasksList]);

  const overallStats = useMemo(() => {
    const counts: Record<string, number> = { total: parsedTasks.length };
    Object.keys(parsedStatusColors).forEach((status) => (counts[status.toUpperCase()] = 0));
    parsedTasks.forEach((t) => {
      const s = t.status.toUpperCase();
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [parsedTasks, parsedStatusColors]);

  const activeTacticalList = useMemo(() => {
    return Array.from(new Set(parsedTasks.map((t) => t.tactical).filter(Boolean))).sort();
  }, [parsedTasks]);

  const displayProjectName = useMemo(() => {
    const projCol = (data[0]?.row || []).findIndex((c: any) => safeString(c).toUpperCase().includes("PROJECT NAME"));
    if (projCol !== -1 && data[1]) return safeString(data[1].row[projCol]);
    return "PROJECT STRATEGY DASHBOARD";
  }, [data]);

  // Mutations
  const updateItem = async (index_: number, updateArray: any[]) => {
    const newData = [...data];
    const target = newData.find((d) => d.index_ === index_);
    if (target) target.row = updateArray;
    setData(newData);

    await fetch('/api/sheets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index_, updateArray }),
    });
  };

  const insertItem = async (payload: TaskPayload) => {
    trackTaskCreation(payload);
    await fetch('/api/sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload }),
    });
    fetchData();
  };

  const deleteItem = async (index_: number) => {
    setData((prev) => prev.filter((item) => item.index_ !== index_));
    await fetch('/api/sheets', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index_ }),
    });
  };

  const followLink = (url: string) => window.open(url, '_blank');

  const getStatusStyle = (status: string): React.CSSProperties => {
    const s = String(status || '').toUpperCase().trim();
    const style = (parsedStatusColors as any)[s];
    const hasBorder = ['ON-HOLD', 'NOT STARTED', 'NOT-STARTED', 'ON HOLD'].includes(s);
    if (style && style.bg && style.fg) {
      return {
        backgroundColor: style.bg,
        color: style.fg,
        borderColor: style.fg,
        borderWidth: hasBorder ? '2px' : '0px',
        borderStyle: hasBorder ? 'solid' : 'none',
      };
    }
    return {
      backgroundColor: '#163666',
      color: '#B2D3DE',
      borderColor: '#B2D3DE',
      borderWidth: hasBorder ? '2px' : '0px',
      borderStyle: hasBorder ? 'solid' : 'none',
    };
  };

  const getPriorityStyle = (task: TaskItem): React.CSSProperties => {
    return {
      backgroundColor: '#163666',
      color: '#B2D3DE',
      border: 'none',
    };
  };

  const getDependencyStatus = (depStr?: string): string | null => {
    if (!depStr) return null;
    const match = depStr.trim().match(/^([A-Z]+0*\d+)/i);
    if (!match) return null;
    const blockCode = match[1].toUpperCase();
    const found = parsedTasks.find((t) => t.sort.toUpperCase() === blockCode);
    return found ? found.status.toUpperCase() : null;
  };

  const cycleStatus = (task: TaskItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const statuses = Object.keys(parsedStatusColors);
    const curIdx = statuses.indexOf(task.status.toUpperCase());
    if (curIdx === -1) return;
    const nextStatus = statuses[(curIdx + 1) % statuses.length];
    
    trackStatusChange(task, task.status, nextStatus);

    const originalRow = data.find((d) => d.index_ === task.index_)?.row || [];
    const updatedRow = [...originalRow];
    updatedRow[taskCols.status] = nextStatus;
    updateItem(task.index_, updatedRow);
  };

  const openEditModalTrigger = (task: TaskItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTaskId(task.id);
    setIsAddingTask(true);
  };

  const handleSaveModal = (payload: TaskPayload) => {
    if (editingTaskId !== null) {
      const existingTask = parsedTasks.find((t) => t.id === editingTaskId);
      if (existingTask) {
        trackTaskEdit(existingTask, payload);
      }

      const originalRow = data.find((d) => d.index_ === editingTaskId)?.row || [];
      const updatedRow = [...originalRow];
      updatedRow[taskCols.strategy] = payload.strategy;
      updatedRow[taskCols.tactical] = payload.tactical;
      updatedRow[taskCols.lead] = payload.lead;
      updatedRow[taskCols.action] = payload.action;
      updatedRow[taskCols.actionDescription] = payload.actionDescription;
      updatedRow[taskCols.notes] = payload.notes;
      updatedRow[taskCols.coreFunction] = payload.coreFunction;
      updatedRow[taskCols.dueDate] = payload.dueDate;
      if (taskCols.rank !== -1) updatedRow[taskCols.rank] = payload.rank;
      if (taskCols.priority !== -1) updatedRow[taskCols.priority] = payload.priority;
      updatedRow[taskCols.status] = payload.status;
      updatedRow[taskCols.sort] = payload.sort;
      updatedRow[taskCols.dependency] = payload.dependency;

      updateItem(editingTaskId, updatedRow);
    } else {
      insertItem(payload);
    }
    setIsAddingTask(false);
    setEditingTaskId(null);
  };

  // Sequencer Handlers
  const orderedSequencerTasks = useMemo(() => {
    if (!sequencerStrategy) return [];
    return parsedTasks
      .filter((task) => task.tactical.toUpperCase().trim() === sequencerStrategy.toUpperCase().trim())
      .sort((a, b) => a.sort.localeCompare(b.sort, undefined, { numeric: true, sensitivity: 'base' }));
  }, [parsedTasks, sequencerStrategy]);

  const handleSequencerMove = (oldIndex: number, newIndex: number) => {
    if (oldIndex === newIndex || newIndex < 0 || newIndex >= orderedSequencerTasks.length) return;
    const nextTasks = arrayMove([...orderedSequencerTasks], oldIndex, newIndex);
    const prefix = getGroupPrefix(nextTasks[0]?.tactical || '', parsedTasks);
    nextTasks.forEach((task, idx) => {
      const nextSortCode = prefix + String(idx + 1).padStart(3, '0');
      const originalRow = data.find((item) => item.index_ === task.id)?.row || [];
      if (originalRow.length > 0) {
        const updatedRow = [...originalRow];
        updatedRow[taskCols.sort] = nextSortCode;
        updateItem(task.id, updatedRow);
      }
    });
  };

  const handleSequencerDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedSequencerTasks.findIndex((task) => String(task.id) === String(active.id));
    const newIndex = orderedSequencerTasks.findIndex((task) => String(task.id) === String(over.id));
    if (oldIndex !== -1 && newIndex !== -1) {
      handleSequencerMove(oldIndex, newIndex);
    }
  };

  if (isLoading) return <div className="p-8 text-center font-khand text-xl">Loading workspace...</div>;

  return (
    <div className="font-roboto min-h-screen bg-brand-frost text-brand-primary custom-scrollbar">
      <div className="max-w-[1800px] mx-auto p-4 md:p-6 lg:p-8 overflow-x-hidden">
        
        {/* Navigation & Title Header */}
        <TopNavigation
          activeTab={activeTab}
          setActiveTab={(tab) => setActiveTab(tab as any)}
          displayProjectName={displayProjectName}
          setIsAddingTask={() => {
            setEditingTaskId(null);
            setIsAddingTask(true);
          }}
          activeTacticalList={activeTacticalList}
          followLink={followLink}
        />

        {/* Dynamic Ribbon for Dashboard & Tracking Views */}
        {(activeTab === 'dashboard' || activeTab === 'tracking') && (
          <MetricsRibbon
            overallStats={overallStats}
            parsedStatusColors={parsedStatusColors}
            getStatusStyle={getStatusStyle}
          />
        )}

        {/* Main Dashboard View */}
        {activeTab === 'dashboard' && (
          <StrategyDashboardView
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            parsedStatusColors={parsedStatusColors}
            getStatusStyle={getStatusStyle}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            allPrioritiesList={allPrioritiesList}
            priorityFilters={priorityFilters}
            setPriorityFilters={setPriorityFilters}
            coreFilter={coreFilter}
            setCoreFilter={setCoreFilter}
            personFilter={personFilter}
            setPersonFilter={setPersonFilter}
            parsedTeam={parsedTeam}
            strategyGroupsList={strategyGroupsList}
            tacticalFilters={tacticalFilters}
            setTacticalFilters={setTacticalFilters}
            expandedStrategies={expandedStrategies}
            setExpandedStrategies={setExpandedStrategies}
            expandedTasks={expandedTasks}
            setExpandedTasks={setExpandedTasks}
            cycleStatus={cycleStatus}
            openEditModalTrigger={openEditModalTrigger}
            deleteItem={deleteItem}
            followLink={followLink}
            parsedTasks={parsedTasks}
            getPriorityStyle={getPriorityStyle}
            getDependencyStatus={getDependencyStatus}
          />
        )}

        {/* Sequence Arranger View */}
        {activeTab === 'sequencer' && (
          <SequenceArrangerView
            sequencerStrategy={sequencerStrategy || activeTacticalList[0] || ''}
            setSequencerStrategy={setSequencerStrategy}
            activeTacticalList={activeTacticalList}
            setSequencerError={setSequencerError}
            isSequencerSaving={isSequencerSaving}
            sequencerError={sequencerError}
            orderedSequencerTasks={orderedSequencerTasks}
            sensors={sensors}
            handleSequencerDragEnd={handleSequencerDragEnd}
            handleSequencerMove={handleSequencerMove}
            getStatusStyle={getStatusStyle}
          />
        )}

        {/* Modal Dialog for Creating/Editing Action Items */}
        <TaskEditorModal
          isOpen={isAddingTask}
          onClose={() => {
            setIsAddingTask(false);
            setEditingTaskId(null);
          }}
          onSave={handleSaveModal}
          editingTaskId={editingTaskId}
          parsedTasks={parsedTasks}
          parsedTeam={parsedTeam}
          parsedStatusColors={parsedStatusColors}
          getGroupPrefix={getGroupPrefix}
        />
      </div>
    </div>
  );
}

export default function NextJsDashboard() {
  return (
    <EditTrackerProvider>
      <DashboardContent />
    </EditTrackerProvider>
  );
}