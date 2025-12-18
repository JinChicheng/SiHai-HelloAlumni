import express from "express";
import { getAllEvents, getEventById, createEvent, deleteEvent } from "../models/event.js";

const router = express.Router();

router.get("/", (req, res) => {
  const events = getAllEvents();
  res.json(events);
});

router.get("/:id", (req, res) => {
  const event = getEventById(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  res.json(event);
});

// Create event endpoint
router.post("/", (req, res) => {
  try {
    const event = createEvent(req.body);
    res.json(event);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete event endpoint
router.delete("/:id", (req, res) => {
  try {
    const event = deleteEvent(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
