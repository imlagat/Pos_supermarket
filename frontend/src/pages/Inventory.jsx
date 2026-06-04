import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Package, AlertTriangle, Calendar, Plus } from 'lucide-react';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ product_id: '', expiry_date: '', quantity: '' });
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchAlerts();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/batches', form);
      toast.success('Batch added successfully');
      setForm({ product_id: '', expiry_date: '', quantity: '' });
      fetchAlerts();
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
        <Package className="text-amber-500" /> Inventory Management
      </h1>

      {/* Add Batch Form */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Plus className="text-amber-500" /> Add New Batch (Batch # auto-generated)</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={form.product_id}
            onChange={e => setForm({...form, product_id: e.target.value})}
            className="border border-gray-300 p-2 rounded-xl"
            required
          >
            <option value="">Select Product</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
            ))}
          </select>
          <input
            type="date"
            placeholder="Expiry Date"
            value={form.expiry_date}
            onChange={e => setForm({...form, expiry_date: e.target.value})}
            className="border border-gray-300 p-2 rounded-xl"
            required
          />
          <input
            type="number"
            placeholder="Quantity"
            value={form.quantity}
            onChange={e => setForm({...form, quantity: e.target.value})}
            className="border border-gray-300 p-2 rounded-xl"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2 rounded-xl font-semibold"
          >
            {loading ? 'Adding...' : 'Add Batch'}
          </button>
        </form>
      </div>

      {/* Alerts Section */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><AlertTriangle className="text-amber-500" /> Stock & Expiry Alerts</h2>
        {alerts.length === 0 ? (
          <p className="text-gray-500">No alerts – all good!</p>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border-l-4 border-amber-500">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-800">{alert.product?.name}</p>
                  <p className="text-sm text-amber-600">
                    {alert.type === 'low_stock' ? '⚠️ Below minimum stock' : `⏰ Expires on ${new Date(alert.batch?.expiry_date).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
