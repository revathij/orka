import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/db.js", () => ({
  query: vi.fn()
}));

const { query } = await import("../src/db.js");
const { createApp } = await import("../src/app.js");

const app = createApp();
const eventId = "11111111-1111-4111-8111-111111111111";
const otherEventId = "22222222-2222-4222-8222-222222222222";
const vendorId = "33333333-3333-4333-8333-333333333333";

function eventRow(id = eventId, name = "Launch Party") {
  return {
    id,
    name,
    starts_at: "2026-06-01T08:00:00.000Z",
    location: "Main Hall",
    description: "Demo event"
  };
}

function vendorRow(id = vendorId, name = "Blue Hour Photography") {
  return {
    id,
    name,
    service_type: "Photography",
    contact_name: "Priya Menon",
    phone: "+65 9000 1111",
    email: "priya@example.com",
    notes: "Available for full day"
  };
}

function mockEvent(id = eventId, name = "Launch Party") {
  return { rowCount: 1, rows: [eventRow(id, name)] };
}

function mockTimeline(rows) {
  return { rowCount: rows.length, rows };
}

beforeEach(() => {
  query.mockReset();
});

describe("vendor routes", () => {
  it("lists vendors", async () => {
    query.mockResolvedValueOnce({ rowCount: 1, rows: [vendorRow()] });

    const response = await request(app).get("/api/vendors");

    expect(response.status).toBe(200);
    expect(response.body.vendors[0]).toEqual({
      id: vendorId,
      name: "Blue Hour Photography",
      serviceType: "Photography",
      contactName: "Priya Menon",
      phone: "+65 9000 1111",
      email: "priya@example.com",
      notes: "Available for full day"
    });
  });

  it("creates a vendor", async () => {
    query.mockResolvedValueOnce({ rowCount: 1, rows: [vendorRow()] });

    const response = await request(app)
      .post("/api/vendors")
      .send({
        name: "Blue Hour Photography",
        serviceType: "Photography",
        contactName: "Priya Menon"
      });

    expect(response.status).toBe(201);
    expect(response.body.vendor.name).toBe("Blue Hour Photography");
    expect(query.mock.calls[0][1][0]).toBe("Blue Hour Photography");
    expect(query.mock.calls[0][1][1]).toBe("Photography");
  });

  it("rejects vendor creation without name and service type", async () => {
    const response = await request(app).post("/api/vendors").send({ name: "" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Vendor name and service type are required");
    expect(query).not.toHaveBeenCalled();
  });

  it("deletes a vendor", async () => {
    query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: vendorId }] });

    const response = await request(app).delete(`/api/vendors/${vendorId}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ deleted: true });
  });
});

describe("event routes", () => {
  it("lists events", async () => {
    query.mockResolvedValueOnce({ rowCount: 1, rows: [eventRow()] });

    const response = await request(app).get("/api/events");

    expect(response.status).toBe(200);
    expect(response.body.events).toEqual([
      {
        id: eventId,
        name: "Launch Party",
        startsAt: "2026-06-01T08:00:00.000Z",
        location: "Main Hall",
        description: "Demo event"
      }
    ]);
  });

  it("creates an event", async () => {
    query.mockResolvedValueOnce(mockEvent());

    const response = await request(app)
      .post("/api/events")
      .send({
        name: "Launch Party",
        startsAt: "2026-06-01T08:00:00.000Z",
        location: "Main Hall",
        description: "Demo event"
      });

    expect(response.status).toBe(201);
    expect(response.body.event.name).toBe("Launch Party");
  });

  it("adds a booking to an event", async () => {
    query
      .mockResolvedValueOnce(mockEvent())
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: vendorId, name: "Blue Hour Photography" }] })
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [
          {
            id: "booking-1",
            service_type: "Portrait session",
            scheduled_time: "2026-06-01T07:30:00.000Z",
            status: "booked"
          }
        ]
      });

    const response = await request(app)
      .post(`/api/events/${eventId}/bookings`)
      .send({
        vendorId,
        serviceType: "Portrait session",
        scheduledTime: "2026-06-01T07:30:00.000Z",
        status: "booked"
      });

    expect(response.status).toBe(201);
    expect(response.body.booking).toEqual({
      id: "booking-1",
      vendorId,
      vendorName: "Blue Hour Photography",
      serviceType: "Portrait session",
      scheduledTime: "2026-06-01T07:30:00.000Z",
      status: "booked"
    });
  });

  it("rejects booking with invalid vendor ID", async () => {
    const response = await request(app)
      .post(`/api/events/${eventId}/bookings`)
      .send({
        vendorId: "bad-id",
        serviceType: "Portrait session",
        scheduledTime: "2026-06-01T07:30:00.000Z",
        status: "booked"
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid vendor ID");
  });

  it("rejects missing booking details", async () => {
    const response = await request(app)
      .post(`/api/events/${eventId}/bookings`)
      .send({ vendorId });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Vendor, service type, and scheduled time are required");
    expect(query).not.toHaveBeenCalled();
  });

  it("deletes an event", async () => {
    query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: eventId }] });

    const response = await request(app).delete(`/api/events/${eventId}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ deleted: true });
  });

  it("deletes a booking", async () => {
    query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: "44444444-4444-4444-8444-444444444444" }] });

    const response = await request(app).delete("/api/events/bookings/44444444-4444-4444-8444-444444444444");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ deleted: true });
  });
});

