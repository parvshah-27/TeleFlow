import axios from "axios";

const API = axios.create({ 
    baseURL: "/api",
    withCredentials: true
});

API.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
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
        if (error.response?.status === 401) {
            sessionStorage.removeItem("user");
            sessionStorage.removeItem("token");
            window.location.href = "/";
        }
        return Promise.reject(error);
    }
);

export const getFollowUps = (page = 1) => API.get(`/followups?page=${page}&limit=10`);
export const updateFollowUpStatus = (id) => API.put(`/followups/${id}`);

export default API;