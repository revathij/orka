import { Route, Routes } from "react-router-dom";
import EventsPage from "./pages/EventsPage.jsx";
import EventTimelinePage from "./pages/EventTimelinePage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<EventsPage />} />
      <Route path="/events/:eventId/timeline" element={<EventTimelinePage />} />
      <Route path="*" element={<EventsPage />} />
    </Routes>
  );
}
