import { useNavigate } from 'react-router-dom';

export default function Paywall() {
    const navigate = useNavigate();

    const handleUpgrade = () => {
        navigate('/billing');
    };

    return (
        <div className="flex flex-col items-center justify-center h-full bg-white rounded-lg shadow-lg p-8 m-4 text-center">
            <div className="text-red-500 mb-6">
                <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-800 mb-4">7 Days Trial Expired</h2>
            
            <p className="text-gray-600 mb-8 max-w-md">
                Your 7 days trial has come to an end. To continue using the system, please upgrade your account.
            </p>
            
            <button
                onClick={handleUpgrade}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-lg shadow transition duration-200 flex items-center justify-center gap-2"
            >
                Upgrade Account Now
            </button>
            
            <div className="mt-8 text-sm text-gray-500">
                Contact support if you need assistance with payment.
            </div>
        </div>
    );
}
