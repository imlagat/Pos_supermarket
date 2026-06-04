import { useEffect, useState } from 'react';
import api from '../services/api';
import ReceiptModal from '../components/POS/ReceiptModal';
import { Receipt, Search, Eye, Download, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [period, setPeriod] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [exporting, setExporting] = useState(false);
  const [returns, setReturns] = useState([]);
  const [systemSettings, setSystemSettings] = useState({});

  useEffect(() => {
    fetchTransactions();
    fetchReturns();
    fetchSettings();
  }, [period, customStart, customEnd]);

  const fetchReturns = async () => {
    try {
      const res = await api.get('/returns');
      setReturns(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSystemSettings(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchTransactions = async () => {
    try {
      let url = '/transactions';
      if (period !== 'all') {
        url = `/transactions?period=${period}`;
      } else if (customStart && customEnd) {
        url = `/transactions?start_date=${customStart}&end_date=${customEnd}`;
      }
      const res = await api.get(url);
      setTransactions(res.data);
    } catch (err) {
      toast.error('Failed to load transactions');
    }
  };

  const exportCSV = async () => {
    setExporting(true);
    try {
      let url = '/transactions/export';
      const params = new URLSearchParams();
      if (period !== 'all') params.append('period', period);
      else if (customStart && customEnd) {
        params.append('start_date', customStart);
        params.append('end_date', customEnd);
      }
      if ([...params].length) url += '?' + params.toString();
      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const link = document.createElement('a');
      const downloadUrl = window.URL.createObjectURL(blob);
      link.href = downloadUrl;
      link.download = `transactions_${new Date().toISOString().slice(0, 19)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('Export started');
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  // Check if an order has any returns
  const hasReturn = (orderId) => {
    return returns.some(r => r.order_id === orderId);
  };

  const filtered = transactions.filter(t =>
    t.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.cashier?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const viewReceipt = (transaction) => {
    setSelectedTransaction(transaction);
    setShowReceipt(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Receipt className="w-6 h-6 text-amber-500" /> Transactions
        </h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order #, customer, cashier..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Filter and Export Bar */}
      <div className="bg-white rounded-2xl shadow-xl p-4 mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-500" />
          <span className="font-medium">Filter:</span>
        </div>
        <select
          value={period}
          onChange={e => { setPeriod(e.target.value); setCustomStart(''); setCustomEnd(''); }}
          className="border rounded-xl px-3 py-2"
        >
          <option value="all">All Time</option>
          <option value="daily">Today</option>
          <option value="weekly">This Week</option>
          <option value="monthly">This Month</option>
          <option value="yearly">This Year</option>
          <option value="custom">Custom Range</option>
        </select>
        {period === 'custom' && (
          <>
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="border rounded-xl px-3 py-2"
              placeholder="Start Date"
            />
            <span>to</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="border rounded-xl px-3 py-2"
              placeholder="End Date"
            />
          </>
        )}
        <button
          onClick={exportCSV}
          disabled={exporting}
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-xl flex items-center gap-2"
        >
          <Download size={18} /> {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4">Order #</th>
                <th className="text-left p-4">Date</th>
                <th className="text-left p-4">Customer</th>
                <th className="text-left p-4">Cashier</th>
                <th className="text-left p-4">Total</th>
                <th className="text-left p-4">Payment</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">{t.order_number}</td>
                  <td className="p-4">{new Date(t.created_at).toLocaleString()}</td>
                  <td className="p-4">{t.customer?.name || 'Walk-in'}</td>
                  <td className="p-4">{t.cashier?.name}</td>
                  <td className="p-4 text-amber-600 font-bold">Ksh {t.total_amount}</td>
                  <td className="p-4">
                    {t.payments.map(p => `${p.method.toUpperCase()} (Ksh ${p.amount})`).join(', ')}
                  </td>
                  <td className="p-4">
                    {hasReturn(t.id) ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span> Returned
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Completed
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <button onClick={() => viewReceipt(t)} className="text-blue-600 hover:text-blue-800">
                      <Eye size={18} /> Receipt
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="8" className="text-center p-8 text-gray-400">No transactions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reuse the same ReceiptModal component */}
      {showReceipt && selectedTransaction && (
        <ReceiptModal
          order={selectedTransaction}
          changeAmount={0}
          discounts={[]}
          pointsDiscount={0}
          customer={selectedTransaction.customer}
          settings={systemSettings}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
}
