import { useDraggable } from "@dnd-kit/core";
import { Edit3, Trash2 } from "lucide-react";

const priorityStyles = {
  high: "bg-rose-100 text-rose-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-emerald-100 text-emerald-700",
  none: "bg-slate-100 text-slate-500",
};

const TaskCard = ({
  task,
  project,
  onEdit = () => {},
  onDelete = () => {},
  isOverlay = false,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id, disabled: isOverlay });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        willChange: "transform",
      }
    : undefined;

  const draggableProps = isOverlay
    ? {}
    : {
        ...attributes,
        ...listeners,
      };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...draggableProps}
      className={`group rounded-2xl border border-slate-100 bg-white p-4 shadow-card transition-shadow transition-colors touch-none ${
        isDragging ? "opacity-0 pointer-events-none" : "hover:-translate-y-0.5"
      } ${isOverlay ? "cursor-grabbing" : "cursor-grab"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{task.title}</h4>
          {task.description && (
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              {task.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(task);
            }}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <Edit3 size={14} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(task.id);
            }}
            className="rounded-full p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
            priorityStyles[task.priority]
          }`}
        >
          {task.priority}
        </span>
        {project && (
          <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: project.color }}
            />
            {project.name}
          </span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
