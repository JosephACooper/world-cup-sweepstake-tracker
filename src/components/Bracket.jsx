function TeamSlot({ name, crest, score, won, lost, isLive, participant }) {
  return (
    <div
      className={`match-team-slot${won ? " won" : ""}${lost ? " lost" : ""}`}
      style={participant ? { borderLeft: `3px solid ${participant.color}` } : { borderLeft: "3px solid transparent" }}
    >
      {crest && <img src={crest} alt="" style={{ width: 16, height: 16, objectFit: "contain", flexShrink: 0 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className={`match-team-name${won ? " won" : ""}`}>{name}</div>
        {participant && (
          <div style={{ fontSize: 10, color: participant.color, marginTop: 1 }}>{participant.name}</div>
        )}
      </div>
      {score !== null && score !== undefined && (
        <div className="match-team-score" style={{ color: won ? "var(--label-primary)" : "var(--label-tertiary)" }}>
          {score}
        </div>
      )}
      {isLive && <div className="match-live-dot" />}
    </div>
  );
}

function MatchCard({ match, teamToParticipant }) {
  if (!match) {
    return (
      <div className="match-card">
        <TeamSlot name="TBD" />
        <div className="match-separator" />
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
    <div className="match-card">
      <TeamSlot
        name={homeName}
        crest={match.homeTeam?.crest}
        score={match.score?.fullTime?.home}
        won={homeWon}
        lost={awayWon}
        isLive={isLive}
        participant={teamToParticipant[homeName]}
      />
      <div className="match-separator" />
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

const ROUND_LABELS = {
  r32: "Rd of 32", r16: "Rd of 16", qf: "Quarter-finals",
  sf: "Semi-finals", third: "3rd Place", final: "Final",
};
const ROUND_ORDER = ["r32", "r16", "qf", "sf", "third", "final"];
const ROUND_MATCH_COUNTS = { r32: 16, r16: 8, qf: 4, sf: 2, third: 1, final: 1 };

export default function Bracket({ bracket, teamToParticipant }) {
  if (!bracket) return null;

  const lastFilledIdx = ROUND_ORDER.reduce(
    (last, r, i) => ((bracket[r] || []).length > 0 ? i : last),
    -1
  );

  if (lastFilledIdx === -1) {
    return (
      <div className="empty-state">
        Knockout bracket not yet available. Check back after the group stage.
      </div>
    );
  }

  const visibleRounds = ROUND_ORDER.slice(0, lastFilledIdx + 1);

  return (
    <div className="bracket-container">
      <div className="bracket-inner">
        {visibleRounds.map(round => {
          const matches = bracket[round] || [];
          const isEmpty = matches.length === 0;
          return (
            <div key={round} className="bracket-round">
              <div className="bracket-round-label">{ROUND_LABELS[round]}</div>
              {isEmpty
                ? Array.from({ length: ROUND_MATCH_COUNTS[round] ?? 1 }).map((_, i) => (
                    <MatchCard key={i} match={null} teamToParticipant={teamToParticipant} />
                  ))
                : matches.map((match, i) => (
                    <MatchCard key={match.id ?? i} match={match} teamToParticipant={teamToParticipant} />
                  ))
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}
