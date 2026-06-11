import { useCallback, useEffect, useMemo, useState } from "react";
import { PARTICIPANTS } from "./data/participants.js";
import {
  STAGE_CLASSES,
  STAGE_LABELS,
  computeParticipantScores,
  deriveTeamFinishes,
  sortLeaderboard,
} from "./utils/scoring.js";

const REFRESH_INTERVAL = 5 * 60 * 1000;
const UNASSIGNED_TEAMS = [
  { name: "Haiti", flag: "🇭🇹" },
  { name: "Cabo Verde", flag: "🇨🇻" },
  { name: "Bosnia & Herz.", flag: "🇧🇦" },
  { name: "Panama", flag: "🇵🇦" },
];

function formatScore(score) {
  if (score === null || score === undefined) return "TBC";
  return `${score > 0 ? "+" : ""}${score.toFixed(1)}`;
}

function LiveTicker({ matches }) {
  if (matches.length === 0) return null;

  return (
    <div className="live-ticker">
      <span className="live-dot" />
      <span className="ticker-text">
        LIVE NOW:{" "}
        {matches
          .map((match) => {
            const home = match.teams?.home?.name || "Home";
            const away = match.teams?.away?.name || "Away";
            const homeGoals = match.goals?.home ?? 0;
            const awayGoals = match.goals?.away ?? 0;
            return `${home} ${homeGoals}-${awayGoals} ${away}`;
          })
          .join(" · ")}
      </span>
    </div>
  );
}

function StatusLine({ loading, error, lastFetched, trackedCount, onRefresh }) {
  const statusClass = error ? "status-error" : loading ? "status-loading" : lastFetched ? "status-live" : "";
  const statusText = loading
    ? "Fetching live data..."
    : error
      ? `Error: ${error}`
      : lastFetched
        ? `Live · ${trackedCount} teams tracked · auto-refresh every 5 min`
        : "Connecting...";

  return (
    <>
      <div className="status-line">
        <span className={`status-dot ${statusClass}`} />
        <span>{statusText}</span>
        <button className="refresh-button" type="button" onClick={onRefresh} disabled={loading}>
          Refresh
        </button>
      </div>
      {lastFetched ? <div className="last-fetched">Last updated: {lastFetched.toLocaleTimeString()}</div> : null}
    </>
  );
}

function LeaderboardView({ leaderboard, waiting, loading, error }) {
  const leader = leaderboard[0];

  return (
    <main className="content">
      {loading && leaderboard.length === 0 ? <div className="empty-state">Loading live data...</div> : null}
      {!loading && leaderboard.length === 0 && !error ? (
        <div className="empty-state">No finished matches yet. Check back once the tournament begins.</div>
      ) : null}
      {error && leaderboard.length === 0 ? <div className="error-state">{error}</div> : null}

      {leader ? (
        <section className="leader-banner">
          <div className="eyebrow">Current Leader</div>
          <h2>{leader.name}</h2>
          <p>
            {leader.bestTeam.flag} {leader.bestTeam.name} · underdog score{" "}
            <strong>{formatScore(leader.bestScore)}</strong>
          </p>
        </section>
      ) : null}

      <section className="leaderboard-list" aria-label="Sweepstake leaderboard">
        {leaderboard.map((participant, index) => (
          <article
            className={`leaderboard-row ${index === 0 ? "leaderboard-row-leader" : ""}`}
            key={participant.name}
            style={{ "--participant-color": index === 0 ? "#c9a227" : participant.color }}
          >
            <div className="rank">{["1st", "2nd", "3rd"][index] || index + 1}</div>
            <div className="participant-summary">
              <h3>{participant.name}</h3>
              <div className="inline-team-scores">
                {participant.teamsWithScores.map((team) => (
                  <span key={team.name} title={`${team.name}: ${formatScore(team.score)}`}>
                    {team.flag}
                    {team.score !== null ? <strong className={team.score >= 0 ? "positive" : "negative"}>{formatScore(team.score)}</strong> : null}
                  </span>
                ))}
              </div>
            </div>
            <div className={`score-total ${participant.bestScore >= 0 ? "positive" : "negative"}`}>
              {formatScore(participant.bestScore)}
              <span>best score</span>
            </div>
          </article>
        ))}
      </section>

      {waiting.length > 0 ? (
        <p className="waiting-note">Awaiting results: {waiting.map((participant) => participant.name).join(", ")}</p>
      ) : null}

      <footer className="explainer">
        <strong>How it works</strong> · Underdog Score = Actual Finish - Expected Finish, based on FIFA rankings from
        June 9 2026. Ranks 1-8 expect 4.0, 9-16 expect 3.0, 17-24 expect 2.0, 25-32 expect 1.0, and 33+ expect 0.0.
        Your best single-team score decides your place. Tiebreaks favour the lower-ranked team, then the higher actual
        finish.
      </footer>
    </main>
  );
}

