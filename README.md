# FIFA World Cup 2026 Sweepstake Tracker

A Vite + React sweepstake tracker for the FIFA World Cup 2026, deployable on Vercel with a serverless proxy for API-Football fixtures.

## Local Setup

```bash
npm install
cp .env.example .env
```

Add your API-Football key to `.env`:

```bash
API_FOOTBALL_KEY=your_real_key_here
```

Run locally with Vercel so `/api/fixtures` is available:

```bash
npm run dev
```

You can also run only the Vite frontend with `npm run dev:vite`, but fixture fetching expects the Vercel function or a compatible local proxy.

## Tests

```bash
npm test
```

The scoring utilities are covered for ranking expectations, round mapping, final handling, repeated-team finishes, and leaderboard sorting.

## Deploy to Vercel

1. Create a GitHub repo and push this project.
2. Go to [vercel.com](https://vercel.com) and sign up or log in.
3. Import the GitHub repo into Vercel.
4. Add `API_FOOTBALL_KEY` in the Vercel project environment variables.
5. Deploy. Vercel will auto-deploy every push to `main`.
6. Share the Vercel URL with the sweepstake group.

## Notes

- The API key is only read in `api/fixtures.js` and is never exposed to the browser.
- `/api/fixtures` fetches finished World Cup 2026 fixtures and live fixtures, returning `{ "finished": [], "live": [] }`.
- Vercel caches the API response for 60 seconds with `s-maxage=60`.
