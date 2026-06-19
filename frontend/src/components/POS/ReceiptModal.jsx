import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ReceiptModal({ order, changeAmount, discounts = [], pointsDiscount = 0, customer = null, settings = {}, onClose }) {
  const [orderDetails, setOrderDetails] = useState(null);
  const [email, setEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleEmailReceipt = async () => {
    if (!email) return;
    setSendingEmail(true);
    try {
      await api.post(`/transactions/${order.id}/email`, { email });
      toast.success('Receipt emailed successfully!');
      setEmail('');
    } catch (err) {
      toast.error('Failed to email receipt');
    } finally {
      setSendingEmail(false);
    }
  };

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/transactions/${order.id}`);
        setOrderDetails(res.data);
      } catch (err) {
        setOrderDetails(order);
      }
    };
    fetchDetails();
  }, [order]);

  const printReceipt = async () => {
    try {
      if ('serial' in navigator) {
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 9600 });
        const writer = port.writable.getWriter();
        const encoder = new TextEncoder();
        
        // Basic ESC/POS commands
        const ESC = '\x1b';
        const GS = '\x1d';
        const LF = '\n';
        const initialize = ESC + '@';
        const center = ESC + 'a' + '\x01';
        const left = ESC + 'a' + '\x00';
        const boldOn = ESC + 'E' + '\x01';
        const boldOff = ESC + 'E' + '\x00';
        const cut = GS + 'V' + '\x41' + '\x03';

        let receiptText = initialize + center + boldOn + receiptTitle + LF + boldOff;
        receiptText += receiptSubtitle + LF + LF;
        receiptText += left + 'Order: ' + orderDetails.order_number + LF;
        receiptText += '--------------------------------' + LF; // 32 chars
        
        orderDetails.items.forEach(item => {
            receiptText += `${item.product?.name}`.substring(0, 32) + LF;
            receiptText += `${item.quantity} x ${item.unit_price} = ${item.total}` + LF;
        });
        
        receiptText += '--------------------------------' + LF;
        receiptText += boldOn + `TOTAL: ${currencySymbol} ${orderTotal}` + boldOff + LF;
        receiptText += LF + LF + center + receiptFooter + LF + LF + LF + LF + cut;

        await writer.write(encoder.encode(receiptText));
        writer.releaseLock();
        await port.close();
      } else {
        window.print();
      }
    } catch (err) {
      console.warn("Serial printing failed, falling back to window.print", err);
      window.print();
    }
  };

  if (!orderDetails) return <div className="p-6">Loading receipt...</div>;

  const toFixedSafe = (value, digits = 2) => {
    const num = parseFloat(value);
    return isNaN(num) ? '0.00' : num.toFixed(digits);
  };

  const receiptTitle = settings.store_name || 'SUPER POS';
  const receiptSubtitle = settings.store_address || 'P.O Box 20100 Nakuru, Kenyatta Avenue';
  const storePhone = settings.store_phone ? `Tel: ${settings.store_phone}` : '';
  const storeEmail = settings.store_email ? `Email: ${settings.store_email}` : '';
  const receiptFooter = settings.receipt_footer || 'Thank you for shopping!';
  const taxRate = parseFloat(settings.tax_rate) || 16;
  const showVat = settings.show_vat_on_receipt !== false;
  const showChange = settings.show_change_on_receipt !== false;
  const currencySymbol = settings.currency_symbol || 'Ksh';

  // Calculate subtotal from items (sum of item totals)
  const itemsSubtotal = orderDetails.items.reduce((sum, item) => sum + parseFloat(item.total), 0);
  const orderTotal = parseFloat(orderDetails.total_amount);
  let discountAmount = itemsSubtotal - orderTotal;
  if (discountAmount < 0) discountAmount = 0;

  // Use passed discounts if any, otherwise create a generic discount line
  let finalDiscounts = [];
  if (discounts.length > 0) {
    finalDiscounts = discounts;
  } else if (discountAmount > 0) {
    finalDiscounts = [{ name: 'Discount', amount: discountAmount }];
  }

  let finalPointsDiscount = pointsDiscount;
  if (!finalPointsDiscount && orderDetails.points_discount) {
    finalPointsDiscount = parseFloat(orderDetails.points_discount);
  } else if (!finalPointsDiscount && orderDetails.discounts_applied) {
    try {
      const parsed = typeof orderDetails.discounts_applied === 'string' ? JSON.parse(orderDetails.discounts_applied) : orderDetails.discounts_applied;
      finalPointsDiscount = parseFloat(parsed.points_discount) || 0;
    } catch (e) {
      finalPointsDiscount = 0;
    }
  }

  const subtotal = itemsSubtotal;
  const vat = orderTotal * (taxRate / 100);
  const mpesaPayment = orderDetails.payments?.find(p => p.method === 'mpesa');
  const mpesaCode = mpesaPayment?.reference || mpesaPayment?.checkout_request_id;
  const customerPhone = orderDetails.customer?.phone || (customer?.phone) || 'Walk-in';
  const customerPoints = orderDetails.customer?.points_balance || (customer?.points_balance) || 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-auto font-mono text-sm">
        <div className="sticky top-0 bg-white z-10 flex justify-end p-2 border-b">
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }} 
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            ✖
          </button>
        </div>
        <div className="px-4 pb-4" id="receipt-content">
          <div className="text-center border-b pb-3 mb-3">
            <h1 className="text-xl font-bold text-orange-500">{receiptTitle}</h1>
            <p className="text-xs text-gray-500">{receiptSubtitle}</p>
            {storePhone && <p className="text-xs text-gray-500">{storePhone}</p>}
            {storeEmail && <p className="text-xs text-gray-500">{storeEmail}</p>}
            <p className="text-xs font-mono mt-2">{orderDetails.order_number}</p>
            <p className="text-xs">{new Date(orderDetails.created_at).toLocaleString()}</p>
          </div>
          <div className="mb-3 text-xs">
            <p><strong>Customer:</strong> {customerPhone}</p>
            <p><strong>Loyalty points:</strong> {customerPoints} pts</p>
            {finalPointsDiscount > 0 && <p><strong>Points Redeemed:</strong> {finalPointsDiscount} pts</p>}
          </div>
          <table className="w-full text-xs mb-3">
            <thead className="border-b">
              <tr>
                <th className="text-left">Item</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Price</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orderDetails.items.map((item, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-1">{item.product?.name}</td>
                  <td className="text-right">{item.quantity}</td>
                  <td className="text-right">{currencySymbol} {toFixedSafe(item.unit_price)}</td>
                  <td className="text-right">{currencySymbol} {toFixedSafe(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {(finalDiscounts.length > 0 || finalPointsDiscount > 0) && (
            <div className="mb-3 border-t pt-2">
              <p className="text-xs font-semibold mb-1">Discounts & Promotions</p>
              {finalDiscounts.map((d, idx) => (
                <div key={idx} className="flex justify-between text-xs text-green-600">
                  <span>{d.name}</span>
                  <span>- {currencySymbol} {toFixedSafe(d.amount)}</span>
                </div>
              ))}
              {finalPointsDiscount > 0 && (
                <div className="flex justify-between text-xs text-blue-600">
                  <span>Points redeemed</span>
                  <span>- {currencySymbol} {toFixedSafe(finalPointsDiscount)}</span>
                </div>
              )}
            </div>
          )}

          <div className="border-t pt-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{currencySymbol} {toFixedSafe(subtotal)}</span>
            </div>
            {showVat && (
              <div className="flex justify-between">
                <span>VAT @ {taxRate}%</span>
                <span>{currencySymbol} {toFixedSafe(vat)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm pt-1">
              <span>Total due</span>
              <span>{currencySymbol} {toFixedSafe(orderTotal)}</span>
            </div>
            {orderDetails.payments.map((p, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <span>Paid via {p.method.toUpperCase()}</span>
                <span>{currencySymbol} {toFixedSafe(p.amount)}</span>
              </div>
            ))}
            {mpesaCode && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>M-Pesa code</span>
                <span>{mpesaCode}</span>
              </div>
            )}
            {showChange && changeAmount > 0 && (
              <div className="flex justify-between text-xs text-green-600">
                <span>Change returned</span>
                <span>{currencySymbol} {toFixedSafe(changeAmount)}</span>
              </div>
            )}
          </div>

          <div className="mt-3 text-xs text-center border-t pt-2">
            <p>Served by: {orderDetails.cashier?.name}</p>
          </div>

          <div className="text-center text-xs text-gray-500 mt-2">
            <p>{receiptFooter}</p>
            <p className="mt-1">Goods once sold can be refunded within 3 days.</p>
          </div>
        </div>
          <div className="p-3 border-t flex gap-3 bg-gray-50 flex-col sm:flex-row">
            <div className="flex flex-col sm:flex-row gap-2 flex-1 items-center">
              <input 
                type="email" 
                placeholder="customer@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 w-full sm:w-auto py-2 px-3 border rounded-xl text-sm"
              />
              <button 
                onClick={handleEmailReceipt} 
                disabled={sendingEmail || !email}
                className="w-full sm:w-auto px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 font-semibold disabled:opacity-50 text-sm whitespace-nowrap"
              >
                {sendingEmail ? 'Sending...' : 'Email Receipt'}
              </button>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={onClose} className="flex-1 sm:flex-none px-4 py-2 border rounded-xl bg-white hover:bg-gray-50">Close</button>
              <button onClick={printReceipt} className="flex-1 sm:flex-none px-6 bg-gradient-to-r from-orange-500 to-[#f09a56] text-white py-2 rounded-xl font-semibold shadow-lg hover:shadow-orange-500/20">Print</button>
            </div>
          </div>
      </div>
    </div>
  );
}
