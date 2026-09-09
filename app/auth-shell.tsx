import type { ReactNode } from "react";

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-card-frame" aria-label="REVREBEL client portal access">
        {children}
      </section>
    </main>
  );
}
