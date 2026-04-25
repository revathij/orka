import { Router } from "express";
import { query } from "../db.js";

const router = Router();

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
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

export default router;
