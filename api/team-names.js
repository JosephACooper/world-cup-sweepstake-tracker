const BASE = "https://api.football-data.org/v4";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");

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

    const names = new Set();
    for (const m of matches) {
      if (m.homeTeam?.name) names.add(m.homeTeam.name);
      if (m.awayTeam?.name) names.add(m.awayTeam.name);
    }

    return res.status(200).json({ teams: [...names].sort() });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Unable to fetch team names" });
  }
}
