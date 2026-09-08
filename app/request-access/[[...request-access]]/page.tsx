import { Waitlist } from "@clerk/nextjs";
import AuthShell from "../../auth-shell";
import { clerkAuthAppearance } from "../../clerk-auth";
import { portalPublicUrl } from "../../lib/portal-urls";

export const dynamic = "force-dynamic";

export default function RequestAccessPage() {
  return (
    <AuthShell>
      <Waitlist appearance={clerkAuthAppearance} signInUrl={portalPublicUrl("/sign-in")} />
    </AuthShell>
  );
}
