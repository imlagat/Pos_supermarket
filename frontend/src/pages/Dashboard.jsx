import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { TrendingUp, ShoppingBag, Users, Package, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ total_sales: 0, orders: 0, customers: 0, products: 0 });
  const [weeklySales, setWeeklySales] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/sales'),
      api.get('/inventory/alerts')
    ]).then(([salesRes, alertsRes]) => {
      setStats({
        total_sales: salesRes.data.total_sales || 0,
        orders: salesRes.data.orders || 0,
        customers: salesRes.data.customers || 0,
        products: salesRes.data.products || 0
      });
      setWeeklySales(salesRes.data.weekly_sales || []);
      setAlerts(alertsRes.data || []);
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const statCards = [
    { title: 'Total Sales', value: `Ksh ${stats.total_sales?.toLocaleString()}`, icon: TrendingUp, color: 'from-amber-500 to-orange-500' },
    { title: 'Orders', value: stats.orders, icon: ShoppingBag, color: 'from-orange-500 to-red-500' },
    { title: 'Customers', value: stats.customers, icon: Users, color: 'from-amber-600 to-orange-600' },
    { title: 'Products', value: stats.products, icon: Package, color: 'from-yellow-600 to-amber-600' },
  ];

  if (loading) return <div className="flex justify-center items-center h-64">Loading dashboard...</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Welcome back, {user?.name} 👋</h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your store today.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-amber-500" /> Weekly Sales Trend
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Line type="monotone" dataKey="total" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertCircle size={20} className="text-amber-500" /> Low Stock & Expiry Alerts
          </h2>
          {alerts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No alerts – all good! ✅</p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border-l-4 border-amber-500">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-800">{alert.product?.name}</p>
                    <p className="text-sm text-amber-600">{alert.type === 'low_stock' ? '⚠️ Below minimum stock' : '⏰ Expires within 7 days'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
