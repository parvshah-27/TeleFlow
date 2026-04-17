import axios from "axios";

const API = axios.create({ 
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5002/api",
    withCredentials: true
});

API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        console.log(`DEBUG: Sending ${config.method.toUpperCase()} to ${config.url}. Token exists: ${!!token}`);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            console.warn(`DEBUG: No token found in localStorage for request to ${config.url}`);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

API.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error(`DEBUG: Response error from ${error.config?.url}:`, error.response?.status, error.response?.data);
        // Temporarily commented out to prevent clearing token on 401
        /*
        if (error.response?.status === 401) {
            sessionStorage.removeItem("user");
            sessionStorage.removeItem("token");
        }
        */
        return Promise.reject(error);
    }
);

export const getFollowUps = (page = 1) => API.get(`/followups?page=${page}&limit=10`);
export const updateFollowUpStatus = (id) => API.put(`/followups/${id}`);

export default API;