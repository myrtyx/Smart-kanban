import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const app = express();
const PORT = Number(process.env.PORT || 3001);
const LOGIN_USERNAME = process.env.KANBAN_USERNAME || "polina";
const LOGIN_PASSWORD = process.env.KANBAN_PASSWORD || "Polina2004";
const LOGIN_PASSWORD_HASH = crypto
  .createHash("sha256")
  .update(LOGIN_PASSWORD)
  .digest("hex");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, "db.json");

app.use(cors({ origin: true }));
app.use(express.json({ limit: "50kb" }));

const createId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const ensureDbFile = () => {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(
      DB_PATH,
      JSON.stringify(
        { projects: [], tasks: [], auth: { username: LOGIN_USERNAME } },
        null,
        2
      )
    );
  }
};

const readDb = () => {
  ensureDbFile();
  const raw = fs.readFileSync(DB_PATH, "utf8");
  if (!raw || !raw.trim()) {
    return { projects: [], tasks: [], auth: { username: LOGIN_USERNAME } };
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    const fallback = {
      projects: [],
      tasks: [],
      auth: { username: LOGIN_USERNAME },
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(fallback, null, 2));
    return fallback;
  }
};

const writeDb = (db) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
};

const normalizeProjects = (projects) => {
  if (!projects || projects.length === 0) {
    return [
      {
        id: createId(),
        name: "Default Project",
        color: "#6366f1",
        isDefault: true,
      },
    ];
  }
  const hasDefault = projects.some((project) => project.isDefault);
  if (hasDefault) {
    return projects.map((project) => ({
      ...project,
      isDefault: Boolean(project.isDefault),
    }));
  }
  const fallbackIndex = projects.findIndex(
    (project) => project.name?.toLowerCase() === "default project"
  );
  const defaultIndex = fallbackIndex >= 0 ? fallbackIndex : 0;
  return projects.map((project, index) => ({
    ...project,
    isDefault: index === defaultIndex,
  }));
};

const seedIfEmpty = () => {
  const db = readDb();
  if (!db.auth) {
    db.auth = { username: LOGIN_USERNAME };
  }
  if (db.auth.username !== LOGIN_USERNAME) {
    db.auth.username = LOGIN_USERNAME;
  }
  if (!db.auth.passwordHash) {
    db.auth.passwordHash = LOGIN_PASSWORD_HASH;
  }
  if (!db.auth.token) {
    db.auth.token = "";
  }

  if (db.projects?.length) {
    const normalized = normalizeProjects(db.projects);
    if (JSON.stringify(normalized) !== JSON.stringify(db.projects)) {
      db.projects = normalized;
    }
    writeDb(db);
    return;
  }

  const projects = normalizeProjects([]);
  const defaultProjectId = projects[0].id;
  const tasks = [
    {
      id: createId(),
      title: "Welcome to Smart Kanban",
      description: "Drag this task to another column.",
      status: "todo",
      priority: "medium",
      projectId: defaultProjectId,
    },
    {
      id: createId(),
      title: "Design landing page",
      description: "Create hero section and CTA blocks.",
      status: "in-progress",
      priority: "high",
      projectId: defaultProjectId,
    },
    {
      id: createId(),
      title: "Release checklist",
      description: "Verify QA, analytics, and copy.",
      status: "checking",
      priority: "none",
      projectId: defaultProjectId,
    },
  ];
  writeDb({ projects, tasks, auth: db.auth });
};

seedIfEmpty();

const requireAuth = (req, res, next) => {
  if (req.path === "/login") {
    return next();
  }
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : req.headers["x-api-token"];
  const db = readDb();
  if (!token || token !== db.auth?.token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return next();
};

app.use(requireAuth);

app.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }
  const passwordHash = crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");
  if (username !== LOGIN_USERNAME || passwordHash !== LOGIN_PASSWORD_HASH) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const db = readDb();
  const token = crypto.randomBytes(24).toString("hex");
  db.auth = {
    username: LOGIN_USERNAME,
    passwordHash: LOGIN_PASSWORD_HASH,
    token,
  };
  writeDb(db);
  return res.json({ token });
});

app.get("/projects", (req, res) => {
  const db = readDb();
  db.projects = normalizeProjects(db.projects);
  writeDb(db);
  res.json(db.projects);
});

app.post("/projects", (req, res) => {
  const { name, color } = req.body || {};
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Project name is required" });
  }
  const db = readDb();
  const project = {
    id: createId(),
    name: name.trim(),
    color: color || "#6366f1",
    isDefault: false,
  };
  db.projects = normalizeProjects(db.projects);
  db.projects.push(project);
  writeDb(db);
  res.status(201).json(project);
});

app.put("/projects/:id", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  db.projects = normalizeProjects(db.projects);
  const projectIndex = db.projects.findIndex((project) => project.id === id);
  if (projectIndex === -1) {
    return res.status(404).json({ error: "Project not found" });
  }

  const current = db.projects[projectIndex];
  const updated = {
    ...current,
    ...req.body,
    id: current.id,
    isDefault: current.isDefault,
  };

  if (!updated.name || typeof updated.name !== "string") {
    return res.status(400).json({ error: "Project name is required" });
  }

  db.projects[projectIndex] = updated;
  writeDb(db);
  res.json(updated);
});

app.delete("/projects/:id", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  db.projects = normalizeProjects(db.projects);
  const target = db.projects.find((project) => project.id === id);
  if (!target) {
    return res.status(404).json({ error: "Project not found" });
  }
  if (target.isDefault) {
    return res.status(400).json({ error: "Default Project cannot be deleted" });
  }
  db.projects = db.projects.filter((project) => project.id !== id);
  db.tasks = (db.tasks || []).filter((task) => task.projectId !== id);
  writeDb(db);
  res.status(204).send();
});

app.get("/tasks", (req, res) => {
  const db = readDb();
  res.json(db.tasks || []);
});

app.post("/tasks", (req, res) => {
  const {
    title,
    description = "",
    status = "todo",
    priority = "none",
    projectId,
  } = req.body || {};

  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "Task title is required" });
  }
  if (!projectId) {
    return res.status(400).json({ error: "projectId is required" });
  }

  const db = readDb();
  const projectExists = db.projects?.some((project) => project.id === projectId);
  if (!projectExists) {
    return res.status(400).json({ error: "projectId not found" });
  }

  const task = {
    id: createId(),
    title: title.trim(),
    description: description?.trim?.() ?? "",
    status,
    priority,
    projectId,
  };
  db.tasks = db.tasks || [];
  db.tasks.push(task);
  writeDb(db);
  res.status(201).json(task);
});

app.put("/tasks/:id", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const taskIndex = (db.tasks || []).findIndex((task) => task.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: "Task not found" });
  }
  const current = db.tasks[taskIndex];
  const updated = {
    ...current,
    ...req.body,
    id: current.id,
  };

  if (updated.projectId) {
    const projectExists = db.projects?.some(
      (project) => project.id === updated.projectId
    );
    if (!projectExists) {
      return res.status(400).json({ error: "projectId not found" });
    }
  }

  db.tasks[taskIndex] = updated;
  writeDb(db);
  res.json(updated);
});

app.delete("/tasks/:id", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const exists = (db.tasks || []).some((task) => task.id === id);
  if (!exists) {
    return res.status(404).json({ error: "Task not found" });
  }
  db.tasks = db.tasks.filter((task) => task.id !== id);
  writeDb(db);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Kanban API running on http://localhost:${PORT}`);
});
