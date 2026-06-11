import { describe, expect, it } from "vitest";
import {
  buildRankLookup,
  computeParticipantScores,
  deriveGroupBonuses,
  deriveTeamFinishes,
  deriveUpsetBonuses,
  getExpected,
  sortLeaderboard,
} from "./scoring.js";

function match(stage, homeName, awayName, homeWon, status = "FINISHED") {
  const winner = homeWon === null ? null : (homeWon ? "HOME_TEAM" : "AWAY_TEAM");
  return { status, stage, homeTeam: { name: homeName }, awayTeam: { name: awayName }, score: { winner } };
}

// ─── getExpected ─────────────────────────────────────────────────────────────

describe("getExpected", () => {
  it("maps FIFA ranking bands to expected stage points", () => {
    expect(getExpected(1)).toBe(4);
    expect(getExpected(8)).toBe(4);
    expect(getExpected(9)).toBe(3);
    expect(getExpected(16)).toBe(3);
    expect(getExpected(17)).toBe(2);
    expect(getExpected(24)).toBe(2);
    expect(getExpected(25)).toBe(1);
    expect(getExpected(32)).toBe(1);
    expect(getExpected(33)).toBe(0);
    expect(getExpected(88)).toBe(0);
  });
});

// ─── deriveTeamFinishes ───────────────────────────────────────────────────────

describe("deriveTeamFinishes", () => {
  it("keeps the highest stage reached across multiple rounds", () => {
    const finishes = deriveTeamFinishes([
      match("GROUP_STAGE", "Canada", "Brazil", false),
      match("ROUND_OF_32", "Canada", "Spain", true),
      match("ROUND_OF_16", "Canada", "France", false),
    ]);
    expect(finishes.Canada).toBe(1);
    expect(finishes.Brazil).toBe(0);
    expect(finishes.Spain).toBe(0.5);
    expect(finishes.France).toBe(1);
  });

  it("sets final winner to 5 and loser to 4", () => {
    const finishes = deriveTeamFinishes([match("FINAL", "Argentina", "England", true)]);
    expect(finishes.Argentina).toBe(5);
    expect(finishes.England).toBe(4);
  });

  it("ignores unfinished matches", () => {
    const finishes = deriveTeamFinishes([match("QUARTER_FINALS", "Japan", "Germany", null, "SCHEDULED")]);
    expect(finishes).toEqual({});
  });
});

// ─── buildRankLookup ─────────────────────────────────────────────────────────

describe("buildRankLookup", () => {
  it("maps apiName to rank across all participants", () => {
    const lookup = buildRankLookup([
      { teams: [{ apiName: "Brazil", rank: 6 }, { apiName: "France", rank: 1 }] },
      { teams: [{ apiName: "Saudi Arabia", rank: 61 }] },
    ]);
    expect(lookup.Brazil).toBe(6);
    expect(lookup.France).toBe(1);
    expect(lookup["Saudi Arabia"]).toBe(61);
  });
});

// ─── deriveGroupBonuses ───────────────────────────────────────────────────────

describe("deriveGroupBonuses", () => {
  it("awards 0.5 for 1st, 0.25 for 2nd, nothing for 3rd/4th", () => {
    const bonuses = deriveGroupBonuses([{
      group: "GROUP_A",
      table: [
        { position: 1, team: { name: "Brazil" } },
        { position: 2, team: { name: "Canada" } },
        { position: 3, team: { name: "Haiti" } },
        { position: 4, team: { name: "Peru" } },
      ],
    }]);
    expect(bonuses.Brazil).toBe(0.5);
    expect(bonuses.Canada).toBe(0.25);
    expect(bonuses.Haiti).toBeUndefined();
    expect(bonuses.Peru).toBeUndefined();
  });

  it("handles multiple groups", () => {
    const bonuses = deriveGroupBonuses([
      { group: "GROUP_A", table: [{ position: 1, team: { name: "Spain" } }] },
      { group: "GROUP_B", table: [{ position: 1, team: { name: "Japan" } }] },
    ]);
    expect(bonuses.Spain).toBe(0.5);
    expect(bonuses.Japan).toBe(0.5);
  });
});

// ─── deriveUpsetBonuses ───────────────────────────────────────────────────────

