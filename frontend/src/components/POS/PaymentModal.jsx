import { useState } from 'react';
import toast from 'react-hot-toast';
import { CreditCard, DollarSign, Smartphone, Plus, X } from 'lucide-react';
import api from '../../services/api';

export default function PaymentModal({ total, onPay, onClose }) {
  const [cashAmount, setCashAmount] = useState('');
  const [remaining, setRemaining] = useState(total);
  const [split, setSplit] = useState(false);
  const [payments, setPayments] = useState([{ method: 'cash', amount: 0 }]);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const phoneRegex = /^(07|01|2547)\d{8}$/;

  const handleCashChange = (value) => {
    const cash = parseFloat(value) || 0;
    setCashAmount(value);
    const newRemaining = total - cash;
    setRemaining(newRemaining > 0 ? newRemaining : 0);
    setPayments([{ method: 'cash', amount: cash }]);
  };

  const addSplitPayment = () => {
    const existingMethods = payments.map(p => p.method);
    if (!existingMethods.includes('mpesa')) {
      setPayments([...payments, { method: 'mpesa', amount: remaining, phone: '' }]);
    } else if (!existingMethods.includes('card')) {
      setPayments([...payments, { method: 'card', amount: remaining }]);
    } else {
      toast.error('Only cash, M-Pesa, and Card allowed');
    }
  };

  const updateSplitPayment = (idx, field, value) => {
    const newPayments = [...payments];
    newPayments[idx][field] = value;
    setPayments(newPayments);
    const totalPaid = newPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    setRemaining(total - totalPaid > 0 ? total - totalPaid : 0);
  };

  const removeSplitPayment = (idx) => {
    if (payments.length <= 1) return;
    const newPayments = payments.filter((_, i) => i !== idx);
    setPayments(newPayments);
    const totalPaid = newPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    setRemaining(total - totalPaid > 0 ? total - totalPaid : 0);
  };

  // ── Polling: onPay is ONLY called from here, after PIN confirmed ──────────
 const pollForConfirmation = (checkoutId, paymentPayload) => {
  let attempts = 0;
  const maxAttempts = 20;

  const interval = setInterval(async () => {
    attempts++;
    try {
      const res = await api.get(`/mpesa/status/${checkoutId}`);
      const { status, mpesa_code } = res.data;

      if (status === 'completed') {
        clearInterval(interval);
        toast.success(`Payment confirmed! Code: ${mpesa_code}`);

        // If this came from a split payment, pass the full payments array
        // with the M-Pesa slice updated to include the confirmed reference
        if (paymentPayload.allPayments) {
          const updatedPayments = paymentPayload.allPayments.map(p =>
            p.method === 'mpesa'
              ? { ...p, reference: mpesa_code, status: 'completed' }
              : p
          );
          onPay(updatedPayments);
        } else {
          onPay([{ ...paymentPayload, reference: mpesa_code, status: 'completed' }]);
        }

        setIsProcessing(false);
        setStatusMessage('');
      } else if (status === 'failed') {
        clearInterval(interval);
        toast.error('M-Pesa payment failed or was cancelled');
        setIsProcessing(false);
        setStatusMessage('');
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        toast.error('Payment timed out — please try again');
        setIsProcessing(false);
        setStatusMessage('');
      }
    } catch {
      clearInterval(interval);
      toast.error('Could not verify payment status');
      setIsProcessing(false);
      setStatusMessage('');
    }
  }, 3000);
};

  // ── Main handler ──────────────────────────────────────────────────────────
  const processPayment = async () => {
    setIsProcessing(true);

    // ── SPLIT PAYMENT ────────────────────────────────────────────────────────
if (split) {
  const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  if (Math.abs(totalPaid - total) > 0.01) {
    toast.error(`Please pay remaining Ksh ${remaining.toFixed(2)}`);
    setIsProcessing(false);
    return;
  }

  const mpesaPayment = payments.find(p => p.method === 'mpesa');

  if (mpesaPayment && mpesaPayment.amount > 0) {
    if (!mpesaPayment.phone) {
      toast.error('Phone number required for M-Pesa');
      setIsProcessing(false);
      return;
    }
    if (!phoneRegex.test(mpesaPayment.phone)) {
      toast.error('Invalid phone number format (e.g., 0712345678)');
      setIsProcessing(false);
      return;
    }

    // Step 1: Send STK push
    let checkoutId = null;
    try {
      const res = await api.post('/mpesa/stkpush', {
        amount: mpesaPayment.amount,
        phone: mpesaPayment.phone,
        order_id: `ORD-${Date.now()}`,
      });
      checkoutId = res.data.checkout_id;
      if (!checkoutId) {
        toast.error('M-Pesa initiation failed');
        setIsProcessing(false);
        return;
      }
      mpesaPayment.checkout_request_id = checkoutId;
      setStatusMessage('Waiting for M-Pesa PIN confirmation...');
      toast.success('M-Pesa STK push sent — enter PIN on your phone');
    } catch (err) {
      toast.error(err.response?.data?.error || 'M-Pesa request failed');
      setIsProcessing(false);
      return;
    }

    // Step 2: Poll first — onPay only fires after PIN confirmed
    // ❌ onPay(payments) is NOT called here
    pollForConfirmation(checkoutId, {
      method: 'mpesa',
      amount: mpesaPayment.amount,
      checkout_request_id: checkoutId,
      // carry the full payments array so the parent gets all payment slices
      allPayments: payments,
    });
    return; // spinner stays active
  }

  // No M-Pesa in split (cash + card only) — safe to complete immediately
  onPay(payments);
  setIsProcessing(false);
  return;
}

    // ── SINGLE: CASH ─────────────────────────────────────────────────────────
    const method = payments[0].method;

    if (method === 'cash') {
      const cash = parseFloat(cashAmount) || 0;
      if (cash < total) {
        toast.error(`Please pay at least Ksh ${total.toFixed(2)}`);
        setIsProcessing(false);
        return;
      }
      onPay([{ method: 'cash', amount: total, change: cash - total }]);
      setIsProcessing(false);
      return;
    }

    // ── SINGLE: CARD ─────────────────────────────────────────────────────────
    if (method === 'card') {
      onPay([{ method: 'card', amount: total }]);
      setIsProcessing(false);
      return;
    }

    // ── SINGLE: M-PESA ───────────────────────────────────────────────────────
    if (method === 'mpesa') {
      if (!mpesaPhone) {
        toast.error('Phone number required');
        setIsProcessing(false);
        return;
      }
      if (!phoneRegex.test(mpesaPhone)) {
        toast.error('Invalid phone number format (e.g., 0712345678)');
        setIsProcessing(false);
        return;
      }

      // Step 1: Send STK push — do NOT call onPay yet
      let checkoutId = null;
      try {
        const res = await api.post('/mpesa/stkpush', {
          amount: total,
          phone: mpesaPhone,
          order_id: `ORD-${Date.now()}`,
        });
        checkoutId = res.data.checkout_id;
        setStatusMessage('Waiting for PIN confirmation...');
        toast.success('STK push sent — enter your M-Pesa PIN');
      } catch (err) {
        const msg = err.response?.data?.error
          || err.response?.data?.details?.errorMessage
          || 'M-Pesa request failed';
        toast.error(msg);
        setIsProcessing(false);
        return;
      }

      // Step 2: Poll first — onPay fires inside pollForConfirmation only on success
      // ❌ onPay is NOT called here
      pollForConfirmation(checkoutId, {
        method: 'mpesa',
        amount: total,
        checkout_request_id: checkoutId,
      });
      return; // spinner stays active while customer enters PIN
    }
  };

  const changeAmount = !split ? (parseFloat(cashAmount) || 0) - total : 0;
  const showChange = !split && changeAmount > 0;
  const selectedMethod = !split ? payments[0]?.method : null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold">Payment</h3>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">

          {/* Total */}
          <div className="mb-6 text-center">
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-3xl font-bold">Ksh {total.toFixed(2)}</p>
          </div>

          {/* Polling status banner */}
          {statusMessage && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 text-center animate-pulse">
              ⏳ {statusMessage}
            </div>
          )}

          {/* ── Single payment ── */}
          {!split ? (
            <>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <div className="flex gap-2">
                  {['cash', 'mpesa', 'card'].map(method => (
                    <button
                      key={method}
                      type="button"
                      disabled={isProcessing}
                      onClick={() => setPayments([{ method, amount: 0 }])}
                      className={`flex-1 py-2 rounded-lg border capitalize disabled:opacity-40 ${
                        payments[0]?.method === method
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-white text-gray-700 border-gray-300'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {selectedMethod === 'cash' && (
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Cash Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter cash amount"
                    value={cashAmount}
                    onChange={(e) => handleCashChange(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              {selectedMethod === 'mpesa' && (
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">M-Pesa Phone Number</label>
                  <input
                    type="tel"
                    placeholder="0712345678"
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: 0712345678 or 254712345678</p>
                </div>
              )}

              {showChange && (
                <div className="mt-3 p-3 bg-green-50 rounded-xl flex justify-between">
                  <span>Change to return</span>
                  <span className="font-bold text-green-700">Ksh {changeAmount.toFixed(2)}</span>
                </div>
              )}

              {!showChange && remaining > 0 && selectedMethod === 'cash' && (
                <div className="mt-3 p-3 bg-amber-50 rounded-xl flex justify-between">
                  <span>Remaining Balance</span>
                  <span className="font-bold">Ksh {remaining.toFixed(2)}</span>
                </div>
              )}

              <button
                onClick={() => setSplit(true)}
                disabled={isProcessing}
                className="mt-3 text-amber-600 text-sm flex items-center gap-1 disabled:opacity-30"
              >
                <Plus size={14} /> Split payment (add M-Pesa/Card)
              </button>
            </>
          ) : (
            /* ── Split payment ── */
            <div className="space-y-3">
              {payments.map((p, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {p.method === 'cash'
                        ? <DollarSign size={18} />
                        : p.method === 'card'
                        ? <CreditCard size={18} />
                        : <Smartphone size={18} />}
                    </div>
                    <select
                      value={p.method}
                      onChange={e => updateSplitPayment(idx, 'method', e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="mpesa">M-Pesa</option>
                    </select>
                  </div>
                  <input
                    type="number"
                    placeholder="Amount"
                    value={p.amount}
                    onChange={e => updateSplitPayment(idx, 'amount', parseFloat(e.target.value))}
                    className="w-28 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  {p.method === 'mpesa' && (
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={p.phone || ''}
                      onChange={e => updateSplitPayment(idx, 'phone', e.target.value)}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  )}
                  {payments.length > 1 && (
                    <button onClick={() => removeSplitPayment(idx)} className="text-amber-500">
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addSplitPayment}
                className="text-amber-600 text-sm flex items-center gap-1 mt-2"
              >
                <Plus size={14} /> Add M-Pesa or Card
              </button>
              <div className="mt-3 p-3 bg-amber-50 rounded-xl flex justify-between">
                <span>Remaining</span>
                <span className={`font-bold ${remaining > 0 ? 'text-red-600' : 'text-amber-600'}`}>
                  Ksh {remaining.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-3 border rounded-xl disabled:opacity-30"
            >
              Cancel
            </button>
            <button
              onClick={processPayment}
              disabled={isProcessing}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-semibold disabled:opacity-70"
            >
              {isProcessing
                ? (statusMessage ? 'Waiting for PIN...' : 'Processing...')
                : 'Confirm'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}