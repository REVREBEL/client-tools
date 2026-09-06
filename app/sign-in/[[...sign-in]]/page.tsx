import { SignIn } from "@clerk/nextjs";
import AuthShell from "../../auth-shell";
import { clerkAuthAppearance } from "../../clerk-auth";

export const dynamic = "force-dynamic";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function SignInPage() {
  return (
    <AuthShell>
      <SignIn
        appearance={clerkAuthAppearance}
        path={`${BASE_PATH}/sign-in`}
        routing="path"
        waitlistUrl={`${BASE_PATH}/request-access`}
        withSignUp={false}
      />
    </AuthShell>
  );
}
