import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { LogOut, Shield, Users, Building2, Activity, Settings, RefreshCw, XCircle, CheckCircle, Clock, ShoppingCart, Trash2, Edit2, CreditCard, Calendar, Loader2 } from 'lucide-react';

export default function SuperAdminDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stores');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [showEditTenantModal, setShowEditTenantModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editingTenant, setEditingTenant] = useState(null);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendingTenant, setExtendingTenant] = useState(null);
  const [extendDays, setExtendDays] = useState(7);
  const [adjustAction, setAdjustAction] = useState('add');
  const [actionLoading, setActionLoading] = useState({});

  const setLoader = (key, isLoading) => {
    setActionLoading(prev => ({ ...prev, [key]: isLoading }));
  };

  useEffect(() => {
    if (!user || user.role !== 'super_admin') {
      navigate('/super-admin/login');
      return;
    }
    fetchTenants();
    fetchAdmins();
    fetchSubscriptions();
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

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/super-admin/admins');
      setAdmins(res.data);
    } catch (error) {
      toast.error('Failed to fetch admins');
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const res = await api.get('/super-admin/subscriptions');
      setSubscriptions(res.data);
    } catch (error) {
      toast.error('Failed to fetch subscriptions');
    }
  };

  const updateSubscriptionStatus = async (id, newStatus) => {
    setLoader(`sub-status-${id}`, true);
    try {
      await api.put(`/super-admin/subscriptions/${id}`, { status: newStatus });
      toast.success('Subscription status updated');
      fetchSubscriptions();
      fetchTenants(); // Also refresh tenants to show updated tiers if it completed
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message || 'Failed to update subscription status');
    } finally {
      setLoader(`sub-status-${id}`, false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setLoader('modal-submit', true);
    try {
      await api.post('/super-admin/admins', newAdmin);
      toast.success('Super admin created successfully');
      setShowAdminModal(false);
      setNewAdmin({ name: '', email: '', password: '' });
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create admin');
    } finally {
      setLoader('modal-submit', false);
    }
  };

  const handleEditAdmin = async (e) => {
    e.preventDefault();
    setLoader('modal-submit', true);
    try {
      await api.put(`/super-admin/admins/${editingAdmin.id}`, editingAdmin);
      toast.success('Super admin updated successfully');
      setShowEditAdminModal(false);
      setEditingAdmin(null);
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update admin');
    } finally {
      setLoader('modal-submit', false);
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    setLoader(`delete-admin-${id}`, true);
    try {
      await api.delete(`/super-admin/admins/${id}`);
      toast.success('Super admin deleted successfully');
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete admin');
    } finally {
      setLoader(`delete-admin-${id}`, false);
    }
  };

  const updateTier = async (tenantId, newTier) => {
    setLoader(`tier-${tenantId}`, true);
    try {
      await api.put(`/super-admin/tenants/${tenantId}/tier`, { tier: newTier });
      toast.success('Tenant tier updated successfully');
      fetchTenants();
    } catch (error) {
      console.error("Tier update error:", error.response || error);
      toast.error(error.response?.data?.message || 'Failed to update tenant tier');
    } finally {
      setLoader(`tier-${tenantId}`, false);
    }
  };

  const toggleStatus = async (tenantId, currentStatus) => {
    setLoader(`status-${tenantId}`, true);
    try {
      await api.put(`/super-admin/tenants/${tenantId}/status`, { is_active: !currentStatus });
      toast.success('Tenant status updated');
      fetchTenants();
    } catch (error) {
      console.error("Status update error:", error.response || error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setLoader(`status-${tenantId}`, false);
    }
  };

  const handleDeleteTenant = async (tenantId) => {
    if (!window.confirm('Are you sure you want to delete this store? This action cannot be undone and will delete all associated data.')) return;
    setLoader(`delete-tenant-${tenantId}`, true);
    try {
      await api.delete(`/super-admin/tenants/${tenantId}`);
      toast.success('Store deleted successfully');
      fetchTenants();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete store');
    } finally {
      setLoader(`delete-tenant-${tenantId}`, false);
    }
  };

  const handleEditTenant = async (e) => {
    e.preventDefault();
    setLoader('modal-submit', true);
    try {
      await api.put(`/super-admin/tenants/${editingTenant.id}`, {
        name: editingTenant.name
      });
      toast.success('Store updated successfully');
      setShowEditTenantModal(false);
      setEditingTenant(null);
      fetchTenants();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update store');
    } finally {
      setLoader('modal-submit', false);
    }
  };

  const handleExtendSubscription = async (e) => {
    e.preventDefault();
    setLoader('modal-submit', true);
    try {
      const res = await api.put(`/super-admin/tenants/${extendingTenant.id}/extend`, { days: extendDays, action: adjustAction });
      toast.success(adjustAction === 'add' ? `Adjusted subscription by ${extendDays} days` : `Set remaining days to ${extendDays}`);
      
      // Update tenant locally for real-time reflection
      if (res.data && res.data.tenant) {
        setTenants(prev => prev.map(t => t.id === extendingTenant.id ? { ...t, ...res.data.tenant } : t));
      } else {
        fetchTenants();
      }

      setShowExtendModal(false);
      setExtendingTenant(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to adjust subscription');
    } finally {
      setLoader('modal-submit', false);
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

        <div className="mb-6 flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('stores')}
            className={`pb-4 px-2 font-medium text-sm transition-colors relative ${activeTab === 'stores' ? 'text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Registered Stores
            {activeTab === 'stores' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-600 rounded-t-full"></span>}
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`pb-4 px-2 font-medium text-sm transition-colors relative ${activeTab === 'admins' ? 'text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Super Admins
            {activeTab === 'admins' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-600 rounded-t-full"></span>}
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`pb-4 px-2 font-medium text-sm transition-colors relative ${activeTab === 'subscriptions' ? 'text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Subscriptions
            {activeTab === 'subscriptions' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-600 rounded-t-full"></span>}
          </button>
        </div>

        {activeTab === 'stores' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Building2 size={20} className="text-gray-500"/>
                Stores Directory
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
                  <th className="px-6 py-4">Admin Email</th>
                  <th className="px-6 py-4">Tier Plan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Subscription Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tenants.map(tenant => {
                  const expDate = tenant.trial_ends_at || tenant.next_billing_date;
                  const daysRemaining = expDate ? Math.ceil((new Date(expDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                  
                  return (
                    <tr key={tenant.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{tenant.name}</td>
                      <td className="px-6 py-4 text-gray-500">{tenant.users && tenant.users.length > 0 ? tenant.users[0].email : 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <select 
                            value={tenant.tier} 
                            disabled={actionLoading[`tier-${tenant.id}`]}
                            onChange={(e) => updateTier(tenant.id, e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-gray-900 text-sm font-medium rounded-lg focus:ring-orange-500 focus:border-orange-500 block p-2 w-full pr-8 disabled:opacity-50"
                          >
                            <option value="bronze">Bronze Plan</option>
                            <option value="silver">Silver Plan</option>
                            <option value="custom">Custom Plan</option>
                          </select>
                          {actionLoading[`tier-${tenant.id}`] && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                              <Loader2 size={16} className="animate-spin text-orange-600" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tenant.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                          {tenant.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {expDate ? (
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400">{new Date(expDate).toLocaleDateString()}</span>
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
                        <button 
                          onClick={() => toggleStatus(tenant.id, tenant.is_active)}
                          disabled={actionLoading[`status-${tenant.id}`]}
                          className={`text-sm font-bold px-3 py-1.5 rounded-lg border flex items-center justify-center gap-2 min-w-[90px] disabled:opacity-50 ${tenant.is_active ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200'}`}
                        >
                          {actionLoading[`status-${tenant.id}`] ? <Loader2 size={16} className="animate-spin" /> : (tenant.is_active ? 'Suspend' : 'Activate')}
                        </button>
                        <button 
                          onClick={() => { setEditingTenant(tenant); setShowEditTenantModal(true); }}
                          className="p-1.5 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit Store"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => { setExtendingTenant(tenant); setShowExtendModal(true); setExtendDays(7); setAdjustAction('add'); }}
                          className="p-1.5 rounded text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors"
                          title="Adjust Subscription"
                        >
                          <Calendar size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteTenant(tenant.id)}
                          disabled={actionLoading[`delete-tenant-${tenant.id}`]}
                          className="p-1.5 rounded text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Delete Store"
                        >
                          {actionLoading[`delete-tenant-${tenant.id}`] ? <Loader2 size={16} className="animate-spin text-red-600" /> : <Trash2 size={16} />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No stores registered yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        ) : activeTab === 'admins' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Shield size={20} className="text-gray-500"/>
              Super Admins
            </h2>
            <div className="flex items-center gap-3">
              <button onClick={fetchAdmins} className="text-gray-500 hover:text-orange-600 transition-colors">
                <RefreshCw size={18} />
              </button>
              <button 
                onClick={() => setShowAdminModal(true)}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
              >
                Add Admin
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-900 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Created At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {admins.map(admin => (
                  <tr key={admin.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs uppercase">
                        {admin.name.charAt(0)}
                      </div>
                      {admin.name}
                    </td>
                    <td className="px-6 py-4">{admin.email}</td>
                    <td className="px-6 py-4">{new Date(admin.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button 
                        onClick={() => { setEditingAdmin({ ...admin, password: '' }); setShowEditAdminModal(true); }}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit Admin"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteAdmin(admin.id)}
                        className={`p-1.5 rounded transition-colors ${admin.id === user.id ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'} disabled:opacity-50`}
                        title={admin.id === user.id ? "Cannot delete yourself" : "Delete Admin"}
                        disabled={admin.id === user.id || actionLoading[`delete-admin-${admin.id}`]}
                      >
                        {actionLoading[`delete-admin-${admin.id}`] ? <Loader2 size={16} className="animate-spin text-red-600" /> : <Trash2 size={16} />}
                      </button>
                    </td>
                  </tr>
                ))}
                {admins.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">No admins found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        ) : activeTab === 'subscriptions' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CreditCard size={20} className="text-gray-500"/>
              Subscription Transactions
            </h2>
            <button onClick={fetchSubscriptions} className="text-gray-500 hover:text-orange-600 transition-colors">
              <RefreshCw size={18} />
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-900 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Store / Phone</th>
                  <th className="px-6 py-4">Plan / Cycle</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscriptions.map(sub => (
                  <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">{new Date(sub.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{sub.tenant?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{sub.phone}</div>
                      <div className="text-[10px] text-gray-400 mt-1">{sub.checkout_id}</div>
                    </td>
                    <td className="px-6 py-4 capitalize font-medium">
                      {sub.tier} <br/> <span className="text-xs text-gray-500">({sub.cycle})</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-orange-600">KSH {Number(sub.amount).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        sub.status === 'completed' ? 'bg-green-100 text-green-800' :
                        sub.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block">
                        <select
                          value={sub.status}
                          disabled={actionLoading[`sub-status-${sub.id}`]}
                          onChange={(e) => updateSubscriptionStatus(sub.id, e.target.value)}
                          className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 p-2 ml-auto pr-8 disabled:opacity-50 appearance-none min-w-[110px]"
                        >
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                          <option value="failed">Failed</option>
                        </select>
                        {actionLoading[`sub-status-${sub.id}`] && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Loader2 size={16} className="animate-spin text-orange-600" />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {subscriptions.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No subscription transactions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        ) : null}

      </main>

      {/* Add Admin Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-lg">Add Super Admin</h3>
              <button onClick={() => setShowAdminModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-orange-500 focus:border-orange-500"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-orange-500 focus:border-orange-500"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-orange-500 focus:border-orange-500"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                />
              </div>
              <div className="pt-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading['modal-submit']}
                  className="px-4 py-2 bg-orange-600 text-white font-medium hover:bg-orange-700 rounded-lg flex items-center justify-center gap-2 min-w-[120px] disabled:opacity-50"
                >
                  {actionLoading['modal-submit'] ? <Loader2 size={18} className="animate-spin" /> : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditAdminModal && editingAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-lg">Edit Super Admin</h3>
              <button onClick={() => { setShowEditAdminModal(false); setEditingAdmin(null); }} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleEditAdmin} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-orange-500 focus:border-orange-500"
                  value={editingAdmin.name}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-orange-500 focus:border-orange-500"
                  value={editingAdmin.email}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password (Optional)</label>
                <input
                  type="password"
                  minLength={8}
                  placeholder="Leave blank to keep current"
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-orange-500 focus:border-orange-500"
                  value={editingAdmin.password}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, password: e.target.value })}
                />
              </div>
              <div className="pt-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowEditAdminModal(false); setEditingAdmin(null); }}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading['modal-submit']}
                  className="px-4 py-2 bg-orange-600 text-white font-medium hover:bg-orange-700 rounded-lg flex items-center justify-center gap-2 min-w-[130px] disabled:opacity-50"
                >
                  {actionLoading['modal-submit'] ? <Loader2 size={18} className="animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tenant Modal */}
      {showEditTenantModal && editingTenant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-lg">Edit Store details</h3>
              <button onClick={() => { setShowEditTenantModal(false); setEditingTenant(null); }} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleEditTenant} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-orange-500 focus:border-orange-500"
                  value={editingTenant.name}
                  onChange={(e) => setEditingTenant({ ...editingTenant, name: e.target.value })}
                />
              </div>
              <div className="pt-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowEditTenantModal(false); setEditingTenant(null); }}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading['modal-submit']}
                  className="px-4 py-2 bg-orange-600 text-white font-medium hover:bg-orange-700 rounded-lg flex items-center justify-center gap-2 min-w-[130px] disabled:opacity-50"
                >
                  {actionLoading['modal-submit'] ? <Loader2 size={18} className="animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Adjust Subscription Modal */}
      {showExtendModal && extendingTenant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-lg">Adjust Subscription Days</h3>
              <button onClick={() => { setShowExtendModal(false); setExtendingTenant(null); }} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleExtendSubscription} className="p-6 space-y-4">
              <div className="bg-orange-50 text-orange-800 p-3 rounded-lg text-sm mb-2 border border-orange-100">
                Adjusting subscription for <strong>{extendingTenant.name}</strong>.
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <select 
                  value={adjustAction} 
                  onChange={(e) => setAdjustAction(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="add">Add / Subtract Days</option>
                  <option value="set">Set Exact Days Remaining</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {adjustAction === 'add' ? 'Days (use negative to subtract)' : 'Exact Days Remaining'}
                </label>
                <input
                  type="number"
                  required
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-orange-500 focus:border-orange-500"
                  value={extendDays}
                  onChange={(e) => setExtendDays(e.target.value)}
                />
              </div>
              <div className="pt-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowExtendModal(false); setExtendingTenant(null); }}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading['modal-submit']}
                  className="px-4 py-2 bg-green-600 text-white font-medium hover:bg-green-700 rounded-lg flex items-center justify-center gap-2 min-w-[160px] disabled:opacity-50"
                >
                  {actionLoading['modal-submit'] ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