describe("service type routes", () => {
  it("deletes a service type", async () => {
    query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: "55555555-5555-4555-8555-555555555555" }] });

    const response = await request(app).delete("/api/service-types/55555555-5555-4555-8555-555555555555");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ deleted: true });
  });
});

describe("GET /api/events/:eventId/timeline", () => {
  it("returns bookings in scheduled time order", async () => {
    query
      .mockResolvedValueOnce(mockEvent())
      .mockResolvedValueOnce(mockTimeline([
        {
          id: "booking-early",
          vendor_id: vendorId,
          vendor_name: "Morning Blooms",
          service_type: "Flowers",
          scheduled_time: "2026-06-01T08:00:00.000Z",
          status: "booked"
        },
        {
          id: "booking-late",
          vendor_id: vendorId,
          vendor_name: "Evening Beats",
          service_type: "Music",
          scheduled_time: "2026-06-01T20:00:00.000Z",
          status: "planned"
        }
      ]));

    const response = await request(app).get(`/api/events/${eventId}/timeline`);

    expect(response.status).toBe(200);
    expect(response.body.timeline.map((item) => item.id)).toEqual([
      "booking-early",
      "booking-late"
    ]);
  });

  it("groups timeline items by the requested event", async () => {
    query
      .mockResolvedValueOnce(mockEvent(otherEventId, "Dinner"))
      .mockResolvedValueOnce(mockTimeline([]));

    const response = await request(app).get(`/api/events/${otherEventId}/timeline`);

    expect(response.status).toBe(200);
    expect(response.body.event.id).toBe(otherEventId);
  });

  it("includes cancelled bookings", async () => {
    query
      .mockResolvedValueOnce(mockEvent())
      .mockResolvedValueOnce(mockTimeline([
        {
          id: "booking-cancelled",
          vendor_id: vendorId,
          vendor_name: "Quiet Catering",
          service_type: "Catering",
          scheduled_time: "2026-06-01T12:00:00.000Z",
          status: "cancelled"
        }
      ]));

    const response = await request(app).get(`/api/events/${eventId}/timeline`);

    expect(response.status).toBe(200);
    expect(response.body.timeline[0].status).toBe("cancelled");
  });

  it("returns an empty timeline for an event without bookings", async () => {
    query
      .mockResolvedValueOnce(mockEvent())
      .mockResolvedValueOnce(mockTimeline([]));

    const response = await request(app).get(`/api/events/${eventId}/timeline`);

    expect(response.status).toBe(200);
    expect(response.body.timeline).toEqual([]);
  });

  it("returns a proper error for an invalid event ID", async () => {
    const response = await request(app).get("/api/events/not-a-uuid/timeline");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Invalid event ID" });
  });
});
