import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";

const app = express();
const PORT = Number(process.env.PORT || 3001);
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_TOKEN_TTL_MS = Number(
  process.env.REFRESH_TOKEN_TTL_MS || 1000 * 60 * 60 * 24 * 30
);
const IS_PROD = process.env.NODE_ENV === "production";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DB_PATH = path.join(__dirname, "data.json");
const AUTH_DB_PATH = path.join(__dirname, "auth.json");
const DIST_PATH = path.join(__dirname, "dist");

const corsOptions = {
  origin: true,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "50kb" }));
app.use(cookieParser());

if (JWT_SECRET === "dev-secret") {
  console.warn(
    "WARNING: JWT_SECRET is not set. Using insecure default. Set JWT_SECRET in .env"
  );
}

const createId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const ensureDbFile = (dbPath, fallback) => {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(fallback, null, 2));
  }
};

const readDb = (dbPath, fallback) => {
  ensureDbFile(dbPath, fallback);
  const raw = fs.readFileSync(dbPath, "utf8");
  if (!raw || !raw.trim()) {
    return { ...fallback };
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    fs.writeFileSync(dbPath, JSON.stringify(fallback, null, 2));
    return { ...fallback };
  }
};

const writeDb = (dbPath, data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

const readDataDb = () =>
  readDb(DATA_DB_PATH, { projects: [], tasks: [] });
const writeDataDb = (db) => writeDb(DATA_DB_PATH, db);

const readAuthDb = () =>
  readDb(AUTH_DB_PATH, { users: [], refreshTokens: [] });
const writeAuthDb = (db) => writeDb(AUTH_DB_PATH, db);

const ensureDefaultProject = (db, userId) => {
  db.projects = db.projects || [];
  db.tasks = db.tasks || [];

  const userProjects = db.projects.filter((project) => project.userId === userId);
  if (userProjects.length === 0) {
    const project = {
      id: createId(),
      name: "Default Project",
      color: "#6366f1",
      isDefault: true,
      userId,
    };
    db.projects.push(project);
    db.tasks.push({
      id: createId(),
      title: "Welcome to Smart Kanban",
      description: "Drag this task to another column.",
      status: "todo",
      priority: "medium",
      projectId: project.id,
      userId,
    });
    return project;
  }

  const hasDefault = userProjects.some((project) => project.isDefault);
  if (!hasDefault) {
    const [first] = userProjects;
    const index = db.projects.findIndex((project) => project.id === first.id);
    if (index >= 0) {
      db.projects[index] = { ...db.projects[index], isDefault: true };
    }
  }

  return userProjects.find((project) => project.isDefault) || userProjects[0];
};

const signAccessToken = (user) =>
  jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });

const createRefreshToken = (userId) => {
  const token = createId() + createId();
  const expiresAt = Date.now() + REFRESH_TOKEN_TTL_MS;
  return { token, userId, expiresAt };
};

const setRefreshCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PROD,
    maxAge: REFRESH_TOKEN_TTL_MS,
    path: "/",
  });
};

const clearRefreshCookie = (res) => {
  res.cookie("refreshToken", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PROD,
    maxAge: 0,
    path: "/",
  });
};

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/auth/register", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email is required" });
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });
  }

  const authDb = readAuthDb();
  const exists = authDb.users.some(
    (user) => user.email.toLowerCase() === email.toLowerCase()
  );
  if (exists) {
    return res.status(409).json({ error: "Email already in use" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: createId(),
    email: email.trim().toLowerCase(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  authDb.users.push(user);

  const refreshToken = createRefreshToken(user.id);
  authDb.refreshTokens.push(refreshToken);
  writeAuthDb(authDb);

  const dataDb = readDataDb();
  ensureDefaultProject(dataDb, user.id);
  writeDataDb(dataDb);

  const accessToken = signAccessToken(user);
  setRefreshCookie(res, refreshToken.token);

  res.status(201).json({
    user: { id: user.id, email: user.email },
    accessToken,
  });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const authDb = readAuthDb();
  const user = authDb.users.find(
    (item) => item.email.toLowerCase() === email.toLowerCase()
  );
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const refreshToken = createRefreshToken(user.id);
  authDb.refreshTokens.push(refreshToken);
  writeAuthDb(authDb);

  const accessToken = signAccessToken(user);
  setRefreshCookie(res, refreshToken.token);

  res.json({
    user: { id: user.id, email: user.email },
    accessToken,
  });
});

app.post("/auth/refresh", (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    return res.status(401).json({ error: "Missing refresh token" });
  }

  const authDb = readAuthDb();
  const stored = authDb.refreshTokens.find((item) => item.token === token);
  if (!stored || stored.expiresAt < Date.now()) {
    authDb.refreshTokens = authDb.refreshTokens.filter(
      (item) => item.token !== token
    );
    writeAuthDb(authDb);
    clearRefreshCookie(res);
    return res.status(401).json({ error: "Invalid refresh token" });
  }

  const user = authDb.users.find((item) => item.id === stored.userId);
  if (!user) {
    authDb.refreshTokens = authDb.refreshTokens.filter(
      (item) => item.token !== token
    );
    writeAuthDb(authDb);
    clearRefreshCookie(res);
    return res.status(401).json({ error: "Invalid refresh token" });
  }

  authDb.refreshTokens = authDb.refreshTokens.filter(
    (item) => item.token !== token
  );
  const newRefreshToken = createRefreshToken(user.id);
  authDb.refreshTokens.push(newRefreshToken);
  writeAuthDb(authDb);

  const accessToken = signAccessToken(user);
  setRefreshCookie(res, newRefreshToken.token);

  res.json({
    user: { id: user.id, email: user.email },
    accessToken,
  });
});

app.post("/auth/logout", (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    const authDb = readAuthDb();
    authDb.refreshTokens = authDb.refreshTokens.filter(
      (item) => item.token !== token
    );
    writeAuthDb(authDb);
  }
  clearRefreshCookie(res);
  res.status(204).send();
});

