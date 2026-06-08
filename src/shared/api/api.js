import axios from "axios";

export const axiosAdmin = axios.create({
    baseURL: import.meta.env.VITE_ADMIN_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json"
    }
});