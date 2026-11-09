// src/components/index.ts

// Component Exports
export { default as TopNavigation } from './TopNavigation';
export { default as MetricsRibbon } from './MetricsRibbon';
export { default as TaskEditorModal } from './TaskEditorModal';
export { default as SequenceArrangerView } from './SequenceArrangerView';
export { default as StrategyDashboardView } from './StrategyDashboardView';

// Type Exports
export type { TopNavigationProps } from './TopNavigation';
export type { MetricsRibbonProps } from './MetricsRibbon';

export type {
  TaskItem,
  TeamMember,
  TaskPayload,
  TaskEditorModalProps,
} from './TaskEditorModal';

export type {
  SequenceArrangerViewProps,
  SortableSequencerTaskProps,
} from './SequenceArrangerView';

export type {
  StrategyDashboardViewProps,
  PriorityMultiSelectProps,
  StrategyGroup,
} from './StrategyDashboardView';