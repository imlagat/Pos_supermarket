import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useEffect, useState } from 'react';

export default function ProtectedRoute() {
    const { token, user, loadUser } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const init = async () => {
            if (token && !user) {
                await loadUser();
            }
            setIsLoading(false);
        };
        init();
    }, [token, user, loadUser]);

    if (isLoading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

    if (!token || !user) {
        return <Navigate to="/" replace />;
    }

    if (user.tenant && !user.tenant.has_completed_onboarding && location.pathname !== '/onboarding') {
        return <Navigate to="/onboarding" replace />;
    }

    return <Outlet />;
}
