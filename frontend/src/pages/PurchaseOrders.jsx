import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ShoppingCart, Plus, CheckCircle, Search, X } from 'lucide-react';

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    supplier_id: '',
    order_date: new Date().toISOString().slice(0, 10),
    expected_delivery_date: '',
    notes: '',
    items: [{ product_id: '', quantity: 1, cost_price: '', expiry_date: '' }]
  });
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/purchase-orders');
      setOrders(res.data);
    } catch (err) { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };
  const fetchSuppliers = async () => {
    try { const res = await api.get('/suppliers'); setSuppliers(res.data); } catch (err) { }
  };
  const fetchProducts = async () => {
    try { const res = await api.get('/products'); setProducts(res.data); } catch (err) { }
  };

  const handleReceive = async (orderId) => {
    if (!confirm('Receive this purchase order? Stock will be added.')) return;
    try {
      await api.post(`/purchase-orders/${orderId}/receive`);
      toast.success('Order received – stock updated');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to receive');
    }
  };

  const addItem = () => {
    setForm(prev => ({ ...prev, items: [...prev.items, { product_id: '', quantity: 1, cost_price: '', expiry_date: '' }] }));
  };
  const removeItem = (idx) => {
    if (form.items.length === 1) return;
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };
  const updateItem = (idx, field, value) => {
    const newItems = [...form.items];
    newItems[idx][field] = value;
    setForm(prev => ({ ...prev, items: newItems }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/purchase-orders', {
        supplier_id: form.supplier_id,
        order_date: form.order_date,
        expected_delivery_date: form.expected_delivery_date || null,
        notes: form.notes,
        items: form.items.filter(i => i.product_id && i.quantity && i.cost_price)
      });
      toast.success('Purchase order created');
      setShowModal(false);
      resetForm();
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create order');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({
      supplier_id: '',
      order_date: new Date().toISOString().slice(0, 10),
      expected_delivery_date: '',
      notes: '',
      items: [{ product_id: '', quantity: 1, cost_price: '', expiry_date: '' }]
    });
  };

  const filteredOrders = orders.filter(o =>
    o.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center items-center h-64">Loading purchase orders...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ShoppingCart className="text-amber-500" /> Purchase Orders
        </h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search PO..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border rounded-xl" />
          </div>
          <button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-xl flex items-center gap-2">
            <Plus size={18} /> New PO
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 text-left">PO Number</th>
              <th className="p-4 text-left">Supplier</th>
              <th className="p-4 text-left">Order Date</th>
              <th className="p-4 text-left">Total Qty</th>
              <th className="p-4 text-left">Total Amount (Ksh)</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium">{order.po_number}</td>
                <td className="p-4">{order.supplier?.name}</td>
                <td className="p-4">{new Date(order.order_date).toLocaleDateString()}</td>
                <td className="p-4">{order.total_quantity || 0}</td>
                <td className="p-4">Ksh {order.total_amount ? order.total_amount.toLocaleString() : 0}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${order.status === 'received' ? 'bg-green-100 text-green-700' : order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {order.status}
                  </span>
                </td>
                <td className="p-4">
                  <button onClick={() => handleReceive(order.id)} disabled={order.status !== 'pending'} className="text-green-600 disabled:opacity-50" title="Receive Order">
                    <CheckCircle size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr><td colSpan="7" className="text-center p-8 text-gray-400">No purchase orders found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for creating PO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Create Purchase Order</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Supplier</label>
                  <select value={form.supplier_id} onChange={e => setForm({...form, supplier_id: e.target.value})} className="border p-2 rounded-xl w-full" required>
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Order Date</label>
                  <input type="date" value={form.order_date} onChange={e => setForm({...form, order_date: e.target.value})} className="border p-2 rounded-xl w-full" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expected Delivery Date</label>
                  <input type="date" value={form.expected_delivery_date} onChange={e => setForm({...form, expected_delivery_date: e.target.value})} className="border p-2 rounded-xl w-full" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="border p-2 rounded-xl w-full" rows="2" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Order Items</h3>
                <div className="space-y-3">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-end border-b pb-2">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500">Product</label>
                        <select value={item.product_id} onChange={e => updateItem(idx, 'product_id', e.target.value)} className="border p-2 rounded w-full" required>
                          <option value="">Select Product</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div className="w-24">
                        <label className="block text-xs text-gray-500">Qty</label>
                        <input type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value))} className="border p-2 rounded w-full" required />
                      </div>
                      <div className="w-28">
                        <label className="block text-xs text-gray-500">Cost (Ksh)</label>
                        <input type="number" step="0.01" value={item.cost_price} onChange={e => updateItem(idx, 'cost_price', parseFloat(e.target.value))} className="border p-2 rounded w-full" required />
                      </div>
                      <div className="w-32">
                        <label className="block text-xs text-gray-500">Expiry Date</label>
                        <input type="date" value={item.expiry_date} onChange={e => updateItem(idx, 'expiry_date', e.target.value)} className="border p-2 rounded w-full" />
                      </div>
                      <button type="button" onClick={() => removeItem(idx)} className="text-red-500"><X size={18} /></button>
                    </div>
                  ))}
                  <button type="button" onClick={addItem} className="text-amber-600 text-sm flex items-center gap-1">+ Add Item</button>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button type="submit" disabled={saving} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2 rounded-xl font-semibold">{saving ? 'Saving...' : 'Create PO'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
