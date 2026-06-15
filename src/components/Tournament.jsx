import Groups from "./Groups.jsx";
import Bracket from "./Bracket.jsx";

export default function Tournament({ standings, bracket, teamToParticipant }) {
  return (
    <main style={{ paddingBottom: 16 }}>
      <div className="section-head">Group Stage</div>
      <Groups standings={standings} teamToParticipant={teamToParticipant} />
      <div className="section-head" style={{ marginTop: 8 }}>Knockout Bracket</div>
      <Bracket bracket={bracket} teamToParticipant={teamToParticipant} />
    </main>
  );
}
