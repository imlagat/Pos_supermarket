import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Store, Package, Users, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function OnboardingWizard() {
  const { user, loadUser } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [storeName, setStoreName] = useState(user?.tenant?.name || '');
  const [productData, setProductData] = useState({ name: '', price: '', stock: '' });

  useEffect(() => {
    if (user?.tenant?.has_completed_onboarding) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleUpdateStore = async (e) => {
    e.preventDefault();
    if (!storeName) return;
    setLoading(true);
    try {
      await api.post('/settings', { store_name: storeName });
      toast.success('Store name updated');
      setStep(2);
    } catch (err) {
      toast.error('Failed to update store name');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!productData.name || !productData.price) return;
    setLoading(true);
    try {
      await api.post('/products', {
        name: productData.name,
        price: productData.price,
        stock_quantity: productData.stock || 0,
        category: 'General',
        sku: 'SKU-' + Math.floor(Math.random() * 10000)
      });
      toast.success('First product added!');
      setStep(3);
    } catch (err) {
      toast.error('Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await api.post('/onboarding/complete');
      toast.success('Onboarding complete!');
      await loadUser(); // refresh user to get updated tenant status
      navigate('/dashboard');
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900">Welcome to POSlish!</h1>
          <p className="text-gray-500 mt-2">Let's get your store set up in 3 easy steps.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          
          {/* Progress Bar */}
          <div className="flex border-b border-gray-100 bg-gray-50/50">
            <div className={`flex-1 p-4 text-center text-sm font-bold ${step >= 1 ? 'text-orange-600 border-b-2 border-orange-500 bg-white' : 'text-gray-400'}`}>
              1. Store Details
            </div>
            <div className={`flex-1 p-4 text-center text-sm font-bold ${step >= 2 ? 'text-orange-600 border-b-2 border-orange-500 bg-white' : 'text-gray-400'}`}>
              2. Add Product
            </div>
            <div className={`flex-1 p-4 text-center text-sm font-bold ${step >= 3 ? 'text-orange-600 border-b-2 border-orange-500 bg-white' : 'text-gray-400'}`}>
              3. Ready
            </div>
          </div>

          <div className="p-8">
            {step === 1 && (
              <form onSubmit={handleUpdateStore} className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                    <Store size={32} />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-center text-gray-900">What's your store's name?</h2>
                <div>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full text-center text-xl font-bold px-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="e.g. My Supermarket"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !storeName}
                  className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Continue'} <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleAddProduct} className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <Package size={32} />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-center text-gray-900">Add your first product</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                    <input
                      type="text"
                      value={productData.name}
                      onChange={(e) => setProductData({...productData, name: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g. Coca-Cola 500ml"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price</label>
                      <input
                        type="number"
                        value={productData.price}
                        onChange={(e) => setProductData({...productData, price: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                      <input
                        type="number"
                        value={productData.stock}
                        onChange={(e) => setProductData({...productData, stock: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all"
                  >
                    Skip for now
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !productData.name}
                    className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Save Product'} <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <div className="space-y-6 text-center animate-in fade-in slide-in-from-right-4">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <CheckCircle size={40} />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">You're all set!</h2>
                <p className="text-gray-500">
                  Your store is ready. You can invite your cashiers, bulk upload products, and start selling.
                </p>
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-8 shadow-lg shadow-green-600/20"
                >
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Go to Dashboard'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
