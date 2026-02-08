import { Plus, Layers, Settings } from "lucide-react";

const Sidebar = ({
  projects,
  selectedProjectId,
  onSelectProject,
  onAddProject,
  onEditProjects,
  tasksCount,
}) => {
  return (
    <aside className="flex h-full min-h-0 w-full flex-col overflow-y-auto border-r border-slate-200 bg-white/90 px-5 py-6 backdrop-blur">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Workspace
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">Smart Kanban</h1>
        </div>
        <div className="rounded-2xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
          v1.0
        </div>
      </div>

      <div className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Projects
        </p>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white/70 p-2">
          <button
            type="button"
            onClick={() => onSelectProject("all")}
            className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
              selectedProjectId === "all"
                ? "bg-slate-900 text-white shadow-card"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span className="flex items-center gap-2">
              <Layers size={16} /> All Tasks
            </span>
            <span className="text-xs font-semibold">{tasksCount}</span>
          </button>

          <div className="mt-2 space-y-2">
            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => onSelectProject(project.id)}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                  selectedProjectId === project.id
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  {project.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onAddProject}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
        >
          <Plus size={16} /> Add Project
        </button>
        <button
          type="button"
          onClick={onEditProjects}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <Settings size={16} /> Edit Projects
        </button>
      </div>

      <div className="mt-auto hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-4 text-white shadow-card lg:block">
        <p className="text-sm font-semibold">Stay focused</p>
        <p className="mt-1 text-xs text-slate-200">
          Drag tasks between columns to update their status instantly.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
