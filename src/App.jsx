import { useCallback, useEffect, useMemo, useState } from "react";
import { PARTICIPANTS, teamToParticipant } from "./data/participants.js";
import {
  buildRankLookup,
  computeParticipantScores,
  deriveGroupBonuses,
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
  { id: "underdogs", label: "Underdogs" },
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

  const rankLookup = useMemo(() => buildRankLookup(PARTICIPANTS), []);
  const teamFinishes = useMemo(() => deriveTeamFinishes(fixtures.finished || []), [fixtures.finished]);
  const groupBonuses = useMemo(() => deriveGroupBonuses(standings), [standings]);
  const upsetBonuses = useMemo(() => deriveUpsetBonuses(fixtures.finished || [], rankLookup), [fixtures.finished, rankLookup]);
  const participantData = useMemo(() => computeParticipantScores(PARTICIPANTS, teamFinishes, groupBonuses, upsetBonuses), [teamFinishes, groupBonuses, upsetBonuses]);
  const leaderboard = useMemo(() => sortLeaderboard(participantData), [participantData]);
  const waiting = useMemo(() => participantData.filter(p => p.totalScore === null), [participantData]);

  return (
    <div style={{ minHeight: "100vh", background: "#07111e", color: "#dde4f0", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ background: "#0b1928", borderBottom: "1px solid #132035", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ padding: "12px 16px 0" }}>
          <div style={{ fontSize: 11, color: "#3a5070", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            FIFA World Cup 2026 · Live Sweepstake
          </div>
          <h1 style={{ margin: "4px 0 8px", fontSize: 20, fontWeight: 800, color: "#dde4f0" }}>
            Underdog Score Tracker
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: error ? "#ef4444" : loading ? "#f59e0b" : lastFetched ? "#10b981" : "#3a5070",
            }} />
            <span style={{ fontSize: 12, color: "#3a5070" }}>
              {loading ? "Fetching…" : error ? `Error: ${error}` : lastFetched ? `Updated ${lastFetched.toLocaleTimeString()}` : "Connecting…"}
            </span>
            <button
              onClick={fetchAll}
              disabled={loading}
              style={{
                marginLeft: "auto",
                padding: "4px 12px",
                borderRadius: 6,
                border: "1px solid #132035",
                background: "transparent",
                color: "#3a5070",
                fontSize: 12,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              Refresh
            </button>
          </div>
        </div>
        <LiveTicker matches={fixtures.live || []} />
        <nav style={{ display: "flex", borderTop: "1px solid #132035" }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: "10px 4px",
                border: "none",
                background: "transparent",
                color: activeTab === tab.id ? "#c9a227" : "#3a5070",
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: 13,
                cursor: "pointer",
                borderBottom: `2px solid ${activeTab === tab.id ? "#c9a227" : "transparent"}`,
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {activeTab === "fixtures" && (
        <Fixtures fixtures={fixtures} teamToParticipant={teamToParticipant} participants={PARTICIPANTS} />
      )}
      {activeTab === "tournament" && (
        <Tournament standings={standings} bracket={bracket} teamToParticipant={teamToParticipant} />
      )}
      {activeTab === "underdogs" && (
        <Leaderboard
          participantData={participantData}
          bracket={bracket}
          leaderboard={leaderboard}
          waiting={waiting}
        />
      )}
    </div>
  );
}
