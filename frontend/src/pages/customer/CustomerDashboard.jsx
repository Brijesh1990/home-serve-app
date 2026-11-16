import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import {
  Calendar,
  CreditCard,
  FileText,
  Star,
  MapPin,
  Heart,
  Trash2,
  Plus,
  Clock,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { TIME_SLOTS } from '../../constants';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import PaymentModal from '../../components/modals/PaymentModal';
import InvoiceModal from '../../components/modals/InvoiceModal';
import ReviewModal from '../../components/modals/ReviewModal';
import { useAuth } from '../../hooks/useAuth';
import { bookingService } from '../../services/bookingService';
import { serviceService } from '../../services/serviceService';
import { customerService } from '../../services/customerService';
import { analyticsService } from '../../services/analyticsService';
import { notificationService } from '../../services/notificationService';
import { formatCurrency, formatCurrencyExact } from '../../utils/formatters';

export const CustomerDashboard = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Modals state
  const [payBooking, setPayBooking] = useState(null);
  const [invoiceBooking, setInvoiceBooking] = useState(null);
  const [reviewBooking, setReviewBooking] = useState(null);

  // Forms
  const [newAddress, setNewAddress] = useState({
    label: 'Office',
    address_line: '',
    city: 'Mumbai',
    postal_code: '400053',
  });
  const [newComplaint, setNewComplaint] = useState({
    booking_reference: 'HS-BK-2026-1001',
    subject: '',
    priority: 'Medium',
    description: '',
  });
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || 'Aarav Sharma',
    phone: user?.phone || '+91 98765 43210',
    city: user?.city || 'Mumbai',
  });

  const loadCustomerData = async () => {
    const [bkg, srv, fav, addr, rev, cmp, notif] = await Promise.all([
      bookingService.getBookings(),
      serviceService.getServices(),
      customerService.getFavorites(),
      customerService.getAddresses(),
      analyticsService.getReviews(),
      analyticsService.getComplaints(),
      notificationService.getNotifications(),
    ]);
    setBookings(bkg);
    setServices(srv);
    setFavorites(fav);
    setAddresses(addr);
    setReviews(rev);
    setComplaints(cmp);
    setNotifications(notif);
  };

  useEffect(() => {
    loadCustomerData();
  }, []);

  const handleReschedule = async (booking) => {
    const { value: formValues } = await Swal.fire({
      title: `Reschedule ${booking.booking_reference}`,
      html: `
        <div class="text-left space-y-3 text-xs">
          <label class="block font-bold">New Appointment Date</label>
          <input id="swal-date" type="date" value="${booking.scheduled_date}" class="swal2-input !m-0 !w-full !text-sm" />
          <label class="block font-bold mt-3">New Time Slot</label>
          <select id="swal-slot" class="swal2-input !m-0 !w-full !text-sm">
            ${TIME_SLOTS.map((s) => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#2563EB',
      confirmButtonText: 'Confirm Reschedule',
      preConfirm: () => ({
        scheduled_date: document.getElementById('swal-date').value,
        time_slot: document.getElementById('swal-slot').value,
      }),
    });

    if (formValues) {
      await bookingService.rescheduleBooking(booking.id, formValues);
      toast.success(`Appointment rescheduled to ${formValues.scheduled_date} (${formValues.time_slot})`);
      setBookings(await bookingService.getBookings());
    }
  };

  const handleCancelBooking = async (booking) => {
    const res = await Swal.fire({
      title: `Cancel Booking ${booking.booking_reference}?`,
      text: 'Free cancellation up to 2 hours before appointment time.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      confirmButtonText: 'Yes, Cancel Booking',
    });
    if (res.isConfirmed) {
      await bookingService.cancelBooking(booking.id);
      toast.info(`Booking ${booking.booking_reference} cancelled.`);
      setBookings(await bookingService.getBookings());
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!newAddress.address_line) return;
    await customerService.addAddress(newAddress);
    toast.success('New service address saved!');
    setNewAddress({ label: 'Home', address_line: '', city: 'Mumbai', postal_code: '400053' });
    setAddresses(await customerService.getAddresses());
  };

  const handleDeleteAddress = async (id) => {
    await customerService.deleteAddress(id);
    toast.info('Address removed');
    setAddresses(await customerService.getAddresses());
  };

  const handleRemoveFavorite = async (providerId) => {
    await customerService.toggleFavorite(providerId);
    toast.info('Removed from Favorite Providers');
    setFavorites(await customerService.getFavorites());
  };

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    if (!newComplaint.subject || !newComplaint.description) return;
    await analyticsService.createComplaint(newComplaint);
    toast.success('Support ticket raised! Our SLA team will respond shortly.');
    setNewComplaint({
      booking_reference: 'HS-BK-2026-1001',
      subject: '',
      priority: 'Medium',
      description: '',
    });
    setComplaints(await analyticsService.getComplaints());
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    await updateProfile(profileForm);
    toast.success('Profile updated successfully!');
  };

  const upcomingList = bookings.filter((b) =>
    ['Pending', 'Confirmed', 'Assigned', 'Accepted', 'Arrived', 'In Progress'].includes(b.status)
  );
  const completedList = bookings.filter((b) => b.status === 'Completed');
  const pendingPaymentList = bookings.filter((b) => b.payment_status === 'Pending');

  const renderBookingsList = (list) => (
    <div className="space-y-4">
      {list.map((b) => (
        <div
          key={b.id}
          className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-extrabold text-[#2563EB]">
                {b.booking_reference}
              </span>
              <StatusBadge status={b.status} />
              <StatusBadge status={b.payment_status} />
            </div>
            <h4 className="text-base font-extrabold text-slate-900">{b.service_name}</h4>
            <p className="text-xs text-slate-500">
              Partner: <strong>{b.provider_name}</strong> • Tech:{' '}
              <strong>{b.technician_name || 'Assigning soon'}</strong>
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>
                {b.scheduled_date} ({b.time_slot}) • {b.address_line}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="text-base font-extrabold text-slate-900 mr-2">
              {formatCurrencyExact(b.total_amount)}
            </span>

            {b.payment_status === 'Pending' && b.status !== 'Cancelled' && (
              <button
                type="button"
                onClick={() => setPayBooking(b)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" /> Pay Now (Razorpay)
              </button>
            )}

            <button
              type="button"
              onClick={() => setInvoiceBooking(b)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" /> GST Invoice
            </button>

            {['Pending', 'Confirmed', 'Assigned'].includes(b.status) && (
              <>
                <button
                  type="button"
                  onClick={() => handleReschedule(b)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Reschedule
                </button>
                <button
                  type="button"
                  onClick={() => handleCancelBooking(b)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" /> Cancel
                </button>
              </>
            )}

            {b.status === 'Completed' && (
              <button
                type="button"
                onClick={() => setReviewBooking(b)}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold hover:bg-amber-100 cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" /> Rate Service
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <DashboardLayout
      role="customer"
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      title={`Welcome, ${user?.full_name || 'Aarav Sharma'}`}
      subtitle="Manage Your Home Service Appointments, Razorpay Invoices & Warranty Protection"
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
    >
      {/* 1. DASHBOARD OVERVIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Bookings"
              value={bookings.length}
              subtitle="All-Time Appointments"
              icon="CalendarCheck"
              color="blue"
            />
            <StatCard
              title="Upcoming / Active"
              value={upcomingList.length}
              subtitle="Scheduled Visits"
              icon="Clock"
              color="indigo"
            />
            <StatCard
              title="Completed Services"
              value={completedList.length}
              subtitle="Covered by 30-Day Warranty"
              icon="CheckCircle2"
              color="emerald"
            />
            <StatCard
              title="Pending Payments"
              value={pendingPaymentList.length}
              subtitle="Pay via Razorpay UPI/Card"
              icon="CreditCard"
              color="amber"
            />
          </div>

          {/* Live Active Job Status Tracker */}
          {upcomingList[0] && (
            <div className="bg-white rounded-3xl p-6 border border-blue-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB]">
                    Live Service Tracker • {upcomingList[0].booking_reference}
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                    {upcomingList[0].service_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Technician: <strong>{upcomingList[0].technician_name || 'Ramesh Kulkarni'}</strong> •{' '}
                    {upcomingList[0].scheduled_date} ({upcomingList[0].time_slot})
                  </p>
                </div>
                <StatusBadge status={upcomingList[0].status} />
              </div>

              {/* 5-Stage Progress Bar */}
              <div className="grid grid-cols-5 gap-2 pt-2">
                {['Confirmed', 'Assigned', 'Arrived', 'In Progress', 'Completed'].map((step, i) => {
                  const active = i <= 3;
                  return (
                    <div
                      key={step}
                      className={`p-2.5 rounded-xl text-center text-xs font-bold border ${
                        active
                          ? 'bg-blue-50 border-blue-200 text-[#2563EB]'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      {step}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Your Recent Bookings</h3>
            {renderBookingsList(bookings.slice(0, 4))}
          </div>
        </div>
      )}

      {/* 2. BROWSE SERVICES */}
      {activeTab === 'browse' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
            >
              <img src={s.image} alt={s.name} className="w-full h-44 object-cover" />
              <div className="p-5 space-y-3">
                <span className="text-[10px] font-bold uppercase text-[#2563EB]">
                  {s.category_name}
                </span>
                <h4 className="text-sm font-extrabold text-slate-900">{s.name}</h4>
                <p className="text-xs text-slate-500 line-clamp-2">{s.description}</p>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-base font-extrabold text-slate-900">
                    {formatCurrency(s.discount_price || s.base_price)}
                  </span>
                  <Link
                    to={`/checkout?serviceId=${s.id}`}
                    className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-blue-700"
                  >
                    Book Instant Slot
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3, 4, 5. MY BOOKINGS / UPCOMING / HISTORY */}
      {activeTab === 'bookings' && renderBookingsList(bookings)}
      {activeTab === 'upcoming' && renderBookingsList(upcomingList)}
      {activeTab === 'history' && renderBookingsList(completedList)}

      {/* 6. FAVORITE PROVIDERS */}
      {activeTab === 'favorites' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {favorites.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <img
                  src={p.avatar}
                  alt={p.business_name}
                  className="w-14 h-14 rounded-2xl object-cover"
                />
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">{p.business_name}</h4>
                  <p className="text-xs text-slate-500">
                    {p.city} • ★ {p.rating} ({p.completed_jobs} jobs)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/checkout?providerId=${p.id}`}
                  className="px-3.5 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold"
                >
                  Book
                </Link>
                <button
                  type="button"
                  onClick={() => handleRemoveFavorite(p.id)}
                  className="p-2 rounded-xl bg-rose-50 text-rose-600 cursor-pointer"
                >
                  <Heart className="w-4 h-4 fill-rose-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 7. SAVED ADDRESSES CRUD */}
      {activeTab === 'addresses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleAddAddress}
            className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 space-y-4 h-fit"
          >
            <h3 className="text-sm font-extrabold text-slate-900">Add New Doorstep Address</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Address Label</label>
              <input
                type="text"
                value={newAddress.label}
                onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                placeholder="Home / Office / Parents"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Complete Flat / Building / Street Address
              </label>
              <textarea
                rows={3}
                required
                value={newAddress.address_line}
                onChange={(e) => setNewAddress({ ...newAddress, address_line: e.target.value })}
                placeholder="Flat 1402, Oberoi Springs, Andheri West..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={newAddress.city}
                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                placeholder="City"
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
              <input
                type="text"
                value={newAddress.postal_code}
                onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                placeholder="PIN Code"
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-blue-700 cursor-pointer flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" /> Save Address
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {addresses.map((a) => (
              <div
                key={a.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-[#2563EB] text-xs font-bold">
                    {a.label}
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-1">{a.address_line}</p>
                  <p className="text-xs text-slate-500">
                    {a.city} — {a.postal_code}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteAddress(a.id)}
                  className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. PAYMENTS & INVOICES */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-base font-extrabold text-slate-900">
              Payment Ledger & Downloadable GST Tax Invoices
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase">
                <tr>
                  <th className="py-3.5 px-4">Booking Ref</th>
                  <th className="py-3.5 px-4">Service</th>
                  <th className="py-3.5 px-4">Razorpay Order ID</th>
                  <th className="py-3.5 px-4">Amount (Incl. 18% GST)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#2563EB]">
                      {b.booking_reference}
                    </td>
                    <td className="py-3.5 px-4 font-semibold">{b.service_name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {b.razorpay_order_id || 'Pay After Service'}
                    </td>
                    <td className="py-3.5 px-4 font-bold">{formatCurrencyExact(b.total_amount)}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={b.payment_status} />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {b.payment_status === 'Pending' && (
                        <button
                          type="button"
                          onClick={() => setPayBooking(b)}
                          className="px-3 py-1.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold cursor-pointer"
                        >
                          Pay Now
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setInvoiceBooking(b)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold cursor-pointer"
                      >
                        GST Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 9. REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-3xl p-5 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-slate-900">{r.service_name}</span>
                <span className="text-amber-500 font-bold text-sm">{'★'.repeat(r.rating)}</span>
              </div>
              <p className="text-xs text-slate-600">{r.comment}</p>
              {r.provider_response && (
                <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 text-xs text-slate-700">
                  <strong>Partner Response:</strong> {r.provider_response}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 10. SUPPORT & COMPLAINTS */}
      {activeTab === 'complaints' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleCreateComplaint}
            className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 space-y-4 h-fit"
          >
            <h3 className="text-sm font-extrabold text-slate-900">Raise Support / Warranty Ticket</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Booking Reference</label>
              <select
                value={newComplaint.booking_reference}
                onChange={(e) =>
                  setNewComplaint({ ...newComplaint, booking_reference: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              >
                {bookings.map((b) => (
                  <option key={b.id} value={b.booking_reference}>
                    {b.booking_reference} — {b.service_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Issue Subject</label>
              <input
                type="text"
                required
                value={newComplaint.subject}
                onChange={(e) => setNewComplaint({ ...newComplaint, subject: e.target.value })}
                placeholder="e.g. Request for post-service checkup"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
              <select
                value={newComplaint.priority}
                onChange={(e) => setNewComplaint({ ...newComplaint, priority: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Description</label>
              <textarea
                rows={3}
                required
                value={newComplaint.description}
                onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
                placeholder="Describe your concern..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
            >
              Submit Support Ticket
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {complaints.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl p-5 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#2563EB]">
                    {c.ticket_number} ({c.booking_reference})
                  </span>
                  <StatusBadge status={c.status} />
                </div>
                <h4 className="text-sm font-bold text-slate-900">{c.subject}</h4>
                <p className="text-xs text-slate-600">{c.description}</p>
                {c.admin_resolution && (
                  <p className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-xl">
                    <strong>Admin Resolution:</strong> {c.admin_resolution}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 11. NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between"
            >
              <div>
                <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
              </div>
              <span className="text-[11px] text-slate-400">{n.created_at}</span>
            </div>
          ))}
        </div>
      )}

      {/* 12. MY PROFILE */}
      {activeTab === 'profile' && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-white rounded-3xl p-6 border border-slate-200 max-w-lg space-y-4"
        >
          <h3 className="text-base font-extrabold text-slate-900">Personal Profile Settings</h3>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={profileForm.full_name}
              onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
            <input
              type="text"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
            <input
              type="text"
              value={profileForm.city}
              onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
          >
            Update Profile
          </button>
        </form>
      )}

      {/* Modals */}
      <PaymentModal
        isOpen={Boolean(payBooking)}
        onClose={() => setPayBooking(null)}
        booking={payBooking}
        amount={payBooking?.total_amount}
        onSuccess={async () => {
          setPayBooking(null);
          toast.success('Payment verified & captured!');
          setBookings(await bookingService.getBookings());
        }}
      />

      <InvoiceModal
        isOpen={Boolean(invoiceBooking)}
        onClose={() => setInvoiceBooking(null)}
        booking={invoiceBooking}
      />

      <ReviewModal
        isOpen={Boolean(reviewBooking)}
        onClose={() => setReviewBooking(null)}
        booking={reviewBooking}
        onSubmitted={async () => {
          toast.success('Thank you! Your verified review has been published.');
          setReviews(await analyticsService.getReviews());
          setBookings(await bookingService.getBookings());
        }}
      />
    </DashboardLayout>
  );
};

export default CustomerDashboard;
