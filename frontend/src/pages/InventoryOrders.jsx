import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Package, AlertTriangle, Plus, CheckCircle, X, ShoppingCart, Truck, Calendar, Bell, Box, ClipboardCheck, Edit, Eye } from 'lucide-react';
import PageLoader from '../components/common/PageLoader';

export default function InventoryOrders() {
  // ---------- Inventory state ----------
  const [products, setProducts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [showAllProducts, setShowAllProducts] = useState(false);

  // ---------- Purchase Order state ----------
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showPOModal, setShowPOModal] = useState(false);
  const [poForm, setPoForm] = useState({
    supplier_id: '',
    order_date: new Date().toISOString().slice(0, 10),
    expected_delivery_date: '',
    notes: '',
    agreed_price: '',
    paid_amount: '',
    items: [{ product_id: '', quantity: 1, cost_price: '', current_price: 0 }]
  });
  const [savingPO, setSavingPO] = useState(false);
  const [editingPoId, setEditingPoId] = useState(null);

  // Receive modal state
  const [receiveModal, setReceiveModal] = useState({ show: false, order: null, items: [] });
  const [receiving, setReceiving] = useState(false);

  // ---------- Product Actions State ----------
  const [viewProduct, setViewProduct] = useState(null);
  const [editProduct, setEditProduct] = useState(null);

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
  const calculateTotalAgreedPrice = (items) => {
    const total = items.reduce((sum, item) => sum + ((parseInt(item.quantity) || 0) * (parseFloat(item.cost_price) || 0)), 0);
    return total > 0 ? total : '';
  };

  const addPOItem = () => {
    setPoForm(prev => ({ ...prev, items: [...prev.items, { product_id: '', quantity: 1, cost_price: '', current_price: 0 }] }));
  };
  
  const removePOItem = (idx) => {
    if (poForm.items.length === 1) return;
    setPoForm(prev => {
      const newItems = prev.items.filter((_, i) => i !== idx);
      return { ...prev, items: newItems, agreed_price: calculateTotalAgreedPrice(newItems) };
    });
  };

  const updatePOItem = (idx, field, value) => {
    setPoForm(prev => {
      const newItems = [...prev.items];
      newItems[idx] = { ...newItems[idx], [field]: value };
      if (field === 'product_id') {
        const product = products.find(p => p.id == value);
        newItems[idx].current_price = product ? product.base_price : 0;
      }
      return { ...prev, items: newItems, agreed_price: calculateTotalAgreedPrice(newItems) };
    });
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

  const handleEditPO = (order) => {
    setEditingPoId(order.id);
    setPoForm({
      supplier_id: order.supplier_id,
      order_date: order.order_date ? order.order_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      expected_delivery_date: order.expected_delivery_date ? order.expected_delivery_date.slice(0, 10) : '',
      notes: order.notes || '',
      items: order.items.map(i => ({
        product_id: i.product_id,
        quantity: i.quantity,
        cost_price: i.cost_price,
        current_price: i.product?.base_price || 0
      })),
      agreed_price: order.agreed_price || '',
      paid_amount: order.paid_amount || ''
    });
    setShowPOModal(true);
  };

  const handleApprovePO = async (orderId) => {
    if (!confirm('Approve this drafted order? This will send it to the supplier.')) return;
    try {
      await api.post(`/purchase-orders/${orderId}/approve`);
      toast.success('Order approved successfully');
      fetchPurchaseData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve order');
    }
  };

  const handleDeletePO = async (orderId) => {
    if (!confirm('Are you sure you want to delete this draft order?')) return;
    try {
      await api.delete(`/purchase-orders/${orderId}`);
      toast.success('Order deleted successfully');
      fetchPurchaseData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete order');
    }
  };

  const updateExpiryDate = (idx, value) => {
    const newItems = [...receiveModal.items];
    newItems[idx].expiry_date = value;
    setReceiveModal(prev => ({ ...prev, items: newItems }));
  };

  const handleReceiveConfirm = async () => {
    // Validate if expiry dates are required or if they are valid
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
      fetchPurchaseData();
      fetchInventoryData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to receive order');
    } finally {
      setReceiving(false);
    }
  };

  const handleEditProductSave = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/products/${editProduct.id}`, { min_stock_threshold: editProduct.min_stock_threshold });
      
      if (editProduct.batches && editProduct.batches.length > 0) {
        await Promise.all(editProduct.batches.map(batch => 
          api.put(`/batches/${batch.id}`, {
            expiry_date: batch.expiry_date,
            created_at: batch.created_at
          })
        ));
      }

      toast.success('Product and batches updated successfully');
      setEditProduct(null);
      fetchInventoryData();
    } catch (err) {
      toast.error('Failed to update product details');
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
      toast.error('Add at least one item with valid quantity and price.');
      return;
    }
    const hasInvalidQuantities = validItems.some(i => Number(i.quantity) <= 0 || Number(i.cost_price) < 0);
    if (hasInvalidQuantities) {
      toast.error('Quantities must be greater than 0 and prices cannot be negative.');
      return;
    }
    setSavingPO(true);
    try {
      if (editingPoId) {
        await api.put(`/purchase-orders/${editingPoId}`, {
          supplier_id: poForm.supplier_id,
          order_date: poForm.order_date,
          expected_delivery_date: poForm.expected_delivery_date || null,
          notes: poForm.notes,
          agreed_price: poForm.agreed_price || 0,
          paid_amount: poForm.paid_amount || 0,
          items: validItems.map(({ product_id, quantity, cost_price }) => ({ product_id, quantity, cost_price }))
        });
        toast.success('Purchase order updated');
      } else {
        await api.post('/purchase-orders', {
          supplier_id: poForm.supplier_id,
          order_date: poForm.order_date,
          expected_delivery_date: poForm.expected_delivery_date || null,
          notes: poForm.notes,
          agreed_price: poForm.agreed_price || 0,
          paid_amount: poForm.paid_amount || 0,
          items: validItems.map(({ product_id, quantity, cost_price }) => ({ product_id, quantity, cost_price }))
        });
        toast.success('Purchase order created');
      }
      setShowPOModal(false);
      setEditingPoId(null);
      setPoForm({
        supplier_id: '',
        order_date: new Date().toISOString().slice(0, 10),
        expected_delivery_date: '',
        notes: '',
        agreed_price: '',
        paid_amount: '',
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

  if (loadingInventory) return <PageLoader message="Loading inventory & orders..." />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Package className="text-orange-600" /> Inventory & Orders
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button onClick={() => setActiveTab('inventory')} className={`px-6 py-2 text-sm font-semibold rounded-t-lg transition ${activeTab === 'inventory' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          <Package size={16} className="inline mr-1" /> Stock & Batches
        </button>
        <button onClick={() => setActiveTab('purchaseOrders')} className={`px-6 py-2 text-sm font-semibold rounded-t-lg transition ${activeTab === 'purchaseOrders' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          <ShoppingCart size={16} className="inline mr-1" /> Purchase Orders
        </button>
        <button onClick={() => setActiveTab('receivedOrders')} className={`px-6 py-2 text-sm font-semibold rounded-t-lg transition ${activeTab === 'receivedOrders' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          <ClipboardCheck size={16} className="inline mr-1" /> Received Orders
        </button>
      </div>

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-8">
          {dueOrders.length > 0 && (
            <div className="p-4 bg-orange-50 border-l-4 border-orange-600 rounded-xl">
              <h3 className="font-semibold flex items-center gap-2 text-orange-900"><Bell size={18} /> Orders Due for Receipt</h3>
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
          <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col max-h-[300px]">
            <h2 className="text-lg font-semibold mb-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-orange-600" /> Stock & Expiry Alerts
              </div>
              {alerts.length > 0 && <span className="text-sm bg-orange-100 text-orange-800 px-3 py-1 rounded-full">{alerts.length} Alerts</span>}
            </h2>
            <div className="overflow-y-auto flex-1 pr-2 space-y-3">
              {alerts.length === 0 ? <p className="text-gray-500">No alerts – all good!</p> : alerts.map((alert, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl border-l-4 border-orange-600">
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div><p className="font-medium text-gray-800">{alert.product?.name}</p><p className="text-sm text-orange-700">{alert.type === 'low_stock' ? '⚠️ Below minimum stock' : `⏰ Expires on ${new Date(alert.batch?.expiry_date).toLocaleDateString()}`}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-[500px]">
            <h2 className="text-lg font-semibold p-4 border-b shrink-0 flex justify-between items-center">
              Product Stock Levels
              <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{products.length} Products</span>
            </h2>
            <div className="overflow-auto flex-1">
              <table className="w-full relative">
                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">SKU</th>
                    <th className="p-3 text-left">Barcode</th>
                    <th className="p-3 text-left">Price</th>
                    <th className="p-3 text-left">Stock</th>
                    <th className="p-3 text-left">Min Threshold</th>
                    <th className="p-3 text-left">Nearest Expiry</th>
                    <th className="p-3 text-left">Latest Delivery</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>{products.map(p => {
                  const batchesWithStock = p.batches?.filter(b => b.quantity > 0) || [];
                  const nearestExpiry = batchesWithStock.length > 0 
                    ? new Date(Math.min(...batchesWithStock.map(b => new Date(b.expiry_date)))).toLocaleDateString() 
                    : '-';
                  const latestDelivery = p.batches?.length > 0 
                    ? new Date(Math.max(...p.batches.map(b => new Date(b.created_at)))).toLocaleDateString()
                    : '-';
                  
                  // Compute stock string
                  const stockString = `${p.stock_quantity || 0} Pieces`;

                  return (
                    <tr key={p.id} className="border-b hover:bg-gray-50 transition">
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3 text-gray-500">{p.sku}</td>
                      <td className="p-3 text-gray-500 font-mono text-sm">{p.barcode || '-'}</td>
                      <td className="p-3 text-orange-700 font-semibold">Ksh {p.base_price}</td>
                      <td className="p-3 font-medium">{stockString}</td>
                      <td className="p-3">{p.min_stock_threshold}</td>
                      <td className="p-3 font-semibold text-red-600">{nearestExpiry}</td>
                      <td className="p-3 text-green-600">{latestDelivery}</td>
                      <td className="p-3 flex gap-2">
                        <button onClick={() => setEditProduct(p)} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition" title="Adjust Threshold">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => setViewProduct(p)} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition" title="View Details">
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Orders Tab */}
      {activeTab === 'purchaseOrders' && (
        <div>
          <div className="flex justify-end mb-4"><button onClick={() => setShowPOModal(true)} className="bg-gradient-to-r from-orange-600 to-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"><Plus size={18} /> New Purchase Order</button></div>
          <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b"><tr><th className="p-4 text-left">PO Number</th><th className="p-4 text-left">Supplier</th><th className="p-4 text-left">Order Date</th><th className="p-4 text-left">Total Qty</th><th className="p-4 text-left">Total Amount</th><th className="p-4 text-left">Expected Delivery</th><th className="p-4 text-left">Status</th><th className="p-4 text-left">Actions</th></tr></thead>
              <tbody>{orders.filter(o => o.status !== 'received').map(order => (<tr key={order.id} className="border-b hover:bg-gray-50"><td className="p-4 font-medium">{order.po_number}</td><td>{order.supplier?.name}</td><td>{new Date(order.order_date).toLocaleDateString()}</td><td>{order.total_quantity || 0}</td><td>Ksh {order.total_amount ? order.total_amount.toLocaleString() : 0}</td><td>{order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : '-'}</td><td><span className={`px-2 py-1 rounded-full text-xs ${order.status === 'received' ? 'bg-green-100 text-green-700' : order.status === 'cancelled' ? 'bg-red-100 text-red-700' : order.status === 'draft' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'}`}>{order.status}</span></td><td className="p-4 flex gap-2">
                {order.status === 'draft' && (
                  <>
                    <button onClick={() => handleEditPO(order)} className="text-orange-700 hover:text-orange-900 font-medium text-sm" title="Edit Order">Edit</button>
                    <button onClick={() => handleApprovePO(order.id)} className="text-orange-600 hover:text-orange-800 font-medium text-sm" title="Accept & Send">Approve</button>
                    <button onClick={() => handleDeletePO(order.id)} className="text-red-600 hover:text-red-800 font-medium text-sm" title="Delete Order">Delete</button>
                  </>
                )}
                {order.status === 'pending' && <button onClick={() => openReceiveModal(order)} className="text-green-600 hover:text-green-800" title="Receive Order"><CheckCircle size={18} /></button>}
              </td></tr>))}
              {orders.filter(o => o.status !== 'received').length === 0 && (
                <tr><td colSpan="8" className="text-center p-8 text-gray-400">No pending purchase orders found.</td></tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Received Orders Tab */}
      {activeTab === 'receivedOrders' && (
        <div>
          <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-left font-semibold text-gray-700">Order Number</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Arrival Date</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Products Received</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Agreed Amount</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Paid Amount</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Deficit / Balance</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Comments</th>
                </tr>
              </thead>
              <tbody>
                {orders.filter(o => o.status === 'received').map(order => (
                  <tr key={order.id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-4 font-bold text-gray-800">{order.po_number}</td>
                    <td className="p-4 text-gray-600">{new Date(order.updated_at).toLocaleDateString()}</td>
                    <td className="p-4 text-gray-600">
                      <div className="font-medium text-gray-800 mb-1 max-w-[250px] truncate" title={order.items.map(i => `${i.product?.name}`).filter(Boolean).join(', ')}>
                        {order.items.map(i => `${i.product?.name}`).filter(Boolean).join(', ')}
                      </div>
                      <div className="text-xs text-gray-400">
                        {order.items.length} items ({order.total_quantity} qty)
                      </div>
                    </td>
                    <td className="p-4 font-medium text-gray-800">Ksh {order.agreed_price ? Number(order.agreed_price).toLocaleString() : '0'}</td>
                    <td className="p-4 font-medium text-green-600">Ksh {order.paid_amount ? Number(order.paid_amount).toLocaleString() : '0'}</td>
                    <td className="p-4 font-bold text-red-600">Ksh {order.balance ? Number(order.balance).toLocaleString() : '0'}</td>
                    <td className="p-4 text-gray-500 max-w-[200px] truncate" title={order.notes}>{order.notes || '-'}</td>
                  </tr>
                ))}
                {orders.filter(o => o.status === 'received').length === 0 && (
                  <tr><td colSpan="7" className="text-center p-8 text-gray-400">No received orders found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create PO Modal */}
      {showPOModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-6 border-b"><h2 className="text-xl font-bold">{editingPoId ? 'Edit Purchase Order' : 'Create Purchase Order'}</h2><button onClick={() => { setShowPOModal(false); setEditingPoId(null); setPoForm({supplier_id: '', order_date: new Date().toISOString().slice(0, 10), expected_delivery_date: '', notes: '', agreed_price: '', paid_amount: '', items: [{ product_id: '', quantity: 1, cost_price: '', current_price: 0 }]}); }} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full"><X size={20} /></button></div>
            <form onSubmit={handleCreatePO} className="p-6 space-y-6 bg-gray-50 rounded-b-2xl">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Order Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label><select value={poForm.supplier_id} onChange={e => setPoForm({...poForm, supplier_id: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" required><option value="">Select Supplier</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Order Date</label><input type="date" value={poForm.order_date} onChange={e => setPoForm({...poForm, order_date: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" required /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery</label><input type="date" value={poForm.expected_delivery_date} onChange={e => setPoForm({...poForm, expected_delivery_date: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" /></div>
                  </div>
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={poForm.notes} onChange={e => setPoForm({...poForm, notes: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" rows="2" /></div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">Payment Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agreed Price (Ksh)</label>
                    <input type="number" step="0.01" value={poForm.agreed_price} onChange={e => setPoForm({...poForm, agreed_price: parseFloat(e.target.value) || ''})} className="border border-gray-300 p-2 rounded-xl w-full focus:ring-2 focus:ring-orange-600 outline-none" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount (Ksh)</label>
                    <input type="number" step="0.01" value={poForm.paid_amount} onChange={e => setPoForm({...poForm, paid_amount: parseFloat(e.target.value) || ''})} className="border border-gray-300 p-2 rounded-xl w-full focus:ring-2 focus:ring-orange-600 outline-none" placeholder="0.00" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Order Items</h3>
                <div className="space-y-3">
                  {poForm.items.map((item, idx) => {
                    const lineTotal = item.quantity * (parseFloat(item.cost_price) || 0);
                    const selectedProduct = products.find(p => p.id == item.product_id);
                    return (
                      <div key={idx} className="flex gap-3 items-end border-b pb-3 flex-wrap">
                        <div className="flex-1 min-w-[200px]"><label className="block text-xs font-medium text-gray-700 mb-1">Product</label><select value={item.product_id} onChange={e => updatePOItem(idx, 'product_id', e.target.value)} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" required><option value="">Select Product</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                        <div className="w-24"><label className="block text-xs font-medium text-gray-700 mb-1">Qty</label><input type="number" min="1" value={item.quantity} onChange={e => updatePOItem(idx, 'quantity', parseInt(e.target.value))} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" required /></div>
                        <div className="w-28"><label className="block text-xs font-medium text-gray-700 mb-1">Retail Price</label><div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 p-2 rounded-xl text-center">Ksh {selectedProduct ? parseFloat(selectedProduct.base_price).toFixed(2) : '0.00'}</div></div>
                        <div className="w-32"><label className="block text-xs font-medium text-gray-700 mb-1">Agreed Price (Ksh)</label><input type="number" step="0.01" value={item.cost_price} onChange={e => updatePOItem(idx, 'cost_price', parseFloat(e.target.value))} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" required /></div>
                        <div className="w-28"><label className="block text-xs font-medium text-gray-700 mb-1">Line Total</label><div className="text-sm font-semibold bg-gray-50 border border-gray-200 p-2 rounded-xl text-center">Ksh {lineTotal.toFixed(2)}</div></div>
                        <button type="button" onClick={() => removePOItem(idx)} className="text-red-500 hover:text-red-700 p-2 mb-0.5"><X size={20} /></button>
                      </div>
                    );
                  })}
                  <button type="button" onClick={addPOItem} className="text-orange-700 font-medium text-sm flex items-center gap-1 mt-2 hover:text-orange-800"><Plus size={16} /> Add Another Item</button>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowPOModal(false); setEditingPoId(null); setPoForm({supplier_id: '', order_date: new Date().toISOString().slice(0, 10), expected_delivery_date: '', notes: '', agreed_price: '', paid_amount: '', items: [{ product_id: '', quantity: 1, cost_price: '', current_price: 0 }]}); }} className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-100 transition">Cancel</button>
                <button type="submit" disabled={savingPO} className="bg-gradient-to-r from-orange-600 to-orange-600 hover:from-orange-700 hover:to-orange-700 text-white px-8 py-2 rounded-xl font-semibold shadow-md transition">{savingPO ? 'Saving...' : (editingPoId ? 'Update PO' : 'Create PO')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Modal */}
      {receiveModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-6 border-b"><h2 className="text-xl font-bold">Receive Purchase Order: {receiveModal.order?.po_number}</h2><button onClick={() => setReceiveModal({ show: false, order: null, items: [] })} className="text-gray-500"><X size={20} /></button></div>
            <div className="p-6 bg-gray-50 rounded-b-2xl">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Order Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500 block">Supplier</span><span className="font-medium text-gray-800">{receiveModal.order?.supplier?.name}</span></div>
                  <div><span className="text-gray-500 block">Expected Delivery</span><span className="font-medium text-gray-800">{receiveModal.order?.expected_delivery_date ? new Date(receiveModal.order.expected_delivery_date).toLocaleDateString() : 'Not set'}</span></div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Payment Details</h3>
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
                <button onClick={() => setReceiveModal({ show: false, order: null, items: [] })} className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-100 transition">Cancel</button>
                <button onClick={handleReceiveConfirm} disabled={receiving} className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-xl font-semibold shadow-md transition">{receiving ? 'Processing...' : 'Confirm Receipt'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Settings & Batches Modal */}
      {editProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-6 border-b shrink-0">
              <h2 className="text-xl font-bold">Edit Product Settings</h2>
              <button onClick={() => setEditProduct(null)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleEditProductSave} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 font-medium">
                    {editProduct.name}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock Threshold</label>
                  <input type="number" required min="0" value={editProduct.min_stock_threshold || ''} onChange={e => setEditProduct({...editProduct, min_stock_threshold: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" />
                  <p className="text-xs text-gray-500 mt-2">Alerts will trigger when stock falls below this amount.</p>
                </div>

                <div className="mt-6 border-t pt-5">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Package className="text-orange-600 w-5 h-5"/> Edit Batch Dates</h3>
                  {editProduct.batches?.filter(b => b.quantity > 0).length > 0 ? (
                    <div className="overflow-x-auto border border-gray-200 rounded-xl">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="p-3 font-medium text-gray-600 text-xs uppercase">Batch No</th>
                            <th className="p-3 font-medium text-gray-600 text-xs uppercase">Qty</th>
                            <th className="p-3 font-medium text-gray-600 text-xs uppercase">Arrival Date</th>
                            <th className="p-3 font-medium text-gray-600 text-xs uppercase">Expiry Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {editProduct.batches.filter(b => b.quantity > 0).map((batch) => (
                            <tr key={batch.id} className="border-b last:border-0 hover:bg-gray-50">
                              <td className="p-3 text-gray-800 font-mono text-xs">{batch.batch_number}</td>
                              <td className="p-3 font-medium text-gray-800">{batch.quantity}</td>
                              <td className="p-3">
                                <input 
                                  type="date" 
                                  value={batch.created_at ? batch.created_at.split('T')[0] : ''} 
                                  onChange={(e) => {
                                    const newBatches = [...editProduct.batches];
                                    const bIdx = newBatches.findIndex(b => b.id === batch.id);
                                    newBatches[bIdx] = {...newBatches[bIdx], created_at: e.target.value};
                                    setEditProduct({...editProduct, batches: newBatches});
                                  }}
                                  className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-orange-500 outline-none text-sm" 
                                />
                              </td>
                              <td className="p-3">
                                <input 
                                  type="date" 
                                  value={batch.expiry_date ? batch.expiry_date.split('T')[0] : ''} 
                                  onChange={(e) => {
                                    const newBatches = [...editProduct.batches];
                                    const bIdx = newBatches.findIndex(b => b.id === batch.id);
                                    newBatches[bIdx] = {...newBatches[bIdx], expiry_date: e.target.value};
                                    setEditProduct({...editProduct, batches: newBatches});
                                  }}
                                  className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-orange-500 outline-none text-sm" 
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                      <p className="text-sm text-gray-500">No active batches to edit dates for.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={() => setEditProduct(null)} className="px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-100 transition">Cancel</button>
                <button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-2.5 rounded-xl font-semibold shadow-md transition">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b shrink-0">
              <h2 className="text-xl font-bold">Product Details: {viewProduct.name}</h2>
              <button onClick={() => setViewProduct(null)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="text-xs text-gray-500 mb-1 uppercase font-semibold">SKU</div>
                  <div className="font-bold text-gray-800">{viewProduct.sku}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="text-xs text-gray-500 mb-1 uppercase font-semibold">Price</div>
                  <div className="font-bold text-gray-800">Ksh {viewProduct.base_price}</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <div className="text-xs text-orange-600 mb-1 uppercase font-semibold">Total Stock</div>
                  <div className="font-bold text-orange-700 text-lg">{viewProduct.stock_quantity || 0}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="text-xs text-gray-500 mb-1 uppercase font-semibold">Threshold</div>
                  <div className="font-bold text-gray-800">{viewProduct.min_stock_threshold || 0}</div>
                </div>
              </div>

              <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center gap-2"><Package className="text-orange-600 w-5 h-5"/> Active Batches</h3>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-3 font-semibold text-gray-600">Batch Number</th>
                      <th className="p-3 font-semibold text-gray-600">Quantity</th>
                      <th className="p-3 font-semibold text-gray-600">Expiry Date</th>
                      <th className="p-3 font-semibold text-gray-600">Arrival Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewProduct.batches?.filter(b => b.quantity > 0).length > 0 ? (
                      viewProduct.batches.filter(b => b.quantity > 0).map(batch => (
                        <tr key={batch.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="p-3 font-mono text-gray-600">{batch.batch_number}</td>
                          <td className="p-3 font-medium">{batch.quantity}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-md text-xs font-semibold ${new Date(batch.expiry_date) < new Date(new Date().setDate(new Date().getDate() + 30)) ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                              {new Date(batch.expiry_date).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="p-3 text-gray-500">{new Date(batch.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4" className="p-4 text-center text-gray-500">No active batches found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-6 border-t shrink-0 flex justify-end">
              <button onClick={() => setViewProduct(null)} className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
