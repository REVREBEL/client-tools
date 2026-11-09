import { SignIn } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

const SIGN_IN_URL =
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in";
const HUB_URL =
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL || "/client-hub";
const FALLBACK_URL =
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL || HUB_URL;

const appearance = {
  variables: {
    colorPrimary: "#163666",
    colorForeground: "#163666",
    colorMutedForeground: "#536782",
    colorBackground: "#eff5f6",
    colorInput: "#ffffff",
    colorInputForeground: "#163666",
    colorBorder: "#163666",
    colorRing: "#163666",
    borderRadius: "0.175rem",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  elements: {
    rootBox: { width: "100%", maxWidth: "480px" },
    cardBox: {
      width: "100%",
      maxWidth: "480px",
      border: "3px solid #163666",
      borderRadius: "0.55rem",
      boxShadow: "0 8px 20px rgba(0, 0, 0, 0.06)",
    },
    headerTitle: {
      color: "#163666",
      fontSize: "1.9rem",
      fontWeight: 700,
      textTransform: "uppercase" as const,
    },
    formButtonPrimary: {
      minHeight: "58px",
      backgroundColor: "#163666",
      color: "#eff5f6",
      borderRadius: "0.175rem",
      fontWeight: 700,
      textTransform: "uppercase" as const,
    },
  },
};

export default function SignInPage() {
  return (
    <main className="auth-page">
      <section className="auth-card-frame" aria-label="REVREBEL client hub sign in">
        <SignIn
          appearance={appearance}
          path={SIGN_IN_URL}
          routing="path"
          forceRedirectUrl={HUB_URL}
          fallbackRedirectUrl={FALLBACK_URL}
          withSignUp={false}
        />
      </section>
    </main>
  );
}
