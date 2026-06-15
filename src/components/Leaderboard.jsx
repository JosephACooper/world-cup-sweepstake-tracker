import { useState } from "react";
import { getPrizeWinners, STAGE_LABELS, TIERS } from "../utils/scoring.js";
import { PARTICIPANTS, UNASSIGNED_TEAMS } from "../data/participants.js";

const ALL_TEAMS = [
  ...PARTICIPANTS.flatMap(p => p.teams),
  ...UNASSIGNED_TEAMS,
].sort((a, b) => a.rank - b.rank);

const PRIZE_CONFIG = [
  { key: "winner",    icon: "🥇", label: "Winner",       prize: "£50", color: "#ff9f0a", glow: "rgba(255,159,10,0.15)" },
  { key: "runnerUp",  icon: "🥈", label: "Runner-up",    prize: "£25", color: "#aeaeb2", glow: "rgba(174,174,178,0.12)" },
  { key: "thirdPlace",icon: "🥉", label: "3rd Place",    prize: "£15", color: "#cd7f32", glow: "rgba(205,127,50,0.12)" },
  { key: "underdog",  icon: "🏅", label: "Best Underdog",prize: "£20", color: "#32ade6", glow: "rgba(50,173,230,0.12)", provisional: true },
];

const RANK_LABELS = ["1st", "2nd", "3rd"];
const RANK_CLASSES = ["rank-1", "rank-2", "rank-3"];

function fmt(n, { sign = true, dash = true } = {}) {
  if (n === null || n === undefined) return dash ? "—" : "0.0";
  const s = n.toFixed(2).replace(/\.?0+$/, m => (m === ".00" ? ".0" : m === ".0" ? "" : m));
  return sign && n > 0 ? `+${s}` : s;
}

function stageColor(pts) {
  const map = { 0: "stage-group", 0.5: "stage-r32", 1: "stage-r16", 2: "stage-qf", 3: "stage-sf", 4: "stage-runner-up", 5: "stage-winner" };
  return map[pts] ?? "";
}

function PrizeCard({ config, prizeData }) {
  const decided = prizeData !== null;
  return (
    <div
      className={`prize-card${decided ? " decided" : ""}`}
      style={decided ? { boxShadow: `0 0 0 1px ${config.color}40, 0 8px 24px ${config.glow}` } : {}}
    >
      <div className="prize-card-icon">{config.icon}</div>
      <div className="prize-card-label">{config.label}</div>
      <div className="prize-card-amount" style={{ color: config.color }}>{config.prize}</div>
      {prizeData ? (
        <>
          <div className="prize-card-team">
            {prizeData.team?.flag ?? ""} {prizeData.team?.name ?? ""}
          </div>
          <div className="prize-card-participant" style={{ color: config.color }}>
            {prizeData.participant}
          </div>
          {config.provisional && prizeData && (
            <div className="prize-card-provisional">Provisional</div>
          )}
          {config.key === "underdog" && prizeData.team?.score != null && (
            <div style={{ fontSize: 11, color: "var(--label-tertiary)", marginTop: 4 }}>
              Score: {fmt(prizeData.team.score, { sign: false })}
            </div>
          )}
        </>
      ) : (
        <div className="prize-card-tbc">TBC</div>
      )}
    </div>
  );
}

