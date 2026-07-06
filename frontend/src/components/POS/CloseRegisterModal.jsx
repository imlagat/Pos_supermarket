import React, { useState, useEffect } from 'react';
import { X, Wallet, Smartphone, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function CloseRegisterModal({ onClose, onShiftClosed }) {
  const [actualCash, setActualCash] = useState('');
  const [actualMpesa, setActualMpesa] = useState('');
  const [actualCard, setActualCard] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/shifts/drawer-status');
      setStatus(res.data);
      setActualCash(res.data.cash_in_drawer.toString());
      setActualMpesa(res.data.mpesa_total.toString());
      setActualCard(res.data.card_total.toString());
    } catch (err) {
      toast.error('Failed to load drawer status');
      onClose();
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (actualCash === '' || isNaN(actualCash) || Number(actualCash) < 0) {
      toast.error('Please enter a valid cash amount');
      return;
    }
    if (actualMpesa === '' || isNaN(actualMpesa) || Number(actualMpesa) < 0) {
      toast.error('Please enter a valid M-Pesa amount');
      return;
    }
    if (actualCard === '' || isNaN(actualCard) || Number(actualCard) < 0) {
      toast.error('Please enter a valid Card amount');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/shifts/close', {
        actual_cash: Number(actualCash),
        actual_mpesa: Number(actualMpesa),
        actual_card: Number(actualCard),
        notes
      });
      toast.success('Shift closed successfully');
      onShiftClosed(res.data.shift);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to close shift');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Calculating totals...</p>
        </div>
      </div>
    );
  }

  const renderVariance = (actual, expected) => {
    if (actual === '' || isNaN(actual)) return null;
    const diff = Number(actual) - Number(expected);
    if (Math.abs(diff) < 0.01) {
      return (
        <div className="mt-4 flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg text-sm font-semibold border border-emerald-100">
          <CheckCircle2 size={16} /> Balanced
        </div>
      );
    }
    if (diff > 0) {
      return (
        <div className="mt-4 flex items-center gap-1 text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg text-sm font-semibold border border-orange-100">
          <AlertCircle size={16} /> + Overage: Ksh {diff.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      );
    }
    return (
      <div className="mt-4 flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg text-sm font-semibold border border-red-100">
        <AlertCircle size={16} /> - Shortage: Ksh {Math.abs(diff).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#f3f4f6] rounded-[24px] w-full max-w-4xl overflow-hidden shadow-2xl animate-fade-in relative">
        <button onClick={onClose} className="absolute top-5 right-5 text-gray-500 hover:text-gray-800 transition">
          <X size={20} />
        </button>
        
        <div className="p-8 pb-6">
          <h2 className="text-xl font-bold text-gray-800">Close Shift</h2>
          <p className="text-sm text-gray-500 mt-1">Reconcile cash drawer, M-Pesa, and Card float</p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8">
          <div className="grid grid-cols-3 gap-6 mb-6">
            
            {/* Cash Drawer Column */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col">
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 w-fit px-3 py-1.5 rounded-lg mb-6">
                <Wallet size={16} />
                <span className="text-sm font-bold tracking-wide">Cash Drawer</span>
              </div>
              
              <div className="space-y-3 mb-6 flex-1">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Opening</span>
                  <span className="font-semibold text-gray-800">Ksh {status.opening_cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>+ Cash sales</span>
                  <span className="font-semibold">Ksh {status.cash_sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {status.deposits > 0 && (
                  <div className="flex justify-between text-sm text-red-500">
                    <span>- Deposits</span>
                    <span className="font-semibold">Ksh {status.deposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-3 border-t border-gray-100">
                  <span>Expected</span>
                  <span>Ksh {status.cash_in_drawer.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 tracking-wider mb-2 uppercase">Actual Cash Counted</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">Ksh</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={actualCash}
                    onChange={(e) => setActualCash(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-mono font-semibold text-gray-800"
                    placeholder="0.00"
                  />
                </div>
                {renderVariance(actualCash, status.cash_in_drawer)}
              </div>
            </div>

            {/* M-Pesa Float Column */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col">
              <div className="flex items-center gap-2 text-orange-700 bg-orange-50 w-fit px-3 py-1.5 rounded-lg mb-6">
                <Smartphone size={16} />
                <span className="text-sm font-bold tracking-wide">M-Pesa Float</span>
              </div>
              
              <div className="space-y-3 mb-6 flex-1">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Opening</span>
                  <span className="font-semibold text-gray-800">Ksh {status.opening_mpesa.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>+ M-Pesa sales</span>
                  <span className="font-semibold">Ksh {status.mpesa_sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-3 border-t border-gray-100">
                  <span>Expected</span>
                  <span>Ksh {status.mpesa_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 tracking-wider mb-2 uppercase">Actual M-Pesa Balance</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">Ksh</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={actualMpesa}
                    onChange={(e) => setActualMpesa(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-mono font-semibold text-gray-800"
                    placeholder="0.00"
                  />
                </div>
                {renderVariance(actualMpesa, status.mpesa_total)}
              </div>
            </div>

            {/* Card Float Column */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col">
              <div className="flex items-center gap-2 text-slate-700 bg-slate-50 w-fit px-3 py-1.5 rounded-lg mb-6">
                <Wallet size={16} />
                <span className="text-sm font-bold tracking-wide">Card Float</span>
              </div>
              
              <div className="space-y-3 mb-6 flex-1">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Opening</span>
                  <span className="font-semibold text-gray-800">Ksh 0.00</span>
                </div>
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>+ Card sales</span>
                  <span className="font-semibold">Ksh {status.card_sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-3 border-t border-gray-100">
                  <span>Expected</span>
                  <span>Ksh {status.card_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 tracking-wider mb-2 uppercase">Actual Card Balance</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">Ksh</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={actualCard}
                    onChange={(e) => setActualCard(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-mono font-semibold text-gray-800"
                    placeholder="0.00"
                  />
                </div>
                {renderVariance(actualCard, status.card_total)}
              </div>
            </div>

          </div>

          <div className="mb-8">
            <label className="block text-xs font-bold text-gray-400 tracking-wider mb-2 uppercase">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none text-sm text-gray-700"
              placeholder="Any discrepancies, explanations, or shift notes..."
              rows={2}
            ></textarea>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md disabled:opacity-50 flex justify-center items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Close Shift'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
