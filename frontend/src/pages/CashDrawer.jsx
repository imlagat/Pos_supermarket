import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Banknote, Smartphone, History, ArrowDownToLine, Wallet, CreditCard } from 'lucide-react';
import PageLoader from '../components/common/PageLoader';
import DepositModal from '../components/CashDrawer/DepositModal';

export default function CashDrawer() {
  const [activeTab, setActiveTab] = useState('balance');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get('/shifts/drawer-status');
      setStatus(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setStatus(null); // No open shift
      } else {
        toast.error('Failed to load cash drawer status');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoader message="Loading cash drawer..." />;

  if (!status) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Wallet className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Active Shift</h2>
          <p className="text-gray-500 max-w-md">
            You don't have an open shift. Please start a shift from the POS screen to access the cash drawer.
          </p>
        </div>
      </div>
    );
  }

  const shiftTime = new Date(status.shift.opening_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const registerName = 'Register 01'; // Can be dynamic if branches/registers are mapped

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
            <Banknote size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Cash Drawer</h1>
        </div>
        <p className="text-gray-500 ml-12">Track your cash balance and record deposits</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white p-1 rounded-xl w-fit shadow-sm border border-gray-100">
        <button
          onClick={() => setActiveTab('balance')}
          className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'balance' ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          My Balance
        </button>
        <button
          onClick={() => setActiveTab('deposits')}
          className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'deposits' ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <ArrowDownToLine size={16} /> My Deposits
        </button>
      </div>

      {activeTab === 'balance' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cash Card */}
            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 relative overflow-hidden">
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <div className="flex items-center gap-2 text-emerald-700 mb-2">
                    <Banknote size={16} />
                    <span className="text-xs font-bold tracking-wider uppercase">Cash In Drawer</span>
                  </div>
                  <div className="text-3xl font-bold text-emerald-900 mb-2">
                    Ksh {status.cash_in_drawer.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-emerald-600">
                    Opened: {shiftTime} • {registerName}
                  </div>
                </div>
                <button
                  onClick={() => setShowDepositModal(true)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
                >
                  <ArrowDownToLine size={14} /> Deposit
                </button>
              </div>
            </div>

            {/* M-Pesa Card */}
            <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100 relative overflow-hidden flex flex-col justify-center">
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-orange-700 mb-2">
                  <Smartphone size={16} />
                  <span className="text-xs font-bold tracking-wider uppercase">M-Pesa Float</span>
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-2">
                  Ksh {status.mpesa_total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-orange-600">
                  Opening: Ksh {status.opening_mpesa.toLocaleString(undefined, { minimumFractionDigits: 2 })} • Today's M-Pesa sales: Ksh {status.mpesa_sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Card Card */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-purple-100 relative overflow-hidden flex flex-col justify-center">
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-slate-700 mb-2">
                  <CreditCard size={16} />
                  <span className="text-xs font-bold tracking-wider uppercase">Card Payments</span>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">
                  Ksh {status.card_total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-600">
                  Today's Card sales: Ksh {status.card_sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Breakdowns */}
          <div className="grid grid-cols-1 gap-6">
            {/* Cash Breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
                <Banknote size={18} className="text-emerald-600" />
                <h3 className="font-bold text-gray-800 text-sm">Cash Breakdown</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Opening float</span>
                  <span className="font-medium text-emerald-600">+Ksh {status.opening_cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Cash sales</span>
                  <span className="font-medium text-emerald-600">+Ksh {status.cash_sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {status.deposits > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Deposits</span>
                    <span className="font-medium text-red-600">-Ksh {status.deposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="pt-4 mt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="font-bold text-gray-800">Drawer Total</span>
                  <span className="font-bold text-xl text-gray-900">Ksh {status.cash_in_drawer.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* M-Pesa Breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
                <Smartphone size={18} className="text-orange-600" />
                <h3 className="font-bold text-gray-800 text-sm">M-Pesa Breakdown</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Opening M-Pesa</span>
                  <span className="font-medium text-emerald-600">+Ksh {status.opening_mpesa.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">M-Pesa sales</span>
                  <span className="font-medium text-emerald-600">+Ksh {status.mpesa_sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-4 mt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="font-bold text-gray-800">Expected M-Pesa</span>
                  <span className="font-bold text-xl text-gray-900">Ksh {status.mpesa_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Card Breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
                <CreditCard size={18} className="text-slate-600" />
                <h3 className="font-bold text-gray-800 text-sm">Card Breakdown</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Card sales</span>
                  <span className="font-medium text-emerald-600">+Ksh {status.card_sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-4 mt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="font-bold text-gray-800">Expected Card Total</span>
                  <span className="font-bold text-xl text-gray-900">Ksh {status.card_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'deposits' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <History size={18} className="text-gray-500" />
              <h3 className="font-bold text-gray-800 text-sm">Recent activity</h3>
            </div>
            <button
              onClick={() => setShowDepositModal(true)}
              className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors"
            >
              New Deposit
            </button>
          </div>
          <div className="p-0">
            {status.movements.length === 0 ? (
              <div className="text-center py-12 text-sm text-gray-500">
                No movements yet
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {status.movements.map(mov => (
                  <div key={mov.id} className="p-4 hover:bg-gray-50 transition flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 capitalize">{mov.type}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(mov.created_at).toLocaleTimeString()} • {mov.notes || 'No notes'}
                      </p>
                    </div>
                    <div className="font-bold text-red-600">
                      -Ksh {Number(mov.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onSuccess={fetchStatus}
      />
    </div>
  );
}
