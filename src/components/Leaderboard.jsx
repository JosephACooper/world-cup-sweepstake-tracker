import { useState } from "react";
import { getPrizeWinners, STAGE_LABELS, TIERS } from "../utils/scoring.js";
import { PARTICIPANTS, UNASSIGNED_TEAMS } from "../data/participants.js";

const ALL_TEAMS = [...PARTICIPANTS.flatMap(p => p.teams), ...UNASSIGNED_TEAMS].sort((a, b) => a.rank - b.rank);

const PRIZES = [
  { key:"winner",    icon:"🥇", label:"Winner",       amt:"£50", color:"#c9a227" },
  { key:"runnerUp",  icon:"🥈", label:"Runner-up",    amt:"£25", color:"#c0c0c0" },
  { key:"thirdPlace",icon:"🥉", label:"3rd Place",    amt:"£15", color:"#cd7f32" },
  { key:"underdog",  icon:"🏅", label:"Best Underdog",amt:"£20", color:"#5ac8f5", provisional:true },
];

const RANK_CLS  = ["g1","g2","g3"];
const RANK_LBSL = ["1st","2nd","3rd"];

function fmt(n, { sign=true, dash=true }={}) {
  if (n === null || n === undefined) return dash ? "—" : "0";
  const s = n.toFixed(2).replace(/\.?0+$/, m => m===".00" ? ".0" : m===".0" ? "" : m);
  return sign && n > 0 ? `+${s}` : s;
}

function stageCls(pts) {
  const m={0:"sb-group",0.5:"sb-r32",1:"sb-r16",2:"sb-qf",3:"sb-sf",4:"sb-runner",5:"sb-winner"};
  return m[pts] ?? "";
}