describe("deriveUpsetBonuses", () => {
  it("awards 0.5 for beating a team ranked 15+ places above", () => {
    const lookup = { Brazil: 6, "Saudi Arabia": 61 };
    const bonuses = deriveUpsetBonuses(
      [match("GROUP_STAGE", "Brazil", "Saudi Arabia", false)],
      lookup,
    );
    expect(bonuses["Saudi Arabia"]).toBe(0.5);
    expect(bonuses.Brazil).toBeUndefined();
  });

  it("does not award bonus when rank gap is below 15", () => {
    const lookup = { Germany: 10, Croatia: 11 };
    const bonuses = deriveUpsetBonuses(
      [match("ROUND_OF_16", "Germany", "Croatia", false)],
      lookup,
    );
    expect(bonuses.Croatia).toBeUndefined();
  });

  it("accumulates bonuses across multiple upsets", () => {
    const lookup = { France: 1, Japan: 18, Germany: 10 };
    const bonuses = deriveUpsetBonuses([
      match("GROUP_STAGE", "Japan", "Germany", true),   // 18-10=8, not upset
      match("ROUND_OF_16", "France", "Japan", false),   // Japan wins; 18-1=17 ≥ 15 ✓
      match("GROUP_STAGE", "France", "Japan", false),   // Japan wins again; +0.5
    ], lookup);
    expect(bonuses.Japan).toBe(1.0);
    expect(bonuses.Germany).toBeUndefined();
  });

  it("skips matches where either team rank is unknown", () => {
    const lookup = { Brazil: 6 };
    const bonuses = deriveUpsetBonuses(
      [match("GROUP_STAGE", "Brazil", "Haiti", false)],
      lookup,
    );
    expect(bonuses.Haiti).toBeUndefined();
  });
});

// ─── computeParticipantScores ────────────────────────────────────────────────

describe("computeParticipantScores", () => {
  const participants = [
    { name: "A", color: "#fff", teams: [{ name: "France", apiName: "France", flag: "🇫🇷", rank: 1 }] },
    { name: "B", color: "#fff", teams: [{ name: "Saudi Arabia", apiName: "Saudi Arabia", flag: "🇸🇦", rank: 61 }] },
  ];

  it("floors negative progression at 0 then adds bonuses", () => {
    // France SF (3.0 actual), expected 4.0 → progression -1.0 → floored to 0
    // +0.5 group bonus, +0.5 upset bonus → total 1.0
    const data = computeParticipantScores(
      participants,
      { France: 3, "Saudi Arabia": 2 },
      { France: 0.5, "Saudi Arabia": 0.5 },
      { France: 0.5 },
    );
    const france = data[0].teamsWithScores[0];
    expect(france.progression).toBe(-1.0);
    expect(france.groupBonus).toBe(0.5);
    expect(france.upsetBonus).toBe(0.5);
    expect(france.score).toBe(1.0);
    expect(data[0].totalScore).toBe(1.0);

    // Saudi Arabia QF (2.0), expected 0.0 → progression +2.0 + 0.5 group bonus → 2.5
    const ksa = data[1].teamsWithScores[0];
    expect(ksa.progression).toBe(2.0);
    expect(ksa.score).toBe(2.5);
    expect(data[1].totalScore).toBe(2.5);
  });

  it("returns null totalScore when no matches have been played", () => {
    const data = computeParticipantScores(participants, {}, {}, {});
    expect(data[0].totalScore).toBeNull();
  });
});

// ─── sortLeaderboard ─────────────────────────────────────────────────────────

describe("sortLeaderboard", () => {
  it("sorts by totalScore descending, then bestScore, then underdog rank", () => {
    const data = computeParticipantScores(
      [
        { name: "A", color: "#fff", teams: [{ name: "Canada", apiName: "Canada", flag: "🇨🇦", rank: 30 }] },
        { name: "B", color: "#fff", teams: [{ name: "Brazil", apiName: "Brazil", flag: "🇧🇷", rank: 6 }] },
        { name: "C", color: "#fff", teams: [{ name: "Ghana", apiName: "Ghana", flag: "🇬🇭", rank: 74 }] },
      ],
      { Canada: 4, Brazil: 5, Ghana: 4 },
      {},
      {},
    );
    const leaderboard = sortLeaderboard(data);
    // Canada: max(0, 4-1)=3.0  Brazil: max(0, 5-4)=1.0  Ghana: max(0, 4-0)=4.0
    expect(leaderboard.map(p => p.name)).toEqual(["C", "A", "B"]);
  });
});
