import React from 'react';

export default function HelpCenter() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="text-4xl font-black text-gray-900 mb-6">How can we help?</h1>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search for articles, guides, or hardware setup..." 
            className="w-full px-6 py-4 rounded-full border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition text-lg"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:border-orange-200 transition cursor-pointer">
          <h3 className="text-xl font-bold mb-3 text-gray-900">Getting Started</h3>
          <p className="text-gray-600 mb-4">Learn how to set up your store, add your first products, and configure your basic settings.</p>
          <span className="text-orange-600 font-medium">Browse articles →</span>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:border-orange-200 transition cursor-pointer">
          <h3 className="text-xl font-bold mb-3 text-gray-900">Hardware Setup</h3>
          <p className="text-gray-600 mb-4">Step-by-step guides for connecting printers, scanners, and cash drawers to POSsuper.</p>
          <span className="text-orange-600 font-medium">Browse articles →</span>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:border-orange-200 transition cursor-pointer">
          <h3 className="text-xl font-bold mb-3 text-gray-900">Inventory Management</h3>
          <p className="text-gray-600 mb-4">Master stock counts, purchase orders, supplier management and low-stock alerts.</p>
          <span className="text-orange-600 font-medium">Browse articles →</span>
        </div>
      </div>
    </div>
  );
}
