import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Package, Plus, Edit2, Trash2, Search, Upload, Download, X } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: '', sku: '', barcode: '', category: '',
    base_price: '', stock_quantity: '', min_stock_threshold: 5
  });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

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
    setForm({ name: '', sku: '', barcode: '', category: '', base_price: '', stock_quantity: '', min_stock_threshold: 5 });
    setEditing(null);
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
    setForm({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || '',
      category: product.category || '',
      base_price: product.base_price,
      stock_quantity: product.stock_quantity,
      min_stock_threshold: product.min_stock_threshold
    });
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

  if (loading) return <div className="flex justify-center items-center h-64">Loading products...</div>;
  if (error) return <div className="bg-red-50 p-6 text-center text-red-600">{error} <button onClick={fetchProducts} className="underline">Retry</button></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Package className="w-6 h-6 text-amber-500" /> Products
        </h1>
        <div className="flex gap-2">
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
              className="pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-amber-500" /> {editing ? 'Edit' : 'Add'} Product
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input type="text" placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border p-2 rounded-xl" required />
          <input type="text" placeholder="SKU" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="border p-2 rounded-xl" required />
          <input type="text" placeholder="Barcode" value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} className="border p-2 rounded-xl" />
          <input type="text" placeholder="Category" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="border p-2 rounded-xl" />
          <input type="number" step="0.01" placeholder="Price" value={form.base_price} onChange={e => setForm({...form, base_price: e.target.value})} className="border p-2 rounded-xl" required />
          <input type="number" placeholder="Stock" value={form.stock_quantity} onChange={e => setForm({...form, stock_quantity: e.target.value})} className="border p-2 rounded-xl" required />
          <input type="number" placeholder="Min Stock" value={form.min_stock_threshold} onChange={e => setForm({...form, min_stock_threshold: e.target.value})} className="border p-2 rounded-xl" />
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2 rounded-xl font-semibold">
              {saving ? 'Saving...' : (editing ? 'Update' : 'Create')}
            </button>
            {editing && <button type="button" onClick={resetForm} className="bg-gray-200 px-4 py-2 rounded-xl">Cancel</button>}
          </div>
        </form>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">SKU</th>
              <th className="p-4 text-left">Price</th>
              <th className="p-4 text-left">Stock</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium">{p.name}</td>
                <td className="p-4">{p.sku}</td>
                <td className="p-4 text-amber-600 font-semibold">Ksh {p.base_price}</td>
                <td className="p-4">{p.stock_quantity}</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => handleEdit(p)} className="text-blue-600"><Edit2 size={18} /></button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-600"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="5" className="text-center p-8 text-gray-400">No products found</td></tr>}
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
              <button onClick={downloadTemplate} className="text-amber-600 flex items-center gap-1 text-sm"><Download size={16} /> Download CSV Template</button>
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
    </div>
  );
}
