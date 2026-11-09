import { Waitlist } from "@clerk/nextjs";
import AuthShell from "../../auth-shell";
import { clerkAuthAppearance } from "../../clerk-auth";
import { portalPath } from "../../lib/portal-urls";

export const dynamic = "force-dynamic";

const SIGN_IN_URL = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || portalPath("/sign-in");

export default function RequestAccessPage() {
  return (
    <AuthShell>
      <Waitlist appearance={clerkAuthAppearance} signInUrl={SIGN_IN_URL} />
    </AuthShell>
  );
}
