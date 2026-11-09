import SequenceArranger from "../../Components/Dashboard/SequenceArranger";
import { loadPlaylistData, loadWorkspaceSetupData } from "../lib/google-sheets";

export const dynamic = "force-dynamic";

export default async function SequenceArrangerPage() {
  const [data, setup] = await Promise.all([loadPlaylistData(), loadWorkspaceSetupData()]);
  return <SequenceArranger data={data} setup={setup} />;
}
