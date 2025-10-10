import axios from "axios";
import { useAuthStore } from "../../features/auth/store/authStore";

// 개발 환경인지 배포 환경인지
const baseURL = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_BACKEND_ADDRESS;

const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
