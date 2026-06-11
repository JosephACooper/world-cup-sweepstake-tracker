export const STAGE_LABELS = {
  0: "Group Stage",
  0.5: "Round of 32",
  1: "Round of 16",
  2: "Quarter-final",
  3: "Semi-final",
  4: "Runner-up",
  5: "Winner",
};

export const STAGE_CLASSES = {
  0: "stage-group",
  0.5: "stage-r32",
  1: "stage-r16",
  2: "stage-qf",
  3: "stage-sf",
  4: "stage-runner-up",
  5: "stage-winner",
};

export function getExpected(rank) {
  if (rank <= 8) return 4.0;
  if (rank <= 16) return 3.0;
  if (rank <= 24) return 2.0;
  if (rank <= 32) return 1.0;
  return 0.0;
}

function stageToPoints(stage) {
  switch (stage) {
    case "GROUP_STAGE": return 0;
    case "ROUND_OF_32": return 0.5;
    case "ROUND_OF_16": return 1;
    case "QUARTER_FINALS": return 2;
    case "SEMI_FINALS": return 3;
    case "THIRD_PLACE": return 3;
    default: return null;
  }
}

function setHighest(finishes, teamName, points) {
  if (!teamName || points === null) return;
  if (finishes[teamName] === undefined || points > finishes[teamName]) {
    finishes[teamName] = points;
  }
}

export function deriveTeamFinishes(matches = []) {
  return matches.reduce((finishes, match) => {
    if (match.status !== "FINISHED") return finishes;

    const stage = match.stage;
    const homeName = match.homeTeam?.name;
    const awayName = match.awayTeam?.name;

    if (!homeName || !awayName) return finishes;

    if (stage === "GROUP_STAGE") {
      setHighest(finishes, homeName, 0);
      setHighest(finishes, awayName, 0);
      return finishes;
    }

    const winner = match.score?.winner;

    if (stage === "FINAL") {
      if (winner === "HOME_TEAM") {
        setHighest(finishes, homeName, 5);
        setHighest(finishes, awayName, 4);
      } else if (winner === "AWAY_TEAM") {
        setHighest(finishes, awayName, 5);
        setHighest(finishes, homeName, 4);
      }
      return finishes;
    }

    const pts = stageToPoints(stage);
    if (pts === null) return finishes;

    // Both teams get credit for reaching this round; winner gets updated in next round
    setHighest(finishes, homeName, pts);
    setHighest(finishes, awayName, pts);

    return finishes;
  }, {});
}

export function computeParticipantScores(participants = [], teamFinishes = {}) {
  return participants.map((participant) => {
    const teamsWithScores = participant.teams.map((team) => {
      const actual = teamFinishes[team.apiName] ?? null;
      const expected = getExpected(team.rank);
      const score = actual === null ? null : actual - expected;
      return { ...team, actual, expected, score };
    });

    const scoredTeams = teamsWithScores.filter((t) => t.score !== null);
    const bestTeam = scoredTeams.reduce((best, team) => {
      if (!best) return team;
      if (team.score !== best.score) return team.score > best.score ? team : best;
      if (team.rank !== best.rank) return team.rank > best.rank ? team : best;
      return team.actual > best.actual ? team : best;
    }, null);

    return { ...participant, teamsWithScores, bestScore: bestTeam?.score ?? null, bestTeam };
  });
}

export function sortLeaderboard(participantData = []) {
  return [...participantData]
    .filter((p) => p.bestScore !== null)
    .sort((a, b) => {
      if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
      if (b.bestTeam.rank !== a.bestTeam.rank) return b.bestTeam.rank - a.bestTeam.rank;
      return b.bestTeam.actual - a.bestTeam.actual;
    });
}

export function getPrizeWinners(participantData = [], bracket = {}) {
  const allTeams = participantData.flatMap(p =>
    p.teamsWithScores.map(t => ({ ...t, participant: p.name, participantColor: p.color }))
  );

  const winner = allTeams.find(t => t.actual === 5) ?? null;
  const runnerUp = allTeams.find(t => t.actual === 4) ?? null;

  let thirdPlace = null;
  const thirdMatch = (bracket.third || []).find(m => m.status === "FINISHED" && m.score?.winner);
  if (thirdMatch) {
    const thirdWinnerApiName = thirdMatch.score.winner === "HOME_TEAM"
      ? thirdMatch.homeTeam?.name
      : thirdMatch.awayTeam?.name;
    thirdPlace = allTeams.find(t => t.apiName === thirdWinnerApiName) ?? null;
  }

  const underdogTeam = allTeams
    .filter(t => t.score !== null)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.rank - a.rank;
    })[0] ?? null;

  return {
    winner: winner ? { participant: winner.participant, color: winner.participantColor, team: winner } : null,
    runnerUp: runnerUp ? { participant: runnerUp.participant, color: runnerUp.participantColor, team: runnerUp } : null,
    thirdPlace: thirdPlace ? { participant: thirdPlace.participant, color: thirdPlace.participantColor, team: thirdPlace } : null,
    underdog: underdogTeam ? { participant: underdogTeam.participant, color: underdogTeam.participantColor, team: underdogTeam } : null,
  };
}
