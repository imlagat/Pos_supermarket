import { useAuthStore } from '../../stores/authStore';
import { toast } from 'react-hot-toast';

export default function Paywall() {
    const { upgrade, isLoading } = useAuthStore();

    const handleUpgrade = async () => {
        try {
            const res = await upgrade();
            toast.success(res.message || 'Successfully upgraded!');
        } catch (error) {
            toast.error('Failed to upgrade account');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full bg-white rounded-lg shadow-lg p-8 m-4 text-center">
            <div className="text-red-500 mb-6">
                <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Free Trial Expired</h2>
            
            <p className="text-gray-600 mb-8 max-w-md">
                Your 3-day free trial has come to an end. To continue using the system, please upgrade your account.
            </p>
            
            <button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isLoading && (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                Upgrade Account Now
            </button>
            
            <div className="mt-8 text-sm text-gray-500">
                Contact support if you need assistance with payment.
            </div>
        </div>
    );
}
