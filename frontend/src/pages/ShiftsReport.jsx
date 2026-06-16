import { useEffect, useState } from 'react';
import api from '../services/api';
import { Calendar, Wallet, AlertTriangle, CheckCircle, Search, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ShiftsReport() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      const res = await api.get('/shifts');
      setShifts(res.data);
    } catch (err) {
      toast.error('Failed to load shifts report');
    } finally {
      setLoading(false);
    }
  };

  const filtered = shifts.filter(s =>
    s.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toString().includes(searchTerm)
  );

  const exportCSV = () => {
    const csvData = [
      ['Shift ID', 'Cashier', 'Status', 'Opened', 'Closed', 'Opening Float', 'Expected Cash', 'Actual Cash', 'Variance', 'Notes']
    ];

    filtered.forEach(s => {
      csvData.push([
        s.id,
        s.user?.name || 'Unknown',
        s.status.toUpperCase(),
        new Date(s.opening_time).toLocaleString(),
        s.closing_time ? new Date(s.closing_time).toLocaleString() : 'N/A',
        s.opening_balance,
        s.expected_cash || '',
        s.actual_cash || '',
        s.variance || '',
        s.notes || ''
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvData.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `shifts_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Wallet className="w-6 h-6 text-orange-600" /> Shifts & Cash Reconciliation
        </h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search cashier or shift ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-600 w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-4 mb-6 flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-5 h-5 text-orange-600" />
          <span className="font-medium">All Historical Shifts</span>
        </div>
        <button
          onClick={exportCSV}
          className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:from-gray-900 hover:to-black transition"
        >
          <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500 animate-pulse">Loading shifts...</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b sticky top-0 z-10">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Shift ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Cashier</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Timeline</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Float (Ksh)</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Expected</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actual</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Variance</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">#{s.id}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{s.user?.name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      <div><span className="font-medium text-gray-700">Open:</span> {new Date(s.opening_time).toLocaleString()}</div>
                      {s.closing_time && <div><span className="font-medium text-gray-700">Close:</span> {new Date(s.closing_time).toLocaleString()}</div>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-600">{Number(s.opening_balance).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-600">{s.expected_cash ? Number(s.expected_cash).toFixed(2) : '-'}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-800 font-semibold">{s.actual_cash ? Number(s.actual_cash).toFixed(2) : '-'}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold">
                      {s.variance !== null ? (
                        <span className={`inline-flex items-center gap-1 ${Number(s.variance) < 0 ? 'text-red-600' : Number(s.variance) > 0 ? 'text-orange-500' : 'text-green-600'}`}>
                          {Number(s.variance) !== 0 && <AlertTriangle size={14} />}
                          {Number(s.variance).toFixed(2)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.status === 'open' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> IN PROGRESS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
                          <CheckCircle size={12} className="text-gray-500" /> CLOSED
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan="8" className="text-center py-8 text-gray-400">No shifts found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
