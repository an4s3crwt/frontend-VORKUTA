
import axios from 'axios';

const BACKEND_URL = 'http://localhost:8000/api';

export const api = axios.create({
    baseURL: BACKEND_URL,
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
