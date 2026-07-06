import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import { Store } from 'lucide-react';

export default function BranchSelector() {
  const { user, activeBranchId, setActiveBranchId } = useAuthStore();
  const [branches, setBranches] = useState([]);
  
  useEffect(() => {
    if (user?.role === 'admin') {
      api.get('/branches')
        .then(res => setBranches(res.data))
        .catch(err => console.error('Failed to load branches', err));
    }
  }, [user]);

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="px-2 md:px-4 py-3 border-b border-slate-700/80 bg-slate-800/30">
      <div className="flex items-center gap-2 text-white mb-2 px-2 hidden md:flex">
        <Store size={14} className="text-orange-500" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-100">Select Branch</span>
      </div>
      <select
        value={activeBranchId || ''}
        onChange={(e) => {
          setActiveBranchId(e.target.value);
          window.location.reload(); // Reload to refresh data with new branch context
        }}
        className="w-full bg-slate-800 border border-slate-600 text-white font-semibold rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer hover:bg-slate-700 transition"
      >
        <option value="">All Branches (Admin View)</option>
        {branches.map(b => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
    </div>
  );
}
