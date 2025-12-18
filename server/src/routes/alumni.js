import express from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { getAlumniList, getAlumniNearby, getAlumniDetail, updatePrivacyLevel, getAlumniGroupedByIndustry, searchAlumniByLocation, getUserById, updateUserAndProfile } from "../models/alumni.js";

const router = express.Router();

// Apply auth middleware to all routes in this file
router.use(authMiddleware);

router.get("/me", (req, res) => {
  const data = getUserById(req.userId);
  if (!data) return res.status(404).json({ error: "not_found" });
  
  // Return full details for the logged-in user
  res.json({
    id: data.user.id,
    name: data.user.name,
    alumni_identity_id: data.user.alumni_identity_id,
    graduation_year: data.user.graduation_year,
    school: data.profile.school,
    college: data.profile.college,
    major: data.profile.major,
    degree: data.profile.degree,
    company: data.profile.company,
    job_title: data.profile.job_title,
    industry: data.profile.industry,
    industry_segment: data.profile.industry_segment,
    is_startup: !!data.profile.is_startup,
    business_domain: data.profile.business_domain,
    funding_stage: data.profile.funding_stage,
    contact_name: data.profile.contact_name,
    contact_phone: data.profile.contact_phone,
    contact_email: data.profile.contact_email,
    country: data.profile.country,
    address_en: data.profile.address_en,
    skills: data.profile.skills ? JSON.parse(data.profile.skills) : [],
    resources: data.profile.resources ? JSON.parse(data.profile.resources) : [],
    city: data.profile.city,
    district: data.profile.district,
    address: data.profile.address,
    lat: data.profile.lat,
    lng: data.profile.lng,
    privacy_level: data.profile.privacy_level
  });
});

router.put("/me", (req, res) => {
  const schema = z.object({
    user: z.object({
      name: z.string().optional(),
      graduation_year: z.coerce.number().optional()
    }).optional(),
    profile: z.object({
      school: z.string().optional(),
      college: z.string().optional(),
      major: z.string().optional(),
      degree: z.string().optional(),
      city: z.string().optional(),
      district: z.string().optional(),
      address: z.string().optional(),
      address_en: z.string().optional(),
      country: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
      privacy_level: z.enum(["city","district","address","friends","hidden"]).optional(),
      job_title: z.string().optional(),
      company: z.string().optional(),
      industry: z.string().optional(),
      industry_segment: z.string().optional(),
      is_startup: z.boolean().optional(),
      business_domain: z.string().optional(),
      funding_stage: z.string().optional(),
      contact_name: z.string().optional(),
      contact_phone: z.string().optional(),
      contact_email: z.string().optional(),
      skills: z.array(z.string()).optional(),
      resources: z.array(z.string()).optional()
    }).optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload", details: parsed.error.issues });
  
  const updated = updateUserAndProfile(req.userId, parsed.data);
  if (!updated) return res.status(500).json({ error: "update_failed" });
  
  res.json({ ok: true });
});

router.get("/", (req, res) => {
  const schema = z.object({
    school: z.string().optional(),
    college: z.string().optional(),
    major: z.string().optional(),
    degree: z.string().optional(),
    graduation_year: z.string().optional(),
    industry: z.string().optional(),
    industry_segment: z.string().optional(),
    is_startup: z.enum(["0","1"]).optional(),
    funding_stage: z.string().optional(),
    business_domain: z.string().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    country: z.string().optional(),
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional(),
    radius_km: z.coerce.number().optional(),
    keyword: z.string().optional()
  });
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "invalid_query" });
  const q = { ...parsed.data };
  if (q.is_startup != null) q.is_startup = q.is_startup === "1";
  const rows = getAlumniList(q);
  res.json({ total: rows.length, items: rows });
});

router.get("/nearby", (req, res) => {
  const schema = z.object({
    lat: z.coerce.number(),
    lng: z.coerce.number(),
    radius_km: z.coerce.number().default(5)
  });
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "invalid_query" });
  const rows = getAlumniNearby(parsed.data.lat, parsed.data.lng, parsed.data.radius_km);
  res.json({ total: rows.length, items: rows });
});

router.get("/grouped", (req, res) => {
  const schema = z.object({
    school: z.string().optional(),
    college: z.string().optional(),
    major: z.string().optional(),
    degree: z.string().optional(),
    graduation_year: z.string().optional(),
    industry: z.string().optional(),
    industry_segment: z.string().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    country: z.string().optional(),
    is_startup: z.enum(["0","1"]).optional(),
    group_radius_km: z.coerce.number().default(100)
  });
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "invalid_query" });
  const q = { ...parsed.data };
  if (q.is_startup != null) q.is_startup = q.is_startup === "1";
  const rows = getAlumniGroupedByIndustry(q);
  res.json({ total: rows.length, items: rows });
});

