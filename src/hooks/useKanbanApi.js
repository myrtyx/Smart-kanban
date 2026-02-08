import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API_BASE = import.meta.env.DEV ? "http://localhost:3001" : "";

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

export const useKanbanApi = ({ authFetch, enabled }) => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  const fetchAll = useCallback(
    async (silent = false) => {
      if (!enabled || !authFetch) return;
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const [projectsData, tasksData] = await Promise.all([
          authFetch(`${API_BASE}/projects`).then((res) => handleResponse(res)),
          authFetch(`${API_BASE}/tasks`).then((res) => handleResponse(res)),
        ]);
        setProjects(projectsData || []);
        setTasks(tasksData || []);
      } catch (err) {
        if (!silent) {
          setError(err.message || "Failed to load data");
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [authFetch, enabled]
  );

  useEffect(() => {
    if (!enabled) {
      setProjects([]);
      setTasks([]);
      setLoading(false);
      setError(null);
      return;
    }
    fetchAll(false);
  }, [fetchAll]);

  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
    }
    if (enabled) {
      pollRef.current = setInterval(() => {
        fetchAll(true);
      }, 5000);
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [fetchAll, enabled]);

  const createProject = async (payload) => {
    const project = await authFetch(`${API_BASE}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((res) => handleResponse(res));
    if (project) {
      setProjects((prev) => [...prev, project]);
    }
    return project;
  };

  const updateProject = async (projectId, payload) => {
    const updated = await authFetch(`${API_BASE}/projects/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((res) => handleResponse(res));
    if (updated) {
      setProjects((prev) =>
        prev.map((project) => (project.id === projectId ? updated : project))
      );
    }
    return updated;
  };

  const deleteProject = async (projectId) => {
    await authFetch(`${API_BASE}/projects/${projectId}`, {
      method: "DELETE",
    }).then((res) => handleResponse(res));
    setProjects((prev) => prev.filter((project) => project.id !== projectId));
    setTasks((prev) => prev.filter((task) => task.projectId !== projectId));
  };

  const createTask = async (payload) => {
    const task = await authFetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((res) => handleResponse(res));
    if (task) {
      setTasks((prev) => [...prev, task]);
    }
    return task;
  };

  const updateTask = async (taskId, payload) => {
    const updated = await authFetch(`${API_BASE}/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((res) => handleResponse(res));
    if (updated) {
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? updated : task))
      );
    }
    return updated;
  };

  const deleteTask = async (taskId) => {
    await authFetch(`${API_BASE}/tasks/${taskId}`, {
      method: "DELETE",
    }).then((res) => handleResponse(res));
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  return {
    projects,
    tasks,
    loading,
    error,
    refetch: fetchAll,
    createProject,
    updateProject,
    deleteProject,
    createTask,
    updateTask,
    deleteTask,
  };
};
