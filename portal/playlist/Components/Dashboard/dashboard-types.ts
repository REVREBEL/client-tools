export type DashboardTask = {
  id: number;
  rowNumber: number;
  strategy: string;
  tactical: string;
  lead: string;
  action: string;
  actionDescription: string;
  notes: string;
  dueDate: string;
  rawDueDate: string;
  coreFunction: boolean;
  rank: string;
  priority: string;
  status: string;
  sort: string;
  dependency: string;
};

export type DashboardTaskPayload = {
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
};

export type DashboardColor = {
  background: string;
  color: string;
};

export type DashboardColorMap = Record<string, DashboardColor>;

export type StrategyGroup = {
  name: string;
  tasks: DashboardTask[];
  total: number;
  completed: number;
};
