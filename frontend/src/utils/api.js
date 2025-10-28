import axios from "axios";
import { toast } from "sonner";

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
        try {
            // Check if token is expired before making the request
            const decoded = JSON.parse(atob(token.split('.')[1]));
            if (decoded.exp * 1000 < Date.now()) {
                // Token is expired
                handleExpiredToken();
                return Promise.reject(new Error('Token expired'));
            }
            config.headers.Authorization = `Bearer ${token}`;
        } catch (error) {
            console.error('Error processing token:', error);
            handleExpiredToken();
            return Promise.reject(error);
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Add response interceptor to handle token expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Handle 401 Unauthorized responses
            handleExpiredToken();
        }
        return Promise.reject(error);
    }
);

// Function to handle expired token
const handleExpiredToken = () => {
    // Clear auth data from localStorage
    localStorage.removeItem("authToken");
    localStorage.removeItem("userInfo");
    
    // Show toast notification
    toast.error('Your session has expired. Please log in again.');
    
    // Redirect to login page
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
};

export default api;
