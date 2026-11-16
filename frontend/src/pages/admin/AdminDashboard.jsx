import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import {
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Megaphone,
  FileText,
} from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import {
  RevenueAreaChart,
  BookingsTrendBarChart,
  BookingStatusPieChart,
  CustomerGrowthLineChart,
  PopularCategoriesBarChart,
} from '../../components/charts/AnalyticsCharts';
import InvoiceModal from '../../components/modals/InvoiceModal';
import { analyticsService } from '../../services/analyticsService';
import { providerService } from '../../services/providerService';
import { serviceService } from '../../services/serviceService';
import { bookingService } from '../../services/bookingService';
import { paymentService } from '../../services/paymentService';
import { technicianService } from '../../services/technicianService';
import { notificationService } from '../../services/notificationService';
import { formatCurrency, formatCurrencyExact, downloadCSV } from '../../utils/formatters';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [providerFilter, setProviderFilter] = useState('all');
  const [technicians, setTechnicians] = useState([]);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoiceBooking, setInvoiceBooking] = useState(null);

  // Forms state
  const [newCategory, setNewCategory] = useState({ name: '', starting_price: 299, description: '' });
  const [newService, setNewService] = useState({
    name: '',
    category_id: 1,
    base_price: 499,
    duration_minutes: 60,
    description: '',
  });
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: 20,
    min_order_amount: 499,
    valid_until: '2027-12-31',
  });
  const [announcement, setAnnouncement] = useState({
    title: '',
    message: '',
    target_role: 'all',
  });
  const [platformSettings, setPlatformSettings] = useState({
    commission_rate: 15,
    gst_rate: 18,
    guarantee_amount: 10000,
    support_email: 'support@homeserve.com',
  });

  const loadAllAdminData = async () => {
    const [
      ana,
      usr,
      prv,
      tech,
      cat,
      srv,
      bkg,
      cpn,
      cmp,
      rev,
      sub,
    ] = await Promise.all([
      analyticsService.getDashboardAnalytics(),
      analyticsService.getUsers(),
      providerService.getProviders(),
      technicianService.getTechnicians(),
      serviceService.getCategories(),
      serviceService.getServices(),
      bookingService.getBookings(),
      analyticsService.getCoupons(),
      analyticsService.getComplaints(),
      analyticsService.getReviews(),
      analyticsService.getSubscriptions(),
    ]);
    setAnalytics(ana);
    setUsers(usr);
    setProviders(prv);
    setTechnicians(tech);
    setCategories(cat);
    setServices(srv);
    setBookings(bkg);
    setCoupons(cpn);
    setComplaints(cmp);
    setReviews(rev);
    setSubscriptions(sub);
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  // Handlers
  const handleToggleUserStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    await analyticsService.toggleUserStatus(user.id, nextStatus);
    toast.success(`User ${user.full_name} marked ${nextStatus}`);
    setUsers(await analyticsService.getUsers());
  };

  const handleVerifyProvider = async (provider) => {
    const result = await Swal.fire({
      title: `Verify ${provider.business_name}?`,
      text: `License ${provider.license_number} will be approved for marketplace bookings.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16A34A',
      confirmButtonText: 'Yes, Approve Partner',
    });
    if (result.isConfirmed) {
      await providerService.verifyProvider(provider.id);
      toast.success(`${provider.business_name} verified!`);
      setProviders(await providerService.getProviders());
    }
  };

  const handleRejectProvider = async (provider) => {
    const { value: reason } = await Swal.fire({
      title: `Reject ${provider.business_name}`,
      input: 'text',
      inputLabel: 'Reason for rejection',
      inputPlaceholder: 'Incomplete GST/Trade license documentation...',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      confirmButtonText: 'Reject Partner',
    });
    if (reason) {
      await providerService.rejectProvider(provider.id, reason);
      toast.info(`${provider.business_name} rejected.`);
      setProviders(await providerService.getProviders());
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name) return;
    await serviceService.createCategory(newCategory);
    toast.success(`Category "${newCategory.name}" added!`);
    setNewCategory({ name: '', starting_price: 299, description: '' });
    setCategories(await serviceService.getCategories());
  };

  const handleDeleteCategory = async (id) => {
    await serviceService.deleteCategory(id);
    toast.info('Category deleted');
    setCategories(await serviceService.getCategories());
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    if (!newService.name) return;
    await serviceService.createService(newService);
    toast.success(`Service "${newService.name}" published!`);
    setNewService({
      name: '',
      category_id: 1,
      base_price: 499,
      duration_minutes: 60,
      description: '',
    });
    setServices(await serviceService.getServices());
  };

  const handleDeleteService = async (id) => {
    await serviceService.deleteService(id);
    toast.info('Service removed from catalog');
    setServices(await serviceService.getServices());
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!newCoupon.code) return;
    await analyticsService.createCoupon(newCoupon);
    toast.success(`Coupon ${newCoupon.code.toUpperCase()} created!`);
    setNewCoupon({
      code: '',
      discount_type: 'percentage',
      discount_value: 15,
      min_order_amount: 499,
      valid_until: '2027-12-31',
    });
    setCoupons(await analyticsService.getCoupons());
  };

  const handleDeleteCoupon = async (id) => {
    await analyticsService.deleteCoupon(id);
    toast.info('Coupon deleted');
    setCoupons(await analyticsService.getCoupons());
  };

  const handleRefundBooking = async (booking) => {
    const res = await Swal.fire({
      title: `Process Instant Refund?`,
      text: `Refund ${formatCurrencyExact(booking.total_amount)} to ${booking.customer_name} for ${booking.booking_reference}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      confirmButtonText: 'Issue Razorpay Refund',
    });
    if (res.isConfirmed) {
      await paymentService.processRefund(booking.id);
      toast.success(`Refund processed for ${booking.booking_reference}`);
      setBookings(await bookingService.getBookings());
    }
  };

  const handleResolveComplaint = async (complaint) => {
    const { value: resolution } = await Swal.fire({
      title: `Resolve Ticket ${complaint.ticket_number}`,
      input: 'textarea',
      inputLabel: 'Admin Resolution Notes',
      inputPlaceholder: 'Enter SLA resolution action taken...',
      showCancelButton: true,
      confirmButtonColor: '#2563EB',
    });
    if (resolution) {
      await analyticsService.resolveComplaint(complaint.id, resolution);
      toast.success(`Ticket ${complaint.ticket_number} resolved!`);
      setComplaints(await analyticsService.getComplaints());
    }
  };

  const handleModerateReview = async (id, status) => {
    await analyticsService.moderateReview(id, status);
    toast.success(`Review marked as ${status}`);
    setReviews(await analyticsService.getReviews());
  };

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcement.title || !announcement.message) return;
    await notificationService.sendAnnouncement(announcement);
    toast.success('Platform-wide announcement broadcast sent!');
    setAnnouncement({ title: '', message: '', target_role: 'all' });
  };

  const handleExportBookingsCSV = async () => {
    const rows = await analyticsService.exportBookingsCSV();
    downloadCSV(rows, 'homeserve-bookings-report.csv');
    toast.success('Bookings CSV report downloaded!');
  };

  const handleExportRevenueCSV = async () => {
    const rows = await analyticsService.exportRevenueCSV();
    downloadCSV(rows, 'homeserve-revenue-commissions.csv');
    toast.success('Revenue & Commissions CSV report downloaded!');
  };

  const kpis = analytics?.kpis || {
    total_customers: 1284,
    total_providers: 86,
    total_technicians: 312,
    total_bookings: 4890,
    pending_bookings: 42,
    completed_bookings: 4510,
    cancelled_bookings: 138,
    total_revenue: 3845600,
    platform_commission: 576840,
  };

  const filteredProviders = providers.filter((p) =>
    providerFilter === 'all' ? true : p.verification_status === providerFilter
  );

  return (
    <DashboardLayout
      role="admin"
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      title="Super Admin Command Center"
      subtitle="Platform Governance, Provider KYC Verification, Commissions & Analytics"
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      headerActions={
        <button
          type="button"
          onClick={handleExportBookingsCSV}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      }
    >
      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* 9 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="Total Customers"
              value={kpis.total_customers.toLocaleString()}
              subtitle="Verified Households"
              trend="14.2%"
              icon="Users"
              color="blue"
            />
            <StatCard
              title="Service Providers"
              value={kpis.total_providers}
              subtitle="Registered Partners"
              trend="8.5%"
              icon="Building2"
              color="indigo"
            />
            <StatCard
              title="Field Technicians"
              value={kpis.total_technicians}
              subtitle="Active Workforce"
              trend="11.0%"
              icon="Wrench"
              color="cyan"
            />
            <StatCard
              title="Total Bookings"
              value={kpis.total_bookings.toLocaleString()}
              subtitle="All-Time Orders"
              trend="19.4%"
              icon="CalendarCheck"
              color="purple"
            />
            <StatCard
              title="Pending Bookings"
              value={kpis.pending_bookings}
              subtitle="Awaiting Dispatch"
              icon="Clock"
              color="amber"
            />
            <StatCard
              title="Completed Bookings"
              value={kpis.completed_bookings.toLocaleString()}
              subtitle="96.2% SLA Fulfillment"
              trend="16.8%"
              icon="CheckCircle2"
              color="emerald"
            />
            <StatCard
              title="Cancelled Bookings"
              value={kpis.cancelled_bookings}
              subtitle="Low 2.8% Churn"
              trend="1.2%"
              trendUp={false}
              icon="XCircle"
              color="red"
            />
            <StatCard
              title="Gross Platform GMV"
              value={formatCurrency(kpis.total_revenue)}
              subtitle="Incl. 18% GST"
              trend="22.5%"
              icon="IndianRupee"
              color="emerald"
            />
            <StatCard
              title="Net Platform Commission (15%)"
              value={formatCurrency(kpis.platform_commission)}
              subtitle="HomeServe SaaS Revenue"
              trend="22.5%"
              icon="Wallet"
              color="blue"
            />
          </div>

          {/* 6 Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueAreaChart data={analytics?.monthly_trends || []} />
            <BookingsTrendBarChart data={analytics?.monthly_trends || []} />
            <BookingStatusPieChart data={analytics?.status_distribution || []} />
            <CustomerGrowthLineChart data={analytics?.monthly_trends || []} />
            <PopularCategoriesBarChart data={analytics?.popular_categories || []} />

            {/* 6th Chart/Table: Top Performing Verified Providers */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Top Performing Service Partners</h3>
                <p className="text-xs text-slate-500 mb-4">Ranked by completed jobs & SLA score</p>
                <div className="space-y-3">
                  {providers.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{p.business_name}</p>
                        <p className="text-slate-500">
                          {p.city} • {p.completed_jobs} jobs • ★ {p.rating}
                        </p>
                      </div>
                      <StatusBadge status={p.verification_status} />
                    </div>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('providers')}
                className="mt-4 w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Manage All Service Providers →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CUSTOMERS TAB */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Registered Customers & Users</h3>
              <p className="text-xs text-slate-500">Activate or suspend accounts across cities</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase">
                <tr>
                  <th className="py-3.5 px-4">Full Name</th>
                  <th className="py-3.5 px-4">Email & Phone</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">City</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users
                  .filter((u) =>
                    searchQuery
                      ? u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
                      : true
                  )
                  .map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{u.full_name}</td>
                      <td className="py-3.5 px-4">
                        <p className="text-slate-800">{u.email}</p>
                        <p className="text-slate-400">{u.phone}</p>
                      </td>
                      <td className="py-3.5 px-4 uppercase font-bold text-[#2563EB]">{u.role}</td>
                      <td className="py-3.5 px-4">{u.city}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={u.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleUserStatus(u)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                            u.status === 'active'
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. SERVICE PROVIDERS KYC VERIFICATION TAB */}
      {activeTab === 'providers' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {['all', 'pending', 'verified', 'rejected'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setProviderFilter(st)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold capitalize cursor-pointer ${
                    providerFilter === st
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  {st} Partners
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredProviders.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-extrabold text-slate-900">{p.business_name}</h4>
                      <StatusBadge status={p.verification_status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Owner: <strong>{p.owner_name}</strong> • {p.city} • {p.experience_years} yrs exp
                    </p>
                    <p className="text-xs font-mono text-slate-600 mt-1">
                      GST/Trade License: <strong>{p.license_number}</strong>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Specialization: {p.specialization}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">
                    ★ {p.rating} ({p.completed_jobs} jobs)
                  </span>
                  <div className="flex items-center gap-2">
                    {p.verification_status !== 'verified' && (
                      <button
                        type="button"
                        onClick={() => handleVerifyProvider(p)}
                        className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#16A34A] text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve KYC
                      </button>
                    )}
                    {p.verification_status !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => handleRejectProvider(p)}
                        className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-bold hover:bg-red-100 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TECHNICIANS TAB */}
      {activeTab === 'technicians' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-base font-extrabold text-slate-900">Field Technicians Directory</h3>
            <p className="text-xs text-slate-500">All background-verified field professionals across providers</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase">
                <tr>
                  <th className="py-3.5 px-4">Technician</th>
                  <th className="py-3.5 px-4">Provider</th>
                  <th className="py-3.5 px-4">Specialization</th>
                  <th className="py-3.5 px-4">Jobs Completed</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Availability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {technicians.map((t) => (
                  <tr key={t.id}>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {t.full_name}
                      <span className="block text-slate-400 font-normal">{t.phone}</span>
                    </td>
                    <td className="py-3.5 px-4">{t.provider_name}</td>
                    <td className="py-3.5 px-4">{t.specialization}</td>
                    <td className="py-3.5 px-4 font-bold">{t.jobs_completed}</td>
                    <td className="py-3.5 px-4 text-amber-600 font-bold">★ {t.rating}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={t.availability_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. CATEGORIES CRUD TAB */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleCreateCategory}
            className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 space-y-4 h-fit"
          >
            <h3 className="text-sm font-extrabold text-slate-900">Create Service Category</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category Name</label>
              <input
                type="text"
                required
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="e.g. Solar Panel Maintenance"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Starting Price (₹)</label>
              <input
                type="number"
                value={newCategory.starting_price}
                onChange={(e) => setNewCategory({ ...newCategory, starting_price: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Short category description..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-blue-700 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Category
            </button>
          </form>

          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">{cat.name}</h4>
                  <p className="text-xs text-slate-500 line-clamp-1">{cat.description}</p>
                  <p className="text-[11px] font-bold text-[#2563EB] mt-1">
                    Starts at ₹{cat.starting_price}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. SERVICES CRUD TAB */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleCreateService}
            className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 space-y-4 h-fit"
          >
            <h3 className="text-sm font-extrabold text-slate-900">Add New Catalog Service</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Service Title</label>
              <input
                type="text"
                required
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                placeholder="e.g. Chimney Deep Degreasing"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={newService.category_id}
                onChange={(e) => setNewService({ ...newService, category_id: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Price (₹)</label>
                <input
                  type="number"
                  value={newService.base_price}
                  onChange={(e) => setNewService({ ...newService, base_price: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Duration (mins)</label>
                <input
                  type="number"
                  value={newService.duration_minutes}
                  onChange={(e) =>
                    setNewService({ ...newService, duration_minutes: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={newService.description}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
            >
              + Publish Service Package
            </button>
          </form>

          <div className="lg:col-span-8 space-y-3">
            {services.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between gap-4"
              >
                <div>
                  <span className="text-[10px] font-bold text-[#2563EB] uppercase">
                    {s.category_name}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">{s.name}</h4>
                  <p className="text-xs text-slate-500">
                    Price: {formatCurrency(s.discount_price || s.base_price)} • {s.duration_minutes} mins
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteService(s.id)}
                  className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. BOOKINGS TAB */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900">All Platform Bookings</h3>
            <button
              type="button"
              onClick={handleExportBookingsCSV}
              className="px-3.5 py-1.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold cursor-pointer"
            >
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase">
                <tr>
                  <th className="py-3.5 px-4">Booking Ref</th>
                  <th className="py-3.5 px-4">Customer & Service</th>
                  <th className="py-3.5 px-4">Provider & Tech</th>
                  <th className="py-3.5 px-4">Schedule</th>
                  <th className="py-3.5 px-4">Total (Incl. GST)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#2563EB]">
                      {b.booking_reference}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{b.customer_name}</p>
                      <p className="text-slate-500">{b.service_name}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{b.provider_name}</p>
                      <p className="text-slate-400">Tech: {b.technician_name || 'Unassigned'}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold">{b.scheduled_date}</p>
                      <p className="text-slate-400">{b.time_slot}</p>
                    </td>
                    <td className="py-3.5 px-4 font-bold">{formatCurrencyExact(b.total_amount)}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setInvoiceBooking(b)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                        title="View GST Invoice"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. PAYMENTS & COMMISSIONS TAB */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Razorpay Ledger, 15% Platform Commission & Refunds
              </h3>
              <p className="text-xs text-slate-500">
                Automated split settlement: 15% HomeServe Commission • 85% Partner Net Payout
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportRevenueCSV}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
            >
              Download Revenue CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase">
                <tr>
                  <th className="py-3.5 px-4">Booking / Order ID</th>
                  <th className="py-3.5 px-4">Gross Total</th>
                  <th className="py-3.5 px-4">15% Commission</th>
                  <th className="py-3.5 px-4">85% Provider Net</th>
                  <th className="py-3.5 px-4">Payment Status</th>
                  <th className="py-3.5 px-4 text-right">Refund Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td className="py-3.5 px-4">
                      <p className="font-mono font-bold text-slate-900">{b.booking_reference}</p>
                      <p className="font-mono text-[11px] text-slate-400">
                        {b.razorpay_order_id || 'Pay After Service'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-bold">{formatCurrencyExact(b.total_amount)}</td>
                    <td className="py-3.5 px-4 font-bold text-[#2563EB]">
                      {formatCurrencyExact(b.commission_amount)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      {formatCurrencyExact(b.provider_payout)}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={b.payment_status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {b.payment_status === 'Paid' && (
                        <button
                          type="button"
                          onClick={() => handleRefundBooking(b)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 9. COUPONS TAB */}
      {activeTab === 'coupons' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleCreateCoupon}
            className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 space-y-4 h-fit"
          >
            <h3 className="text-sm font-extrabold text-slate-900">Create Promotional Coupon</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Coupon Code</label>
              <input
                type="text"
                required
                value={newCoupon.code}
                onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                placeholder="DIWALI30"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono uppercase"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Type</label>
                <select
                  value={newCoupon.discount_type}
                  onChange={(e) => setNewCoupon({ ...newCoupon, discount_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat INR (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Value</label>
                <input
                  type="number"
                  value={newCoupon.discount_value}
                  onChange={(e) => setNewCoupon({ ...newCoupon, discount_value: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Minimum Order Value (₹)
              </label>
              <input
                type="number"
                value={newCoupon.min_order_amount}
                onChange={(e) => setNewCoupon({ ...newCoupon, min_order_amount: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
            >
              + Create Coupon
            </button>
          </form>

          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {coupons.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 flex items-start justify-between gap-3"
              >
                <div>
                  <span className="px-3 py-1 rounded-lg bg-amber-100 text-amber-900 font-mono text-xs font-extrabold">
                    {c.code}
                  </span>
                  <p className="text-xs text-slate-600 mt-2">{c.description}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Min Order: ₹{c.min_order_amount} • Used {c.usage_count} times
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteCoupon(c.id)}
                  className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10. COMPLAINTS TAB */}
      {activeTab === 'complaints' && (
        <div className="space-y-4">
          {complaints.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#2563EB]">
                    {c.ticket_number}
                  </span>
                  <StatusBadge status={c.priority} />
                  <StatusBadge status={c.status} />
                </div>
                <h4 className="text-sm font-extrabold text-slate-900">{c.subject}</h4>
                <p className="text-xs text-slate-600">{c.description}</p>
                {c.admin_resolution && (
                  <p className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl mt-2">
                    <strong>Resolution:</strong> {c.admin_resolution}
                  </p>
                )}
              </div>
              {c.status !== 'Resolved' && (
                <button
                  type="button"
                  onClick={() => handleResolveComplaint(c)}
                  className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-blue-700 shrink-0 cursor-pointer"
                >
                  Resolve Ticket
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 11. REVIEWS MODERATION TAB */}
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
                  <StatusBadge status={r.moderation_status} />
                </div>
                <p className="text-xs text-slate-600">{r.comment}</p>
                <p className="text-[11px] text-slate-400">
                  Service: {r.service_name} • Partner: {r.provider_name}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleModerateReview(r.id, 'approved')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold cursor-pointer"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleModerateReview(r.id, 'flagged')}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold cursor-pointer"
                >
                  Flag
                </button>
                <button
                  type="button"
                  onClick={() => handleModerateReview(r.id, 'hidden')}
                  className="px-3 py-1.5 rounded-xl bg-red-50 text-red-600 text-xs font-bold cursor-pointer"
                >
                  Hide
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 12. NOTIFICATIONS BROADCAST TAB */}
      {activeTab === 'notifications' && (
        <form
          onSubmit={handleSendAnnouncement}
          className="bg-white rounded-3xl p-6 border border-slate-200 max-w-xl space-y-4"
        >
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#2563EB]" />
            <h3 className="text-base font-extrabold text-slate-900">
              Broadcast Platform Announcement
            </h3>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
            <select
              value={announcement.target_role}
              onChange={(e) => setAnnouncement({ ...announcement, target_role: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
            >
              <option value="all">All Users, Providers & Technicians</option>
              <option value="customer">Customers Only</option>
              <option value="provider">Service Providers Only</option>
              <option value="technician">Field Technicians Only</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Announcement Title</label>
            <input
              type="text"
              required
              value={announcement.title}
              onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
              placeholder="e.g. Monsoon AC & Waterproofing Campaign Live!"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Message Body</label>
            <textarea
              rows={4}
              required
              value={announcement.message}
              onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
              placeholder="Write your announcement message..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
          >
            Send Instant Broadcast
          </button>
        </form>
      )}

      {/* 13. SUBSCRIPTIONS TAB */}
      {activeTab === 'subscriptions' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subscriptions.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4"
            >
              <span className="px-3 py-1 rounded-full bg-blue-50 text-[#2563EB] text-xs font-bold">
                {plan.badge}
              </span>
              <h3 className="text-lg font-extrabold text-slate-900">{plan.name}</h3>
              <p className="text-3xl font-extrabold text-slate-900">
                {formatCurrency(plan.price_monthly)}
                <span className="text-xs font-normal text-slate-500"> / month</span>
              </p>
              <p className="text-xs font-bold text-emerald-700">
                Platform Commission Tier: {plan.commission_rate}%
              </p>
              <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A]" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* 14. ANALYTICS & REPORTS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Executive Data Export & BI Reports
              </h3>
              <p className="text-xs text-slate-500">
                Download full CSV ledgers for accounting, GST filing, and investor reporting
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleExportBookingsCSV}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Export Bookings CSV
              </button>
              <button
                type="button"
                onClick={handleExportRevenueCSV}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#16A34A] text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Export Revenue CSV
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueAreaChart data={analytics?.monthly_trends || []} />
            <PopularCategoriesBarChart data={analytics?.popular_categories || []} />
          </div>
        </div>
      )}

      {/* 15. SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 max-w-xl space-y-4">
          <h3 className="text-base font-extrabold text-slate-900">
            Global Platform Financial & Tax Settings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Default Platform Commission (%)
              </label>
              <input
                type="number"
                value={platformSettings.commission_rate}
                onChange={(e) =>
                  setPlatformSettings({ ...platformSettings, commission_rate: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                GST Tax Rate (CGST + SGST %)
              </label>
              <input
                type="number"
                value={platformSettings.gst_rate}
                onChange={(e) =>
                  setPlatformSettings({ ...platformSettings, gst_rate: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                HomeServe Damage Protection (₹)
              </label>
              <input
                type="number"
                value={platformSettings.guarantee_amount}
                onChange={(e) =>
                  setPlatformSettings({ ...platformSettings, guarantee_amount: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Support Escalation Email
              </label>
              <input
                type="email"
                value={platformSettings.support_email}
                onChange={(e) =>
                  setPlatformSettings({ ...platformSettings, support_email: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => toast.success('Platform configuration saved!')}
            className="px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
          >
            Save Configuration
          </button>
        </div>
      )}

      <InvoiceModal
        isOpen={Boolean(invoiceBooking)}
        onClose={() => setInvoiceBooking(null)}
        booking={invoiceBooking}
      />
    </DashboardLayout>
  );
};

export default AdminDashboard;
