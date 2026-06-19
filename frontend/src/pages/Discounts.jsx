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
  const [showForm, setShowForm] = useState(false);
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
    if (!form.name || form.name.trim() === '') {
      return toast.error('Rule Name is required.');
    }
    if ((form.type === 'percentage' || form.type === 'fixed') && (!form.value || Number(form.value) <= 0)) {
      return toast.error(`Please enter a valid ${form.type === 'percentage' ? 'percentage' : 'amount'}.`);
    }
    if (form.type === 'bogo' && !form.product_id) {
      return toast.error('Target Product is required for BOGO.');
    }
    if (!form.starts_at || !form.ends_at) {
      return toast.error('Start Date and End Date are required.');
    }
    if (new Date(form.starts_at) > new Date(form.ends_at)) {
      return toast.error('Start Date cannot be after End Date.');
    }
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
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return;
    try { await api.delete(`/discount-rules/${id}`); toast.success('Deleted'); fetchDiscounts(); } catch (err) { toast.error('Delete failed'); }
  };

  const toggleActive = async (rule) => {
    try {
      await api.put(`/discount-rules/${rule.id}`, { ...rule, is_active: !rule.is_active });
      toast.success(rule.is_active ? 'Rule Deactivated' : 'Rule Activated');
      fetchDiscounts();
    } catch (err) {
      toast.error('Failed to toggle status');
    }
  };

  const handleEdit = (d) => {
    setEditing(d.id);
    setShowForm(true);
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
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Tag className="text-orange-600" /> Promotion Engine Rules</h1>
        <div className="flex gap-2">
          <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-gradient-to-r from-orange-600 to-orange-600 text-white px-3 py-2 rounded-xl flex items-center gap-1">
            <Plus size={18} /> Add Rule
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border rounded-xl" />
          </div>
        </div>
      </div>
      {showForm && (
      <div className="mb-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="text-orange-600 w-6 h-6" />
            <h2 className="text-xl font-bold text-gray-800">{editing ? 'Edit' : 'Create'} Promotion Rule</h2>
          </div>
          <button onClick={resetForm} className="text-gray-500 hover:text-gray-700 font-bold px-2 text-xl">X</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-3">Rule Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
                <input type="text" placeholder="e.g., Summer Sale" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Promotion Type</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (Ksh)</option>
                  <option value="bogo">Buy One Get One (BOGO)</option>
                  <option value="expiry_markdown">Expiry Markdown</option>
                  <option value="seasonal">Seasonal Discount</option>
                  <option value="member_tier">Member Tier Discount</option>
                </select>
              </div>
              
              {(form.type === 'percentage' || form.type === 'fixed' || form.type === 'seasonal') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Product (optional)</label>
                  <select value={form.product_id} onChange={e => setForm({...form, product_id: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none">
                    <option value="">All Products</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
              {(form.type === 'percentage' || form.type === 'fixed' || form.type === 'seasonal') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Category (optional)</label>
                  <input type="text" placeholder="e.g., Beverages" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" />
                </div>
              )}
              {form.type === 'bogo' && (
                <>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Target Product</label><select value={form.product_id} onChange={e => setForm({...form, product_id: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" required><option value="">Select Product</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Buy Quantity</label><input type="number" min="1" value={form.min_quantity} onChange={e => setForm({...form, min_quantity: parseInt(e.target.value)})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Get Quantity</label><input type="number" min="1" value={form.free_quantity} onChange={e => setForm({...form, free_quantity: parseInt(e.target.value)})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label><input type="number" step="0.01" min="0" max="100" value={form.discount_percentage} onChange={e => setForm({...form, discount_percentage: parseFloat(e.target.value)})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" /></div>
                </>
              )}
              {(form.type === 'percentage' || form.type === 'fixed') && (
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{form.type === 'percentage' ? 'Percentage (%)' : 'Amount (Ksh)'}</label><input type="number" step="0.01" value={form.value} onChange={e => setForm({...form, value: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" required /></div>
              )}
              {(form.type === 'expiry_markdown' || form.type === 'seasonal') && (
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label><input type="number" step="0.01" min="0" max="100" value={form.discount_percentage} onChange={e => setForm({...form, discount_percentage: parseFloat(e.target.value)})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" required /></div>
              )}
              {form.type === 'expiry_markdown' && (
                <>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Days Left (Min)</label><input type="number" min="0" value={form.days_left_min} onChange={e => setForm({...form, days_left_min: parseInt(e.target.value)})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" placeholder="e.g., 0" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Days Left (Max)</label><input type="number" min="1" value={form.days_left_max} onChange={e => setForm({...form, days_left_max: parseInt(e.target.value)})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" placeholder="e.g., 7" /></div>
                </>
              )}
              {form.type === 'member_tier' && (
                <>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Tier</label><select value={form.tier} onChange={e => setForm({...form, tier: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none"><option value="bronze">Bronze</option><option value="silver">Silver</option><option value="gold">Gold</option></select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label><input type="number" step="0.01" min="0" max="100" value={form.discount_percentage} onChange={e => setForm({...form, discount_percentage: parseFloat(e.target.value)})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" required /></div>
                </>
              )}
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Date <span className="text-red-500">*</span></label><input type="datetime-local" value={form.starts_at} onChange={e => setForm({...form, starts_at: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">End Date <span className="text-red-500">*</span></label><input type="datetime-local" value={form.ends_at} onChange={e => setForm({...form, ends_at: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" required /></div>
              <div className="md:col-span-2 flex items-center gap-2 mt-2">
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="w-4 h-4 text-orange-600 focus:ring-orange-600 rounded" />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Rule Active</label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={resetForm} className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={loading} className="bg-gradient-to-r from-orange-600 to-orange-600 hover:from-orange-700 hover:to-orange-700 text-white px-8 py-2 rounded-xl font-semibold shadow-md transition">{loading ? 'Saving...' : (editing ? 'Update Rule' : 'Create Rule')}</button>
          </div>
        </form>
      </div>
      )}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Tag className="text-orange-500 w-5 h-5" />
          <h2 className="font-bold text-gray-800 text-lg">Active Promotions & Discounts</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => {
            const isExpired = d.ends_at && new Date(d.ends_at) < new Date();
            const isAI = d?.name?.startsWith('Flash Sale:') || d?.name?.startsWith('Clearance:');
            
            return (
              <div key={d.id} className={`border rounded-xl p-4 flex flex-col justify-between ${d.is_active ? 'bg-green-50/70 border-green-100' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${d.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                    <Tag size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold flex items-center gap-2 ${d.is_active ? 'text-green-900' : 'text-gray-700'}`}>
                      {d.name}
                      {isAI && <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded uppercase font-bold">AI</span>}
                    </h3>
                    <p className={`text-sm mt-1 capitalize ${d.is_active ? 'text-green-800' : 'text-gray-600'}`}>Type: {d.type.replace('_', ' ')}</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">
                      Discount: {d.type === 'percentage' || d.type === 'expiry_markdown' || d.type === 'seasonal' || d.type === 'member_tier' 
                        ? (d.value ? `${d.value}%` : `${d.discount_percentage}%`) 
                        : (d.type === 'fixed' ? `Ksh ${d.value}` : `${d.discount_percentage}%`)}
                    </p>
                    {d.type === 'bogo' && (
                      <p className="text-sm font-bold text-orange-600 mt-1">Buy {d.min_quantity}, Get {d.free_quantity} Free</p>
                    )}
                    {d.ends_at && (
                      <p className="text-xs text-gray-500 mt-2">Ends: {new Date(d.ends_at).toLocaleDateString()}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {isExpired && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 uppercase">Expired</span>
                      )}
                      {!d.is_active && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-600 uppercase">Inactive</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`border-t mt-4 pt-3 flex justify-end gap-2 ${d.is_active ? 'border-green-100' : 'border-gray-200'}`}>
                  <button onClick={() => handleEdit(d)} className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-100 transition">
                    Edit
                  </button>
                  <button onClick={() => toggleActive(d)} className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-100 transition">
                    {d.is_active ? 'Inactivate' : 'Activate'}
                  </button>
                  <button onClick={() => handleDelete(d.id)} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition">
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-gray-500">No promotion rules found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
