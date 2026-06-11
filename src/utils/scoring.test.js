import { describe, expect, it } from "vitest";
import {
  computeParticipantScores,
  deriveTeamFinishes,
  getExpected,
  sortLeaderboard,
} from "./scoring.js";

function fixture(stage, homeName, awayName, homeWon, status = "FINISHED") {
  const winner = homeWon === null ? null : (homeWon ? "HOME_TEAM" : "AWAY_TEAM");
  return {
    status,
    stage,
    homeTeam: { name: homeName },
    awayTeam: { name: awayName },
    score: { winner },
  };
}

describe("getExpected", () => {
  it("maps FIFA ranking bands to expected points", () => {
    expect(getExpected(1)).toBe(4);
    expect(getExpected(8)).toBe(4);
    expect(getExpected(9)).toBe(3);
    expect(getExpected(16)).toBe(3);
    expect(getExpected(17)).toBe(2);
    expect(getExpected(24)).toBe(2);
    expect(getExpected(25)).toBe(1);
    expect(getExpected(32)).toBe(1);
    expect(getExpected(33)).toBe(0);
  });
});

describe("deriveTeamFinishes", () => {
  it("keeps the highest points seen for teams across rounds", () => {
    const finishes = deriveTeamFinishes([
      fixture("GROUP_STAGE", "Canada", "Brazil", false),
      fixture("ROUND_OF_32", "Canada", "Spain", true),
      fixture("ROUND_OF_16", "Canada", "France", false),
    ]);

    expect(finishes.Canada).toBe(1);
    expect(finishes.Brazil).toBe(0);
    expect(finishes.Spain).toBe(0.5);
    expect(finishes.France).toBe(1);
  });

  it("sets final winner to 5 and loser to 4", () => {
    const finishes = deriveTeamFinishes([
      fixture("FINAL", "Argentina", "England", true),
    ]);

    expect(finishes.Argentina).toBe(5);
    expect(finishes.England).toBe(4);
  });

  it("ignores unfinished knockout fixtures", () => {
    const finishes = deriveTeamFinishes([
      fixture("QUARTER_FINALS", "Japan", "Germany", null, "SCHEDULED"),
    ]);

    expect(finishes).toEqual({});
  });
});

describe("computeParticipantScores and sortLeaderboard", () => {
  const participants = [
    {
      name: "A",
      color: "#fff",
      teams: [{ name: "Canada", apiName: "Canada", flag: "🇨🇦", rank: 30 }],
    },
    {
      name: "B",
      color: "#fff",
      teams: [{ name: "Brazil", apiName: "Brazil", flag: "🇧🇷", rank: 6 }],
    },
    {
      name: "C",
      color: "#fff",
      teams: [{ name: "Ghana", apiName: "Ghana", flag: "🇬🇭", rank: 74 }],
    },
  ];

  it("enriches participants and sorts by score, lower-ranked team, then actual finish", () => {
    const data = computeParticipantScores(participants, {
      Canada: 4,
      Brazil: 5,
      Ghana: 4,
    });
    const leaderboard = sortLeaderboard(data);

    expect(data[0].teamsWithScores[0].score).toBe(3);
    expect(data[1].teamsWithScores[0].score).toBe(1);
    expect(leaderboard.map((participant) => participant.name)).toEqual(["C", "A", "B"]);
  });
});
