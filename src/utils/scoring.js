export const STAGE_LABELS = {
  0:   "Group Stage",
  0.5: "Round of 32",
  1:   "Round of 16",
  2:   "Quarter-final",
  3:   "Semi-final",
  4:   "Runner-up",
  5:   "Winner",
};

const KNOCKOUT_STAGE_LABELS = {
  ROUND_OF_32:    "Round of 32",
  ROUND_OF_16:    "Round of 16",
  QUARTER_FINALS: "Quarter-final",
  SEMI_FINALS:    "Semi-final",
  THIRD_PLACE:    "Third-place match",
  FINAL:          "Final",
};

// Returns { [apiName]: { status: "in" | "out" | "champion", outAt: string | null } }
export function deriveTeamStatus(fixtures = {}) {
  const finished = fixtures.finished || [];
  const live = fixtures.live || [];
  const scheduled = fixtures.scheduled || [];

  const status = {};
  const setOut = (name, stage) => {
    if (!name || status[name]) return;
    status[name] = { status: "out", outAt: stage };
  };
  const setChampion = (name) => {
    if (!name) return;
    status[name] = { status: "champion", outAt: null };
  };

  // Knockout losses (and the final) are unambiguous on their own.
  const knockoutParticipants = new Set();
  for (const match of finished) {
    if (match.stage === "GROUP_STAGE") continue;
    const homeName = match.homeTeam?.name;
    const awayName = match.awayTeam?.name;
    if (homeName) knockoutParticipants.add(homeName);
    if (awayName) knockoutParticipants.add(awayName);

    const winner = match.score?.winner;
    if (!homeName || !awayName || !winner || winner === "DRAW") continue;

    if (match.stage === "FINAL") {
      if (winner === "HOME_TEAM") { setChampion(homeName); setOut(awayName, "Final"); }
      else { setChampion(awayName); setOut(homeName, "Final"); }
      continue;
    }

    const stageLabel = KNOCKOUT_STAGE_LABELS[match.stage] ?? match.stage;
    if (winner === "HOME_TEAM") setOut(awayName, stageLabel);
    else setOut(homeName, stageLabel);
  }

  // Once no group-stage matches remain live or scheduled anywhere, a team that
  // played in the group stage but has no upcoming fixture of its own simply
  // didn't qualify. This sidesteps needing the full Round of 32 lineup (which
  // can lag behind the actual results) — a missing next fixture is enough.
  const groupStageOver = ![...live, ...scheduled].some(m => m.stage === "GROUP_STAGE");
  if (groupStageOver) {
    const upcomingTeams = new Set();
    for (const match of [...live, ...scheduled]) {
      if (match.homeTeam?.name) upcomingTeams.add(match.homeTeam.name);
      if (match.awayTeam?.name) upcomingTeams.add(match.awayTeam.name);
    }
    for (const match of finished) {
      if (match.stage !== "GROUP_STAGE") continue;
      for (const name of [match.homeTeam?.name, match.awayTeam?.name]) {
        // Teams that already played a knockout match are resolved above (win
        // or loss) — skip them here even if their next fixture isn't posted yet.
        if (!name || knockoutParticipants.has(name)) continue;
        if (!upcomingTeams.has(name)) setOut(name, "Group Stage");
      }
    }
  }

  return status;
}

// Rank multiplier tiers (FIFA rankings, June 2026)
// Score = stage points × multiplier + upset bonus
export const TIERS = [
  { label: "×1",   min: 1,  max: 10,  multiplier: 1   },
  { label: "×1.5", min: 11, max: 20,  multiplier: 1.5 },
  { label: "×2",   min: 21, max: 35,  multiplier: 2   },
  { label: "×2.5", min: 36, max: 50,  multiplier: 2.5 },
  { label: "×3",   min: 51, max: Infinity, multiplier: 3 },
];

export function getMultiplier(rank) {
  const tier = TIERS.find(t => rank >= t.min && rank <= t.max);
  return tier ? tier.multiplier : 1;
}

