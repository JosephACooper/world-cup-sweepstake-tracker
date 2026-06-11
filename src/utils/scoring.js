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

export function roundToPoints(roundString = "") {
  const round = roundString.toLowerCase();

  if (round.includes("group")) return 0;
  if (round.includes("round of 32") || round.includes("1/16") || round.includes("32")) return 0.5;
  if (round.includes("round of 16") || round.includes("1/8") || round.includes("16")) return 1;
  if (round.includes("quarter")) return 2;
  if (round.includes("semi")) return 3;
  if (round.includes("3rd") || round.includes("third")) return 3;
  if (round.includes("final")) return 4;

  return null;
}

function getRound(fixture) {
  return fixture?.league?.round || fixture?.fixture?.round || "";
}

function getStatus(fixture) {
  return fixture?.fixture?.status?.short || "";
}

function isFinalRound(round) {
  const value = round.toLowerCase();
  return value.includes("final") && !value.includes("semi") && !value.includes("3rd") && !value.includes("third");
}

function setHighest(finishes, teamName, points) {
  if (!teamName || points === null) return;
  if (finishes[teamName] === undefined || points > finishes[teamName]) {
    finishes[teamName] = points;
  }
}

export function deriveTeamFinishes(fixtures = []) {
  return fixtures.reduce((finishes, fixture) => {
    const round = getRound(fixture);
    const points = roundToPoints(round);
    const status = getStatus(fixture);
    const home = fixture?.teams?.home;
    const away = fixture?.teams?.away;

    if (!home?.name || !away?.name || points === null) return finishes;
    if (status && !["FT", "AET", "PEN"].includes(status)) return finishes;

    if (points === 0) {
      setHighest(finishes, home.name, 0);
      setHighest(finishes, away.name, 0);
      return finishes;
    }

    const homeWon = home.winner === true;
    const awayWon = away.winner === true;

    if (!homeWon && !awayWon) return finishes;

    if (isFinalRound(round)) {
      setHighest(finishes, homeWon ? home.name : away.name, 5);
      setHighest(finishes, homeWon ? away.name : home.name, 4);
      return finishes;
    }

    setHighest(finishes, homeWon ? home.name : away.name, points);
    setHighest(finishes, homeWon ? away.name : home.name, points);

    return finishes;
  }, {});
}

export function computeParticipantScores(participants = [], teamFinishes = {}) {
  return participants.map((participant) => {
    const teamsWithScores = participant.teams.map((team) => {
      const actual = teamFinishes[team.apiName] ?? null;
      const expected = getExpected(team.rank);
      const score = actual === null ? null : actual - expected;

      return {
        ...team,
        actual,
        expected,
        score,
      };
    });

    const scoredTeams = teamsWithScores.filter((team) => team.score !== null);
    const bestTeam = scoredTeams.reduce((best, team) => {
      if (!best) return team;
      if (team.score !== best.score) return team.score > best.score ? team : best;
      if (team.rank !== best.rank) return team.rank > best.rank ? team : best;
      return team.actual > best.actual ? team : best;
    }, null);

    return {
      ...participant,
      teamsWithScores,
      bestScore: bestTeam ? bestTeam.score : null,
      bestTeam,
    };
  });
}

export function sortLeaderboard(participantData = []) {
  return [...participantData]
    .filter((participant) => participant.bestScore !== null)
    .sort((a, b) => {
      if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
      if (b.bestTeam.rank !== a.bestTeam.rank) return b.bestTeam.rank - a.bestTeam.rank;
      return b.bestTeam.actual - a.bestTeam.actual;
    });
}
