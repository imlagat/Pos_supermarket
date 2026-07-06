import React from 'react';

export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <h1 className="text-4xl font-black text-gray-900 mb-8">Privacy Policy</h1>
      <div className="prose max-w-none text-gray-600">
        <p className="mb-4">Last updated: June 2026</p>
        
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
        <p className="mb-4">
          We collect information to provide better services to all our users. The types of personal information we obtain include:
        </p>
        <ul className="list-disc pl-6 mb-6">
          <li>Contact details (such as name, email address, and phone number)</li>
          <li>Account login credentials</li>
          <li>Payment and transaction information</li>
          <li>Store and inventory data processed through our platform</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
        <p className="mb-4">
          We use the information we collect to:
        </p>
        <ul className="list-disc pl-6 mb-6">
          <li>Provide, operate, and maintain our services</li>
          <li>Improve and personalize your experience</li>
          <li>Process transactions and send related information</li>
          <li>Send administrative and support messages</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Data Security</h2>
        <p className="mb-4">
          We implement appropriate technical and organizational measures to maintain the safety of your personal information when you enter, submit, or access your personal information.
        </p>
      </div>
    </div>
  );
}