app.get("/auth/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.get("/projects", requireAuth, (req, res) => {
  const db = readDataDb();
  ensureDefaultProject(db, req.user.id);
  writeDataDb(db);
  const projects = (db.projects || []).filter(
    (project) => project.userId === req.user.id
  );
  res.json(projects);
});

app.post("/projects", requireAuth, (req, res) => {
  const { name, color } = req.body || {};
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Project name is required" });
  }
  const db = readDataDb();
  const project = {
    id: createId(),
    name: name.trim(),
    color: color || "#6366f1",
    isDefault: false,
    userId: req.user.id,
  };
  db.projects = db.projects || [];
  db.projects.push(project);
  writeDataDb(db);
  res.status(201).json(project);
});

app.put("/projects/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const db = readDataDb();
  db.projects = db.projects || [];
  const projectIndex = db.projects.findIndex(
    (project) => project.id === id && project.userId === req.user.id
  );
  if (projectIndex === -1) {
    return res.status(404).json({ error: "Project not found" });
  }

  const current = db.projects[projectIndex];
  const updated = {
    ...current,
    ...req.body,
    id: current.id,
    isDefault: current.isDefault,
    userId: current.userId,
  };

  if (!updated.name || typeof updated.name !== "string") {
    return res.status(400).json({ error: "Project name is required" });
  }

  db.projects[projectIndex] = updated;
  writeDataDb(db);
  res.json(updated);
});

app.delete("/projects/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const db = readDataDb();
  db.projects = db.projects || [];
  db.tasks = db.tasks || [];
  const target = db.projects.find(
    (project) => project.id === id && project.userId === req.user.id
  );
  if (!target) {
    return res.status(404).json({ error: "Project not found" });
  }
  if (target.isDefault) {
    return res.status(400).json({ error: "Default Project cannot be deleted" });
  }
  db.projects = db.projects.filter((project) => project.id !== id);
  db.tasks = db.tasks.filter(
    (task) => task.projectId !== id || task.userId !== req.user.id
  );
  writeDataDb(db);
  res.status(204).send();
});

app.get("/tasks", requireAuth, (req, res) => {
  const db = readDataDb();
  const tasks = (db.tasks || []).filter((task) => task.userId === req.user.id);
  res.json(tasks);
});

app.post("/tasks", requireAuth, (req, res) => {
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

  const db = readDataDb();
  const projectExists = db.projects?.some(
    (project) => project.id === projectId && project.userId === req.user.id
  );
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
    userId: req.user.id,
  };
  db.tasks = db.tasks || [];
  db.tasks.push(task);
  writeDataDb(db);
  res.status(201).json(task);
});

app.put("/tasks/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const db = readDataDb();
  const taskIndex = (db.tasks || []).findIndex(
    (task) => task.id === id && task.userId === req.user.id
  );
  if (taskIndex === -1) {
    return res.status(404).json({ error: "Task not found" });
  }
  const current = db.tasks[taskIndex];
  const updated = {
    ...current,
    ...req.body,
    id: current.id,
    userId: current.userId,
  };

  if (updated.projectId) {
    const projectExists = db.projects?.some(
      (project) => project.id === updated.projectId && project.userId === req.user.id
    );
    if (!projectExists) {
      return res.status(400).json({ error: "projectId not found" });
    }
  }

  db.tasks[taskIndex] = updated;
  writeDataDb(db);
  res.json(updated);
});

app.delete("/tasks/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const db = readDataDb();
  const exists = (db.tasks || []).some(
    (task) => task.id === id && task.userId === req.user.id
  );
  if (!exists) {
    return res.status(404).json({ error: "Task not found" });
  }
  db.tasks = db.tasks.filter(
    (task) => !(task.id === id && task.userId === req.user.id)
  );
  writeDataDb(db);
  res.status(204).send();
});

if (fs.existsSync(DIST_PATH)) {
  app.use(express.static(DIST_PATH));
  app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(DIST_PATH, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Kanban API running on http://localhost:${PORT}`);
});
