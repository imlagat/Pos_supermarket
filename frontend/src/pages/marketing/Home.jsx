import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingCart, Zap, BarChart3, Wifi, Smartphone, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const features = [
    {
      title: 'Lightning Fast POS',
      description: 'Process sales in seconds with our optimized interface designed for speed.',
      icon: <Zap className="w-6 h-6 text-orange-600" />
    },
    {
      title: 'Offline Ready',
      description: 'Keep selling even when your internet drops. Data syncs automatically when back online.',
      icon: <Wifi className="w-6 h-6 text-orange-600" />
    },
    {
      title: 'Smart Analytics',
      description: 'Make data-driven decisions with real-time insights into your sales and inventory.',
      icon: <BarChart3 className="w-6 h-6 text-orange-600" />
    },
    {
      title: 'Mobile Scanner',
      description: 'Use any smartphone as a barcode scanner. No expensive hardware required.',
      icon: <Smartphone className="w-6 h-6 text-orange-600" />
    }
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 lg:pt-32 lg:pb-40">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-white -z-10" />
        <div className="absolute inset-y-0 right-1/2 -z-10 w-[200%] translate-x-1/2 bg-white/50 backdrop-blur-3xl sm:w-[150%] xl:w-[120%]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeIn}>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse" />
              Next-Gen Point of Sale
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-8">
              The smart POS for <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400">
                modern retail
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto mb-10">
              Powerful inventory management, real-time analytics, and seamless checkout—all from your browser. Trusted by growing businesses.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/pricing" 
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-orange-500/30 hover:-translate-y-1"
              >
                Start 7 Days Trial
              </Link>
              <Link 
                to="/features" 
                className="bg-white text-gray-900 border border-gray-200 hover:border-orange-200 hover:bg-orange-50 px-8 py-4 rounded-full font-bold text-lg transition-all shadow-sm"
              >
                View Features
              </Link>
            </div>
            <p className="mt-6 text-sm text-gray-500">No credit card required • 7 days trial</p>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything you need to run your store</h2>
            <p className="text-xl text-gray-600">Built from the ground up for speed, reliability, and ease of use.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats/Social Proof Section */}
      <section className="py-24 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 overflow-hidden relative">
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3">
              <div className="w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
            </div>
            
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-gray-700">
              <div className="py-6">
                <div className="text-4xl font-extrabold text-white mb-2">99.9%</div>
                <div className="text-orange-400 font-medium">Uptime Guarantee</div>
              </div>
              <div className="py-6">
                <div className="text-4xl font-extrabold text-white mb-2">2M+</div>
                <div className="text-orange-400 font-medium">Transactions Processed</div>
              </div>
              <div className="py-6">
                <div className="text-4xl font-extrabold text-white mb-2">24/7</div>
                <div className="text-orange-400 font-medium">Customer Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-orange-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Ready to transform your business?</h2>
          <p className="text-xl text-gray-600 mb-10">Join thousands of retailers who are growing their business with POSsuper.</p>
          <Link 
            to="/pricing#tiers" 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-8 py-4 rounded-full font-bold text-lg transition shadow-lg hover:shadow-orange-500/30"
          >
            Get Started Now
          </Link>
        </div>
      </section>
    </div>
  );
}
