import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("medico_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const token = localStorage.getItem("medico_token");
    const isAuthError = status === 401 || status === 403;
    const isLoginPage = window.location.pathname === "/login";

    if (token && isAuthError && !isLoginPage) {
      localStorage.removeItem("medico_token");
      localStorage.removeItem("medico_user");
      window.location.assign("/login?session=expired");
    }

    return Promise.reject(error);
  }
);

export default api;
