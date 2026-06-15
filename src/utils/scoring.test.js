import { describe, expect, it } from "vitest";
import {
  buildRankLookup,
  computeParticipantScores,
  deriveTeamFinishes,
  deriveUpsetBonuses,
  getMultiplier,
  sortLeaderboard,
} from "./scoring.js";

function match(stage, homeName, awayName, homeWon, status = "FINISHED") {
  const winner = homeWon === "DRAW" ? "DRAW" : homeWon === null ? null : (homeWon ? "HOME_TEAM" : "AWAY_TEAM");
  return { status, stage, homeTeam: { name: homeName }, awayTeam: { name: awayName }, score: { winner } };
}

// ─── getMultiplier ────────────────────────────────────────────────────────────

describe("getMultiplier", () => {
  it("returns correct multiplier for each tier", () => {
    expect(getMultiplier(1)).toBe(1);
    expect(getMultiplier(10)).toBe(1);
    expect(getMultiplier(11)).toBe(1.5);
    expect(getMultiplier(20)).toBe(1.5);
    expect(getMultiplier(21)).toBe(2);
    expect(getMultiplier(35)).toBe(2);
    expect(getMultiplier(36)).toBe(2.5);
    expect(getMultiplier(50)).toBe(2.5);
    expect(getMultiplier(51)).toBe(3);
    expect(getMultiplier(85)).toBe(3);
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
    expect(deriveTeamFinishes([match("QUARTER_FINALS", "Japan", "Germany", null, "SCHEDULED")])).toEqual({});
  });
});

// ─── buildRankLookup ─────────────────────────────────────────────────────────

describe("buildRankLookup", () => {
  it("maps apiName to rank from participants and extra teams", () => {
    const lookup = buildRankLookup(
      [{ teams: [{ apiName: "Brazil", rank: 6 }, { apiName: "Japan", rank: 18 }] }],
      [{ apiName: "Haiti", rank: 83 }],
    );
    expect(lookup.Brazil).toBe(6);
    expect(lookup.Japan).toBe(18);
    expect(lookup.Haiti).toBe(83);
  });
});

// ─── deriveUpsetBonuses ───────────────────────────────────────────────────────

describe("deriveUpsetBonuses", () => {
  // ── tier 1: gap 10–19 ──────────────────────────────────────────────────────
  it("tier 1 win (gap 10–19): awards +1", () => {
    const lookup = { France: 3, Japan: 18 }; // gap 15
    const bonuses = deriveUpsetBonuses(
      [match("GROUP_STAGE", "France", "Japan", false)],
      lookup,
    );
    expect(bonuses.Japan).toBe(1);
    expect(bonuses.France).toBeUndefined();
  });

  it("tier 1 draw (gap 10–19): awards +0.5 to underdog only", () => {
    const lookup = { Spain: 7, Morocco: 26 }; // gap 19
    const bonuses = deriveUpsetBonuses(
      [match("GROUP_STAGE", "Spain", "Morocco", "DRAW")],
      lookup,
    );
    expect(bonuses.Morocco).toBe(0.5);
    expect(bonuses.Spain).toBeUndefined();
  });

  // ── tier 2: gap 20–29 ──────────────────────────────────────────────────────
  it("tier 2 win (gap 20–29): awards +1.5", () => {
    const lookup = { Argentina: 1, Ecuador: 23 }; // gap 22
    const bonuses = deriveUpsetBonuses(
      [match("GROUP_STAGE", "Argentina", "Ecuador", false)],
      lookup,
    );
    expect(bonuses.Ecuador).toBe(1.5);
  });

  it("tier 2 draw (gap 20–29): awards +1 to underdog only", () => {
    const lookup = { Argentina: 1, Ecuador: 23 }; // gap 22
    const bonuses = deriveUpsetBonuses(
      [match("GROUP_STAGE", "Argentina", "Ecuador", "DRAW")],
      lookup,
    );
    expect(bonuses.Ecuador).toBe(1);
    expect(bonuses.Argentina).toBeUndefined();
  });

  // ── tier 3: gap 30+ ────────────────────────────────────────────────────────
  it("tier 3 win (gap 30+): awards +2", () => {
    const lookup = { Brazil: 6, "Saudi Arabia": 60 }; // gap 54
    const bonuses = deriveUpsetBonuses(
      [match("GROUP_STAGE", "Brazil", "Saudi Arabia", false)],
      lookup,
    );
    expect(bonuses["Saudi Arabia"]).toBe(2);
    expect(bonuses.Brazil).toBeUndefined();
  });

  it("tier 3 draw (gap 30+): awards +1.5 to underdog only", () => {
    const lookup = { Spain: 2, "Cape Verde Islands": 67 }; // gap 65
    const bonuses = deriveUpsetBonuses(
      [match("GROUP_STAGE", "Spain", "Cape Verde Islands", "DRAW")],
      lookup,
    );
    expect(bonuses["Cape Verde Islands"]).toBe(1.5);
    expect(bonuses.Spain).toBeUndefined();
  });

  // ── general ────────────────────────────────────────────────────────────────
  it("does not award bonus when rank gap is below 10", () => {
    const lookup = { Germany: 10, Croatia: 11 };
    const bonuses = deriveUpsetBonuses(
      [match("ROUND_OF_16", "Germany", "Croatia", false)],
      lookup,
    );
    expect(bonuses.Croatia).toBeUndefined();
  });

  it("does not award draw bonus when rank gap is below 10", () => {
    const lookup = { Germany: 10, Croatia: 11 };
    const bonuses = deriveUpsetBonuses(
      [match("GROUP_STAGE", "Germany", "Croatia", "DRAW")],
      lookup,
    );
    expect(bonuses.Croatia).toBeUndefined();
    expect(bonuses.Germany).toBeUndefined();
  });

  it("awards draw bonus to the home underdog when home rank is higher", () => {
    const lookup = { Morocco: 26, Spain: 7 }; // gap 19, tier 1
    const bonuses = deriveUpsetBonuses(
      [match("GROUP_STAGE", "Morocco", "Spain", "DRAW")],
      lookup,
    );
    expect(bonuses.Morocco).toBe(0.5);
    expect(bonuses.Spain).toBeUndefined();
  });

  it("accumulates bonuses across multiple upsets", () => {
    const lookup = { France: 3, Japan: 18 }; // gap 15, tier 1
    const bonuses = deriveUpsetBonuses([
      match("GROUP_STAGE", "France", "Japan", false),
      match("ROUND_OF_16", "France", "Japan", false),
    ], lookup);
    expect(bonuses.Japan).toBe(2.0);
  });

  it("skips matches where either team rank is unknown", () => {
    const bonuses = deriveUpsetBonuses(
      [match("GROUP_STAGE", "Brazil", "Haiti", false)],
      { Brazil: 6 },
    );
    expect(bonuses.Haiti).toBeUndefined();
  });
});

