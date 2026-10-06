import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shield, Lock, Mail, ShoppingCart, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export default function SuperAdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [superAdminExists, setSuperAdminExists] = useState(false);

  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const [settingUp, setSettingUp] = useState(false);

  useEffect(() => {
    api.get('/superadmin/check-status')
      .then(res => {
        if (res.data && res.data.exists) {
          setSuperAdminExists(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    try {
      await login(email, password, true);
      toast.success('Login successful');
      navigate('/superadmin/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid super admin credentials');
    }
  };

  const handleOneTimeSetup = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password (minimum 6 characters)');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    setSettingUp(true);
    try {
      const res = await api.post('/superadmin/setup-account', { email, password });
      toast.success(res.data.message || 'Super Admin account set up! Confirmation code sent.');
      await login(email, password, true);
      navigate('/superadmin/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.email?.[0] || err.response?.data?.errors?.password?.[0] || 'Failed to setup Super Admin account.';
      toast.error(msg);
    } finally {
      setSettingUp(false);
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
            Super Admin Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Global system administration and tenant management
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
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
                    placeholder="superposlish@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <Link to="/superadmin/forgot-password" className="text-sm font-medium text-orange-600 hover:text-orange-500">
                    Forgot password?
                  </Link>
                </div>
                <div className="mt-1 relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    className="bg-gray-50 border border-gray-200 text-gray-900 block w-full pl-10 sm:text-sm rounded-xl py-3 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading || settingUp}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:ring-offset-white disabled:opacity-50 transition-all duration-200"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLoading ? 'Authenticating...' : 'Sign in to Portal'}
                </button>
              </div>

              <div className="pt-2 border-t border-gray-100 text-center">
                {superAdminExists ? (
                  <p className="text-xs text-gray-500 font-medium flex items-center justify-center gap-1.5 py-1">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    Master Super Admin Account Active (Creation Locked)
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleOneTimeSetup}
                    disabled={isLoading || settingUp}
                    className="w-full py-2.5 px-3 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl text-xs font-semibold border border-orange-200 transition flex items-center justify-center gap-1.5"
                  >
                    {settingUp ? <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-600" /> : <Shield size={14} />}
                    Register Initial Super Admin Account & Send Code
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
