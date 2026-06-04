import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login, verifyOtp, resendOtp, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (requires2FA) {
      try {
        await verifyOtp(email, otpCode);
        navigate('/');
      } catch {
        toast.error('Invalid or expired OTP');
      }
    } else {
      try {
        const res = await login(email, password);
        if (res && res.requires_2fa) {
          setRequires2FA(true);
          toast.success(res.message || 'OTP sent to your email');
        } else {
          navigate('/');
        }
      } catch {
        toast.error('Invalid credentials');
      }
    }
  };

  const handleResendOtp = async () => {
    try {
      const res = await resendOtp(email);
      toast.success(res.message || 'OTP resent to your email');
    } catch {
      toast.error('Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-600 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-500"></div>
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Welcome back</h1>
              <p className="text-gray-500 mt-1">Sign in to your POS account</p>
            </div>
            <form onSubmit={handleSubmit}>
              {!requires2FA ? (
                <>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-semibold mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="admin@pos.com"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-semibold mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="••••••"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                        disabled={isLoading}
                      />
                      <span className="text-sm text-gray-600">Remember Me</span>
                    </label>
                    <Link to="/forgot-password" className="text-sm text-amber-600 hover:text-amber-700">
                      Forgot Password?
                    </Link>
                  </div>
                </>
              ) : (
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-semibold mb-2">Enter OTP</label>
                  <p className="text-sm text-gray-500 mb-3">Please check your email ({email}) for the 6-digit code.</p>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-center tracking-widest font-mono text-lg"
                      placeholder="------"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 mb-4"
              >
                {isLoading ? (requires2FA ? 'Verifying...' : 'Logging in...') : <><LogIn size={18} /> {requires2FA ? 'Verify & Continue' : 'Login'}</>}
              </button>
              {requires2FA && (
                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-600">
                    Didn't receive the code?{' '}
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      className="text-amber-600 hover:text-amber-700 font-semibold disabled:opacity-50"
                    >
                      Resend Email
                    </button>
                  </p>
                  <div className="pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setRequires2FA(false);
                        setOtpCode('');
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-2 mx-auto"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                      Back to Login
                    </button>
                  </div>
                </div>
              )}
            </form>
            <div className="mt-6 text-center text-sm text-gray-500">
              Demo: <span className="font-mono text-amber-600">admin@pos.com</span> / <span className="font-mono text-amber-600">admin123</span>
            </div>
            <div className="mt-8 pt-6 border-t text-center text-xs text-gray-400">
              <span>User Agreement</span> <span className="mx-2">•</span> <span>Privacy Policy</span>
              <div className="mt-2">© {new Date().getFullYear()} POS_super</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
