import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';

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

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 403 && error.response.data?.error === 'tenant_suspended_readonly') {
            useAuthStore.getState().setSuspendedModal(true);
        }
        return Promise.reject(error);
    }
);

export default api;