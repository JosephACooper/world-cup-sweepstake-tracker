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
  { id: "fixtures",    label: "Fixtures" },
  { id: "tournament",  label: "Tournament" },
  { id: "leaderboard", label: "Leaderboard" },
];

export default function App() {
  const [fixtures, setFixtures]   = useState({ finished: [], live: [], scheduled: [] });
  const [standings, setStandings] = useState([]);
  const [bracket, setBracket]     = useState({ r32: [], r16: [], qf: [], sf: [], third: [], final: [] });
  const [lastFetched, setLastFetched] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [activeTab, setActiveTab] = useState("fixtures");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fRes, sRes, bRes] = await Promise.all([
        fetch("/api/fixtures"),
        fetch("/api/standings"),
        fetch("/api/bracket"),
      ]);
      const [fData, sData, bData] = await Promise.all([
        fRes.json(), sRes.json(), bRes.json(),
      ]);
      if (fRes.ok) setFixtures(fData);
      else setError(fData?.error || "Failed to load fixtures");
      if (sRes.ok) setStandings(sData);
      if (bRes.ok) setBracket(bData);
      setLastFetched(new Date());
    } catch (err) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const t = window.setInterval(fetchAll, REFRESH_INTERVAL);
    return () => window.clearInterval(t);
  }, [fetchAll]);

  const rankLookup     = useMemo(() => buildRankLookup(PARTICIPANTS, UNASSIGNED_TEAMS), []);
  const teamFinishes   = useMemo(() => deriveTeamFinishes(fixtures.finished || []), [fixtures.finished]);
  const upsetBonuses   = useMemo(() => deriveUpsetBonuses(fixtures.finished || [], rankLookup), [fixtures.finished, rankLookup]);
  const participantData = useMemo(() => computeParticipantScores(PARTICIPANTS, teamFinishes, upsetBonuses), [teamFinishes, upsetBonuses]);
  const leaderboard    = useMemo(() => sortLeaderboard(participantData), [participantData]);
  const waiting        = useMemo(() => participantData.filter(p => p.bestScore === null), [participantData]);

  const statusCls = error ? "status-error" : loading ? "status-loading" : lastFetched ? "status-live" : "";
  const statusTxt = loading ? "Updating…"
    : error ? error
    : lastFetched ? `Updated ${lastFetched.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "Connecting…";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header className="site-header">
        <div className="header-inner">
          <div className="header-eyebrow">FIFA World Cup 2026 · Sweepstake</div>
          <h1 className="header-title">Moonstone Sweepstake</h1>
          <div className="header-status">
            <div className={`status-dot ${statusCls}`} />
            <span className="status-text">{statusTxt}</span>
            <button className="refresh-btn" onClick={fetchAll} disabled={loading}>
              {loading ? "…" : "Refresh"}
            </button>
          </div>
        </div>

        {(fixtures.live || []).length > 0 && <LiveTicker matches={fixtures.live} />}

        <div className="tab-bar">
          <div className="seg">
            {TABS.map(t => (
              <button
                key={t.id}
                className={activeTab === t.id ? "active" : ""}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
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
