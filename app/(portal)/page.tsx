import { redirect } from "next/navigation";
import { portalPublicUrl } from "../lib/portal-urls";

export default function PortalHome() {
  redirect(portalPublicUrl("/playlist"));
}
