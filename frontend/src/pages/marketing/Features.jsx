import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, BarChart3, Cloud, Users, CreditCard } from 'lucide-react';

export default function Features() {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const allFeatures = [
    {
      title: 'Real-time Sync',
      description: 'Your inventory, sales, and customer data sync instantly across all devices and locations.',
      icon: <Cloud className="w-8 h-8 text-orange-600" />
    },
    {
      title: 'Advanced Security',
      description: 'Bank-level encryption keeps your business data and customer information completely secure.',
      icon: <Shield className="w-8 h-8 text-orange-600" />
    },
    {
      title: 'Detailed Analytics',
      description: 'Get deep insights into what is selling, when it sells, and who is buying it.',
      icon: <BarChart3 className="w-8 h-8 text-orange-600" />
    },
    {
      title: 'Lightning Fast',
      description: 'Built for speed. Ring up customers quickly even during peak rush hours without any lag.',
      icon: <Zap className="w-8 h-8 text-orange-600" />
    },
    {
      title: 'Customer Management',
      description: 'Build loyalty programs, track purchase history, and keep your customers coming back.',
      icon: <Users className="w-8 h-8 text-orange-600" />
    },
    {
      title: 'Flexible Payments',
      description: 'Accept cash, cards, mobile money (M-Pesa), and split payments with ease.',
      icon: <CreditCard className="w-8 h-8 text-orange-600" />
    }
  ];

  return (
    <div className="bg-white pt-20 pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeIn} className="text-center max-w-3xl mx-auto mb-20">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
            Features built for scale
          </h1>
          <p className="text-xl text-gray-600">
            Everything you need to run your business smoothly, from the front counter to the back office.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {allFeatures.map((feature, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-50 rounded-3xl p-8 hover:bg-orange-50 transition-colors"
            >
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
