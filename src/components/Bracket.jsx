function TeamSlot({ name, crest, score, won, lost, isLive, participant }) {
  return (
    <div
      className={`bm-slot${won ? " won" : ""}${lost ? " lost" : ""}`}
      style={participant ? { borderLeft: `3px solid ${participant.color}` } : { borderLeft: "3px solid transparent" }}
    >
      {crest && <img src={crest} alt="" style={{ width:16, height:16, objectFit:"contain", flexShrink:0 }} />}
      <div style={{ flex:1, minWidth:0 }}>
        <div className={`bm-name${won ? " won" : ""}`}>{name}</div>
        {participant && <div className="bm-participant" style={{ color: participant.color }}>{participant.name}</div>}
      </div>
      {score !== null && score !== undefined && (
        <div className="bm-score" style={{ color: won ? "var(--text-1)" : "var(--text-3)" }}>{score}</div>
      )}
      {isLive && <div className="bm-live-dot" />}
    </div>
  );
}

function MatchCard({ match, teamToParticipant }) {
  if (!match) {
    return (
      <div className="bm-card">
        <TeamSlot name="TBD" />
        <div className="bm-sep" />
        <TeamSlot name="TBD" />
      </div>
    );
  }
  const homeWon = match.status === "FINISHED" && match.score?.winner === "HOME_TEAM";
  const awayWon = match.status === "FINISHED" && match.score?.winner === "AWAY_TEAM";
  const isLive  = match.status === "IN_PLAY" || match.status === "PAUSED";
  const hName   = match.homeTeam?.name || "TBD";
  const aName   = match.awayTeam?.name || "TBD";
  return (
    <div className="bm-card">
      <TeamSlot name={hName} crest={match.homeTeam?.crest} score={match.score?.fullTime?.home} won={homeWon} lost={awayWon} isLive={isLive} participant={teamToParticipant[hName]} />
      <div className="bm-sep" />
      <TeamSlot name={aName} crest={match.awayTeam?.crest} score={match.score?.fullTime?.away} won={awayWon} lost={homeWon} isLive={isLive} participant={teamToParticipant[aName]} />
    </div>
  );
}

const ROUND_LABELS = { r32:"Rd of 32", r16:"Rd of 16", qf:"Quarter-finals", sf:"Semi-finals", third:"3rd Place", final:"Final" };
const ROUND_ORDER  = ["r32","r16","qf","sf","third","final"];
const ROUND_COUNT  = { r32:16, r16:8, qf:4, sf:2, third:1, final:1 };

export default function Bracket({ bracket, teamToParticipant }) {
  if (!bracket) return null;
  const lastIdx = ROUND_ORDER.reduce((last, r, i) => ((bracket[r] || []).length > 0 ? i : last), -1);
  if (lastIdx === -1) {
    return <div className="empty-state">Knockout bracket not yet available. Check back after the group stage.</div>;
  }
  return (
    <div className="bracket-wrap">
      <div className="bracket-inner">
        {ROUND_ORDER.slice(0, lastIdx + 1).map(round => {
          const matches = bracket[round] || [];
          return (
            <div key={round} className="bracket-round">
              <div className="bracket-round-label">{ROUND_LABELS[round]}</div>
              {matches.length === 0
                ? Array.from({ length: ROUND_COUNT[round] ?? 1 }).map((_, i) => (
                    <MatchCard key={i} match={null} teamToParticipant={teamToParticipant} />
                  ))
                : matches.map((m, i) => (
                    <MatchCard key={m.id ?? i} match={m} teamToParticipant={teamToParticipant} />
                  ))
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}
