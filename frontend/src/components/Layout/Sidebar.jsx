import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { 
  LayoutDashboard, ShoppingCart, Package, Tag, Users, 
  Receipt, UserPlus, BarChart3, Settings, LogOut, UserCircle, FileText,
  Truck, RefreshCw, UserCog, Banknote, CreditCard, X
} from 'lucide-react';

import BranchSelector from './BranchSelector';
import SwitchAccountModal from '../Auth/SwitchAccountModal';

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager'] },
  { name: 'POS', path: '/pos', icon: ShoppingCart, roles: ['admin', 'manager', 'cashier'] },
  { name: 'Cash Drawer', path: '/cash-drawer', icon: Banknote, roles: ['manager', 'cashier'] },
  { name: 'Products', path: '/products', icon: Package, roles: ['admin', 'manager'] },
  { name: 'Discounts', path: '/discounts', icon: Tag, roles: ['admin', 'manager'] },
  { name: 'Customers', path: '/customers', icon: Users, roles: ['admin', 'manager', 'cashier'] },
  { name: 'Inventory & Orders', path: '/inventory-orders', icon: Package, roles: ['admin', 'manager'] },
  { name: 'Transactions', path: '/transactions', icon: Receipt, roles: ['admin', 'manager', 'cashier'] },
  { name: 'Suppliers', path: '/suppliers', icon: Truck, roles: ['admin', 'manager'] },
  { name: 'Returns', path: '/returns', icon: RefreshCw, roles: ['admin', 'manager', 'cashier'] },
  { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['admin', 'manager'] },
  { name: 'Finance & P&L', path: '/finance', icon: BarChart3, roles: ['admin', 'manager'] },
  { name: 'Users & Shifts', path: '/users', icon: UserPlus, roles: ['admin', 'manager'] },
  { name: 'Billing', path: '/billing', icon: CreditCard, roles: ['admin'] },
  { name: 'Audit Logs', path: '/audit-logs', icon: FileText, roles: ['admin'] },
  { name: 'Settings', path: '/settings', icon: Settings, roles: ['admin', 'manager'] },
];

export default function Sidebar({ isOpen, onClose }) {
  const [loadingPath, setLoadingPath] = useState(null);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const { user, logout } = useAuthStore();
  const allowed = menuItems.filter(item => item.roles.includes(user?.role));
  
  const isSuspended = user?.tenant && !user.tenant.is_active;
  const allowedPathsIfSuspended = ['/dashboard', '/transactions', '/reports'];

  const handleNavClick = (path, e) => {
    if (isSuspended && !allowedPathsIfSuspended.includes(path)) {
      e.preventDefault();
      useAuthStore.getState().setSuspendedModal(true);
      return;
    }
    setLoadingPath(path);
    setTimeout(() => setLoadingPath(null), 600);
    if (onClose) onClose();
  };

  const navContent = (
    <>
      {/* Logo section */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shadow-md">
            <ShoppingCart className="text-white w-5 h-5" strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-black tracking-tight">
            <span className="text-white">POS</span>
            <span className="text-orange-500">super</span>
          </h1>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {user?.tenant?.tier !== 'bronze' && <BranchSelector />}

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {allowed.map((item) => {
          const Icon = item.icon;
          const isNavigating = loadingPath === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={(e) => handleNavClick(item.path, e)}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                  isActive || isNavigating
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {isNavigating ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
              ) : (
                <Icon size={20} className="flex-shrink-0" />
              )}
              <span className="font-semibold tracking-wide">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* System Status Widget */}
      <div className="px-4 mb-3 hidden md:block">
        <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-xs font-semibold text-slate-200">System Online</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">Last Sync: Just now</p>
        </div>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center font-bold text-white text-sm shadow-md shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="text-sm truncate">
              <p className="font-bold text-slate-100 truncate leading-tight">{user?.name}</p>
              <p className="text-[11px] text-slate-400 font-semibold capitalize tracking-wider">{user?.role}</p>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            {user?.role === 'admin' && (
              <button onClick={() => setShowSwitchModal(true)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition" title="Switch Account">
                <UserCog size={18} />
              </button>
            )}
            <NavLink to="/profile" onClick={() => onClose && onClose()} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition" title="Profile">
              <UserCircle size={18} />
            </NavLink>
            <button onClick={() => logout()} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
      <SwitchAccountModal isOpen={showSwitchModal} onClose={() => setShowSwitchModal(false)} />
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex md:flex-col bg-slate-900 text-white shadow-2xl h-screen sticky top-0 w-72 transition-all duration-300 print:hidden shrink-0 z-40">
        {navContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <aside className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-slate-900 text-white z-[101] flex flex-col shadow-2xl transition-transform duration-300">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
