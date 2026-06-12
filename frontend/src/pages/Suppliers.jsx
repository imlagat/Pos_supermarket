import { useEffect, useState } from 'react';
import PageLoader from '../components/common/PageLoader';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Truck, Plus, Edit2, Trash2, Search, X, FileText, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({ name: '', contact_person: '', phone: '', email: '', address: '' });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierOrders, setSupplierOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [receiveModal, setReceiveModal] = useState({ show: false, order: null, items: [], agreed_price: '', paid_amount: '' });
  const [receiving, setReceiving] = useState(false);

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/suppliers');
      setSuppliers(res.data);
    } catch (err) {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || form.name.trim() === '') {
      return toast.error('Supplier Name is required.');
    }
    if (!form.contact_person || form.contact_person.trim() === '') {
      return toast.error('Contact Person is required.');
    }
    if (!form.email || form.email.trim() === '') {
      return toast.error('Email is required.');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      return toast.error('Please enter a valid email address.');
    }
    if (!form.phone || form.phone.trim() === '') {
      return toast.error('Phone number is required.');
    }
    const phoneRegex = /^[0-9\+\-\s\(\)]{7,15}$/;
    if (!phoneRegex.test(form.phone)) {
      return toast.error('Please enter a valid phone number.');
    }
    if (!form.address || form.address.trim() === '') {
      return toast.error('Address is required.');
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/suppliers/${editing}`, form);
        toast.success('Supplier updated');
      } else {
        await api.post('/suppliers', form);
        toast.success('Supplier created');
      }
      fetchSuppliers();
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving supplier');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({ name: '', contact_person: '', phone: '', email: '', address: '' });
    setEditing(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this supplier?')) return;
    try {
      await api.delete(`/suppliers/${id}`);
      toast.success('Deleted');
      fetchSuppliers();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleEdit = (supplier) => {
    setEditing(supplier.id);
    setForm({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
    });
  };

  const handleViewOrders = async (supplier) => {
    setSelectedSupplier(supplier);
    setOrdersLoading(true);
    try {
      const res = await api.get(`/suppliers/${supplier.id}/purchase-orders`);
      setSupplierOrders(res.data);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const openReceiveModal = (order) => {
    const items = order.items.map(item => ({
      id: item.id,
      product_name: item.product?.name || 'Unknown',
      quantity: item.quantity,
      expiry_date: ''
    }));
    setReceiveModal({ 
      show: true, 
      order, 
      items, 
      agreed_price: order.agreed_price || '', 
      paid_amount: order.paid_amount || '' 
    });
  };

  const updateExpiryDate = (idx, value) => {
    const newItems = [...receiveModal.items];
    newItems[idx].expiry_date = value;
    setReceiveModal(prev => ({ ...prev, items: newItems }));
  };

  const handleReceiveConfirm = async () => {
    const invalidItems = receiveModal.items.filter(item => {
      if (item.expiry_date) {
        const selectedDate = new Date(item.expiry_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate <= today;
      }
      return false;
    });

    if (invalidItems.length > 0) {
      return toast.error('Expiry dates must be in the future.');
    }

    setReceiving(true);
    try {
      const payload = {
        items: receiveModal.items.map(item => ({
          id: item.id,
          expiry_date: item.expiry_date || null
        })),
        agreed_price: receiveModal.agreed_price || 0,
        paid_amount: receiveModal.paid_amount || 0
      };
      await api.post(`/purchase-orders/${receiveModal.order.id}/receive`, payload);
      toast.success('Order received – stock updated');
      setReceiveModal({ show: false, order: null, items: [], agreed_price: '', paid_amount: '' });
      // Refresh the orders for the selected supplier
      handleViewOrders(selectedSupplier);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to receive order');
    } finally {
      setReceiving(false);
    }
  };

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.contact_person && s.contact_person.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <PageLoader message="Loading suppliers..." />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Truck className="text-orange-600" /> Suppliers
        </h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-600"
          />
        </div>
      </div>

      <div className="mb-8 space-y-6">
        <div className="flex items-center gap-2">
          <Plus className="text-orange-600 w-6 h-6" />
          <h2 className="text-xl font-bold text-gray-800">{editing ? 'Edit' : 'Add'} Supplier</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-3">Supplier Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
                <input type="text" placeholder="e.g., Fresh Farms Ltd" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person <span className="text-red-500">*</span></label>
                <input type="text" placeholder="e.g., Jane Doe" value={form.contact_person} onChange={e => setForm({...form, contact_person: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                <input type="tel" placeholder="e.g., 0712345678" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                <input type="email" placeholder="e.g., contact@freshfarms.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address <span className="text-red-500">*</span></label>
                <textarea placeholder="e.g., 123 Farm Lane, Agriville" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" rows="2" required />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            {editing && <button type="button" onClick={resetForm} className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition">Cancel</button>}
            <button type="submit" disabled={saving} className="bg-gradient-to-r from-orange-600 to-orange-600 hover:from-orange-700 hover:to-orange-700 text-white px-8 py-2 rounded-xl font-semibold shadow-md transition">{saving ? 'Saving...' : (editing ? 'Update Supplier' : 'Create Supplier')}</button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Contact Person</th>
              <th className="p-4 text-left">Phone</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className={`border-b transition cursor-pointer ${selectedSupplier?.id === s.id ? 'bg-orange-50 border-l-4 border-l-orange-600' : 'hover:bg-gray-50'}`} onClick={() => handleViewOrders(s)}>
                <td className="p-4 font-medium">{s.name}</td>
                <td className="p-4">{s.contact_person || '-'}</td>
                <td className="p-4">{s.phone || '-'}</td>
                <td className="p-4">{s.email || '-'}</td>
                <td className="p-4 flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(s); }} className="text-blue-600 hover:text-blue-800 transition"><Edit2 size={18} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} className="text-red-600 hover:text-red-800 transition"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="5" className="text-center p-8 text-gray-400">No suppliers found</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Inline Supplier Orders Section */}
      {selectedSupplier && (
        <div className="mt-8 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden" id="supplier-orders-section">
          <div className="flex justify-between items-center p-6 border-b bg-gray-50">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{selectedSupplier.name} - Purchase Orders</h2>
              <p className="text-sm text-gray-500 mt-1">Review history and receive pending orders</p>
            </div>
            <button onClick={() => setSelectedSupplier(null)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-2 rounded-full transition"><ChevronUp size={24} /></button>
          </div>
          
          <div className="p-6 space-y-8 bg-[#F9FAFB]">
            {ordersLoading ? (
              <div className="text-center py-12 text-gray-500">Loading purchase orders...</div>
            ) : supplierOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="text-gray-400 w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-gray-800">No Orders Found</h3>
                <p className="text-gray-500 mt-1">This supplier doesn't have any purchase orders yet.</p>
              </div>
            ) : (
              supplierOrders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 border-b px-6 py-4 flex justify-between items-center flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-800 text-lg">{order.po_number}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${order.status === 'received' ? 'bg-green-100 text-green-700' : order.status === 'cancelled' ? 'bg-red-100 text-red-700' : order.status === 'draft' ? 'bg-gray-200 text-gray-700' : 'bg-yellow-100 text-yellow-800'}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500 font-medium">Created: {new Date(order.created_at).toLocaleDateString()}</span>
                      {order.status === 'pending' && (
                        <button onClick={() => openReceiveModal(order)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition">
                          <CheckCircle size={16} /> Receive Order
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Shipping/Order Details Box */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b">
                        <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Order Details</h4>
                      </div>
                      <div className="p-4 space-y-4 text-sm">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Order Date</label>
                          <div className="border border-gray-200 p-2 rounded-lg bg-gray-50 text-gray-700 font-medium">
                            {new Date(order.order_date).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Expected Delivery</label>
                          <div className="border border-gray-200 p-2 rounded-lg bg-gray-50 text-gray-700 font-medium">
                            {order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : 'Not set'}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Notes</label>
                          <div className="border border-gray-200 p-2 rounded-lg bg-gray-50 text-gray-700 italic min-h-[2.5rem]">
                            {order.notes || 'None'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Info Box */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                        <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Payment Info</h4>
                        <span className="flex gap-2">
                          <span className="text-[#1A1F71] font-bold italic text-xs">VISA</span>
                          <span className="text-[#EB001B] font-bold italic text-xs">MasterCard</span>
                        </span>
                      </div>
                      <div className="p-4 space-y-4 text-sm">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Agreed Price</label>
                          <div className="border border-gray-200 p-2 rounded-lg bg-gray-50 font-semibold text-gray-800 text-right">
                            Ksh {order.agreed_price ? Number(order.agreed_price).toLocaleString() : '0.00'}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Paid Amount</label>
                          <div className="border border-gray-200 p-2 rounded-lg bg-[#F0FDF4] text-green-700 font-semibold text-right">
                            Ksh {order.paid_amount ? Number(order.paid_amount).toLocaleString() : '0.00'}
                          </div>
                        </div>
                        <div className="pt-2">
                          <label className="text-xs text-gray-500 block mb-1">Balance Due</label>
                          <div className="border border-red-200 p-2 rounded-lg bg-red-50 text-red-600 font-bold text-right text-lg">
                            Ksh {order.balance ? Number(order.balance).toLocaleString() : '0.00'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 pb-6">
                     <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide mb-3 border-b pb-2">Products Included</h4>
                     <div className="border border-gray-200 rounded-xl overflow-hidden">
                       <table className="w-full text-sm text-left">
                         <thead className="bg-gray-50 text-gray-500 border-b">
                           <tr>
                             <th className="py-2 px-4 font-medium">Product Name</th>
                             <th className="py-2 px-4 font-medium">Quantity</th>
                             <th className="py-2 px-4 font-medium">Unit Cost</th>
                             <th className="py-2 px-4 font-medium">Line Total</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100">
                           {order.items.map(item => (
                             <tr key={item.id} className="hover:bg-gray-50 transition">
                               <td className="py-2 px-4 text-gray-800 font-medium">{item.product?.name || 'Unknown'}</td>
                               <td className="py-2 px-4 text-gray-600">{item.quantity}</td>
                               <td className="py-2 px-4 text-gray-600">Ksh {Number(item.cost_price).toLocaleString()}</td>
                               <td className="py-2 px-4 text-gray-800 font-semibold">Ksh {(item.quantity * item.cost_price).toLocaleString()}</td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Receive Modal Form */}
      {receiveModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-6 border-b"><h2 className="text-xl font-bold">Receive Purchase Order: {receiveModal.order?.po_number}</h2><button onClick={() => setReceiveModal({ show: false, order: null, items: [], agreed_price: '', paid_amount: '' })} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full"><X size={20} /></button></div>
            <div className="p-6 bg-gray-50 rounded-b-2xl">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Order Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500 block">Supplier</span><span className="font-medium text-gray-800">{receiveModal.order?.supplier?.name}</span></div>
                  <div><span className="text-gray-500 block">Expected Delivery</span><span className="font-medium text-gray-800">{receiveModal.order?.expected_delivery_date ? new Date(receiveModal.order.expected_delivery_date).toLocaleDateString() : 'Not set'}</span></div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center justify-between">
                  Payment Details <span className="text-xs bg-orange-100 text-orange-900 px-2 py-1 rounded">Editable</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Final Agreed Price (Ksh)</label>
                    <input type="number" step="0.01" value={receiveModal.agreed_price} onChange={e => setReceiveModal({...receiveModal, agreed_price: parseFloat(e.target.value) || ''})} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (Ksh)</label>
                    <input type="number" step="0.01" value={receiveModal.paid_amount} onChange={e => setReceiveModal({...receiveModal, paid_amount: parseFloat(e.target.value) || ''})} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                  </div>
                  <div className="col-span-2 mt-2 p-3 bg-gray-50 rounded-lg flex justify-between items-center border">
                    <span className="text-sm text-gray-600 font-medium">Calculated Balance / Deficit:</span>
                    <span className="text-lg font-bold text-red-600">Ksh {((parseFloat(receiveModal.agreed_price) || 0) - (parseFloat(receiveModal.paid_amount) || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Received Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b"><tr><th className="p-3 font-medium text-gray-600 text-sm">Product</th><th className="p-3 font-medium text-gray-600 text-sm">Quantity</th><th className="p-3 font-medium text-gray-600 text-sm">Expiry Date (optional)</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {receiveModal.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-3 font-medium">{item.product_name}</td>
                          <td className="p-3">{item.quantity}</td>
                          <td className="p-3"><input type="date" value={item.expiry_date} onChange={(e) => updateExpiryDate(idx, e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setReceiveModal({ show: false, order: null, items: [], agreed_price: '', paid_amount: '' })} className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-100 transition">Cancel</button>
                <button onClick={handleReceiveConfirm} disabled={receiving} className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-xl font-semibold shadow-md transition">{receiving ? 'Processing...' : 'Confirm Receipt'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
