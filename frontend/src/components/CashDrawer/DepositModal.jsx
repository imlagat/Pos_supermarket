import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function DepositModal({ isOpen, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      toast.error('Please enter a valid deposit amount');
      return;
    }

    setLoading(true);
    try {
      await api.post('/shifts/deposit', {
        amount: Number(amount),
        notes
      });
      toast.success('Deposit recorded successfully');
      onSuccess();
      onClose();
      setAmount('');
      setNotes('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record deposit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full animate-fade-in">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">Record Deposit</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Drop/Deposit</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Ksh</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-lg"
                placeholder="0.00"
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">This amount will be deducted from the Cash in Drawer.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              placeholder="e.g., Bank deposit via manager"
            ></textarea>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-medium disabled:opacity-50 flex justify-center items-center"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Confirm Deposit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
