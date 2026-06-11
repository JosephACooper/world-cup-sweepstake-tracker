import { describe, expect, it } from "vitest";
import {
  computeParticipantScores,
  deriveTeamFinishes,
  getExpected,
  roundToPoints,
  sortLeaderboard,
} from "./scoring.js";

function fixture(round, homeName, awayName, homeWon, status = "FT") {
  return {
    fixture: { status: { short: status } },
    league: { round },
    teams: {
      home: { name: homeName, winner: homeWon },
      away: { name: awayName, winner: homeWon === null ? null : !homeWon },
    },
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

describe("roundToPoints", () => {
  it("matches API-Football round strings case-insensitively and partially", () => {
    expect(roundToPoints("World Cup - Group Stage - 1")).toBe(0);
    expect(roundToPoints("World Cup - Round of 32")).toBe(0.5);
    expect(roundToPoints("World Cup - Round of 16")).toBe(1);
    expect(roundToPoints("World Cup - Quarter-finals")).toBe(2);
    expect(roundToPoints("World Cup - Semi-finals")).toBe(3);
    expect(roundToPoints("World Cup - 3rd Place Final")).toBe(3);
    expect(roundToPoints("World Cup - Final")).toBe(4);
  });
});

describe("deriveTeamFinishes", () => {
  it("keeps the highest points seen for teams across rounds", () => {
    const finishes = deriveTeamFinishes([
      fixture("Group Stage - 1", "Canada", "Brazil", false),
      fixture("Round of 32", "Canada", "Spain", true),
      fixture("Round of 16", "Canada", "France", false),
    ]);

    expect(finishes.Canada).toBe(1);
    expect(finishes.Brazil).toBe(0);
    expect(finishes.Spain).toBe(0.5);
    expect(finishes.France).toBe(1);
  });

  it("sets final winner to 5 and loser to 4", () => {
    const finishes = deriveTeamFinishes([
      fixture("Final", "Argentina", "England", true, "PEN"),
    ]);

    expect(finishes.Argentina).toBe(5);
    expect(finishes.England).toBe(4);
  });

  it("ignores unfinished knockout fixtures", () => {
    const finishes = deriveTeamFinishes([
      fixture("Quarter-finals", "Japan", "Germany", null, "NS"),
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
