const BASE = "https://api.football-data.org/v4";

// football-data.org's stage naming predates the 48-team format and is
// inconsistent about it — normalize known aliases (e.g. "LAST_16") to the
// canonical names this app uses elsewhere.
const STAGE_ALIASES = {
  LAST_32: "ROUND_OF_32",
  LAST_16: "ROUND_OF_16",
};

function normalizeStage(stage) {
  return STAGE_ALIASES[stage] ?? stage;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "FOOTBALL_DATA_API_KEY is not configured" });
  }

  try {
    const response = await fetch(`${BASE}/competitions/WC/matches`, {
      headers: { "X-Auth-Token": apiKey },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(500).json({ error: err.message || `API error ${response.status}` });
    }

    const data = await response.json();
    const matches = data.matches || [];

    const bracket = {
      r32: matches.filter(m => normalizeStage(m.stage) === "ROUND_OF_32"),
      r16: matches.filter(m => normalizeStage(m.stage) === "ROUND_OF_16"),
      qf: matches.filter(m => normalizeStage(m.stage) === "QUARTER_FINALS"),
      sf: matches.filter(m => normalizeStage(m.stage) === "SEMI_FINALS"),
      third: matches.filter(m => normalizeStage(m.stage) === "THIRD_PLACE"),
      final: matches.filter(m => normalizeStage(m.stage) === "FINAL"),
    };

    return res.status(200).json(bracket);
  } catch (err) {
    return res.status(500).json({ error: err.message || "Unable to fetch bracket" });
  }
}
