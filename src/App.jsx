import { useCallback, useEffect, useMemo, useState } from "react";
import { PARTICIPANTS, UNASSIGNED_TEAMS, teamToParticipant } from "./data/participants.js";
import {
  buildRankLookup,
  computeParticipantScores,
  deriveTeamFinishes,
  deriveUpsetBonuses,
  sortLeaderboard,
} from "./utils/scoring.js";
import LiveTicker from "./components/LiveTicker.jsx";
import Leaderboard from "./components/Leaderboard.jsx";
import Tournament from "./components/Tournament.jsx";
import Fixtures from "./components/Fixtures.jsx";

const REFRESH_INTERVAL = 5 * 60 * 1000;
const TABS = [
  { id: "fixtures", label: "Fixtures" },
  { id: "tournament", label: "Tournament" },
  { id: "leaderboard", label: "Leaderboard" },
];

export default function App() {
  const [fixtures, setFixtures] = useState({ finished: [], live: [], scheduled: [] });
  const [standings, setStandings] = useState([]);
  const [bracket, setBracket] = useState({ r32: [], r16: [], qf: [], sf: [], third: [], final: [] });
  const [lastFetched, setLastFetched] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("fixtures");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fixturesRes, standingsRes, bracketRes] = await Promise.all([
        fetch("/api/fixtures"),
        fetch("/api/standings"),
        fetch("/api/bracket"),
      ]);

      const [fixturesData, standingsData, bracketData] = await Promise.all([
        fixturesRes.json(),
        standingsRes.json(),
        bracketRes.json(),
      ]);

      if (fixturesRes.ok) setFixtures(fixturesData);
      else setError(fixturesData?.error || "Failed to load fixtures");

      if (standingsRes.ok) setStandings(standingsData);
      if (bracketRes.ok) setBracket(bracketData);

      setLastFetched(new Date());
    } catch (err) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const timer = window.setInterval(fetchAll, REFRESH_INTERVAL);
    return () => window.clearInterval(timer);
  }, [fetchAll]);

  const rankLookup = useMemo(() => buildRankLookup(PARTICIPANTS, UNASSIGNED_TEAMS), []);
  const teamFinishes = useMemo(() => deriveTeamFinishes(fixtures.finished || []), [fixtures.finished]);
  const upsetBonuses = useMemo(() => deriveUpsetBonuses(fixtures.finished || [], rankLookup), [fixtures.finished, rankLookup]);
  const participantData = useMemo(() => computeParticipantScores(PARTICIPANTS, teamFinishes, upsetBonuses), [teamFinishes, upsetBonuses]);
  const leaderboard = useMemo(() => sortLeaderboard(participantData), [participantData]);
  const waiting = useMemo(() => participantData.filter(p => p.bestScore === null), [participantData]);

  const hasLive = (fixtures.live || []).length > 0;

  const statusClass = error ? "status-error" : loading ? "status-loading" : lastFetched ? "status-live" : "";
  const statusText = loading
    ? "Updating…"
    : error
    ? error
    : lastFetched
    ? `Updated ${lastFetched.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "Connecting…";

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <div className="header-eyebrow">FIFA World Cup 2026 · Sweepstake</div>
          <h1 className="header-title">Moonstone Sweepstake</h1>
          <div className="header-status">
            <div className={`status-dot ${statusClass}`} />
            <span className="status-text">{statusText}</span>
            <button className="refresh-button" onClick={fetchAll} disabled={loading}>
              {loading ? "…" : "Refresh"}
            </button>
          </div>
        </div>

        {hasLive && <LiveTicker matches={fixtures.live} />}

        <div className="tab-bar">
          <div className="segmented-control">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={activeTab === tab.id ? "active" : ""}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="content">
        {activeTab === "fixtures" && (
          <Fixtures fixtures={fixtures} teamToParticipant={teamToParticipant} participants={PARTICIPANTS} />
        )}
        {activeTab === "tournament" && (
          <Tournament standings={standings} bracket={bracket} teamToParticipant={teamToParticipant} />
        )}
        {activeTab === "leaderboard" && (
          <Leaderboard
            participantData={participantData}
            bracket={bracket}
            leaderboard={leaderboard}
            waiting={waiting}
          />
        )}
      </div>
    </div>
  );
}
