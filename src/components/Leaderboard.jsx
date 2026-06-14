import { getPrizeWinners, STAGE_LABELS, TIERS } from "../utils/scoring.js";
import { PARTICIPANTS, UNASSIGNED_TEAMS } from "../data/participants.js";

const ALL_TEAMS = [
  ...PARTICIPANTS.flatMap(p => p.teams),
  ...UNASSIGNED_TEAMS,
].sort((a, b) => a.rank - b.rank);

const PRIZE_CONFIG = [
  { key: "winner", icon: "🥇", label: "World Cup Winner", prize: "£50", color: "#c9a227", glow: "#c9a22740" },
  { key: "runnerUp", icon: "🥈", label: "Runner-up", prize: "£25", color: "#94a3b8", glow: "#94a3b840" },
  { key: "thirdPlace", icon: "🥉", label: "Third Place", prize: "£15", color: "#cd7f32", glow: "#cd7f3240" },
  { key: "underdog", icon: "🏅", label: "Best Underdog", prize: "£20", color: "#06b6d4", glow: "#06b6d440", provisional: true },
];

function fmt(n, { sign = true, dash = true } = {}) {
  if (n === null || n === undefined) return dash ? "—" : "0.0";
  const s = n.toFixed(2).replace(/\.?0+$/, m => m === ".00" ? ".0" : m === ".0" ? "" : m);
  return sign && n > 0 ? `+${s}` : s;
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
    }}>
      <div style={{ fontSize: 24, marginBottom: 6 }}>{config.icon}</div>
      <div style={{ color: "#3a5070", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
        {config.label}
        {config.provisional && prizeData ? <span style={{ marginLeft: 6, color: "#06b6d4" }}>(provisional)</span> : null}
      </div>
      <div style={{ color: config.color, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{config.prize}</div>
      {prizeData ? (
        <>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#dde4f0" }}>
            {prizeData.team?.flag ?? ""} {prizeData.team?.name ?? ""}
          </div>
          <div style={{ color: config.color, fontWeight: 600, marginTop: 4 }}>
            {prizeData.participant}
          </div>
          {config.key === "underdog" && prizeData.team?.score != null ? (
            <div style={{ color: "#3a5070", fontSize: 12, marginTop: 4 }}>Score: {fmt(prizeData.team.score, { sign: false })}</div>
          ) : null}
        </>
      ) : (
        <div style={{ color: "#3a5070", fontSize: 15, fontWeight: 600 }}>TBC</div>
      )}
    </div>
  );
}

function ScorePill({ value, dim }) {
  if (value === null || value === undefined || value === 0) {
    return <span style={{ color: "#3a5070" }}>—</span>;
  }
  return (
    <span style={{ color: dim ? "#3a5070" : value > 0 ? "#10b981" : "#ef4444" }}>
      {fmt(value)}
    </span>
  );
}

function stageColor(pts) {
  const map = { 0: "#7f1d1d", 0.5: "#78350f", 1: "#92400e", 2: "#1e3a5f", 3: "#1d4ed8", 4: "#6b21a8", 5: "#14532d" };
  return map[pts] ?? "#132035";
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          {PRIZE_CONFIG.map(cfg => (
            <PrizeCard key={cfg.key} config={cfg} prizeData={prizes[cfg.key]} />
          ))}
        </div>
      </section>

      {/* Leaderboard */}
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
                {["1st", "2nd", "3rd"][index] ?? `${index + 1}th`}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: "#dde4f0", marginBottom: 4 }}>{participant.name}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {participant.teamsWithScores.map(t => (
                    <span key={t.name} style={{ fontSize: 13 }} title={`${t.name}: ${fmt(t.score, { sign: false })}`}>
                      {t.flag}
                      {t.score !== null ? (
                        <strong style={{ marginLeft: 2, color: t.score > 0 ? "#10b981" : "#3a5070", fontSize: 11 }}>
                          {fmt(t.score, { sign: false })}
                        </strong>
                      ) : null}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: participant.bestScore > 0 ? "#10b981" : "#3a5070" }}>
                  {fmt(participant.bestScore, { sign: false })}
                </div>
                <div style={{ fontSize: 11, color: "#3a5070" }}>best score</div>
              </div>
            </summary>

            {/* Expanded breakdown */}
            <div style={{
              background: "#070e18",
              border: "1px solid #132035",
              borderTop: "none",
              borderRadius: "0 0 8px 8px",
              padding: "12px 16px",
              overflowX: "auto",
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, whiteSpace: "nowrap" }}>
                <thead>
                  <tr style={{ color: "#3a5070" }}>
                    <th style={th({ left: true })}>Team</th>
                    <th style={th()}>Rank</th>
                    <th style={th()}>Mult</th>
                    <th style={th()}>Stage</th>
                    <th style={th()}>Pts</th>
                    <th style={th()}>Upsets</th>
                    <th style={th()}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {participant.teamsWithScores.map(t => (
                    <tr key={t.name} style={{ borderTop: "1px solid #0d1e30" }}>
                      <td style={td({ left: true, color: "#dde4f0" })}>{t.flag} {t.name}</td>
                      <td style={td()}>#{t.rank}</td>
                      <td style={td({ color: "#c9a227" })}>×{t.multiplier}</td>
                      <td style={td()}>
                        {t.actual !== null ? (
                          <span style={{
                            padding: "2px 6px",
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 700,
                            background: stageColor(t.actual),
                            color: "#fff",
                          }}>
                            {STAGE_LABELS[t.actual] ?? "?"}
                          </span>
                        ) : <span style={{ color: "#3a5070" }}>—</span>}
                      </td>
                      <td style={td()}>
                        {t.actual !== null ? fmt(t.actual * t.multiplier, { sign: false }) : "—"}
                      </td>
                      <td style={td()}>
                        <ScorePill value={t.upsetBonus} dim />
                      </td>
                      <td style={{ ...td(), fontWeight: 700, color: (t.score ?? 0) > 0 ? "#10b981" : "#3a5070" }}>
                        {t.score !== null ? fmt(t.score, { sign: false }) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ))}
        {waiting.length > 0 ? (
          <p style={{ color: "#3a5070", fontSize: 13, marginTop: 12 }}>
            Awaiting first match: {waiting.map(p => p.name).join(", ")}
          </p>
        ) : null}
      </section>

      {/* How it works */}
      <section style={{ padding: "24px 16px 0" }}>
        <div style={{ color: "#3a5070", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
          How underdog scoring works
        </div>
        <div style={{ background: "#0b1928", border: "1px solid #132035", borderRadius: 10, padding: 16, fontSize: 13, lineHeight: 1.7, color: "#94a3b8" }}>
          <p style={{ marginTop: 0 }}>
            Your position is decided by your <strong style={{ color: "#dde4f0" }}>single best-performing team</strong>. Score = stage points × rank multiplier + upset bonus. Ties go to the bigger underdog (higher rank number).
          </p>

          <p style={{ fontWeight: 700, color: "#dde4f0", marginBottom: 6 }}>Stage points</p>
          <div style={{ overflowX: "auto", marginBottom: 16 }}>
            <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%" }}>
              <tbody>
                {[
                  ["Group exit", "0"], ["Round of 32", "0.5"], ["Round of 16", "1"],
                  ["Quarter-final", "2"], ["Semi-final", "3"], ["Runner-up", "4"], ["Winner", "5"],
                ].map(([stage, pts]) => (
                  <tr key={stage} style={{ borderTop: "1px solid #0d1e30" }}>
                    <td style={td({ left: true })}>{stage}</td>
                    <td style={{ ...td(), fontWeight: 700, color: "#dde4f0" }}>{pts} pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ fontWeight: 700, color: "#dde4f0", marginBottom: 6 }}>Rank multiplier (FIFA rankings, June 2026)</p>
          <div style={{ overflowX: "auto", marginBottom: 16 }}>
            <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%" }}>
              <tbody>
                {TIERS.map(t => {
                  const teamsInTier = ALL_TEAMS.filter(team => team.rank >= t.min && team.rank <= t.max);
                  return (
                    <tr key={t.label} style={{ borderTop: "1px solid #0d1e30" }}>
                      <td style={td({ left: true })}>
                        Rank {t.max === Infinity ? `${t.min}+` : `${t.min}–${t.max}`}
                        {teamsInTier.length > 0 && (
                          <div style={{ marginTop: 4, lineHeight: 1.8 }}>
                            {teamsInTier.map(team => (
                              <span key={team.name} title={`${team.name} (#${team.rank})`} style={{ marginRight: 2, fontSize: 15 }}>
                                {team.flag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ ...td(), fontWeight: 700, color: "#c9a227", verticalAlign: "top", paddingTop: 9 }}>{t.label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p style={{ fontWeight: 700, color: "#dde4f0", marginBottom: 4 }}>Upset bonus</p>
          <p style={{ marginTop: 0, marginBottom: 0 }}>
            Against a team ranked 10+ places above you: <strong style={{ color: "#10b981" }}>+1 per win</strong>, <strong style={{ color: "#10b981" }}>+0.5 per draw</strong>.
            Applies in group stage and all knockout rounds.
          </p>
        </div>
      </section>
    </main>
  );
}

const th = ({ left } = {}) => ({
  padding: "6px 8px",
  textAlign: left ? "left" : "center",
  fontWeight: 600,
  fontSize: 11,
  color: "#3a5070",
});

const td = ({ left, color } = {}) => ({
  padding: "7px 8px",
  textAlign: left ? "left" : "center",
  color: color ?? "#94a3b8",
});
