import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set, get) => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token') || null,
    activeBranchId: localStorage.getItem('activeBranchId') || null,
    isLoading: false,
    showSuspendedModal: false,

    setSuspendedModal: (show) => set({ showSuspendedModal: show }),

    setActiveBranchId: (id) => {
        if (id) {
            localStorage.setItem('activeBranchId', id);
        } else {
            localStorage.removeItem('activeBranchId');
        }
        set({ activeBranchId: id });
    },

    login: async (email, password) => {
        set({ isLoading: true });
        try {
            const res = await api.post('/login', { email, password });
            if (res.data.requires_2fa) {
                set({ isLoading: false });
                return res.data;
            }
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            
            // Auto-set activeBranchId for non-admins if they have one assigned
            const user = res.data.user;
            let activeBranch = null;
            if (user.role !== 'admin' && user.branch_id) {
                activeBranch = String(user.branch_id);
                localStorage.setItem('activeBranchId', activeBranch);
            }

            set({ user, token: res.data.token, activeBranchId: activeBranch, isLoading: false });
            return { success: true };
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    register: async (name, email, password, tier) => {
        set({ isLoading: true });
        try {
            const res = await api.post('/register', { name, email, password, tier });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            
            set({ user: res.data.user, token: res.data.token, activeBranchId: null, isLoading: false });
            return { success: true };
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    verifyOtp: async (email, otp_code) => {
        set({ isLoading: true });
        try {
            const res = await api.post('/verify-otp', { email, otp_code });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            
            const user = res.data.user;
            let activeBranch = null;
            if (user.role !== 'admin' && user.branch_id) {
                activeBranch = String(user.branch_id);
                localStorage.setItem('activeBranchId', activeBranch);
            }

            set({ user, token: res.data.token, activeBranchId: activeBranch, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    switchAccount: async (targetUserId, pin) => {
        set({ isLoading: true });
        try {
            const res = await api.post('/switch-account', { target_user_id: targetUserId, pin });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            
            const user = res.data.user;
            let activeBranch = null;
            if (user.role !== 'admin' && user.branch_id) {
                activeBranch = String(user.branch_id);
                localStorage.setItem('activeBranchId', activeBranch);
            }

            set({ user, token: res.data.token, activeBranchId: activeBranch, isLoading: false });
            return { success: true };
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    resendOtp: async (email) => {
        try {
            const res = await api.post('/resend-otp', { email });
            return res.data;
        } catch (error) {
            throw error;
        }
    },

    logout: async () => {
        try { await api.post('/logout'); } catch (e) {}
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('activeBranchId');
        set({ user: null, token: null, activeBranchId: null });
    },

    // Call this on app start to validate token and refresh user if needed
    loadUser: async () => {
        const token = get().token;
        if (!token) return;
        try {
            const res = await api.get('/user');
            localStorage.setItem('user', JSON.stringify(res.data));
            set({ user: res.data });
        } catch (error) {
            // Token invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('activeBranchId');
            set({ user: null, token: null, activeBranchId: null });
        }
    },

    upgrade: async () => {
        set({ isLoading: true });
        try {
            const res = await api.post('/upgrade');
            localStorage.setItem('user', JSON.stringify(res.data.user));
            set({ user: res.data.user, isLoading: false });
            return { success: true, message: res.data.message };
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    }
}));
