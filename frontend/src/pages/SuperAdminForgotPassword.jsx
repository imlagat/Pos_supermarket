import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, ShoppingCart, ArrowLeft } from 'lucide-react';
import api from '../services/api';

export default function SuperAdminForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    try {
      await api.post('/forgot-password', { email });
      setIsSent(true);
      toast.success('Password reset link sent to your email');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <header className="w-full bg-white/80 backdrop-blur-md relative px-6 py-4 flex items-center justify-center md:justify-start sticky top-0 z-50 shadow-sm">
        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#E55A2A] via-yellow-400 to-orange-600 bg-[length:200%_auto] animate-gradient-x"></div>
        <Link to="/" className="flex items-center gap-2.5 group hover:opacity-90 transition-opacity">
          <div className="w-10 h-10 bg-[#E55A2A] rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
            <ShoppingCart className="text-white w-5 h-5" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            <span className="text-slate-900">POS</span>
            <span className="text-[#E55A2A]">super</span>
          </h1>
        </Link>
      </header>

      <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Reset Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Enter your super admin email to receive a reset link
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
            {isSent ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Check your email</h3>
                <p className="text-gray-600 text-sm">
                  We've sent a password reset link to <span className="font-semibold">{email}</span>. Please check your inbox and spam folder.
                </p>
                <div className="pt-4">
                  <Link to="/super-admin/login" className="text-orange-600 hover:text-orange-700 font-medium flex items-center justify-center gap-2">
                    <ArrowLeft size={16} /> Return to login
                  </Link>
                </div>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email address</label>
                  <div className="mt-1 relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      required
                      className="bg-gray-50 border border-gray-200 text-gray-900 block w-full pl-10 sm:text-sm rounded-xl py-3 focus:ring-orange-500 focus:border-orange-500 transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-[#E55A2A] to-orange-500 hover:from-orange-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-70 transition-all active:scale-[0.98]"
                  >
                    {isLoading ? 'Sending Link...' : 'Send Reset Link'}
                  </button>
                </div>
                
                <div className="text-center pt-2">
                  <Link to="/super-admin/login" className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors">
                    Back to login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
