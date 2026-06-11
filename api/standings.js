const BASE = "https://api.football-data.org/v4";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=120");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "FOOTBALL_DATA_API_KEY is not configured" });
  }

  try {
    const response = await fetch(`${BASE}/competitions/WC/standings`, {
      headers: { "X-Auth-Token": apiKey },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(500).json({ error: err.message || `API error ${response.status}` });
    }

    const data = await response.json();
    return res.status(200).json(data.standings || []);
  } catch (err) {
    return res.status(500).json({ error: err.message || "Unable to fetch standings" });
  }
}
