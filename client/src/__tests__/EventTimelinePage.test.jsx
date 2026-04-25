import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import EventsPage from "../pages/EventsPage.jsx";
import EventTimelinePage from "../pages/EventTimelinePage.jsx";
import VendorsPage from "../pages/VendorsPage.jsx";
import {
  createBooking,
  createEvent,
  createServiceType,
  createVendor,
  deleteEvent,
  deleteServiceType,
  deleteVendor,
  getEventTimeline,
  getEvents,
  getServiceTypes,
  getVendors
} from "../api.js";

vi.mock("../api.js", () => ({
  createBooking: vi.fn(),
  createEvent: vi.fn(),
  createServiceType: vi.fn(),
  createVendor: vi.fn(),
  deleteEvent: vi.fn(),
  deleteServiceType: vi.fn(),
  deleteVendor: vi.fn(),
  getEventTimeline: vi.fn(),
  getEvents: vi.fn(),
  getServiceTypes: vi.fn(),
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
  createServiceType.mockReset();
  createVendor.mockReset();
  deleteEvent.mockReset();
  deleteServiceType.mockReset();
  deleteVendor.mockReset();
  getEventTimeline.mockReset();
  getEvents.mockReset();
  getServiceTypes.mockReset();
  getVendors.mockReset();
});

describe("EventsPage", () => {
  it("lists events and manages service types", async () => {
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
    getServiceTypes
      .mockResolvedValueOnce({ serviceTypes: [{ id: "s1", name: "Photography" }] })
      .mockResolvedValueOnce({ serviceTypes: [{ id: "s1", name: "Photography" }, { id: "s2", name: "Lighting" }] });
    createServiceType.mockResolvedValue({ serviceType: { id: "s2", name: "Lighting" } });

    renderEventsPage();

    expect(await screen.findByText("Garden Wedding")).toBeInTheDocument();

    fireEvent.change(await screen.findByLabelText("Service type name"), {
      target: { value: "Lighting" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Add service type" }));

    await waitFor(() => expect(createServiceType).toHaveBeenCalledWith({ name: "Lighting" }));
  });
});

describe("VendorsPage", () => {
  it("creates vendor", async () => {
    getVendors.mockResolvedValue({ vendors: [] });
    createVendor.mockResolvedValue({ vendor: { id: "v1" } });

    renderVendorsPage();

    fireEvent.change(await screen.findByLabelText("Vendor name"), {
      target: { value: "Blue Hour Photography" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save vendor" }));

    await waitFor(() =>
      expect(createVendor).toHaveBeenCalledWith({
        name: "Blue Hour Photography",
        contactName: "",
        phone: "",
        email: "",
        notes: "",
        photoUrl: ""
      })
    );
  });
});

describe("EventTimelinePage", () => {
  it("adds service using selected service type", async () => {
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

    getServiceTypes.mockResolvedValue({ serviceTypes: [{ id: "s1", name: "Photography" }] });
    getVendors.mockResolvedValue({
      vendors: [{ id: vendorId, name: "Blue Hour Photography", serviceType: "Photography" }]
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
  });
});
