import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import EventsPage from "../pages/EventsPage.jsx";
import EventTimelinePage from "../pages/EventTimelinePage.jsx";
import { createBooking, createEvent, getEventTimeline, getEvents } from "../api.js";

vi.mock("../api.js", () => ({
  createBooking: vi.fn(),
  createEvent: vi.fn(),
  getEventTimeline: vi.fn(),
  getEvents: vi.fn()
}));

const eventId = "11111111-1111-4111-8111-111111111111";

function renderTimelinePage() {
  return render(
    <MemoryRouter initialEntries={[`/events/${eventId}/timeline`]}>
      <Routes>
        <Route path="/events/:eventId/timeline" element={<EventTimelinePage />} />
      </Routes>
    </MemoryRouter>
  );
}

function renderEventsPage() {
  return render(
    <MemoryRouter>
      <EventsPage />
    </MemoryRouter>
  );
}

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  createBooking.mockReset();
  createEvent.mockReset();
  getEventTimeline.mockReset();
  getEvents.mockReset();
});

describe("EventsPage", () => {
  it("lists events", async () => {
    getEvents.mockResolvedValue({
      events: [
        {
          id: eventId,
          name: "Garden Wedding",
          startsAt: "2026-06-01T08:00:00.000Z",
          location: "Main Hall",
          description: "Demo"
        }
      ]
    });

    renderEventsPage();

    expect(await screen.findByText("Garden Wedding")).toBeInTheDocument();
    expect(screen.getByText("Main Hall")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View timeline" })).toHaveAttribute(
      "href",
      `/events/${eventId}/timeline`
    );
  });

  it("shows an empty event list state", async () => {
    getEvents.mockResolvedValue({ events: [] });

    renderEventsPage();

    expect(await screen.findByText("No events yet. Create one to start building a timeline.")).toBeInTheDocument();
  });

  it("creates an event and reloads the list", async () => {
    getEvents
      .mockResolvedValueOnce({ events: [] })
      .mockResolvedValueOnce({
        events: [
          {
            id: eventId,
            name: "Conference",
            startsAt: null,
            location: null,
            description: null
          }
        ]
      });
    createEvent.mockResolvedValue({ event: { id: eventId, name: "Conference" } });

    renderEventsPage();

    fireEvent.change(await screen.findByLabelText("Event name"), {
      target: { value: "Conference" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create event" }));

    await waitFor(() => expect(createEvent).toHaveBeenCalledWith({
      name: "Conference",
      startsAt: null,
      location: "",
      description: ""
    }));
    expect(await screen.findByText("Conference")).toBeInTheDocument();
  });
});

describe("EventTimelinePage", () => {
  it("shows the loading state", () => {
    getEventTimeline.mockReturnValue(new Promise(() => {}));

    renderTimelinePage();

    expect(screen.getByText("Loading timeline...")).toBeInTheDocument();
  });

  it("shows the empty state", async () => {
    getEventTimeline.mockResolvedValue({
      event: { id: eventId, name: "Garden Wedding" },
      timeline: []
    });

    renderTimelinePage();

    expect(await screen.findByText("No services scheduled yet")).toBeInTheDocument();
    expect(screen.getByText("Garden Wedding")).toBeInTheDocument();
  });

  it("shows the error state", async () => {
    getEventTimeline.mockRejectedValue(new Error("Event not found"));

    renderTimelinePage();

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

    renderTimelinePage();

    expect(await screen.findByText("Conference")).toBeInTheDocument();
    expect(screen.getByText("Bright Audio")).toBeInTheDocument();
    expect(screen.getByText("Sound")).toBeInTheDocument();
    expect(screen.getAllByText("Booked").length).toBeGreaterThan(0);
    expect(screen.getByText("Calm Catering")).toBeInTheDocument();
    expect(screen.getAllByText("Cancelled").length).toBeGreaterThan(0);
    await waitFor(() => expect(getEventTimeline).toHaveBeenCalledWith(eventId));
  });

  it("adds a vendor service and refreshes the timeline", async () => {
    getEventTimeline
      .mockResolvedValueOnce({
        event: { id: eventId, name: "Conference" },
        timeline: []
      })
      .mockResolvedValueOnce({
        event: { id: eventId, name: "Conference" },
        timeline: [
          {
            id: "booking-1",
            vendorName: "Bright Audio",
            serviceType: "Sound",
            scheduledTime: "2026-06-01T10:00:00.000Z",
            status: "booked"
          }
        ]
      });
    createBooking.mockResolvedValue({ booking: { id: "booking-1" } });

    renderTimelinePage();

    fireEvent.change(await screen.findByLabelText("Vendor name"), {
      target: { value: "Bright Audio" }
    });
    fireEvent.change(screen.getByLabelText("Service type"), {
      target: { value: "Sound" }
    });
    fireEvent.change(screen.getByLabelText("Scheduled time"), {
      target: { value: "2026-06-01T10:00" }
    });
    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "booked" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Add service" }));

    await waitFor(() => expect(createBooking).toHaveBeenCalledWith(
      eventId,
      {
        vendorName: "Bright Audio",
        serviceType: "Sound",
        scheduledTime: new Date("2026-06-01T10:00").toISOString(),
        status: "booked"
      }
    ));
    expect(await screen.findByText("Bright Audio")).toBeInTheDocument();
  });
});
