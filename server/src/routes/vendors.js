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

function mapVendor(row) {
  return {
    id: row.id,
    name: row.name,
    serviceType: row.service_type,
    contactName: row.contact_name,
    phone: row.phone,
    email: row.email,
    notes: row.notes,
    photoUrl: row.photo_url
  };
}

router.get("/", async (req, res, next) => {
  const serviceType = cleanString(req.query.serviceType);

  try {
    const result = serviceType
      ? await query(
          `SELECT id, name, service_type, contact_name, phone, email, notes, photo_url
           FROM vendors
           WHERE LOWER(service_type) = LOWER($1)
           ORDER BY name ASC`,
          [serviceType]
        )
      : await query(
          `SELECT id, name, service_type, contact_name, phone, email, notes, photo_url
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
  const serviceType = cleanString(req.body.serviceType) || null;
  const contactName = cleanString(req.body.contactName) || null;
  const phone = cleanString(req.body.phone) || null;
  const email = cleanString(req.body.email) || null;
  const notes = cleanString(req.body.notes) || null;
  const photoUrl = cleanString(req.body.photoUrl) || null;

  if (!name) {
    return res.status(400).json({ error: "Vendor name is required" });
  }

  try {
    const result = await query(
      `INSERT INTO vendors (name, service_type, contact_name, phone, email, notes, photo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, service_type, contact_name, phone, email, notes, photo_url`,
      [name, serviceType, contactName, phone, email, notes, photoUrl]
    );

    return res.status(201).json({ vendor: mapVendor(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:vendorId", async (req, res, next) => {
  const vendorId = cleanString(req.params.vendorId);

  if (!isUuid(vendorId)) {
    return res.status(400).json({ error: "Invalid vendor ID" });
  }

  try {
    const result = await query(
      "DELETE FROM vendors WHERE id = $1 RETURNING id",
      [vendorId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    return res.status(200).json({ deleted: true });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({ error: "Vendor has bookings and cannot be deleted" });
    }

    return next(error);
  }
});

export default router;
