import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Users, Plus, Edit2, Trash2, Search, Award, History, Download } from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => { fetchCustomers(); }, [tierFilter]);

  const fetchCustomers = async () => {
    try { 
      setLoading(true);
      const url = tierFilter ? `/customers?tier=${tierFilter}` : '/customers';
      const res = await api.get(url);
      setCustomers(res.data);
    } catch (err) { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  };

  const fetchCustomerTransactions = async (customerId) => {
    try { const res = await api.get(`/orders?customer_id=${customerId}`); setTransactions(res.data); } catch (err) { toast.error('Failed to load history'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) {
        await api.put(`/customers/${editing}`, form);
        toast.success('Customer updated');
      } else {
        await api.post('/customers', { ...form, points_balance: 0, tier: 'bronze' });
        toast.success('Customer created');
      }
      fetchCustomers(); resetForm();
    } catch (err) {
      const message = err.response?.data?.errors ? Object.values(err.response.data.errors).flat()[0] : err.response?.data?.message || 'Error saving customer';
      toast.error(message);
    }
    finally { setSaving(false); }
  };

  const resetForm = () => { setForm({ name: '', phone: '', email: '' }); setEditing(null); };
  const handleDelete = async (id) => { if (confirm('Delete this customer?')) { await api.delete(`/customers/${id}`); fetchCustomers(); } };
  const handleEdit = (c) => { setEditing(c.id); setForm({ name: c.name, phone: c.phone, email: c.email || '' }); };
  const viewHistory = (customer) => { setSelectedCustomer(customer); fetchCustomerTransactions(customer.id); setShowHistory(true); };

  const exportCSV = async () => {
    setExporting(true);
    try {
      const url = tierFilter ? `/customers/export?tier=${tierFilter}` : '/customers/export';
      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const link = document.createElement('a');
      const downloadUrl = window.URL.createObjectURL(blob);
      link.href = downloadUrl;
      link.download = `customers_${tierFilter || 'all'}_${new Date().toISOString().slice(0, 19)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('Export started');
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const filtered = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm));
  if (loading) return <div className="flex justify-center items-center h-64">Loading customers...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="text-amber-500" /> Customers & Loyalty</h1>
        <div className="flex gap-2">
          <select
            value={tierFilter}
            onChange={e => setTierFilter(e.target.value)}
            className="border rounded-xl px-3 py-2"
          >
            <option value="">All Tiers</option>
            <option value="bronze">Bronze</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
          </select>
          <button
            onClick={exportCSV}
            disabled={exporting}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <Download size={18} /> {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Plus className="text-amber-500" /> {editing ? 'Edit' : 'Add'} Customer</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input type="text" placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border p-2 rounded-xl" required />
          <input type="tel" placeholder="Phone (e.g., 0712345678)" pattern="[0-9]{10,12}" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="border p-2 rounded-xl" required />
          <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="border p-2 rounded-xl" />
          <div className="flex gap-2"><button type="submit" className="bg-amber-500 text-white px-6 py-2 rounded-xl">{editing ? 'Update' : 'Create'}</button>{editing && <button type="button" onClick={resetForm} className="bg-gray-200 px-4 py-2 rounded-xl">Cancel</button>}</div>
        </form>
      </div>
      <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Phone</th>
              <th className="p-4 text-left">Tier</th>
              <th className="p-4 text-left">Points</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="p-4">{c.name}</td>
                <td className="p-4">{c.phone}</td>
                <td className="p-4 capitalize">{c.tier}</td>
                <td className="p-4">{c.points_balance} pts</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => handleEdit(c)} className="text-blue-600 hover:text-blue-800"><Edit2 size={18} /></button>
                  <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                  <button onClick={() => viewHistory(c)} className="text-green-600 hover:text-green-800"><History size={18} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="5" className="text-center p-8 text-gray-400">No customers found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {showHistory && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{selectedCustomer.name} - Transaction History</h3>
              <button onClick={() => setShowHistory(false)} className="text-gray-500">✖</button>
            </div>
            <table className="w-full">
              <thead className="border-b">
                <tr><th className="text-left">Date</th><th className="text-left">Order #</th><th className="text-left">Total</th><th className="text-left">Points Earned</th></tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id}>
                    <td className="py-2">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td>{t.order_number}</td>
                    <td>Ksh {t.total_amount}</td>
                    <td>{Math.floor(t.total_amount / 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
