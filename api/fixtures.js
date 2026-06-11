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
    return res.status(500).json({ error: "FOOTBALL_DATA_API_KEY is not configured", finished: [], live: [], scheduled: [] });
  }

  try {
    const response = await fetch(`${BASE}/competitions/WC/matches`, {
      headers: { "X-Auth-Token": apiKey },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(500).json({ error: err.message || `API error ${response.status}`, finished: [], live: [], scheduled: [] });
    }

    const data = await response.json();
    const matches = data.matches || [];

    // Log status distribution to help debug API responses
    const statusCounts = matches.reduce((acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1;
      return acc;
    }, {});
    console.log("Match statuses from football-data.org:", JSON.stringify(statusCounts));

    const FINISHED_STATUSES = new Set(["FINISHED", "AWARDED"]);
    const LIVE_STATUSES = new Set(["IN_PLAY", "PAUSED", "EXTRA_TIME", "PENALTY_SHOOTOUT"]);

    const finished = matches.filter(m => FINISHED_STATUSES.has(m.status));
    const live = matches.filter(m => LIVE_STATUSES.has(m.status));
    const scheduled = matches.filter(m => !FINISHED_STATUSES.has(m.status) && !LIVE_STATUSES.has(m.status));

    return res.status(200).json({ finished, live, scheduled });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Unable to fetch fixtures", finished: [], live: [], scheduled: [] });
  }
}
