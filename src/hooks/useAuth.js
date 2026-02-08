import { useCallback, useEffect, useState } from "react";

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

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      }).then((res) => handleResponse(res));
      setAccessToken(data.accessToken);
      setUser(data.user);
      return data.accessToken;
    } catch (err) {
      setAccessToken(null);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const boot = async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    };
    boot();
  }, [refresh]);

  const login = async (email, password) => {
    setError(null);
    setBusy(true);
    try {
      const data = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      }).then((res) => handleResponse(res));
      setAccessToken(data.accessToken);
      setUser(data.user);
    } catch (err) {
      setError(err.message || "Login failed");
      throw err;
    } finally {
      setBusy(false);
    }
  };

  const register = async (email, password) => {
    setError(null);
    setBusy(true);
    try {
      const data = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      }).then((res) => handleResponse(res));
      setAccessToken(data.accessToken);
      setUser(data.user);
    } catch (err) {
      setError(err.message || "Registration failed");
      throw err;
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    setError(null);
    setBusy(true);
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      }).then((res) => handleResponse(res));
      setAccessToken(null);
      setUser(null);
    } catch (err) {
      setError(err.message || "Logout failed");
    } finally {
      setBusy(false);
    }
  };

  const authFetch = useCallback(
    async (url, options = {}) => {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: accessToken ? `Bearer ${accessToken}` : "",
        },
        credentials: "include",
      });

      if (response.status !== 401) {
        return response;
      }

      const refreshedToken = await refresh();
      if (!refreshedToken) {
        return response;
      }

      return fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: refreshedToken ? `Bearer ${refreshedToken}` : "",
        },
        credentials: "include",
      });
    },
    [accessToken, refresh]
  );

  return {
    user,
    accessToken,
    loading,
    busy,
    error,
    login,
    register,
    logout,
    authFetch,
  };
};
