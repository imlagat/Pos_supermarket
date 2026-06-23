import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import ChatWidget from '../AIChatbot/ChatWidget';
import Paywall from '../common/Paywall';
import { Search, Bell, HelpCircle, Menu, LogOut, User, RefreshCw, AlertCircle, Package, Settings as SettingsIcon } from 'lucide-react';

import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import SwitchAccountModal from '../Auth/SwitchAccountModal';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const isBronze = user?.tenant?.tier === 'bronze';
  const isSuspended = user?.tenant && !user.tenant.is_active;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  const [alerts, setAlerts] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [readCount, setReadCount] = useState(() => parseInt(localStorage.getItem('notifReadCount') || '0', 10));
  const notifRef = useRef(null);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const profileRef = useRef(null);

  // Fetch alerts on mount
  useEffect(() => {
    api.get('/inventory/alerts').then(res => setAlerts(res.data || [])).catch(() => {});
  }, []);

  // Handle outside clicks for dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setIsSearchFocused(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search logic
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      api.get(`/search?q=${searchQuery}`).then(res => setSearchResults(res.data)).catch(() => {});
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const trialEndsAt = user?.tenant?.trial_ends_at;
  const billingStatus = user?.tenant?.billing_status;
  let trialDaysRemaining = null;
  let isTrialExpired = false;

  if (billingStatus === 'trialing' && trialEndsAt) {
      const endsAt = new Date(trialEndsAt);
      const now = new Date();
      const diffTime = endsAt - now;
      trialDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (trialDaysRemaining <= 0) {
          isTrialExpired = true;
      }
  }

  return (
    <div className="flex h-screen overflow-hidden print:h-auto print:overflow-visible bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-auto bg-[#F8F9FA] print:bg-white print:overflow-visible print:p-0">
        <header className="bg-white h-16 border-b border-gray-100 flex items-center justify-between px-6 shrink-0 z-10 sticky top-0 print:hidden">
          <div className="flex items-center gap-4 flex-1">
            <button className="text-gray-400 hover:text-gray-700 md:hidden"><Menu size={20}/></button>
            <div className="relative max-w-md w-full hidden md:block group" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-orange-500 transition-colors" />
              <input 
                ref={searchInputRef}
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search products, customers, invoices..." 
                className="w-full pl-10 pr-16 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white transition-all shadow-sm font-medium"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                <kbd className="hidden sm:inline-block border border-slate-300 rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-500 bg-white shadow-sm">Ctrl + K</kbd>
              </div>

              {/* Search Dropdown */}
              {isSearchFocused && searchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-[400px] overflow-y-auto">
                  {searchResults.products?.length > 0 && (
                    <div className="p-2 border-b border-gray-50">
                      <p className="text-xs font-bold text-gray-400 uppercase px-2 mb-1">Products</p>
                      {searchResults.products.map(p => (
                        <div key={`p-${p.id}`} className="flex items-center gap-3 px-2 py-1.5 hover:bg-orange-50 rounded cursor-pointer transition">
                          <Package className="w-4 h-4 text-orange-500" />
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                            <p className="text-[10px] text-gray-500">SKU: {p.sku} | Ksh {p.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchResults.customers?.length > 0 && (
                    <div className="p-2 border-b border-gray-50">
                      <p className="text-xs font-bold text-gray-400 uppercase px-2 mb-1">Customers</p>
                      {searchResults.customers.map(c => (
                        <div key={`c-${c.id}`} className="flex items-center gap-3 px-2 py-1.5 hover:bg-orange-50 rounded cursor-pointer transition">
                          <User className="w-4 h-4 text-orange-500" />
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                            <p className="text-[10px] text-gray-500">{c.phone || c.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchResults.orders?.length > 0 && (
                    <div className="p-2">
                      <p className="text-xs font-bold text-gray-400 uppercase px-2 mb-1">Orders & Invoices</p>
                      {searchResults.orders.map(o => (
                        <div key={`o-${o.id}`} className="flex items-center gap-3 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer transition">
                          <Search className="w-4 h-4 text-slate-500" />
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{o.order_number}</p>
                            <p className="text-[10px] text-gray-500">Total: Ksh {parseFloat(o.total_amount).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {(!searchResults.products?.length && !searchResults.customers?.length && !searchResults.orders?.length) && (
                    <div className="p-6 text-center text-gray-500 text-sm">
                      No results found for "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => {
                  const newState = !showNotifications;
                  setShowNotifications(newState);
                  if (newState) {
                    let sysAlerts = 0;
                    if (trialDaysRemaining !== null && trialDaysRemaining <= 7 && trialDaysRemaining > 0) sysAlerts++;
                    else if (isTrialExpired) sysAlerts++;
                    if (isSuspended) sysAlerts++;
                    const total = alerts.length + sysAlerts;
                    setReadCount(total);
                    localStorage.setItem('notifReadCount', total.toString());
                  }
                }}
                className="relative text-slate-600 hover:text-slate-900 transition-colors"
              >
                <Bell size={22} strokeWidth={2.5} />
                {(() => {
                  let sysAlerts = 0;
                  if (trialDaysRemaining !== null && trialDaysRemaining <= 7 && trialDaysRemaining > 0) sysAlerts++;
                  else if (isTrialExpired) sysAlerts++;
                  if (isSuspended) sysAlerts++;
                  const total = alerts.length + sysAlerts;
                  const unread = Math.max(0, total - readCount);
                  return unread > 0 ? (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">{unread}</span>
                  ) : null;
                })()}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-800 text-sm">Notifications</h3>
                    {(() => {
                      let sysAlerts = 0;
                      if (trialDaysRemaining !== null && trialDaysRemaining <= 7 && trialDaysRemaining > 0) sysAlerts++;
                      else if (isTrialExpired) sysAlerts++;
                      if (isSuspended) sysAlerts++;
                      const total = alerts.length + sysAlerts;
                      const unread = Math.max(0, total - readCount);
                      return unread > 0 ? (
                        <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">{unread} New</span>
                      ) : null;
                    })()}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {(() => {
                      let sysAlerts = [];
                      if (isSuspended) {
                        sysAlerts.push({ type: 'system', message: 'Your account is suspended. Read-only mode active.' });
                      }
                      if (isTrialExpired) {
                        sysAlerts.push({ type: 'system', message: 'Free trial has expired. Upgrade to keep using all features.' });
                      } else if (trialDaysRemaining !== null && trialDaysRemaining <= 7 && trialDaysRemaining > 0) {
                        sysAlerts.push({ type: 'system', message: `Free trial ends in ${trialDaysRemaining} days!` });
                      }
                      const allAlerts = [...sysAlerts, ...alerts];
                      
                      if (allAlerts.length === 0) {
                        return <div className="p-6 text-center text-gray-500 text-sm">No new notifications.</div>;
                      }
                      
                      return allAlerts.map((alert, idx) => (
                        <div key={idx} className={`p-3 border-b border-gray-50 transition flex gap-3 items-start cursor-pointer ${alert.type === 'system' ? 'bg-orange-50 hover:bg-orange-100' : 'hover:bg-red-50/30'}`}>
                          <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${alert.type === 'system' ? 'bg-orange-100' : 'bg-red-50'}`}>
                            <AlertCircle className={`w-4 h-4 ${alert.type === 'system' ? 'text-orange-600' : 'text-red-500'}`} />
                          </div>
                          <div>
                            {alert.type === 'system' ? (
                              <>
                                <p className="text-sm font-semibold text-gray-800">System Alert</p>
                                <p className="text-xs text-gray-600 mt-0.5">{alert.message}</p>
                              </>
                            ) : (
                              <>
                                <p className="text-sm font-semibold text-gray-800">{alert.product?.name || 'Product'}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {alert.type === 'low_stock' ? `Low stock! Only ${alert.product?.stock_quantity} left.` : `Expiring soon on ${new Date(alert.product?.expiry_date).toLocaleDateString()}.`}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                  <div className="p-2 border-t border-gray-100 bg-gray-50">
                    <button 
                      onClick={() => { setShowNotifications(false); navigate('/inventory'); }}
                      className="w-full text-center text-xs font-bold text-orange-600 hover:text-orange-700 py-1 transition-colors"
                    >
                      View All Inventory
                    </button>
                  </div>
                </div>
              )}
            </div>

              <button className="text-slate-600 hover:text-slate-900 transition-colors hidden md:block">
                <HelpCircle size={22} strokeWidth={2.5} />
            </button>
            
            <div className="relative pl-5 border-l border-gray-100" ref={profileRef}>
              <div className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-slate-50 transition" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-orange-50 group-hover:ring-orange-100 transition-all">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div className="hidden md:block text-left mr-1">
                  <p className="text-sm font-bold text-slate-800 leading-tight">{user?.name || 'Administrator'}</p>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{user?.role || 'admin'}</p>
                </div>
              </div>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <p className="font-bold text-gray-800 text-sm truncate">{user?.name || 'Administrator'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email || 'admin@example.com'}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600 mt-1">{user?.role || 'Admin'}</p>
                  </div>
                  <div className="p-2">
                    <button onClick={() => { setShowProfileMenu(false); navigate('/profile'); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-orange-600 rounded-lg transition-colors">
                      <User size={16} /> Profile
                    </button>
                    <button onClick={() => { setShowProfileMenu(false); navigate('/settings'); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-orange-600 rounded-lg transition-colors">
                      <SettingsIcon size={16} /> Settings
                    </button>
                    {user?.role === 'admin' && (
                      <button onClick={() => { setShowProfileMenu(false); setShowSwitchModal(true); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-orange-600 rounded-lg transition-colors">
                        <RefreshCw size={16} /> Switch Account
                      </button>
                    )}
                  </div>
                  <div className="p-2 border-t border-gray-100">
                    <button onClick={() => { setShowProfileMenu(false); logout(); navigate('/login'); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <LogOut size={16} /> Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {isSuspended && (
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-3 text-center text-sm font-bold shadow-md z-50 flex-shrink-0 animate-pulse print:hidden">
            ⚠️ Your account has been suspended. You are in read-only mode and can only view historical sales data.
          </div>
        )}
        {trialDaysRemaining !== null && !isTrialExpired && (
          <div className="bg-yellow-500 text-gray-900 p-3 text-center text-sm font-bold shadow-md z-50 flex-shrink-0">
            ⏳ Free trial ends in {trialDaysRemaining} day{trialDaysRemaining === 1 ? '' : 's'}. <button onClick={() => window.location.href='/settings'} className="underline ml-2">Upgrade now</button>
          </div>
        )}
        <div className="p-4 md:p-6 print:p-0 flex-1">
          {isTrialExpired ? <Paywall /> : <Outlet />}
        </div>
      </main>

      <SwitchAccountModal isOpen={showSwitchModal} onClose={() => setShowSwitchModal(false)} />
      {!isBronze && <ChatWidget />}
    </div>
  );
}
