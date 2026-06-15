export default function Groups({ standings, teamToParticipant }) {
  if (!standings || standings.length === 0) {
    return (
      <div className="empty-state">Group standings not available yet.</div>
    );
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
  const groupLetter = group.group?.replace("GROUP_", "") || "?";
  return (
    <div className="group-card">
      <div className="group-card-header">Group {groupLetter}</div>
      <table className="group-table">
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
            const participant = teamToParticipant[row.team.name];
            const isQualifying = idx < 2;
            return (
              <tr
                key={row.team.id}
                style={{
                  background: isQualifying ? "rgba(48, 209, 88, 0.04)" : "transparent",
                  borderLeft: participant ? `3px solid ${participant.color}` : "3px solid transparent",
                }}
              >
                <td>{row.position}</td>
                <td style={{ color: "var(--label-primary)" }}>
                  {row.team.crest && (
                    <img src={row.team.crest} alt="" style={{ width: 14, height: 14, objectFit: "contain", marginRight: 6, verticalAlign: "middle" }} />
                  )}
                  {row.team.name}
                  {participant && (
                    <span style={{ marginLeft: 6, color: participant.color, fontSize: 10, fontWeight: 600 }}>
                      {participant.name}
                    </span>
                  )}
                </td>
                <td>{row.playedGames}</td>
                <td>{row.won}</td>
                <td>{row.draw}</td>
                <td>{row.lost}</td>
                <td>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
                <td className="pts-cell">{row.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
