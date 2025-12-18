import express from "express";
import {
  createWelfareProject,
  getAllWelfareProjects,
  getWelfareProjectById,
  deleteWelfareProject,
  createWelfareTeam,
  getAllWelfareTeams,
  getWelfareTeamsByProjectId,
  getWelfareTeamById,
  joinWelfareTeam,
  getWelfareTeamMembers,
  createWelfareFootprint,
  getWelfareFootprintsByUserId,
  getWelfareFootprintsByProjectId
} from "../models/welfare.js";

const router = express.Router();

// 公益项目管理
router.get("/projects", (req, res) => {
  const projects = getAllWelfareProjects();
  res.json(projects);
});

router.get("/projects/:id", (req, res) => {
  const project = getWelfareProjectById(req.params.id);
  if (!project) return res.status(404).json({ error: "Welfare project not found" });
  res.json(project);
});

router.post("/projects", (req, res) => {
  try {
    const project = createWelfareProject(req.body);
    res.json(project);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/projects/:id", (req, res) => {
  try {
    const project = deleteWelfareProject(req.params.id);
    if (!project) return res.status(404).json({ error: "Welfare project not found" });
    res.json(project);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 公益团队管理
router.get("/teams", (req, res) => {
  const teams = getAllWelfareTeams();
  res.json(teams);
});

router.get("/projects/:projectId/teams", (req, res) => {
  const teams = getWelfareTeamsByProjectId(req.params.projectId);
  res.json(teams);
});

router.get("/teams/:id", (req, res) => {
  const team = getWelfareTeamById(req.params.id);
  if (!team) return res.status(404).json({ error: "Welfare team not found" });
  res.json(team);
});

router.post("/teams", (req, res) => {
  try {
    const team = createWelfareTeam(req.body);
    res.json(team);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 团队成员管理
router.post("/teams/:teamId/join", (req, res) => {
  try {
    const { userId } = req.body;
    const member = joinWelfareTeam(req.params.teamId, userId);
    res.json(member);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/teams/:teamId/members", (req, res) => {
  try {
    const members = getWelfareTeamMembers(req.params.teamId);
    res.json(members);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 公益足迹管理
router.post("/footprints", (req, res) => {
  try {
    const footprint = createWelfareFootprint(req.body);
    res.json(footprint);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/users/:userId/footprints", (req, res) => {
  try {
    const footprints = getWelfareFootprintsByUserId(req.params.userId);
    res.json(footprints);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/projects/:projectId/footprints", (req, res) => {
  try {
    const footprints = getWelfareFootprintsByProjectId(req.params.projectId);
    res.json(footprints);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
