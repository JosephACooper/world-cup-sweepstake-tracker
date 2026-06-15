import Groups from "./Groups.jsx";
import Bracket from "./Bracket.jsx";

export default function Tournament({ standings, bracket, teamToParticipant }) {
  return (
    <main style={{ paddingBottom: 60 }}>
      <div className="section-label">Group Stage</div>
      <Groups standings={standings} teamToParticipant={teamToParticipant} />
      <div className="section-label" style={{ marginTop: 8 }}>Knockout Bracket</div>
      <Bracket bracket={bracket} teamToParticipant={teamToParticipant} />
    </main>
  );
}
