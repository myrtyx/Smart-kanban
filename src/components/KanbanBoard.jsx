import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import TaskCard from "./TaskCard";

const Column = ({
  status,
  tasks,
  projects,
  onEditTask,
  onDeleteTask,
  onAddTask,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: status.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex h-full flex-col rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm transition ${
        isOver ? "ring-2 ring-indigo-200" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            {status.label}
          </p>
          <p className="text-sm font-semibold text-slate-800">
            {tasks.length} tasks
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
          {status.short}
        </span>
      </div>

      <div className="mt-4 flex flex-1 flex-col gap-4">
        {tasks.length === 0 ? (
          <div className="flex flex-1 flex-col gap-4 rounded-xl border border-dashed border-slate-200 px-3 py-4">
            <div className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Drag here or add
            </div>
            <button
              type="button"
              onClick={() => onAddTask(status.id)}
              className="flex items-center justify-center rounded-xl border border-slate-900/40 bg-white/60 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-slate-900/70 hover:text-slate-800"
            >
              Add Task
            </button>
          </div>
        ) : (
          <>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                project={projects.find(
                  (project) => project.id === task.projectId
                )}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))}
            <button
              type="button"
              onClick={() => onAddTask(status.id)}
              className="flex items-center justify-center rounded-xl border border-slate-900/40 bg-white/60 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-slate-900/70 hover:text-slate-800"
            >
              Add Task
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const KanbanBoard = ({
  statuses,
  tasksByStatus,
  projects,
  onAddTask,
  onEditTask,
  onDeleteTask,
}) => {
  return (
    <section className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Kanban Board
          </p>
          <h2 className="text-2xl font-semibold text-slate-900">Your tasks</h2>
        </div>
      </div>

      <div className="mt-6 grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-4">
        {statuses.map((status) => (
          <Column
            key={status.id}
            status={status}
            tasks={tasksByStatus[status.id]}
            projects={projects}
            onAddTask={onAddTask}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
          />
        ))}
      </div>
    </section>
  );
};

export default KanbanBoard;
