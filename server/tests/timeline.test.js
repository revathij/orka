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

function mockEvent(id = eventId, name = "Launch Party") {
  return { rowCount: 1, rows: [{ id, name }] };
}

function mockTimeline(rows) {
  return { rowCount: rows.length, rows };
}

beforeEach(() => {
  query.mockReset();
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
    expect(response.body.event).toEqual({ id: otherEventId, name: "Dinner" });
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
