import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_PROD === "true"
        ? import.meta.env.VITE_PRODUCTION_API
        : import.meta.env.VITE_API_URL,
    withCredentials: true
});

// Add request interceptor to attach token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
