import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Phone, MessageCircle, MapPin, Clock, Loader2 } from 'lucide-react';
import api from '../../services/api';

export default function ContactSalesModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessType: '',
    locations: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const response = await api.post('/contact-sales', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        business_type: formData.businessType,
        locations: formData.locations,
        subject: formData.subject,
        message: formData.message,
      });
      
      setSuccessMessage(response.data.message || 'Your message has been sent to the admin. We will contact you shortly!');
      setFormData({
        name: '',
        email: '',
        phone: '',
        businessType: '',
        locations: '',
        subject: '',
        message: ''
      });
      
      // Auto close after 3 seconds
      setTimeout(() => {
        onClose();
        setSuccessMessage('');
      }, 3000);
      
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-gray-50 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          <div className="flex justify-between items-center p-6 bg-white border-b border-gray-100">
            <div className="text-center w-full">
              <h2 className="text-3xl font-extrabold text-gray-900">Let's talk</h2>
              <p className="text-gray-500 mt-2">
                Have a question, need a demo, or want a custom plan? We're here to help.
              </p>
            </div>
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Form */}
              <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Send us a message</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your name"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none bg-gray-50 hover:bg-gray-100 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@business.com"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none bg-gray-50 hover:bg-gray-100 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+254 7XX XXX XXX"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none bg-gray-50 hover:bg-gray-100 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type of Business
                      </label>
                      <select
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none bg-gray-50 hover:bg-gray-100 focus:bg-white"
                      >
                        <option value="">Select type...</option>
                        <option value="supermarket">Supermarket</option>
                        <option value="pharmacy">Pharmacy</option>
                        <option value="hardware">Hardware</option>
                        <option value="electronics">Electronics</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Locations
                      </label>
                      <select
                        name="locations"
                        value={formData.locations}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none bg-gray-50 hover:bg-gray-100 focus:bg-white"
                      >
                        <option value="">Select...</option>
                        <option value="1">1 Location</option>
                        <option value="2-5">2-5 Locations</option>
                        <option value="6-10">6-10 Locations</option>
                        <option value="10+">10+ Locations</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="How can we help?"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none bg-gray-50 hover:bg-gray-100 focus:bg-white"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      rows="4"
                      placeholder="Tell us about your business and what you need..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none bg-gray-50 hover:bg-gray-100 focus:bg-white resize-none"
                    ></textarea>
                  </div>

                  {errorMessage && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
                      {errorMessage}
                    </div>
                  )}

                  {successMessage && (
                    <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm border border-green-100">
                      {successMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:hover:-translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send message &rarr;
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Right Column: Contact Info */}
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <Mail className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</p>
                    <p className="text-gray-900 font-medium">superposlish@gmail.com</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <Phone className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</p>
                    <p className="text-gray-900 font-medium">0725130227</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <MessageCircle className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">WhatsApp</p>
                    <p className="text-gray-900 font-medium">0725130227</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <MapPin className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Office</p>
                    <p className="text-gray-900 font-medium">Nakuru, Kenya</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <Clock className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Hours</p>
                    <p className="text-gray-900 font-medium">Mon-Fri, 8am-6pm EAT</p>
                  </div>
                </div>

                <div className="bg-gray-100/50 p-6 rounded-2xl border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-2">Need a demo?</h4>
                  <p className="text-gray-600 text-sm">
                    We offer free 15-minute demos for businesses with 3+ locations. Just mention it in your message!
                  </p>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
