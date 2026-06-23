import React from 'react';

export default function About() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-black text-gray-900 mb-6">About POSsuper</h1>
        <p className="text-xl text-gray-600 mb-12">
          We're building the operating system for modern retail and supermarkets.
        </p>
      </div>
      
      <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
        <p className="text-gray-600 leading-relaxed mb-8">
          POSsuper was founded with a simple mission: to give independent supermarkets and retail stores the same powerful technology used by massive chains, but at a fraction of the cost and complexity. We believe that local businesses are the backbone of our communities, and they deserve tools that help them thrive in a competitive landscape.
        </p>
        
        <h2 className="text-2xl font-bold mb-4">Our Story</h2>
        <p className="text-gray-600 leading-relaxed mb-8">
          Starting as a small team of developers who saw firsthand the frustrations of clunky, outdated POS systems in family-owned stores, we set out to build something better. Today, POSsuper powers hundreds of locations, processing millions of transactions reliably and securely.
        </p>
      </div>
    </div>
  );
}
