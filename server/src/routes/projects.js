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

// Create project
router.post("/", (req, res) => {
  const schema = z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    funding_target: z.number().positive(),
    funding_stage: z.enum(["seed", "angel", "series-a", "series-b", "series-c", "pre-ipo"]),
    address: z.string().min(1),
    lat: z.number(),
    lng: z.number(),
    alumni_id_verification: z.string().min(1),
    project_materials: z.string().min(1)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload", details: parsed.error.issues });

  const { name, description, funding_target, funding_stage, address, lat, lng, alumni_id_verification, project_materials } = parsed.data;
  const now = new Date().toISOString();

  run(`
    INSERT INTO projects (user_id, name, description, funding_target, funding_stage, address, lat, lng, alumni_id_verification, project_materials, status, created_at, updated_at)
    VALUES ($uid, $name, $desc, $funding_target, $funding_stage, $addr, $lat, $lng, $alumni_id, $project_materials, $status, $created_at, $updated_at)
  `, {
    $uid: req.userId,
    $name: name,
    $desc: description,
    $funding_target: funding_target,
    $funding_stage: funding_stage,
    $addr: address,
    $lat: lat,
    $lng: lng,
    $alumni_id: alumni_id_verification,
    $project_materials: project_materials,
    $status: "pending",
    $created_at: now,
    $updated_at: now
  });

  res.json({ ok: true, message: "Project submitted for review" });
});

// Get projects (with sorting and filtering)
router.get("/", (req, res) => {
  const schema = z.object({
    status: z.string().optional(),
    funding_stage: z.string().optional(),
    sort_by: z.enum(["created_at", "funding_stage"]).default("created_at"),
    order: z.enum(["asc", "desc"]).default("desc"),
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional(),
    radius_km: z.coerce.number().default(5),
    search: z.string().optional()
  });

  const parsed = schema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "invalid_query" });

  const { status, funding_stage, sort_by, order, lat, lng, radius_km, search } = parsed.data;

  let sql = `
    SELECT p.*, u.name as user_name
    FROM projects p
    JOIN users u ON p.user_id = u.id
    WHERE 1=1
  `;
  const params = {};

  if (status) {
    sql += ` AND p.status = $status`;
    params.$status = status;
  }

  if (funding_stage) {
    sql += ` AND p.funding_stage = $funding_stage`;
    params.$funding_stage = funding_stage;
  }

  if (search) {
    sql += ` AND (p.name LIKE $search OR p.description LIKE $search)`;
    params.$search = `%${search}%`;
  }

  const rows = all(sql, params);

  // Filter by distance if lat/lng provided
  let results = rows;
  if (lat !== undefined && lng !== undefined) {
    results = rows.map(r => {
      const dist = haversineKm(lat, lng, r.lat, r.lng);
      return { ...r, distance_km: dist };
    }).filter(r => r.distance_km <= radius_km);
  }

  // Sort results
  results.sort((a, b) => {
    if (sort_by === "created_at") {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return order === "asc" ? dateA - dateB : dateB - dateA;
    } else if (sort_by === "funding_stage") {
      const stageOrder = { "seed": 1, "angel": 2, "series-a": 3, "series-b": 4, "series-c": 5, "pre-ipo": 6 };
      const orderA = stageOrder[a.funding_stage] || 0;
      const orderB = stageOrder[b.funding_stage] || 0;
      return order === "asc" ? orderA - orderB : orderB - orderA;
    }
    return 0;
  });

  res.json({ total: results.length, items: results });
});

// Get project by ID
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const row = get(`
    SELECT p.*, u.name as user_name
    FROM projects p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = $id
  `, { $id: id });
  
  if (!row) return res.status(404).json({ error: "not_found" });
  
  res.json(row);
});

export default router;