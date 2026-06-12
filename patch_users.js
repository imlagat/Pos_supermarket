const fs = require('fs');
const file = '/Users/mac/Desktop/supermarket/frontend/src/pages/Users.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `import { Users as UsersIcon, Plus, Edit2, Trash2, Search } from 'lucide-react';`,
  `import { Users as UsersIcon, Plus, Edit2, Trash2, Search, BarChart3, Filter } from 'lucide-react';\nimport { useAuthStore } from '../stores/authStore';`
);

content = content.replace(
  `  const [searchTerm, setSearchTerm] = useState('');`,
  `  const [searchTerm, setSearchTerm] = useState('');\n  const { user } = useAuthStore();\n  const [activeTab, setActiveTab] = useState('manage'); // 'manage' or 'performance'\n  const [performanceData, setPerformanceData] = useState([]);\n  const [period, setPeriod] = useState('daily');\n  const [customStart, setCustomStart] = useState('');\n  const [customEnd, setCustomEnd] = useState('');`
);

content = content.replace(
  `  useEffect(() => { fetchUsers(); }, []);`,
  `  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    if (activeTab === 'performance') {
      fetchPerformance();
    }
  }, [activeTab, period, customStart, customEnd]);

  const fetchPerformance = async () => {
    if (period === 'custom' && (!customStart || !customEnd)) return;
    try {
      setLoading(true);
      let url = \`/users/performance?period=\${period}\`;
      if (period === 'custom') {
        url += \`&start_date=\${customStart}&end_date=\${customEnd}\`;
      }
      const res = await api.get(url);
      setPerformanceData(res.data);
    } catch (err) {
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };`
);

content = content.replace(
  `      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><UsersIcon className="text-amber-500" /> User Management</h1>
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border rounded-xl" /></div>
      </div>`,
  `      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><UsersIcon className="text-amber-500" /> User Management</h1>
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <div className="flex gap-4 mt-4 border-b">
              <button 
                onClick={() => setActiveTab('manage')} 
                className={\`pb-2 font-medium transition-colors \${activeTab === 'manage' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-500 hover:text-gray-700'}\`}
              >
                Manage Users
              </button>
              <button 
                onClick={() => setActiveTab('performance')} 
                className={\`pb-2 font-medium flex items-center gap-1 transition-colors \${activeTab === 'performance' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-500 hover:text-gray-700'}\`}
              >
                <BarChart3 size={18} /> Performance Reports
              </button>
            </div>
          )}
        </div>
        {activeTab === 'manage' && (
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border rounded-xl" /></div>
        )}
      </div>

      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <Filter className="text-gray-400" size={20} />
            <select value={period} onChange={e => setPeriod(e.target.value)} className="border p-2 rounded-xl outline-none focus:ring-2 focus:ring-amber-500">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom Range</option>
            </select>
            {period === 'custom' && (
              <div className="flex items-center gap-2">
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="border p-2 rounded-xl outline-none focus:ring-2 focus:ring-amber-500" />
                <span>to</span>
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="border p-2 rounded-xl outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-left font-semibold text-gray-700">Cashier Name</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Email</th>
                  <th className="p-4 text-right font-semibold text-gray-700">Orders Taken</th>
                  <th className="p-4 text-right font-semibold text-gray-700">Total Sales</th>
                </tr>
              </thead>
              <tbody>
                {performanceData.map(perf => (
                  <tr key={perf.user_id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800">{perf.name}</td>
                    <td className="p-4 text-gray-500">{perf.email}</td>
                    <td className="p-4 text-right font-bold text-blue-600">{perf.orders_taken}</td>
                    <td className="p-4 text-right font-bold text-amber-600">Ksh {perf.total_sales ? perf.total_sales.toLocaleString() : 0}</td>
                  </tr>
                ))}
                {performanceData.length === 0 && (
                  <tr><td colSpan="4" className="text-center p-8 text-gray-400">No performance data found for this period.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'manage' && (`
);

content = content.replace(
  `        </table>\n      </div>\n    </div>`,
  `        </table>\n      </div>\n      )}`
);
content += '\n    </div>\n  );\n}';

// Since the file structure changed slightly at the end, I'll be more precise with the end of the file.
fs.writeFileSync('patch_users_temp.js', content);
