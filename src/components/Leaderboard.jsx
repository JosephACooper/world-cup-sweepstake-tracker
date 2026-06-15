import { useState } from "react";
import { getPrizeWinners, STAGE_LABELS, TIERS } from "../utils/scoring.js";
import { PARTICIPANTS, UNASSIGNED_TEAMS } from "../data/participants.js";

const ALL_TEAMS = [
  ...PARTICIPANTS.flatMap(p => p.teams),
  ...UNASSIGNED_TEAMS,
].sort((a, b) => a.rank - b.rank);

const PRIZES = [
  { key: "winner",     icon: "🥇", label: "Winner",       prize: "£50", color: "#c9a227" },
  { key: "runnerUp",   icon: "🥈", label: "Runner-up",    prize: "£25", color: "#c0c0c0" },
  { key: "thirdPlace", icon: "🥉", label: "3rd Place",    prize: "£15", color: "#cd7f32" },
  { key: "underdog",   icon: "🏅", label: "Best Underdog",prize: "£20", color: "#32ade6", provisional: true },
];

const RANK_CLS  = ["r1", "r2", "r3"];
const RANK_LBLS = ["1st", "2nd", "3rd"];

function fmt(n, { sign = true, dash = true } = {}) {
  if (n === null || n === undefined) return dash ? "—" : "0";
  const s = n.toFixed(2).replace(/\.?0+$/, m => (m === ".00" ? ".0" : m === ".0" ? "" : m));
  return sign && n > 0 ? `+${s}` : s;
}

function stageClass(pts) {
  const m = { 0: "stage-group", 0.5: "stage-r32", 1: "stage-r16", 2: "stage-qf", 3: "stage-sf", 4: "stage-runner-up", 5: "stage-winner" };
  return m[pts] ?? "";
}

