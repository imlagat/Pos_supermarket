import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Package, AlertTriangle, Plus, CheckCircle, X, ShoppingCart, Truck, Calendar, Bell, Box } from 'lucide-react';

export default function InventoryOrders() {
  // ---------- Inventory state ----------
  const [products, setProducts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(true);

  // ---------- Purchase Order state ----------
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showPOModal, setShowPOModal] = useState(false);
  const [poForm, setPoForm] = useState({
    supplier_id: '',
    order_date: new Date().toISOString().slice(0, 10),
    expected_delivery_date: '',
    notes: '',
    items: [{ product_id: '', quantity: 1, cost_price: '', current_price: 0 }]
  });
  const [savingPO, setSavingPO] = useState(false);

  // Receive modal state
  const [receiveModal, setReceiveModal] = useState({ show: false, order: null, items: [] });
  const [receiving, setReceiving] = useState(false);

  // ---------- Tab state ----------
  const [activeTab, setActiveTab] = useState('inventory');

  useEffect(() => {
    fetchInventoryData();
    fetchPurchaseData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoadingInventory(true);
      const [productsRes, alertsRes] = await Promise.all([
        api.get('/products'),
        api.get('/inventory/alerts')
      ]);
      setProducts(productsRes.data);
      setAlerts(alertsRes.data);
    } catch (err) {
      toast.error('Failed to load inventory');
    } finally {
      setLoadingInventory(false);
    }
  };

  const fetchPurchaseData = async () => {
    try {
      const [ordersRes, suppliersRes] = await Promise.all([
        api.get('/purchase-orders'),
        api.get('/suppliers')
      ]);
      setOrders(ordersRes.data);
      setSuppliers(suppliersRes.data);
    } catch (err) {
      toast.error('Failed to load purchase orders');
    }
  };

  const addPOItem = () => {
    setPoForm(prev => ({ ...prev, items: [...prev.items, { product_id: '', quantity: 1, cost_price: '', current_price: 0 }] }));
  };
  const removePOItem = (idx) => {
    if (poForm.items.length === 1) return;
    setPoForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };
  const updatePOItem = (idx, field, value) => {
    const newItems = [...poForm.items];
    newItems[idx][field] = value;
    if (field === 'product_id') {
      const product = products.find(p => p.id == value);
      newItems[idx].current_price = product ? product.base_price : 0;
    }
    setPoForm(prev => ({ ...prev, items: newItems }));
  };

  const openReceiveModal = (order) => {
    const items = order.items.map(item => ({
      id: item.id,
      product_name: item.product?.name || 'Unknown',
      quantity: item.quantity,
      expiry_date: ''
    }));
    setReceiveModal({ show: true, order, items });
  };

  const updateExpiryDate = (idx, value) => {
    const newItems = [...receiveModal.items];
    newItems[idx].expiry_date = value;
    setReceiveModal(prev => ({ ...prev, items: newItems }));
  };

  const handleReceiveConfirm = async () => {
    setReceiving(true);
    try {
      const payload = {
        items: receiveModal.items.map(item => ({
          id: item.id,
          expiry_date: item.expiry_date || null
        }))
      };
      await api.post(`/purchase-orders/${receiveModal.order.id}/receive`, payload);
      toast.success('Order received – stock updated');
      setReceiveModal({ show: false, order: null, items: [] });
      fetchPurchaseData();
      fetchInventoryData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to receive order');
    } finally {
      setReceiving(false);
    }
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    if (!poForm.supplier_id) {
      toast.error('Select a supplier');
      return;
    }
    const validItems = poForm.items.filter(i => i.product_id && i.quantity && i.cost_price);
    if (validItems.length === 0) {
      toast.error('Add at least one item');
      return;
    }
    setSavingPO(true);
    try {
      await api.post('/purchase-orders', {
        supplier_id: poForm.supplier_id,
        order_date: poForm.order_date,
        expected_delivery_date: poForm.expected_delivery_date || null,
        notes: poForm.notes,
        items: validItems.map(({ product_id, quantity, cost_price }) => ({ product_id, quantity, cost_price }))
      });
      toast.success('Purchase order created');
      setShowPOModal(false);
      setPoForm({
        supplier_id: '',
        order_date: new Date().toISOString().slice(0, 10),
        expected_delivery_date: '',
        notes: '',
        items: [{ product_id: '', quantity: 1, cost_price: '', current_price: 0 }]
      });
      fetchPurchaseData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create PO');
    } finally {
      setSavingPO(false);
    }
  };

  const dueOrders = orders.filter(o => o.status === 'pending' && o.expected_delivery_date &&
    new Date(o.expected_delivery_date) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Package className="text-amber-500" /> Inventory & Orders
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button onClick={() => setActiveTab('inventory')} className={`px-6 py-2 text-sm font-semibold rounded-t-lg transition ${activeTab === 'inventory' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          <Package size={16} className="inline mr-1" /> Stock & Batches
        </button>
        <button onClick={() => setActiveTab('purchaseOrders')} className={`px-6 py-2 text-sm font-semibold rounded-t-lg transition ${activeTab === 'purchaseOrders' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          <ShoppingCart size={16} className="inline mr-1" /> Purchase Orders
        </button>
      </div>

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-8">
          {dueOrders.length > 0 && (
            <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-xl">
              <h3 className="font-semibold flex items-center gap-2 text-amber-800"><Bell size={18} /> Orders Due for Receipt</h3>
              <div className="mt-2 space-y-2">
                {dueOrders.map(order => (
                  <div key={order.id} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                    <div><p className="font-medium">{order.po_number}</p><p className="text-sm text-gray-600">Supplier: {order.supplier?.name} | Expected: {new Date(order.expected_delivery_date).toLocaleDateString()}</p></div>
                    <button onClick={() => openReceiveModal(order)} className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"><CheckCircle size={14} /> Receive Now</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><AlertTriangle className="text-amber-500" /> Stock & Expiry Alerts</h2>
            {alerts.length === 0 ? <p className="text-gray-500">No alerts – all good!</p> : alerts.map((alert, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border-l-4 border-amber-500">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div><p className="font-medium text-gray-800">{alert.product?.name}</p><p className="text-sm text-amber-600">{alert.type === 'low_stock' ? '⚠️ Below minimum stock' : `⏰ Expires on ${new Date(alert.batch?.expiry_date).toLocaleDateString()}`}</p></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <h2 className="text-lg font-semibold p-4 border-b">Product Stock Levels</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50"><tr><th className="p-3 text-left">Name</th><th className="p-3 text-left">SKU</th><th className="p-3 text-left">Price</th><th className="p-3 text-left">Stock</th><th className="p-3 text-left">Min Threshold</th></tr></thead>
                <tbody>{products.slice(0, 10).map(p => (<tr key={p.id} className="border-b"><td className="p-3">{p.name}</td><td className="p-3">{p.sku}</td><td className="p-3">Ksh {p.base_price}</td><td className="p-3">{p.stock_quantity}</td><td className="p-3">{p.min_stock_threshold}</td></tr>))}</tbody>
              </table>
              {products.length > 10 && <p className="p-3 text-center text-gray-500">+ {products.length - 10} more products</p>}
            </div>
          </div>
        </div>
      )}

      {/* Purchase Orders Tab */}
      {activeTab === 'purchaseOrders' && (
        <div>
          <div className="flex justify-end mb-4"><button onClick={() => setShowPOModal(true)} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-xl flex items-center gap-2"><Plus size={18} /> New Purchase Order</button></div>
          <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b"><tr><th className="p-4 text-left">PO Number</th><th className="p-4 text-left">Supplier</th><th className="p-4 text-left">Order Date</th><th className="p-4 text-left">Total Qty</th><th className="p-4 text-left">Total Amount</th><th className="p-4 text-left">Expected Delivery</th><th className="p-4 text-left">Status</th><th className="p-4 text-left">Actions</th></tr></thead>
              <tbody>{orders.map(order => (<tr key={order.id} className="border-b hover:bg-gray-50"><td className="p-4 font-medium">{order.po_number}</td><td>{order.supplier?.name}</td><td>{new Date(order.order_date).toLocaleDateString()}</td><td>{order.total_quantity || 0}</td><td>Ksh {order.total_amount ? order.total_amount.toLocaleString() : 0}</td><td>{order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : '-'}</td><td><span className={`px-2 py-1 rounded-full text-xs ${order.status === 'received' ? 'bg-green-100 text-green-700' : order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{order.status}</span></td><td>{order.status === 'pending' && <button onClick={() => openReceiveModal(order)} className="text-green-600 hover:text-green-800" title="Receive Order"><CheckCircle size={18} /></button>}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create PO Modal */}
      {showPOModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-6 border-b"><h2 className="text-xl font-bold">Create Purchase Order</h2><button onClick={() => setShowPOModal(false)} className="text-gray-500"><X size={20} /></button></div>
            <form onSubmit={handleCreatePO} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Supplier</label><select value={poForm.supplier_id} onChange={e => setPoForm({...poForm, supplier_id: e.target.value})} className="border p-2 rounded-xl w-full" required><option value="">Select Supplier</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-1">Order Date</label><input type="date" value={poForm.order_date} onChange={e => setPoForm({...poForm, order_date: e.target.value})} className="border p-2 rounded-xl w-full" required /></div>
                <div><label className="block text-sm font-medium mb-1">Expected Delivery Date</label><input type="date" value={poForm.expected_delivery_date} onChange={e => setPoForm({...poForm, expected_delivery_date: e.target.value})} className="border p-2 rounded-xl w-full" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Notes</label><textarea value={poForm.notes} onChange={e => setPoForm({...poForm, notes: e.target.value})} className="border p-2 rounded-xl w-full" rows="2" /></div>
              <div><h3 className="font-semibold mb-2">Order Items</h3><div className="space-y-3">
                {poForm.items.map((item, idx) => {
                  const lineTotal = item.quantity * (parseFloat(item.cost_price) || 0);
                  return (
                    <div key={idx} className="flex gap-2 items-end border-b pb-2 flex-wrap">
                      <div className="flex-1"><label className="block text-xs text-gray-500">Product</label><select value={item.product_id} onChange={e => updatePOItem(idx, 'product_id', e.target.value)} className="border p-2 rounded w-full" required><option value="">Select Product</option>{products.map(p => <option key={p.id} value={p.id}>{p.name} (Ksh {p.base_price})</option>)}</select></div>
                      <div className="w-20"><label className="block text-xs text-gray-500">Qty</label><input type="number" min="1" value={item.quantity} onChange={e => updatePOItem(idx, 'quantity', parseInt(e.target.value))} className="border p-2 rounded w-full" required /></div>
                      <div className="w-28"><label className="block text-xs text-gray-500">Agreed Price (Ksh)</label><input type="number" step="0.01" value={item.cost_price} onChange={e => updatePOItem(idx, 'cost_price', parseFloat(e.target.value))} className="border p-2 rounded w-full" required /></div>
                      <div className="w-24"><label className="block text-xs text-gray-500">Line Total</label><div className="text-sm font-semibold bg-gray-100 p-2 rounded">Ksh {lineTotal.toFixed(2)}</div></div>
                      <button type="button" onClick={() => removePOItem(idx)} className="text-red-500"><X size={18} /></button>
                    </div>
                  );
                })}
                <button type="button" onClick={addPOItem} className="text-amber-600 text-sm flex items-center gap-1">+ Add Item</button>
              </div></div>
              <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setShowPOModal(false)} className="px-4 py-2 border rounded-xl">Cancel</button><button type="submit" disabled={savingPO} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2 rounded-xl font-semibold">{savingPO ? 'Saving...' : 'Create PO'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Modal */}
      {receiveModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-6 border-b"><h2 className="text-xl font-bold">Receive Purchase Order: {receiveModal.order?.po_number}</h2><button onClick={() => setReceiveModal({ show: false, order: null, items: [] })} className="text-gray-500"><X size={20} /></button></div>
            <div className="p-6">
              <p className="mb-2"><strong>Supplier:</strong> {receiveModal.order?.supplier?.name}</p>
              <p className="mb-4"><strong>Expected Delivery:</strong> {receiveModal.order?.expected_delivery_date ? new Date(receiveModal.order.expected_delivery_date).toLocaleDateString() : 'Not set'}</p>
              <table className="w-full border">
                <thead className="bg-gray-100"><tr><th className="p-2 text-left">Product</th><th className="p-2 text-left">Quantity</th><th className="p-2 text-left">Expiry Date (optional)</th></tr></thead>
                <tbody>
                  {receiveModal.items.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2">{item.product_name}</td>
                      <td className="p-2">{item.quantity}</td>
                      <td className="p-2"><input type="date" value={item.expiry_date} onChange={(e) => updateExpiryDate(idx, e.target.value)} className="border p-1 rounded" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setReceiveModal({ show: false, order: null, items: [] })} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button onClick={handleReceiveConfirm} disabled={receiving} className="bg-green-600 text-white px-4 py-2 rounded-xl">{receiving ? 'Processing...' : 'Confirm Receipt'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
