"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";

export default function AccessGate() {
  const searchParams = useSearchParams();
  const denied = searchParams.get("access") === "denied";
  const unavailable = searchParams.get("access") === "unavailable";

  return (
    <main className="access-gate">
      <header className="access-gate-header">
        <Image src="/revrebel-logo-blue.svg" alt="REVREBEL" width={1180} height={175} priority />
        <span>Now Now NoHo</span>
      </header>
      <section className="access-gate-content">
        <div className="access-gate-intro">
          <p className="eyebrow">Commercial Engine Performance Healthcheck</p>
          <h1>Strategy Playlist Resource Hub</h1>
          <p>This client resource portal is private. Enter the shared password provided by REVREBEL to continue.</p>
        </div>
        <div className="access-card">
          <p className="eyebrow">Client Access</p>
          <h2>Enter Password</h2>
          <form action="/api/login" method="post">
            <label htmlFor="portal-password">Shared password</label>
            <input id="portal-password" name="password" type="password" autoComplete="current-password" required autoFocus />
            {denied && <p className="access-error" role="alert">That password does not match. Please try again.</p>}
            {unavailable && <p className="access-error" role="alert">Portal access is being configured. Please try again shortly.</p>}
            <button type="submit">Access Resource Hub</button>
          </form>
          <p className="access-note">Access remains active on this device for seven days.</p>
        </div>
      </section>
      <footer className="access-gate-footer">
        <Image src="/revrebel-logo-white.svg" alt="REVREBEL" width={1180} height={175} />
        <span>Strategy Playlist Resource Hub</span>
      </footer>
    </main>
  );
}
