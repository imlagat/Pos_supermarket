import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Users as UsersIcon, Plus, Edit2, Trash2, Search } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '', role: 'cashier' });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try { setLoading(true); const res = await api.get('/users'); setUsers(res.data); } catch (err) { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  if (loading) return <div>Loading users...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><UsersIcon className="text-amber-500" /> User Management</h1>
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border rounded-xl" /></div>
      </div>
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Plus className="text-amber-500" /> {editing ? 'Edit' : 'Add'} User</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" placeholder="Full name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border p-2 rounded-xl" required />
          <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="border p-2 rounded-xl" required />
          <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="border p-2 rounded-xl" required={!editing} />
          {!editing && <input type="password" placeholder="Confirm Password" value={form.password_confirmation} onChange={e => setForm({...form, password_confirmation: e.target.value})} className="border p-2 rounded-xl" required />}
          <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="border p-2 rounded-xl">
            <option value="cashier">Cashier</option><option value="manager">Manager</option><option value="admin">Admin</option>
          </select>
          <div className="flex gap-2"><button type="submit" disabled={saving} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2 rounded-xl">{saving ? 'Saving...' : (editing ? 'Update' : 'Create')}</button>{editing && <button type="button" onClick={resetForm} className="bg-gray-200 px-4 py-2 rounded-xl">Cancel</button>}</div>
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
                  <button onClick={() => handleEdit(u)} className="text-blue-600"><Edit2 size={18} /></button>
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
    </div>
  );
}
