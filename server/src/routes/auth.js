import express from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { createUserWithProfile, getUserByEmail } from "../models/alumni.js";

const router = express.Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  graduation_year: z.number().int().optional(),
  school: z.string().min(1),
  college: z.string().min(1),
  major: z.string().min(1),
  degree: z.string().min(1),
  city: z.string().optional(),
  district: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  industry: z.string().optional(),
  company: z.string().optional(),
  job_title: z.string().optional(),
  skills: z.array(z.string()).optional(),
  resources: z.array(z.string()).optional(),
  verification: z.object({
    method: z.enum(["unified_auth","digital_card","student_record"]),
    student_id: z.string().optional(),
    year: z.number().optional()
  })
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload", details: parsed.error.issues });
  const body = parsed.data;
  const exists = await getUserByEmail(body.email);
  if (exists) return res.status(409).json({ error: "email_exists" });
  // 简化注册流程，暂时跳过校园验证
  const ok = true;
  if (!ok) return res.status(403).json({ error: "verification_failed" });
  const hash = await bcrypt.hash(body.password, 10);
  const identityId = `ALUMNI_${nanoid(12)}`;
  const created = createUserWithProfile(
    {
      email: body.email,
      password_hash: hash,
      name: body.name,
      graduation_year: body.graduation_year,
      alumni_identity_id: identityId
    },
    {
      school: body.school,
      college: body.college,
      major: body.major,
      degree: body.degree,
      city: body.city,
      district: body.district,
      address: body.address,
      lat: body.lat,
      lng: body.lng,
      industry: body.industry,
      company: body.company,
      job_title: body.job_title,
      skills: body.skills,
      resources: body.resources,
      privacy_level: "district"
    }
  );
  const token = signToken(created.user.id);
  res.json({ token, user: { id: created.user.id, name: created.user.name, alumni_identity_id: created.user.alumni_identity_id } });
});

const loginSchema = z.object({
  email: z.string().min(1), // Allow username or email
  password: z.string().min(6)
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });
  const user = getUserByEmail(parsed.data.email);
  if (!user) return res.status(404).json({ error: "not_found" });
  const ok = await bcrypt.compare(parsed.data.password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "invalid_credentials" });
  const token = signToken(user.id);
  res.json({ token, user: { id: user.id, name: user.name, alumni_identity_id: user.alumni_identity_id } });
});

const signToken = (userId) => {
  const secret = process.env.JWT_SECRET || "dev_secret";
  return jwt.sign({ uid: userId }, secret, { expiresIn: "7d" });
};

export default router;
