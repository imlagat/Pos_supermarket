import { useState, useEffect } from 'react';
import { useCartStore } from '../stores/cartStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import PaymentModal from '../components/POS/PaymentModal';
import ReceiptModal from '../components/POS/ReceiptModal';
import { Search, Barcode, Scale, Trash2, Plus, Minus, ShoppingBag, Award, User } from 'lucide-react';

export default function POS() {
  const { items, total, addItem, removeItem, updateQuantity, clearCart, setCustomer, customerId } = useCartStore();
  const [barcode, setBarcode] = useState('');
  const [weight, setWeight] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [lastChange, setLastChange] = useState(0);
  const [products, setProducts] = useState([]);
  const [openBoxItems, setOpenBoxItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerSearchResult, setCustomerSearchResult] = useState(null);
  const [customerPoints, setCustomerPoints] = useState(0);
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [discountFromPoints, setDiscountFromPoints] = useState(0);
  const [appliedDiscounts, setAppliedDiscounts] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [systemSettings, setSystemSettings] = useState({});

  const fetchProducts = () => {
    api.get('/products').then(res => setProducts(res.data)).catch(err => console.error(err));
    api.get('/open-box-items').then(res => setOpenBoxItems(res.data)).catch(err => console.error(err));
  };

  useEffect(() => { 
    fetchProducts();
    api.get('/settings').then(res => setSystemSettings(res.data)).catch(() => {});
  }, []);

  // Recalculate cart with promotions whenever items or customer changes
  useEffect(() => {
    if (items.length > 0) {
      const calculate = async () => {
        try {
          const payload = {
            items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity, price: i.price })),
            customer_id: customerId
          };
          const res = await api.post('/cart/calculate', payload);
          console.log('Cart calculation response:', res.data);
          setSubtotal(res.data.subtotal);
          setAppliedDiscounts(res.data.discounts || []);
          // Optionally update total in store if needed; cartStore already has total
        } catch (err) {
          console.error(err);
        }
      };
      calculate();
    } else {
      setSubtotal(0);
      setAppliedDiscounts([]);
    }
  }, [items, customerId]);

  useEffect(() => {
    if (customerId) {
      api.get(`/customers/${customerId}`).then(res => setCustomerPoints(res.data.points_balance)).catch(() => {});
    } else {
      setCustomerPoints(0); setRedeemPoints(0); setDiscountFromPoints(0);
    }
  }, [customerId]);

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const lookupProduct = async () => {
    if (!barcode) return;
    try {
      const res = await api.get(`/products/lookup/${barcode}`);
      let product = res.data;
      let finalPrice = product.base_price;
      if (product.selling_by_weight && weight > 0) finalPrice = (weight / 1000) * product.base_price;
      addItem(product, 1, finalPrice);
      setBarcode(''); setWeight(0);
      toast.success(`${product.name} added`);
    } catch { toast.error('Product not found'); }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) && (selectedCategory === '' || p.category === selectedCategory));

  const searchCustomer = async () => {
    if (!customerPhone) { setCustomerSearchResult(null); setCustomer(null); return; }
    try {
      const res = await api.get('/customers');
      const found = res.data.find(c => c.phone === customerPhone);
      if (found) { setCustomerSearchResult(found); setCustomer(found.id); toast.success(`Customer found: ${found.name}`); }
      else { setCustomerSearchResult(null); setCustomer(null); toast.error('Customer not found'); }
    } catch (err) { toast.error('Search failed'); }
  };
  const clearCustomer = () => {
    setCustomerPhone(''); setCustomerSearchResult(null); setCustomer(null); setCustomerPoints(0); setRedeemPoints(0); setDiscountFromPoints(0);
  };
  const applyRedeem = () => {
    if (redeemPoints > customerPoints) { toast.error('Not enough points'); return; }
    if (redeemPoints > finalTotalBeforePoints) { toast.error('Discount exceeds total'); return; }
    setDiscountFromPoints(redeemPoints);
    toast.success(`${redeemPoints} points redeemed, Ksh ${redeemPoints} off`);
  };
  const finalTotalBeforePoints = total;
  const finalTotal = Math.max(0, finalTotalBeforePoints - discountFromPoints);

  const handleCompleteSale = async (payments) => {
    let changeAmount = 0;
    if (payments.length === 1 && payments[0].method === 'cash' && payments[0].change) {
      changeAmount = payments[0].change;
      delete payments[0].change;
    }
    const payload = {
      items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity, price: i.price })),
      payments: payments.map(p => ({ method: p.method, amount: p.amount })),
      customer_id: customerId,
      total: finalTotal,
      discounts: appliedDiscounts,
      points_discount: discountFromPoints
    };
    console.log('Order payload:', payload);
    try {
      const response = await api.post('/orders', payload);
      setLastOrder(response.data.order);
      setLastChange(changeAmount);
      toast.success('Sale completed!');
      clearCart();
      setShowPayment(false);
      setShowReceipt(true);
      setDiscountFromPoints(0);
      setRedeemPoints(0);
      clearCustomer();
      fetchProducts(); // refresh product and open box stock
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to complete sale');
    }
  };

  const subtotalDisplay = subtotal;
  const vat = finalTotal * 0.16;

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-7 bg-white rounded-2xl shadow-xl p-6">
        <div className="mb-6">
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500" /></div>
            <div className="relative"><Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Scan barcode" value={barcode} onChange={e => setBarcode(e.target.value)} onKeyDown={e => e.key === 'Enter' && lookupProduct()} className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 w-48" /></div>
            <div className="relative"><Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="number" step="0.001" placeholder="Weight (kg)" value={weight} onChange={e => setWeight(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 w-32" /></div>
          </div>
          {/* Open Box Items Section */}
          {openBoxItems.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-semibold text-amber-600 mb-2 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">Open Box Deals</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {openBoxItems.map(item => (
                  <div key={item.id} className="border border-blue-200 rounded-xl p-3 bg-blue-50 hover:shadow-md cursor-pointer" onClick={() => addItem({...item, id: item.id, base_price: item.price, name: item.name}, 1, item.price)}>
                    <div className="font-semibold text-gray-800 truncate">{item.name}</div>
                    <div className="text-lg font-bold text-blue-600">Ksh {item.price}</div>
                    <div className="text-xs text-gray-500">Original: Ksh {item.original_price}</div>
                    <div className="text-xs text-gray-500">Stock: {item.quantity}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {categories.length > 0 && <div className="flex gap-2 mb-4 overflow-x-auto pb-2"><button onClick={() => setSelectedCategory('')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${selectedCategory === '' ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>All</button>{categories.map(cat => <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition whitespace-nowrap ${selectedCategory === cat ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{cat}</button>)}</div>}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 max-h-[calc(100vh-300px)] overflow-auto pb-2">
          {filteredProducts.map(product => (
            <div key={product.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer bg-white" onClick={() => addItem(product)}>
              <div className="font-semibold text-gray-800 truncate">{product.name}</div>
              <div className="text-lg font-bold text-amber-600 mt-1">Ksh {product.base_price}</div>
              <div className="text-xs text-gray-500 mt-2">Stock: {product.current_stock ?? product.stock_quantity}</div>
              <button className="mt-3 w-full bg-amber-50 text-amber-600 py-1.5 rounded-lg text-sm font-medium hover:bg-amber-100 transition flex items-center justify-center gap-1"><Plus size={14} /> Add</button>
            </div>
          ))}
        </div>
      </div>
      <div className="col-span-5 bg-white rounded-2xl shadow-xl flex flex-col h-[calc(100vh-120px)]">
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><ShoppingBag size={20} /> Cart</h2>
            <div className="flex gap-2 items-center">
              <div className="relative"><User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="tel" placeholder="Phone number" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="pl-10 pr-2 py-1 border rounded-full text-sm w-36" /><button onClick={searchCustomer} className="ml-1 text-xs bg-amber-500 text-white px-2 py-1 rounded-full">Find</button>{customerSearchResult && <button onClick={clearCustomer} className="ml-1 text-xs text-red-500">X</button>}</div>
            </div>
          </div>
          {customerId && customerPoints > 0 && (<div className="mt-3 p-2 bg-amber-50 rounded-lg flex justify-between items-center"><span className="text-sm">Points: {customerPoints}</span><div className="flex gap-2"><input type="number" placeholder="Redeem" value={redeemPoints} onChange={e => setRedeemPoints(parseInt(e.target.value) || 0)} className="w-20 p-1 border rounded text-sm" /><button onClick={applyRedeem} className="bg-amber-500 text-white px-2 py-1 rounded text-sm">Apply</button></div></div>)}
        </div>
        <div className="flex-1 overflow-auto p-4">
          {items.length === 0 ? <div className="text-center text-gray-400 py-12"><ShoppingBag size={48} className="mx-auto mb-3 opacity-50" /><p>Cart is empty</p><p className="text-sm">Scan or search products above</p></div> : <div className="space-y-3">{items.map((item, idx) => (<div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"><div className="flex-1"><p className="font-medium text-gray-800">{item.name}</p><p className="text-sm text-gray-500">Ksh {item.price} each</p></div><div className="flex items-center gap-2"><button onClick={() => updateQuantity(idx, item.quantity - 1)} className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"><Minus size={14} /></button><span className="w-8 text-center font-semibold">{item.quantity}</span><button onClick={() => updateQuantity(idx, item.quantity + 1)} className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"><Plus size={14} /></button><button onClick={() => removeItem(idx)} className="ml-2 text-amber-500 hover:text-amber-700"><Trash2 size={16} /></button></div><div className="ml-4 w-24 text-right font-semibold">Ksh {(item.price * item.quantity).toFixed(2)}</div></div>))}</div>}
        </div>
        <div className="border-t border-gray-100 p-6 bg-gray-50 rounded-b-2xl">
          <div className="flex justify-between text-sm text-gray-600 mb-2"><span>Subtotal</span><span>Ksh {subtotalDisplay.toFixed(2)}</span></div>
          {appliedDiscounts.map((d, idx) => (<div key={idx} className="flex justify-between text-sm text-green-600 mb-2"><span>{d.name}</span><span>- Ksh {d.amount.toFixed(2)}</span></div>))}
          {discountFromPoints > 0 && <div className="flex justify-between text-sm text-blue-600 mb-2"><span>Points redeemed</span><span>- Ksh {discountFromPoints.toFixed(2)}</span></div>}
          <div className="flex justify-between text-2xl font-bold text-gray-800 mb-4"><span>Total</span><span>Ksh {finalTotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm text-gray-600 mb-2"><span>VAT (16%)</span><span>Ksh {vat.toFixed(2)}</span></div>
          <button onClick={() => setShowPayment(true)} disabled={items.length === 0} className={`w-full py-3 rounded-xl font-semibold transition-all ${items.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg'}`}>Complete Sale</button>
        </div>
      </div>
      {showPayment && <PaymentModal total={finalTotal} onPay={handleCompleteSale} onClose={() => setShowPayment(false)} />}
      {showReceipt && lastOrder && (
        <ReceiptModal 
          order={lastOrder} 
          changeAmount={lastChange} 
          discounts={appliedDiscounts} 
          pointsDiscount={discountFromPoints} 
          customer={customerSearchResult} 
          settings={systemSettings}
          onClose={() => setShowReceipt(false)} 
        />
      )}
    </div>
  );
}
