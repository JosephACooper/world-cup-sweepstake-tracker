import { useState } from "react";

const STATUS_CONFIG = {
  FINISHED: { label: "FT", cls: "finished" },
  IN_PLAY:  { label: "Live", cls: "live", dot: true },
  PAUSED:   { label: "HT", cls: "halftime" },
  SCHEDULED:{ label: "NS", cls: "scheduled" },
  TIMED:    { label: "NS", cls: "scheduled" },
};

function StatusChip({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, cls: "scheduled" };
  return (
    <span className={`status-chip ${cfg.cls}`}>
      {cfg.dot && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />}
      {cfg.label}
    </span>
  );
}

function FixtureRow({ match, teamToParticipant }) {
  const homeName = match.homeTeam?.name || "TBD";
  const awayName = match.awayTeam?.name || "TBD";
  const homeP = teamToParticipant[homeName];
  const awayP = teamToParticipant[awayName];
  const homeScore = match.score?.fullTime?.home;
  const awayScore = match.score?.fullTime?.away;
  const isLive = match.status === "IN_PLAY" || match.status === "PAUSED";
  const isFinished = match.status === "FINISHED";
  const time = new Date(match.utcDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const homeWon = isFinished && match.score?.winner === "HOME_TEAM";
  const awayWon = isFinished && match.score?.winner === "AWAY_TEAM";

  return (
    <div className="fixture-row">
      <div className={`fixture-time${isLive ? " live" : ""}`}>
        {isLive && match.minute ? `${match.minute}'` : time}
      </div>

      <div className="fixture-team home">
        <div>
          <div className="fixture-team-name" style={{ fontWeight: homeWon ? 700 : 500, opacity: awayWon ? 0.5 : 1 }}>
            {match.homeTeam?.crest && (
              <img src={match.homeTeam.crest} alt="" style={{ width: 15, height: 15, objectFit: "contain", marginRight: 5, verticalAlign: "middle" }} />
            )}
            {homeName}
          </div>
          {homeP && (
            <div className="fixture-participant" style={{ color: homeP.color, textAlign: "right" }}>
              {homeP.name}
            </div>
          )}
        </div>
      </div>

      <div>
        {homeScore !== null && homeScore !== undefined ? (
          <div className="fixture-score">{homeScore}–{awayScore}</div>
        ) : (
          <div className="fixture-score pending">vs</div>
        )}
      </div>

      <div className="fixture-team away">
        <div>
          <div className="fixture-team-name" style={{ fontWeight: awayWon ? 700 : 500, opacity: homeWon ? 0.5 : 1 }}>
            {match.awayTeam?.crest && (
              <img src={match.awayTeam.crest} alt="" style={{ width: 15, height: 15, objectFit: "contain", marginRight: 5, verticalAlign: "middle" }} />
            )}
            {awayName}
          </div>
          {awayP && (
            <div className="fixture-participant" style={{ color: awayP.color }}>
              {awayP.name}
            </div>
          )}
        </div>
      </div>

      <div className="fixture-status">
        <StatusChip status={match.status} />
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

  return (
    <main style={{ paddingBottom: 60 }}>
      <div className="fixture-filter-bar">
        {[
          { id: "all", label: "All" },
          { id: "today", label: "Today" },
          { id: "mine", label: "My Teams" },
        ].map(f => (
          <button
            key={f.id}
            className={`filter-pill${filter === f.id ? " active" : ""}`}
            onClick={() => setFilter(f.id)}
          >
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
            {participants.map(p => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      {Object.keys(byDate).length === 0 && (
        <div className="empty-state">No matches to show.</div>
      )}

      {Object.entries(byDate).map(([date, matches]) => (
        <section key={date}>
          <div className="date-header">{date}</div>
          <div className="fixture-group">
            {matches.map(m => (
              <FixtureRow key={m.id} match={m} teamToParticipant={teamToParticipant} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
