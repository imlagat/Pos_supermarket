import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Check, X, Building2, Zap, Headphones, BarChart3, Cloud, Layers } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import ContactSalesModal from '../../components/marketing/ContactSalesModal';

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');

  const handleSelectPlan = (planName) => {
    if (planName === 'Enterprise') {
      setIsContactModalOpen(true);
      return;
    }
    navigate(`/register?plan=${planName.toLowerCase()}`);
  };

  const plans = [
    {
      name: 'Bronze',
      price: '1,599',
      description: 'Perfect for small shops and single-location businesses just getting started.',
      features: [
        { name: '1 Branch (Single Store)', included: true },
        { name: 'Up to 5 User Accounts', included: true },
        { name: 'Offline Mode Ready', included: true },
        { name: 'Standard Support', included: true },
        { name: 'Basic Analytics', included: true },
        { name: 'Auto-Reorder AI', included: false },
        { name: 'Loyalty Programs', included: true },
      ],
      icon: <Building2 className="w-8 h-8 text-orange-600" />,
      popular: false,
    },
    {
      name: 'Silver',
      price: '2,599',
      description: 'Ideal for growing supermarkets and multi-location retail stores.',
      features: [
        { name: 'Unlimited Branches', included: true },
        { name: 'Unlimited User Accounts', included: true },
        { name: 'Offline Mode Ready', included: true },
        { name: 'Priority 24/7 Support', included: true },
        { name: 'Advanced Analytics', included: true },
        { name: 'Auto-Reorder AI', included: true },
        { name: 'Loyalty Programs', included: true },
      ],
      icon: <Zap className="w-8 h-8 text-white" />,
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'Tailored solutions for large franchises requiring custom integrations.',
      features: [
        { name: 'Everything in Silver', included: true },
        { name: 'Dedicated Account Manager', included: true },
        { name: 'Custom ERP Integrations', included: true },
        { name: 'Custom Reporting', included: true },
        { name: 'On-premise Deployment', included: true },
        { name: 'SLA Guarantee', included: true },
        { name: 'White-labeling Options', included: true },
      ],
      icon: <Layers className="w-8 h-8 text-gray-700" />,
      popular: false,
    }
  ];

  return (
    <div className="bg-gray-50 pt-20 pb-32 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
              Simple, transparent pricing
            </h1>
            <p className="text-xl text-gray-600">
              {user 
                ? `Welcome ${user.name}! Choose the right plan to jumpstart your business.` 
                : 'Choose the right plan for your business. No hidden fees, cancel anytime.'}
            </p>
          </motion.div>
        </div>

        <div className="flex justify-center mb-12">
          <div className="bg-white border border-gray-200 p-1.5 rounded-full flex items-center shadow-sm">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                billingCycle === 'monthly' 
                  ? 'bg-orange-600 text-white shadow-md' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                billingCycle === 'annual' 
                  ? 'bg-orange-600 text-white shadow-md' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Annual <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${billingCycle === 'annual' ? 'bg-white text-orange-600' : 'bg-green-500 text-white'}`}>SAVE 40%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-3xl p-8 bg-white border ${
                plan.popular 
                  ? 'border-orange-500 shadow-2xl shadow-orange-500/20 md:-mt-8 md:mb-8' 
                  : 'border-gray-200 shadow-lg'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-gradient-to-r from-orange-600 to-orange-500 text-white text-sm font-bold uppercase tracking-widest py-1.5 px-4 rounded-full shadow-md">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{plan.name}</h2>
                  <p className="text-gray-500 text-sm mt-1">{plan.description}</p>
                </div>
                <div className={`p-3 rounded-2xl ${plan.popular ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg' : 'bg-gray-100'}`}>
                  {plan.icon}
                </div>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-extrabold text-gray-900">
                  {plan.price === 'Custom' 
                    ? 'Custom' 
                    : `KSH ${billingCycle === 'monthly' ? plan.price : (plan.price === '1,599' ? '11,513' : '18,713')}`}
                </span>
                {plan.price !== 'Custom' && (
                  <span className="text-gray-500 font-medium">
                    /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                  </span>
                )}
              </div>

              <button
                onClick={() => handleSelectPlan(plan.name)}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 mb-8 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-100'
                }`}
              >
                {plan.price === 'Custom' ? 'Talk to Sales' : 'Select Plan'}
              </button>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                  What's included
                </h4>
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
                    )}
                    <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
      <ContactSalesModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
      />
    </div>
  );
}
