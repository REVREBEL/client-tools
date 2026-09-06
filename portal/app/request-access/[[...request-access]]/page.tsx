import { Waitlist } from "@clerk/nextjs";
import AuthShell from "../../auth-shell";
import { clerkAuthAppearance } from "../../clerk-auth";

export const dynamic = "force-dynamic";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function RequestAccessPage() {
  return (
    <AuthShell>
      <Waitlist appearance={clerkAuthAppearance} signInUrl={`${BASE_PATH}/sign-in`} />
    </AuthShell>
  );
}
