type PlaylistFiltersProps = {
  query: string;
  status: string;
  teamLead: string;
  statuses: string[];
  teamLeads: string[];
  shown: number;
  total: number;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onTeamLeadChange: (value: string) => void;
};

export default function PlaylistFilters({
  query,
  status,
  teamLead,
  statuses,
  teamLeads,
  shown,
  total,
  onQueryChange,
  onStatusChange,
  onTeamLeadChange,
}: PlaylistFiltersProps) {
  return (
    <section className="playlist-filters" aria-label="Playlist filters">
      <div className="playlist-filter playlist-filter--search">
        <label htmlFor="playlist-search">Search</label>
        <input
          id="playlist-search"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Action item, workstream, owner, dependency…"
        />
      </div>

      <div className="playlist-filter">
        <label htmlFor="playlist-status">Status</label>
        <select id="playlist-status" value={status} onChange={(event) => onStatusChange(event.target.value)}>
          <option value="">All Statuses</option>
          {statuses.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      <div className="playlist-filter">
        <label htmlFor="playlist-lead">Team Lead</label>
        <select id="playlist-lead" value={teamLead} onChange={(event) => onTeamLeadChange(event.target.value)}>
          <option value="">All Team Leads</option>
          {teamLeads.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      <div className="playlist-filter-count" aria-live="polite">
        <strong>{shown.toLocaleString()}</strong>
        <span>of {total.toLocaleString()} shown</span>
      </div>
    </section>
  );
}
