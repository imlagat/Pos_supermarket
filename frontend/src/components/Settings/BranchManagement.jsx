import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Lock } from 'lucide-react';

import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
export default function BranchManagement() {
  const { user } = useAuthStore();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', location: '', contact_number: '', status: 'active' });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches');
      setBranches(res.data);
    } catch (err) {
      toast.error('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (branch) => {
    setFormData({ ...branch });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this branch?')) return;
    try {
      await api.delete(`/branches/${id}`);
      toast.success('Branch deleted');
      fetchBranches();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete branch');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await api.put(`/branches/${formData.id}`, formData);
        toast.success('Branch updated');
      } else {
        await api.post('/branches', formData);
        toast.success('Branch created');
      }
      setShowModal(false);
      fetchBranches();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  if (loading) return <div>Loading branches...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-lg font-semibold text-gray-800">Branch Management</h3>
        {user?.tenant?.tier === 'bronze' && branches.length >= 1 ? (
          <Link
            to="/billing"
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-gray-300 transition"
          >
            <Lock size={16} /> Upgrade to add branches
          </Link>
        ) : (
          <button
            onClick={() => { setFormData({ id: null, name: '', location: '', contact_number: '', status: 'active' }); setShowModal(true); }}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-orange-700"
          >
            <Plus size={16} /> Add Branch
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
              <th className="p-3">ID</th>
              <th className="p-3">Name</th>
              <th className="p-3">Location</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {branches.map(branch => (
              <tr key={branch.id} className="hover:bg-gray-50">
                <td className="p-3 text-sm text-gray-500">#{branch.id}</td>
                <td className="p-3 font-medium text-gray-800">{branch.name}</td>
                <td className="p-3 text-gray-600">{branch.location || '-'}</td>
                <td className="p-3 text-gray-600">{branch.contact_number || '-'}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${branch.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {branch.status}
                  </span>
                </td>
                <td className="p-3 flex justify-end gap-2">
                  <button onClick={() => handleEdit(branch)} className="p-1.5 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition" title="Edit">
                    <Edit size={16} />
                  </button>
                  {branch.id !== 1 && (
                    <button onClick={() => handleDelete(branch.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{formData.id ? 'Edit Branch' : 'Add Branch'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full border p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                <input type="text" value={formData.contact_number} onChange={e => setFormData({ ...formData, contact_number: e.target.value })} className="w-full border p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full border p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