// Startups listing with filters
router.get("/startups", (req, res) => {
  const schema = z.object({
    funding_stage: z.string().optional(),
    business_domain: z.string().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional(),
    radius_km: z.coerce.number().optional()
  });
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "invalid_query" });
  const rows = getAlumniList({ ...parsed.data, is_startup: true });
  res.json({ total: rows.length, items: rows });
});

// Overseas aggregation country -> city
router.get("/overseas", (req, res) => {
  const schema = z.object({
    country: z.string().optional()
  });
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "invalid_query" });
  const rows = getAlumniList({ country: parsed.data.country });
  const groups = {};
  for (const r of rows) {
    const c = r.country || "未知";
    const city = r.city || "未知";
    groups[c] = groups[c] || {};
    groups[c][city] = groups[c][city] || [];
    groups[c][city].push(r);
  }
  res.json({ groups });
});

router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "invalid_id" });
  const detail = getAlumniDetail(id);
  if (!detail) return res.status(404).json({ error: "not_found" });
  res.json(detail);
});

router.put("/:id/privacy", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "invalid_id" });
  if (req.userId !== id) return res.status(403).json({ error: "forbidden" });
  const schema = z.object({ privacy_level: z.enum(["city","district","address","friends","hidden"]) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });
  const ok = updatePrivacyLevel(id, parsed.data.privacy_level);
  if (!ok) return res.status(404).json({ error: "not_found" });
  // Note: Original code had a bug here returning 'rows' which is undefined in this scope. 
  // But I am just removing middleware. I should fix the bug if I see it.
  // The original code: res.json({ total: rows.length, items: rows });
  // 'rows' is not defined in this handler.
  // I will fix it to return success.
  res.json({ ok: true });
});

// Live location update and query (requires auth)
router.post("/live/location", (req, res) => {
  const schema = z.object({
    lat: z.coerce.number(),
    lng: z.coerce.number(),
    campus: z.string().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });
  const now = new Date().toISOString();
  const { lat, lng, campus } = parsed.data;
  // upsert into live_locations
  const upsertSql = `
    INSERT INTO live_locations (user_id, lat, lng, campus, updated_at)
    VALUES ($uid, $lat, $lng, $campus, $updated_at)
    ON CONFLICT(user_id) DO UPDATE SET lat = $lat, lng = $lng, campus = $campus, updated_at = $updated_at
  `;
  const { run } = require("../db.js");
  run(upsertSql, { $uid: req.userId, $lat: lat, $lng: lng, $campus: campus || null, $updated_at: now });
  res.json({ ok: true });
});

router.get("/live/locations", (req, res) => {
  const { all } = require("../db.js");
  const rows = all(`
    SELECT ll.user_id, ll.lat, ll.lng, ll.campus, ll.updated_at, u.name
    FROM live_locations ll JOIN users u ON ll.user_id = u.id
  `);
  res.json({ total: rows.length, items: rows });
});

router.get("/live/search", (req, res) => {
  const schema = z.object({ name: z.string() });
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "invalid_query" });
  const { all } = require("../db.js");
  const rows = all(`
    SELECT ll.user_id, ll.lat, ll.lng, ll.campus, ll.updated_at, u.name
    FROM live_locations ll JOIN users u ON ll.user_id = u.id
    WHERE u.name LIKE $kw
  `, { $kw: `%${parsed.data.name}%` });
  res.json({ total: rows.length, items: rows });
});

// Fuzzy location search endpoint
router.get("/search/location", (req, res) => {
  const schema = z.object({
    location: z.string().min(1),
    college: z.string().optional(),
    major: z.string().optional(),
    graduation_year: z.string().optional(),
    industry: z.string().optional(),
    industry_segment: z.string().optional()
  });
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "invalid_query" });
  
  const { location, ...additionalFilters } = parsed.data;
  
  // First get alumni by fuzzy location search
  let results = searchAlumniByLocation(location);
  
  // Apply additional filters if provided
  if (Object.keys(additionalFilters).length > 0) {
    results = results.filter(alumni => {
      return Object.entries(additionalFilters).every(([key, value]) => {
        if (!value) return true;
        return String(alumni[key]).toLowerCase().includes(value.toLowerCase());
      });
    });
  }
  
  res.json({ total: results.length, items: results });
});

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

export default router;
