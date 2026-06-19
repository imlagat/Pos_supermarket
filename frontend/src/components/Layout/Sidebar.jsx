import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import { 
  LayoutDashboard, ShoppingCart, Package, Tag, Users, 
  AlertTriangle, Receipt, UserPlus, BarChart3, Settings, LogOut, UserCircle, FileText,
  Truck, RefreshCw, Wallet, UserCog, Banknote
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
  { name: 'Audit Logs', path: '/audit-logs', icon: FileText, roles: ['admin'] },
  { name: 'Settings', path: '/settings', icon: Settings, roles: ['admin', 'manager'] },
];

export default function Sidebar() {
  const [loadingPath, setLoadingPath] = useState(null);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const { user, logout } = useAuthStore();
  const allowed = menuItems.filter(item => item.roles.includes(user?.role));
  
  const isSuspended = user?.tenant && !user.tenant.is_active;
  const allowedPathsIfSuspended = ['/dashboard', '/transactions', '/reports'];

  return (
    <aside className="bg-gradient-to-b from-amber-800 to-orange-800 text-white flex flex-col shadow-2xl h-screen sticky top-0 w-20 md:w-72 transition-all duration-300 print:hidden">
      {/* Logo section */}
      <div className="p-4 border-b border-amber-700/50 flex justify-center md:justify-start">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#E55A2A] rounded-lg flex items-center justify-center shadow-sm">
            <ShoppingCart className="text-white w-4 h-4" strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-black tracking-tight hidden md:block">
            <span className="text-white">POS</span>
            <span className="text-[#E55A2A]">super</span>
          </h1>
        </div>
      </div>

      {user?.tenant?.tier !== 'bronze' && <BranchSelector />}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 md:px-4 py-4 space-y-1">
        {allowed.map((item) => {
          const Icon = item.icon;
          const isNavigating = loadingPath === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={(e) => {
                if (isSuspended && !allowedPathsIfSuspended.includes(item.path)) {
                  e.preventDefault();
                  useAuthStore.getState().setSuspendedModal(true);
                  return;
                }
                setLoadingPath(item.path);
                setTimeout(() => setLoadingPath(null), 600);
              }}
              className={({ isActive }) =>
                `flex items-center justify-center md:justify-start gap-3 px-2 md:px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive || isNavigating
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                    : 'text-amber-100 hover:bg-amber-700/50 hover:text-white'
                }`
              }
            >
              {isNavigating ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
              ) : (
                <Icon size={20} className="flex-shrink-0" />
              )}
              <span className="hidden md:inline font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* System Status Widget */}
      <div className="hidden md:block px-4 mb-4">
        <div className="bg-amber-900/50 rounded-xl p-3 border border-amber-700/50">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-xs font-semibold text-amber-100">System Online</span>
          </div>
          <p className="text-[10px] text-amber-300">Last Sync: Just now</p>
        </div>
      </div>

      {/* User section */}
      <div className="p-4 border-t border-amber-700/50">
        <div className="flex items-center justify-center md:justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 flex items-center justify-center">
              <span className="text-sm font-bold text-white">{user?.name?.charAt(0)}</span>
            </div>
            <div className="hidden md:block text-sm">
              <p className="font-medium leading-tight">{user?.name}</p>
              <p className="text-xs text-amber-200 capitalize">{user?.role}</p>
            </div>
          </div>
          <div className="flex gap-1">
            {user?.role === 'admin' && (
              <button onClick={() => setShowSwitchModal(true)} className="p-1 text-amber-200 hover:text-white transition-colors" title="Switch Account">
                <UserCog size={18} />
              </button>
            )}
            <NavLink to="/profile" className="p-1 text-amber-200 hover:text-white transition-colors" title="Profile">
              <UserCircle size={18} />
            </NavLink>
            <button onClick={() => logout()} className="p-1 text-amber-200 hover:text-white transition-colors" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
      <SwitchAccountModal isOpen={showSwitchModal} onClose={() => setShowSwitchModal(false)} />
    </aside>
  );
}
