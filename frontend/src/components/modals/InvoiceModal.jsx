import React, { useEffect, useState } from 'react';
import { Printer, Download, ShieldCheck, X, CheckCircle2 } from 'lucide-react';
import { BRAND } from '../../constants';
import { paymentService } from '../../services/paymentService';
import { formatCurrencyExact, formatDate } from '../../utils/formatters';

export const InvoiceModal = ({ isOpen, onClose, booking }) => {
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    if (isOpen && booking) {
      paymentService.getInvoiceByBooking(booking.id).then(setInvoice);
    }
  }, [isOpen, booking]);

  if (!isOpen || !booking) return null;

  const inv = invoice || {
    invoice_number: `HS-INV-2026-${booking.id}`,
    booking_reference: booking.booking_reference,
    issued_date: booking.scheduled_date,
    customer_name: booking.customer_name,
    customer_email: booking.customer_email,
    customer_phone: booking.customer_phone,
    customer_address: `${booking.address_line}, ${booking.city} - ${booking.postal_code}`,
    provider_name: booking.provider_name,
    service_name: booking.service_name,
    category_name: booking.category_name,
    base_amount: booking.base_amount,
    discount_amount: booking.discount_amount || 0,
    coupon_code: booking.coupon_code || '',
    cgst_amount: Number(((booking.tax_amount || 0) / 2).toFixed(2)),
    sgst_amount: Number(((booking.tax_amount || 0) / 2).toFixed(2)),
    tax_amount: booking.tax_amount,
    total_amount: booking.total_amount,
    payment_status: booking.payment_status,
    razorpay_order_id: booking.razorpay_order_id || 'order_HS_Sandbox',
    razorpay_payment_id: booking.razorpay_payment_id || 'pay_HS_Sandbox',
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 my-8">
        {/* Top Action Bar */}
        <div className="bg-[#0F172A] text-white px-6 py-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#F59E0B]" />
            <span className="text-sm font-bold">Official GST Tax Invoice</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-xs font-bold transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Content */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-800">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                Home<span className="text-[#2563EB]">Serve</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">{BRAND.tagline}</p>
              <p className="text-xs text-slate-500 mt-1">{BRAND.headquarters}</p>
              <p className="text-xs font-mono text-slate-600 mt-0.5">GSTIN: {BRAND.gstin}</p>
            </div>
            <div className="sm:text-right space-y-1">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> {inv.payment_status || 'Paid'}
              </span>
              <p className="text-sm font-extrabold text-slate-900 mt-1">
                Invoice #{inv.invoice_number}
              </p>
              <p className="text-xs text-slate-500">Booking Ref: {inv.booking_reference}</p>
              <p className="text-xs text-slate-500">Date: {formatDate(inv.issued_date)}</p>
            </div>
          </div>

          {/* Billed To & Service Provider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
              <p className="font-bold text-slate-400 uppercase tracking-wider">Billed To (Customer)</p>
              <p className="text-sm font-bold text-slate-900">{inv.customer_name}</p>
              <p className="text-slate-600">{inv.customer_phone}</p>
              <p className="text-slate-600">{inv.customer_address}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
              <p className="font-bold text-slate-400 uppercase tracking-wider">Fulfilled By (Verified Partner)</p>
              <p className="text-sm font-bold text-slate-900">{inv.provider_name}</p>
              <p className="text-slate-600">Category: {inv.category_name || 'Home Service'}</p>
              <p className="text-slate-500 font-mono text-[11px]">
                Razorpay ID: {inv.razorpay_payment_id}
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase">
                <tr>
                  <th className="py-3 px-4 font-bold">Description</th>
                  <th className="py-3 px-4 font-bold text-center">SAC Code</th>
                  <th className="py-3 px-4 font-bold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900">{inv.service_name}</p>
                    <p className="text-slate-500">HomeServe Verified Doorstep Service</p>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-600">998519</td>
                  <td className="py-3.5 px-4 text-right font-semibold">
                    {formatCurrencyExact(inv.base_amount)}
                  </td>
                </tr>
                {Number(inv.discount_amount) > 0 && (
                  <tr className="text-emerald-700 bg-emerald-50/40">
                    <td className="py-2.5 px-4 font-medium" colSpan={2}>
                      Promotional Coupon Discount ({inv.coupon_code || 'PROMO'})
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold">
                      - {formatCurrencyExact(inv.discount_amount)}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="py-2.5 px-4 text-slate-600" colSpan={2}>
                    CGST (9% Central Goods & Services Tax)
                  </td>
                  <td className="py-2.5 px-4 text-right font-medium">
                    {formatCurrencyExact(inv.cgst_amount)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-slate-600" colSpan={2}>
                    SGST (9% State Goods & Services Tax)
                  </td>
                  <td className="py-2.5 px-4 text-right font-medium">
                    {formatCurrencyExact(inv.sgst_amount)}
                  </td>
                </tr>
                <tr className="bg-slate-900 text-white font-extrabold text-sm">
                  <td className="py-3.5 px-4" colSpan={2}>
                    Grand Total (Inclusive of 18% GST)
                  </td>
                  <td className="py-3.5 px-4 text-right text-[#F59E0B]">
                    {formatCurrencyExact(inv.total_amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2">
            <span>Computer generated tax invoice • No physical signature required</span>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1 text-[#2563EB] font-bold hover:underline no-print cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
