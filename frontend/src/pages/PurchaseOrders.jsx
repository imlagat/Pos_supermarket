import React, { useEffect, useState } from 'react';
import PageLoader from '../components/common/PageLoader';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ShoppingCart, Plus, CheckCircle, Search, X } from 'lucide-react';

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPoId, setEditingPoId] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [form, setForm] = useState({
    supplier_id: '',
    order_date: new Date().toISOString().slice(0, 10),
    expected_delivery_date: '',
    notes: '',
    agreed_price: '',
    paid_amount: '',
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

  const handleApprove = async (orderId) => {
    if (!confirm('Approve this AI-generated drafted order? This will send it to the supplier.')) return;
    try {
      await api.post(`/purchase-orders/${orderId}/approve`);
      toast.success('Order approved successfully');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve order');
    }
  };

  const handleDelete = async (orderId) => {
    if (!confirm('Are you sure you want to delete this draft order?')) return;
    try {
      await api.delete(`/purchase-orders/${orderId}`);
      toast.success('Order deleted successfully');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete order');
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

  const handleEdit = (order) => {
    setEditingPoId(order.id);
    setForm({
      supplier_id: order.supplier_id,
      order_date: order.order_date.slice(0, 10),
      expected_delivery_date: order.expected_delivery_date ? order.expected_delivery_date.slice(0, 10) : '',
      notes: order.notes || '',
      items: order.items.map(i => ({
        product_id: i.product_id,
        quantity: i.quantity,
        cost_price: i.cost_price,
        expiry_date: i.expiry_date || ''
      })),
      agreed_price: order.agreed_price || '',
      paid_amount: order.paid_amount || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplier_id) {
      return toast.error('Please select a supplier.');
    }
    if (!form.expected_delivery_date) {
      return toast.error('Expected delivery date is required.');
    }
    if (!form.notes || form.notes.trim() === '') {
      return toast.error('Notes are required.');
    }
    const validItems = form.items.filter(i => i.product_id && i.quantity && i.cost_price);
    if (validItems.length === 0) {
      return toast.error('Please add at least one valid item to the order.');
    }
    const hasInvalidQuantities = validItems.some(i => Number(i.quantity) <= 0 || Number(i.cost_price) < 0);
    if (hasInvalidQuantities) {
      return toast.error('Quantities must be greater than 0 and prices cannot be negative.');
    }
    setSaving(true);
    try {
      if (editingPoId) {
        await api.put(`/purchase-orders/${editingPoId}`, {
          supplier_id: form.supplier_id,
          order_date: form.order_date,
          expected_delivery_date: form.expected_delivery_date || null,
          notes: form.notes,
          agreed_price: form.agreed_price || 0,
          paid_amount: form.paid_amount || 0,
          items: form.items.filter(i => i.product_id && i.quantity && i.cost_price)
        });
        toast.success('Purchase order updated');
      } else {
        await api.post('/purchase-orders', {
        supplier_id: form.supplier_id,
        order_date: form.order_date,
        expected_delivery_date: form.expected_delivery_date || null,
        notes: form.notes,
        agreed_price: form.agreed_price || 0,
        paid_amount: form.paid_amount || 0,
        items: form.items.filter(i => i.product_id && i.quantity && i.cost_price)
      });
      toast.success('Purchase order created');
      }
      setShowModal(false);
      setEditingPoId(null);
      resetForm();
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create order');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingPoId(null);
    setForm({
      supplier_id: '',
      order_date: new Date().toISOString().slice(0, 10),
      expected_delivery_date: '',
      notes: '',
      agreed_price: '',
      paid_amount: '',
      items: [{ product_id: '', quantity: 1, cost_price: '', expiry_date: '' }]
    });
  };

  const filteredOrders = orders.filter(o =>
    o.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <PageLoader message="Loading purchase orders..." />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ShoppingCart className="text-orange-600" /> Purchase Orders
        </h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search PO..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border rounded-xl" />
          </div>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-gradient-to-r from-orange-600 to-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
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
              <React.Fragment key={order.id}>
              <tr className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                <td className="p-4 font-medium">{order.po_number}</td>
                <td className="p-4">{order.supplier?.name}</td>
                <td className="p-4">{new Date(order.order_date).toLocaleDateString()}</td>
                <td className="p-4">{order.total_quantity || 0}</td>
                <td className="p-4">Ksh {order.total_amount ? order.total_amount.toLocaleString() : 0}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${order.status === 'received' ? 'bg-green-100 text-green-700' : order.status === 'cancelled' ? 'bg-red-100 text-red-700' : order.status === 'draft' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {order.status}
                  </span>
                </td>
                <td className="p-4 flex gap-2">
                  {order.status === 'draft' && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(order); }} className="text-orange-700 hover:text-orange-900 font-medium text-sm" title="Edit Order">
                        Edit
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleApprove(order.id); }} className="text-orange-600 hover:text-orange-800 font-medium text-sm" title="Accept & Send">
                        Accept & Send
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(order.id); }} className="text-red-600 hover:text-red-800 font-medium text-sm" title="Delete Order">
                        Delete
                      </button>
                    </>
                  )}
                  {order.status === 'pending' && (
                    <button onClick={(e) => { e.stopPropagation(); handleReceive(order.id); }} className="text-green-600 hover:text-green-800" title="Receive Order">
                      <CheckCircle size={18} />
                    </button>
                  )}
                </td>
              </tr>
              {expandedOrder === order.id && (
                <tr className="bg-gray-50">
                  <td colSpan="7" className="p-4 border-b">
                    <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-100">
                      <h4 className="font-semibold text-gray-700 mb-3">Order Items</h4>
                      <table className="w-full text-sm">
                        <thead className="text-gray-500 border-b">
                          <tr>
                            <th className="text-left pb-2">Product</th>
                            <th className="text-left pb-2">Quantity</th>
                            <th className="text-left pb-2">Unit Cost</th>
                            <th className="text-left pb-2">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map(item => (
                            <tr key={item.id} className="border-b last:border-0">
                              <td className="py-2">{item.product?.name || 'Unknown Product'}</td>
                              <td className="py-2">{item.quantity}</td>
                              <td className="py-2">Ksh {item.cost_price}</td>
                              <td className="py-2 font-medium">Ksh {(item.quantity * item.cost_price).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                        <div className="w-64 space-y-2">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Agreed Price:</span>
                            <span className="font-medium text-gray-800">Ksh {order.agreed_price ? order.agreed_price.toLocaleString() : '0.00'}</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Paid Amount:</span>
                            <span className="font-medium text-green-600">Ksh {order.paid_amount ? order.paid_amount.toLocaleString() : '0.00'}</span>
                          </div>
                          <div className="flex justify-between text-base font-bold text-gray-800 pt-2 border-t">
                            <span>Balance:</span>
                            <span className="text-red-600">Ksh {order.balance ? order.balance.toLocaleString() : '0.00'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              </React.Fragment>
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
              <h2 className="text-xl font-bold">{editingPoId ? 'Edit Purchase Order' : 'Create Purchase Order'}</h2>
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
                  <label className="block text-sm font-medium mb-1">Expected Delivery Date <span className="text-red-500">*</span></label>
                  <input type="date" value={form.expected_delivery_date} onChange={e => setForm({...form, expected_delivery_date: e.target.value})} className="border p-2 rounded-xl w-full" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes <span className="text-red-500">*</span></label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="border p-2 rounded-xl w-full" rows="2" required />
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
                  <button type="button" onClick={addItem} className="text-orange-700 text-sm flex items-center gap-1">+ Add Item</button>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h3 className="font-semibold mb-3 text-gray-800 border-b pb-2">Payment Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agreed Price (Ksh)</label>
                    <input type="number" step="0.01" value={form.agreed_price} onChange={e => setForm({...form, agreed_price: parseFloat(e.target.value) || ''})} className="border border-gray-300 p-2 rounded-xl w-full focus:ring-2 focus:ring-orange-600 outline-none" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount (Ksh)</label>
                    <input type="number" step="0.01" value={form.paid_amount} onChange={e => setForm({...form, paid_amount: parseFloat(e.target.value) || ''})} className="border border-gray-300 p-2 rounded-xl w-full focus:ring-2 focus:ring-orange-600 outline-none" placeholder="0.00" />
                  </div>
                  <div className="md:col-span-2 pt-2 flex justify-end">
                     <div className="bg-white px-4 py-2 rounded-xl border shadow-sm">
                       <span className="text-sm text-gray-600 font-medium mr-4">Balance Due:</span>
                       <span className="text-lg font-bold text-red-600">
                         Ksh {((parseFloat(form.agreed_price) || 0) - (parseFloat(form.paid_amount) || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}
                       </span>
                     </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button type="submit" disabled={saving} className="bg-gradient-to-r from-orange-600 to-orange-600 text-white px-6 py-2 rounded-xl font-semibold">{saving ? 'Saving...' : (editingPoId ? 'Update PO' : 'Create PO')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
