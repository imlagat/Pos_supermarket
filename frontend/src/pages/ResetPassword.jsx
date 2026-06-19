import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Lock, Send, ShoppingCart } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      toast.error('Invalid reset link');
      navigate('/login');
    }
  }, [token, email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || password.trim() === '') {
      return toast.error('Please enter a new password.');
    }
    if (password.length < 8) {
      return toast.error('Password must be at least 8 characters long.');
    }
    if (password !== passwordConfirmation) {
      return toast.error('Passwords do not match');
    }
    
    setLoading(true);
    try {
      await api.post('/reset-password', {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation
      });
      toast.success('Password successfully reset');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
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
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-6xl flex flex-col md:flex-row min-h-[700px]">
        
        {/* Left Side: Form */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
          <div className="text-center md:text-left mb-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-orange-600 tracking-tight">Set New Password</h1>
            <p className="text-gray-500 mt-2 font-medium">Please enter your new password below</p>
          </div>
          
          <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto md:mx-0">
            <div className="mb-5">
              <label className="block text-gray-700 text-sm font-bold mb-2">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-100 border-transparent rounded-xl focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-medium text-gray-800"
                placeholder="••••••••"
                required
                minLength={8}
                disabled={loading}
              />
            </div>

            <div className="mb-8">
              <label className="block text-gray-700 text-sm font-bold mb-2">Confirm Password</label>
              <input
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-100 border-transparent rounded-xl focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-medium text-gray-800"
                placeholder="••••••••"
                required
                minLength={8}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E55A2A] hover:bg-[#D44A1A] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-orange-500/30 flex items-center justify-center gap-2 mb-4"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div className="w-full max-w-sm mx-auto md:mx-0 mt-8 text-center">
            <Link to="/login" className="text-orange-600 hover:text-orange-800 font-bold underline transition-colors">
              Back to Login
            </Link>
          </div>
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
