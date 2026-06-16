import React, { useState } from 'react';
import { Wallet, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function StartShiftModal({ onShiftStarted, onCancel, branchId }) {
  const [openingBalance, setOpeningBalance] = useState('');
  const [openingMpesa, setOpeningMpesa] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!openingBalance || isNaN(openingBalance) || Number(openingBalance) < 0) {
      toast.error('Please enter a valid cash opening float amount');
      return;
    }
    if (!openingMpesa || isNaN(openingMpesa) || Number(openingMpesa) < 0) {
      toast.error('Please enter a valid M-Pesa opening float amount');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/shifts/open', {
        opening_balance: Number(openingBalance),
        opening_mpesa_balance: Number(openingMpesa),
        branch_id: branchId
      });
      toast.success('Shift started successfully!');
      onShiftStarted(res.data.shift);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start shift');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6 text-white text-center">
          <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet size={32} />
          </div>
          <h2 className="text-2xl font-bold">Start Your Shift</h2>
          <p className="text-orange-100 mt-1">Please declare your opening float</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Opening Float (Cash in Drawer)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Ksh</span>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-mono text-lg"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Opening M-Pesa Float</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Ksh</span>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={openingMpesa}
                onChange={(e) => setOpeningMpesa(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-mono text-lg"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Starting Shift...' : 'Open Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
