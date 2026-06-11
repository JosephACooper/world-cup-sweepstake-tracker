import { getPrizeWinners, STAGE_LABELS, STAGE_CLASSES } from "../utils/scoring.js";

const PRIZE_CONFIG = [
  { key: "winner", icon: "🥇", label: "World Cup Winner", color: "#c9a227", glow: "#c9a22740" },
  { key: "runnerUp", icon: "🥈", label: "Runner-up", color: "#94a3b8", glow: "#94a3b840" },
  { key: "thirdPlace", icon: "🥉", label: "Third Place", color: "#cd7f32", glow: "#cd7f3240" },
  { key: "underdog", icon: "🏅", label: "Best Underdog", color: "#06b6d4", glow: "#06b6d440", provisional: true },
];

function formatScore(score) {
  if (score === null || score === undefined) return "TBC";
  return `${score > 0 ? "+" : ""}${score.toFixed(1)}`;
}

function PrizeCard({ config, prizeData }) {
  const decided = prizeData !== null;
  return (
    <div style={{
      background: "#0b1928",
      border: `1px solid ${decided ? config.color : "#132035"}`,
      borderRadius: 10,
      padding: "16px",
      boxShadow: decided ? `0 0 16px ${config.glow}` : "none",
      transition: "box-shadow 0.3s",
    }}>
      <div style={{ fontSize: 24, marginBottom: 6 }}>{config.icon}</div>
      <div style={{ color: "#3a5070", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
        {config.label}
        {config.provisional && prizeData ? <span style={{ marginLeft: 6, color: "#06b6d4" }}>(provisional)</span> : null}
      </div>
      {prizeData ? (
        <>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#dde4f0" }}>
            {prizeData.team.flag} {prizeData.team.name}
          </div>
          <div style={{ color: config.color, fontWeight: 600, marginTop: 4 }}>
            {prizeData.participant}
          </div>
          {config.key === "underdog" && prizeData.team.score !== null ? (
            <div style={{ color: "#3a5070", fontSize: 12, marginTop: 4 }}>Score: {formatScore(prizeData.team.score)}</div>
          ) : null}
        </>
      ) : (
        <div style={{ color: "#3a5070", fontSize: 15, fontWeight: 600 }}>TBC</div>
      )}
    </div>
  );
}

export default function Leaderboard({ participantData, bracket, leaderboard, waiting }) {
  const prizes = getPrizeWinners(participantData, bracket);

  return (
    <main style={{ padding: "0 0 60px" }}>
      {/* Prize board */}
      <section style={{ padding: "16px 16px 0" }}>
        <div style={{ color: "#3a5070", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
          Prize Board
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 24,
        }}>
          {PRIZE_CONFIG.map(cfg => (
            <PrizeCard key={cfg.key} config={cfg} prizeData={prizes[cfg.key]} />
          ))}
        </div>
      </section>

      {/* Underdog leaderboard */}
      <section style={{ padding: "0 16px" }}>
        <div style={{ color: "#3a5070", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
          Underdog Leaderboard
        </div>
        {leaderboard.length === 0 ? (
          <div style={{ color: "#3a5070", padding: "32px 0", textAlign: "center" }}>
            No results yet. Check back once matches begin.
          </div>
        ) : null}
        {leaderboard.map((participant, index) => (
          <details key={participant.name} style={{ marginBottom: 8 }}>
            <summary style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "#0b1928",
              border: `1px solid ${index === 0 ? "#c9a227" : "#132035"}`,
              borderLeft: `4px solid ${index === 0 ? "#c9a227" : participant.color}`,
              borderRadius: 8,
              padding: "12px 16px",
              cursor: "pointer",
              listStyle: "none",
            }}>
              <div style={{ width: 32, color: "#3a5070", fontSize: 13, fontWeight: 700 }}>
                {["1st","2nd","3rd"][index] || `${index+1}th`}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: "#dde4f0", marginBottom: 4 }}>{participant.name}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {participant.teamsWithScores.map(t => (
                    <span key={t.name} style={{ fontSize: 13 }} title={`${t.name}: ${formatScore(t.score)}`}>
                      {t.flag}
                      {t.score !== null ? (
                        <strong style={{ marginLeft: 2, color: t.score >= 0 ? "#10b981" : "#ef4444", fontSize: 11 }}>
                          {formatScore(t.score)}
                        </strong>
                      ) : null}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: participant.bestScore >= 0 ? "#10b981" : "#ef4444" }}>
                  {formatScore(participant.bestScore)}
                </div>
                <div style={{ fontSize: 11, color: "#3a5070" }}>best score</div>
              </div>
            </summary>
            <div style={{
              background: "#070e18",
              border: "1px solid #132035",
              borderTop: "none",
              borderRadius: "0 0 8px 8px",
              padding: "12px 16px",
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto auto", gap: "8px 12px", fontSize: 13 }}>
                <div style={{ color: "#3a5070", fontWeight: 600 }}>Team</div>
                <div style={{ color: "#3a5070", fontWeight: 600, textAlign: "center" }}>Rank</div>
                <div style={{ color: "#3a5070", fontWeight: 600, textAlign: "center" }}>Exp.</div>
                <div style={{ color: "#3a5070", fontWeight: 600, textAlign: "center" }}>Result</div>
                <div style={{ color: "#3a5070", fontWeight: 600, textAlign: "center" }}>Score</div>
                {participant.teamsWithScores.map(t => (
                  <>
                    <div key={`${t.name}-name`} style={{ color: "#dde4f0" }}>{t.flag} {t.name}</div>
                    <div key={`${t.name}-rank`} style={{ color: "#3a5070", textAlign: "center" }}>#{t.rank}</div>
                    <div key={`${t.name}-exp`} style={{ color: "#3a5070", textAlign: "center" }}>{t.expected.toFixed(1)}</div>
                    <div key={`${t.name}-result`} style={{ textAlign: "center" }}>
                      {t.actual !== null ? (
                        <span style={{
                          display: "inline-block",
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          background: getStageColor(t.actual),
                          color: "#fff",
                        }}>
                          {STAGE_LABELS[t.actual] || "?"}
                        </span>
                      ) : <span style={{ color: "#3a5070" }}>–</span>}
                    </div>
                    <div key={`${t.name}-score`} style={{
                      textAlign: "center",
                      fontWeight: 700,
                      color: t.score === null ? "#3a5070" : t.score >= 0 ? "#10b981" : "#ef4444",
                    }}>
                      {t.score !== null ? formatScore(t.score) : "–"}
                    </div>
                  </>
                ))}
              </div>
            </div>
          </details>
        ))}
        {waiting.length > 0 ? (
          <p style={{ color: "#3a5070", fontSize: 13, marginTop: 12 }}>
            Awaiting results: {waiting.map(p => p.name).join(", ")}
          </p>
        ) : null}
      </section>

      <footer style={{ padding: "24px 16px 0", color: "#3a5070", fontSize: 12, lineHeight: 1.6 }}>
        <strong style={{ color: "#dde4f0" }}>How it works</strong> · Underdog Score = Actual Finish − Expected Finish, based on FIFA rankings (June 2026). Ranks 1–8 expect 4.0, 9–16 expect 3.0, 17–24 expect 2.0, 25–32 expect 1.0, 33+ expect 0.0. Best single-team score decides position. Tiebreaks favour the lower-ranked team, then the higher actual finish.
      </footer>
    </main>
  );
}

function getStageColor(pts) {
  const map = { 0: "#7f1d1d", 0.5: "#78350f", 1: "#92400e", 2: "#1e3a5f", 3: "#1d4ed8", 4: "#6b21a8", 5: "#14532d" };
  return map[pts] || "#132035";
}
