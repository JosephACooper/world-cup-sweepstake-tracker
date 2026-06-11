const BASE = "https://api.football-data.org/v4";
const KNOCKOUT_STAGES = ["ROUND_OF_32", "ROUND_OF_16", "QUARTER_FINALS", "SEMI_FINALS", "THIRD_PLACE", "FINAL"];

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
      r32: matches.filter(m => m.stage === "ROUND_OF_32"),
      r16: matches.filter(m => m.stage === "ROUND_OF_16"),
      qf: matches.filter(m => m.stage === "QUARTER_FINALS"),
      sf: matches.filter(m => m.stage === "SEMI_FINALS"),
      third: matches.filter(m => m.stage === "THIRD_PLACE"),
      final: matches.filter(m => m.stage === "FINAL"),
    };

    return res.status(200).json(bracket);
  } catch (err) {
    return res.status(500).json({ error: err.message || "Unable to fetch bracket" });
  }
}