function stageToPoints(stage) {
  switch (stage) {
    case "GROUP_STAGE":   return 0;
    case "ROUND_OF_32":   return 0.5;
    case "ROUND_OF_16":   return 1;
    case "QUARTER_FINALS": return 2;
    case "SEMI_FINALS":   return 3;
    case "THIRD_PLACE":   return 3;
    default:              return null;
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

// Build a rank lookup from participants + optional extra teams (e.g. unassigned)
export function buildRankLookup(participants = [], extraTeams = []) {
  const lookup = {};
  for (const p of participants) {
    for (const t of p.teams) {
      if (t.apiName && t.rank) lookup[t.apiName] = t.rank;
    }
  }
  for (const t of extraTeams) {
    if (t.apiName && t.rank) lookup[t.apiName] = t.rank;
  }
  return lookup;
}

// Upset tiers by rank gap (underdog only): gap 10–19 / 20–29 / 30–39 / 40–49 / 50+
const UPSET_TIERS = [
  { min: 50, draw: 2.5, win: 3   },
  { min: 40, draw: 2,   win: 2.5 },
  { min: 30, draw: 1.5, win: 2   },
  { min: 20, draw: 1,   win: 1.5 },
  { min: 10, draw: 0.5, win: 1   },
];

function getUpsetBonus(rankGap, type) {
  const tier = UPSET_TIERS.find(t => rankGap >= t.min);
  return tier ? tier[type] : 0;
}

export function deriveUpsetBonuses(matches = [], rankLookup = {}) {
  return matches.reduce((bonuses, match) => {
    if (match.status !== "FINISHED") return bonuses;

    const winner = match.score?.winner;
    const homeName = match.homeTeam?.name;
    const awayName = match.awayTeam?.name;
    if (!homeName || !awayName) return bonuses;

    const homeRank = rankLookup[homeName];
    const awayRank = rankLookup[awayName];
    if (!homeRank || !awayRank) return bonuses;

    if (winner === "DRAW") {
      const rankGap = Math.abs(homeRank - awayRank);
      const bonus = getUpsetBonus(rankGap, "draw");
      if (bonus > 0) {
        const underdogName = homeRank > awayRank ? homeName : awayName;
        bonuses[underdogName] = (bonuses[underdogName] || 0) + bonus;
      }
      return bonuses;
    }

    if (!winner) return bonuses;

    let winnerName, winnerRank, loserRank;
    if (winner === "HOME_TEAM") {
      winnerName = homeName; winnerRank = homeRank; loserRank = awayRank;
    } else if (winner === "AWAY_TEAM") {
      winnerName = awayName; winnerRank = awayRank; loserRank = homeRank;
    } else {
      return bonuses;
    }

    const bonus = getUpsetBonus(winnerRank - loserRank, "win");
    if (bonus > 0) {
      bonuses[winnerName] = (bonuses[winnerName] || 0) + bonus;
    }
    return bonuses;
  }, {});
}

// Score = stagePoints × multiplier + upsetBonus
export function computeParticipantScores(participants = [], teamFinishes = {}, upsetBonuses = {}) {
  return participants.map((participant) => {
    const teamsWithScores = participant.teams.map((team) => {
      const actual     = teamFinishes[team.apiName] ?? null;
      const multiplier = getMultiplier(team.rank);
      const upsetBonus = upsetBonuses[team.apiName] ?? 0;
      const score      = actual === null ? null : actual * multiplier + upsetBonus;
      return { ...team, actual, multiplier, upsetBonus, score };
    });

    const scoredTeams = teamsWithScores.filter((t) => t.score !== null);

    // Best team: highest score → tiebreak lowest FIFA rank (biggest underdog) → deepest stage
    const bestTeam = scoredTeams.reduce((best, team) => {
      if (!best) return team;
      if (team.score !== best.score) return team.score > best.score ? team : best;
      if (team.rank !== best.rank) return team.rank > best.rank ? team : best;
      return (team.actual || 0) > (best.actual || 0) ? team : best;
    }, null);

    return { ...participant, teamsWithScores, bestScore: bestTeam?.score ?? null, bestTeam };
  });
}

// Sort by best single-team score; tiebreak by that team's rank (underdog first), then stage
export function sortLeaderboard(participantData = []) {
  return [...participantData]
    .filter((p) => p.bestScore !== null)
    .sort((a, b) => {
      if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
      if ((b.bestTeam?.rank || 0) !== (a.bestTeam?.rank || 0)) return (b.bestTeam?.rank || 0) - (a.bestTeam?.rank || 0);
      return (b.bestTeam?.actual || 0) - (a.bestTeam?.actual || 0);
    });
}

export function getPrizeWinners(participantData = [], bracket = {}) {
  const allTeams = participantData.flatMap(p =>
    p.teamsWithScores.map(t => ({ ...t, participant: p.name, participantColor: p.color }))
  );

  const winner   = allTeams.find(t => t.actual === 5) ?? null;
  const runnerUp = allTeams.find(t => t.actual === 4) ?? null;

  let thirdPlace = null;
  const thirdMatch = (bracket.third || []).find(m => m.status === "FINISHED" && m.score?.winner);
  if (thirdMatch) {
    const name = thirdMatch.score.winner === "HOME_TEAM"
      ? thirdMatch.homeTeam?.name
      : thirdMatch.awayTeam?.name;
    thirdPlace = allTeams.find(t => t.apiName === name) ?? null;
  }

  const underdogParticipant = sortLeaderboard(participantData)[0] ?? null;

  return {
    winner:     winner     ? { participant: winner.participant,     color: winner.participantColor,     team: winner     } : null,
    runnerUp:   runnerUp   ? { participant: runnerUp.participant,   color: runnerUp.participantColor,   team: runnerUp   } : null,
    thirdPlace: thirdPlace ? { participant: thirdPlace.participant, color: thirdPlace.participantColor, team: thirdPlace } : null,
    underdog:   underdogParticipant ? {
      participant: underdogParticipant.name,
      color:       underdogParticipant.color,
      team:        underdogParticipant.bestTeam,
    } : null,
  };
}
