import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import EventsPage from "../pages/EventsPage.jsx";
import EventTimelinePage from "../pages/EventTimelinePage.jsx";
import VendorsPage from "../pages/VendorsPage.jsx";
import { createBooking, createEvent, createVendor, getEventTimeline, getEvents, getVendors } from "../api.js";

vi.mock("../api.js", () => ({
  createBooking: vi.fn(),
  createEvent: vi.fn(),
  createVendor: vi.fn(),
  getEventTimeline: vi.fn(),
  getEvents: vi.fn(),
  getVendors: vi.fn()
}));

const eventId = "11111111-1111-4111-8111-111111111111";
const vendorId = "33333333-3333-4333-8333-333333333333";

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

function renderVendorsPage() {
  return render(
    <MemoryRouter>
      <VendorsPage />
    </MemoryRouter>
  );
}

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  createBooking.mockReset();
  createEvent.mockReset();
  createVendor.mockReset();
  getEventTimeline.mockReset();
  getEvents.mockReset();
  getVendors.mockReset();
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
    expect(screen.getByRole("link", { name: "Manage vendors" })).toHaveAttribute("href", "/vendors");
  });

  it("creates an event and reloads the list", async () => {
    getEvents
      .mockResolvedValueOnce({ events: [] })
      .mockResolvedValueOnce({
        events: [{ id: eventId, name: "Conference", startsAt: null, location: null, description: null }]
      });
    createEvent.mockResolvedValue({ event: { id: eventId, name: "Conference" } });

    renderEventsPage();

    fireEvent.change(await screen.findByLabelText("Event name"), {
      target: { value: "Conference" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create event" }));

    await waitFor(() =>
      expect(createEvent).toHaveBeenCalledWith({
        name: "Conference",
        startsAt: null,
        location: "",
        description: ""
      })
    );
  });
});

describe("VendorsPage", () => {
  it("lists vendors", async () => {
    getVendors.mockResolvedValue({
      vendors: [
        {
          id: vendorId,
          name: "Blue Hour Photography",
          serviceType: "Photography",
          contactName: "Priya Menon",
          email: "priya@example.com"
        }
      ]
    });

    renderVendorsPage();

    expect(await screen.findByText("Blue Hour Photography")).toBeInTheDocument();
    expect(screen.getByText("Photography")).toBeInTheDocument();
  });

  it("creates a vendor", async () => {
    getVendors
      .mockResolvedValueOnce({ vendors: [] })
      .mockResolvedValueOnce({
        vendors: [{ id: vendorId, name: "Blue Hour Photography", serviceType: "Photography" }]
      });
    createVendor.mockResolvedValue({ vendor: { id: vendorId, name: "Blue Hour Photography" } });

    renderVendorsPage();

    fireEvent.change(await screen.findByLabelText("Vendor name"), {
      target: { value: "Blue Hour Photography" }
    });
    fireEvent.change(screen.getByLabelText("Service type"), {
      target: { value: "Photography" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save vendor" }));

    await waitFor(() =>
      expect(createVendor).toHaveBeenCalledWith({
        name: "Blue Hour Photography",
        serviceType: "Photography",
        contactName: "",
        phone: "",
        email: "",
        notes: ""
      })
    );
  });
});

describe("EventTimelinePage", () => {
  it("shows the loading state", () => {
    getEventTimeline.mockReturnValue(new Promise(() => {}));
    getVendors.mockReturnValue(new Promise(() => {}));

    renderTimelinePage();

    expect(screen.getByText("Loading timeline...")).toBeInTheDocument();
  });

  it("renders timeline and adds service using vendor selection", async () => {
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
            vendorId,
            vendorName: "Blue Hour Photography",
            serviceType: "Photography",
            scheduledTime: "2026-06-01T10:00:00.000Z",
            status: "booked"
          }
        ]
      });
    getVendors
      .mockResolvedValueOnce({
        vendors: [
          {
            id: vendorId,
            name: "Blue Hour Photography",
            serviceType: "Photography"
          }
        ]
      })
      .mockResolvedValue({
        vendors: [
          {
            id: vendorId,
            name: "Blue Hour Photography",
            serviceType: "Photography"
          }
        ]
      });

    createBooking.mockResolvedValue({ booking: { id: "booking-1" } });

    renderTimelinePage();

    fireEvent.change(await screen.findByLabelText("Service type"), {
      target: { value: "Photography" }
    });
    fireEvent.change(screen.getByLabelText("Vendor"), {
      target: { value: vendorId }
    });
    fireEvent.change(screen.getByLabelText("Scheduled time"), {
      target: { value: "2026-06-01T10:00" }
    });
    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "booked" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Add service" }));

    await waitFor(() =>
      expect(createBooking).toHaveBeenCalledWith(eventId, {
        vendorId,
        serviceType: "Photography",
        scheduledTime: new Date("2026-06-01T10:00").toISOString(),
        status: "booked"
      })
    );

    expect(await screen.findByText("Blue Hour Photography")).toBeInTheDocument();
  });
});
