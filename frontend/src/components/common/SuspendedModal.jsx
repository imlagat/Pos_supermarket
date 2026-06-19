import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { XCircle } from 'lucide-react';

export default function SuspendedModal() {
  const { showSuspendedModal, setSuspendedModal } = useAuthStore();

  if (!showSuspendedModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred background overlay */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={() => setSuspendedModal(false)}
      ></div>
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-8 text-center animate-in zoom-in-95 duration-200">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-6">
          <XCircle className="h-10 w-10 text-orange-600" />
        </div>
        
        <h3 className="text-2xl font-semibold text-gray-900 mb-3">
          Error
        </h3>
        
        <p className="text-gray-500 mb-8 text-lg">
          Your account is suspended. You can only view historical data.
        </p>
        
        <button
          onClick={() => setSuspendedModal(false)}
          className="w-full inline-flex justify-center rounded-xl border border-transparent bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 text-base font-bold text-white shadow-lg hover:from-amber-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all"
        >
          OK
        </button>
      </div>
    </div>
  );
}
