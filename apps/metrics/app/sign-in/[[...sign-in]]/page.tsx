import { SignIn } from "@clerk/nextjs";
import AuthShell from "../../auth-shell";
import { clerkAuthAppearance } from "../../clerk-auth";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <AuthShell>
      <SignIn
        appearance={clerkAuthAppearance}
        path="/sign-in"
        routing="path"
        waitlistUrl="/request-access"
        withSignUp={false}
      />
    </AuthShell>
  );
}
