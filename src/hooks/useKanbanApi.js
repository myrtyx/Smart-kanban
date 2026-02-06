import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:3001";
const TOKEN_KEY = "kanban-token";

const handleResponse = async (response, onUnauthorized) => {
  if (!response.ok) {
    if (response.status === 401) {
      onUnauthorized?.();
    }
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  const authHeaders = useMemo(() => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setProjects([]);
    setTasks([]);
  }, []);

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [projectsData, tasksData] = await Promise.all([
        fetch(`${API_BASE}/projects`, {
          headers: authHeaders,
        }).then((res) => handleResponse(res, clearAuth)),
        fetch(`${API_BASE}/tasks`, {
          headers: authHeaders,
        }).then((res) => handleResponse(res, clearAuth)),
      ]);
      setProjects(projectsData || []);
      setTasks(tasksData || []);
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, clearAuth, token]);

  useEffect(() => {
    if (token) {
      fetchAll();
    }
  }, [fetchAll, token]);

  const login = async ({ username, password }) => {
    setError(null);
    const result = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }).then((res) => handleResponse(res));
    if (result?.token) {
      localStorage.setItem(TOKEN_KEY, result.token);
      setToken(result.token);
      await fetchAll();
    }
    return result;
  };

  const logout = () => {
    clearAuth();
  };

  const createProject = async (payload) => {
    const project = await fetch(`${API_BASE}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(payload),
    }).then((res) => handleResponse(res, clearAuth));
    if (project) {
      setProjects((prev) => [...prev, project]);
    }
    return project;
  };

  const updateProject = async (projectId, payload) => {
    const updated = await fetch(`${API_BASE}/projects/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(payload),
    }).then((res) => handleResponse(res, clearAuth));
    if (updated) {
      setProjects((prev) =>
        prev.map((project) => (project.id === projectId ? updated : project))
      );
    }
    return updated;
  };

  const deleteProject = async (projectId) => {
    await fetch(`${API_BASE}/projects/${projectId}`, {
      method: "DELETE",
      headers: authHeaders,
    }).then((res) => handleResponse(res, clearAuth));
    setProjects((prev) => prev.filter((project) => project.id !== projectId));
    setTasks((prev) => prev.filter((task) => task.projectId !== projectId));
  };

  const createTask = async (payload) => {
    const task = await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(payload),
    }).then((res) => handleResponse(res, clearAuth));
    if (task) {
      setTasks((prev) => [...prev, task]);
    }
    return task;
  };

  const updateTask = async (taskId, payload) => {
    const updated = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(payload),
    }).then((res) => handleResponse(res, clearAuth));
    if (updated) {
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? updated : task))
      );
    }
    return updated;
  };

  const deleteTask = async (taskId) => {
    await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: "DELETE",
      headers: authHeaders,
    }).then((res) => handleResponse(res, clearAuth));
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  return {
    token,
    projects,
    tasks,
    loading,
    error,
    login,
    logout,
    refetch: fetchAll,
    createProject,
    updateProject,
    deleteProject,
    createTask,
    updateTask,
    deleteTask,
  };
};
