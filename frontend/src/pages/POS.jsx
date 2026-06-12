import { useState, useEffect } from 'react';
import { useCartStore } from '../stores/cartStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import PaymentModal from '../components/POS/PaymentModal';
import ReceiptModal from '../components/POS/ReceiptModal';
import BarcodeScannerModal from '../components/POS/BarcodeScannerModal';
import { Search, Barcode, Scale, Trash2, Plus, Minus, ShoppingBag, Award, User, Camera, Smartphone, X } from 'lucide-react';

export default function POS() {
  const { items, total, addItem, removeItem, updateQuantity, clearCart, setCustomer, customerId } = useCartStore();
  const [barcode, setBarcode] = useState('');
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
  const [showScanner, setShowScanner] = useState(false);
  const [showRemoteScanner, setShowRemoteScanner] = useState(false);
  const [remoteSessionId, setRemoteSessionId] = useState('');
  const [remoteIpUrl, setRemoteIpUrl] = useState('');

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (err) {
      console.warn('Audio context blocked', err);
    }
  };

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
            items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity, price: i.price, is_open_box: i.is_open_box, returned_item_id: i.returned_item_id })),
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

  const [selectedProductForUnits, setSelectedProductForUnits] = useState(null);

  const handleAddProduct = (product) => {
    if (product.alternative_units && product.alternative_units.length > 0) {
      setSelectedProductForUnits(product);
      return;
    }
    
    // Fallback to base product if no alternative units
    confirmAddProduct(product, null, product.base_price, 'Base Unit');
  };

  const confirmAddProduct = (product, unitId = null, price = null, unitName = 'Pieces') => {
    const existing = items.find(i => i.product_id === product.id && i.unit_id === unitId && !i.is_open_box);
    const cartQty = existing ? existing.quantity : 0;
    
    let availableStock = 0;
    if (unitId) {
      availableStock = product.branch_stocks?.find(bs => bs.alternative_unit_id === unitId)?.quantity || 0;
    } else {
      availableStock = product.branch_stocks?.find(bs => bs.alternative_unit_id === null)?.quantity || product.stock_quantity || 0;
    }
    
    // We can also allow auto-unboxing to fulfill base piece orders if base piece stock is 0 but crate stock exists.
    // However, on the POS frontend, we'll just check if there's enough of the requested unit.
    // Let's rely on backend for actual auto-unboxing, but for frontend UI, if they select Base Unit, we can check getTotalBaseStock if we had it,
    // or just let them add it and backend will handle it.
    // Let's just bypass strict frontend stock checking for base units if crate exists.
    let totalBaseStock = availableStock;
    if (!unitId && product.branch_stocks) {
        totalBaseStock = product.branch_stocks.reduce((acc, bs) => {
            if (bs.alternative_unit_id === null) return acc + bs.quantity;
            const altUnit = product.alternative_units?.find(au => au.id === bs.alternative_unit_id);
            return acc + (bs.quantity * (altUnit ? altUnit.quantity_in_base_unit : 0));
        }, 0);
        availableStock = totalBaseStock;
    }

    if (availableStock <= 0) {
      toast.error(`${product.name} (${unitName}) is out of stock!`);
      return;
    }
    if (cartQty + 1 > availableStock) {
      toast.error(`Not enough stock available for ${product.name} (${unitName})`);
      return;
    }
    
    const productToCart = { ...product, name: unitId ? `${product.name} - ${unitName}` : product.name };
    addItem(productToCart, 1, price !== null ? price : product.base_price, unitId);
    playBeep();
    toast.success(`${product.name.toUpperCase()} (${unitName}) ADDED TO CART`);
    setSelectedProductForUnits(null);
  };

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const lookupProduct = async (searchBarcode = barcode) => {
    if (!searchBarcode) return;
    
    // First check local loaded products
    const exactMatch = products.find(p => p.barcode && p.barcode.toLowerCase() === searchBarcode.toLowerCase());
    if (exactMatch) {
        handleAddProduct(exactMatch);
        setBarcode('');
        return;
    }

    // Fallback to API
    try {
      const res = await api.get(`/products/lookup/${searchBarcode}`);
      let product = res.data;
      handleAddProduct(product);
      setBarcode('');
    } catch { 
      toast.error('Product not found'); 
      setBarcode('');
    }
  };

  const handleScanBarcode = async (scannedBarcode) => {
    try {
      const res = await api.get(`/products/lookup/${scannedBarcode}`);
      let product = res.data;
      handleAddProduct(product);
      setShowScanner(false);
    } catch {
      toast.error(`Product not found: ${scannedBarcode}`);
    }
  };

  const handleRemotePair = async () => {
    const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setRemoteSessionId(id);
    setShowRemoteScanner(true);
    
    let base = window.location.origin;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      try {
        const res = await api.get('/system/local-ip');
        if (res.data.ip) {
          const protocol = window.location.protocol; // will be https:
          base = `${protocol}//${res.data.ip}:${window.location.port || '5173'}`;
        }
      } catch (err) {
        console.warn('Failed to fetch local IP', err);
      }
    }
    setRemoteIpUrl(`${base}/remote-scanner/${id}`);
  };

  useEffect(() => {
    let interval;
    if (showRemoteScanner && remoteSessionId) {
      interval = setInterval(async () => {
        try {
          const res = await api.get(`/remote-scan/session/${remoteSessionId}`);
          if (res.data.scanned && res.data.barcode) {
            handleScanBarcode(res.data.barcode);
            playBeep();
          }
        } catch (err) {
          // ignore
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showRemoteScanner, remoteSessionId]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || p.category === selectedCategory;
    const matchesBarcode = barcode === '' || (p.barcode && p.barcode.toLowerCase().includes(barcode.toLowerCase()));
    return matchesSearch && matchesCategory && matchesBarcode;
  });

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
  const totalDiscounts = appliedDiscounts.reduce((sum, d) => sum + d.amount, 0);
  const finalTotalBeforePoints = subtotal - totalDiscounts;
  const finalTotal = Math.max(0, finalTotalBeforePoints - discountFromPoints);

  const handleCompleteSale = async (payments) => {
    let changeAmount = 0;
    if (payments.length === 1 && payments[0].method === 'cash' && payments[0].change) {
      changeAmount = payments[0].change;
      delete payments[0].change;
    }
    const payload = {
      items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity, price: i.price, is_open_box: i.is_open_box, returned_item_id: i.returned_item_id })),
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

  const handleUpdateQuantity = (idx, newQuantity) => {
    const item = items[idx];
    if (newQuantity > item.quantity) {
      if (item.is_open_box) {
         const obItem = openBoxItems.find(i => i.id === item.returned_item_id);
         if (!obItem || newQuantity > obItem.quantity) {
            toast.error('This product is out of stock');
            return;
         }
      } else {
         const p = products.find(p => p.id === item.product_id);
         const stock = p?.current_stock ?? p?.stock_quantity ?? Infinity;
         if (newQuantity > stock) {
            toast.error('This product is out of stock');
            return;
         }
      }
    }
    updateQuantity(idx, newQuantity);
  };

  const handleEditOpenBox = async (e, item) => {
    e.stopPropagation();
    const newPrice = window.prompt(`Enter new price for ${item.name}:`, item.price);
    if (newPrice !== null && !isNaN(newPrice) && parseFloat(newPrice) > 0) {
      try {
        await api.post(`/returned-items/${item.id}/open-box`, { open_box_price: newPrice });
        toast.success('Price updated');
        fetchProducts();
      } catch (err) { toast.error('Failed to update price'); }
    }
  };

  const handleDeleteOpenBox = async (e, item) => {
    e.stopPropagation();
    const reason = window.prompt(`Enter disposal reason for ${item.name}:`);
    if (reason !== null && reason.trim() !== '') {
      try {
        await api.post(`/returned-items/${item.id}/dispose`, { disposal_reason: reason });
        toast.success('Item removed');
        fetchProducts();
      } catch (err) { toast.error('Failed to remove item'); }
    } else if (reason !== null) {
      toast.error('Disposal reason is required');
    }
  };

  const subtotalDisplay = subtotal;
  const taxRate = systemSettings.tax_rate !== undefined ? systemSettings.tax_rate : 16;
  const vat = finalTotal * (taxRate / 100);

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-7 bg-white rounded-2xl shadow-xl p-6">
        <div className="mb-6">
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500" /></div>
            <div className="flex gap-2">
              <div className="relative"><Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Scan barcode" value={barcode} onChange={e => setBarcode(e.target.value)} onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  lookupProduct(e.target.value);
                }
              }} className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 w-48" /></div>
              <button onClick={() => setShowScanner(true)} className="flex items-center justify-center gap-1 bg-orange-100 text-orange-800 px-3 py-2 rounded-xl hover:bg-orange-200 transition whitespace-nowrap text-sm font-medium" title="Scan with Webcam">
                <Camera size={18} /> Webcam
              </button>
              <button onClick={handleRemotePair} className="flex items-center justify-center gap-1 bg-indigo-100 text-indigo-700 px-3 py-2 rounded-xl hover:bg-indigo-200 transition whitespace-nowrap text-sm font-medium" title="Pair Phone Scanner">
                <Smartphone size={18} /> Phone
              </button>
            </div>
          </div>
          {/* Open Box Items Section */}
          {openBoxItems.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-semibold text-orange-500 mb-2 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">Open Box Deals</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {openBoxItems.map(item => (
                  <div key={item.id} className="border border-blue-200 rounded-xl p-3 bg-blue-50 hover:shadow-md cursor-pointer relative" onClick={() => {
                    const existing = items.find(i => i.is_open_box && i.returned_item_id === item.id);
                    if (existing && existing.quantity >= item.quantity) {
                      toast.error('This product is out of stock');
                      return;
                    }
                    if (item.quantity <= 0) {
                      toast.error('This product is out of stock');
                      return;
                    }
                    addItem({id: item.product_id || item.id, base_price: item.price, name: item.name}, 1, item.price, null, true, item.id);
                    playBeep();
                    toast.success(`OPEN BOX (${item.name.replace(' (Open Box)', '').toUpperCase()}) ADDED TO CART`);
                  }}>
                    <div className="font-semibold text-gray-800 truncate pr-16">{item.name}</div>
                    <div className="text-lg font-bold text-blue-600">Ksh {item.price}</div>
                    <div className="text-xs text-gray-500">Original: Ksh {item.original_price}</div>
                    <div className="text-xs text-gray-500">Stock: {item.quantity}</div>
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button onClick={(e) => handleEditOpenBox(e, item)} className="bg-white p-1 rounded-full text-blue-500 shadow hover:bg-blue-100" title="Edit Price"><Plus size={14} /></button>
                      <button onClick={(e) => handleDeleteOpenBox(e, item)} className="bg-white p-1 rounded-full text-red-500 shadow hover:bg-red-100" title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {categories.length > 0 && <div className="flex gap-2 mb-4 overflow-x-auto pb-2"><button onClick={() => setSelectedCategory('')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${selectedCategory === '' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>All</button>{categories.map(cat => <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition whitespace-nowrap ${selectedCategory === cat ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{cat}</button>)}</div>}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 max-h-[calc(100vh-300px)] overflow-auto pb-2">
          {filteredProducts.map(product => (
            <div key={product.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer bg-white" onClick={() => handleAddProduct(product)}>
              <div className="font-semibold text-gray-800 truncate">{product.name}</div>
              <div className="text-lg font-bold text-orange-500 mt-1">Ksh {product.base_price}</div>
              <div className="text-xs text-gray-500 mt-2">Stock: {product.current_stock ?? product.stock_quantity}</div>
              <button className="mt-3 w-full bg-orange-50 text-orange-500 py-1.5 rounded-lg text-sm font-medium hover:bg-orange-100 transition flex items-center justify-center gap-1"><Plus size={14} /> Add</button>
            </div>
          ))}
        </div>
      </div>
      <div className="col-span-5 bg-white rounded-2xl shadow-xl flex flex-col h-[calc(100vh-120px)]">
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><ShoppingBag size={20} /> Cart</h2>
            <div className="flex gap-2 items-center">
              <div className="relative"><User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="tel" placeholder="Phone number" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="pl-10 pr-2 py-1 border rounded-full text-sm w-36" /><button onClick={searchCustomer} className="ml-1 text-xs bg-orange-500 text-white px-2 py-1 rounded-full">Find</button>{customerSearchResult && <button onClick={clearCustomer} className="ml-1 text-xs text-red-500">X</button>}</div>
            </div>
          </div>
          {customerId && customerPoints > 0 && (<div className="mt-3 p-2 bg-orange-50 rounded-lg flex justify-between items-center"><span className="text-sm">Points: {customerPoints}</span><div className="flex gap-2"><input type="number" placeholder="Redeem" value={redeemPoints} onChange={e => setRedeemPoints(parseInt(e.target.value) || 0)} className="w-20 p-1 border rounded text-sm" /><button onClick={applyRedeem} className="bg-orange-500 text-white px-2 py-1 rounded text-sm">Apply</button></div></div>)}
        </div>
        <div className="flex-1 overflow-auto p-4">
          {items.length === 0 ? <div className="text-center text-gray-400 py-12"><ShoppingBag size={48} className="mx-auto mb-3 opacity-50" /><p>Cart is empty</p><p className="text-sm">Scan or search products above</p></div> : <div className="space-y-3">{items.map((item, idx) => (<div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"><div className="flex-1"><p className="font-medium text-gray-800">{item.name}</p><p className="text-sm text-gray-500">Ksh {item.price} each</p></div><div className="flex items-center gap-2"><button onClick={() => handleUpdateQuantity(idx, item.quantity - 1)} className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"><Minus size={14} /></button><span className="w-8 text-center font-semibold">{item.quantity}</span><button onClick={() => handleUpdateQuantity(idx, item.quantity + 1)} className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"><Plus size={14} /></button><button onClick={() => removeItem(idx)} className="ml-2 text-orange-500 hover:text-orange-800"><Trash2 size={16} /></button></div><div className="ml-4 w-24 text-right font-semibold">Ksh {(item.price * item.quantity).toFixed(2)}</div></div>))}</div>}
        </div>
        <div className="border-t border-gray-100 p-6 bg-gray-50 rounded-b-2xl">
          <div className="flex justify-between text-sm text-gray-600 mb-2"><span>Subtotal</span><span>Ksh {subtotalDisplay.toFixed(2)}</span></div>
          {appliedDiscounts.map((d, idx) => (<div key={idx} className="flex justify-between text-sm text-green-600 mb-2"><span>{d.name}</span><span>- Ksh {d.amount.toFixed(2)}</span></div>))}
          {discountFromPoints > 0 && <div className="flex justify-between text-sm text-blue-600 mb-2"><span>Points redeemed</span><span>- Ksh {discountFromPoints.toFixed(2)}</span></div>}
          <div className="flex justify-between text-2xl font-bold text-gray-800 mb-4"><span>Total</span><span>Ksh {finalTotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm text-gray-600 mb-2"><span>VAT ({taxRate}%)</span><span>Ksh {vat.toFixed(2)}</span></div>
          <button onClick={() => setShowPayment(true)} disabled={items.length === 0} className={`w-full py-3 rounded-xl font-semibold transition-all ${items.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-orange-500 to-[#f09a56] hover:from-orange-500 hover:to-orange-500 text-white shadow-lg'}`}>Complete Sale</button>
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
      {showScanner && (
        <BarcodeScannerModal 
          onScan={handleScanBarcode} 
          onClose={() => setShowScanner(false)} 
        />
      )}
      {showRemoteScanner && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative">
            <button onClick={() => setShowRemoteScanner(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"><X size={20} /></button>
            <h2 className="text-xl font-bold text-center mb-4">Pair Phone Scanner</h2>
            <p className="text-sm text-gray-600 text-center mb-6">Scan this QR code with your mobile phone camera to start scanning barcodes directly into your POS.</p>
            <div className="bg-gray-100 p-4 rounded-xl flex justify-center mb-6 min-h-[232px] items-center">
              {remoteIpUrl ? (
                 <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(remoteIpUrl)}`} alt="QR Code" className="w-[200px] h-[200px]" />
              ) : (
                 <div className=" text-gray-400">Generating QR Code...</div>
              )}
            </div>
            <div className="text-xs text-orange-500 bg-orange-50 p-3 rounded-lg border border-orange-200 mb-4">
              <strong>Tip:</strong> We automatically detected your local network IP! Just scan this QR code.
            </div>
            <p className="text-center text-sm text-gray-500  mb-6">Waiting for scans...</p>
            <button 
              type="button" 
              onClick={() => setShowRemoteScanner(false)} 
              className="w-full bg-red-50 text-red-600 font-bold py-3 rounded-xl border border-red-200 hover:bg-red-100 transition shadow-sm active:scale-95"
            >
              Cancel Scanning
            </button>
          </div>
        </div>
      )}
      
      {selectedProductForUnits && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Select Unit</h2>
              <button onClick={() => setSelectedProductForUnits(null)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full"><X size={20} /></button>
            </div>
            <p className="text-gray-600 mb-4 font-medium">{selectedProductForUnits.name}</p>
            <div className="space-y-3">
              <button 
                onClick={() => confirmAddProduct(selectedProductForUnits, null, selectedProductForUnits.base_price, 'Pieces')}
                className="w-full text-left p-4 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 transition flex justify-between items-center"
              >
                <div>
                  <div className="font-semibold text-orange-900">Base Unit (Pieces)</div>
                  <div className="text-sm text-orange-700">Ksh {selectedProductForUnits.base_price}</div>
                </div>
                <Plus className="text-orange-600" />
              </button>
              
              {selectedProductForUnits.alternative_units.map(unit => (
                <button 
                  key={unit.id}
                  onClick={() => confirmAddProduct(selectedProductForUnits, unit.id, unit.price, unit.unit_name)}
                  className="w-full text-left p-4 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition flex justify-between items-center"
                >
                  <div>
                    <div className="font-semibold text-blue-900">{unit.unit_name} ({unit.quantity_in_base_unit} pieces)</div>
                    <div className="text-sm text-blue-700">Ksh {unit.price}</div>
                  </div>
                  <Plus className="text-blue-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
