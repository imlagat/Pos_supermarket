import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Package, AlertTriangle, Calendar, Plus } from 'lucide-react';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ product_id: '', expiry_date: '', quantity: '' });
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchAlerts();
    fetchBatches();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      toast.error('Failed to load products');
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/inventory/alerts');
      setAlerts(res.data);
    } catch (err) {
      console.error('Alerts error:', err);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await api.get('/batches');
      setBatches(res.data);
    } catch (err) {
      console.error('Batches fetch error:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.product_id) return toast.error('Please select a product.');
    if (!form.expiry_date) return toast.error('Expiry date is required.');
    
    // Check if expiry date is in the future
    const selectedDate = new Date(form.expiry_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // reset time to start of day
    if (selectedDate <= today) {
      return toast.error('Expiry date must be in the future.');
    }
    
    if (!form.quantity || Number(form.quantity) <= 0) return toast.error('Quantity must be greater than 0.');

    setLoading(true);
    try {
      await api.post('/batches', form);
      toast.success('Batch added successfully');
      setForm({ product_id: '', expiry_date: '', quantity: '' });
      fetchAlerts();
      fetchBatches();
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to add batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Package className="text-orange-600" /> Inventory Management
      </h1>

      {/* Add Batch Form */}
      <div className="mb-8 space-y-6">
        <div className="flex items-center gap-2">
          <Plus className="text-orange-600 w-6 h-6" />
          <h2 className="text-xl font-bold text-gray-800">Add New Batch</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-3">Batch Details <span className="text-sm font-normal text-gray-500 ml-2">(Batch # auto-generated)</span></h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
                <select
                  value={form.product_id}
                  onChange={e => setForm({...form, product_id: e.target.value})}
                  className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none"
                  required
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={form.expiry_date}
                  onChange={e => setForm({...form, expiry_date: e.target.value})}
                  className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  placeholder="e.g., 50"
                  value={form.quantity}
                  onChange={e => setForm({...form, quantity: e.target.value})}
                  className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none"
                  required
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-orange-600 to-orange-600 hover:from-orange-700 hover:to-orange-700 text-white px-8 py-2 rounded-xl font-semibold shadow-md transition"
            >
              {loading ? 'Adding...' : 'Add Batch'}
            </button>
          </div>
        </form>
      </div>

      {/* Alerts Section */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 flex flex-col max-h-[300px]">
        <h2 className="text-lg font-semibold mb-4 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-orange-600" /> Stock & Expiry Alerts
          </div>
          {alerts.length > 0 && <span className="text-sm font-normal bg-orange-100 text-orange-800 px-3 py-1 rounded-full">{alerts.length} Alerts</span>}
        </h2>
        <div className="overflow-y-auto flex-1 pr-2">
          {alerts.length === 0 ? (
            <p className="text-gray-500">No alerts – all good!</p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl border-l-4 border-orange-600">
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-800">{alert.product?.name}</p>
                    <p className="text-sm text-orange-700">
                      {alert.type === 'low_stock' ? '⚠️ Below minimum stock' : `⏰ Expires on ${new Date(alert.batch?.expiry_date).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-[500px]">
        <h2 className="text-lg font-semibold p-4 border-b shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="text-orange-600" /> Batch Tracking
          </div>
          <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{batches.length} Batches</span>
        </h2>
        <div className="overflow-auto flex-1">
          <table className="w-full text-left relative">
            <thead className="bg-gray-50 border-b text-gray-600 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-4">Product Name</th>
                <th className="p-4">Batch Number</th>
                <th className="p-4">Arrival Date</th>
                <th className="p-4">Expiry Date</th>
                <th className="p-4">Remaining Qty</th>
              </tr>
            </thead>
          <tbody className="divide-y divide-gray-100">
            {batches.map(b => (
              <tr key={b.id} className="hover:bg-gray-50 transition">
                <td className="p-4 font-medium text-gray-800">{b.product?.name || 'Unknown Product'}</td>
                <td className="p-4 font-mono text-sm text-gray-500">{b.batch_number}</td>
                <td className="p-4">{new Date(b.created_at).toLocaleDateString()}</td>
                <td className="p-4">
                  <span className={new Date(b.expiry_date) < new Date() ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                    {new Date(b.expiry_date).toLocaleDateString()}
                  </span>
                </td>
                <td className="p-4">
                  <span className={b.quantity === 0 ? 'text-red-500 font-bold' : 'text-green-600 font-bold'}>
                    {b.quantity}
                  </span>
                </td>
              </tr>
            ))}
            {batches.length === 0 && (
              <tr><td colSpan="5" className="text-center p-8 text-gray-500">No batches recorded yet.</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
