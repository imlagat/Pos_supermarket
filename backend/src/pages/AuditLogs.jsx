import { useEffect, useState } from 'react';
import api from '../services/api';
import { FileText, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ user_id: '', action: '' });
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, [page, filters]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.user_id) params.append('user_id', filters.user_id);
      if (filters.action) params.append('action', filters.action);
      params.append('page', page);
      const res = await api.get(`/audit-logs?${params.toString()}`);
      setLogs(res.data.data || []);
      setLastPage(res.data.last_page || 1);
      setError(null);
    } catch (err) {
      setError('Failed to load audit logs');
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  if (loading) return <div className="text-center p-8">Loading audit logs...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="text-amber-500" /> Audit Logs
        </h1>
        <div className="flex gap-2">
          <select
            value={filters.user_id}
            onChange={e => handleFilterChange('user_id', e.target.value)}
            className="border rounded-xl px-3 py-2"
          >
            <option value="">All Users</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select
            value={filters.action}
            onChange={e => handleFilterChange('action', e.target.value)}
            className="border rounded-xl px-3 py-2"
          >
            <option value="">All Actions</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="sale">Sale</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="deleted">Deleted</option>
          </select>
          <button onClick={() => { setFilters({ user_id: '', action: '' }); setPage(1); }} className="bg-gray-200 px-4 py-2 rounded-xl">Clear</button>
        </div>
      </div>

      {error && <div className="bg-red-50 p-4 mb-4 rounded-xl text-red-700">{error} <button onClick={fetchLogs} className="underline ml-2">Retry</button></div>}

      <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
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
            {logs.map(log => (
              <tr key={log.id} className="border-b hover:bg-gray-50">
                <td className="p-4">{log.user?.name || 'System'}</td>
                <td className="p-4 capitalize">{log.action}</td>
                <td className="p-4">{log.model_type?.split('\\').pop() || '-'}</td>
                <td className="p-4">{log.model_id || '-'}</td>
                <td className="p-4">{new Date(log.created_at).toLocaleString()}</td>
                <td className="p-4">{log.ip_address || '-'}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <td><td colSpan="6" className="text-center p-8 text-gray-400">No audit logs found</td></td>
            )}
          </tbody>
        </table>
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
