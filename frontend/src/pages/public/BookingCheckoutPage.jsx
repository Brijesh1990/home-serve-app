import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Sparkles,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { CITIES, TIME_SLOTS } from '../../constants';
import { serviceService } from '../../services/serviceService';
import { providerService } from '../../services/providerService';
import { bookingService } from '../../services/bookingService';
import { customerService } from '../../services/customerService';
import { formatCurrencyExact } from '../../utils/formatters';
import PaymentModal from '../../components/modals/PaymentModal';
import InvoiceModal from '../../components/modals/InvoiceModal';

export const BookingCheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [addresses, setAddresses] = useState([]);

  const [selectedServiceId, setSelectedServiceId] = useState(
    Number(searchParams.get('serviceId') || 1)
  );
  const [selectedProviderId, setSelectedProviderId] = useState(
    Number(searchParams.get('providerId') || 1)
  );
  const [scheduledDate, setScheduledDate] = useState('2026-11-20');
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [availabilityStatus, setAvailabilityStatus] = useState({
    available: true,
    message: 'Slot is available for instant confirmation!',
  });

  const [addressLine, setAddressLine] = useState(
    'Flat 1402, Oberoi Springs, Off New Link Road, Andheri West'
  );
  const [city, setCity] = useState('Mumbai');
  const [postalCode, setPostalCode] = useState('400053');
  const [problemDescription, setProblemDescription] = useState(
    'Need complete servicing and inspection as per HomeServe standard checklist.'
  );
  const [referenceImageUrl, setReferenceImageUrl] = useState('');

  const [couponInput, setCouponInput] = useState('WELCOME20');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  useEffect(() => {
    serviceService.getServices().then(setServices);
    providerService.getProviders({ status: 'verified' }).then(setProviders);
    customerService.getAddresses().then((list) => {
      setAddresses(list);
      if (list.length > 0) {
        setAddressLine(list[0].address_line);
        setCity(list[0].city);
        setPostalCode(list[0].postal_code);
      }
    });
  }, []);

  // Live Availability Check whenever Provider, Date, or Slot changes
  useEffect(() => {
    bookingService
      .checkAvailability({
        provider_id: selectedProviderId,
        scheduled_date: scheduledDate,
        time_slot: timeSlot,
      })
      .then(setAvailabilityStatus);
  }, [selectedProviderId, scheduledDate, timeSlot]);

  const currentService =
    services.find((s) => Number(s.id) === Number(selectedServiceId)) || services[0] || {
      id: 1,
      name: 'Split / Window AC Foam Power Jet Service',
      base_price: 599,
      discount_price: 499,
    };

  const basePrice = Number(currentService.discount_price || currentService.base_price || 499);
  const taxableAmount = Math.max(0, basePrice - discountAmount);
  const gstTax = Number((taxableAmount * 0.18).toFixed(2));
  const totalPayable = Number((taxableAmount + gstTax).toFixed(2));

  const handleApplyCoupon = async (codeToApply = couponInput) => {
    if (!codeToApply.trim()) return;
    try {
      const res = await bookingService.validateCoupon(codeToApply, basePrice);
      setAppliedCoupon(res.coupon);
      setDiscountAmount(Number(res.discount_amount || 0));
      setCouponInput(codeToApply.toUpperCase());
      toast.success(res.message);
    } catch (err) {
      setAppliedCoupon(null);
      setDiscountAmount(0);
      toast.error(err.message || 'Invalid coupon code');
    }
  };

  const handleConfirmCheckout = async (e) => {
    e.preventDefault();
    if (!availabilityStatus.available) {
      toast.error('Please select an available appointment time slot.');
      return;
    }
    if (problemDescription.trim().length < 8) {
      toast.error('Please enter a brief problem description.');
      return;
    }

    if (paymentMethod === 'razorpay') {
      setIsPaymentModalOpen(true);
    } else {
      const created = await bookingService.createBooking({
        service_id: selectedServiceId,
        provider_id: selectedProviderId,
        scheduled_date: scheduledDate,
        time_slot: timeSlot,
        address_line: addressLine,
        city,
        postal_code: postalCode,
        problem_description: problemDescription,
        reference_image_url: referenceImageUrl,
        base_amount: basePrice,
        discount_amount: discountAmount,
        coupon_code: appliedCoupon?.code || '',
        payment_method: 'pay_after_service',
        payment_status: 'Pending',
      });
      setConfirmedBooking(created);
      toast.success(`Booking ${created.booking_reference} confirmed!`);
    }
  };

  const handleRazorpaySuccess = async (verification) => {
    setIsPaymentModalOpen(false);
    const created = await bookingService.createBooking({
      service_id: selectedServiceId,
      provider_id: selectedProviderId,
      scheduled_date: scheduledDate,
      time_slot: timeSlot,
      address_line: addressLine,
      city,
      postal_code: postalCode,
      problem_description: problemDescription,
      reference_image_url: referenceImageUrl,
      base_amount: basePrice,
      discount_amount: discountAmount,
      coupon_code: appliedCoupon?.code || '',
      payment_method: 'razorpay',
      payment_status: 'Paid',
      razorpay_order_id: verification.razorpay_order_id,
      razorpay_payment_id: verification.razorpay_payment_id,
    });
    setConfirmedBooking(created);
    toast.success(`Payment verified & Booking ${created.booking_reference} confirmed!`);
  };

  if (confirmedBooking) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-14">
        <div className="bg-white rounded-3xl p-8 border border-emerald-200 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-[#16A34A] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold uppercase">
              Booking Confirmed
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Thank You! Your Service is Scheduled
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Booking Reference:{' '}
              <span className="font-mono font-bold text-[#2563EB]">
                {confirmedBooking.booking_reference}
              </span>
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-left grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-400 font-bold uppercase">Service Package</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {confirmedBooking.service_name}
              </p>
              <p className="text-slate-600">Partner: {confirmedBooking.provider_name}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase">Appointment Slot</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {confirmedBooking.scheduled_date} • {confirmedBooking.time_slot}
              </p>
              <p className="text-slate-600">{confirmedBooking.address_line}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase">Payment Status</p>
              <p className="text-sm font-bold text-emerald-700 mt-0.5">
                {confirmedBooking.payment_status} ({confirmedBooking.payment_method})
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase">Total Amount (Incl. 18% GST)</p>
              <p className="text-lg font-extrabold text-[#2563EB] mt-0.5">
                {formatCurrencyExact(confirmedBooking.total_amount)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsInvoiceOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#F59E0B]" />
              View / Print GST Invoice
            </button>
            <button
              type="button"
              onClick={() => navigate('/customer/dashboard')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#2563EB] text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
            >
              Track in Customer Dashboard →
            </button>
          </div>
        </div>

        <InvoiceModal
          isOpen={isInvoiceOpen}
          onClose={() => setIsInvoiceOpen(false)}
          booking={confirmedBooking}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <span className="text-xs font-extrabold uppercase tracking-wider text-[#2563EB]">
          Instant Doorstep Checkout
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          Complete Your Service Booking
        </h1>
      </div>

      <form onSubmit={handleConfirmCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 Columns */}
        <div className="lg:col-span-8 space-y-6">
          {/* Step 1: Service & Verified Provider */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#2563EB] text-white text-xs flex items-center justify-center">
                1
              </span>
              Select Service Package & Verified Partner
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Service Package
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#2563EB]"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — ₹{s.discount_price || s.base_price}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Verified Service Provider
                </label>
                <select
                  value={selectedProviderId}
                  onChange={(e) => setSelectedProviderId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#2563EB]"
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.business_name} (★ {p.rating} • {p.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: Date & Time Slot with Live Availability Check */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#2563EB] text-white text-xs flex items-center justify-center">
                2
              </span>
              Schedule Date & Time Slot (Live Double-Booking Protection)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Preferred Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Preferred Time Window
                </label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#2563EB]"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                availabilityStatus.available
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {availabilityStatus.available ? (
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
              )}
              <span>{availabilityStatus.message}</span>
            </div>
          </div>

          {/* Step 3: Service Location & Problem Details */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#2563EB] text-white text-xs flex items-center justify-center">
                3
              </span>
              Doorstep Service Address & Issue Details
            </h2>

            {addresses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {addresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => {
                      setAddressLine(addr.address_line);
                      setCity(addr.city);
                      setPostalCode(addr.postal_code);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 text-[#2563EB] border border-blue-200 text-xs font-bold hover:bg-blue-100 cursor-pointer"
                  >
                    Use {addr.label}: {addr.city} ({addr.postal_code})
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  House / Flat / Building / Street Address
                </label>
                <input
                  type="text"
                  required
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#2563EB]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City & PIN</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-1/2 px-3 py-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-1/2 px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Describe the Problem / Special Instructions
              </label>
              <textarea
                rows={3}
                required
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reference Photo URL (Optional)
              </label>
              <input
                type="url"
                value={referenceImageUrl}
                onChange={(e) => setReferenceImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Coupon & Transparent GST Price Breakdown */}
        <aside className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-lg sticky top-24 space-y-5">
          <h3 className="text-base font-extrabold text-slate-900">
            Transparent Price Summary
          </h3>

          {/* Promo Coupon Box */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Ticket className="w-4 h-4 text-[#F59E0B]" /> Apply Promotional Coupon
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="WELCOME20"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold uppercase bg-white"
              />
              <button
                type="button"
                onClick={() => handleApplyCoupon(couponInput)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Apply
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['WELCOME20', 'SUMMER15', 'HOME250'].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleApplyCoupon(code)}
                  className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-mono font-bold hover:bg-amber-200 cursor-pointer"
                >
                  {code}
                </button>
              ))}
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-2.5 text-xs border-t border-b border-slate-100 py-4">
            <div className="flex justify-between text-slate-600">
              <span>Base Package Price</span>
              <span className="font-bold text-slate-900">{formatCurrencyExact(basePrice)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Coupon Discount ({appliedCoupon?.code})</span>
                <span>- {formatCurrencyExact(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>GST Tax (18% CGST + SGST)</span>
              <span className="font-semibold text-slate-800">{formatCurrencyExact(gstTax)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-100">
              <span>Total Payable</span>
              <span className="text-[#2563EB]">{formatCurrencyExact(totalPayable)}</span>
            </div>
          </div>

          {/* Payment Option */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Select Payment Mode</label>
            <div className="space-y-2">
              <label
                onClick={() => setPaymentMethod('razorpay')}
                className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-bold cursor-pointer ${
                  paymentMethod === 'razorpay'
                    ? 'border-[#2563EB] bg-blue-50/50 text-[#2563EB]'
                    : 'border-slate-200 text-slate-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Pay Now via Razorpay (UPI / Card)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Instant Confirm
                </span>
              </label>

              <label
                onClick={() => setPaymentMethod('pay_after_service')}
                className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-bold cursor-pointer ${
                  paymentMethod === 'pay_after_service'
                    ? 'border-[#2563EB] bg-blue-50/50 text-[#2563EB]'
                    : 'border-slate-200 text-slate-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Pay After Service Completion
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition cursor-pointer"
          >
            {paymentMethod === 'razorpay'
              ? `Proceed to Razorpay (${formatCurrencyExact(totalPayable)})`
              : `Confirm Booking (${formatCurrencyExact(totalPayable)})`}
          </button>

          <p className="text-[11px] text-center text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-4 h-4 text-[#16A34A]" /> Covered by ₹10,000 HomeServe Warranty
          </p>
        </aside>
      </form>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        booking={{ service_name: currentService.name }}
        amount={totalPayable}
        onSuccess={handleRazorpaySuccess}
      />
    </div>
  );
};

export default BookingCheckoutPage;
