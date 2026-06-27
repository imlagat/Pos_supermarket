import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageLoader from '../components/common/PageLoader';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { TrendingUp, ShoppingBag, Users, Package, AlertCircle, Tag, Bot, RefreshCw, Zap, Calendar, ChevronDown, ArrowUpRight, ArrowDownRight, CreditCard, Banknote, Smartphone, CheckCircle, Clock, Lock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user, loadUser } = useAuthStore();
  const [stats, setStats] = useState({ total_sales: 0, orders: 0, customers: 0, products: 0 });
  const [chartData, setChartData] = useState([]);
  const [timeRange, setTimeRange] = useState('weekly');
  const [alerts, setAlerts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [paymentData, setPaymentData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState({ reorder: false, pricing: false });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadUser(); // Ensure tenant billing status is in sync
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const runAiReorder = async () => {
    setAiLoading(prev => ({ ...prev, reorder: true }));
    try {
      const res = await api.post('/ai/auto-reorder');
      toast.success(res.data.message || 'Auto-reorder analysis completed');
    } catch (err) {
      toast.error('Failed to run AI Auto-Reorder');
    } finally {
      setAiLoading(prev => ({ ...prev, reorder: false }));
    }
  };

  const fetchPromotions = async () => {
    try {
      const res = await api.get('/discount-rules/active');
      setPromotions(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const runAiPricing = async () => {
    setAiLoading(prev => ({ ...prev, pricing: true }));
    try {
      const res = await api.post('/ai/dynamic-pricing');
      toast.success(res.data.message || 'Dynamic pricing optimizations applied');
      fetchPromotions();
    } catch (err) {
      toast.error('Failed to run AI Pricing');
    } finally {
      setAiLoading(prev => ({ ...prev, pricing: false }));
    }
  };

  const handleDeletePromo = async (id) => {
    try {
      await api.delete(`/discount-rules/${id}`);
      toast.success('Promotion deleted');
      fetchPromotions();
    } catch (err) {
      toast.error('Failed to delete promotion');
    }
  };

  const handleTogglePromo = async (promo) => {
    try {
      await api.put(`/discount-rules/${promo.id}`, { is_active: !promo.is_active });
      toast.success(promo.is_active ? 'Promotion deactivated' : 'Promotion activated');
      fetchPromotions();
    } catch (err) {
      toast.error('Failed to toggle promotion');
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/reports/sales?period=${timeRange}`),
      api.get('/inventory/alerts'),
      api.get('/discount-rules/active').catch(() => ({ data: [] })),
      api.get(`/reports/top-products?limit=3&period=${timeRange}`),
      api.get(`/reports/sales-by-payment-method?period=${timeRange}`),
      api.get('/transactions?limit=5')
    ]).then(([salesRes, alertsRes, promoRes, topRes, paymentRes, txRes]) => {
      setStats({
        total_sales: salesRes.data.total_sales || 0,
        orders: salesRes.data.orders || 0,
        customers: salesRes.data.customers || 0,
        products: salesRes.data.products || 0
      });
      setChartData(salesRes.data.chart_data || salesRes.data.weekly_sales || []);
      setAlerts(alertsRes.data || []);
      setPromotions(promoRes.data || []);
      setTopProducts(topRes.data || []);
      
      const colors = ['#f97316', '#334155', '#fdba74', '#94a3b8'];
      const mappedPayments = (paymentRes.data || []).map((p, idx) => ({
        name: p.method.charAt(0).toUpperCase() + p.method.slice(1),
        value: parseFloat(p.revenue) || 0,
        color: colors[idx % colors.length]
      }));
      setPaymentData(mappedPayments);
      
      setRecentTransactions(txRes.data || []);
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [timeRange]);

  const statCards = [
    { title: 'Total Sales', value: `Ksh ${stats.total_sales?.toLocaleString() || 0}`, icon: ShoppingBag, color: 'text-orange-600', bg: 'bg-orange-50', trend: 0, trendUp: true },
    { title: 'Orders', value: stats.orders || 0, icon: Package, color: 'text-orange-600', bg: 'bg-orange-50', trend: 0, trendUp: true },
    { title: 'Customers', value: stats.customers || 0, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50', trend: 0, trendUp: true },
    { title: 'Products', value: stats.products || 0, icon: Package, color: 'text-orange-600', bg: 'bg-orange-50', trend: 0, trendUp: true },
  ];


  if (loading) return <PageLoader message="Loading dashboard..." />;

  return (
    <div className="pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Welcome back, {user?.name || 'Administrator'} <span className="text-2xl">👋</span>
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Here's what's happening with your store today.</p>
        </div>
        <div className="flex items-center gap-3 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 border-r border-gray-200 pr-3 text-sm font-medium text-gray-700">
            <Calendar size={16} className="text-orange-500" />
            {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            <span className="text-gray-400 text-xs font-normal bg-gray-50 px-1.5 py-0.5 rounded">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="text-sm font-bold text-gray-800 bg-transparent focus:outline-none cursor-pointer hover:text-orange-600 transition-colors py-1"
          >
            <option value="daily">Today's Data</option>
            <option value="weekly">This Week's Data</option>
            <option value="monthly">This Month's Data</option>
          </select>
        </div>
      </div>
      
      {user?.tenant && (
        user.tenant.billing_status === 'active' ? (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-center justify-between shadow-sm">
            <div className="flex items-center gap-4 mb-4 sm:mb-0">
              <div className="p-3 bg-green-100 text-green-600 rounded-full">
                <CheckCircle size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Active Subscription</h2>
                <p className="text-sm text-gray-600 capitalize">
                  You are currently on the {user.tenant.tier} plan.
                </p>
              </div>
            </div>
            <Link to="/billing" className="px-6 py-2.5 bg-white text-green-700 border border-green-200 hover:bg-green-50 font-bold rounded-lg shadow-sm transition-colors w-full sm:w-auto text-center">
              Manage Billing
            </Link>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-center justify-between shadow-sm">
            <div className="flex items-center gap-4 mb-4 sm:mb-0">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
                <Clock size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Trial Period</h2>
                <p className="text-sm text-gray-600">
                  {(() => {
                    if (!user.tenant.trial_ends_at) return 'Your 7 days trial has expired.';
                    const distance = new Date(user.tenant.trial_ends_at).getTime() - currentTime.getTime();
                    if (distance <= 0) return 'Your 7 days trial has expired.';
                    const d = Math.floor(distance / (1000 * 60 * 60 * 24));
                    const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const s = Math.floor((distance % (1000 * 60)) / 1000);
                    return `You have ${d}d ${h}h ${m}m ${s}s remaining in your 7 days trial.`;
                  })()}
                </p>
              </div>
            </div>
            <Link to="/billing" className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg shadow transition-colors w-full sm:w-auto text-center">
              Upgrade Now
            </Link>
          </div>
        )
      )}


      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-bold text-gray-800 mb-1">{card.title}</p>
                  <h3 className="text-2xl font-black text-gray-900">{card.value}</h3>
                </div>
                <div className={`p-3 rounded-full ${card.bg}`}>
                  <Icon className={`w-6 h-6 ${card.color}`} strokeWidth={2.5} />
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                {card.trend === 0 ? (
                  <span className="text-xs font-medium text-gray-500 flex items-center">↑ 0%</span>
                ) : card.trendUp ? (
                  <span className="text-xs font-bold text-slate-700 flex items-center"><ArrowUpRight size={14} className="mr-0.5" />{card.trend}%</span>
                ) : (
                  <span className="text-xs font-bold text-red-500 flex items-center"><ArrowDownRight size={14} className="mr-0.5" />{card.trend}%</span>
                )}
                <span className="text-xs text-gray-400 ml-1">vs Yesterday</span>
              </div>
              {/* Very subtle bottom gradient */}
              <div className={`absolute bottom-0 left-0 w-full h-8 opacity-20 bg-gradient-to-t ${card.color.replace('text-', 'from-')} to-transparent pointer-events-none`}></div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp size={20} className="text-orange-600" /> Sales Overview
              </h2>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-600 transition-shadow"
              >
                <option value="daily">Today (Hourly)</option>
                <option value="weekly">Last 7 Days</option>
                <option value="monthly">Last 30 Days</option>
              </select>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => value >= 1000 ? `${value/1000}k` : value} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`Ksh ${value}`, 'Sales']}
                  />
                  <Area type="monotone" dataKey="total" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* Summary boxes below the chart */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Ksh {stats.total_sales?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Total Sales</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Ksh {(stats.total_sales / (stats.orders || 1)).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Average Order Value</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{stats.orders}</p>
                  <p className="text-xs text-gray-500">Total Orders</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{stats.customers || 0}</p>
                  <p className="text-xs text-gray-500">New Customers</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-base font-bold text-gray-900">Top Selling Products</h2>
                <Link to="/reports" className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors">View all</Link>
              </div>
              <div className="space-y-5">
                {topProducts.length === 0 ? <p className="text-gray-500 text-sm">No sales data found.</p> : topProducts.map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-50 rounded flex items-center justify-center text-xl shadow-sm border border-gray-100">
                          <Package className="w-4 h-4 text-orange-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-800">{item.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-600">{item.total_quantity} sold</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${Math.min((item.total_quantity / (topProducts[0]?.total_quantity || 1)) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-gray-900">Sales by Payment Method</h2>
                <Link to="/reports" className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors">View all</Link>
              </div>
              <div className="flex items-center">
                <div className="w-1/2 h-32 relative -ml-4">
                  {paymentData.length === 0 ? <div className="flex items-center justify-center h-full text-xs text-gray-500">No data</div> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={paymentData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={5} dataKey="value" stroke="none">
                          {paymentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="w-1/2 space-y-3">
                  {paymentData.map((entry, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-xs font-medium text-gray-600">{entry.name}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-900">Ksh {entry.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                Low Stock & Expiry Alerts
              </h2>
              <Link to="/reports" className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors">View all</Link>
            </div>
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="p-4 bg-slate-50/50 rounded-xl border border-green-100 text-center">
                  <p className="text-slate-700 text-sm font-semibold flex items-center justify-center gap-1">No alerts – all good! <CheckCircle size={14}/></p>
                </div>
              ) : (
                alerts.slice(0, 2).map((alert, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl border border-red-100 transition-colors hover:bg-red-50">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-white rounded-lg shadow-sm border border-red-100">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 truncate max-w-[120px]">{alert.product?.name || 'Product'}</p>
                        <p className="text-[10px] text-gray-500">{alert.type === 'low_stock' ? '2 units left' : 'Expires in 3 days'}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full shrink-0">
                      {alert.type === 'low_stock' ? 'Low Stock' : 'Expiring Soon'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col flex-1">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-gray-900">Recent Transactions</h2>
              <Link to="/transactions" className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors">View all</Link>
            </div>
            <div className="space-y-4">
              {recentTransactions.length === 0 ? <p className="text-gray-500 text-sm">No recent transactions.</p> : recentTransactions.map((tx, i) => {
                const methodColors = {
                  'cash': 'text-slate-700 bg-slate-100',
                  'mpesa': 'text-orange-700 bg-orange-100',
                  'card': 'text-slate-600 bg-slate-200'
                };
                const primaryPayment = tx.payments && tx.payments.length > 0 ? tx.payments[0].method : 'unknown';
                const methodClass = methodColors[primaryPayment] || 'text-gray-700 bg-gray-100';
                
                return (
                <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-slate-200 transition-colors">
                      <Banknote size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{tx.order_number}</p>
                      <p className="text-[10px] text-gray-500">{new Date(tx.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">Ksh {parseFloat(tx.total_amount).toLocaleString()}</p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded mt-1 inline-block uppercase ${methodClass}`}>{primaryPayment}</span>
                  </div>
                </div>
              )})}
            </div>
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
                <div key={idx} className="border border-green-100 bg-slate-50 rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex gap-4 items-start">
                    <div className="bg-slate-100 p-3 rounded-full text-slate-700 flex-shrink-0">
                      <Tag size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-green-800 flex items-center gap-2 flex-wrap">
                        {promo.name}
                        {isAi && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded uppercase font-bold">AI</span>}
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
      {/* Enterprise AI Command Center */}
      {(user?.role === 'admin' || user?.role === 'manager') && (
      <div className={`bg-white border rounded-2xl shadow-lg p-4 md:p-5 mb-8 text-gray-800 relative overflow-hidden w-full ${user?.tenant?.tier === 'bronze' ? 'border-gray-200 opacity-90' : 'border-orange-200'}`}>
        {/* Decorative background elements */}
        {user?.tenant?.tier !== 'bronze' && (
          <>
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60"></div>
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60"></div>
          </>
        )}
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${user?.tenant?.tier === 'bronze' ? 'bg-gray-100' : 'bg-orange-100'}`}>
                <Bot size={22} className={user?.tenant?.tier === 'bronze' ? 'text-gray-500' : 'text-orange-600'} />
              </div>
              <div>
                <h2 className="text-lg font-bold leading-tight">Enterprise AI Command Center</h2>
                <p className="text-gray-500 text-xs mt-0.5">Run autonomous infrastructure jobs instantly.</p>
              </div>
            </div>
            {user?.tenant?.tier === 'bronze' && (
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded font-semibold flex items-center gap-1 border border-gray-200">
                <Lock size={12} /> Premium Feature
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Auto Reorder Card */}
            <div className={`${user?.tenant?.tier === 'bronze' ? 'bg-gray-50 border-gray-200' : 'bg-orange-50/50 hover:bg-orange-50 border-orange-100'} backdrop-blur-md border rounded-xl p-4 transition flex flex-col justify-between`}>
              <div className="mb-3">
                <h3 className={`font-semibold text-base flex items-center gap-2 ${user?.tenant?.tier === 'bronze' ? 'text-gray-700' : ''}`}>
                  <RefreshCw size={16} className={user?.tenant?.tier === 'bronze' ? 'text-gray-400' : 'text-orange-600'} /> Auto-Reordering
                </h3>
                <p className="text-xs text-gray-500 mt-1">Predicts demand and drafts POs for low stock.</p>
              </div>
              {user?.tenant?.tier === 'bronze' ? (
                <Link to="/billing" className="w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 mt-auto">
                  <Lock size={16} /> Upgrade to Unlock
                </Link>
              ) : (
                <button 
                  onClick={runAiReorder}
                  disabled={aiLoading.reorder}
                  className="w-full py-2 bg-white hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-70 mt-auto"
                >
                  {aiLoading.reorder ? <RefreshCw size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                  {aiLoading.reorder ? 'Analyzing Stock...' : 'Execute AI Reorder'}
                </button>
              )}
            </div>

            {/* Dynamic Pricing Card */}
            <div className={`${user?.tenant?.tier === 'bronze' ? 'bg-gray-50 border-gray-200' : 'bg-orange-50/50 hover:bg-orange-50 border-orange-100'} backdrop-blur-md border rounded-xl p-4 transition flex flex-col justify-between`}>
              <div className="mb-3">
                <h3 className={`font-semibold text-base flex items-center gap-2 ${user?.tenant?.tier === 'bronze' ? 'text-gray-700' : ''}`}>
                  <TrendingUp size={16} className={user?.tenant?.tier === 'bronze' ? 'text-gray-400' : 'text-orange-600'} /> Dynamic Pricing
                </h3>
                <p className="text-xs text-gray-500 mt-1">Optimizes base price based on recent sales velocity.</p>
              </div>
              {user?.tenant?.tier === 'bronze' ? (
                <Link to="/billing" className="w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 mt-auto">
                  <Lock size={16} /> Upgrade to Unlock
                </Link>
              ) : (
                <button 
                  onClick={runAiPricing}
                  disabled={aiLoading.pricing}
                  className="w-full py-2 bg-white hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-70 mt-auto"
                >
                  {aiLoading.pricing ? <TrendingUp size={16} className="animate-spin" /> : <TrendingUp size={16} />}
                  {aiLoading.pricing ? 'Optimizing Prices...' : 'Run Pricing AI'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
