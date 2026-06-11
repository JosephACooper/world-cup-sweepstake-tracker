const BASE = "https://api.football-data.org/v4";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "FOOTBALL_DATA_API_KEY is not configured", finished: [], live: [] });
  }

  try {
    const response = await fetch(`${BASE}/competitions/WC/matches`, {
      headers: { "X-Auth-Token": apiKey },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(500).json({ error: err.message || `API error ${response.status}`, finished: [], live: [] });
    }

    const data = await response.json();
    const matches = data.matches || [];

    const finished = matches.filter(m => m.status === "FINISHED");
    const live = matches.filter(m => m.status === "IN_PLAY" || m.status === "PAUSED");

    return res.status(200).json({ finished, live });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Unable to fetch fixtures", finished: [], live: [] });
  }
}
