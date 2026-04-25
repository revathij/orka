import { Router } from "express";
import { query } from "../db.js";

const router = Router();
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

router.get("/:eventId/timeline", async (req, res, next) => {
  const { eventId } = req.params;

  if (!uuidPattern.test(eventId)) {
    return res.status(400).json({ error: "Invalid event ID" });
  }

  try {
    const eventResult = await query(
      "SELECT id, name FROM events WHERE id = $1",
      [eventId]
    );

    if (eventResult.rowCount === 0) {
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
      event: eventResult.rows[0],
      timeline: timelineResult.rows.map((row) => ({
        id: row.id,
        vendorName: row.vendor_name,
        serviceType: row.service_type,
        scheduledTime: row.scheduled_time,
        status: row.status
      }))
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
