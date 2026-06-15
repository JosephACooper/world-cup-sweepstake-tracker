export default function Groups({ standings, teamToParticipant }) {
  if (!standings || standings.length === 0) {
    return <div className="empty-state">Group standings not available yet.</div>;
  }
  return (
    <div className="groups-grid">
      {standings.map(group => (
        <GroupTable key={group.group} group={group} teamToParticipant={teamToParticipant} />
      ))}
    </div>
  );
}

function GroupTable({ group, teamToParticipant }) {
  const letter = group.group?.replace("GROUP_", "") || "?";
  return (
    <div className="group-card">
      <div className="group-card-head">Group {letter}</div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Team</th>
            <th>P</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>GD</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {group.table.map((row, idx) => {
            const p = teamToParticipant[row.team.name];
            return (
              <tr
                key={row.team.id}
                style={{
                  background: idx < 2 ? "rgba(48,209,88,.05)" : "transparent",
                  borderLeft: p ? `3px solid ${p.color}` : "3px solid transparent",
                }}
              >
                <td>{row.position}</td>
                <td>
                  {row.team.crest && (
                    <img src={row.team.crest} alt="" style={{ width:14, height:14, objectFit:"contain", marginRight:5, verticalAlign:"middle" }} />
                  )}
                  {row.team.name}
                  {p && <span style={{ marginLeft:5, color:p.color, fontSize:10, fontWeight:600 }}>{p.name}</span>}
                </td>
                <td>{row.playedGames}</td>
                <td>{row.won}</td>
                <td>{row.draw}</td>
                <td>{row.lost}</td>
                <td>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
                <td className="pts">{row.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
