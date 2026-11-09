import type { ComponentType } from "react";

type SheetRow = {
  index_: number;
  row: Array<string | number>;
};

declare const ChannelDashboard: ComponentType<{
  data?: SheetRow[];
  metadataData?: SheetRow[];
  profileData?: SheetRow[];
}>;

export default ChannelDashboard;
