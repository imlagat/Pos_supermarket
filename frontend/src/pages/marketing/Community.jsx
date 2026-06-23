import React from 'react';

export default function Community() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-black text-gray-900 mb-6">Join the POSsuper Community</h1>
        <p className="text-xl text-gray-600 mb-12">
          Connect with other supermarket owners, share best practices, and get the latest updates on new features.
        </p>
        
        <div className="grid md:grid-cols-2 gap-8 text-left">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <h3 className="text-2xl font-bold mb-4">Retailer Forum</h3>
            <p className="text-gray-600 mb-6">Discuss retail strategies, inventory management tips, and POSsuper workflows with peers.</p>
            <button className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition">Visit Forum</button>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <h3 className="text-2xl font-bold mb-4">Feature Requests</h3>
            <p className="text-gray-600 mb-6">Have an idea for a new feature? Submit and upvote feature requests on our public roadmap.</p>
            <button className="bg-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-700 transition">View Roadmap</button>
          </div>
        </div>
      </div>
    </div>
  );
}
