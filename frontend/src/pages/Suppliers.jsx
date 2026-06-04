import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Truck, Plus, Edit2, Trash2, Search } from 'lucide-react';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({ name: '', contact_person: '', phone: '', email: '', address: '' });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

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

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.contact_person && s.contact_person.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <div className="flex justify-center items-center h-64">Loading suppliers...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Truck className="text-amber-500" /> Suppliers
        </h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Plus className="text-amber-500" /> {editing ? 'Edit' : 'Add'} Supplier</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" placeholder="Supplier Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border p-2 rounded-xl" required />
          <input type="text" placeholder="Contact Person" value={form.contact_person} onChange={e => setForm({...form, contact_person: e.target.value})} className="border p-2 rounded-xl" />
          <input type="tel" placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="border p-2 rounded-xl" />
          <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="border p-2 rounded-xl" />
          <textarea placeholder="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="border p-2 rounded-xl col-span-2" rows="2" />
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2 rounded-xl font-semibold">
              {saving ? 'Saving...' : (editing ? 'Update' : 'Create')}
            </button>
            {editing && <button type="button" onClick={resetForm} className="bg-gray-200 px-4 py-2 rounded-xl">Cancel</button>}
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
              <tr key={s.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium">{s.name}</td>
                <td className="p-4">{s.contact_person || '-'}</td>
                <td className="p-4">{s.phone || '-'}</td>
                <td className="p-4">{s.email || '-'}</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => handleEdit(s)} className="text-blue-600"><Edit2 size={18} /></button>
                  <button onClick={() => handleDelete(s.id)} className="text-red-600"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="5" className="text-center p-8 text-gray-400">No suppliers found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