function TeamsView({ participantData, expanded, setExpanded }) {
  return (
    <main className="content">
      <section className="accordion-list" aria-label="Participant teams">
        {participantData.map((participant) => {
          const isOpen = expanded === participant.name;

          return (
            <article
              className="participant-card"
              key={participant.name}
              style={{ "--participant-color": participant.color }}
            >
              <button className="participant-toggle" type="button" onClick={() => setExpanded(isOpen ? null : participant.name)}>
                <span>
                  <strong>{participant.name}</strong>
                  <small>{participant.teams.map((team) => team.flag).join("  ")}</small>
                </span>
                <span className="toggle-score">
                  {participant.bestScore !== null ? formatScore(participant.bestScore) : "TBC"}
                  <small>best score</small>
                </span>
                <span className="chevron">{isOpen ? "Up" : "Down"}</span>
              </button>

              {isOpen ? (
                <div className="team-grid">
                  <div className="team-grid-heading">Team</div>
                  <div className="team-grid-heading centered">Rank</div>
                  <div className="team-grid-heading centered">Expected</div>
                  <div className="team-grid-heading centered">Result</div>
                  <div className="team-grid-heading centered">Score</div>

                  {participant.teamsWithScores.map((team) => (
                    <div className="team-row" key={team.name}>
                      <div className="team-name">
                        <span>{team.flag}</span>
                        <strong>{team.name}</strong>
                      </div>
                      <div className="centered">#{team.rank}</div>
                      <div className="centered">{team.expected.toFixed(1)}</div>
                      <div className="centered">
                        {team.actual !== null ? (
                          <span className={`stage-badge ${STAGE_CLASSES[team.actual] || ""}`}>
                            {STAGE_LABELS[team.actual] || "Result"}
                          </span>
                        ) : (
                          <span className="pending-result">In progress</span>
                        )}
                      </div>
                      <div className={`centered team-score ${team.score === null ? "" : team.score >= 0 ? "positive" : "negative"}`}>
                        {team.score !== null ? formatScore(team.score) : "-"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}
      </section>

      <footer className="unassigned-note">
        <strong>Unassigned:</strong>{" "}
        {UNASSIGNED_TEAMS.map((team) => `${team.name} ${team.flag}`).join(" · ")}
      </footer>
    </main>
  );
}

export default function App() {
  const [teamFinishes, setTeamFinishes] = useState({});
  const [liveMatches, setLiveMatches] = useState([]);
  const [lastFetched, setLastFetched] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState("leaderboard");
  const [expanded, setExpanded] = useState(null);

  const fetchFixtures = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/fixtures");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to load fixtures");
      }

      setTeamFinishes(deriveTeamFinishes(data.finished || []));
      setLiveMatches(data.live || []);
      setLastFetched(new Date());
    } catch (fetchError) {
      setError(fetchError.message || "Unable to load fixtures");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFixtures();
    const timer = window.setInterval(fetchFixtures, REFRESH_INTERVAL);
    return () => window.clearInterval(timer);
  }, [fetchFixtures]);

  const participantData = useMemo(() => computeParticipantScores(PARTICIPANTS, teamFinishes), [teamFinishes]);
  const leaderboard = useMemo(() => sortLeaderboard(participantData), [participantData]);
  const waiting = participantData.filter((participant) => participant.bestScore === null);

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="eyebrow">FIFA World Cup 2026 · Live Sweepstake</div>
        <h1>Underdog Score Tracker</h1>
        <StatusLine
          loading={loading}
          error={error}
          lastFetched={lastFetched}
          trackedCount={Object.keys(teamFinishes).length}
          onRefresh={fetchFixtures}
        />
        <LiveTicker matches={liveMatches} />
        <nav className="tab-bar" aria-label="Views">
          <button className={view === "leaderboard" ? "active" : ""} type="button" onClick={() => setView("leaderboard")}>
            Leaderboard
          </button>
          <button className={view === "teams" ? "active" : ""} type="button" onClick={() => setView("teams")}>
            Teams
          </button>
        </nav>
      </header>

      {view === "leaderboard" ? (
        <LeaderboardView leaderboard={leaderboard} waiting={waiting} loading={loading} error={error} />
      ) : (
        <TeamsView participantData={participantData} expanded={expanded} setExpanded={setExpanded} />
      )}
    </div>
  );
}
