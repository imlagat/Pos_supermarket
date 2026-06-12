import axios from 'axios';

// Dynamically determine backend URL. We use /api to leverage Vite's proxy for HTTPS support
const apiBaseUrl = '/api';

const api = axios.create({
    baseURL: apiBaseUrl,
    headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    const branchId = localStorage.getItem('activeBranchId');
    if (branchId) {
        config.headers['X-Branch-ID'] = branchId;
    }
    return config;
});

export default api;