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

// Expected finish based on FIFA rank band (June 2026)
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

// Returns { [apiName]: stagePoints } — highest stage each team has reached
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

    setHighest(finishes, homeName, pts);
    setHighest(finishes, awayName, pts);

    return finishes;
  }, {});
}

// Build a lookup of apiName → FIFA rank from all participants
export function buildRankLookup(participants = []) {
  const lookup = {};
  for (const p of participants) {
    for (const t of p.teams) {
      if (t.apiName && t.rank) lookup[t.apiName] = t.rank;
    }
  }
  return lookup;
}

// Group stage bonus from standings: 1st = +0.5, 2nd = +0.25
// Returns { [teamName]: bonus }
export function deriveGroupBonuses(standings = []) {
  return standings.reduce((bonuses, group) => {
    for (const row of group.table || []) {
      const name = row.team?.name;
      if (!name) continue;
      if (row.position === 1) bonuses[name] = 0.5;
      else if (row.position === 2) bonuses[name] = 0.25;
    }
    return bonuses;
  }, {});
}

// Upset bonus: beat a team ranked 15+ places above you = +0.5 per win
// Returns { [teamName]: totalUpsetBonus }
const UPSET_THRESHOLD = 15;
const UPSET_BONUS_PER_WIN = 0.5;

export function deriveUpsetBonuses(matches = [], rankLookup = {}) {
  return matches.reduce((bonuses, match) => {
    if (match.status !== "FINISHED") return bonuses;

    const winner = match.score?.winner;
    if (!winner) return bonuses;

    const homeName = match.homeTeam?.name;
    const awayName = match.awayTeam?.name;
    if (!homeName || !awayName) return bonuses;

    const homeRank = rankLookup[homeName];
    const awayRank = rankLookup[awayName];
    if (!homeRank || !awayRank) return bonuses;

    let winnerName, winnerRank, loserRank;
    if (winner === "HOME_TEAM") {
      winnerName = homeName; winnerRank = homeRank; loserRank = awayRank;
    } else if (winner === "AWAY_TEAM") {
      winnerName = awayName; winnerRank = awayRank; loserRank = homeRank;
    } else {
      return bonuses;
    }

    // Upset: winner ranked worse (higher number) than loser by the threshold
    if (winnerRank - loserRank >= UPSET_THRESHOLD) {
      bonuses[winnerName] = (bonuses[winnerName] || 0) + UPSET_BONUS_PER_WIN;
    }

    return bonuses;
  }, {});
}

// Score per team = max(0, progression) + groupBonus + upsetBonus
// Participant total = sum of all team scores
export function computeParticipantScores(participants = [], teamFinishes = {}, groupBonuses = {}, upsetBonuses = {}) {
  return participants.map((participant) => {
    const teamsWithScores = participant.teams.map((team) => {
      const actual = teamFinishes[team.apiName] ?? null;
      const expected = getExpected(team.rank);
      const progression = actual === null ? null : actual - expected;
      const groupBonus = groupBonuses[team.apiName] ?? 0;
      const upsetBonus = upsetBonuses[team.apiName] ?? 0;
      const score = progression === null ? null : Math.max(0, progression) + groupBonus + upsetBonus;
      return { ...team, actual, expected, progression, groupBonus, upsetBonus, score };
    });

    const scoredTeams = teamsWithScores.filter((t) => t.score !== null);
    const totalScore = scoredTeams.length > 0
      ? scoredTeams.reduce((sum, t) => sum + t.score, 0)
      : null;

    const bestTeam = scoredTeams.reduce((best, team) => {
      if (!best) return team;
      if (team.score !== best.score) return team.score > best.score ? team : best;
      if (team.rank !== best.rank) return team.rank > best.rank ? team : best;
      return (team.actual || 0) > (best.actual || 0) ? team : best;
    }, null);

    return { ...participant, teamsWithScores, totalScore, bestScore: bestTeam?.score ?? null, bestTeam };
  });
}

// Sort by total score; tiebreak by best individual score, then underdog rank, then stage reached
export function sortLeaderboard(participantData = []) {
  return [...participantData]
    .filter((p) => p.totalScore !== null)
    .sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if ((b.bestScore || 0) !== (a.bestScore || 0)) return (b.bestScore || 0) - (a.bestScore || 0);
      if ((b.bestTeam?.rank || 0) !== (a.bestTeam?.rank || 0)) return (b.bestTeam?.rank || 0) - (a.bestTeam?.rank || 0);
      return (b.bestTeam?.actual || 0) - (a.bestTeam?.actual || 0);
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

  // Best Underdog = participant with highest total score
  const underdogParticipant = participantData
    .filter(p => p.totalScore !== null && p.totalScore > 0)
    .sort((a, b) => b.totalScore - a.totalScore)[0] ?? null;

  return {
    winner: winner ? { participant: winner.participant, color: winner.participantColor, team: winner } : null,
    runnerUp: runnerUp ? { participant: runnerUp.participant, color: runnerUp.participantColor, team: runnerUp } : null,
    thirdPlace: thirdPlace ? { participant: thirdPlace.participant, color: thirdPlace.participantColor, team: thirdPlace } : null,
    underdog: underdogParticipant ? {
      participant: underdogParticipant.name,
      color: underdogParticipant.color,
      team: underdogParticipant.bestTeam,
      totalScore: underdogParticipant.totalScore,
    } : null,
  };
}
