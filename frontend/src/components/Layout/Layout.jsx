import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import ChatWidget from '../AIChatbot/ChatWidget';
import Paywall from '../common/Paywall';
import { 
  Search, Bell, HelpCircle, Menu, LogOut, User, RefreshCw, 
  AlertCircle, Package, Settings as SettingsIcon, LayoutDashboard, 
  ShoppingCart, Tag, CreditCard, FileText 
} from 'lucide-react';

import { useAuthStore } from '../../stores/authStore';
import { useCartStore } from '../../stores/cartStore';
import api from '../../services/api';
import SwitchAccountModal from '../Auth/SwitchAccountModal';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const cartItems = useCartStore(state => state.items);
  const cartCount = cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const navigate = useNavigate();
  const location = useLocation();
  const isBronze = user?.tenant?.tier === 'bronze';
  const isSuspended = user?.tenant && !user.tenant.is_active;

  const [mobileOpen, setMobileOpen] = useState(false);
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
  
  const [trialTimeLeft, setTrialTimeLeft] = useState('');
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(null);
  const [isTrialExpired, setIsTrialExpired] = useState(false);

  useEffect(() => {
    if (billingStatus !== 'trialing' || !trialEndsAt) {
        setTrialDaysRemaining(null);
        setIsTrialExpired(false);
        return;
    }

    const endsAt = new Date(trialEndsAt).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = endsAt - now;

      if (distance <= 0) {
          setIsTrialExpired(true);
          setTrialDaysRemaining(0);
          setTrialTimeLeft('Expired');
      } else {
          setIsTrialExpired(false);
          const days = Math.floor(distance / (1000 * 60 * 60 * 24));
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          
          setTrialDaysRemaining(Math.ceil(distance / (1000 * 60 * 60 * 24)));
          setTrialTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [billingStatus, trialEndsAt]);

  return (
    <div className="flex h-screen overflow-hidden print:h-auto print:overflow-visible bg-gray-50">
      <Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main className="flex-1 flex flex-col overflow-auto bg-[#F8F9FA] print:bg-white print:overflow-visible print:p-0 min-w-0">
        <header className="bg-white h-16 border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 shrink-0 z-[60] sticky top-0 print:hidden">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button 
              onClick={() => setMobileOpen(true)}
              className="text-slate-600 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100 transition md:hidden"
              aria-label="Open mobile menu"
            >
              <Menu size={22}/>
            </button>
            <div className="relative max-w-md w-full group" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-orange-500 transition-colors" />
              <input 
                ref={searchInputRef}
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search products, customers..." 
                className="w-full pl-9 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all shadow-sm font-medium"
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

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
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
                className="relative text-slate-600 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <Bell size={20} strokeWidth={2.5} />
                {(() => {
                  let sysAlerts = 0;
                  if (trialDaysRemaining !== null && trialDaysRemaining <= 7 && trialDaysRemaining > 0) sysAlerts++;
                  else if (isTrialExpired) sysAlerts++;
                  if (isSuspended) sysAlerts++;
                  const total = alerts.length + sysAlerts;
                  const unread = Math.max(0, total - readCount);
                  return unread > 0 ? (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">{unread}</span>
                  ) : null;
                })()}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute top-full right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
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
                        sysAlerts.push({ type: 'system', message: '7 days trial has expired. Upgrade to keep using all features.' });
                      } else if (trialDaysRemaining !== null && trialDaysRemaining <= 7 && trialDaysRemaining > 0) {
                        sysAlerts.push({ type: 'system', message: `7 days trial ends in ${trialDaysRemaining} days!` });
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
                  {user?.role !== 'cashier' && (
                    <div className="p-2 border-t border-gray-100 bg-gray-50">
                      <button 
                        onClick={() => { setShowNotifications(false); navigate('/inventory'); }}
                        className="w-full text-center text-xs font-bold text-orange-600 hover:text-orange-700 py-1 transition-colors"
                      >
                        View All Inventory
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button className="text-slate-600 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100 transition-colors hidden md:block">
              <HelpCircle size={20} strokeWidth={2.5} />
            </button>
            
            <div className="relative pl-3 border-l border-gray-200" ref={profileRef}>
              <div className="flex items-center gap-2 cursor-pointer p-1 rounded-xl hover:bg-slate-100 transition" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-orange-100">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div className="hidden md:block text-left mr-1">
                  <p className="text-xs font-bold text-slate-800 leading-tight truncate">{user?.name || 'Administrator'}</p>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{user?.role || 'admin'}</p>
                </div>
              </div>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <p className="font-bold text-gray-800 text-sm truncate">{user?.name || 'Administrator'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email || 'admin@example.com'}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600 mt-1">{user?.role || 'Admin'}</p>
                  </div>
                  <div className="p-2">
                    <button onClick={() => { setShowProfileMenu(false); navigate('/profile'); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-orange-600 rounded-xl transition-colors">
                      <User size={16} /> Profile
                    </button>
                    <button onClick={() => { setShowProfileMenu(false); navigate('/settings'); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-orange-600 rounded-xl transition-colors">
                      <SettingsIcon size={16} /> Settings
                    </button>
                    {user?.role === 'admin' && (
                      <button onClick={() => { setShowProfileMenu(false); setShowSwitchModal(true); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-orange-600 rounded-xl transition-colors">
                        <RefreshCw size={16} /> Switch Account
                      </button>
                    )}
                  </div>
                  <div className="p-2 border-t border-gray-100">
                    <button onClick={() => { setShowProfileMenu(false); logout(); navigate('/login'); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                      <LogOut size={16} /> Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="sticky top-16 z-50 flex flex-col flex-shrink-0 w-full shadow-md print:hidden">
          {isSuspended && (
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-3 text-center text-sm font-bold animate-pulse">
              ⚠️ Your account has been suspended. You are in read-only mode and can only view historical sales data. <a href="mailto:superposlish@gmail.com" className="underline ml-2 hover:text-orange-200 transition-colors">Talk to sales</a>
            </div>
          )}
          {trialDaysRemaining !== null && !isTrialExpired && (
            <div className="bg-yellow-500 text-gray-900 p-2.5 text-center text-xs sm:text-sm font-bold border-b border-yellow-600/20">
              ⏳ 7 days trial ends in {trialTimeLeft}. <button onClick={() => navigate('/billing')} className="underline ml-2 hover:text-orange-700 transition-colors">Upgrade now</button>
            </div>
          )}
        </div>

        <div className="p-3 sm:p-5 md:p-6 print:p-0 flex-1 pb-24 md:pb-6">
          {isTrialExpired && location.pathname !== '/billing' ? <Paywall /> : <Outlet />}
        </div>
      </main>

      {/* Tactical Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md text-slate-400 border-t border-slate-800/80 z-[90] flex items-center justify-around py-2 px-1 md:hidden shadow-2xl print:hidden">
        {['admin', 'manager'].includes(user?.role) && (
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-semibold transition-all ${isActive ? 'text-orange-400 font-bold' : 'hover:text-slate-200'}`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
        )}
        <NavLink 
          to="/pos" 
          className={({ isActive }) => `flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-semibold transition-all ${isActive ? 'text-orange-400 font-bold' : 'hover:text-slate-200'}`}
        >
          <div className="relative">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-orange-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-slate-900">
                {cartCount}
              </span>
            )}
          </div>
          <span>POS</span>
        </NavLink>
        {['admin', 'manager'].includes(user?.role) && (
          <NavLink 
            to="/products" 
            className={({ isActive }) => `flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-semibold transition-all ${isActive ? 'text-orange-400 font-bold' : 'hover:text-slate-200'}`}
          >
            <Package size={20} />
            <span>Products</span>
          </NavLink>
        )}
        {['admin', 'manager'].includes(user?.role) && (
          <NavLink 
            to="/inventory-orders" 
            className={({ isActive }) => `flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-semibold transition-all ${isActive ? 'text-orange-400 font-bold' : 'hover:text-slate-200'}`}
          >
            <Tag size={20} />
            <span>Inventory</span>
          </NavLink>
        )}
        <button 
          onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition-all"
        >
          <Menu size={20} />
          <span>Menu</span>
        </button>
      </nav>

      <SwitchAccountModal isOpen={showSwitchModal} onClose={() => setShowSwitchModal(false)} />
      <ChatWidget />
    </div>
  );
}
