import { useEffect, useState } from 'react';
import api from '../services/api';
import { Filter, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import PageLoader from '../components/common/PageLoader';

export default function AuditLogs() {
  const getEventAction = (log) => {
    const action = (log.action || '').toLowerCase();
    let model = log.model_type ? log.model_type.split('\\').pop() : '';

    if (model === 'Order') {
      if (action === 'created') return `performed a sale`;
      if (action === 'updated') return `updated a sale`;
      if (action === 'deleted') return `deleted a sale`;
    }
    if (model === 'DiscountRule') {
      if (action === 'created') return `created a discount`;
      if (action === 'updated') return `adjusted a discount`;
      if (action === 'deleted') return `removed a discount`;
    }
    if (model === 'ReturnOrder' || model === 'ReturnedItem') {
      if (action === 'created') return `processed a return`;
    }

    const actionMapping = {
      'created': 'added a new',
      'updated': 'updated the',
      'deleted': 'deleted a',
      'login': 'logged in',
      'logout': 'logged out'
    };

    const verb = actionMapping[action] || action;

    if (model) {
      // Lowercase and add spaces to CamelCase words
      model = model.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
    }

    if (!model) return verb;
    return `${verb} ${model}`;
  };

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

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
      setTotalItems(res.data.total || (res.data.data ? res.data.data.length : 0));
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

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    const dateOpts = { day: '2-digit', month: 'short', year: 'numeric' };
    const timeOpts = { hour: '2-digit', minute: '2-digit' };
    return {
      date: d.toLocaleDateString('en-GB', dateOpts),
      time: d.toLocaleTimeString('en-GB', timeOpts)
    };
  };

  const getActionColor = (actionVerb) => {
    const lower = actionVerb.toLowerCase();
    if (lower.includes('added') || lower.includes('created') || lower.includes('performed')) return 'text-green-600';
    if (lower.includes('updated') || lower.includes('adjusted')) return 'text-blue-600';
    if (lower.includes('deleted') || lower.includes('removed')) return 'text-red-600';
    if (lower.includes('return')) return 'text-orange-700';
    return 'text-gray-700';
  };

  if (loading && logs.length === 0) return <PageLoader message="Loading audit logs..." />;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      {/* Header matching the sample */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit Logs</h1>
        <p className="text-gray-500 text-sm mb-1">Monitor any changes made to your project, schema and content with audit logs.</p>
        <a href="#" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Learn more ↗</a>
      </div>

      {/* Filter matching the sample */}
      <div className="mb-6">
        <div className="relative max-w-xl">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filter"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm text-gray-700"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 text-red-700 text-sm">
          {error}
          <button onClick={fetchLogs} className="ml-4 underline font-medium">Retry</button>
        </div>
      )}

      {/* Table matching the sample */}
      <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Action Description</th>
                <th className="px-6 py-3 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(log => {
                const actionText = getEventAction(log);
                const { date, time } = formatDate(log.created_at);
                const userName = log.user?.name || 'System';
                const userRole = log.user?.role || 'Admin';

                return (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                        <img 
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random&color=fff`} 
                          alt={userName} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{userName}</div>
                        <div className="text-gray-500 text-xs capitalize">{userRole}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold text-xs tracking-wide uppercase ${getActionColor(actionText)}`}>
                        {actionText}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      <div>{date}</div>
                      <div className="text-xs">{time}</div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan="3" className="text-center py-12 text-gray-400">No audit logs found matching your filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination matching the sample */}
      <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500 gap-4">
        <div className="font-medium">{totalItems} items</div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setPage(p => Math.max(1, p-1))} 
            disabled={page === 1} 
            className="text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            Previous
          </button>
          
          <div className="flex items-center gap-2">
            <span>Page</span>
            <input 
              type="text" 
              readOnly 
              value={page} 
              className="w-10 text-center border border-gray-200 rounded py-1 focus:outline-none"
            />
            <span>of {lastPage}</span>
          </div>

          <button 
            onClick={() => setPage(p => Math.min(lastPage, p+1))} 
            disabled={page === lastPage} 
            className="text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            Next
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span>Show</span>
          <select className="border border-gray-200 rounded py-1 pl-2 pr-6 focus:outline-none bg-white">
            <option>25</option>
            <option>50</option>
            <option>100</option>
          </select>
        </div>
      </div>
    </div>
  );
}
