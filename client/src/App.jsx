import { Route, Routes } from "react-router-dom";
import EventTimelinePage from "./pages/EventTimelinePage.jsx";

function HomePage() {
  return (
    <main className="page-state">
      <p className="eyebrow">Orka</p>
      <h1>Event timelines</h1>
      <p>Open `/events/:eventId/timeline` to view an event orchestration timeline.</p>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/events/:eventId/timeline" element={<EventTimelinePage />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}
