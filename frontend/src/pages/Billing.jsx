import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import { CreditCard, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import PageLoader from '../components/common/PageLoader';

export default function Billing() {
  const { user } = useAuthStore();
  const [tenant, setTenant] = useState(user?.tenant);
  const [loading, setLoading] = useState(false);
  const [stkLoading, setStkLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [selectedTier, setSelectedTier] = useState('');

  useEffect(() => {
    // Optionally fetch latest tenant data
    fetchTenant();
  }, []);

  const fetchTenant = async () => {
    try {
      const res = await api.get('/user');
      setTenant(res.data.tenant);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!phone || !selectedTier) return toast.error('Please select a plan and enter your phone number.');
    
    setStkLoading(true);
    try {
      const res = await api.post('/subscriptions/subscribe', {
        tier: selectedTier,
        phone: phone
      });
      
      toast.success(res.data.message || 'Check your phone to enter M-Pesa PIN.');
      
      // Simulate successful payment callback locally for MVP testing
      setTimeout(async () => {
        try {
          await api.post('/subscriptions/callback', {
            checkout_id: res.data.checkout_id,
            status: 'completed',
            tier: selectedTier
          });
          toast.success('Subscription active!');
          fetchTenant();
          setSelectedTier('');
          setPhone('');
        } catch (e) {
          toast.error('Payment verification failed.');
        }
      }, 5000);

    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to initiate payment.');
    } finally {
      setStkLoading(false);
    }
  };

  if (!tenant) return <PageLoader />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Current Plan</h2>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold capitalize text-orange-600">
                {tenant.tier} Plan
              </span>
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                tenant.billing_status === 'active' ? 'bg-green-100 text-green-800' :
                tenant.billing_status === 'trialing' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                {tenant.billing_status.toUpperCase()}
              </span>
            </div>
            
            {tenant.billing_status === 'trialing' && tenant.trial_ends_at && (
              <p className="text-sm text-gray-500 mt-2">
                Your free trial ends on {new Date(tenant.trial_ends_at).toLocaleDateString()}
              </p>
            )}
            
            {tenant.billing_status === 'active' && tenant.next_billing_date && (
              <p className="text-sm text-gray-500 mt-2">
                Next billing date: {new Date(tenant.next_billing_date).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="p-3 bg-orange-50 rounded-xl text-orange-600">
            <CreditCard className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Upgrade / Renew Subscription</h2>
        
        <form onSubmit={handleSubscribe} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Plan</label>
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => setSelectedTier('bronze')}
                className={`p-4 border rounded-xl cursor-pointer transition-all ${
                  selectedTier === 'bronze' ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200' : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <h3 className="font-bold text-gray-900">Bronze</h3>
                <p className="text-sm text-gray-500">1 Branch</p>
                <p className="font-bold text-orange-600 mt-2">KSH 1,599/mo</p>
              </div>
              <div 
                onClick={() => setSelectedTier('silver')}
                className={`p-4 border rounded-xl cursor-pointer transition-all ${
                  selectedTier === 'silver' ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200' : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <h3 className="font-bold text-gray-900">Silver</h3>
                <p className="text-sm text-gray-500">Unlimited Branches</p>
                <p className="font-bold text-orange-600 mt-2">KSH 2,599/mo</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">M-Pesa Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0712345678"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={!selectedTier || !phone || stkLoading}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {stkLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Pay with M-Pesa'}
          </button>
        </form>
      </div>

    </div>
  );
}
