"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Resource = {
  id: string;
  title: string;
  description: string;
  useWhen: string;
  href: string;
  fileName: string;
  format: string;
  action: string;
  tactical: string;
  strategy: string;
};

type ResourceResponse = {
  resources: Resource[];
  activeCount: number;
  unassignedCount: number;
  checkedAt: string;
};

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1DUKyQPbnQuNKJfU40fygxZ1eqNR0SExWgGAK358ulQw/edit?coid=1661698131&gid=0#gid=0";

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function anchorId(value: string) {
  return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function Home() {
  const [data, setData] = useState<ResourceResponse | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeStrategy, setActiveStrategy] = useState("All Strategies");

  useEffect(() => {
    let active = true;

    fetch("/api/resources")
      .then((response) => {
        if (!response.ok) throw new Error("The resource feed could not be loaded.");
        return response.json() as Promise<ResourceResponse>;
      })
      .then((payload) => active && setData(payload))
      .catch((reason: Error) => active && setError(reason.message));

    return () => {
      active = false;
    };
  }, []);

  const strategies = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.resources.map((resource) => resource.strategy))).sort((a, b) => {
      if (a === "General Reference") return 1;
      if (b === "General Reference") return -1;
      return a.localeCompare(b);
    });
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const search = normalize(query);

    return data.resources.filter((resource) => {
      const strategyMatch = activeStrategy === "All Strategies" || resource.strategy === activeStrategy;
      const haystack = normalize(
        [resource.title, resource.description, resource.useWhen, resource.fileName, resource.action, resource.tactical, resource.strategy].join(" "),
      );
      return strategyMatch && (!search || haystack.includes(search));
    });
  }, [activeStrategy, data, query]);

  const grouped = useMemo(() => {
    const result = new Map<string, Map<string, Resource[]>>();
    filtered.forEach((resource) => {
      if (!result.has(resource.strategy)) result.set(resource.strategy, new Map());
      const tactical = result.get(resource.strategy)!;
      if (!tactical.has(resource.tactical)) tactical.set(resource.tactical, []);
      tactical.get(resource.tactical)!.push(resource);
    });
    return result;
  }, [filtered]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    document.getElementById("resource-library")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const chooseStrategy = (strategy: string) => {
    setActiveStrategy(strategy);
    window.setTimeout(() => {
      document.getElementById("resource-library")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 30);
  };

  return (
    <main id="top">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="REVREBEL resource hub home">
          <Image src="/revrebel-logo-blue.svg" alt="REVREBEL" width={1180} height={175} priority />
        </a>
        <nav aria-label="Primary navigation">
          <a href="#strategies">Strategies</a>
          <a href="#resource-library">Resources</a>
          <a href="/campaigns">Campaigns</a>
          <a href="/blogs">Blogs</a>
          <a href="/photos">Photos</a>
          <a href="#using-the-hub">How to Use</a>
          <form action="/api/logout" method="post">
            <button type="submit">Lock Portal</button>
          </form>
        </nav>
        <span className="property-label">Now Now NoHo</span>
      </header>

      <section className="hero">
        <div className="page-shell hero-grid">
          <div>
            <p className="eyebrow">Commercial Engine Performance Healthcheck</p>
            <h1>Strategy Playlist Resource Hub</h1>
          </div>
          <div className="hero-intro">
            <p>A self-help portal for the documents, examples, and implementation guidance connected to the Now Now NoHo strategy playlist.</p>
            <div className="live-status" aria-live="polite">
              <span className="status-dot" />
              {data ? `${data.activeCount} active resources connected` : error || "Connecting to the resource hub"}
            </div>
          </div>
        </div>

        <div className="page-shell">
          <form className="search-form" role="search" onSubmit={submitSearch}>
            <label className="sr-only" htmlFor="resource-search">Search documents, tasks, or workstreams</label>
            <input id="resource-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a task, topic, or document" />
            <button type="submit">Search Resources</button>
          </form>
        </div>
      </section>

      <section className="section page-shell" id="strategies">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Start Here</p>
            <h2>Main Workstreams</h2>
          </div>
          <p>Select the related strategy item first. Each section then follows the tactical workstream down to the supporting resources.</p>
        </div>

        <div className="strategy-grid">
          {strategies.map((strategy, index) => {
            const count = data?.resources.filter((resource) => resource.strategy === strategy).length ?? 0;
            return (
              <button className="strategy-card" key={strategy} onClick={() => chooseStrategy(strategy)}>
                <span className="strategy-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="strategy-title">{strategy}</span>
                <span className="strategy-count">{count} resources</span>
                <span className="strategy-arrow rr-arrow" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </section>

      <section className="library-section" id="resource-library">
        <div className="page-shell">
          <div className="library-toolbar">
            <div>
              <p className="eyebrow">Documentation Library</p>
              <h2>Find the Resource for the Work</h2>
            </div>
            <div className="toolbar-actions">
              <span>{filtered.length} results</span>
              <a href={SHEET_URL} target="_blank" rel="noreferrer">Access Playlist</a>
            </div>
          </div>

          <div className="filter-row" aria-label="Filter by strategy item">
            {["All Strategies", ...strategies].map((strategy) => (
              <button key={strategy} className={activeStrategy === strategy ? "active" : ""} onClick={() => setActiveStrategy(strategy)}>{strategy}</button>
            ))}
          </div>

          {!data && !error && <div className="loading-state">Loading the connected resource library…</div>}
          {error && (
            <div className="empty-state">
              <h3>The live resource feed is temporarily unavailable</h3>
              <p>{error} Use the Strategy Playlist while the connection is restored.</p>
              <a href={SHEET_URL} target="_blank" rel="noreferrer">Access Playlist</a>
            </div>
          )}

          {data && filtered.length === 0 && (
            <div className="empty-state">
              <h3>No matching resources</h3>
              <p>Try a broader task, system, topic, or strategy name.</p>
              <button onClick={() => { setQuery(""); setActiveStrategy("All Strategies"); }}>Clear Search</button>
            </div>
          )}

          <div className="resource-groups">
            {Array.from(grouped.entries()).map(([strategy, tacticalGroups]) => (
              <section className="strategy-section" id={anchorId(strategy)} key={strategy}>
                <div className="strategy-section-heading">
                  <span>Related Strategy Item</span>
                  <h3>{strategy}</h3>
                </div>

                {Array.from(tacticalGroups.entries()).map(([tactical, resources]) => (
                  <div className="tactical-group" key={`${strategy}-${tactical}`}>
                    <div className="tactical-heading">
                      <span>Sub Workstream</span>
                      <h4>{tactical}</h4>
                      <span>{resources.length} {resources.length === 1 ? "resource" : "resources"}</span>
                    </div>

                    <div className="resource-grid">
                      {resources.map((resource) => (
                        <article className="resource-card" key={resource.id}>
                          <div className="resource-card-topline">
                            <span>{resource.format}</span>
                            {resource.action && <span>{resource.action}</span>}
                          </div>
                          <h5>{resource.title}</h5>
                          <p>{resource.description}</p>
                          <div className="use-when">
                            <strong>Use this when</strong>
                            <span>{resource.useWhen || "You need supporting guidance for this workstream."}</span>
                          </div>
                          {resource.href ? (
                            <a className="resource-link" href={resource.href} target="_blank" rel="noreferrer">Open Resource <span className="rr-arrow" aria-hidden="true" /></a>
                          ) : (
                            <span className="resource-link disabled">Link Pending</span>
                          )}
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className="how-section" id="using-the-hub">
        <div className="page-shell how-grid">
          <div>
            <p className="eyebrow">Using the Hub</p>
            <h2>Follow the Playlist Structure</h2>
          </div>
          <ol>
            <li><span>01</span><div><strong>Start with the strategy item</strong><p>Find the main workstream assigned in the playlist.</p></div></li>
            <li><span>02</span><div><strong>Open the tactical workstream</strong><p>Narrow the work to the related setup, content, or channel task.</p></div></li>
            <li><span>03</span><div><strong>Use the connected resource</strong><p>Open the guide, example, code file, or supporting evidence needed to complete the work.</p></div></li>
          </ol>
        </div>
      </section>

      <footer>
        <div className="page-shell footer-inner">
          <Image src="/revrebel-logo-white.svg" alt="REVREBEL" width={1180} height={175} />
          <p>Strategy Playlist Resource Hub for Now Now NoHo</p>
          <a href="#top">Back to Top ↑</a>
        </div>
      </footer>
    </main>
  );
}
