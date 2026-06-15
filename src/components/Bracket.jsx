function Slot({ name, crest, score, won, lost, isLive, participant }) {
  return (
    <div
      className={`b-slot${won?" won":""}${lost?" lost":""}`}
      style={participant ? {borderLeft:`3px solid ${participant.color}`} : {borderLeft:"3px solid transparent"}}
    >
      {crest && <img src={crest} alt="" style={{width:15,height:15,objectFit:"contain",flexShrink:0}} />}
      <div style={{flex:1,minWidth:0}}>
        <div className={`b-name${won?" won":""}`}>{name}</div>
        {participant && <div className="b-participant" style={{color:participant.color}}>{participant.name}</div>}
      </div>
      {score !== null && score !== undefined && (
        <div className="b-score" style={{color:won?"var(--t1)":"var(--t3)"}}>{score}</div>
      )}
      {isLive && <div className="live-dot" />}
    </div>
  );
}

function BracketCard({ match, teamToParticipant }) {
  if (!match) return (
    <div className="b-card">
      <Slot name="TBD" /><div className="b-sep" /><Slot name="TBD" />
    </div>
  );
  const hWon  = match.status==="FINISHED" && match.score?.winner==="HOME_TEAM";
  const aWon  = match.status==="FINISHED" && match.score?.winner==="AWAY_TEAM";
  const isLive = match.status==="IN_PLAY" || match.status==="PAUSED";
  const hName = match.homeTeam?.name || "TBD";
  const aName = match.awayTeam?.name || "TBD";
  return (
    <div className="b-card">
      <Slot name={hName} crest={match.homeTeam?.crest} score={match.score?.fullTime?.home} won={hWon} lost={aWon} isLive={isLive} participant={teamToParticipant[hName]} />
      <div className="b-sep" />
      <Slot name={aName} crest={match.awayTeam?.crest} score={match.score?.fullTime?.away} won={aWon} lost={hWon} isLive={isLive} participant={teamToParticipant[aName]} />
    </div>
  );
}

const LABELS = {r32:"Rd of 32",r16:"Rd of 16",qf:"Quarter-finals",sf:"Semi-finals",third:"3rd Place",final:"Final"};
const ORDER  = ["r32","r16","qf","sf","third","final"];
const COUNT  = {r32:16,r16:8,qf:4,sf:2,third:1,final:1};

export default function Bracket({ bracket, teamToParticipant }) {
  if (!bracket) return null;
  const lastIdx = ORDER.reduce((l,r,i) => (bracket[r]||[]).length>0?i:l, -1);
  if (lastIdx === -1)
    return <div className="empty-state">Bracket not available yet. Check back after the group stage.</div>;
  return (
    <div className="bracket-scroll">
      <div className="bracket-row">
        {ORDER.slice(0,lastIdx+1).map(round => {
          const matches = bracket[round] || [];
          return (
            <div key={round} className="b-round">
              <div className="b-round-lbl">{LABELS[round]}</div>
              {matches.length===0
                ? Array.from({length:COUNT[round]??1}).map((_,i)=><BracketCard key={i} match={null} teamToParticipant={teamToParticipant}/>)
                : matches.map((m,i)=><BracketCard key={m.id??i} match={m} teamToParticipant={teamToParticipant}/>)
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}
