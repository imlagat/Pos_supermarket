import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, ShoppingCart, Mail, Lock, User, UserPlus, Loader2 } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const { register, verifyOtp, resendOtp, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (requires2FA) {
      if (!otpCode || otpCode.trim() === '') {
        toast.error('Please enter the verification code.');
        return;
      }
      try {
        await verifyOtp(email, otpCode);
        navigate('/dashboard');
      } catch {
        toast.error('Invalid or expired code');
      }
      return;
    }

    if (!name || !email || !password) {
      toast.error('Please fill in all fields.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const plan = urlParams.get('plan') || 'bronze';

      const res = await register(name, email, password, plan);
      if (res && res.requires_2fa) {
        setRequires2FA(true);
        toast.success(res.message || 'Verification email sent!');
      } else {
        toast.success('Registration successful!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed. Email might be in use.');
    }
  };

  return (
    <div className="min-h-screen bg-[#E3DAC9] flex flex-col">
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

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-4xl flex flex-col md:flex-row min-h-[600px]">
        
        {/* Left Side: Form */}
        <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col justify-center">
          <div className="text-center md:text-left mb-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-orange-600 tracking-tight">Create Account</h1>
            <p className="text-gray-500 mt-2 font-medium">Start your 7 days trial today</p>
          </div>
          
          <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto md:mx-0">
            {!requires2FA ? (
              <>
            <div className="mb-5">
              <label className="block text-gray-700 text-sm font-bold mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-100 border-transparent rounded-xl focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-medium text-gray-800"
                placeholder="John Doe"
                required
                disabled={isLoading}
              />
            </div>

            <div className="mb-5">
              <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-100 border-transparent rounded-xl focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-medium text-gray-800"
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
            </div>

            <div className="mb-8">
              <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-12 py-3.5 bg-gray-100 border-transparent rounded-xl focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-medium text-gray-800"
                  placeholder="Create a password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-600 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
              </>
            ) : (
              <div className="mb-8">
                <label className="block text-gray-700 text-sm font-bold mb-2">Enter Verification Code</label>
                <p className="text-sm text-gray-500 mb-4">Please check your email ({email}) for the 6-digit code.</p>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full px-4 py-4 bg-gray-100 border-transparent rounded-xl focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-center tracking-[0.5em] font-mono text-xl text-gray-800 font-bold"
                  placeholder="------"
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#E55A2A] hover:bg-[#D44A1A] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-orange-500/30 flex items-center justify-center gap-2 mb-4 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
              {isLoading ? (requires2FA ? 'Verifying...' : 'Creating account...') : (requires2FA ? 'Verify & Continue' : 'Signup')}
            </button>

            {requires2FA && (
              <div className="text-center space-y-4">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await resendOtp(email);
                      toast.success(res.message || 'Verification code resent');
                    } catch {
                      toast.error('Failed to resend code');
                    }
                  }}
                  disabled={isLoading}
                  className="text-sm font-bold text-gray-600 hover:text-orange-600 transition-colors flex items-center justify-center gap-2 mx-auto disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLoading ? 'Sending...' : 'Resend Code'}
                </button>
              </div>
            )}
          </form>

          {!requires2FA && (
          <div className="w-full max-w-sm mx-auto md:mx-0 mt-8 text-center">
            <p className="text-gray-600 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-orange-600 hover:text-orange-800 font-bold underline transition-colors">
                Sign in
              </Link>
            </p>
            
            <div className="mt-8 pt-6 border-t border-gray-200 text-xs text-gray-400 font-medium">
              <p>By registering, you agree to our <span className="hover:text-gray-600 cursor-pointer">Terms</span> and <span className="hover:text-gray-600 cursor-pointer">Privacy Policy</span>.</p>
            </div>
          </div>
          )}
        </div>

        {/* Right Side: Image */}
        <div className="hidden md:block md:w-1/2 p-4">
          <div 
            className="w-full h-full rounded-[2rem] relative overflow-hidden bg-cover bg-center shadow-inner"
            style={{ backgroundImage: `url('https://clotouch.com/wp-content/uploads/2025/10/a-practical-guide-how-to-optimize-pos-software-for-grocery-stores-featured.jpg')` }}
          >
            {/* Dark overlay for better text contrast if needed */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
