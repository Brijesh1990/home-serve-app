import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import {
  CheckCircle2,
  XCircle,
  UserCheck,
  Plus,
  Trash2,
  MessageSquare,
  Crown,
} from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { RevenueAreaChart } from '../../components/charts/AnalyticsCharts';
import AssignTechnicianModal from '../../components/modals/AssignTechnicianModal';
import { useAuth } from '../../hooks/useAuth';
import { providerService } from '../../services/providerService';
import { bookingService } from '../../services/bookingService';
import { technicianService } from '../../services/technicianService';
import { serviceService } from '../../services/serviceService';
import { analyticsService } from '../../services/analyticsService';
import { notificationService } from '../../services/notificationService';
import { formatCurrency, formatCurrencyExact } from '../../utils/formatters';

export const ProviderDashboard = () => {
  const { user } = useAuth();
  const providerId = user?.provider_id || 1;
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const [provider, setProvider] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [assignModalBooking, setAssignModalBooking] = useState(null);

  // Forms
  const [newTech, setNewTech] = useState({
    full_name: '',
    phone: '',
    specialization: 'AC & Electrical Specialist',
    experience_years: 5,
  });
  const [newArea, setNewArea] = useState({
    city: 'Mumbai',
    area_name: '',
    postal_code: '',
  });
  const [newServiceForm, setNewServiceForm] = useState({
    name: '',
    category_id: 3,
    base_price: 599,
    duration_minutes: 60,
    description: '',
  });

  const loadProviderData = async () => {
    const [prv, bkg, tech, srv, cat, earn, rev, sub, notif, ana] = await Promise.all([
      providerService.getProviderById(providerId),
      bookingService.getBookings({ provider_id: providerId }),
      technicianService.getTechnicians({ provider_id: providerId }),
      serviceService.getServices(),
      serviceService.getCategories(),
      providerService.getEarnings(providerId),
      analyticsService.getReviews(),
      analyticsService.getSubscriptions(),
      notificationService.getNotifications(),
      analyticsService.getDashboardAnalytics(),
    ]);
    setProvider(prv);
    setBookings(bkg);
    setTechnicians(tech);
    setServices(srv);
    setCategories(cat);
    setEarnings(earn);
    setReviews(rev);
    setSubscriptions(sub);
    setNotifications(notif);
    setAnalytics(ana);
  };

  useEffect(() => {
    loadProviderData();
  }, [providerId]);

  const handleUpdateBookingStatus = async (booking, nextStatus) => {
    await bookingService.updateBookingStatus(booking.id, nextStatus);
    toast.success(`Booking ${booking.booking_reference} marked as ${nextStatus}!`);
    setBookings(await bookingService.getBookings({ provider_id: providerId }));
  };

  const handleCreateTech = async (e) => {
    e.preventDefault();
    if (!newTech.full_name || !newTech.phone) return;
    await technicianService.createTechnician({
      ...newTech,
      provider_id: providerId,
      provider_name: provider?.business_name,
    });
    toast.success(`Technician ${newTech.full_name} added to your workforce!`);
    setNewTech({
      full_name: '',
      phone: '',
      specialization: 'AC & Electrical Specialist',
      experience_years: 5,
    });
    setTechnicians(await technicianService.getTechnicians({ provider_id: providerId }));
  };

  const handleAddServiceArea = async (e) => {
    e.preventDefault();
    if (!newArea.area_name || !newArea.postal_code) return;
    await providerService.addServiceArea(providerId, newArea);
    toast.success(`Added ${newArea.area_name} (${newArea.postal_code}) to service areas!`);
    setNewArea({ city: 'Mumbai', area_name: '', postal_code: '' });
    setProvider(await providerService.getProviderById(providerId));
  };

  const handleRemoveArea = async (areaId) => {
    await providerService.removeServiceArea(providerId, areaId);
    toast.info('Service area removed');
    setProvider(await providerService.getProviderById(providerId));
  };

  const handleCreateProviderService = async (e) => {
    e.preventDefault();
    if (!newServiceForm.name) return;
    await serviceService.createService(newServiceForm);
    toast.success(`Service "${newServiceForm.name}" added to your catalog!`);
    setNewServiceForm({
      name: '',
      category_id: 3,
      base_price: 599,
      duration_minutes: 60,
      description: '',
    });
    setServices(await serviceService.getServices());
    setActiveTab('services');
  };

  const handleRespondReview = async (review) => {
    const { value: reply } = await Swal.fire({
      title: `Reply to ${review.customer_name}`,
      input: 'textarea',
      inputLabel: 'Official Partner Response',
      inputValue: review.provider_response || '',
      inputPlaceholder: 'Thank the customer and share feedback...',
      showCancelButton: true,
      confirmButtonColor: '#2563EB',
    });
    if (reply) {
      await analyticsService.respondToReview(review.id, reply);
      toast.success('Official response published!');
      setReviews(await analyticsService.getReviews());
    }
  };

  const handleSaveWorkingHours = async () => {
    await providerService.updateWorkingHours(providerId, provider?.working_hours || []);
    toast.success('Weekly operating hours saved!');
  };

  const pendingRequests = bookings.filter((b) => b.status === 'Pending');
  const confirmedBookings = bookings.filter((b) =>
    ['Confirmed', 'Assigned', 'Accepted', 'Arrived', 'In Progress'].includes(b.status)
  );
  const completedBookings = bookings.filter((b) => b.status === 'Completed');

  const grossEarnings = earnings?.summary?.gross_earnings || 4895.0;
  const commissionDeducted = earnings?.summary?.commission_deducted || 734.25;
  const netPayout = earnings?.summary?.net_payout || 4160.75;

  return (
    <DashboardLayout
      role="provider"
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      title={provider?.business_name || 'Apex Home Solutions Pvt Ltd'}
      subtitle="Accept Customer Orders, Dispatch Field Technicians & Track 85% Net Payouts"
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
    >
      {/* 1. OVERVIEW TAB (7 KPI Cards + Charts + Quick Requests) */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Bookings"
              value={bookings.length}
              subtitle="Assigned to Partner"
              icon="CalendarCheck"
              color="blue"
            />
            <StatCard
              title="Today's Jobs"
              value={bookings.filter((b) => b.scheduled_date === '2026-11-16').length || 2}
              subtitle="Scheduled Today"
              icon="Calendar"
              color="indigo"
            />
            <StatCard
              title="Pending Requests"
              value={pendingRequests.length}
              subtitle="Awaiting Confirmation"
              icon="Inbox"
              color="amber"
            />
            <StatCard
              title="Completed Jobs"
              value={provider?.completed_jobs || completedBookings.length}
              subtitle="All-Time Fulfilled"
              icon="CheckCircle2"
              color="emerald"
            />
            <StatCard
              title="Net Partner Earnings (85%)"
              value={formatCurrencyExact(netPayout)}
              subtitle="After 15% Commission"
              icon="Wallet"
              color="emerald"
            />
            <StatCard
              title="Platform Commission (15%)"
              value={formatCurrencyExact(commissionDeducted)}
              subtitle="SaaS Fee Deducted"
              icon="CreditCard"
              color="purple"
            />
            <StatCard
              title="Partner Rating"
              value={`★ ${provider?.rating || 4.9}`}
              subtitle={`${provider?.reviews_count || 318} Verified Reviews`}
              icon="Star"
              color="amber"
            />
          </div>

          <RevenueAreaChart data={analytics?.monthly_trends || []} />

          {/* Recent Booking Requests */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">
              Incoming Booking Requests & Active Dispatch Queue
            </h3>
            <div className="space-y-3">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#2563EB]">
                        {b.booking_reference}
                      </span>
                      <StatusBadge status={b.status} />
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-900 mt-1">{b.service_name}</h4>
                    <p className="text-xs text-slate-500">
                      Customer: <strong>{b.customer_name}</strong> ({b.customer_phone}) •{' '}
                      {b.scheduled_date} ({b.time_slot})
                    </p>
                    <p className="text-xs text-slate-500">Address: {b.address_line}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {b.status === 'Pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleUpdateBookingStatus(b, 'Confirmed')}
                          className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#16A34A] text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateBookingStatus(b, 'Rejected')}
                          className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}
                    {['Confirmed', 'Assigned'].includes(b.status) && (
                      <button
                        type="button"
                        onClick={() => setAssignModalBooking(b)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        {b.technician_name ? `Reassign (${b.technician_name})` : 'Assign Technician'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. MY SERVICES TAB */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {services.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 flex items-center justify-between gap-4"
            >
              <div>
                <span className="text-[10px] font-bold uppercase text-[#2563EB]">
                  {s.category_name}
                </span>
                <h4 className="text-sm font-extrabold text-slate-900">{s.name}</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Rate: {formatCurrency(s.discount_price || s.base_price)} • {s.duration_minutes} mins
                </p>
              </div>
              <StatusBadge status="Active" />
            </div>
          ))}
        </div>
      )}

      {/* 3. ADD SERVICE TAB */}
      {activeTab === 'add-service' && (
        <form
          onSubmit={handleCreateProviderService}
          className="bg-white rounded-3xl p-6 border border-slate-200 max-w-xl space-y-4"
        >
          <h3 className="text-base font-extrabold text-slate-900">Add New Service to Catalog</h3>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Service Name</label>
            <input
              type="text"
              required
              value={newServiceForm.name}
              onChange={(e) => setNewServiceForm({ ...newServiceForm, name: e.target.value })}
              placeholder="e.g. Inverter AC Gas Charging & Leak Test"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={newServiceForm.category_id}
                onChange={(e) =>
                  setNewServiceForm({ ...newServiceForm, category_id: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Price (₹)</label>
              <input
                type="number"
                value={newServiceForm.base_price}
                onChange={(e) =>
                  setNewServiceForm({ ...newServiceForm, base_price: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              required
              value={newServiceForm.description}
              onChange={(e) =>
                setNewServiceForm({ ...newServiceForm, description: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
          >
            Publish Service Offering
          </button>
        </form>
      )}

      {/* 4 & 5. BOOKING REQUESTS & CONFIRMED BOOKINGS */}
      {(activeTab === 'requests' || activeTab === 'confirmed' || activeTab === 'assign') && (
        <div className="space-y-4">
          {(activeTab === 'requests' ? pendingRequests : bookings).map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#2563EB]">
                    {b.booking_reference}
                  </span>
                  <StatusBadge status={b.status} />
                </div>
                <h4 className="text-sm font-extrabold text-slate-900 mt-1">{b.service_name}</h4>
                <p className="text-xs text-slate-500">
                  Customer: {b.customer_name} • {b.scheduled_date} ({b.time_slot})
                </p>
                <p className="text-xs text-slate-500">
                  Assigned Tech: <strong>{b.technician_name || 'Not Assigned Yet'}</strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {b.status === 'Pending' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateBookingStatus(b, 'Confirmed')}
                    className="px-3.5 py-2 rounded-xl bg-[#16A34A] text-white text-xs font-bold cursor-pointer"
                  >
                    Accept Booking
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setAssignModalBooking(b)}
                  className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold cursor-pointer"
                >
                  Dispatch Technician
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. TECHNICIAN MANAGEMENT */}
      {activeTab === 'technicians' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleCreateTech}
            className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 space-y-4 h-fit"
          >
            <h3 className="text-sm font-extrabold text-slate-900">Onboard Field Technician</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={newTech.full_name}
                onChange={(e) => setNewTech({ ...newTech, full_name: e.target.value })}
                placeholder="Prakash Shinde"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
              <input
                type="text"
                required
                value={newTech.phone}
                onChange={(e) => setNewTech({ ...newTech, phone: e.target.value })}
                placeholder="+91 98201 55443"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Specialization</label>
              <input
                type="text"
                value={newTech.specialization}
                onChange={(e) => setNewTech({ ...newTech, specialization: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-blue-700 cursor-pointer flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Technician
            </button>
          </form>

          <div className="lg:col-span-8 space-y-3">
            {technicians.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{t.full_name}</h4>
                  <p className="text-xs text-slate-500">
                    {t.specialization} • {t.phone} • ★ {t.rating} ({t.jobs_completed} jobs)
                  </p>
                </div>
                <StatusBadge status={t.availability_status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. WORKING HOURS & AVAILABILITY */}
      {activeTab === 'availability' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 max-w-2xl space-y-4">
          <h3 className="text-base font-extrabold text-slate-900">Weekly Operating Schedule</h3>
          <div className="space-y-2.5">
            {(provider?.working_hours || []).map((wh) => (
              <div
                key={wh.day}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs"
              >
                <span className="font-bold text-slate-900 w-28">{wh.day}</span>
                <span className="font-mono text-slate-700">
                  {wh.open} — {wh.close}
                </span>
                <span className="text-emerald-700 font-bold">Open for Bookings</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleSaveWorkingHours}
            className="px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
          >
            Save Weekly Schedule
          </button>
        </div>
      )}

      {/* 9. SERVICE AREAS */}
      {activeTab === 'areas' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleAddServiceArea}
            className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 space-y-4 h-fit"
          >
            <h3 className="text-sm font-extrabold text-slate-900">Add Covered Locality & PIN Code</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Area / Locality</label>
              <input
                type="text"
                required
                value={newArea.area_name}
                onChange={(e) => setNewArea({ ...newArea, area_name: e.target.value })}
                placeholder="e.g. Malad West & Mindspace"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">6-Digit PIN Code</label>
              <input
                type="text"
                required
                value={newArea.postal_code}
                onChange={(e) => setNewArea({ ...newArea, postal_code: e.target.value })}
                placeholder="400064"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold cursor-pointer"
            >
              + Add Service Area
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {(provider?.service_areas || []).map((a) => (
              <div
                key={a.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{a.area_name}</h4>
                  <p className="text-xs text-slate-500">
                    {a.city} — PIN: <span className="font-mono">{a.postal_code}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveArea(a.id)}
                  className="p-2 rounded-xl bg-red-50 text-red-600 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10. EARNINGS & PAYOUTS LEDGER */}
      {activeTab === 'earnings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Gross Booking Value"
              value={formatCurrencyExact(grossEarnings)}
              subtitle="Total Customer Payments"
              icon="IndianRupee"
              color="blue"
            />
            <StatCard
              title="Platform Commission (15%)"
              value={formatCurrencyExact(commissionDeducted)}
              subtitle="HomeServe Marketplace Fee"
              icon="CreditCard"
              color="amber"
            />
            <StatCard
              title="Net Partner Payout (85%)"
              value={formatCurrencyExact(netPayout)}
              subtitle="Settled to Bank Account"
              icon="Wallet"
              color="emerald"
            />
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <h3 className="text-base font-extrabold text-slate-900">
                Order-by-Order Settlement Breakdown
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase">
                  <tr>
                    <th className="py-3.5 px-4">Booking Ref</th>
                    <th className="py-3.5 px-4">Service</th>
                    <th className="py-3.5 px-4">Gross Amount</th>
                    <th className="py-3.5 px-4">15% Commission</th>
                    <th className="py-3.5 px-4">85% Net Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#2563EB]">
                        {b.booking_reference}
                      </td>
                      <td className="py-3.5 px-4">{b.service_name}</td>
                      <td className="py-3.5 px-4 font-bold">{formatCurrencyExact(b.total_amount)}</td>
                      <td className="py-3.5 px-4 text-red-600 font-semibold">
                        - {formatCurrencyExact(b.commission_amount)}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-emerald-700">
                        {formatCurrencyExact(b.provider_payout)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 11. CUSTOMER REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{r.customer_name}</span>
                  <span className="text-amber-500 font-bold text-xs">{'★'.repeat(r.rating)}</span>
                </div>
                <p className="text-xs text-slate-600">{r.comment}</p>
                {r.provider_response && (
                  <p className="text-xs text-[#2563EB] bg-blue-50 px-3 py-1.5 rounded-xl mt-2">
                    <strong>Your Reply:</strong> {r.provider_response}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRespondReview(r)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shrink-0 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Reply to Customer
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 12. SAAS SUBSCRIPTIONS */}
      {activeTab === 'subscriptions' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subscriptions.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <span className="px-3 py-1 rounded-full bg-blue-50 text-[#2563EB] text-xs font-bold">
                  {plan.badge}
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">{plan.name}</h3>
                <p className="text-3xl font-extrabold text-slate-900">
                  {formatCurrency(plan.price_monthly)}
                  <span className="text-xs font-normal text-slate-500"> / mo</span>
                </p>
                <ul className="space-y-2 text-xs text-slate-600 pt-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A]" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => toast.success(`Subscribed to ${plan.name} tier!`)}
                className="w-full py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-blue-700 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Crown className="w-4 h-4" /> Select {plan.name}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 13 & 14. NOTIFICATIONS & BUSINESS PROFILE */}
      {activeTab === 'notifications' && (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n.id} className="bg-white rounded-2xl p-4 border border-slate-200">
              <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
              <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 max-w-xl space-y-4">
          <h3 className="text-base font-extrabold text-slate-900">
            Verified Business Profile & KYC Details
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 font-bold uppercase block">Business Name</span>
              <span className="text-sm font-bold text-slate-900">{provider?.business_name}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 font-bold uppercase block">GSTIN / Trade License</span>
              <span className="text-sm font-mono font-bold text-slate-900">
                {provider?.license_number}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 font-bold uppercase block">Verification Status</span>
              <StatusBadge status={provider?.verification_status || 'verified'} />
            </div>
          </div>
        </div>
      )}

      <AssignTechnicianModal
        isOpen={Boolean(assignModalBooking)}
        onClose={() => setAssignModalBooking(null)}
        booking={assignModalBooking}
        onAssigned={async (updated) => {
          toast.success(`Technician ${updated.technician_name} assigned to ${updated.booking_reference}!`);
          setBookings(await bookingService.getBookings({ provider_id: providerId }));
        }}
      />
    </DashboardLayout>
  );
};

export default ProviderDashboard;
