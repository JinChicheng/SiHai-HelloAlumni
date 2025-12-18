import express from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { run, all, get } from "../db.js";
import { haversineKm } from "../utils/distance.js";

const router = express.Router();

function authMiddleware(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: "unauthorized" });
  try {
    const secret = process.env.JWT_SECRET || "dev_secret";
    const payload = jwt.verify(token, secret);
    req.userId = payload.uid;
    next();
  } catch (e) {
    return res.status(401).json({ error: "unauthorized" });
  }
}

router.use(authMiddleware);

// Create resource
router.post("/", (req, res) => {
  const schema = z.object({
    type: z.enum(["recruitment", "cooperation", "investment", "service"]),
    title: z.string().min(1),
    description: z.string().optional(),
    address: z.string().min(1),
    lat: z.number(),
    lng: z.number(),
    contact_name: z.string().optional(),
    contact_phone: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload", details: parsed.error.issues });

  const { type, title, description, address, lat, lng, contact_name, contact_phone } = parsed.data;
  const now = new Date().toISOString();

  run(`
    INSERT INTO resources (user_id, type, title, description, address, lat, lng, contact_name, contact_phone, created_at)
    VALUES ($uid, $type, $title, $desc, $addr, $lat, $lng, $cn, $cp, $created_at)
  `, {
    $uid: req.userId,
    $type: type,
    $title: title,
    $desc: description || "",
    $addr: address,
    $lat: lat,
    $lng: lng,
    $cn: contact_name || "",
    $cp: contact_phone || "",
    $created_at: now
  });

  res.json({ ok: true });
});

// Get resources (with optional filters and spatial search)
router.get("/", (req, res) => {
  const schema = z.object({
    type: z.string().optional(),
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional(),
    radius_km: z.coerce.number().default(5)
  });

  const parsed = schema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "invalid_query" });

  const { type, lat, lng, radius_km } = parsed.data;

  let sql = `
    SELECT r.*, u.name as user_name
    FROM resources r
    JOIN users u ON r.user_id = u.id
    WHERE 1=1
  `;
  const params = {};

  if (type) {
    sql += ` AND r.type = $type`;
    params.$type = type;
  }

  const rows = all(sql, params);

  // Filter by distance if lat/lng provided
  let results = rows;
  if (lat !== undefined && lng !== undefined) {
    results = rows.map(r => {
      const dist = haversineKm(lat, lng, r.lat, r.lng);
      return { ...r, distance_km: dist };
    }).filter(r => r.distance_km <= radius_km)
      .sort((a, b) => a.distance_km - b.distance_km);
  } else {
      // Sort by newest first if not by distance
      results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  res.json({ total: results.length, items: results });
});

router.get("/:id", (req, res) => {
    const id = Number(req.params.id);
    const row = get(`
        SELECT r.*, u.name as user_name
        FROM resources r
        JOIN users u ON r.user_id = u.id
        WHERE r.id = $id
    `, { $id: id });
    
    if (!row) return res.status(404).json({ error: "not_found" });
    res.json(row);
});

export default router;
