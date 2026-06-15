import { useState } from "react";

const STAGE_MAP = {
  GROUP_STAGE:     "Group Stage",
  LAST_32:         "Round of 32",
  LAST_16:         "Round of 16",
  QUARTER_FINALS:  "Quarter-final",
  SEMI_FINALS:     "Semi-final",
  THIRD_PLACE:     "3rd Place Play-off",
  FINAL:           "Final",
};

function CrestBadge({ crest, flag, participant }) {
  return (
    <div className="crest-badge">
      {crest
        ? <img src={crest} alt="" />
        : <span className="flag-emoji">{flag ?? "🏳️"}</span>
      }
    </div>
  );
}

function MatchCard({ match, teamToParticipant }) {
  const hName  = match.homeTeam?.name || "TBD";
  const aName  = match.awayTeam?.name || "TBD";
  const hP     = teamToParticipant[hName];
  const aP     = teamToParticipant[aName];
  const hScore = match.score?.fullTime?.home;
  const aScore = match.score?.fullTime?.away;
  const finished = match.status === "FINISHED";
  const live     = match.status === "IN_PLAY" || match.status === "PAUSED";
  const hWon   = finished && match.score?.winner === "HOME_TEAM";
  const aWon   = finished && match.score?.winner === "AWAY_TEAM";
  const hasScore = hScore !== null && hScore !== undefined;
  const stage  = STAGE_MAP[match.stage] ?? (match.stage ?? "Group Stage");
  const time   = new Date(match.utcDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const statusLabel = finished
    ? "Full Time"
    : match.status === "PAUSED"
    ? "Half Time"
    : null;

  return (
    <div className="match-card">
      {/* Eyebrow */}
      <div className="match-eyebrow">
        <span>{stage}</span>
        {live
          ? <span className="match-live-badge"><span className="live-dot" />{match.minute ? `${match.minute}'` : "Live"}</span>
          : !finished && <span>{time}</span>
        }
      </div>

      {/* Score row */}
      <div className="match-score-grid">
        {/* Home */}
        <div className="match-side-home">
          <CrestBadge crest={match.homeTeam?.crest} flag={hP?.flag} />
          <span className={`score-num${!hasScore ? " ns" : aWon ? " loser" : ""}`}>
            {hasScore ? hScore : "—"}
          </span>
        </div>

        {/* Center */}
        <div className="match-center">
          {live && match.minute
            ? <span className="match-live-min">{match.minute}'</span>
            : statusLabel
            ? <span className="match-status-txt">{statusLabel}</span>
            : <span className="match-status-txt">{time}</span>
          }
        </div>

        {/* Away */}
        <div className="match-side-away">
          <span className={`score-num${!hasScore ? " ns" : hWon ? " loser" : ""}`}>
            {hasScore ? aScore : "—"}
          </span>
          <CrestBadge crest={match.awayTeam?.crest} flag={aP?.flag} />
        </div>
      </div>

      {/* Team names */}
      <div className="match-names-grid">
        <div className={`match-team-txt${aWon ? " loser" : ""}`}>
          {hName}
          {hP && <span className="participant-tag" style={{ color: hP.color }}>{hP.name}</span>}
        </div>
        <div className="match-names-center" />
        <div className={`match-team-txt away${hWon ? " loser" : ""}`}>
          {aName}
          {aP && <span className="participant-tag" style={{ color: aP.color }}>{aP.name}</span>}
        </div>
      </div>
    </div>
  );
}

export default function Fixtures({ fixtures, teamToParticipant, participants }) {
  const [filter, setFilter]                     = useState("all");
  const [selectedParticipant, setSelectedParticipant] = useState("");

  const allMatches = [
    ...(fixtures.live     || []),
    ...(fixtures.finished || []),
    ...(fixtures.scheduled|| []),
  ].sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

  const filtered = allMatches.filter(m => {
    if (filter === "today") return new Date(m.utcDate).toDateString() === new Date().toDateString();
    if (filter === "mine" && selectedParticipant) {
      const p = participants.find(p => p.name === selectedParticipant);
      if (!p) return true;
      const names = p.teams.map(t => t.apiName);
      return names.includes(m.homeTeam?.name) || names.includes(m.awayTeam?.name);
    }
    return true;
  });

  const byDate = filtered.reduce((acc, m) => {
    const d = new Date(m.utcDate).toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
    (acc[d] = acc[d] || []).push(m);
    return acc;
  }, {});

  const FILTERS = [{ id:"all",label:"All" }, { id:"today",label:"Today" }, { id:"mine",label:"My Teams" }];

  return (
    <main style={{ paddingBottom: 16 }}>
      {/* Filter — Apple "Yesterday | Today | Upcoming" style */}
      <div className="fixture-filter">
        {FILTERS.map((f, i) => (
          <div key={f.id} style={{ display: "contents" }}>
            {i > 0 && <div className="fixture-filter-sep" />}
            <button
              className={`fixture-filter-btn${filter === f.id ? " active" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          </div>
        ))}
        {filter === "mine" && (
          <select
            className="fixture-filter-select"
            value={selectedParticipant}
            onChange={e => setSelectedParticipant(e.target.value)}
          >
            <option value="">Select…</option>
            {participants.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
        )}
      </div>

      {Object.keys(byDate).length === 0 && (
        <div className="empty-state">No matches to show.</div>
      )}

      {Object.entries(byDate).map(([date, matches]) => (
        <div key={date} className="date-section">
          <div className="date-heading">{date}</div>
          {matches.map(m => (
            <MatchCard key={m.id} match={m} teamToParticipant={teamToParticipant} />
          ))}
        </div>
      ))}
    </main>
  );
}
