import { useEffect, useState } from 'react';
import PageLoader from '../components/common/PageLoader';
import api from '../services/api';
import toast from 'react-hot-toast';
import { RefreshCw, Search, Tag, Trash2, X, Settings } from 'lucide-react';

export default function Returns() {
  const [activeTab, setActiveTab] = useState('process');
  const [returns, setReturns] = useState([]);
  const [returnedItems, setReturnedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchOrder, setSearchOrder] = useState('');
  const [foundOrder, setFoundOrder] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [reason, setReason] = useState('');
  const [warrantyOk, setWarrantyOk] = useState(false);
  const [refundMethod, setRefundMethod] = useState('cash');
  const [processing, setProcessing] = useState(false);
  const [restockingFee, setRestockingFee] = useState(0);
  const [incurredExpense, setIncurredExpense] = useState(0);
  const [systemSettings, setSystemSettings] = useState({});
  const [evidenceImage, setEvidenceImage] = useState(null);
  const [evidencePreview, setEvidencePreview] = useState(null);

  // For returned items actions (Goods Engine)
  const [actionItem, setActionItem] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [openBoxPrice, setOpenBoxPrice] = useState('');
  const [openBoxDiscount, setOpenBoxDiscount] = useState(50);
  const [disposeReason, setDisposeReason] = useState('');

  useEffect(() => {
    fetchReturns();
    fetchReturnedItems();
    api.get('/settings').then(res => setSystemSettings(res.data)).catch(() => {});
  }, []);

  const fetchReturns = async () => {
    try {
      const res = await api.get('/returns');
      setReturns(res.data);
    } catch (err) { toast.error('Failed to load returns'); }
  };

  const fetchReturnedItems = async () => {
    try {
      const res = await api.get('/returned-items');
      setReturnedItems(res.data);
    } finally {
      setLoading(false);
    }
  };

  // ----- Order Search for Process Return -----
  const searchOrderByNumber = async () => {
    if (!searchOrder) return;
    try {
      const [ordersRes, returnsRes] = await Promise.all([
        api.get('/orders'),
        api.get('/returns')
      ]);
      const order = ordersRes.data.find(o => o.order_number === searchOrder);
      if (order) {
        const orderDate = new Date(order.created_at);
        const now = new Date();
        const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);
        if (diffDays > 3) {
          toast.error('This order is older than 3 days and cannot be returned');
          setFoundOrder(null);
          return;
        }
        const orderReturns = returnsRes.data.filter(r => r.order_id === order.id);
        const returnedQuantities = {};
        orderReturns.forEach(ret => {
          const items = Array.isArray(ret.items) ? ret.items : JSON.parse(ret.items);
          items.forEach(item => {
            returnedQuantities[item.product_id] = (returnedQuantities[item.product_id] || 0) + item.quantity;
          });
        });
        const items = order.items.map(item => {
          const alreadyReturned = returnedQuantities[item.product_id] || 0;
          const maxAvailable = Math.max(0, item.quantity - alreadyReturned);
          
          const cat = (item.product?.category || '').toLowerCase();
          const returnableCats = ['electronic', 'household', 'clothing'];
          const isReturnable = returnableCats.some(c => cat.includes(c));

          return {
            product_id: item.product_id,
            name: item.product?.name || 'Unknown',
            unit_price: item.unit_price,
            max_quantity: maxAvailable,
            is_returnable: isReturnable,
            selected: false,
            quantity: 0
          };
        });
        setFoundOrder(order);
        setSelectedItems(items);
        const hasElectronics = items.some(i => i.name.toLowerCase().includes('electronic') || i.name.toLowerCase().includes('laptop') || i.name.toLowerCase().includes('phone'));
        setRestockingFee(hasElectronics ? 50 : 0);

        if (items.some(i => !i.is_returnable && i.max_quantity > 0)) {
          toast.error('This item cannot be returned unless they were bought on the same receipt. Therefore, food products cannot be selected.', { duration: 5000 });
        }
      } else {
        toast.error('Order not found');
        setFoundOrder(null);
      }
    } catch (err) {
      toast.error('Search failed');
    }
  };

  const toggleItem = (index) => {
    const newItems = [...selectedItems];
    newItems[index].selected = !newItems[index].selected;
    if (!newItems[index].selected) newItems[index].quantity = 0;
    setSelectedItems(newItems);
    const hasSelectedElectronics = newItems.some(i => i.selected && (i.name.toLowerCase().includes('electronic') || i.name.toLowerCase().includes('laptop') || i.name.toLowerCase().includes('phone')));
    setRestockingFee(hasSelectedElectronics ? 50 : 0);
  };

  const updateQuantity = (index, value) => {
    const qty = parseInt(value);
    if (isNaN(qty)) return;
    const maxQty = selectedItems[index].max_quantity;
    if (qty < 0 || qty > maxQty) return;
    const newItems = [...selectedItems];
    newItems[index].quantity = qty;
    setSelectedItems(newItems);
  };

  const calculateRefund = () => {
    let totalOriginalPrice = 0;
    for (let item of selectedItems) {
      if (item.selected && item.quantity > 0) {
        totalOriginalPrice += item.unit_price * item.quantity;
      }
    }
    const taxRate = systemSettings.tax_rate !== undefined ? systemSettings.tax_rate : 16;
    const vatDeduction = totalOriginalPrice * (taxRate / 100);
    const finalRefund = Math.max(0, totalOriginalPrice - restockingFee - incurredExpense - vatDeduction);
    return { totalOriginalPrice, finalRefund, vatDeduction };
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEvidenceImage(reader.result);
        setEvidencePreview(URL.createObjectURL(file));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    const selected = selectedItems.filter(i => i.selected && i.quantity > 0).map(i => ({
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price: i.unit_price
    }));
    if (selected.length === 0) {
      toast.error('Select at least one item to return');
      return;
    }
    if (!reason || reason.trim() === '') {
      toast.error('Please provide a reason for the return.');
      return;
    }
    const { finalRefund } = calculateRefund();
    if (finalRefund <= 0) {
      toast.error('Refund amount must be positive');
      return;
    }
    setProcessing(true);
    try {
      const payload = {
        order_id: foundOrder.id,
        items: selected,
        reason: reason,
        refund_amount: finalRefund,
        refund_method: refundMethod,
        warranty_ok: warrantyOk,
        restocking_fee: restockingFee,
        incurred_expense: incurredExpense,
        image: evidenceImage || null
      };
      await api.post('/returns', payload);
      toast.success('Return processed successfully');
      setFoundOrder(null);
      setSearchOrder('');
      setSelectedItems([]);
      setReason('');
      setWarrantyOk(false);
      setRestockingFee(0);
      setIncurredExpense(0);
      setEvidenceImage(null);
      setEvidencePreview(null);
      fetchReturns();
      fetchReturnedItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Return failed');
    } finally {
      setProcessing(false);
    }
  };

  // ----- Returned Goods Engine Actions -----
  const handleOpenBox = async (item) => {
    if (!openBoxPrice || parseFloat(openBoxPrice) <= 0) {
      toast.error('Enter a valid price');
      return;
    }
    try {
      await api.post(`/returned-items/${item.id}/open-box`, { open_box_price: openBoxPrice });
      toast.success('Item marked as open box');
      resetActionModal();
      fetchReturnedItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleDispose = async (item) => {
    if (!disposeReason.trim()) {
      toast.error('Enter a disposal reason');
      return;
    }
    try {
      await api.post(`/returned-items/${item.id}/dispose`, { disposal_reason: disposeReason });
      toast.success('Item disposed');
      resetActionModal();
      fetchReturnedItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const resetActionModal = () => {
    setActionItem(null);
    setActionType(null);
    setOpenBoxPrice('');
    setOpenBoxDiscount(50);
    setDisposeReason('');
  };

  const updateOpenBoxPriceFromDiscount = (discountPercent) => {
    if (!actionItem) return;
    const originalPrice = actionItem.product?.base_price || 0;
    const newPrice = originalPrice * (1 - discountPercent / 100);
    setOpenBoxPrice(newPrice.toFixed(2));
    setOpenBoxDiscount(discountPercent);
  };

  const engineItems = returnedItems.filter(i => (i.status === 'pending' || i.status === 'open_box') && i.quantity > 0);
  const imageUrl = (path) => path ? `http://localhost:8000/storage/${path}` : null;

  if (loading) return <PageLoader message="Loading..." />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <RefreshCw className="text-orange-600" /> Returns Management
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button onClick={() => setActiveTab('process')} className={`px-6 py-2 text-sm font-semibold rounded-t-lg transition ${activeTab === 'process' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Process Return</button>
        <button onClick={() => setActiveTab('items')} className={`px-6 py-2 text-sm font-semibold rounded-t-lg transition ${activeTab === 'items' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Returned Items List</button>
        <button onClick={() => setActiveTab('engine')} className={`px-6 py-2 text-sm font-semibold rounded-t-lg transition ${activeTab === 'engine' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><Settings size={16} className="inline mr-1" /> Returned Goods Engine</button>
      </div>

      {/* Process Return Tab */}
      {activeTab === 'process' && (
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex gap-4 mb-4">
            <input type="text" placeholder="Enter Order Number (e.g., ORD-XXXX)" value={searchOrder} onChange={e => setSearchOrder(e.target.value)} className="border p-2 rounded-xl flex-1" />
            <button onClick={searchOrderByNumber} className="bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"><Search size={18} /> Search Order</button>
          </div>
          {foundOrder && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-lg">Order: {foundOrder.order_number}</h3>
              <p>Customer: {foundOrder.customer?.name || 'Walk-in'}</p>
              <p>Date: {new Date(foundOrder.created_at).toLocaleString()}</p>
              <div className="overflow-x-auto mt-4">
                <table className="w-full border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left">Product</th>
                      <th className="p-2 text-left">Max Qty</th>
                      <th className="p-2 text-left">Return?</th>
                      <th className="p-2 text-left">Qty to Return</th>
                      <th className="p-2 text-left">Unit Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.map((item, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2">{item.name}</td>
                        <td className="p-2">{item.max_quantity}</td>
                        <td className="p-2">
                          <input type="checkbox" checked={item.selected} onChange={() => toggleItem(idx)} disabled={item.max_quantity === 0 || !item.is_returnable} />
                        </td>
                        <td className="p-2">
                          <input type="number" min="0" max={item.max_quantity} value={item.quantity} onChange={(e) => updateQuantity(idx, e.target.value)} disabled={!item.selected || item.max_quantity === 0 || !item.is_returnable} className="w-20 border p-1 rounded disabled:bg-gray-100" />
                        </td>
                        <td className="p-2">Ksh {item.unit_price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-3 bg-orange-50 rounded-xl flex justify-between"><span>Restocking fee:</span><span className="font-semibold">Ksh {restockingFee}</span></div>
              <div className="mt-2 p-3 bg-slate-50 rounded-xl flex justify-between"><span>VAT Deduction ({systemSettings.tax_rate !== undefined ? systemSettings.tax_rate : 16}%):</span><span className="font-semibold">Ksh {calculateRefund().vatDeduction.toFixed(2)}</span></div>
              <div className="mt-2">
                <label className="block text-sm font-medium mb-1">Incurred Expense (e.g., shipping, handling)</label>
                <input
                  type="number"
                  step="0.01"
                  value={incurredExpense}
                  onChange={e => setIncurredExpense(parseFloat(e.target.value) || 0)}
                  className="border p-2 rounded-xl w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0.00"
                />
              </div>
              <div className="mt-2 p-3 bg-green-50 rounded-xl flex justify-between"><span>Total refund after fees & deductions:</span><span className="font-bold text-green-700">Ksh {calculateRefund().finalRefund.toFixed(2)}</span></div>

              {/* Evidence Image Upload */}
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Upload Evidence (Photo of damage/defect)</label>
                <input type="file" accept="image/*" onChange={handleImageChange} className="border p-2 rounded-xl w-full" />
                {evidencePreview && (
                  <div className="mt-2">
                    <img src={evidencePreview} alt="Evidence" className="w-32 h-32 object-cover rounded border" />
                    <button onClick={() => { setEvidenceImage(null); setEvidencePreview(null); }} className="text-red-500 text-sm mt-1">Remove</button>
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Reason <span className="text-red-500">*</span></label><textarea value={reason} onChange={e => setReason(e.target.value)} className="border p-2 rounded-xl w-full" rows="2" required /></div>
                <div><label className="block text-sm font-medium mb-1">Refund Method</label><select value={refundMethod} onChange={e => setRefundMethod(e.target.value)} className="border p-2 rounded-xl w-full"><option value="cash">Cash</option><option value="mpesa">M-Pesa</option><option value="card">Card</option><option value="credit_note">Credit Note</option></select></div>
              </div>
              <div className="mt-4 flex items-center gap-2"><input type="checkbox" checked={warrantyOk} onChange={e => setWarrantyOk(e.target.checked)} id="warranty" /><label htmlFor="warranty" className="text-sm">Warranty valid (for electronics)</label></div>
              <button onClick={handleSubmit} disabled={processing} className="mt-4 bg-red-600 text-white px-6 py-2 rounded-xl">{processing ? 'Processing...' : 'Process Return'}</button>
            </div>
          )}
        </div>
      )}

      {/* Returned Items List Tab */}
      {activeTab === 'items' && (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4">Product</th>
                  <th>Quantity</th>
                  <th>Condition</th>
                  <th>Status</th>
                  <th>Open Box Price</th>
                  <th>Disposal Reason</th>
                  <th>Return Image</th>
                </tr>
              </thead>
              <tbody>
                {returnedItems.map(item => {
                  const parentReturn = returns.find(r => r.id === item.return_id);
                  return (
                    <tr key={item.id} className="border-b">
                      <td className="p-4">{item.product?.name}</td>
                      <td className="p-4">{item.quantity}</td>
                      <td className="p-4 capitalize">{item.condition}</td>
                      <td className="p-4 capitalize">{item.status}</td>
                      <td className="p-4">{item.open_box_price ? `Ksh ${item.open_box_price}` : '-'}</td>
                      <td className="p-4">{item.disposal_reason || '-'}</td>
                      <td className="p-4">{parentReturn?.image_path ? <a href={imageUrl(parentReturn.image_path)} target="_blank" className="text-orange-600 underline">View</a> : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Returned Goods Engine Tab – without Upload Image */}
      {activeTab === 'engine' && (
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Settings size={18} className="text-orange-600" /> Pending Returned Items – Vet & Decide</h2>
          {engineItems.length === 0 ? <p className="text-gray-500">No pending returned items.</p> : (
            <div className="space-y-4">
              {engineItems.map(item => (
                <div key={item.id} className="border rounded-xl p-4 flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <p className="font-semibold">{item.product?.name} {item.status === 'open_box' && '(Open Box)'}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    {item.status === 'open_box' && <p className="text-sm text-orange-600">Current Price: Ksh {item.open_box_price}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setActionItem(item); setActionType('openbox'); setOpenBoxPrice(item.open_box_price || (item.product?.base_price * 0.5).toFixed(2)); setOpenBoxDiscount(item.open_box_price ? (100 - (item.open_box_price / item.product?.base_price * 100)) : 50); }} className="bg-orange-600 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"><Tag size={14} /> {item.status === 'open_box' ? 'Edit Price' : 'Open Box'}</button>
                    <button onClick={() => { setActionItem(item); setActionType('dispose'); }} className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"><Trash2 size={14} /> Dispose</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals for Open Box / Dispose */}
      {actionItem && actionType === 'openbox' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Mark as Open Box</h3><button onClick={resetActionModal}><X size={20} /></button></div>
            <p><strong>Product:</strong> {actionItem.product?.name}</p><p><strong>Original Price:</strong> Ksh {actionItem.product?.base_price}</p>
            <label className="block mt-4 mb-1">Discount (%)</label>
            <input type="range" min="0" max="100" value={openBoxDiscount} onChange={e => updateOpenBoxPriceFromDiscount(parseInt(e.target.value))} className="w-full" />
            <div className="flex gap-2 mt-2"><input type="number" step="0.01" value={openBoxPrice} onChange={e => setOpenBoxPrice(e.target.value)} className="border p-2 rounded-xl flex-1" /><span className="text-sm self-center">Ksh</span></div>
            <button onClick={() => handleOpenBox(actionItem)} className="mt-4 bg-orange-600 text-white px-4 py-2 rounded-xl w-full">Save Open Box Price</button>
          </div>
        </div>
      )}
      {actionItem && actionType === 'dispose' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Dispose Item</h3><button onClick={resetActionModal}><X size={20} /></button></div>
            <p><strong>Product:</strong> {actionItem.product?.name}</p>
            <label className="block mt-4 mb-1">Reason for disposal</label>
            <textarea value={disposeReason} onChange={e => setDisposeReason(e.target.value)} className="border p-2 rounded-xl w-full" rows="3" />
            <button onClick={() => handleDispose(actionItem)} className="mt-4 bg-red-600 text-white px-4 py-2 rounded-xl w-full">Confirm Dispose</button>
          </div>
        </div>
      )}
    </div>
  );
}
