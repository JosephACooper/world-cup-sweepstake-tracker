export default function Groups({ standings, teamToParticipant }) {
  if (!standings || standings.length === 0) {
    return (
      <main style={{ padding: 16, color: "#3a5070", textAlign: "center", paddingTop: 48 }}>
        Group standings not available yet.
      </main>
    );
  }

  return (
    <main style={{ padding: "16px", paddingBottom: 60 }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 16,
      }}>
        {standings.map(group => (
          <GroupTable key={group.group} group={group} teamToParticipant={teamToParticipant} />
        ))}
      </div>
    </main>
  );
}

function GroupTable({ group, teamToParticipant }) {
  const groupLetter = group.group?.replace("GROUP_", "") || "?";
  return (
    <div style={{
      background: "#0b1928",
      border: "1px solid #132035",
      borderRadius: 10,
      overflow: "hidden",
    }}>
      <div style={{
        padding: "10px 14px",
        background: "#070e18",
        borderBottom: "1px solid #132035",
        fontWeight: 700,
        color: "#dde4f0",
        fontSize: 14,
      }}>
        Group {groupLetter}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ color: "#3a5070" }}>
            <th style={thStyle}>#</th>
            <th style={{ ...thStyle, textAlign: "left" }}>Team</th>
            <th style={thStyle}>P</th>
            <th style={thStyle}>W</th>
            <th style={thStyle}>D</th>
            <th style={thStyle}>L</th>
            <th style={thStyle}>GF</th>
            <th style={thStyle}>GA</th>
            <th style={thStyle}>GD</th>
            <th style={thStyle}>Pts</th>
          </tr>
        </thead>
        <tbody>
          {group.table.map((row, idx) => {
            const participant = teamToParticipant[row.team.name];
            const bg = idx === 0 || idx === 1 ? "#0d1e30" : idx === 2 ? "#0c1a25" : "transparent";
            return (
              <tr key={row.team.id} style={{
                background: bg,
                borderLeft: participant ? `3px solid ${participant.color}` : "3px solid transparent",
              }}>
                <td style={tdStyle}>{row.position}</td>
                <td style={{ ...tdStyle, textAlign: "left", color: "#dde4f0" }}>
                  {row.team.crest ? (
                    <img src={row.team.crest} alt="" style={{ width: 16, height: 16, objectFit: "contain", marginRight: 6, verticalAlign: "middle" }} />
                  ) : null}
                  {row.team.name}
                  {participant ? <span style={{ marginLeft: 6, color: participant.color, fontSize: 10, fontWeight: 600 }}>{participant.name}</span> : null}
                </td>
                <td style={tdStyle}>{row.playedGames}</td>
                <td style={tdStyle}>{row.won}</td>
                <td style={tdStyle}>{row.draw}</td>
                <td style={tdStyle}>{row.lost}</td>
                <td style={tdStyle}>{row.goalsFor}</td>
                <td style={tdStyle}>{row.goalsAgainst}</td>
                <td style={tdStyle}>{row.goalDifference}</td>
                <td style={{ ...tdStyle, fontWeight: 700, color: "#dde4f0" }}>{row.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = { padding: "8px 6px", textAlign: "center", fontWeight: 600, fontSize: 11 };
const tdStyle = { padding: "8px 6px", textAlign: "center", color: "#94a3b8", borderTop: "1px solid #0d1e30" };
