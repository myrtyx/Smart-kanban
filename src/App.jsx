import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { ChevronDown, LogOut } from "lucide-react";
import Sidebar from "./components/Sidebar";
import KanbanBoard from "./components/KanbanBoard";
import Modal from "./components/Modal";
import TaskCard from "./components/TaskCard";
import { useKanbanApi } from "./hooks/useKanbanApi";

const STATUSES = [
  { id: "todo", label: "To Do", short: "Todo" },
  { id: "in-progress", label: "In Progress", short: "Doing" },
  { id: "checking", label: "Checking", short: "Review" },
  { id: "completed", label: "Completed", short: "Done" },
];

const COLOR_PALETTE = [
  "#6366f1",
  "#22c55e",
  "#f97316",
  "#ec4899",
  "#06b6d4",
  "#f59e0b",
  "#14b8a6",
  "#8b5cf6",
];

const App = () => {
  const {
    token,
    hasUser,
    projects,
    tasks,
    loading,
    error,
    login,
    signup,
    logout,
    createProject,
    updateProject,
    deleteProject,
    createTask,
    updateTask,
    deleteTask,
  } = useKanbanApi();
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isEditProjectsOpen, setIsEditProjectsOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [createTaskStatus, setCreateTaskStatus] = useState("todo");
  const [createTaskProjectId, setCreateTaskProjectId] = useState(null);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [deleteTaskId, setDeleteTaskId] = useState(null);
  const [deleteProjectId, setDeleteProjectId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 3 },
    })
  );

  useEffect(() => {
    if (selectedProjectId === "all") return;
    const exists = projects.some((project) => project.id === selectedProjectId);
    if (!exists) {
      const fallback = projects.find((project) => project.isDefault)?.id || "all";
      setSelectedProjectId(fallback);
    }
  }, [projects, selectedProjectId]);

  const filteredTasks = useMemo(() => {
    if (selectedProjectId === "all") {
      return tasks;
    }
    return tasks.filter((task) => task.projectId === selectedProjectId);
  }, [tasks, selectedProjectId]);

  const tasksByStatus = useMemo(() => {
    return STATUSES.reduce((acc, status) => {
      acc[status.id] = filteredTasks.filter((task) => task.status === status.id);
      return acc;
    }, {});
  }, [filteredTasks]);

  const handleDragStart = ({ active }) => {
    setActiveTaskId(active.id);
  };

  const handleDragEnd = async ({ active, over }) => {
    if (!over) {
      setActiveTaskId(null);
      return;
    }
    const status = over.id;
    if (!STATUSES.find((item) => item.id === status)) {
      setActiveTaskId(null);
      return;
    }
    const current = tasks.find((task) => task.id === active.id);
    if (!current || current.status === status) {
      setActiveTaskId(null);
      return;
    }
    try {
      await updateTask(active.id, { status });
    } catch (err) {
      console.error(err);
    } finally {
      setActiveTaskId(null);
    }
  };

  const handleDragCancel = () => {
    setActiveTaskId(null);
  };

  const handleAddProject = async (data) => {
    try {
      const project = await createProject(data);
      if (project) {
        setSelectedProjectId(project.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTask = async (form) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, form);
      } else {
        await createTask({
          ...form,
          status: form.status ?? createTaskStatus ?? "todo",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTaskModalOpen(false);
      setEditingTask(null);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      await deleteProject(projectId);
      if (selectedProjectId === projectId) {
        const fallback =
          projects.find((project) => project.isDefault)?.id || "all";
        setSelectedProjectId(fallback);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProjects = async (draft) => {
    try {
      await Promise.all(
        draft.map((project) =>
          updateProject(project.id, {
            name: project.name,
            color: project.color,
          })
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsEditProjectsOpen(false);
    }
  };

  const activeTask = tasks.find((task) => task.id === activeTaskId);
  const activeProject = projects.find(
    (project) => project.id === activeTask?.projectId
  );

  if (!token) {
    return (
      <LoginScreen
        onLogin={login}
        onSignup={signup}
        hasUser={hasUser}
        error={error}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[320px_1fr]">
        <Sidebar
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          onAddProject={() => setIsProjectModalOpen(true)}
          onEditProjects={() => setIsEditProjectsOpen(true)}
          tasksCount={tasks.length}
        />

        <main className="flex h-full flex-col px-6 pb-6 pt-10">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">
              Loading board...
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
              >
                <KanbanBoard
                  statuses={STATUSES}
                  tasksByStatus={tasksByStatus}
                  projects={projects}
                  headerAction={
                    <button
                      type="button"
                      onClick={logout}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                    >
                      <LogOut size={14} /> Logout
                    </button>
                  }
                  onAddTask={(statusId) => {
                    setCreateTaskStatus(statusId ?? "todo");
                    setCreateTaskProjectId(
                      selectedProjectId === "all" ? null : selectedProjectId
                    );
                    setEditingTask(null);
                    setIsTaskModalOpen(true);
                  }}
                  onEditTask={handleEditTask}
                  onDeleteTask={(taskId) => setDeleteTaskId(taskId)}
                />
                <DragOverlay adjustScale={false} dropAnimation={null}>
                  {activeTask ? (
                    <div className="w-[320px] max-w-[85vw]">
                      <TaskCard
                        task={activeTask}
                        project={activeProject}
                        isOverlay
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </>
          )}
        </main>
      </div>

      {isProjectModalOpen && (
        <ProjectModal
          onClose={() => setIsProjectModalOpen(false)}
          onSubmit={async (data) => {
            await handleAddProject(data);
            setIsProjectModalOpen(false);
          }}
        />
      )}

      {isEditProjectsOpen && (
        <EditProjectsModal
          projects={projects}
          onClose={() => setIsEditProjectsOpen(false)}
          onSubmit={handleUpdateProjects}
          onRequestDelete={(projectId) => setDeleteProjectId(projectId)}
        />
      )}

      {isTaskModalOpen && (
        <TaskModal
          projects={projects}
          task={editingTask}
          initialProjectId={createTaskProjectId}
          onClose={() => {
            setIsTaskModalOpen(false);
            setEditingTask(null);
          }}
          onSubmit={handleSaveTask}
        />
      )}

      {deleteTaskId && (
        <ConfirmDeleteModal
          onClose={() => setDeleteTaskId(null)}
          onConfirm={async () => {
            await handleDeleteTask(deleteTaskId);
            setDeleteTaskId(null);
          }}
        />
      )}

      {deleteProjectId && (
        <ConfirmDeleteProjectModal
          project={projects.find((project) => project.id === deleteProjectId)}
          onClose={() => setDeleteProjectId(null)}
          onConfirm={async () => {
            await handleDeleteProject(deleteProjectId);
            setDeleteProjectId(null);
          }}
        />
      )}
    </div>
  );
};

const LoginScreen = ({ onLogin, onSignup, hasUser, error }) => {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (hasUser === false) {
      setMode("signup");
    }
  }, [hasUser]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_60%)]" />
      <div className="absolute inset-0 backdrop-blur-2xl bg-slate-900/40" />
      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <form
          className="w-full max-w-md rounded-3xl border border-white/20 bg-white/80 p-8 shadow-card backdrop-blur"
          onSubmit={async (event) => {
            event.preventDefault();
            setLocalError("");
            if (!username.trim() || !password.trim()) {
              setLocalError("Enter username and password.");
              return;
            }
            setSubmitting(true);
            try {
              if (mode === "signup") {
                await onSignup({ username: username.trim(), password: password });
              } else {
                await onLogin({ username: username.trim(), password: password });
              }
            } catch (err) {
              setLocalError(err.message || "Authentication failed");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Secure Access
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            {mode === "signup" ? "Create account" : "Smart Kanban Login"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {mode === "signup"
              ? "Create the single account for this workspace."
              : "Sign in to manage your tasks."}
          </p>

          {(localError || error) && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {localError || error}
            </div>
          )}

          <label className="mt-6 block text-sm font-semibold text-slate-700">
            Username
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-slate-400 focus:outline-none"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Username"
              autoComplete={mode === "signup" ? "new-username" : "username"}
              required
            />
          </label>
          <label className="mt-4 block text-sm font-semibold text-slate-700">
            Password
            <input
              type="password"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-slate-400 focus:outline-none"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting
              ? mode === "signup"
                ? "Creating..."
                : "Signing in..."
              : mode === "signup"
              ? "Create account"
              : "Sign in"}
          </button>
          {hasUser !== false && (
            <button
              type="button"
              onClick={() =>
                setMode((prev) => (prev === "login" ? "signup" : "login"))
              }
              className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:bg-slate-50"
            >
              {mode === "login" ? "Create user" : "Back to login"}
            </button>
          )}
          <p className="mt-4 text-center text-xs text-slate-400">
            Single account access only.
          </p>
        </form>
      </div>
    </div>
  );
};

const ProjectModal = ({ onClose, onSubmit }) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLOR_PALETTE[0]);

  return (
    <Modal title="Add Project" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          onSubmit({ name: name.trim(), color });
        }}
      >
        <label className="block text-sm font-semibold text-slate-700">
          Project name
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-400 focus:outline-none"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Marketing Site"
            required
          />
        </label>
        <div>
          <p className="text-sm font-semibold text-slate-700">Project color</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {COLOR_PALETTE.map((swatch) => (
              <button
                key={swatch}
                type="button"
                onClick={() => setColor(swatch)}
                className={`h-9 w-9 rounded-full border-2 transition ${
                  color === swatch ? "border-slate-900" : "border-transparent"
                }`}
                style={{ backgroundColor: swatch }}
                aria-label={`Select ${swatch}`}
              />
            ))}
          </div>
          <label className="relative mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:border-slate-300">
            <span
              className="h-3 w-3 rounded-full border border-slate-200"
              style={{ backgroundColor: color }}
            />
            Custom color
            <input
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-slate-800"
          >
            Create Project
          </button>
        </div>
      </form>
    </Modal>
  );
};

const EditProjectsModal = ({ projects, onClose, onSubmit, onRequestDelete }) => {
  const [draft, setDraft] = useState(projects);

  useEffect(() => {
    setDraft(projects);
  }, [projects]);

  const updateProjectDraft = (projectId, patch) => {
    setDraft((prev) =>
      prev.map((project) =>
        project.id === projectId ? { ...project, ...patch } : project
      )
    );
  };

  return (
    <Modal title="Edit Projects" onClose={onClose}>
      <div className="space-y-4">
        {draft.map((project) => (
          <div
            key={project.id}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Project name
            </div>
            <div className="mt-2 flex items-center gap-3">
              <input
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 focus:border-slate-400 focus:outline-none"
                value={project.name}
                onChange={(event) =>
                  updateProjectDraft(project.id, { name: event.target.value })
                }
              />
              <button
                type="button"
                onClick={() => onRequestDelete(project.id)}
                disabled={project.isDefault}
                className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Delete
              </button>
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Color
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {COLOR_PALETTE.map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    onClick={() =>
                      updateProjectDraft(project.id, { color: swatch })
                    }
                    className={`h-8 w-8 rounded-full border-2 transition ${
                      project.color === swatch
                        ? "border-slate-900"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: swatch }}
                    aria-label={`Select ${swatch}`}
                  />
                ))}
              </div>
              <label className="relative mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:border-slate-300">
                <span
                  className="h-3 w-3 rounded-full border border-slate-200"
                  style={{ backgroundColor: project.color }}
                />
                Custom color
                <input
                  type="color"
                  value={project.color}
                  onChange={(event) =>
                    updateProjectDraft(project.id, {
                      color: event.target.value,
                    })
                  }
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
            </div>
          </div>
        ))}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSubmit(draft)}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-slate-800"
          >
            Save changes
          </button>
        </div>
      </div>
    </Modal>
  );
};

const SelectField = ({
  label,
  value,
  options,
  onChange,
  renderOption,
  renderValue,
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="mt-2 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
      >
        <span className="flex items-center gap-2">
          {renderValue ? renderValue(selected) : selected?.label}
        </span>
        <ChevronDown size={16} className="text-slate-400" />
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-card">
          <div className="max-h-56 overflow-auto p-2">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  value === option.value
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {renderOption ? renderOption(option) : option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const TaskModal = ({ projects, task, initialProjectId, onClose, onSubmit }) => {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [projectId, setProjectId] = useState(
    task?.projectId ?? initialProjectId ?? projects[0]?.id
  );
  const [priority, setPriority] = useState(task?.priority ?? "none");
  const [status, setStatus] = useState(task?.status ?? "todo");

  return (
    <Modal title={task ? "Edit Task" : "Add Task"} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          onSubmit({
            title: title.trim(),
            description: description.trim(),
            projectId,
            priority,
            status,
          });
        }}
      >
        <label className="block text-sm font-semibold text-slate-700">
          Title
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-400 focus:outline-none"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Task title"
            required
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Description
          <textarea
            className="mt-2 min-h-[90px] w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-400 focus:outline-none"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional details"
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            label="Project"
            value={projectId}
            onChange={setProjectId}
            options={projects.map((project) => ({
              value: project.id,
              label: project.name,
              color: project.color,
            }))}
            renderOption={(option) => (
              <>
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: option.color }}
                />
                {option.label}
              </>
            )}
            renderValue={(option) =>
              option ? (
                <>
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                  {option.label}
                </>
              ) : (
                "Select project"
              )
            }
          />
          <SelectField
            label="Priority"
            value={priority}
            onChange={setPriority}
            options={[
              {
                value: "none",
                label: "No status",
                tone: "bg-slate-100 text-slate-500",
              },
              {
                value: "low",
                label: "Low",
                tone: "bg-emerald-100 text-emerald-700",
              },
              {
                value: "medium",
                label: "Medium",
                tone: "bg-amber-100 text-amber-700",
              },
              {
                value: "high",
                label: "High",
                tone: "bg-rose-100 text-rose-700",
              },
            ]}
            renderOption={(option) => (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  option.tone
                }`}
              >
                {option.label}
              </span>
            )}
            renderValue={(option) =>
              option ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    option.tone
                  }`}
                >
                  {option.label}
                </span>
              ) : (
                "Select priority"
              )
            }
          />
        </div>
        <SelectField
          label="Status"
          value={status}
          onChange={setStatus}
          options={STATUSES.map((option) => ({
            value: option.id,
            label: option.label,
          }))}
        />
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-slate-800"
          >
            {task ? "Save changes" : "Create task"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const ConfirmDeleteModal = ({ onClose, onConfirm }) => {
  return (
    <Modal title="Delete task?" onClose={onClose}>
      <div className="space-y-6">
        <p className="text-sm text-slate-600">
          Are you sure you want to delete this task? This action cannot be
          undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-rose-500"
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
};

const ConfirmDeleteProjectModal = ({ project, onClose, onConfirm }) => {
  return (
    <Modal title="Delete project?" onClose={onClose}>
      <div className="space-y-6">
        <p className="text-sm text-slate-600">
          {project?.name
            ? `Delete “${project.name}”? All tasks in this project will also be removed.`
            : "Delete this project? All tasks in this project will also be removed."}
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-rose-500"
          >
            Delete project
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default App;