function ParticipantRow({ participant, index }) {
  const [open, setOpen] = useState(false);
  const rankClass = RANK_CLASSES[index] ?? "";
  const rankLabel = RANK_LABELS[index] ?? `${index + 1}`;
  const hasScore = participant.bestScore !== null && participant.bestScore > 0;

  return (
    <div>
      <button className={`leaderboard-item${open ? " is-open" : ""}`} onClick={() => setOpen(v => !v)}>
        <div className={`rank-badge ${rankClass}`}>{rankLabel}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="leaderboard-name">{participant.name}</div>
          <div className="leaderboard-teams">
            {participant.teamsWithScores.map(t => (
              <span key={t.name} className="team-flag-chip" title={`${t.name}: ${fmt(t.score, { sign: false })}`}>
                <span style={{ fontSize: 15 }}>{t.flag}</span>
                {t.score !== null ? (
                  <span className={`team-flag-score${t.score === 0 ? " dim" : ""}`}>
                    {fmt(t.score, { sign: false })}
                  </span>
                ) : null}
              </span>
            ))}
          </div>
        </div>

        <div className="leaderboard-score">
          <div className={`leaderboard-score-value${!hasScore ? " zero" : ""}`}>
            {fmt(participant.bestScore, { sign: false })}
          </div>
          <div className="leaderboard-score-label">best</div>
        </div>

        <span className={`leaderboard-chevron${open ? " open" : ""}`}>›</span>
      </button>

      {open && (
        <div className="leaderboard-detail">
          <table className="detail-table">
            <thead>
              <tr>
                <th>Team</th>
                <th>Rank</th>
                <th>Mult</th>
                <th>Stage</th>
                <th>Pts</th>
                <th>Upsets</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {participant.teamsWithScores.map(t => (
                <tr key={t.name}>
                  <td>{t.flag} {t.name}</td>
                  <td>#{t.rank}</td>
                  <td style={{ color: "var(--accent-gold)" }}>×{t.multiplier}</td>
                  <td>
                    {t.actual !== null ? (
                      <span className={`stage-badge ${stageColor(t.actual)}`}>
                        {STAGE_LABELS[t.actual] ?? "?"}
                      </span>
                    ) : <span style={{ color: "var(--label-tertiary)" }}>—</span>}
                  </td>
                  <td>{t.actual !== null ? fmt(t.actual * t.multiplier, { sign: false }) : "—"}</td>
                  <td style={{ color: t.upsetBonus > 0 ? "var(--accent-green)" : "var(--label-tertiary)" }}>
                    {t.upsetBonus > 0 ? fmt(t.upsetBonus) : "—"}
                  </td>
                  <td style={{ fontWeight: 700, color: (t.score ?? 0) > 0 ? "var(--accent-green)" : "var(--label-tertiary)" }}>
                    {t.score !== null ? fmt(t.score, { sign: false }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Leaderboard({ participantData, bracket, leaderboard, waiting }) {
  const prizes = getPrizeWinners(participantData, bracket);
  const [showRanks, setShowRanks] = useState(false);

  return (
    <main style={{ paddingBottom: 60 }}>
      {/* Prize Board */}
      <div className="section-header">Prize Board</div>
      <div className="prize-grid">
        {PRIZE_CONFIG.map(cfg => (
          <PrizeCard key={cfg.key} config={cfg} prizeData={prizes[cfg.key]} />
        ))}
      </div>

      {/* Leaderboard */}
      <div className="section-header" style={{ marginTop: 24 }}>Underdog Leaderboard</div>
      {leaderboard.length === 0 ? (
        <div className="empty-state">No results yet. Check back once matches begin.</div>
      ) : (
        <div className="leaderboard-list">
          {leaderboard.map((participant, index) => (
            <ParticipantRow key={participant.name} participant={participant} index={index} />
          ))}
        </div>
      )}

      {waiting.length > 0 && (
        <p className="waiting-note">
          Awaiting first match: {waiting.map(p => p.name).join(", ")}
        </p>
      )}

      {/* How it works */}
      <div className="section-header" style={{ marginTop: 24 }}>How Underdog Scoring Works</div>
      <div className="explainer-card">
        <p>
          Your position is decided by your <strong>single best-performing team</strong>.
          Score = stage points × rank multiplier + upset bonus.
          Ties go to the bigger underdog (higher rank number).
        </p>

        <strong>Stage points</strong>
        <table className="explainer-table" style={{ marginTop: 8 }}>
          <tbody>
            {[
              ["Group exit", "0"], ["Round of 32", "0.5"], ["Round of 16", "1"],
              ["Quarter-final", "2"], ["Semi-final", "3"], ["Runner-up", "4"], ["Winner", "5"],
            ].map(([stage, pts]) => (
              <tr key={stage}>
                <td>{stage}</td>
                <td>{pts} pts</td>
              </tr>
            ))}
          </tbody>
        </table>

        <strong style={{ display: "block", marginTop: 16, marginBottom: 8 }}>
          Rank multiplier (FIFA rankings, June 2026)
        </strong>
        <table className="explainer-table">
          <tbody>
            {TIERS.map(t => {
              const teamsInTier = ALL_TEAMS.filter(team => team.rank >= t.min && team.rank <= t.max);
              return (
                <tr key={t.label}>
                  <td>
                    Rank {t.max === Infinity ? `${t.min}+` : `${t.min}–${t.max}`}
                    {teamsInTier.length > 0 && (
                      <div style={{ marginTop: 6, lineHeight: 2.2 }}>
                        {teamsInTier.map(team =>
                          showRanks ? (
                            <span key={team.name} style={{ display: "inline-flex", alignItems: "center", gap: 4, marginRight: 10 }}>
                              <span style={{ fontSize: 15 }}>{team.flag}</span>
                              <span style={{ color: "var(--label-tertiary)", fontSize: 11 }}>#{team.rank}</span>
                              <span style={{ fontSize: 11 }}>{team.name}</span>
                            </span>
                          ) : (
                            <span key={team.name} title={`${team.name} (#${team.rank})`} style={{ marginRight: 2, fontSize: 15 }}>
                              {team.flag}
                            </span>
                          )
                        )}
                      </div>
                    )}
                  </td>
                  <td style={{ color: "var(--accent-gold)", verticalAlign: "top", paddingTop: 9 }}>{t.label}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button className={`toggle-button${showRanks ? " active" : ""}`} onClick={() => setShowRanks(v => !v)}>
          {showRanks ? "Hide rankings" : "Show rankings"}
        </button>

        <strong>Upset bonus</strong>
        <table className="explainer-table" style={{ marginTop: 8 }}>
          <thead>
            <tr>
              <th>Rank gap</th>
              <th>Win</th>
              <th>Draw</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["10–19", "+1", "+0.5"],
              ["20–29", "+1.5", "+1"],
              ["30–39", "+2", "+1.5"],
              ["40–49", "+2.5", "+2"],
              ["50+",   "+3",  "+2.5"],
            ].map(([gap, win, draw]) => (
              <tr key={gap}>
                <td>{gap}</td>
                <td style={{ color: "var(--accent-green)", fontWeight: 700 }}>{win}</td>
                <td style={{ color: "var(--accent-green)", fontWeight: 700 }}>{draw}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: 8, marginBottom: 0, fontSize: 12, color: "var(--label-tertiary)" }}>
          Rank gap = opponent rank − your rank. Applies in group stage and all knockout rounds.
        </p>
      </div>
    </main>
  );
}