function ParticipantRow({ participant, index }) {
  const [open, setOpen] = useState(false);
  const hasScore = participant.bestScore !== null && participant.bestScore > 0;

  return (
    <div className={`lb-item-wrap${index === 0 ? " leader" : ""}`}>
      <button className="lb-row" onClick={() => setOpen(v => !v)}>
        <span className={`lb-rank${RANK_CLS[index] ? ` ${RANK_CLS[index]}` : ""}`}>
          {RANK_LBLS[index] ?? `${index + 1}`}
        </span>
        <div className="lb-info">
          <div className="lb-name">{participant.name}</div>
          <div className="lb-teams">
            {participant.teamsWithScores.map(t => (
              <span key={t.name} className="lb-team-chip" title={`${t.name}: ${fmt(t.score, { sign: false })}`}>
                <span style={{ fontSize: 15 }}>{t.flag}</span>
                {t.score !== null && (
                  <span className={`lb-team-score${t.score === 0 ? " nil" : ""}`}>
                    {fmt(t.score, { sign: false })}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
        <div className="lb-score-block">
          <div className={`lb-score-val${!hasScore ? " nil" : ""}`}>
            {fmt(participant.bestScore, { sign: false })}
          </div>
          <div className="lb-score-sub">best</div>
        </div>
        <span className={`lb-chevron${open ? " open" : ""}`}>›</span>
      </button>

      {open && (
        <div className="lb-detail">
          <table>
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
                  <td style={{ color: "var(--gold)" }}>×{t.multiplier}</td>
                  <td>
                    {t.actual !== null
                      ? <span className={`stage-badge ${stageClass(t.actual)}`}>{STAGE_LABELS[t.actual] ?? "?"}</span>
                      : <span style={{ color: "var(--text-3)" }}>—</span>}
                  </td>
                  <td>{t.actual !== null ? fmt(t.actual * t.multiplier, { sign: false }) : "—"}</td>
                  <td style={{ color: t.upsetBonus > 0 ? "var(--green)" : "var(--text-3)" }}>
                    {t.upsetBonus > 0 ? fmt(t.upsetBonus) : "—"}
                  </td>
                  <td style={{ fontWeight: 700, color: (t.score ?? 0) > 0 ? "var(--green)" : "var(--text-3)" }}>
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
      {/* Prize board */}
      <div className="section-label">Prize Board</div>
      <div className="prize-grid">
        {PRIZES.map(cfg => {
          const data = prizes[cfg.key];
          return (
            <div key={cfg.key} className={`prize-card${data ? " won" : ""}`}>
              <div className="prize-icon">{cfg.icon}</div>
              <div className="prize-label">
                {cfg.label}
              </div>
              <div className="prize-amount" style={{ color: cfg.color }}>{cfg.prize}</div>
              {data ? (
                <>
                  <div className="prize-team">{data.team?.flag ?? ""} {data.team?.name ?? ""}</div>
                  <div className="prize-person" style={{ color: cfg.color }}>{data.participant}</div>
                  {cfg.provisional && <div className="prize-prov">Provisional</div>}
                  {cfg.key === "underdog" && data.team?.score != null && (
                    <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3 }}>
                      Score: {fmt(data.team.score, { sign: false })}
                    </div>
                  )}
                </>
              ) : (
                <div className="prize-tbc">TBC</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Leaderboard */}
      <div className="section-label" style={{ marginTop: 20 }}>Underdog Leaderboard</div>
      {leaderboard.length === 0 ? (
        <div className="empty-state">No results yet. Check back once matches begin.</div>
      ) : (
        <div className="lb-list">
          {leaderboard.map((p, i) => <ParticipantRow key={p.name} participant={p} index={i} />)}
        </div>
      )}

      {waiting.length > 0 && (
        <p className="waiting-note">Awaiting first match: {waiting.map(p => p.name).join(", ")}</p>
      )}

      {/* How it works */}
      <div className="section-label" style={{ marginTop: 20 }}>How Underdog Scoring Works</div>
      <div className="explainer">
        <p>
          Your position is decided by your <strong>single best-performing team</strong>.
          Score = stage points × rank multiplier + upset bonus.
          Ties go to the bigger underdog (higher rank number).
        </p>

        <strong>Stage points</strong>
        <table>
          <tbody>
            {[["Group exit","0"],["Round of 32","0.5"],["Round of 16","1"],
              ["Quarter-final","2"],["Semi-final","3"],["Runner-up","4"],["Winner","5"]].map(([s,p]) => (
              <tr key={s}><td>{s}</td><td>{p} pts</td></tr>
            ))}
          </tbody>
        </table>

        <strong>Rank multiplier (FIFA rankings, June 2026)</strong>
        <table style={{ marginTop: 8 }}>
          <tbody>
            {TIERS.map(t => {
              const teams = ALL_TEAMS.filter(team => team.rank >= t.min && team.rank <= t.max);
              return (
                <tr key={t.label}>
                  <td>
                    Rank {t.max === Infinity ? `${t.min}+` : `${t.min}–${t.max}`}
                    {teams.length > 0 && (
                      <div style={{ marginTop: 5, lineHeight: 2.1 }}>
                        {teams.map(team =>
                          showRanks ? (
                            <span key={team.name} style={{ display:"inline-flex", alignItems:"center", gap:3, marginRight:8 }}>
                              <span style={{ fontSize:14 }}>{team.flag}</span>
                              <span style={{ color:"var(--text-3)", fontSize:11 }}>#{team.rank}</span>
                              <span style={{ fontSize:11 }}>{team.name}</span>
                            </span>
                          ) : (
                            <span key={team.name} title={`${team.name} (#${team.rank})`} style={{ marginRight:2, fontSize:14 }}>{team.flag}</span>
                          )
                        )}
                      </div>
                    )}
                  </td>
                  <td style={{ color:"var(--gold)", verticalAlign:"top", paddingTop:9 }}>{t.label}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button className={`toggle-btn${showRanks ? " on" : ""}`} onClick={() => setShowRanks(v => !v)}>
          {showRanks ? "Hide rankings" : "Show rankings"}
        </button>

        <strong>Upset bonus</strong>
        <table style={{ marginTop: 8 }}>
          <thead><tr><th>Rank gap</th><th>Win</th><th>Draw</th></tr></thead>
          <tbody>
            {[["10–19","+1","+0.5"],["20–29","+1.5","+1"],["30–39","+2","+1.5"],["40–49","+2.5","+2"],["50+","+3","+2.5"]].map(([g,w,d]) => (
              <tr key={g}>
                <td>{g}</td>
                <td style={{ color:"var(--green)", fontWeight:700 }}>{w}</td>
                <td style={{ color:"var(--green)", fontWeight:700 }}>{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop:8, marginBottom:0, fontSize:12, color:"var(--text-3)" }}>
          Rank gap = opponent rank − your rank. Applies in group stage and all knockout rounds.
        </p>
      </div>
    </main>
  );
}
