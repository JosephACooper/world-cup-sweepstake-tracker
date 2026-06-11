import { useState } from "react";

const STATUS_BADGES = {
  FINISHED: { label: "FT", color: "#3a5070", bg: "#0d1e30" },
  AWARDED: { label: "FT", color: "#3a5070", bg: "#0d1e30" },
  IN_PLAY: { label: "LIVE", color: "#ef4444", bg: "#1a0505", pulse: true },
  PAUSED: { label: "HT", color: "#f59e0b", bg: "#1a1205" },
  EXTRA_TIME: { label: "ET", color: "#ef4444", bg: "#1a0505", pulse: true },
  PENALTY_SHOOTOUT: { label: "PEN", color: "#ef4444", bg: "#1a0505", pulse: true },
  SCHEDULED: { label: "NS", color: "#3a5070", bg: "#0d1e30" },
  TIMED: { label: "NS", color: "#3a5070", bg: "#0d1e30" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_BADGES[status] || { label: status, color: "#3a5070", bg: "#0d1e30" };
  return (
    <span style={{
      padding: "2px 7px",
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 700,
      color: cfg.color,
      background: cfg.bg,
      border: `1px solid ${cfg.color}30`,
      ...(cfg.pulse ? { animation: "pulse 1.5s infinite" } : {}),
    }}>
      {cfg.label}
    </span>
  );
}

function FixtureRow({ match, teamToParticipant }) {
  const homeName = match.homeTeam?.name || "TBD";
  const awayName = match.awayTeam?.name || "TBD";
  const homeP = teamToParticipant[homeName];
  const awayP = teamToParticipant[awayName];
  const homeScore = match.score?.fullTime?.home ?? match.score?.halfTime?.home;
  const awayScore = match.score?.fullTime?.away ?? match.score?.halfTime?.away;
  const isLive = ["IN_PLAY", "PAUSED", "EXTRA_TIME", "PENALTY_SHOOTOUT"].includes(match.status);
  const time = new Date(match.utcDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "40px 1fr auto 1fr auto",
      gap: 8,
      alignItems: "center",
      padding: "10px 16px",
      borderBottom: "1px solid #0d1e30",
    }}>
      <div style={{ color: "#3a5070", fontSize: 11, textAlign: "center" }}>
        {isLive && match.minute ? <span style={{ color: "#ef4444", fontWeight: 700 }}>{match.minute}'</span> : time}
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ color: "#dde4f0", fontSize: 13, fontWeight: 500 }}>
          {match.homeTeam?.crest ? <img src={match.homeTeam.crest} alt="" style={{ width: 16, height: 16, objectFit: "contain", marginRight: 4, verticalAlign: "middle" }} /> : null}
          {homeName}
        </div>
        {homeP ? <div style={{ color: homeP.color, fontSize: 11 }}>{homeP.name}</div> : null}
      </div>
      <div style={{ textAlign: "center", fontWeight: 700, fontSize: 15, color: "#dde4f0", minWidth: 50 }}>
        {homeScore !== null && homeScore !== undefined ? `${homeScore}–${awayScore}` : "vs"}
      </div>
      <div style={{ textAlign: "left" }}>
        <div style={{ color: "#dde4f0", fontSize: 13, fontWeight: 500 }}>
          {match.awayTeam?.crest ? <img src={match.awayTeam.crest} alt="" style={{ width: 16, height: 16, objectFit: "contain", marginRight: 4, verticalAlign: "middle" }} /> : null}
          {awayName}
        </div>
        {awayP ? <div style={{ color: awayP.color, fontSize: 11 }}>{awayP.name}</div> : null}
      </div>
      <div><StatusBadge status={match.status} /></div>
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
      const today = new Date().toDateString();
      return new Date(m.utcDate).toDateString() === today;
    }
    if (filter === "mine" && selectedParticipant) {
      const p = participants.find(p => p.name === selectedParticipant);
      if (!p) return true;
      const teamNames = p.teams.map(t => t.apiName);
      return teamNames.includes(m.homeTeam?.name) || teamNames.includes(m.awayTeam?.name);
    }
    return true;
  });

  const byDate = filtered.reduce((acc, m) => {
    const date = new Date(m.utcDate).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
    if (!acc[date]) acc[date] = [];
    acc[date].push(m);
    return acc;
  }, {});

  return (
    <main style={{ paddingBottom: 60 }}>
      <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }`}</style>
      <div style={{ padding: "12px 16px", display: "flex", gap: 8, flexWrap: "wrap", borderBottom: "1px solid #132035" }}>
        {["all","today","mine"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 14px",
            borderRadius: 20,
            border: `1px solid ${filter === f ? "#c9a227" : "#132035"}`,
            background: filter === f ? "#c9a22720" : "transparent",
            color: filter === f ? "#c9a227" : "#3a5070",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}>
            {f === "all" ? "All" : f === "today" ? "Today" : "My Teams"}
          </button>
        ))}
        {filter === "mine" ? (
          <select
            value={selectedParticipant}
            onChange={e => setSelectedParticipant(e.target.value)}
            style={{
              background: "#0b1928",
              color: "#dde4f0",
              border: "1px solid #132035",
              borderRadius: 8,
              padding: "6px 10px",
              fontSize: 12,
            }}
          >
            <option value="">Select name…</option>
            {participants.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
        ) : null}
      </div>

      {Object.keys(byDate).length === 0 ? (
        <div style={{ color: "#3a5070", textAlign: "center", padding: "48px 16px" }}>
          No matches to show.
        </div>
      ) : null}

      {Object.entries(byDate).map(([date, matches]) => (
        <section key={date}>
          <div style={{
            padding: "10px 16px",
            color: "#3a5070",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            background: "#070e18",
            borderBottom: "1px solid #132035",
            borderTop: "1px solid #132035",
          }}>
            {date}
          </div>
          {matches.map(m => (
            <FixtureRow key={m.id} match={m} teamToParticipant={teamToParticipant} />
          ))}
        </section>
      ))}
    </main>
  );
}
