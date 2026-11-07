import { SignIn } from "@clerk/nextjs";
import AuthShell from "../../auth-shell";
import { clerkAuthAppearance } from "../../clerk-auth";
import { portalPath, portalPublicUrl } from "../../lib/portal-urls";

export const dynamic = "force-dynamic";

const SIGN_IN_URL = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || portalPath("/sign-in");
const PORTAL_HOME_URL = portalPublicUrl();
const SIGN_IN_FORCE_REDIRECT_URL =
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL || PORTAL_HOME_URL;

export default function SignInPage() {
  return (
    <AuthShell>
      <SignIn
        appearance={clerkAuthAppearance}
        path={SIGN_IN_URL}
        routing="path"
        forceRedirectUrl={SIGN_IN_FORCE_REDIRECT_URL}
        fallbackRedirectUrl={SIGN_IN_FORCE_REDIRECT_URL}
        waitlistUrl={portalPublicUrl("/request-access")}
        withSignUp={false}
      />
    </AuthShell>
  );
}
