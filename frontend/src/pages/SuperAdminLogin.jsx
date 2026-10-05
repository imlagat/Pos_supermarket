import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shield, Lock, Mail, ShoppingCart, Loader2, CheckCircle2 } from 'lucide-react';

export default function SuperAdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState('');
  const [isResending, setIsResending] = useState(false);

  const { login, verifyOtp, resendOtp, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (requires2FA) {
      if (!otpCode) {
        toast.error('Please enter the OTP code');
        return;
      }
      try {
        await verifyOtp(email, otpCode);
        toast.success('Login successful');
        navigate('/superadmin/dashboard');
      } catch (error) {
        toast.error('Invalid or expired OTP');
      }
    } else {
      if (!email || !password) {
        toast.error('Please enter email and password');
        return;
      }
      try {
        const res = await login(email, password, true);
        if (res && res.requires_2fa) {
          setRequires2FA(true);
          setResendStatus('Verification code sent to your email!');
          setResendCooldown(30);
          toast.success(res.message || 'OTP sent to your email');
        } else {
          toast.success('Login successful');
          navigate('/superadmin/dashboard');
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Invalid super admin credentials');
      }
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setResendStatus('');
    try {
      const res = await resendOtp(email);
      toast.success(res?.message || 'OTP resent successfully!');
      setResendStatus('Verification code sent to your email!');
      setResendCooldown(30);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsResending(false);
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
              {!requires2FA ? (
                <>
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
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Enter Verification Code (OTP)</label>
                    <div className="mt-1 relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        required
                        className="bg-gray-50 border border-gray-200 text-gray-900 block w-full pl-10 text-center tracking-[0.5em] font-mono font-bold sm:text-lg rounded-xl py-3 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        placeholder="------"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500">Enter the 6-digit code sent to <span className="font-semibold text-gray-700">{email}</span></p>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Didn't receive the code?</span>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || isResending}
                      className="font-semibold text-orange-600 hover:text-orange-500 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                    >
                      {isResending && <Loader2 className="w-3 h-3 animate-spin" />}
                      {isResending
                        ? 'Sending...'
                        : resendCooldown > 0
                        ? `Resend Code in ${resendCooldown}s`
                        : 'Resend Code'}
                    </button>
                  </div>

                  {resendStatus && (
                    <div className="p-2.5 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2 text-xs font-medium text-green-700">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <span>{resendStatus}</span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:ring-offset-white disabled:opacity-50 transition-all duration-200"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLoading ? (requires2FA ? 'Verifying...' : 'Authenticating...') : (requires2FA ? 'Verify & Continue' : 'Sign in to Portal')}
                </button>
              </div>
              
              {requires2FA && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setRequires2FA(false); setOtpCode(''); setResendStatus(''); }}
                    className="text-sm font-medium text-orange-600 hover:text-orange-500 transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
