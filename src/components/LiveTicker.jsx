export default function LiveTicker({ matches }) {
  if (!matches || matches.length === 0) return null;
  const text = matches.map(m => {
    const h = m.homeTeam?.name || "Home";
    const a = m.awayTeam?.name || "Away";
    const hg = m.score?.fullTime?.home ?? 0;
    const ag = m.score?.fullTime?.away ?? 0;
    return `● ${h} ${hg}–${ag} ${a}${m.minute ? `  ${m.minute}'` : ""}`;
  }).join("    ·    ");
  return (
    <div className="ticker">
      <div className="ticker-inner">{text}</div>
    </div>
  );
}
