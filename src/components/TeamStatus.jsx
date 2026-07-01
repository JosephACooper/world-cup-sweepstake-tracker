function StatusPill({ status, outAt }) {
  if (status === "champion") {
    return (
      <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, color: "#0b1928", background: "#c9a227" }}>
        Champion
      </span>
    );
  }
  if (status === "out") {
    return (
      <span title={outAt ? `Out — ${outAt}` : "Out"} style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, color: "#ef4444", background: "#ef444420" }}>
        Out
      </span>
    );
  }
  return (
    <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, color: "#10b981", background: "#10b98120" }}>
      In
    </span>
  );
}

export default function TeamStatus({ participants, statusByTeam }) {
  return (
    <main style={{ padding: "16px 16px 60px" }}>
      <div style={{ color: "#3a5070", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
        Team Status
      </div>
      {participants.map(participant => {
        const teams = participant.teams.map(t => ({ ...t, ...(statusByTeam[t.apiName] ?? { status: "in", outAt: null }) }));
        const inCount = teams.filter(t => t.status !== "out").length;

        return (
          <div key={participant.name} style={{
            background: "#0b1928",
            border: "1px solid #132035",
            borderLeft: `4px solid ${participant.color}`,
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 8,
          }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontWeight: 700, color: "#dde4f0" }}>{participant.name}</div>
              <div style={{ marginLeft: "auto", fontSize: 11, color: "#3a5070" }}>
                {inCount} of {teams.length} in
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {teams.map(t => (
                <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 8, opacity: t.status === "out" ? 0.6 : 1 }}>
                  <span style={{ fontSize: 15 }}>{t.flag}</span>
                  <span style={{ flex: 1, fontSize: 13, color: "#dde4f0" }}>{t.name}</span>
                  <StatusPill status={t.status} outAt={t.outAt} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </main>
  );
}
