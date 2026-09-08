import { SignIn } from "@clerk/nextjs";
import AuthShell from "../../auth-shell";
import { clerkAuthAppearance } from "../../clerk-auth";
import { portalPath, portalPublicUrl } from "../../lib/portal-urls";

export const dynamic = "force-dynamic";

const SIGN_IN_URL = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || portalPath("/sign-in");

export default function SignInPage() {
  return (
    <AuthShell>
      <SignIn
        appearance={clerkAuthAppearance}
        path={SIGN_IN_URL}
        routing="path"
        waitlistUrl={portalPublicUrl("/request-access")}
        withSignUp={false}
      />
    </AuthShell>
  );
}
