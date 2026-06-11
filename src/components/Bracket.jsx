function TeamSlot({ name, crest, score, won, lost, isLive, participant }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "8px 10px",
      opacity: lost ? 0.4 : 1,
      borderLeft: participant ? `3px solid ${participant.color}` : "3px solid transparent",
    }}>
      {crest ? <img src={crest} alt="" style={{ width: 18, height: 18, objectFit: "contain" }} /> : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: won ? "#dde4f0" : "#94a3b8", fontWeight: won ? 700 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {name}
        </div>
        {participant ? <div style={{ fontSize: 10, color: participant.color }}>{participant.name}</div> : null}
      </div>
      {score !== null && score !== undefined ? (
        <div style={{ fontWeight: 700, fontSize: 14, color: won ? "#dde4f0" : "#3a5070", minWidth: 18, textAlign: "right" }}>
          {score}
        </div>
      ) : null}
      {isLive ? <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} /> : null}
    </div>
  );
}

function MatchCard({ match, teamToParticipant }) {
  if (!match) {
    return (
      <div style={cardStyle}>
        <TeamSlot name="TBD" />
        <div style={{ height: 1, background: "#132035" }} />
        <TeamSlot name="TBD" />
      </div>
    );
  }

  const homeWon = match.status === "FINISHED" && match.score?.winner === "HOME_TEAM";
  const awayWon = match.status === "FINISHED" && match.score?.winner === "AWAY_TEAM";
  const isLive = match.status === "IN_PLAY" || match.status === "PAUSED";
  const homeName = match.homeTeam?.name || "TBD";
  const awayName = match.awayTeam?.name || "TBD";

  return (
    <div style={cardStyle}>
      <TeamSlot
        name={homeName}
        crest={match.homeTeam?.crest}
        score={match.score?.fullTime?.home}
        won={homeWon}
        lost={awayWon}
        isLive={isLive}
        participant={teamToParticipant[homeName]}
      />
      <div style={{ height: 1, background: "#132035" }} />
      <TeamSlot
        name={awayName}
        crest={match.awayTeam?.crest}
        score={match.score?.fullTime?.away}
        won={awayWon}
        lost={homeWon}
        isLive={isLive}
        participant={teamToParticipant[awayName]}
      />
    </div>
  );
}

const cardStyle = {
  background: "#0b1928",
  border: "1px solid #132035",
  borderRadius: 8,
  overflow: "hidden",
  width: 200,
};

const ROUND_LABELS = { r32: "Round of 32", r16: "Round of 16", qf: "Quarter-finals", sf: "Semi-finals", third: "3rd Place", final: "Final" };
const ROUND_ORDER = ["r32", "r16", "qf", "sf", "third", "final"];

export default function Bracket({ bracket, teamToParticipant }) {
  if (!bracket) return null;

  const hasAnyKnockout = ROUND_ORDER.some(r => (bracket[r] || []).length > 0);
  if (!hasAnyKnockout) {
    return (
      <main style={{ padding: 16, color: "#3a5070", textAlign: "center", paddingTop: 48 }}>
        Knockout bracket not yet available. Check back after the group stage.
      </main>
    );
  }

  return (
    <main style={{ paddingBottom: 60, overflowX: "auto" }}>
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", padding: 16, minWidth: "max-content" }}>
        {ROUND_ORDER.map(round => {
          const matches = bracket[round] || [];
          if (matches.length === 0) return null;
          return (
            <div key={round} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{
                color: "#3a5070",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                textAlign: "center",
                marginBottom: 4,
              }}>
                {ROUND_LABELS[round]}
              </div>
              {matches.map((match, i) => (
                <MatchCard key={match.id ?? i} match={match} teamToParticipant={teamToParticipant} />
              ))}
            </div>
          );
        })}
      </div>
    </main>
  );
}
