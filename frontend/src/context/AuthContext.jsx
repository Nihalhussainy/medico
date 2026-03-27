import { createContext, useContext, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("medico_token"));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("medico_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    const { token: jwtToken, user: userData } = response.data;
    setToken(jwtToken);
    setUser(userData);
    localStorage.setItem("medico_token", jwtToken);
    localStorage.setItem("medico_user", JSON.stringify(userData));
    return userData;
  };

  const register = async (payload) => {
    const response = await api.post("/auth/register", payload);
    return response.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("medico_token");
    localStorage.removeItem("medico_user");
  };

  const updateUser = (partialUser) => {
    setUser((prev) => {
      const nextUser = { ...(prev || {}), ...(partialUser || {}) };
      localStorage.setItem("medico_user", JSON.stringify(nextUser));
      return nextUser;
    });
  };

  const role = useMemo(() => {
    if (user?.role) return user.role;
    if (!token) return null;
    try {
      return jwtDecode(token).role;
    } catch {
      return null;
    }
  }, [token, user]);

  return (
    <AuthContext.Provider value={{ token, user, role, login, logout, register, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
