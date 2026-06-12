import { useEffect, useState } from 'react';
import PageLoader from '../components/common/PageLoader';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Package, Plus, Edit2, Trash2, Search, Upload, Download, X, Smartphone, Camera } from 'lucide-react';
import BarcodeScannerModal from '../components/POS/BarcodeScannerModal';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: '', sku: '', barcode: '', category: '',
    base_price: '', stock_quantity: '', min_stock_threshold: 5,
    alternativeUnits: []
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
      const date = new Date();
      const datePart = `${String(date.getDate()).padStart(2, '0')}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getFullYear()).substring(2)}`;
      const autoSku = `${namePart}-${catPart}-${datePart}`;
      
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
    setForm({ name: '', sku: '', barcode: '', category: '', base_price: '', stock_quantity: '', min_stock_threshold: 5, alternativeUnits: [] });
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
    setForm({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || '',
      category: product.category || '',
      base_price: product.base_price,
      stock_quantity: product.stock_quantity,
      min_stock_threshold: product.min_stock_threshold,
      alternativeUnits: product.alternative_units || []
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
          const protocol = window.location.protocol; // will be https:
          base = `${protocol}//${res.data.ip}:${window.location.port || '5173'}`;
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
    const sampleRow = ['Sample Product', 'SP001', '123456', 'Category', '100', '50', '5'];
    const csvContent = [headers, sampleRow].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_template.csv';
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

      {/* Add/Edit Form */}
      {showForm && (
      <div className="mb-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="text-orange-600 w-6 h-6" />
            <h2 className="text-xl font-bold text-gray-800">{editing ? 'Edit' : 'Add'} Product</h2>
          </div>
          <button onClick={resetForm} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-3">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input type="text" placeholder="e.g., Organic Apples" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input type="text" placeholder="e.g., Produce" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU { !editing && <span className="text-xs text-orange-600 font-normal ml-1">(Auto-generated)</span> }</label>
                <input type="text" placeholder="e.g., PROD-001" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none bg-gray-50" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="Enter barcode" value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" required />
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

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-3">Pricing & Stock</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (Ksh)</label>
                <input type="number" step="0.01" placeholder="0.00" value={form.base_price} onChange={e => setForm({...form, base_price: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                <input type="number" placeholder="0" value={form.stock_quantity} onChange={e => setForm({...form, stock_quantity: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                <input type="number" placeholder="5" value={form.min_stock_threshold} onChange={e => setForm({...form, min_stock_threshold: e.target.value})} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-lg font-semibold text-gray-800">Alternative Units (Packaging)</h3>
              <button 
                type="button" 
                onClick={() => setForm({...form, alternativeUnits: [...form.alternativeUnits, { unit_name: '', quantity_in_base_unit: '', price: '' }]})}
                className="text-orange-600 text-sm font-semibold flex items-center gap-1 hover:text-orange-700"
              >
                <Plus size={16} /> Add Unit
              </button>
            </div>
            
            {form.alternativeUnits.length === 0 && (
              <p className="text-gray-500 text-sm italic">No alternative units defined. (e.g., Crate, Box)</p>
            )}

            {form.alternativeUnits.map((unit, index) => (
              <div key={index} className="flex gap-3 mb-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unit Name (e.g., Crate)</label>
                  <input type="text" value={unit.unit_name} onChange={e => {
                    const newUnits = [...form.alternativeUnits];
                    newUnits[index].unit_name = e.target.value;
                    setForm({...form, alternativeUnits: newUnits});
                  }} className="w-full border p-2 rounded-lg text-sm" required />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Base Qty</label>
                  <input type="number" value={unit.quantity_in_base_unit} onChange={e => {
                    const newUnits = [...form.alternativeUnits];
                    newUnits[index].quantity_in_base_unit = e.target.value;
                    setForm({...form, alternativeUnits: newUnits});
                  }} className="w-full border p-2 rounded-lg text-sm" required />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Price (Ksh)</label>
                  <input type="number" step="0.01" value={unit.price} onChange={e => {
                    const newUnits = [...form.alternativeUnits];
                    newUnits[index].price = e.target.value;
                    setForm({...form, alternativeUnits: newUnits});
                  }} className="w-full border p-2 rounded-lg text-sm" required />
                </div>
                <button type="button" onClick={() => {
                  const newUnits = form.alternativeUnits.filter((_, i) => i !== index);
                  setForm({...form, alternativeUnits: newUnits});
                }} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 mb-0.5">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={resetForm} className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={saving} className="bg-gradient-to-r from-orange-600 to-orange-600 hover:from-orange-700 hover:to-orange-700 text-white px-8 py-2 rounded-xl font-semibold shadow-md transition">{saving ? 'Saving...' : (editing ? 'Update Product' : 'Create Product')}</button>
          </div>
        </form>
      </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-x-auto max-h-[60vh] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">SKU</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Price</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Stock</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{p.name}</td>
                <td className="px-4 py-2 text-gray-500">{p.sku}</td>
                <td className="px-4 py-2 text-orange-700 font-semibold">Ksh {p.base_price}</td>
                <td className="px-4 py-2">{p.stock_quantity}</td>
                <td className="px-4 py-2 flex gap-3">
                  <button onClick={() => handleEdit(p)} className="text-blue-500 hover:text-blue-700 transition"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 transition"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="5" className="text-center py-6 text-gray-400">No products found</td></tr>}
          </tbody>
        </table>
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
