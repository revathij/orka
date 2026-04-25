import { Router } from "express";
import { query } from "../db.js";

const router = Router();
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isUuid(value) {
  return uuidPattern.test(value);
}

function mapServiceType(row) {
  return {
    id: row.id,
    name: row.name
  };
}

router.get("/", async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT id, name
       FROM service_types
       ORDER BY name ASC`
    );

    return res.json({ serviceTypes: result.rows.map(mapServiceType) });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  const name = cleanString(req.body.name);

  if (!name) {
    return res.status(400).json({ error: "Service type name is required" });
  }

  try {
    const result = await query(
      `INSERT INTO service_types (name)
       VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name`,
      [name]
    );

    return res.status(201).json({ serviceType: mapServiceType(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:serviceTypeId", async (req, res, next) => {
  const serviceTypeId = cleanString(req.params.serviceTypeId);

  if (!isUuid(serviceTypeId)) {
    return res.status(400).json({ error: "Invalid service type ID" });
  }

  try {
    const result = await query(
      "DELETE FROM service_types WHERE id = $1 RETURNING id",
      [serviceTypeId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Service type not found" });
    }

    return res.status(200).json({ deleted: true });
  } catch (error) {
    return next(error);
  }
});

export default router;
