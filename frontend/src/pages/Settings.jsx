import { useEffect, useState } from 'react';
import PageLoader from '../components/common/PageLoader';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Save, Store, Receipt, Package, Settings as SettingsIcon, Gift, Printer, MapPin, CreditCard } from 'lucide-react';
import BranchManagement from '../components/Settings/BranchManagement';
import { useAuthStore } from '../stores/authStore';

export default function Settings() {
  const { user } = useAuthStore();
  const isBronze = user?.tenant?.tier === 'bronze';
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('store');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data);
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (activeTab === 'store') {
      if (!settings.store_name || settings.store_name.trim() === '') {
        return toast.error('Store Name is required.');
      }
      if (settings.store_email && settings.store_email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(settings.store_email)) {
          return toast.error('Please enter a valid email address.');
        }
      }
    } else if (activeTab === 'tax') {
      const tax = settings.tax_rate;
      if (tax !== undefined && tax !== null && Number(tax) < 0) {
        return toast.error('Tax rate must be a valid number (0 or greater).');
      }
    }

    setSaving(true);
    try {
      await api.post('/settings', settings);
      toast.success('Settings saved');
    } catch (err) {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader message="Loading settings..." />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <SettingsIcon className="text-orange-600" /> System Settings
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-orange-600 to-orange-600 text-white px-6 py-2 rounded-xl font-semibold flex items-center gap-2"
        >
          <Save size={18} /> {saving ? 'Saving...' : 'Save All'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b overflow-x-auto pb-1">
        {[
          { id: 'store', label: 'Store Info', icon: Store },
          { id: 'branches', label: 'Branches', icon: MapPin, hidden: isBronze },
          { id: 'tax', label: 'Tax & Receipt', icon: Receipt },
          { id: 'inventory', label: 'Inventory', icon: Package },
          { id: 'loyalty', label: 'Loyalty', icon: Gift },
          { id: 'mpesa', label: 'M-Pesa API', icon: CreditCard }
        ].filter(t => !t.hidden).map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2 text-sm font-semibold rounded-t-lg transition ${activeTab === tab.id ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6">
        {/* Store Information */}
        {activeTab === 'store' && (
          <div className="space-y-5 max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Basic Information</h3>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label><input type="text" value={settings.store_name || ''} onChange={e => updateSetting('store_name', e.target.value)} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" placeholder="SuperPOS Retail" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><textarea value={settings.store_address || ''} onChange={e => updateSetting('store_address', e.target.value)} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" rows="2" placeholder="123 Main St, City" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="text" value={settings.store_phone || ''} onChange={e => updateSetting('store_phone', e.target.value)} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" placeholder="+123456789" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={settings.store_email || ''} onChange={e => updateSetting('store_email', e.target.value)} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" placeholder="store@example.com" /></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Currency Symbol</label><input type="text" value={settings.currency_symbol || 'Ksh'} onChange={e => updateSetting('currency_symbol', e.target.value)} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none max-w-xs" /></div>
          </div>
        )}

        {/* Tax & Receipt */}
        {activeTab === 'tax' && (
          <div className="space-y-5 max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Tax Configuration</h3>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label><input type="number" step="0.01" value={settings.tax_rate || 16} onChange={e => updateSetting('tax_rate', e.target.value)} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none max-w-xs" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Receipt Footer Message</label><textarea value={settings.receipt_footer || ''} onChange={e => updateSetting('receipt_footer', e.target.value)} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" rows="3" /></div>
            <div className="flex items-center gap-2"><input type="checkbox" id="show_vat" checked={settings.show_vat_on_receipt !== false} onChange={e => updateSetting('show_vat_on_receipt', e.target.checked)} className="w-4 h-4 text-orange-600 rounded focus:ring-orange-600" /><label htmlFor="show_vat" className="text-sm text-gray-700">Show VAT breakdown on receipt</label></div>
            <div className="flex items-center gap-2"><input type="checkbox" id="show_change" checked={settings.show_change_on_receipt !== false} onChange={e => updateSetting('show_change_on_receipt', e.target.checked)} className="w-4 h-4 text-orange-600 rounded focus:ring-orange-600" /><label htmlFor="show_change" className="text-sm text-gray-700">Show change amount on receipt</label></div>
            <div className="flex items-center gap-2"><input type="checkbox" id="auto_print" checked={settings.auto_print_receipt !== false} onChange={e => updateSetting('auto_print_receipt', e.target.checked)} className="w-4 h-4 text-orange-600 rounded focus:ring-orange-600" /><label htmlFor="auto_print" className="text-sm text-gray-700">Print automatically after sale</label></div>
          </div>
        )}

        {/* Inventory */}
        {activeTab === 'inventory' && (
          <div className="space-y-5 max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Inventory Settings</h3>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Global Low Stock Threshold</label><input type="number" value={settings.low_stock_threshold || 10} onChange={e => updateSetting('low_stock_threshold', e.target.value)} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none max-w-xs" /></div>
            <div className="flex items-center gap-2"><input type="checkbox" id="expiry" checked={settings.enable_expiry_tracking !== false} onChange={e => updateSetting('enable_expiry_tracking', e.target.checked)} className="w-4 h-4 text-orange-600 rounded focus:ring-orange-600" /><label htmlFor="expiry" className="text-sm text-gray-700">Enable Expiry Tracking</label></div>
          </div>
        )}

        {/* Loyalty Settings */}
        {activeTab === 'loyalty' && (
          <div className="space-y-5 max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Loyalty Program</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Points Earning Rate (Ksh per point)</label><input type="number" step="1" value={settings.points_earning_rate || 10} onChange={e => updateSetting('points_earning_rate', parseInt(e.target.value))} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" /><p className="text-xs text-gray-500 mt-1">e.g., 10 = 1 point per Ksh 10 spent</p></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Points Expiry Days (0 = never)</label><input type="number" value={settings.points_expiry_days || 0} onChange={e => updateSetting('points_expiry_days', parseInt(e.target.value))} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Member Discount – Silver (%)</label><input type="number" step="0.5" value={settings.silver_discount || 5} onChange={e => updateSetting('silver_discount', parseFloat(e.target.value))} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Member Discount – Gold (%)</label><input type="number" step="0.5" value={settings.gold_discount || 10} onChange={e => updateSetting('gold_discount', parseFloat(e.target.value))} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" /></div>
            </div>
          </div>
        )}

        {/* M-Pesa Settings */}
        {activeTab === 'mpesa' && (
          <div className="space-y-5 max-w-2xl">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Safaricom Daraja API Credentials</h3>
            </div>
            <div className="bg-orange-50 text-orange-800 p-4 rounded-xl text-sm border border-orange-100">
              Configure your own M-Pesa Paybill or Till number here. All STK Push payments from the POS will be routed directly to your account.
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
                <select value={settings.mpesa_environment || 'sandbox'} onChange={e => updateSetting('mpesa_environment', e.target.value)} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none">
                  <option value="sandbox">Sandbox (Testing)</option>
                  <option value="production">Production (Live)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shortcode (Paybill/Till)</label>
                <input type="text" value={settings.mpesa_shortcode || ''} onChange={e => updateSetting('mpesa_shortcode', e.target.value)} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none" placeholder="e.g. 174379" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Consumer Key</label>
              <input type="text" value={settings.mpesa_consumer_key || ''} onChange={e => updateSetting('mpesa_consumer_key', e.target.value)} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none font-mono text-sm" placeholder="Your Consumer Key" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Consumer Secret</label>
              <input type="password" value={settings.mpesa_consumer_secret || ''} onChange={e => updateSetting('mpesa_consumer_secret', e.target.value)} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none font-mono text-sm" placeholder="••••••••••••••••" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passkey</label>
              <input type="password" value={settings.mpesa_passkey || ''} onChange={e => updateSetting('mpesa_passkey', e.target.value)} className="w-full border border-gray-300 p-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none font-mono text-sm" placeholder="••••••••••••••••" />
            </div>
          </div>
        )}

        {/* Branch Management */}
        {activeTab === 'branches' && (
          <BranchManagement />
        )}

      </div>
    </div>
  );
}
