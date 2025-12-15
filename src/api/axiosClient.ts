import axios from "axios";

const BASE_URL = "http://localhost:8080/aims";

export const api = axios.create({
    baseURL: BASE_URL
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if(token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token hết hạn hoặc không hợp lệ
            localStorage.removeItem("token");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);