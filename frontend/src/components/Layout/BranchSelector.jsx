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
    <div className="px-2 md:px-4 py-2 border-b border-amber-700/50">
      <div className="flex items-center gap-2 text-amber-200 mb-1 px-2 hidden md:flex">
        <Store size={14} />
        <span className="text-xs font-semibold uppercase tracking-wider">Select Branch</span>
      </div>
      <select
        value={activeBranchId || ''}
        onChange={(e) => {
          setActiveBranchId(e.target.value);
          window.location.reload(); // Reload to refresh data with new branch context
        }}
        className="w-full bg-amber-900/50 border border-amber-600 text-white rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        <option value="">All Branches (Admin View)</option>
        {branches.map(b => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
    </div>
  );
}
