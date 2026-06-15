export default function LiveTicker({ matches }) {
  if (!matches || matches.length === 0) return null;

  const text = matches.map(m => {
    const home = m.homeTeam?.name || "Home";
    const away = m.awayTeam?.name || "Away";
    const hg = m.score?.fullTime?.home ?? 0;
    const ag = m.score?.fullTime?.away ?? 0;
    const min = m.minute ? ` ${m.minute}'` : "";
    return `● ${home} ${hg}–${ag} ${away}${min}`;
  }).join("   ·   ");

  return (
    <div className="live-ticker">
      <div className="live-ticker-inner">{text}</div>
    </div>
  );
}
