import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Save, Eye, EyeOff } from 'lucide-react';
import PageLoader from '../components/common/PageLoader';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', current_password: '', password: '', password_confirmation: '', pin: '' });
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile');
      setUser(res.data);
      setForm({ ...form, name: res.data.name, email: res.data.email, pin: '', current_password: '', password: '', password_confirmation: '' });
    } catch (err) {
      toast.error('Failed to load profile');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || form.name.trim() === '') {
      return toast.error('Full Name is required.');
    }
    if (!form.email || form.email.trim() === '') {
      return toast.error('Email Address is required.');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      return toast.error('Please enter a valid email address.');
    }

    if (form.password) {
      if (form.password.length < 8) return toast.error('New Password must be at least 8 characters long.');
      if (!form.current_password) return toast.error('Current Password is required to change password.');
      if (form.password !== form.password_confirmation) return toast.error('New Passwords do not match.');
    }

    setLoading(true);
    try {
      const payload = { name: form.name, email: form.email };
      if (form.password) {
        payload.current_password = form.current_password;
        payload.password = form.password;
        payload.password_confirmation = form.password_confirmation;
      }
      if (form.pin) {
        payload.pin = form.pin;
      }
      const res = await api.put('/profile', payload);
      setUser(res.data.user);
      toast.success('Profile updated');
      setForm({ ...form, pin: '', current_password: '', password: '', password_confirmation: '' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Update failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <PageLoader message="Loading profile..." />;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <User className="text-orange-600" /> My Profile
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-3">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {user?.role === 'admin' && (
            <div className="mt-5 border-t border-gray-100 pt-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Switch Account PIN</label>
              <div className="relative md:w-1/2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  maxLength={4}
                  value={form.pin}
                  onChange={e => setForm({...form, pin: e.target.value.replace(/\D/g, '')})}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none"
                  placeholder="Enter 4-digit PIN to update"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Leave blank to keep your current PIN unchanged.</p>
            </div>
          )}
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-3">Change Password (optional)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <div className="relative md:w-1/2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={form.current_password}
                  onChange={e => setForm({...form, current_password: e.target.value})}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none"
                  placeholder="Required only when changing password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showNew ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none"
                  placeholder="Leave blank to keep current"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.password_confirmation}
                  onChange={e => setForm({...form, password_confirmation: e.target.value})}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-8 bg-gradient-to-r from-orange-600 to-orange-600 hover:from-orange-700 hover:to-orange-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
