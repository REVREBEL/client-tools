import { SignIn } from "@clerk/nextjs";
import AuthShell from "../../auth-shell";
import { clerkAuthAppearance } from "../../clerk-auth";
import { portalPath, portalPublicUrl } from "../../lib/portal-urls";

export const dynamic = "force-dynamic";

const SIGN_IN_URL = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || portalPath("/client-hub/sign-in");
const SIGN_IN_FORCE_REDIRECT_URL =
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL || "/client-hub";
const SIGN_IN_FALLBACK_REDIRECT_URL =
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL || "/client-hub";
const REQUEST_ACCESS_URL =
  process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || portalPublicUrl("/client-hub/request-access");

export default function SignInPage() {
  return (
    <AuthShell>
      <SignIn
        appearance={clerkAuthAppearance}
        path={SIGN_IN_URL}
        routing="path"
        forceRedirectUrl={SIGN_IN_FORCE_REDIRECT_URL}
        fallbackRedirectUrl={SIGN_IN_FALLBACK_REDIRECT_URL}
        waitlistUrl={REQUEST_ACCESS_URL}
        withSignUp={false}
      />
    </AuthShell>
  );
}
