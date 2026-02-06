import { useCallback, useEffect, useState } from "react";

const API_BASE = "http://localhost:3001";

const handleResponse = async (response) => {
  if (!response.ok) {
    let message = "Request failed";
    try {
      const data = await response.json();
      message = data.error || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
};

export const useKanbanApi = () => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projectsData, tasksData] = await Promise.all([
        fetch(`${API_BASE}/projects`).then(handleResponse),
        fetch(`${API_BASE}/tasks`).then(handleResponse),
      ]);
      setProjects(projectsData || []);
      setTasks(tasksData || []);
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createProject = async (payload) => {
    const project = await fetch(`${API_BASE}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(handleResponse);
    if (project) {
      setProjects((prev) => [...prev, project]);
    }
    return project;
  };

  const deleteProject = async (projectId) => {
    await fetch(`${API_BASE}/projects/${projectId}`, {
      method: "DELETE",
    }).then(handleResponse);
    setProjects((prev) => prev.filter((project) => project.id !== projectId));
    setTasks((prev) => prev.filter((task) => task.projectId !== projectId));
  };

  const updateProject = async (projectId, payload) => {
    const updated = await fetch(`${API_BASE}/projects/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(handleResponse);
    if (updated) {
      setProjects((prev) =>
        prev.map((project) => (project.id === projectId ? updated : project))
      );
    }
    return updated;
  };

  const createTask = async (payload) => {
    const task = await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(handleResponse);
    if (task) {
      setTasks((prev) => [...prev, task]);
    }
    return task;
  };

  const updateTask = async (taskId, payload) => {
    const updated = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(handleResponse);
    if (updated) {
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? updated : task))
      );
    }
    return updated;
  };

  const deleteTask = async (taskId) => {
    await fetch(`${API_BASE}/tasks/${taskId}`, { method: "DELETE" }).then(
      handleResponse
    );
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  return {
    projects,
    tasks,
    loading,
    error,
    refetch: fetchAll,
    createProject,
    deleteProject,
    updateProject,
    createTask,
    updateTask,
    deleteTask,
  };
};
