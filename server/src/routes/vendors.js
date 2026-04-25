import { Router } from "express";
import { query } from "../db.js";

const router = Router();

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function mapVendor(row) {
  return {
    id: row.id,
    name: row.name,
    serviceType: row.service_type,
    contactName: row.contact_name,
    phone: row.phone,
    email: row.email,
    notes: row.notes
  };
}

router.get("/", async (req, res, next) => {
  const serviceType = cleanString(req.query.serviceType);

  try {
    const result = serviceType
      ? await query(
          `SELECT id, name, service_type, contact_name, phone, email, notes
           FROM vendors
           WHERE LOWER(service_type) = LOWER($1)
           ORDER BY name ASC`,
          [serviceType]
        )
      : await query(
          `SELECT id, name, service_type, contact_name, phone, email, notes
           FROM vendors
           ORDER BY service_type ASC NULLS LAST, name ASC`
        );

    return res.json({ vendors: result.rows.map(mapVendor) });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  const name = cleanString(req.body.name);
  const serviceType = cleanString(req.body.serviceType);
  const contactName = cleanString(req.body.contactName) || null;
  const phone = cleanString(req.body.phone) || null;
  const email = cleanString(req.body.email) || null;
  const notes = cleanString(req.body.notes) || null;

  if (!name || !serviceType) {
    return res.status(400).json({ error: "Vendor name and service type are required" });
  }

  try {
    const result = await query(
      `INSERT INTO vendors (name, service_type, contact_name, phone, email, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, service_type, contact_name, phone, email, notes`,
      [name, serviceType, contactName, phone, email, notes]
    );

    return res.status(201).json({ vendor: mapVendor(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

export default router;
