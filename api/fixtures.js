const API_BASE = "https://v3.football.api-sports.io/fixtures";
const COMMON_QUERY = "league=1&season=2026";

async function fetchFixtures(query) {
  const apiKey = process.env.API_FOOTBALL_KEY;

  if (!apiKey) {
    throw new Error("API_FOOTBALL_KEY is not configured");
  }

  const response = await fetch(`${API_BASE}?${COMMON_QUERY}&${query}`, {
    headers: {
      "x-apisports-key": apiKey,
    },
  });

  let data;

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.error || `API-Football request failed with ${response.status}`);
  }

  if (data?.errors && Object.keys(data.errors).length > 0) {
    throw new Error(Object.values(data.errors).flat().join(", "));
  }

  return data.response || [];
}

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Cache-Control", "s-maxage=60");

  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const [finished, live] = await Promise.all([
      fetchFixtures("status=FT"),
      fetchFixtures("live=all"),
    ]);

    return response.status(200).json({ finished, live });
  } catch (error) {
    return response.status(500).json({
      error: error.message || "Unable to fetch fixtures",
      finished: [],
      live: [],
    });
  }
}
