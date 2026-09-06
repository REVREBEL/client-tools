import type { ComponentType } from "react";

type SheetRow = {
  index_: number;
  row: Array<string | number>;
};

declare const Dashboard: ComponentType<{
  data?: SheetRow[];
  sourceData?: SheetRow[];
}>;

export default Dashboard;
