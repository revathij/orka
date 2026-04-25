import { Router } from "express";
import { query } from "../db.js";

const router = Router();
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const statuses = new Set(["planned", "booked", "completed", "cancelled"]);

function isUuid(value) {
  return uuidPattern.test(value);
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function mapEvent(row) {
  return {
    id: row.id,
    name: row.name,
    startsAt: row.starts_at,
    location: row.location,
    description: row.description
  };
}

function mapBooking(row) {
  return {
    id: row.id,
    vendorName: row.vendor_name,
    serviceType: row.service_type,
    scheduledTime: row.scheduled_time,
    status: row.status
  };
}

async function findEvent(eventId) {
  const result = await query(
    "SELECT id, name, starts_at, location, description FROM events WHERE id = $1",
    [eventId]
  );

  return result.rowCount === 0 ? null : mapEvent(result.rows[0]);
}

router.get("/", async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT id, name, starts_at, location, description
       FROM events
       ORDER BY created_at DESC, name ASC`
    );

    return res.json({ events: result.rows.map(mapEvent) });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  const name = cleanString(req.body.name);
  const location = cleanString(req.body.location) || null;
  const description = cleanString(req.body.description) || null;
  const startsAt = cleanString(req.body.startsAt) || null;

  if (!name) {
    return res.status(400).json({ error: "Event name is required" });
  }

  try {
    const result = await query(
      `INSERT INTO events (name, starts_at, location, description)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, starts_at, location, description`,
      [name, startsAt, location, description]
    );

    return res.status(201).json({ event: mapEvent(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

router.get("/:eventId", async (req, res, next) => {
  const { eventId } = req.params;

  if (!isUuid(eventId)) {
    return res.status(400).json({ error: "Invalid event ID" });
  }

  try {
    const event = await findEvent(eventId);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    return res.json({ event });
  } catch (error) {
    return next(error);
  }
});

router.get("/:eventId/timeline", async (req, res, next) => {
  const { eventId } = req.params;

  if (!isUuid(eventId)) {
    return res.status(400).json({ error: "Invalid event ID" });
  }

  try {
    const event = await findEvent(eventId);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const timelineResult = await query(
      `SELECT
         b.id,
         v.name AS vendor_name,
         b.service_type,
         b.scheduled_time,
         b.status
       FROM bookings b
       JOIN vendors v ON v.id = b.vendor_id
       WHERE b.event_id = $1
       ORDER BY b.scheduled_time ASC, b.created_at ASC`,
      [eventId]
    );

    return res.json({
      event,
      timeline: timelineResult.rows.map(mapBooking)
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/:eventId/bookings", async (req, res, next) => {
  const { eventId } = req.params;
  const vendorName = cleanString(req.body.vendorName);
  const serviceType = cleanString(req.body.serviceType);
  const scheduledTime = cleanString(req.body.scheduledTime);
  const status = cleanString(req.body.status) || "planned";

  if (!isUuid(eventId)) {
    return res.status(400).json({ error: "Invalid event ID" });
  }

  if (!vendorName || !serviceType || !scheduledTime) {
    return res.status(400).json({ error: "Vendor name, service type, and scheduled time are required" });
  }

  if (!statuses.has(status)) {
    return res.status(400).json({ error: "Invalid booking status" });
  }

  try {
    const event = await findEvent(eventId);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const vendorResult = await query(
      "INSERT INTO vendors (name) VALUES ($1) RETURNING id, name",
      [vendorName]
    );

    const bookingResult = await query(
      `INSERT INTO bookings (event_id, vendor_id, service_type, scheduled_time, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, service_type, scheduled_time, status`,
      [eventId, vendorResult.rows[0].id, serviceType, scheduledTime, status]
    );

    return res.status(201).json({
      booking: mapBooking({
        ...bookingResult.rows[0],
        vendor_name: vendorResult.rows[0].name
      })
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
