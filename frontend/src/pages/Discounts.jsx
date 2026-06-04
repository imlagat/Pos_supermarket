import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Tag, Plus, Edit2, Trash2, Search } from 'lucide-react';

export default function Discounts() {
  const [discounts, setDiscounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: '',
    type: 'percentage',
    value: '',
    product_id: '',
    category: '',
    min_quantity: 1,
    free_quantity: 1,
    discount_percentage: '',
    starts_at: '',
    ends_at: '',
    is_active: true,
    days_left_min: '',
    days_left_max: '',
  });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchDiscounts(); fetchProducts(); }, []);

  const fetchDiscounts = async () => {
    try { const res = await api.get('/discount-rules'); setDiscounts(res.data); } catch (err) { toast.error('Failed to load discounts'); }
  };
  const fetchProducts = async () => {
    try { const res = await api.get('/products'); setProducts(res.data); } catch (err) { toast.error('Failed to load products'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let payload = { name: form.name, type: form.type, is_active: form.is_active, starts_at: form.starts_at || null, ends_at: form.ends_at || null };
      if (form.type === 'bogo') {
        payload = { ...payload, product_id: form.product_id, min_quantity: form.min_quantity, free_quantity: form.free_quantity, discount_percentage: form.discount_percentage || 100 };
      } else if (form.type === 'percentage' || form.type === 'fixed') {
        payload = { ...payload, value: form.value, product_id: form.product_id || null, category: form.category || null };
      } else if (form.type === 'expiry_markdown') {
        payload = { ...payload, discount_percentage: form.discount_percentage, days_left_min: form.days_left_min || 0, days_left_max: form.days_left_max || 7 };
      } else if (form.type === 'seasonal') {
        payload = { ...payload, discount_percentage: form.discount_percentage, product_id: form.product_id || null, category: form.category || null };
      } else if (form.type === 'member_tier') {
        payload = { ...payload, tier: form.tier, discount_percentage: form.discount_percentage };
      }
      if (editing) {
        await api.put(`/discount-rules/${editing}`, payload);
        toast.success('Updated');
      } else {
        await api.post('/discount-rules', payload);
        toast.success('Created');
      }
      fetchDiscounts();
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error');
    } finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({ name: '', type: 'percentage', value: '', product_id: '', category: '', min_quantity: 1, free_quantity: 1, discount_percentage: '', starts_at: '', ends_at: '', is_active: true, days_left_min: '', days_left_max: '' });
    setEditing(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return;
    try { await api.delete(`/discount-rules/${id}`); toast.success('Deleted'); fetchDiscounts(); } catch (err) { toast.error('Delete failed'); }
  };

  const handleEdit = (d) => {
    setEditing(d.id);
    setForm({
      name: d.name,
      type: d.type,
      value: d.value || '',
      product_id: d.product_id || '',
      category: d.category || '',
      min_quantity: d.min_quantity || 1,
      free_quantity: d.free_quantity || 1,
      discount_percentage: d.discount_percentage || '',
      starts_at: d.starts_at ? d.starts_at.slice(0, 16) : '',
      ends_at: d.ends_at ? d.ends_at.slice(0, 16) : '',
      is_active: d.is_active,
      days_left_min: d.days_left_min || '',
      days_left_max: d.days_left_max || '',
    });
  };

  const filtered = discounts.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const getDetails = (d) => {
    if (d.type === 'bogo') return `Buy ${d.min_quantity} Get ${d.free_quantity} (${d.discount_percentage}% off)`;
    if (d.type === 'expiry_markdown') return `${d.discount_percentage}% off expiring in ${d.days_left_min}-${d.days_left_max} days`;
    if (d.type === 'member_tier') return `${d.tier} tier: ${d.discount_percentage}% off`;
    if (d.type === 'percentage') return d.value ? `${d.value}%` : `${d.discount_percentage}%`;
    if (d.type === 'fixed') return `Ksh ${d.value}`;
    return `${d.discount_percentage}%`;
  };

  const getTarget = (d) => {
    if (d.product_id) return products.find(p => p.id == d.product_id)?.name || 'Product';
    if (d.category) return d.category;
    return 'All Products';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Tag className="text-amber-500" /> Promotion Engine Rules</h1>
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border rounded-xl" /></div>
      </div>
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4"><Plus className="inline text-amber-500" /> {editing ? 'Edit' : 'Create'} Promotion Rule</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium">Rule Name</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border p-2 rounded-xl w-full" required /></div>
            <div><label className="block text-sm font-medium">Promotion Type</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="border p-2 rounded-xl w-full"><option value="percentage">Percentage (%)</option><option value="fixed">Fixed Amount (Ksh)</option><option value="bogo">Buy One Get One (BOGO)</option><option value="expiry_markdown">Expiry Markdown</option><option value="seasonal">Seasonal Discount</option><option value="member_tier">Member Tier Discount</option></select></div>
            {(form.type === 'percentage' || form.type === 'fixed' || form.type === 'seasonal') && (
              <div><label className="block text-sm font-medium">Target Product (optional)</label><select value={form.product_id} onChange={e => setForm({...form, product_id: e.target.value})} className="border p-2 rounded-xl w-full"><option value="">All Products</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            )}
            {(form.type === 'percentage' || form.type === 'fixed' || form.type === 'seasonal') && (
              <div><label className="block text-sm font-medium">Target Category (optional)</label><input type="text" placeholder="e.g., Beverages" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="border p-2 rounded-xl w-full" /></div>
            )}
            {form.type === 'bogo' && (
              <>
                <div><label className="block text-sm font-medium">Target Product</label><select value={form.product_id} onChange={e => setForm({...form, product_id: e.target.value})} className="border p-2 rounded-xl w-full" required><option value="">Select Product</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <div><label className="block text-sm font-medium">Buy Quantity</label><input type="number" min="1" value={form.min_quantity} onChange={e => setForm({...form, min_quantity: parseInt(e.target.value)})} className="border p-2 rounded-xl w-full" /></div>
                <div><label className="block text-sm font-medium">Get Quantity</label><input type="number" min="1" value={form.free_quantity} onChange={e => setForm({...form, free_quantity: parseInt(e.target.value)})} className="border p-2 rounded-xl w-full" /></div>
                <div><label className="block text-sm font-medium">Discount %</label><input type="number" step="0.01" min="0" max="100" value={form.discount_percentage} onChange={e => setForm({...form, discount_percentage: parseFloat(e.target.value)})} className="border p-2 rounded-xl w-full" /></div>
              </>
            )}
            {(form.type === 'percentage' || form.type === 'fixed') && (
              <div><label className="block text-sm font-medium">{form.type === 'percentage' ? 'Percentage (%)' : 'Amount (Ksh)'}</label><input type="number" step="0.01" value={form.value} onChange={e => setForm({...form, value: e.target.value})} className="border p-2 rounded-xl w-full" required /></div>
            )}
            {(form.type === 'expiry_markdown' || form.type === 'seasonal') && (
              <div><label className="block text-sm font-medium">Discount (%)</label><input type="number" step="0.01" min="0" max="100" value={form.discount_percentage} onChange={e => setForm({...form, discount_percentage: parseFloat(e.target.value)})} className="border p-2 rounded-xl w-full" required /></div>
            )}
            {form.type === 'expiry_markdown' && (
              <>
                <div><label className="block text-sm font-medium">Days Left (Min)</label><input type="number" min="0" value={form.days_left_min} onChange={e => setForm({...form, days_left_min: parseInt(e.target.value)})} className="border p-2 rounded-xl w-full" placeholder="e.g., 0" /></div>
                <div><label className="block text-sm font-medium">Days Left (Max)</label><input type="number" min="1" value={form.days_left_max} onChange={e => setForm({...form, days_left_max: parseInt(e.target.value)})} className="border p-2 rounded-xl w-full" placeholder="e.g., 7" /></div>
              </>
            )}
            {form.type === 'member_tier' && (
              <>
                <div><label className="block text-sm font-medium">Tier</label><select value={form.tier} onChange={e => setForm({...form, tier: e.target.value})} className="border p-2 rounded-xl w-full"><option value="bronze">Bronze</option><option value="silver">Silver</option><option value="gold">Gold</option></select></div>
                <div><label className="block text-sm font-medium">Discount (%)</label><input type="number" step="0.01" min="0" max="100" value={form.discount_percentage} onChange={e => setForm({...form, discount_percentage: parseFloat(e.target.value)})} className="border p-2 rounded-xl w-full" required /></div>
              </>
            )}
            <div><label className="block text-sm font-medium">Start Date</label><input type="datetime-local" value={form.starts_at} onChange={e => setForm({...form, starts_at: e.target.value})} className="border p-2 rounded-xl w-full" /></div>
            <div><label className="block text-sm font-medium">End Date</label><input type="datetime-local" value={form.ends_at} onChange={e => setForm({...form, ends_at: e.target.value})} className="border p-2 rounded-xl w-full" /></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} /><label>Rule Active</label></div>
          </div>
          <div><button type="submit" className="bg-amber-500 text-white px-6 py-2 rounded-xl">Save Rule</button></div>
        </form>
      </div>
      <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Type</th>
              <th className="p-4">Target</th>
              <th className="p-4">Details</th>
              <th className="p-4">Active</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-b">
                <td className="p-4">{d.name}</td>
                <td className="p-4 capitalize">{d.type}</td>
                <td className="p-4">{getTarget(d)}</td>
                <td className="p-4">{getDetails(d)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${d.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {d.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4">
                  <button onClick={() => handleEdit(d)} className="text-blue-600 mr-2">Edit</button>
                  <button onClick={() => handleDelete(d.id)} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
