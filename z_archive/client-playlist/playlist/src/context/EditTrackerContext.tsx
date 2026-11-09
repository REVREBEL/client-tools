// src/context/EditTrackerContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TaskItem, TaskPayload } from '@/components/TaskEditorModal';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  taskId?: number;
  taskIdentifier: string;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  summary: string;
  teamLead: string;
  isSystem: boolean;
}

interface EditTrackerContextType {
  auditLogs: AuditLogEntry[];
  queuedEmailUpdates: AuditLogEntry[];
  trackStatusChange: (task: TaskItem, oldStatus: string, newStatus: string, currentUser?: string) => void;
  trackTaskCreation: (payload: TaskPayload, currentUser?: string) => void;
  trackTaskEdit: (task: TaskItem, payload: TaskPayload, currentUser?: string) => void;
  clearEmailQueue: () => void;
  getWeeklySummaryByLead: () => Record<string, AuditLogEntry[]>;
}

const EditTrackerContext = createContext<EditTrackerContextType | undefined>(undefined);

export const EditTrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [queuedEmailUpdates, setQueuedEmailUpdates] = useState<AuditLogEntry[]>([]);

  // Load cached audit logs on mount
  useEffect(() => {
    const savedLogs = localStorage.getItem('rr_playlist_audit_logs');
    const savedQueue = localStorage.getItem('rr_playlist_email_queue');
    if (savedLogs) setAuditLogs(JSON.parse(savedLogs));
    if (savedQueue) setQueuedEmailUpdates(JSON.parse(savedQueue));
  }, []);

  // Persist logs to localStorage
  useEffect(() => {
    localStorage.setItem('rr_playlist_audit_logs', JSON.stringify(auditLogs));
    localStorage.setItem('rr_playlist_email_queue', JSON.stringify(queuedEmailUpdates));
  }, [auditLogs, queuedEmailUpdates]);

  const addLog = (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: "log-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
    };

    setAuditLogs((prev) => [newEntry, ...prev]);
    setQueuedEmailUpdates((prev) => [...prev, newEntry]);

    // Send log entry to Next.js API route asynchronously
    fetch('/api/audit-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEntry),
    }).catch((err) => console.error('Failed to persist audit log:', err));
  };

  const trackStatusChange = (task: TaskItem, oldStatus: string, newStatus: string, currentUser = 'Active User') => {
    if (oldStatus.toUpperCase() === newStatus.toUpperCase()) return;

    const taskCode = task.sort ? task.sort : "ID-" + task.id;
    const taskTitle = taskCode + " " + task.action;

    addLog({
      user: currentUser,
      taskId: task.id,
      taskIdentifier: taskTitle,
      fieldChanged: 'STATUS',
      oldValue: oldStatus,
      newValue: newStatus,
      summary: "Status changed from " + oldStatus + " to " + newStatus + " for task " + taskTitle,
      teamLead: task.lead,
      isSystem: false,
    });
  };

  const trackTaskCreation = (payload: TaskPayload, currentUser = 'Active User') => {
    const taskTitle = payload.sort + " " + payload.action;

    addLog({
      user: currentUser,
      taskIdentifier: taskTitle,
      fieldChanged: 'NEW_TASK',
      oldValue: '',
      newValue: payload.action,
      summary: "New Action Item Added: " + payload.action + ", due on " + (payload.dueDate || 'N/A') + " and assigned to " + (payload.lead || 'Unassigned'),
      teamLead: payload.lead,
      isSystem: false,
    });
  };

  const trackTaskEdit = (task: TaskItem, payload: TaskPayload, currentUser = 'Active User') => {
    const taskCode = payload.sort ? payload.sort : "ID-" + task.id;
    const taskTitle = taskCode + " " + payload.action;

    addLog({
      user: currentUser,
      taskId: task.id,
      taskIdentifier: taskTitle,
      fieldChanged: 'TASK_UPDATE',
      oldValue: task.action,
      newValue: payload.action,
      summary: "Action Item Details updated for " + taskTitle,
      teamLead: payload.lead,
      isSystem: false,
    });
  };

  const clearEmailQueue = () => {
    setQueuedEmailUpdates([]);
    localStorage.removeItem('rr_playlist_email_queue');
  };

  const getWeeklySummaryByLead = () => {
    const summary: Record<string, AuditLogEntry[]> = {};
    queuedEmailUpdates.forEach((entry) => {
      const leadKey = entry.teamLead ? entry.teamLead.toUpperCase() : 'UNASSIGNED';
      if (!summary[leadKey]) summary[leadKey] = [];
      summary[leadKey].push(entry);
    });
    return summary;
  };

  return (
    <EditTrackerContext.Provider
      value={{
        auditLogs,
        queuedEmailUpdates,
        trackStatusChange,
        trackTaskCreation,
        trackTaskEdit,
        clearEmailQueue,
        getWeeklySummaryByLead,
      }}
    >
      {children}
    </EditTrackerContext.Provider>
  );
};

export const useEditTracker = () => {
  const context = useContext(EditTrackerContext);
  if (!context) {
    throw new Error('useEditTracker must be used within an EditTrackerProvider');
  }
  return context;
};