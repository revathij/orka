import { Route, Routes } from "react-router-dom";
import EventsPage from "./pages/EventsPage.jsx";
import EventTimelinePage from "./pages/EventTimelinePage.jsx";
import VendorsPage from "./pages/VendorsPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<EventsPage />} />
      <Route path="/vendors" element={<VendorsPage />} />
      <Route path="/events/:eventId/timeline" element={<EventTimelinePage />} />
      <Route path="*" element={<EventsPage />} />
    </Routes>
  );
}
