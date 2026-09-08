import { SignIn } from "@clerk/nextjs";
import AuthShell from "../../auth-shell";
import { clerkAuthAppearance } from "../../clerk-auth";
import { portalPath, portalPublicUrl } from "../../lib/portal-urls";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <AuthShell>
      <SignIn
        appearance={clerkAuthAppearance}
        path={portalPath("/sign-in")}
        routing="path"
        waitlistUrl={portalPublicUrl("/request-access")}
        withSignUp={false}
      />
    </AuthShell>
  );
}