function ParticipantRow({ p, index }) {
  const [open, setOpen] = useState(false);
  const hasScore = p.bestScore !== null && p.bestScore > 0;
  return (
    <div className={`lb-card${index===0?" first":""}`}>
      <button className="lb-row" onClick={() => setOpen(v => !v)}>
        <span className={`lb-rank${RANK_CLS[index] ? ` ${RANK_CLS[index]}` : ""}`}>
          {RANK_LBSL[index] ?? index+1}
        </span>
        <div className="lb-body">
          <div className="lb-name">{p.name}</div>
          <div className="lb-flags">
            {p.teamsWithScores.map(t => (
              <span key={t.name} className="flag-score" title={`${t.name}: ${fmt(t.score,{sign:false})}`}>
                <span style={{fontSize:16}}>{t.flag}</span>
                {t.score !== null && (
                  <span className={`flag-pts${t.score===0?" nil":""}`}>{fmt(t.score,{sign:false})}</span>
                )}
              </span>
            ))}
          </div>
        </div>
        <div className="lb-score">
          <div className={`lb-score-val${!hasScore?" nil":""}`}>{fmt(p.bestScore,{sign:false})}</div>
          <div className="lb-score-lbl">best score</div>
        </div>
        <span className={`lb-chevron${open?" open":""}`}>›</span>
      </button>

      {open && (
        <div className="lb-detail">
          <table>
            <thead>
              <tr><th>Team</th><th>Rank</th><th>Mult</th><th>Stage</th><th>Pts</th><th>Upsets</th><th>Score</th></tr>
            </thead>
            <tbody>
              {p.teamsWithScores.map(t => (
                <tr key={t.name}>
                  <td>{t.flag} {t.name}</td>
                  <td>#{t.rank}</td>
                  <td style={{color:"var(--gold)"}}>×{t.multiplier}</td>
                  <td>
                    {t.actual !== null
                      ? <span className={`sb ${stageCls(t.actual)}`}>{STAGE_LABELS[t.actual] ?? "?"}</span>
                      : <span style={{color:"var(--t3)"}}>—</span>}
                  </td>
                  <td>{t.actual!==null ? fmt(t.actual*t.multiplier,{sign:false}) : "—"}</td>
                  <td style={{color:t.upsetBonus>0?"var(--green)":"var(--t3)"}}>
                    {t.upsetBonus>0 ? fmt(t.upsetBonus) : "—"}
                  </td>
                  <td style={{fontWeight:700,color:(t.score??0)>0?"var(--green)":"var(--t3)"}}>
                    {t.score!==null ? fmt(t.score,{sign:false}) : "—"}
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
    <main style={{ paddingBottom: 16 }}>
      <div className="section-head">Prize Board</div>
      <div className="prize-grid">
        {PRIZES.map(cfg => {
          const data = prizes[cfg.key];
          return (
            <div key={cfg.key} className={`prize-card${data?" live":""}`}>
              <div className="prize-icon">{cfg.icon}</div>
              <div className="prize-label">{cfg.label}</div>
              <div className="prize-amt" style={{color:cfg.color}}>{cfg.amt}</div>
              {data ? (
                <>
                  <div className="prize-team">{data.team?.flag ?? ""} {data.team?.name ?? ""}</div>
                  <div className="prize-name" style={{color:cfg.color}}>{data.participant}</div>
                  {cfg.provisional && <div className="prize-prov">Provisional</div>}
                </>
              ) : <div className="prize-tbc">TBC</div>}
            </div>
          );
        })}
      </div>

      <div className="section-head" style={{marginTop:16}}>Underdog Leaderboard</div>
      {leaderboard.length === 0
        ? <div className="empty-state">No results yet — check back once matches begin.</div>
        : <div className="lb-list">{leaderboard.map((p,i) => <ParticipantRow key={p.name} p={p} index={i} />)}</div>
      }
      {waiting.length > 0 && (
        <p className="waiting-note">Awaiting first match: {waiting.map(p=>p.name).join(", ")}</p>
      )}

      <div className="section-head" style={{marginTop:16}}>How Scoring Works</div>
      <div className="explainer">
        <p>Your position is decided by your <strong>single best-performing team</strong>. Score = stage points × rank multiplier + upset bonus. Ties go to the bigger underdog.</p>

        <h4>Stage points</h4>
        <table className="exp-table">
          <tbody>
            {[["Group exit","0"],["Round of 32","0.5"],["Round of 16","1"],["Quarter-final","2"],["Semi-final","3"],["Runner-up","4"],["Winner","5"]].map(([s,p]) => (
              <tr key={s}><td>{s}</td><td>{p} pts</td></tr>
            ))}
          </tbody>
        </table>

        <h4>Rank multiplier</h4>
        <table className="exp-table">
          <tbody>
            {TIERS.map(t => {
              const teams = ALL_TEAMS.filter(team => team.rank>=t.min && team.rank<=t.max);
              return (
                <tr key={t.label}>
                  <td>
                    Rank {t.max===Infinity ? `${t.min}+` : `${t.min}–${t.max}`}
                    {teams.length>0 && (
                      <div style={{marginTop:5,lineHeight:2.2}}>
                        {teams.map(team => showRanks ? (
                          <span key={team.name} style={{display:"inline-flex",alignItems:"center",gap:3,marginRight:8}}>
                            <span style={{fontSize:14}}>{team.flag}</span>
                            <span style={{color:"var(--t3)",fontSize:11}}>#{team.rank}</span>
                            <span style={{fontSize:11}}>{team.name}</span>
                          </span>
                        ) : (
                          <span key={team.name} title={`${team.name} (#${team.rank})`} style={{marginRight:2,fontSize:15}}>{team.flag}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={{color:"var(--gold)",verticalAlign:"top",paddingTop:9}}>{t.label}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button className={`toggle-ranks-btn${showRanks?" on":""}`} onClick={() => setShowRanks(v=>!v)}>
          {showRanks ? "Hide rankings" : "Show rankings"}
        </button>

        <h4>Upset bonus</h4>
        <table className="exp-table">
          <thead><tr><th>Rank gap</th><th>Win</th><th>Draw</th></tr></thead>
          <tbody>
            {[["10–19","+1","+0.5"],["20–29","+1.5","+1"],["30–39","+2","+1.5"],["40–49","+2.5","+2"],["50+","+3","+2.5"]].map(([g,w,d]) => (
              <tr key={g}>
                <td>{g}</td>
                <td style={{color:"var(--green)",fontWeight:700}}>{w}</td>
                <td style={{color:"var(--green)",fontWeight:700}}>{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{marginTop:8,marginBottom:0,fontSize:12,color:"var(--t3)"}}>
          Rank gap = opponent rank − your rank. Applies in all stages.
        </p>
      </div>
    </main>
  );
}
