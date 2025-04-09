import axios from "axios";

// create an axios instance with default settings
export const api = axios.create({
  baseURL: "https://video-chat-1ju5.onrender.com/api",
  // baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const googleAuth = (code) => api.get(`/auth/google?code=${code}`);

export const logoutUser = () =>
  api.get("/auth/logout", { withCredentials: true });

export const getAllUsers = () =>
  api.get("/user/all", { withCredentials: true });
