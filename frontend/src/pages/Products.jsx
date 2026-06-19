import { useEffect, useState } from 'react';
import PageLoader from '../components/common/PageLoader';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Package, Plus, Edit2, Trash2, Search, Upload, Download, X, Smartphone, Camera, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import BarcodeScannerModal from '../components/POS/BarcodeScannerModal';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: '', sku: '', barcode: '', category: '',
    base_price: '', cost_price: '', stock_quantity: '', min_stock_threshold: 5, expiry_date: '', no_expiry: false
  });
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Remote Scanner State
  const [showRemoteScanner, setShowRemoteScanner] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [remoteSessionId, setRemoteSessionId] = useState('');
  const [remoteIpUrl, setRemoteIpUrl] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    let interval;
    if (showRemoteScanner && remoteSessionId) {
      interval = setInterval(async () => {
        try {
          const res = await api.get(`/remote-scan/session/${remoteSessionId}`);
          if (res.data.scanned && res.data.barcode) {
            setForm(prev => ({ ...prev, barcode: res.data.barcode }));
            setShowRemoteScanner(false);
            toast.success('Barcode scanned successfully!');
          }
        } catch (err) {}
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showRemoteScanner, remoteSessionId]);

  // Auto-generate SKU for new products
  useEffect(() => {
    if (!editing) {
      const namePart = form.name.trim() ? form.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() : 'PRD';
      const catPart = form.category.trim() ? form.category.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() : 'GEN';
      const randomPrefix = Math.floor(100 + Math.random() * 900); // 3-digit random number
      const autoSku = `${randomPrefix}-${namePart}-${catPart}`;
      
      setForm(prev => prev.sku !== autoSku ? { ...prev, sku: autoSku } : prev);
    }
  }, [form.name, form.category, editing]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      setProducts(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
      toast.error('Could not load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || form.name.trim() === '') return toast.error('Product Name is required.');
    if (!form.sku || form.sku.trim() === '') return toast.error('SKU is required.');
    if (!form.barcode || form.barcode.trim() === '') return toast.error('Barcode is required.');
    if (!form.base_price || Number(form.base_price) <= 0) return toast.error('Base Price must be greater than 0.');
    if (!form.stock_quantity || Number(form.stock_quantity) < 0) return toast.error('Stock Quantity cannot be negative.');

    setSaving(true);
    try {
      if (editing) {
        await api.put(`/products/${editing}`, form);
        toast.success('Product updated');
      } else {
        await api.post('/products', form);
        toast.success('Product created');
      }
      fetchProducts();
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving product');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({ name: '', sku: '', barcode: '', category: '', base_price: '', cost_price: '', stock_quantity: '', min_stock_threshold: 5, expiry_date: '', no_expiry: false });
    setEditing(null);
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Deleted');
      fetchProducts();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleEdit = (product) => {
    setEditing(product.id);
    setShowForm(true);
    
    let nearestExpiry = '';
    if (product.batches && product.batches.length > 0) {
        const activeBatches = product.batches.filter(b => b.expiry_date);
        if (activeBatches.length > 0) {
            // Sort to find nearest
            const sorted = activeBatches.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
            nearestExpiry = sorted[0].expiry_date.split('T')[0]; // Get YYYY-MM-DD
        }
    }

    setForm({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || '',
      category: product.category || '',
      base_price: product.base_price,
      cost_price: product.cost_price || '',
      stock_quantity: product.stock_quantity,
      min_stock_threshold: product.min_stock_threshold,
      expiry_date: nearestExpiry,
      no_expiry: !!product.no_expiry
    });
  };

  const handleRemotePair = async () => {
    const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setRemoteSessionId(id);
    setShowRemoteScanner(true);
    
    let base = window.location.origin;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      try {
        const res = await api.get('/system/local-ip');
        if (res.data.ip) {
          let protocol = window.location.protocol;
          let port = window.location.port || '5173';
          
          if (protocol === 'http:') {
            protocol = 'https:';
            port = '5174';
          }
          
          base = `${protocol}//${res.data.ip}:${port}`;
        }
      } catch (err) {
        console.warn('Failed to fetch local IP', err);
      }
    }
    setRemoteIpUrl(`${base}/remote-scanner/${id}`);
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // CSV Import handlers
  const downloadTemplate = () => {
    const headers = ['name', 'sku', 'barcode', 'category', 'base_price', 'stock_quantity', 'min_stock_threshold'];
    const sampleRows = [
      ['Whole Milk 500ml', 'DAIRY-001', '616110001234', 'Dairy', '60', '100', '20'],
      ['White Bread 400g', 'BAKERY-001', '616110001235', 'Bakery', '65', '50', '10'],
      ['Sugar 1kg', 'GROCERY-001', '616110001236', 'Groceries', '150', '200', '50'],
      ['Maize Flour 2kg', 'GROCERY-002', '616110001237', 'Groceries', '200', '150', '30'],
      ['Cooking Oil 1L', 'GROCERY-003', '616110001238', 'Groceries', '300', '80', '15']
    ];
    
    const csvContent = [headers, ...sampleRows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Please select a CSV file');
      return;
    }
    const formData = new FormData();
    formData.append('file', importFile);
    setImporting(true);
    setImportResult(null);
    try {
      const res = await api.post('/products/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImportResult(res.data);
      toast.success(`Imported ${res.data.imported} products`);
      fetchProducts();
      setImportFile(null);
      setShowImportModal(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Import failed';
      toast.error(msg);
      setImportResult({ error: msg });
    } finally {
      setImporting(false);
    }
  };

  if (loading) return <PageLoader message="Loading products..." />;
  if (error) return <div className="bg-red-50 p-6 text-center text-red-600">{error} <button onClick={fetchProducts} className="underline">Retry</button></div>;

  // Calculate Summary Statistics
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => Number(p.stock_quantity) <= Number(p.min_stock_threshold)).length;
  const totalValue = products.reduce((sum, p) => sum + (parseFloat(p.base_price) * parseInt(p.stock_quantity || 0)), 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Package className="w-6 h-6 text-orange-600" /> Products
        </h1>
        <div className="flex gap-2">
          <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-gradient-to-r from-orange-600 to-orange-600 text-white px-3 py-2 rounded-xl flex items-center gap-1">
            <Plus size={18} /> Add Product
          </button>
          <button onClick={() => setShowImportModal(true)} className="bg-green-600 text-white px-3 py-2 rounded-xl flex items-center gap-1">
            <Upload size={18} /> Import CSV
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-600"
            />
          </div>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
            <div className="flex items-center gap-2">
              <Plus className="text-orange-600 w-6 h-6" />
              <h2 className="text-xl font-bold text-gray-800">{editing ? 'Edit' : 'Add'} Product</h2>
            </div>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                    <input type="text" placeholder="e.g., Organic Apples" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none bg-white" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input type="text" placeholder="e.g., Produce" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU { !editing && <span className="text-xs text-orange-600 font-normal ml-1">(Auto-generated)</span> }</label>
                    <input type="text" placeholder="e.g., PROD-001" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none bg-gray-100" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Enter barcode" value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none bg-white" required />
                      <button type="button" onClick={() => setShowScanner(true)} className="flex items-center justify-center gap-1 bg-orange-100 text-orange-800 px-3 py-2 rounded-xl hover:bg-orange-200 transition whitespace-nowrap text-sm font-medium" title="Scan with Webcam">
                        <Camera size={18} /> Webcam
                      </button>
                      <button type="button" onClick={handleRemotePair} className="flex items-center justify-center gap-1 bg-indigo-100 text-indigo-700 px-3 py-2 rounded-xl hover:bg-indigo-200 transition whitespace-nowrap text-sm font-medium" title="Scan with Phone">
                        <Smartphone size={18} /> Phone
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-3">Pricing & Stock</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (Buy)</label>
                    <input type="number" step="0.01" placeholder="0.00" value={form.cost_price} onChange={e => setForm({...form, cost_price: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none bg-white" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price</label>
                    <input type="number" step="0.01" placeholder="0.00" value={form.base_price} onChange={e => setForm({...form, base_price: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none bg-white" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                    <input type="number" placeholder="0" value={form.stock_quantity} onChange={e => setForm({...form, stock_quantity: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none bg-white" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                    <input type="number" placeholder="5" value={form.min_stock_threshold} onChange={e => setForm({...form, min_stock_threshold: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none bg-white" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">Expiry Date (Optional)</label>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 cursor-pointer hover:text-orange-600 select-none">
                        <input type="checkbox" checked={form.no_expiry} onChange={e => setForm({...form, no_expiry: e.target.checked, expiry_date: e.target.checked ? '' : form.expiry_date})} className="rounded text-orange-600 focus:ring-orange-500 w-3.5 h-3.5" />
                        No Expiry
                      </label>
                    </div>
                    <input type="date" disabled={form.no_expiry} value={form.expiry_date} onChange={e => setForm({...form, expiry_date: e.target.value})} className={`w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none ${form.no_expiry ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-white'}`} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={resetForm} className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-100 transition">Cancel</button>
                <button type="submit" disabled={saving} className="bg-gradient-to-r from-orange-600 to-orange-600 hover:from-orange-700 hover:to-orange-700 text-white px-8 py-2 rounded-xl font-semibold shadow-md transition">{saving ? 'Saving...' : (editing ? 'Update Product' : 'Create Product')}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-h-[65vh] overflow-y-auto p-2">
        {filtered.map(p => {
          let nearestExpiry = null;
          let isExpiringSoon = false;
          if (p.batches && p.batches.length > 0) {
             const activeBatches = p.batches.filter(b => b.expiry_date && parseFloat(b.quantity) > 0);
             if (activeBatches.length > 0) {
                 const earliest = new Date(Math.min(...activeBatches.map(b => new Date(b.expiry_date))));
                 nearestExpiry = earliest.toLocaleDateString();
                 const daysLeft = Math.ceil((earliest - new Date()) / (1000 * 60 * 60 * 24));
                 isExpiringSoon = daysLeft <= 30;
             }
          }
          return (
          <div key={p.id} className={`border ${isExpiringSoon ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'} rounded-xl p-4 hover:shadow-lg transition-all hover:-translate-y-0.5 flex flex-col justify-between`}>
            <div>
              <div className="font-semibold text-gray-800 truncate" title={p.name}>{p.name}</div>
              <div className="text-sm text-gray-500">{p.sku}</div>
              <div className="text-lg font-bold text-orange-500 mt-2">Ksh {p.base_price}</div>
              <div className="text-xs text-gray-500 mt-1 flex justify-between items-center">
                <span>Stock: {p.stock_quantity}</span>
                {nearestExpiry && <span className={`${isExpiringSoon ? 'text-red-600 font-bold' : 'text-orange-600 font-medium'}`} title="Nearest Expiry Date">Exp: {nearestExpiry}</span>}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="mt-4 flex gap-2">
              <button 
                onClick={() => handleEdit(p)} 
                className="flex-1 bg-blue-50 text-blue-600 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition flex items-center justify-center gap-1"
                title="Edit Product"
              >
                <Edit2 size={14} /> Edit
              </button>
              <button 
                onClick={() => handleDelete(p.id)} 
                className="flex-1 bg-red-50 text-red-600 py-1.5 rounded-lg text-sm font-medium hover:bg-red-100 transition flex items-center justify-center gap-1"
                title="Delete Product"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <Package size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-500">No products found</p>
            <p className="text-sm mt-1">Try adjusting your search</p>
          </div>
        )}
      </div>

      {/* Inventory Summary Dashboard */}
      <div className="mt-6 bg-white border border-gray-100 py-6 px-8 rounded-2xl shadow-md flex flex-wrap justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
            <Package size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Total Products</p>
            <p className="text-2xl font-bold text-gray-800">{totalProducts} Items</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${lowStockProducts > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
            {lowStockProducts > 0 ? <AlertTriangle size={28} /> : <CheckCircle size={28} />}
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Stock Status</p>
            <p className={`text-2xl font-bold ${lowStockProducts > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {lowStockProducts > 0 ? `${lowStockProducts} Low Stock` : 'All Stocked'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Total Value</p>
            <p className="text-2xl font-bold text-gray-800">Ksh {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Import Products (CSV)</h2>
              <button onClick={() => { setShowImportModal(false); setImportFile(null); setImportResult(null); }} className="text-gray-500"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <button onClick={downloadTemplate} className="text-orange-700 flex items-center gap-1 text-sm"><Download size={16} /> Download CSV Template</button>
              <input type="file" accept=".csv" onChange={e => setImportFile(e.target.files[0])} className="border p-2 rounded-xl w-full" />
              {importResult && (
                <div className="text-sm">
                  <p className="font-semibold">Imported: {importResult.imported} products</p>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="text-red-600 mt-2">
                      <p>Errors:</p>
                      <ul className="list-disc pl-4">{importResult.errors.map((err, i) => <li key={i}>{err}</li>)}</ul>
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowImportModal(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button onClick={handleImport} disabled={importing} className="bg-green-600 text-white px-6 py-2 rounded-xl">{importing ? 'Importing...' : 'Import'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remote Scanner Modal */}
      {showRemoteScanner && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative">
            <button type="button" onClick={() => setShowRemoteScanner(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"><X size={20} /></button>
            <h2 className="text-xl font-bold text-center mb-4">Scan Barcode with Phone</h2>
            <p className="text-sm text-gray-600 text-center mb-6">Scan this QR code with your mobile phone camera to automatically fill the barcode field.</p>
            <div className="bg-gray-100 p-4 rounded-xl flex justify-center mb-6 min-h-[232px] items-center">
              {remoteIpUrl ? (
                 <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(remoteIpUrl)}`} alt="QR Code" className="w-[200px] h-[200px]" />
              ) : (
                 <div className=" text-gray-400">Generating QR Code...</div>
              )}
            </div>
            <p className="text-center text-sm text-gray-500  mb-6">Waiting for scan...</p>
            <button 
              type="button" 
              onClick={() => setShowRemoteScanner(false)} 
              className="w-full bg-red-50 text-red-600 font-bold py-3 rounded-xl border border-red-200 hover:bg-red-100 transition shadow-sm active:scale-95"
            >
              Cancel Scanning
            </button>
          </div>
        </div>
      )}

      {/* Desktop Webcam Scanner Modal */}
      {showScanner && (
        <BarcodeScannerModal 
          onScan={(code) => {
            setForm(prev => ({ ...prev, barcode: code }));
            setShowScanner(false);
            toast.success('Barcode scanned successfully!');
          }} 
          onClose={() => setShowScanner(false)} 
        />
      )}
    </div>
  );
}
