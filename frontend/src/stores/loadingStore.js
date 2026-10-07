import { create } from 'zustand';

export const useLoadingStore = create((set, get) => ({
  activeRequests: 0,
  isNavigating: false,
  progress: 0,

  startRequest: () => {
    const current = get().activeRequests;
    set({ activeRequests: current + 1, progress: Math.max(get().progress, 25) });
  },

  finishRequest: () => {
    const current = get().activeRequests;
    const next = Math.max(0, current - 1);
    set({ activeRequests: next });
    if (next === 0 && !get().isNavigating) {
      set({ progress: 100 });
      setTimeout(() => {
        if (get().activeRequests === 0 && !get().isNavigating) {
          set({ progress: 0 });
        }
      }, 300);
    }
  },

  setNavigating: (isNavigating) => {
    if (isNavigating) {
      set({ isNavigating: true, progress: 40 });
    } else {
      set({ isNavigating: false, progress: 100 });
      setTimeout(() => {
        if (get().activeRequests === 0) {
          set({ progress: 0 });
        }
      }, 300);
    }
  }
}));
