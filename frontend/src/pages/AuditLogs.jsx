import { useEffect, useState } from 'react';
import api from '../services/api';
import { FileText, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/audit-logs?page=${page}`);
      setLogs(res.data.data || []);
      setLastPage(res.data.last_page || 1);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load audit logs');
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter(log =>
    (log.model_type?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (log.action?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (log.user?.name?.toLowerCase() || '').includes(search.toLowerCase())
  );

  if (loading) return <div className="text-center p-8">Loading audit logs...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="text-amber-500" /> Audit Logs
        </h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-red-700">
          {error}
          <button onClick={fetchLogs} className="ml-4 underline">Retry</button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-left">User</th>
                <th className="p-4 text-left">Action</th>
                <th className="p-4 text-left">Model</th>
                <th className="p-4 text-left">Record ID</th>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">IP</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">{log.user?.name || 'System'}</td>
                  <td className="p-4 capitalize">{log.action}</td>
                  <td className="p-4">{log.model_type?.split('\\').pop() || '-'}</td>
                  <td className="p-4">{log.model_id || '-'}</td>
                  <td className="p-4">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="p-4">{log.ip_address || '-'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="6" className="text-center p-8 text-gray-400">No audit logs found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {lastPage > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="px-4 py-2 border rounded-xl disabled:opacity-50">Previous</button>
          <span className="px-4 py-2">Page {page} of {lastPage}</span>
          <button onClick={() => setPage(p => Math.min(lastPage, p+1))} disabled={page === lastPage} className="px-4 py-2 border rounded-xl disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
