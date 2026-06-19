import { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Mail, Send, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || email.trim() === '') {
      toast.error('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/forgot-password', { email });
      toast.success('Password reset link sent to your email');
      setEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link');
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
            <h1 className="text-3xl md:text-4xl font-extrabold text-orange-600 tracking-tight">Reset Password</h1>
            <p className="text-gray-500 mt-2 font-medium">Enter your email to receive a reset link</p>
          </div>
          
          <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto md:mx-0">
            <div className="mb-8">
              <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-100 border-transparent rounded-xl focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-medium text-gray-800"
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E55A2A] hover:bg-[#D44A1A] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-orange-500/30 flex items-center justify-center gap-2 mb-4"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
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
