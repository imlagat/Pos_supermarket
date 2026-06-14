import { useEffect, useState } from 'react';
import PageLoader from '../components/common/PageLoader';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { TrendingUp, ShoppingBag, Users, Package, AlertCircle, Tag, Bot, RefreshCw, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ total_sales: 0, orders: 0, customers: 0, products: 0 });
  const [chartData, setChartData] = useState([]);
  const [timeRange, setTimeRange] = useState('weekly');
  const [alerts, setAlerts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState({ reorder: false, pricing: false });

  const runAiReorder = async () => {
    setAiLoading(prev => ({ ...prev, reorder: true }));
    try {
      const res = await api.post('/ai/auto-reorder');
      toast.success(res.data.message);
      if (res.data.pos_created > 0) {
        // Refresh alerts or data if needed
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to run auto-reorder');
    } finally {
      setAiLoading(prev => ({ ...prev, reorder: false }));
    }
  };

  const runAiPricing = async () => {
    setAiLoading(prev => ({ ...prev, pricing: true }));
    try {
      const res = await api.post('/ai/dynamic-pricing');
      toast.success(res.data.message);
      fetchPromotions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to run dynamic pricing');
    } finally {
      setAiLoading(prev => ({ ...prev, pricing: false }));
    }
  };

  const fetchPromotions = async () => {
    try {
      const promoRes = await api.get('/discount-rules/active');
      setPromotions(promoRes.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePromo = async (id) => {
    if (!confirm('Delete this AI promotion?')) return;
    try {
      await api.delete(`/discount-rules/${id}`);
      toast.success('Deleted successfully');
      fetchPromotions();
    } catch (err) {
      toast.error('Failed to delete promotion');
    }
  };

  const handleTogglePromo = async (promo) => {
    try {
      await api.put(`/discount-rules/${promo.id}`, { ...promo, is_active: !promo.is_active });
      toast.success(promo.is_active ? 'Promotion Inactivated' : 'Promotion Accepted/Activated');
      fetchPromotions();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/reports/sales?period=${timeRange}`),
      api.get('/inventory/alerts'),
      api.get('/discount-rules/active').catch(() => ({ data: [] }))
    ]).then(([salesRes, alertsRes, promoRes]) => {
      setStats({
        total_sales: salesRes.data.total_sales || 0,
        orders: salesRes.data.orders || 0,
        customers: salesRes.data.customers || 0,
        products: salesRes.data.products || 0
      });
      setChartData(salesRes.data.chart_data || salesRes.data.weekly_sales || []);
      setAlerts(alertsRes.data || []);
      setPromotions(promoRes.data || []);
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setLoading(false);
    });
  }, [timeRange]);

  const statCards = [
    { title: 'Total Sales', value: `Ksh ${stats.total_sales?.toLocaleString()}`, icon: TrendingUp, color: 'from-amber-500 to-orange-500' },
    { title: 'Orders', value: stats.orders, icon: ShoppingBag, color: 'from-orange-500 to-red-500' },
    { title: 'Customers', value: stats.customers, icon: Users, color: 'from-amber-600 to-orange-600' },
    { title: 'Products', value: stats.products, icon: Package, color: 'from-yellow-600 to-amber-600' },
  ];

  if (loading) return <PageLoader message="Loading dashboard..." />;

  return (
    <div>
      <div className="sticky top-0 -mt-4 -mx-4 pt-4 px-4 md:-mt-6 md:-mx-6 md:pt-6 md:px-6 bg-gray-100 z-20 pb-4 border-b border-gray-200 shadow-sm mb-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Welcome back, {user?.name} 👋</h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your store today.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div key={idx} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className={`bg-gradient-to-r ${card.color} p-4 flex justify-between items-center`}>
                  <div>
                    <p className="text-white/80 text-sm">{card.title}</p>
                    <p className="text-white text-2xl font-bold">{card.value}</p>
                  </div>
                  <Icon className="w-8 h-8 text-white/60" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp size={20} className="text-orange-600" /> Sales Trend
            </h2>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-600"
            >
              <option value="daily">Today (Hourly)</option>
              <option value="weekly">Last 7 Days</option>
              <option value="monthly">Last 30 Days</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Line type="monotone" dataKey="total" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col max-h-[385px]">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2 shrink-0">
            <AlertCircle size={20} className="text-orange-600" /> Low Stock & Expiry Alerts
          </h2>
          <div className="overflow-y-auto flex-1 pr-2">
            {alerts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No alerts – all good! ✅</p>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl border-l-4 border-orange-600">
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-800">{alert.product?.name}</p>
                      <p className="text-sm text-orange-700">{alert.type === 'low_stock' ? '⚠️ Below minimum stock' : '⏰ Expires within 7 days'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Active Promotions Section */}
      <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 mb-8 flex flex-col max-h-[400px]">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2 shrink-0">
          <Tag size={20} className="text-orange-600" /> Active Promotions & Discounts
        </h2>
        <div className="overflow-y-auto flex-1 pr-2">
          {promotions.length === 0 ? (
            <p className="text-gray-500 py-4">No active promotions at the moment.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {promotions.map((promo, idx) => {
                const isAi = promo?.name?.startsWith('Flash Sale:') || promo?.name?.startsWith('Clearance:');
                const isExpired = promo?.ends_at && new Date(promo.ends_at) < new Date();
                
                return (
                <div key={idx} className="border border-green-100 bg-green-50 rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex gap-4 items-start">
                    <div className="bg-green-100 p-3 rounded-full text-green-600 flex-shrink-0">
                      <Tag size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-green-800 flex items-center gap-2 flex-wrap">
                        {promo.name}
                        {isAi && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded uppercase font-bold">AI</span>}
                        {isExpired && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded uppercase font-bold">Expired</span>}
                      </h3>
                      <p className="text-sm text-green-700 mt-1 capitalize">Type: {promo.type.replace('_', ' ')}</p>
                      {promo.value > 0 || promo.discount_percentage > 0 ? (
                        <p className="text-sm font-semibold mt-1">
                          Discount: {promo.type === 'percentage' || promo.discount_percentage > 0 ? `${promo.value || promo.discount_percentage}%` : `Ksh ${promo.value}`}
                        </p>
                      ) : null}
                      {promo.type === 'bogo' && promo.min_quantity && promo.free_quantity && (
                        <p className="text-sm font-semibold mt-1 text-orange-700">Buy {promo.min_quantity}, Get {promo.free_quantity} Free</p>
                      )}
                      {promo.ends_at && (
                        <p className="text-xs text-gray-500 mt-2">Ends: {new Date(promo.ends_at).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  
                  {isAi && (user?.role === 'admin' || user?.role === 'manager') && (
                    <div className="mt-4 pt-3 border-t border-green-200 flex gap-3 justify-end">
                      <button onClick={() => handleTogglePromo(promo)} className={`text-xs font-semibold px-3 py-1 rounded-full ${promo.is_active ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' : 'bg-green-200 text-green-800 hover:bg-green-300'}`}>
                        {promo.is_active ? 'Inactivate' : 'Accept'}
                      </button>
                      <button onClick={() => handleDeletePromo(promo.id)} className="text-xs font-semibold px-3 py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200">
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Enterprise AI Command Center */}
      {(user?.role === 'admin' || user?.role === 'manager') && (
      <div className="bg-white border border-orange-200 rounded-2xl shadow-lg p-4 md:p-5 mb-8 text-gray-800 relative overflow-hidden w-full">
        {/* Decorative background elements */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60"></div>
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Bot size={22} className="text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">Enterprise AI Command Center</h2>
              <p className="text-gray-500 text-xs mt-0.5">Run autonomous infrastructure jobs instantly.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Auto Reorder Card */}
            <div className="bg-orange-50/50 backdrop-blur-md border border-orange-100 rounded-xl p-4 hover:bg-orange-50 transition flex flex-col justify-between">
              <div className="mb-3">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <RefreshCw size={16} className="text-orange-600" /> Auto-Reordering
                </h3>
                <p className="text-xs text-gray-500 mt-1">Predicts demand and drafts POs for low stock.</p>
              </div>
              <button 
                onClick={runAiReorder}
                disabled={aiLoading.reorder}
                className="w-full py-2 bg-white hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-70 mt-auto"
              >
                {aiLoading.reorder ? <RefreshCw size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                {aiLoading.reorder ? 'Analyzing Stock...' : 'Execute AI Reorder'}
              </button>
            </div>

            {/* Dynamic Pricing Card */}
            <div className="bg-orange-50/50 backdrop-blur-md border border-orange-100 rounded-xl p-4 hover:bg-orange-50 transition flex flex-col justify-between">
              <div className="mb-3">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <TrendingUp size={16} className="text-orange-600" /> Dynamic Pricing
                </h3>
                <p className="text-xs text-gray-500 mt-1">Optimizes base price based on recent sales velocity.</p>
              </div>
              <button 
                onClick={runAiPricing}
                disabled={aiLoading.pricing}
                className="w-full py-2 bg-white hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-70 mt-auto"
              >
                {aiLoading.pricing ? <TrendingUp size={16} className="animate-spin" /> : <TrendingUp size={16} />}
                {aiLoading.pricing ? 'Optimizing Prices...' : 'Run Pricing AI'}
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
