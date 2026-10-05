import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, ShoppingCart, ArrowLeft, Lock, Loader2, KeyRound } from 'lucide-react';
import api from '../services/api';

export default function SuperAdminForgotPassword() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email || !newPassword) {
      toast.error('Please enter your email and new password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/reset-password', {
        email,
        password: newPassword,
      });
      toast.success(res.data?.message || 'Password reset successful!');
      navigate('/superadmin');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password. Please verify your email address.');
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
            Reset Super Admin Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Enter your registered email and choose a new password
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
            <form className="space-y-6" onSubmit={handleResetPassword}>
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
                    placeholder="superposlish@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <div className="mt-1 relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    className="bg-gray-50 border border-gray-200 text-gray-900 block w-full pl-10 sm:text-sm rounded-xl py-3 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-[#E55A2A] to-orange-500 hover:from-orange-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-70 transition-all active:scale-[0.98]"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLoading ? 'Resetting Password...' : 'Reset Password & Return to Login'}
                </button>
              </div>
              
              <div className="text-center pt-2">
                <Link to="/superadmin" className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors flex items-center justify-center gap-1">
                  <ArrowLeft size={16} /> Return to Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
