import { useState } from "react";

const STAGE_LABELS = {
  GROUP_STAGE: "Group Stage",
  LAST_32: "Round of 32",
  LAST_16: "Round of 16",
  QUARTER_FINALS: "Quarter-final",
  SEMI_FINALS: "Semi-final",
  THIRD_PLACE: "3rd Place",
  FINAL: "Final",
};

function MatchCard({ match, teamToParticipant }) {
  const homeName = match.homeTeam?.name || "TBD";
  const awayName = match.awayTeam?.name || "TBD";
  const homeP = teamToParticipant[homeName];
  const awayP = teamToParticipant[awayName];
  const hScore = match.score?.fullTime?.home;
  const aScore = match.score?.fullTime?.away;
  const isLive = match.status === "IN_PLAY" || match.status === "PAUSED";
  const isFinished = match.status === "FINISHED";
  const homeWon = isFinished && match.score?.winner === "HOME_TEAM";
  const awayWon = isFinished && match.score?.winner === "AWAY_TEAM";
  const hasScore = hScore !== null && hScore !== undefined;

  const stageLabel = STAGE_LABELS[match.stage] ?? match.stage ?? "Group Stage";
  const time = new Date(match.utcDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const statusText = isFinished
    ? "Full Time"
    : match.status === "PAUSED"
    ? "Half Time"
    : isLive
    ? null
    : time;

  return (
    <div className="match-card-wrap">
      {/* Eyebrow */}
      <div className="match-eyebrow">
        <span>{stageLabel}</span>
        {isLive ? (
          <span className="live-label">
            <span className="live-dot" />
            {match.minute ? `${match.minute}'` : "Live"}
          </span>
        ) : null}
      </div>

      {/* Score row */}
      <div className="match-body">
        {/* Home side */}
        <div className="match-side">
          {match.homeTeam?.crest ? (
            <img src={match.homeTeam.crest} alt="" className="match-crest" />
          ) : (
            <span className="match-flag">{homeP?.flag ?? "🏳️"}</span>
          )}
          {hasScore ? (
            <span className={`match-score${awayWon ? " dim" : ""}`}>{hScore}</span>
          ) : (
            <span className="match-score pending">—</span>
          )}
        </div>

        {/* Centre */}
        <div className="match-center">
          {isLive && match.minute ? (
            <span className="match-minute">{match.minute}'</span>
          ) : (
            <span className="match-status-text">{statusText}</span>
          )}
        </div>

        {/* Away side */}
        <div className="match-side away">
          {hasScore ? (
            <span className={`match-score${homeWon ? " dim" : ""}`}>{aScore}</span>
          ) : (
            <span className="match-score pending">—</span>
          )}
          {match.awayTeam?.crest ? (
            <img src={match.awayTeam.crest} alt="" className="match-crest" />
          ) : (
            <span className="match-flag">{awayP?.flag ?? "🏳️"}</span>
          )}
        </div>
      </div>

      {/* Team names row */}
      <div className="match-names">
        <div className="match-team-name" style={{ opacity: awayWon ? .45 : 1 }}>
          {homeName}
          {homeP && (
            <span className="match-participant" style={{ color: homeP.color }}>{homeP.name}</span>
          )}
        </div>
        <div className="match-divider" />
        <div className="match-team-name away" style={{ opacity: homeWon ? .45 : 1 }}>
          {awayName}
          {awayP && (
            <span className="match-participant" style={{ color: awayP.color }}>{awayP.name}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Fixtures({ fixtures, teamToParticipant, participants }) {
  const [filter, setFilter] = useState("all");
  const [selectedParticipant, setSelectedParticipant] = useState("");

  const allMatches = [
    ...(fixtures.live || []),
    ...(fixtures.finished || []),
    ...(fixtures.scheduled || []),
  ].sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

  const filtered = allMatches.filter(m => {
    if (filter === "today") {
      return new Date(m.utcDate).toDateString() === new Date().toDateString();
    }
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
    if (!acc[d]) acc[d] = [];
    acc[d].push(m);
    return acc;
  }, {});

  const FILTERS = [
    { id: "all", label: "All" },
    { id: "today", label: "Today" },
    { id: "mine", label: "My Teams" },
  ];

  return (
    <main style={{ paddingBottom: 60 }}>
      <div className="filter-bar">
        {FILTERS.map(f => (
          <button key={f.id} className={`pill${filter === f.id ? " active" : ""}`} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
        {filter === "mine" && (
          <select
            className="filter-select"
            value={selectedParticipant}
            onChange={e => setSelectedParticipant(e.target.value)}
          >
            <option value="">Select participant…</option>
            {participants.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
        )}
      </div>

      {Object.keys(byDate).length === 0 && (
        <div className="empty-state">No matches to show.</div>
      )}

      {Object.entries(byDate).map(([date, matches]) => (
        <section key={date}>
          <div className="date-label">{date}</div>
          {matches.map(m => (
            <MatchCard key={m.id} match={m} teamToParticipant={teamToParticipant} />
          ))}
        </section>
      ))}
    </main>
  );
}
