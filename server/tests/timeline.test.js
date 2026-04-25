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

function eventRow(id = eventId, name = "Launch Party") {
  return {
    id,
    name,
    starts_at: "2026-06-01T08:00:00.000Z",
    location: "Main Hall",
    description: "Demo event"
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
    expect(query.mock.calls[0][1]).toEqual([
      "Launch Party",
      "2026-06-01T08:00:00.000Z",
      "Main Hall",
      "Demo event"
    ]);
  });

  it("rejects event creation without a name", async () => {
    const response = await request(app).post("/api/events").send({ name: "" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Event name is required");
    expect(query).not.toHaveBeenCalled();
  });

  it("adds a booking to an event", async () => {
    query
      .mockResolvedValueOnce(mockEvent())
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: "vendor-1", name: "Bloom Florals" }] })
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [
          {
            id: "booking-1",
            service_type: "Floral setup",
            scheduled_time: "2026-06-01T07:30:00.000Z",
            status: "booked"
          }
        ]
      });

    const response = await request(app)
      .post(`/api/events/${eventId}/bookings`)
      .send({
        vendorName: "Bloom Florals",
        serviceType: "Floral setup",
        scheduledTime: "2026-06-01T07:30:00.000Z",
        status: "booked"
      });

    expect(response.status).toBe(201);
    expect(response.body.booking).toEqual({
      id: "booking-1",
      vendorName: "Bloom Florals",
      serviceType: "Floral setup",
      scheduledTime: "2026-06-01T07:30:00.000Z",
      status: "booked"
    });
  });

  it("rejects invalid booking status", async () => {
    const response = await request(app)
      .post(`/api/events/${eventId}/bookings`)
      .send({
        vendorName: "Bloom Florals",
        serviceType: "Floral setup",
        scheduledTime: "2026-06-01T07:30:00.000Z",
        status: "maybe"
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid booking status");
    expect(query).not.toHaveBeenCalled();
  });

  it("rejects missing booking details", async () => {
    const response = await request(app)
      .post(`/api/events/${eventId}/bookings`)
      .send({ vendorName: "Bloom Florals" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Vendor name, service type, and scheduled time are required");
    expect(query).not.toHaveBeenCalled();
  });
});

describe("GET /api/events/:eventId/timeline", () => {
  it("returns bookings in scheduled time order", async () => {
    query
      .mockResolvedValueOnce(mockEvent())
      .mockResolvedValueOnce(mockTimeline([
        {
          id: "booking-early",
          vendor_name: "Morning Blooms",
          service_type: "Flowers",
          scheduled_time: "2026-06-01T08:00:00.000Z",
          status: "booked"
        },
        {
          id: "booking-late",
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
    expect(query.mock.calls[1][0]).toContain("ORDER BY b.scheduled_time ASC");
  });

  it("groups timeline items by the requested event", async () => {
    query
      .mockResolvedValueOnce(mockEvent(otherEventId, "Dinner"))
      .mockResolvedValueOnce(mockTimeline([]));

    const response = await request(app).get(`/api/events/${otherEventId}/timeline`);

    expect(response.status).toBe(200);
    expect(response.body.event.id).toBe(otherEventId);
    expect(query.mock.calls[1][1]).toEqual([otherEventId]);
  });

  it("includes cancelled bookings", async () => {
    query
      .mockResolvedValueOnce(mockEvent())
      .mockResolvedValueOnce(mockTimeline([
        {
          id: "booking-cancelled",
          vendor_name: "Quiet Catering",
          service_type: "Catering",
          scheduled_time: "2026-06-01T12:00:00.000Z",
          status: "cancelled"
        }
      ]));

    const response = await request(app).get(`/api/events/${eventId}/timeline`);

    expect(response.status).toBe(200);
    expect(response.body.timeline).toHaveLength(1);
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
    expect(query).not.toHaveBeenCalled();
  });
});