// ─── computeParticipantScores ────────────────────────────────────────────────

describe("computeParticipantScores", () => {
  const participants = [
    { name: "A", color: "#fff", teams: [{ name: "France",       apiName: "France",       flag: "🇫🇷", rank: 3  }] },
    { name: "B", color: "#fff", teams: [{ name: "Saudi Arabia", apiName: "Saudi Arabia", flag: "🇸🇦", rank: 60 }] },
  ];

  it("scores = stage × multiplier + upsetBonus", () => {
    // France reaches SF (3.0 pts), multiplier 1× → 3.0, no upsets → 3.0
    // Saudi Arabia reaches QF (2.0 pts), multiplier 3× → 6.0, one upset → 6.5
    const data = computeParticipantScores(
      participants,
      { France: 3, "Saudi Arabia": 2 },
      { "Saudi Arabia": 0.5 },
    );
    expect(data[0].teamsWithScores[0].score).toBe(3.0);   // 3.0 × 1 + 0
    expect(data[0].teamsWithScores[0].multiplier).toBe(1);
    expect(data[1].teamsWithScores[0].score).toBe(6.5);   // 2.0 × 3 + 0.5
    expect(data[1].teamsWithScores[0].multiplier).toBe(3);
    expect(data[1].bestScore).toBe(6.5);
  });

  it("returns null bestScore when no matches played", () => {
    const data = computeParticipantScores(participants, {}, {});
    expect(data[0].bestScore).toBeNull();
  });
});

// ─── sortLeaderboard ─────────────────────────────────────────────────────────

describe("sortLeaderboard", () => {
  it("sorts by best score desc; tiebreak favours the bigger underdog", () => {
    // Canada (30, ×2) Runner-up = 4 × 2 = 8.0
    // Brazil (6, ×1) Winner     = 5 × 1 = 5.0
    // Ghana  (73, ×3) R16       = 1 × 3 = 3.0
    const data = computeParticipantScores(
      [
        { name: "A", color: "#fff", teams: [{ name: "Canada", apiName: "Canada", flag: "🇨🇦", rank: 30 }] },
        { name: "B", color: "#fff", teams: [{ name: "Brazil", apiName: "Brazil", flag: "🇧🇷", rank: 6  }] },
        { name: "C", color: "#fff", teams: [{ name: "Ghana",  apiName: "Ghana",  flag: "🇬🇭", rank: 73 }] },
      ],
      { Canada: 4, Brazil: 5, Ghana: 1 },
      {},
    );
    const lb = sortLeaderboard(data);
    expect(lb.map(p => p.name)).toEqual(["A", "B", "C"]);
  });
});
