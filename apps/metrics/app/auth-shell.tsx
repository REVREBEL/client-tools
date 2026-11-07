import type { ReactNode } from "react";

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-card-frame" aria-label="Metrics account access">
        {children}
        <div className="auth-secured">
          <span>Secured by</span>
          <strong>
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <path d="M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0Zm0 73.5A23.5 23.5 0 1 1 50 26.5a23.5 23.5 0 0 1 0 47Z" />
              <circle cx="50" cy="50" r="12" />
            </svg>
            clerk
          </strong>
        </div>
      </section>
    </main>
  );
}
