import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { DollarSign, TrendingUp, CreditCard, Activity, Calendar, Download } from 'lucide-react';

export default function Finance() {
  const [period, setPeriod] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPnL();
  }, [period]);

  const fetchPnL = async () => {
    try {
      setLoading(true);
      let url = `/finance/pnl?period=${period}`;
      if (period === 'custom' && startDate && endDate) {
        url += `&start_date=${startDate}&end_date=${endDate}`;
      } else if (period === 'custom') {
        setLoading(false);
        return; // Don't fetch if custom dates aren't set yet
      }

      const res = await api.get(url);
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load P&L statement');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomDateSubmit = (e) => {
    e.preventDefault();
    if (startDate && endDate) {
      fetchPnL();
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const handleExport = () => {
    if (!data || !data.items) return;

    // Build CSV content
    const headers = ['Product Name', 'Cost Price (Buy)', 'Selling Price', 'Qty Sold', 'Total Profit'];
    const rows = data.items.map(item => [
      `"${item.product_name}"`,
      item.cost_price,
      item.selling_price,
      item.quantity_sold,
      item.profit
    ]);

    // Add summary row
    rows.push([]);
    rows.push(['Total Gross Revenue', '', '', '', data.total_revenue]);
    rows.push(['Total COGS', '', '', '', data.total_cogs]);
    rows.push(['Total Gross Profit', '', '', '', data.total_gross_profit]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `PnL_Statement_${data.start_date}_to_${data.end_date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('P&L Exported successfully!');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Profit & Loss Statement</h1>
            <p className="text-gray-500">Analyze gross profit margins and COGS</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            className="border-gray-200 rounded-xl px-4 py-2 focus:ring-orange-500"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition"
          >
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      {period === 'custom' && (
        <form onSubmit={handleCustomDateSubmit} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-end gap-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Start Date</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="border-gray-200 rounded-lg focus:ring-orange-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">End Date</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="border-gray-200 rounded-lg focus:ring-orange-500"
              required
            />
          </div>
          <button type="submit" className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium">
            Apply Filter
          </button>
        </form>
      )}

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
              <div className="relative">
                <p className="text-sm font-medium text-gray-500 mb-1">Total Gross Revenue</p>
                <h3 className="text-3xl font-bold text-gray-900">Ksh {data.total_revenue.toLocaleString()}</h3>
                <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                  <Activity size={14} /> From item sales
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
              <div className="relative">
                <p className="text-sm font-medium text-gray-500 mb-1">Total COGS (Cost)</p>
                <h3 className="text-3xl font-bold text-gray-900">Ksh {data.total_cogs.toLocaleString()}</h3>
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                  <CreditCard size={14} /> Buying price total
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
              <div className="relative">
                <p className="text-sm font-medium text-gray-500 mb-1">Total Gross Profit</p>
                <h3 className="text-3xl font-bold text-green-600">Ksh {data.total_gross_profit.toLocaleString()}</h3>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <TrendingUp size={14} /> Revenue - COGS
                </p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-gray-800">Profit Breakdown by Product</h3>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar size={14}/> {data.start_date} to {data.end_date}
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-white text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Product Name</th>
                    <th className="px-6 py-4 text-right">Cost Price (Buy)</th>
                    <th className="px-6 py-4 text-right">Selling Price</th>
                    <th className="px-6 py-4 text-center">Qty Sold</th>
                    <th className="px-6 py-4 text-right">Total Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.items.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                        No sales found for the selected period.
                      </td>
                    </tr>
                  ) : (
                    data.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-medium text-gray-800">
                          {item.product_name}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="bg-red-50 text-red-700 px-2 py-1 rounded-lg text-xs font-medium">
                            Ksh {item.cost_price.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded-lg text-xs font-medium">
                            Ksh {item.selling_price.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-medium">
                          {item.quantity_sold}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-green-600">
                          Ksh {item.profit.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
