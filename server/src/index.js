import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { initDb } from "./db.js";
import authRouter from "./routes/auth.js";
import alumniRouter from "./routes/alumni.js";
import eventRouter from "./routes/event.js";
import resourceRouter from "./routes/resources.js";
import welfareRouter from "./routes/welfare.js";
import projectsRouter from "./routes/projects.js";
import { seedIfEmpty } from "./seed.js";

const app = express();
app.use(cors());
app.use(express.json());

await initDb();
await seedIfEmpty();

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRouter);
app.use("/alumni", alumniRouter);
app.use("/events", eventRouter);
app.use("/resources", resourceRouter);
app.use("/welfare", welfareRouter);
app.use("/projects", projectsRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
console.log(`Server starting on port ${port}...`);
