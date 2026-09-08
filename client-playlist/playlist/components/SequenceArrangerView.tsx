// src/components/SequenceArrangerView.tsx
"use client";

import React from 'react';
import { Clock, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent, SensorDescriptor, SensorOptions } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { safeString, extractPrefix } from '@/lib/utils';
import { TaskItem } from '@/components/TaskEditorModal';

// --- Sub-Component Props ---

export interface SortableSequencerTaskProps {
  task: TaskItem;
  position: number;
  total: number;
  disabled: boolean;
  onMove: (oldPos: number, newPos: number) => void;
  getStatusStyle: (status: string) => React.CSSProperties;
}

function SortableSequencerTask({
  task,
  position,
  total,
  disabled,
  onMove,
  getStatusStyle,
}: SortableSequencerTaskProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled,
  });

  const rowStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={rowStyle}
      className={
        "flex items-center gap-4 p-4 bg-white hover:bg-slate-50 transition-colors " +
        (isDragging ? 'shadow-lg border-y border-brand-primary/30' : 'border-b border-brand-primary/10')
      }
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-slate-400 p-1 hover:text-brand-primary transition-colors"
        aria-label="Drag handle to reorder task"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <div className="flex items-center gap-1 shrink-0 bg-slate-100 border p-1 font-mono font-bold text-[10px]">
        <span className="px-1 text-brand-primary/60">{extractPrefix(task.sort)}</span>
        <select
          value={position}
          onChange={(event) => onMove(position, Number(event.target.value))}
          className="w-14 border bg-white px-1 py-1 text-center font-mono text-xs font-bold text-brand-primary"
          aria-label={"Sequence position for " + task.action}
        >
          {Array.from({ length: total }, (_, index) => (
            <option key={index + 1} value={index + 1}>
              {String(index + 1).padStart(3, '0')}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
        <div className="col-span-6">
          <p className="font-bold text-sm text-brand-primary truncate uppercase">
            {safeString(task.action)}
          </p>
        </div>
        <div className="col-span-3">
          <div
            style={getStatusStyle(task.status)}
            className="px-2 pt-1.25 pb-0.75 text-[10px] font-bold font-khand uppercase tracking-wider text-center border shadow-sm truncate"
          >
            {task.status}
          </div>
        </div>
        <div className="col-span-3 text-right flex flex-col items-end justify-center">
          <span className="text-[11px] font-bold font-khand uppercase text-brand-primary">
            {task.dueDate || 'No Date'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          disabled={disabled || position === 1}
          onClick={() => onMove(position, position - 1)}
          className="p-1.5 border bg-white hover:bg-brand-frost disabled:opacity-30 text-brand-primary"
          aria-label="Move item up"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={disabled || position === total}
          onClick={() => onMove(position, position + 1)}
          className="p-1.5 border bg-white hover:bg-brand-frost disabled:opacity-30 text-brand-primary"
          aria-label="Move item down"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// --- Main View Props ---

export interface SequenceArrangerViewProps {
  sequencerStrategy: string;
  setSequencerStrategy: (val: string) => void;
  activeTacticalList: string[];
  setSequencerError: (err: string) => void;
  isSequencerSaving: boolean;
  sequencerError: string;
  orderedSequencerTasks: TaskItem[];
  sensors: SensorDescriptor<SensorOptions>[];
  handleSequencerDragEnd: (event: DragEndEvent) => void;
  handleSequencerMove: (oldIndex: number, newIndex: number) => void;
  getStatusStyle: (status: string) => React.CSSProperties;
}

export default function SequenceArrangerView({
  sequencerStrategy,
  setSequencerStrategy,
  activeTacticalList,
  setSequencerError,
  isSequencerSaving,
  sequencerError,
  orderedSequencerTasks,
  sensors,
  handleSequencerDragEnd,
  handleSequencerMove,
  getStatusStyle,
}: SequenceArrangerViewProps) {
  return (
    <div className="space-y-6 bg-white p-8 border-[3px] border-brand-primary rounded-none animate-in fade-in duration-150">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold font-khand uppercase tracking-wide pt-0.5">
            Sequence Arranger
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Select a tactical group, drag tasks, use the position dropdown, or click the arrows to reorder.
          </p>
        </div>

        <div className="min-w-60">
          <label className="block text-[11px] font-bold uppercase font-khand tracking-wider mb-1.5 pt-0.5">
            Select Tactical Group
          </label>
          <select
            value={sequencerStrategy}
            onChange={(event) => {
              setSequencerStrategy(event.target.value);
              setSequencerError('');
            }}
            className="w-full rounded-none border-2 border-brand-primary bg-white px-3 pb-2 pt-2.5 font-khand text-xs font-bold uppercase text-brand-primary"
          >
            {activeTacticalList.map((tactical) => (
              <option key={tactical} value={tactical}>
                {tactical.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading and Error States */}
      {isSequencerSaving && (
        <div className="flex items-center gap-2 text-brand-primary font-khand font-bold uppercase text-xs animate-pulse">
          <Clock className="w-4 h-4" /> Saving sequence…
        </div>
      )}

      {sequencerError && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-xs font-bold font-khand uppercase">
          {sequencerError}
        </div>
      )}

      {/* Draggable List container */}
      {orderedSequencerTasks.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200">
          <p className="text-slate-500 font-khand uppercase text-sm">
            No tasks assigned to this tactical item.
          </p>
        </div>
      ) : (
        <div className="border-2 border-brand-primary rounded-none divide-y divide-brand-primary/30 overflow-hidden">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSequencerDragEnd}>
            <SortableContext items={orderedSequencerTasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
              {orderedSequencerTasks.map((task, index) => (
                <SortableSequencerTask
                  key={task.id}
                  task={task}
                  position={index + 1}
                  total={orderedSequencerTasks.length}
                  disabled={isSequencerSaving}
                  getStatusStyle={getStatusStyle}
                  onMove={(oldPos, newPos) => handleSequencerMove(oldPos - 1, newPos - 1)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}