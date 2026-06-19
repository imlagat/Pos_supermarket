import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { LogOut, Shield, Users, Building2, Activity, Settings, RefreshCw, XCircle, CheckCircle, Clock, ShoppingCart } from 'lucide-react';

export default function SuperAdminDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'super_admin') {
      navigate('/super-admin/login');
      return;
    }
    fetchTenants();
  }, [user, navigate]);

  const fetchTenants = async () => {
    try {
      const res = await api.get('/super-admin/tenants');
      setTenants(res.data);
    } catch (error) {
      toast.error('Failed to fetch tenants');
    } finally {
      setLoading(false);
    }
  };

  const updateTier = async (tenantId, newTier) => {
    try {
      await api.put(`/super-admin/tenants/${tenantId}/tier`, { tier: newTier });
      toast.success('Tenant tier updated successfully');
      fetchTenants();
    } catch (error) {
      toast.error('Failed to update tenant tier');
    }
  };

  const toggleStatus = async (tenantId, currentStatus) => {
    try {
      await api.put(`/super-admin/tenants/${tenantId}/status`, { is_active: !currentStatus });
      toast.success('Tenant status updated');
      fetchTenants();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-orange-600">Loading...</div>;

  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.is_active).length;
  const suspendedTenants = tenants.filter(t => !t.is_active).length;
  const expiredTenants = tenants.filter(t => t.trial_ends_at && new Date(t.trial_ends_at) < new Date()).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 bg-[#E55A2A] rounded-xl flex items-center justify-center shadow-sm">
                <ShoppingCart className="text-white w-5 h-5" strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-black tracking-tight">
                <span className="text-slate-900">POS</span>
                <span className="text-[#E55A2A]">super</span>
                <span className="text-sm font-medium text-gray-400 ml-2">Admin Portal</span>
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-500">{user?.email}</span>
              <button 
                onClick={() => { logout(); navigate('/super-admin/login'); }}
                className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><Building2 size={24} /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Stores</p>
              <h3 className="text-2xl font-bold text-gray-900">{totalTenants}</h3>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg"><CheckCircle size={24} /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active</p>
              <h3 className="text-2xl font-bold text-gray-900">{activeTenants}</h3>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="p-3 bg-gray-100 text-gray-600 rounded-lg"><XCircle size={24} /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Suspended</p>
              <h3 className="text-2xl font-bold text-gray-900">{suspendedTenants}</h3>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><Clock size={24} /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Expired Subs</p>
              <h3 className="text-2xl font-bold text-gray-900">{expiredTenants}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users size={20} className="text-gray-500"/>
              Registered Stores
            </h2>
            <button onClick={fetchTenants} className="text-gray-500 hover:text-orange-600 transition-colors">
              <RefreshCw size={18} />
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-900 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Store Name</th>
                  <th className="px-6 py-4">Tier Plan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Subscription Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tenants.map(tenant => {
                  const daysRemaining = tenant.trial_ends_at ? Math.ceil((new Date(tenant.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                  
                  return (
                    <tr key={tenant.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{tenant.name}</td>
                      <td className="px-6 py-4">
                        <select 
                          value={tenant.tier} 
                          onChange={(e) => updateTier(tenant.id, e.target.value)}
                          className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block p-2"
                        >
                          <option value="bronze">Bronze (Downgrade/Current)</option>
                          <option value="silver">Silver (Upgrade/Downgrade)</option>
                          <option value="custom">Custom (Upgrade)</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tenant.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                          {tenant.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {tenant.trial_ends_at ? (
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400">{new Date(tenant.trial_ends_at).toLocaleDateString()}</span>
                            {daysRemaining > 0 ? (
                              <span className="text-green-600 font-bold text-sm">{daysRemaining} days remaining</span>
                            ) : daysRemaining === 0 ? (
                              <span className="text-orange-500 font-bold text-sm">Expires today</span>
                            ) : (
                              <span className="text-red-500 font-bold text-sm">Expired {Math.abs(daysRemaining)} days ago</span>
                            )}
                          </div>
                        ) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        {tenant.tier === 'bronze' && (
                          <button 
                            onClick={() => updateTier(tenant.id, 'silver')}
                            className="text-sm font-bold px-3 py-1.5 rounded-lg border bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200"
                          >
                            Upgrade
                          </button>
                        )}
                        {tenant.tier === 'silver' && (
                          <button 
                            onClick={() => updateTier(tenant.id, 'bronze')}
                            className="text-sm font-bold px-3 py-1.5 rounded-lg border bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200"
                          >
                            Downgrade
                          </button>
                        )}
                        <button 
                          onClick={() => toggleStatus(tenant.id, tenant.is_active)}
                          className={`text-sm font-bold px-3 py-1.5 rounded-lg border ${tenant.is_active ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200'}`}
                        >
                          {tenant.is_active ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No stores registered yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
