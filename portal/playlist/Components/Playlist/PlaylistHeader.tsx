"use client";

import Link from "next/link";
import { ArrowUpDown, BarChart3, ListChecks, SlidersHorizontal } from "lucide-react";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type PlaylistHeaderProps = {
  title: string;
  eyebrow: string;
  syncedAt: string | null;
  rowCount: number;
  countLabel?: string;
  active: "dashboard" | "tracking" | "sequencer" | "setup";
};

export default function PlaylistHeader({
  title,
  eyebrow,
  syncedAt,
  rowCount,
  countLabel = "action items",
  active,
}: PlaylistHeaderProps) {
  return (
    <>
      <header className="playlist-app-header">
        <div className="playlist-app-header__brand">
          <img src={`${BASE_PATH}/revrebel-logo-blue.svg`} alt="REVREBEL" />
          <span className="playlist-app-header__divider" aria-hidden="true" />
          <div>
            <span className="playlist-app-header__label">The Playlist</span>
            <span className="playlist-app-header__project">Commercial Strategy Workspace</span>
          </div>
        </div>

        <div className="playlist-app-header__sync">
          <span>{rowCount.toLocaleString()} {countLabel}</span>
          <small>{syncedAt ? `Synced ${new Date(syncedAt).toLocaleString()}` : "Live Google Sheet"}</small>
        </div>
      </header>

      <nav className="playlist-section-nav" aria-label="Playlist views">
        <Link href={`${BASE_PATH}/playlist`} data-active={active === "dashboard" ? "true" : "false"}>
          <ListChecks aria-hidden="true" />
          Strategy Items
        </Link>
        <Link href={`${BASE_PATH}/playlist/tracking`} data-active={active === "tracking" ? "true" : "false"}>
          <BarChart3 aria-hidden="true" />
          Tracking Dashboard
        </Link>
        <Link href={`${BASE_PATH}/playlist/sequencer`} data-active={active === "sequencer" ? "true" : "false"}>
          <ArrowUpDown aria-hidden="true" />
          Sequence Arranger
        </Link>
        <Link href={`${BASE_PATH}/playlist/setup`} data-active={active === "setup" ? "true" : "false"}>
          <SlidersHorizontal aria-hidden="true" />
          Workspace Setup
        </Link>
      </nav>

      <section className="playlist-title-block">
        <p className="playlist-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </section>
    </>
  );
}
