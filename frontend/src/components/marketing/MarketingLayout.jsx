import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';

export default function MarketingLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#E55A2A] via-yellow-400 to-orange-600 bg-[length:200%_auto] animate-gradient-x"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center gap-2.5 group hover:opacity-90 transition-opacity">
              <div className="w-10 h-10 bg-[#E55A2A] rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                <ShoppingCart className="text-white w-5 h-5" strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-black tracking-tight">
                <span className="text-slate-900">POS</span>
                <span className="text-[#E55A2A]">super</span>
              </h1>
            </Link>
            
            <nav className="hidden md:flex gap-8">
              <Link to="/" className="text-gray-600 hover:text-orange-600 font-medium transition">Home</Link>
              <Link to="/features" className="text-gray-600 hover:text-orange-600 font-medium transition">Features</Link>
              <Link to="/pricing" className="text-gray-600 hover:text-orange-600 font-medium transition">Pricing</Link>
            </nav>

            <div className="flex items-center gap-4">
              <Link to="/login" className="text-gray-700 hover:text-orange-600 font-medium transition">
                Log in
              </Link>
              <Link to="/register" className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-5 py-2.5 rounded-full font-medium transition shadow-md hover:shadow-lg">
                Start 7 Days Trial
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="bg-gray-900 text-gray-300 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-700 rounded-lg flex items-center justify-center text-white">
                  <ShoppingCart size={16} />
                </div>
                <span className="font-bold text-lg text-white">
                  POS<span className="text-orange-500">super</span>
                </span>
              </div>
              <p className="text-sm text-gray-400">
                The smart point of sale system for modern retail and supermarkets.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/features" className="hover:text-orange-400 transition">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-orange-400 transition">Pricing</Link></li>
                <li><Link to="/hardware" className="hover:text-orange-400 transition">Hardware</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/help-center" className="hover:text-orange-400 transition">Help Center</Link></li>
                <li><Link to="/community" className="hover:text-orange-400 transition">Community</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="hover:text-orange-400 transition">About</Link></li>
                <li><Link to="/contact" className="hover:text-orange-400 transition">Contact</Link></li>
                <li><Link to="/privacy" className="hover:text-orange-400 transition">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-center text-gray-500">
            © {new Date().getFullYear()} POS_super. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
