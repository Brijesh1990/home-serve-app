import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, CreditCard, Smartphone, Building, CheckCircle2, X } from 'lucide-react';
import { paymentService } from '../../services/paymentService';
import { formatCurrencyExact } from '../../utils/formatters';

export const PaymentModal = ({ isOpen, onClose, booking, amount, onSuccess }) => {
  const [step, setStep] = useState('method'); // method | processing | verified
  const [method, setMethod] = useState('upi');
  const [upiId, setUpiId] = useState('aarav.sharma@okicici');
  const [orderInfo, setOrderInfo] = useState(null);

  const payable = Number(amount || booking?.total_amount || 565.22);

  useEffect(() => {
    if (isOpen) {
      setStep('method');
      paymentService.createRazorpayOrder({ amount: payable, booking_id: booking?.id }).then(setOrderInfo);
    }
  }, [isOpen, payable, booking]);

  if (!isOpen) return null;

  const handlePayNow = async () => {
    setStep('processing');
    const orderId = orderInfo?.order_id || `order_HS_${Date.now()}`;
    const paymentId = `pay_HS_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    const signature = `hmac_sha256_${Math.random().toString(36).substring(2, 15)}`;

    setTimeout(async () => {
      const verification = await paymentService.verifyRazorpayPayment({
        booking_id: booking?.id,
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        payment_method: method,
      });
      setStep('verified');
      setTimeout(() => {
        if (onSuccess) onSuccess(verification);
      }, 900);
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Razorpay Header */}
        <div className="bg-gradient-to-r from-[#0F172A] to-[#2563EB] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-[#F59E0B]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm">HomeServe Checkout</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-300/30">
                  TEST SANDBOX
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Order: {orderInfo?.order_id || 'Initializing...'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {step === 'method' && (
            <div className="space-y-5">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Total Payable (Incl. 18% GST)</p>
                  <p className="text-xs text-slate-700 font-semibold mt-0.5 truncate max-w-[200px]">
                    {booking?.service_name || 'Verified Home Service'}
                  </p>
                </div>
                <span className="text-2xl font-extrabold text-[#2563EB]">
                  {formatCurrencyExact(payable)}
                </span>
              </div>

              {/* Payment Method Tabs */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'upi', label: 'UPI / QR', icon: Smartphone },
                  { id: 'card', label: 'Card', icon: CreditCard },
                  { id: 'netbanking', label: 'NetBanking', icon: Building },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMethod(item.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        method === item.id
                          ? 'border-[#2563EB] bg-blue-50/70 text-[#2563EB]'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {method === 'upi' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Enter UPI ID (Google Pay / PhonePe / Paytm)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#2563EB]"
                  />
                  <p className="text-[11px] text-emerald-600 font-medium">
                    ✓ Instant Razorpay Sandbox auto-approval enabled
                  </p>
                </div>
              )}

              {method === 'card' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    defaultValue="4111 •••• •••• 1111"
                    readOnly
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-slate-50 font-mono"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      defaultValue="12/29"
                      readOnly
                      className="px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-slate-50 font-mono"
                    />
                    <input
                      type="password"
                      defaultValue="123"
                      readOnly
                      className="px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-slate-50 font-mono"
                    />
                  </div>
                </div>
              )}

              {method === 'netbanking' && (
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank'].map((bank) => (
                    <div
                      key={bank}
                      className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/40 text-slate-800 text-center"
                    >
                      {bank}
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={handlePayNow}
                className="w-full py-3.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                Pay {formatCurrencyExact(payable)} Securely
              </button>

              <p className="text-[11px] text-center text-slate-400">
                Secured by Razorpay 256-bit SSL & HMAC-SHA256 Signature Verification
              </p>
            </div>
          )}

          {step === 'processing' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-[#2563EB] rounded-full animate-spin mx-auto" />
              <h4 className="text-base font-bold text-slate-900">
                Verifying HMAC-SHA256 Payment Signature...
              </h4>
              <p className="text-xs text-slate-500">
                Communicating with `/api/v1/payments/verify`
              </p>
            </div>
          )}

          {step === 'verified' && (
            <div className="py-10 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#16A34A] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-extrabold text-slate-900">Payment Verified!</h4>
              <p className="text-xs text-slate-600">
                Amount {formatCurrencyExact(payable)} captured & GST Tax Invoice generated.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
