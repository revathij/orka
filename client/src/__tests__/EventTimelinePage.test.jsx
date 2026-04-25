import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EventTimelinePage from "../pages/EventTimelinePage.jsx";
import { getEventTimeline } from "../api.js";

vi.mock("../api.js", () => ({
  getEventTimeline: vi.fn()
}));

const eventId = "11111111-1111-4111-8111-111111111111";

function renderPage() {
  return render(
    <MemoryRouter initialEntries={[`/events/${eventId}/timeline`]}>
      <Routes>
        <Route path="/events/:eventId/timeline" element={<EventTimelinePage />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  getEventTimeline.mockReset();
});

describe("EventTimelinePage", () => {
  it("shows the loading state", () => {
    getEventTimeline.mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText("Loading timeline...")).toBeInTheDocument();
  });

  it("shows the empty state", async () => {
    getEventTimeline.mockResolvedValue({
      event: { id: eventId, name: "Garden Wedding" },
      timeline: []
    });

    renderPage();

    expect(await screen.findByText("No services scheduled yet")).toBeInTheDocument();
    expect(screen.getByText("Garden Wedding")).toBeInTheDocument();
  });

  it("shows the error state", async () => {
    getEventTimeline.mockRejectedValue(new Error("Event not found"));

    renderPage();

    expect(await screen.findByText("We could not load this timeline.")).toBeInTheDocument();
    expect(screen.getByText("Event not found")).toBeInTheDocument();
  });

  it("renders timeline items", async () => {
    getEventTimeline.mockResolvedValue({
      event: { id: eventId, name: "Conference" },
      timeline: [
        {
          id: "booking-1",
          vendorName: "Bright Audio",
          serviceType: "Sound",
          scheduledTime: "2026-06-01T10:00:00.000Z",
          status: "booked"
        },
        {
          id: "booking-2",
          vendorName: "Calm Catering",
          serviceType: "Lunch",
          scheduledTime: "2026-06-01T12:00:00.000Z",
          status: "cancelled"
        }
      ]
    });

    renderPage();

    expect(await screen.findByText("Conference")).toBeInTheDocument();
    expect(screen.getByText("Bright Audio")).toBeInTheDocument();
    expect(screen.getByText("Sound")).toBeInTheDocument();
    expect(screen.getByText("Booked")).toBeInTheDocument();
    expect(screen.getByText("Calm Catering")).toBeInTheDocument();
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
    await waitFor(() => expect(getEventTimeline).toHaveBeenCalledWith(eventId));
  });
});
