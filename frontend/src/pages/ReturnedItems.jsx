import { useEffect, useState } from 'react';
import PageLoader from '../components/common/PageLoader';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Package, Trash2, Tag, X } from 'lucide-react';

export default function ReturnedItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [openBoxPrice, setOpenBoxPrice] = useState('');
  const [disposeReason, setDisposeReason] = useState('');
  const [actionType, setActionType] = useState(null); // 'openbox' or 'dispose'

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get('/returned-items');
      setItems(res.data);
    } catch (err) {
      toast.error('Failed to load returned items');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBox = async (item) => {
    if (!openBoxPrice || parseFloat(openBoxPrice) <= 0) {
      toast.error('Enter a valid price');
      return;
    }
    try {
      await api.post(`/returned-items/${item.id}/open-box`, { open_box_price: openBoxPrice });
      toast.success('Item marked as open box');
      setSelectedItem(null);
      setOpenBoxPrice('');
      setActionType(null);
      fetchItems();
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
      setSelectedItem(null);
      setDisposeReason('');
      setActionType(null);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <PageLoader message="Loading returned items..." />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Package className="text-orange-600" /> Returned Items Management
      </h1>
      <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 text-left">Product</th>
              <th className="p-4 text-left">Quantity</th>
              <th className="p-4 text-left">Condition</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium">{item.product?.name}</td>
                <td className="p-4">{item.quantity}</td>
                <td className="p-4 capitalize">{item.condition}</td>
                <td className="p-4 capitalize">{item.status}</td>
                <td className="p-4 flex gap-2">
                  {(item.status === 'pending' || item.status === 'open_box') && (
                    <>
                      <button onClick={() => { setSelectedItem(item); setActionType('openbox'); setOpenBoxPrice(item.open_box_price || (item.product?.base_price * 0.5).toFixed(2)); }} className="text-blue-600 hover:text-blue-800"><Tag size={18} /> {item.status === 'open_box' ? 'Edit Price' : 'Open Box'}</button>
                      <button onClick={() => { setSelectedItem(item); setActionType('dispose'); }} className="text-red-600 hover:text-red-800"><Trash2 size={18} /> Dispose</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Open Box / Dispose */}
      {selectedItem && actionType === 'openbox' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Mark as Open Box</h3>
              <button onClick={() => { setSelectedItem(null); setActionType(null); }}><X size={20} /></button>
            </div>
            <p><strong>Product:</strong> {selectedItem.product?.name}</p>
            <p><strong>Original Price:</strong> Ksh {selectedItem.product?.base_price}</p>
            <label className="block mt-4 mb-1">Open Box Price (Ksh)</label>
            <input type="number" step="0.01" value={openBoxPrice} onChange={e => setOpenBoxPrice(e.target.value)} className="border p-2 rounded-xl w-full" />
            <button onClick={() => handleOpenBox(selectedItem)} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-xl w-full">Save</button>
          </div>
        </div>
      )}

      {selectedItem && actionType === 'dispose' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Dispose Item</h3>
              <button onClick={() => { setSelectedItem(null); setActionType(null); }}><X size={20} /></button>
            </div>
            <p><strong>Product:</strong> {selectedItem.product?.name}</p>
            <label className="block mt-4 mb-1">Reason for disposal</label>
            <textarea value={disposeReason} onChange={e => setDisposeReason(e.target.value)} className="border p-2 rounded-xl w-full" rows="3" />
            <button onClick={() => handleDispose(selectedItem)} className="mt-4 bg-red-600 text-white px-4 py-2 rounded-xl w-full">Confirm Dispose</button>
          </div>
        </div>
      )}
    </div>
  );
}
