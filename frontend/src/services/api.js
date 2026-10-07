import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';

// Dynamically determine backend URL. We use /api to leverage Vite's proxy for HTTPS support
const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: apiBaseUrl,
    headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

import { useLoadingStore } from '../stores/loadingStore';

api.interceptors.request.use((config) => {
    useLoadingStore.getState().startRequest();
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    const branchId = localStorage.getItem('activeBranchId');
    if (branchId) {
        config.headers['X-Branch-ID'] = branchId;
    }
    return config;
}, (error) => {
    useLoadingStore.getState().finishRequest();
    return Promise.reject(error);
});

api.interceptors.response.use(
    (response) => {
        useLoadingStore.getState().finishRequest();
        return response;
    },
    (error) => {
        useLoadingStore.getState().finishRequest();
        if (error.response && error.response.status === 403 && error.response.data?.error === 'tenant_suspended_readonly') {
            useAuthStore.getState().setSuspendedModal(true);
        }
        return Promise.reject(error);
    }
);

export default api;