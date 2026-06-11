export default function LiveTicker({ matches }) {
  if (!matches || matches.length === 0) return null;

  const text = matches.map(m => {
    const home = m.homeTeam?.name || "Home";
    const away = m.awayTeam?.name || "Away";
    const hg = m.score?.fullTime?.home ?? 0;
    const ag = m.score?.fullTime?.away ?? 0;
    const min = m.minute ? ` (${m.minute}')` : "";
    return `🔴 ${home} ${hg}–${ag} ${away}${min}`;
  }).join("  ·  ");

  return (
    <div style={{
      background: "#1a0505",
      borderBottom: "1px solid #7f1d1d",
      padding: "6px 0",
      overflow: "hidden",
      whiteSpace: "nowrap",
    }}>
      <div style={{
        display: "inline-block",
        animation: "marquee 30s linear infinite",
        paddingLeft: "100%",
        color: "#ef4444",
        fontSize: "13px",
        fontWeight: 600,
        letterSpacing: "0.03em",
      }}>
        {text}
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-100%) } }`}</style>
    </div>
  );
}
