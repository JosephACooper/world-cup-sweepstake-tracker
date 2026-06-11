import Groups from "./Groups.jsx";
import Bracket from "./Bracket.jsx";

function SectionHeader({ children }) {
  return (
    <div style={{
      padding: "10px 16px",
      color: "#3a5070",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      background: "#070e18",
      borderBottom: "1px solid #132035",
      borderTop: "1px solid #132035",
    }}>
      {children}
    </div>
  );
}

export default function Tournament({ standings, bracket, teamToParticipant }) {
  return (
    <main style={{ paddingBottom: 60 }}>
      <SectionHeader>Group Stage</SectionHeader>
      <Groups standings={standings} teamToParticipant={teamToParticipant} />
      <SectionHeader>Knockout Bracket</SectionHeader>
      <Bracket bracket={bracket} teamToParticipant={teamToParticipant} />
    </main>
  );
}
