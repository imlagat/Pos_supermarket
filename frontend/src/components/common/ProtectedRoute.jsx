import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useEffect, useState } from 'react';

export default function ProtectedRoute() {
    const { token, user, loadUser } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            if (token && !user) {
                await loadUser();
            }
            setIsLoading(false);
        };
        init();
    }, []);

    if (isLoading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
