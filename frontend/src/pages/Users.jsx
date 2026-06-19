import { useEffect, useState } from 'react';
import PageLoader from '../components/common/PageLoader';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Users as UsersIcon, Plus, Edit2, Trash2, Search, BarChart3, Filter } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ShiftsReport from './ShiftsReport';

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '', role: 'cashier' });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('manage');
  const [performanceData, setPerformanceData] = useState([]);
  const [period, setPeriod] = useState('daily');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    if (activeTab === 'performance') {
      fetchPerformance();
    }
  }, [activeTab, period, customStart, customEnd]);

  const fetchPerformance = async () => {
    if (period === 'custom' && (!customStart || !customEnd)) return;
    try {
      setLoading(true);
      let url = `/users/performance?period=${period}`;
      if (period === 'custom') {
        url += `&start_date=${customStart}&end_date=${customEnd}`;
      }
      const res = await api.get(url);
      setPerformanceData(res.data);
    } catch (err) {
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try { setLoading(true); const res = await api.get('/users'); setUsers(res.data); } catch (err) { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name || form.name.trim() === '') {
      return toast.error('Full Name is required.');
    }
    if (!form.email || form.email.trim() === '') {
      return toast.error('Email is required.');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      return toast.error('Please enter a valid email address.');
    }
    if (!editing && (!form.password || form.password.trim() === '')) {
      return toast.error('Password is required for new users.');
    }
    if (form.password && form.password.length < 8) {
      return toast.error('Password must be at least 8 characters long.');
    }

    setSaving(true);
    try {
      if (editing) {
        const payload = { name: form.name, email: form.email, role: form.role };
        if (form.password) payload.password = form.password;
        await api.put(`/users/${editing}`, payload);
        toast.success('User updated');
      } else {
        // Ensure password confirmation matches
        if (form.password !== form.password_confirmation) {
          toast.error('Passwords do not match');
          setSaving(false);
          return;
        }
        await api.post('/users', {
          name: form.name,
          email: form.email,
          password: form.password,
          password_confirmation: form.password_confirmation,
          role: form.role
        });
        toast.success('User created');
      }
      fetchUsers();
      resetForm();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.errors || 'Error saving user';
      console.error(err.response?.data);
      toast.error(typeof errorMsg === 'string' ? errorMsg : 'Validation failed – check console');
    } finally { setSaving(false); }
  };

  const resetForm = () => { setForm({ name: '', email: '', password: '', password_confirmation: '', role: 'cashier' }); setEditing(null); };
  const handleDelete = async (id) => { if (!confirm('Delete this user?')) return; try { await api.delete(`/users/${id}`); toast.success('Deleted'); fetchUsers(); } catch (err) { toast.error('Delete failed'); } };
  const handleEdit = (user) => { setEditing(user.id); setForm({ name: user.name, email: user.email, password: '', password_confirmation: '', role: user.role }); };
  const filtered = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <PageLoader message="Loading users..." />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><UsersIcon className="text-orange-600" /> User Management</h1>
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <div className="flex gap-2 mb-6 mt-4 bg-white p-1 rounded-xl w-fit shadow-sm border border-gray-100">
              <button
                onClick={() => setActiveTab('manage')}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'manage' ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Manage Users
              </button>
              <button
                onClick={() => setActiveTab('performance')}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'performance' ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <BarChart3 size={16} /> Performance
              </button>
              <button
                onClick={() => setActiveTab('shifts')}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'shifts' ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <BarChart3 size={16} /> Past Shifts
              </button>
            </div>
          )}
        </div>
        {activeTab === 'manage' && (
          <div className="relative mt-auto mb-2"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border rounded-xl" /></div>
        )}
      </div>

      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <Filter className="text-gray-400" size={20} />
            <select value={period} onChange={e => setPeriod(e.target.value)} className="border p-2 rounded-xl outline-none focus:ring-2 focus:ring-orange-600">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom Range</option>
            </select>
            {period === 'custom' && (
              <div className="flex items-center gap-2">
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="border p-2 rounded-xl outline-none focus:ring-2 focus:ring-orange-600" />
                <span>to</span>
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="border p-2 rounded-xl outline-none focus:ring-2 focus:ring-orange-600" />
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 text-left font-semibold text-gray-700">Cashier Name</th>
                    <th className="p-4 text-left font-semibold text-gray-700">Email</th>
                    <th className="p-4 text-right font-semibold text-gray-700">Orders Taken</th>
                    <th className="p-4 text-right font-semibold text-gray-700">Returns Processed</th>
                    <th className="p-4 text-right font-semibold text-gray-700">Total Sales</th>
                    <th className="p-4 text-right font-semibold text-gray-700">Total Refunds</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.map(perf => (
                    <tr key={perf.user_id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-800">{perf.name}</td>
                      <td className="p-4 text-gray-500">{perf.email}</td>
                      <td className="p-4 text-right font-bold text-orange-600">{perf.orders_taken}</td>
                      <td className="p-4 text-right font-bold text-red-500">{perf.returns_taken || 0}</td>
                      <td className="p-4 text-right font-bold text-orange-700">Ksh {perf.total_sales ? parseFloat(perf.total_sales).toLocaleString() : 0}</td>
                      <td className="p-4 text-right font-bold text-red-600">Ksh {perf.total_returns_amount ? parseFloat(perf.total_returns_amount).toLocaleString() : 0}</td>
                    </tr>
                  ))}
                  {performanceData.length === 0 && (
                    <tr><td colSpan="6" className="text-center p-8 text-gray-400">No performance data found for this period.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Sales Distribution</h3>
              {performanceData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={performanceData}
                        dataKey="total_sales"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {performanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `Ksh ${value.toLocaleString()}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400">No data available</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'manage' && (
        <>
          <div className="mb-8 space-y-6">
        <div className="flex items-center gap-2">
          <Plus className="text-orange-600 w-6 h-6" />
          <h2 className="text-xl font-bold text-gray-800">{editing ? 'Edit' : 'Add'} User</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Details Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-3">User Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" placeholder="John Doe" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" placeholder="john@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full md:w-1/2 border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none">
                  <option value="cashier">Cashier</option><option value="manager">Manager</option><option value="admin">Admin</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Security Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-3">Security</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{editing ? 'New Password (Optional)' : 'Password'}</label>
                <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" required={!editing} />
              </div>
              {!editing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <input type="password" placeholder="••••••••" value={form.password_confirmation} onChange={e => setForm({...form, password_confirmation: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" required />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            {editing && <button type="button" onClick={resetForm} className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition">Cancel</button>}
            <button type="submit" disabled={saving} className="bg-gradient-to-r from-orange-600 to-orange-600 hover:from-orange-700 hover:to-orange-700 text-white px-8 py-2 rounded-xl font-semibold shadow-md transition">{saving ? 'Saving...' : (editing ? 'Update User' : 'Create User')}</button>
          </div>
        </form>
      </div>
      <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Role</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-b hover:bg-gray-50">
                <td className="p-4">{u.name}</td>
                <td className="p-4">{u.email}</td>
                <td className="p-4 capitalize">{u.role}</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => handleEdit(u)} className="text-orange-600"><Edit2 size={18} /></button>
                  <button onClick={() => handleDelete(u.id)} className="text-red-600"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="4" className="text-center p-8 text-gray-400">No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>
        </>
      )}

      {activeTab === 'shifts' && (
        <ShiftsReport />
      )}
    </div>
  );
}
