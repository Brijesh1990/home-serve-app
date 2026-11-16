import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import {
  CheckCircle2,
  XCircle,
  Navigation,
  Play,
  Camera,
  MapPin,
  Phone,
  Clock,
  ExternalLink,
} from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { bookingService } from '../../services/bookingService';
import { technicianService } from '../../services/technicianService';
import { notificationService } from '../../services/notificationService';
import { formatCurrencyExact } from '../../utils/formatters';

export const TechnicianDashboard = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || 'Ramesh Kulkarni',
    phone: user?.phone || '+91 97654 88990',
    specialization: user?.specialization || 'AC & Electrical Master Tech',
  });

  const loadTechData = async () => {
    const [bkg, notif] = await Promise.all([
      bookingService.getBookings(),
      notificationService.getNotifications(),
    ]);
    setBookings(bkg);
    setNotifications(notif);
  };

  useEffect(() => {
    loadTechData();
  }, []);

  // 5-Step Field Technician Workflow Handler
  const handleStatusTransition = async (booking, nextStatus) => {
    const updated = await technicianService.updateAssignmentStatus(booking.id, {
      status: nextStatus,
    });
    toast.success(`Job ${booking.booking_reference} updated to "${nextStatus}"!`);
    setBookings(await bookingService.getBookings());
    return updated;
  };

  const handleUploadBeforeAfterPhotos = async (booking) => {
    const { value: formValues } = await Swal.fire({
      title: `Upload Service Photos & Remarks (${booking.booking_reference})`,
      html: `
        <div class="text-left space-y-3 text-xs">
          <label class="block font-bold">Before Service Photo URL</label>
          <input id="swal-before" type="url" value="${
            booking.before_image_url ||
            'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=500&q=80'
          }" class="swal2-input !m-0 !w-full !text-xs" />
          <label class="block font-bold mt-2">After Service Photo URL</label>
          <input id="swal-after" type="url" value="${
            booking.after_image_url ||
            'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=500&q=80'
          }" class="swal2-input !m-0 !w-full !text-xs" />
          <label class="block font-bold mt-2">Field Completion Remarks</label>
          <textarea id="swal-remarks" rows="3" class="swal2-textarea !m-0 !w-full !text-xs" placeholder="Tested amp draw, cleaned filters, customer satisfied...">${
            booking.completion_remarks ||
            'Completed full checklist inspection and servicing. Verified zero leaks.'
          }</textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#2563EB',
      confirmButtonText: 'Save Photos & Remarks',
      preConfirm: () => ({
        before_image_url: document.getElementById('swal-before').value,
        after_image_url: document.getElementById('swal-after').value,
        completion_remarks: document.getElementById('swal-remarks').value,
      }),
    });

    if (formValues) {
      await bookingService.uploadServiceImages(booking.id, formValues);
      toast.success('Before/After service photos & remarks saved!');
      setBookings(await bookingService.getBookings());
    }
  };

  const handleCompleteJob = async (booking) => {
    await technicianService.updateAssignmentStatus(booking.id, {
      status: 'Completed',
      completion_remarks:
        booking.completion_remarks ||
        'Service completed according to HomeServe SOP. Customer signed off.',
    });
    toast.success(`Job ${booking.booking_reference} marked Completed!`);
    setBookings(await bookingService.getBookings());
  };

  const activeJobs = bookings.filter((b) =>
    ['Assigned', 'Accepted', 'Arrived', 'In Progress', 'Confirmed'].includes(b.status)
  );
  const completedJobs = bookings.filter((b) => b.status === 'Completed');

  const renderFieldJobCards = (list) => (
    <div className="space-y-5">
      {list.map((job) => (
        <div
          key={job.id}
          className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-extrabold text-[#2563EB]">
                  {job.booking_reference}
                </span>
                <StatusBadge status={job.status} />
                <StatusBadge status={job.payment_status} />
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
                {job.service_name}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>
                  {job.scheduled_date} • <strong>{job.time_slot}</strong>
                </span>
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400 uppercase font-bold block">Job Value</span>
              <span className="text-lg font-extrabold text-slate-900">
                {formatCurrencyExact(job.total_amount)}
              </span>
            </div>
          </div>

          {/* Customer & Problem Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <p className="font-bold text-slate-400 uppercase">Customer & Doorstep Location</p>
              <p className="text-sm font-bold text-slate-900">{job.customer_name}</p>
              <p className="text-slate-600 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#2563EB]" /> {job.customer_phone}
              </p>
              <p className="text-slate-600 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#2563EB] shrink-0 mt-0.5" />
                <span>
                  {job.address_line}, {job.city} - {job.postal_code}
                </span>
              </p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${job.address_line}, ${job.city}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#2563EB] font-bold hover:underline pt-1"
              >
                Open in Google Maps <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-1.5">
              <p className="font-bold text-[#2563EB] uppercase">Reported Issue & Timestamps</p>
              <p className="text-slate-700 leading-relaxed">{job.problem_description}</p>
              <div className="pt-2 flex flex-wrap gap-3 text-[11px] text-slate-500">
                {job.arrival_time && <span>✓ Arrived: {job.arrival_time}</span>}
                {job.start_time && <span>✓ Started: {job.start_time}</span>}
                {job.completion_time && <span>✓ Completed: {job.completion_time}</span>}
              </div>
              {job.completion_remarks && (
                <p className="text-emerald-800 bg-emerald-50 p-2 rounded-lg mt-1 font-medium">
                  Remarks: {job.completion_remarks}
                </p>
              )}
            </div>
          </div>

          {/* 5-Step Field Action Buttons */}
          {job.status !== 'Completed' && job.status !== 'Cancelled' && (
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              {/* Step 1: Accept / Reject */}
              {['Assigned', 'Confirmed'].includes(job.status) && (
                <>
                  <button
                    type="button"
                    onClick={() => handleStatusTransition(job, 'Accepted')}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#16A34A] text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> 1. Accept Assigned Job
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusTransition(job, 'Rejected')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </>
              )}

              {/* Step 2: Mark Arrival */}
              {['Assigned', 'Accepted'].includes(job.status) && (
                <button
                  type="button"
                  onClick={() => handleStatusTransition(job, 'Arrived')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 cursor-pointer"
                >
                  <Navigation className="w-4 h-4" /> 2. Mark Arrival at Location
                </button>
              )}

              {/* Step 3: Start Service */}
              {['Accepted', 'Arrived'].includes(job.status) && (
                <button
                  type="button"
                  onClick={() => handleStatusTransition(job, 'In Progress')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
                >
                  <Play className="w-4 h-4" /> 3. Start Service Execution
                </button>
              )}

              {/* Step 4: Upload Before/After Photos */}
              <button
                type="button"
                onClick={() => handleUploadBeforeAfterPhotos(job)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold hover:bg-amber-100 cursor-pointer"
              >
                <Camera className="w-4 h-4" /> 4. Upload Before/After Photos & Notes
              </button>

              {/* Step 5: Complete Service */}
              <button
                type="button"
                onClick={() => handleCompleteJob(job)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#16A34A] text-white text-xs font-bold hover:bg-emerald-700 shadow-sm cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" /> 5. Complete Service
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <DashboardLayout
      role="technician"
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      title={`Field Technician: ${user?.full_name || 'Ramesh Kulkarni'}`}
      subtitle="End-to-End Field Job Execution: Accept, Mark Arrival, Start, Upload Photos & Complete"
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
    >
      {/* 1. DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Assigned Jobs"
              value={activeJobs.length}
              subtitle="Active Dispatch Queue"
              icon="ClipboardList"
              color="blue"
            />
            <StatCard
              title="Today's Visits"
              value={bookings.filter((b) => b.scheduled_date === '2026-11-16').length || 2}
              subtitle="Scheduled Today"
              icon="Calendar"
              color="indigo"
            />
            <StatCard
              title="Completed Jobs"
              value={completedJobs.length + 340}
              subtitle="99.4% Customer Satisfaction"
              icon="CheckCircle2"
              color="emerald"
            />
            <StatCard
              title="Technician Rating"
              value="★ 4.9"
              subtitle="Top Rated HVAC Specialist"
              icon="Star"
              color="amber"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">
              Active Field Assignments (5-Step Execution Workflow)
            </h3>
            {renderFieldJobCards(activeJobs)}
          </div>
        </div>
      )}

      {/* 2, 3, 4. ASSIGNED / TODAY / UPCOMING */}
      {(activeTab === 'assigned' || activeTab === 'today' || activeTab === 'upcoming') &&
        renderFieldJobCards(activeJobs)}

      {/* 5. JOB HISTORY */}
      {activeTab === 'history' && renderFieldJobCards(completedJobs)}

      {/* 6. CUSTOMER & LOCATIONS */}
      {activeTab === 'customers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 space-y-2.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[#2563EB]">{b.booking_reference}</span>
                <StatusBadge status={b.status} />
              </div>
              <h4 className="text-sm font-extrabold text-slate-900">{b.customer_name}</h4>
              <p className="text-slate-600">Phone: {b.customer_phone}</p>
              <p className="text-slate-600">
                Address: {b.address_line}, {b.city} - {b.postal_code}
              </p>
              <p className="text-slate-500 italic">Issue: "{b.problem_description}"</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${b.address_line}, ${b.city}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#2563EB] font-bold hover:underline pt-1"
              >
                Navigate with Google Maps <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      )}

      {/* 7. NOTIFICATIONS */}
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

      {/* 8. PROFILE */}
      {activeTab === 'profile' && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await updateProfile(profileForm);
            toast.success('Technician profile updated!');
          }}
          className="bg-white rounded-3xl p-6 border border-slate-200 max-w-lg space-y-4"
        >
          <h3 className="text-base font-extrabold text-slate-900">Field Technician Profile</h3>
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
            <label className="block text-xs font-bold text-slate-700 mb-1">Specialization</label>
            <input
              type="text"
              value={profileForm.specialization}
              onChange={(e) =>
                setProfileForm({ ...profileForm, specialization: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
          >
            Save Changes
          </button>
        </form>
      )}
    </DashboardLayout>
  );
};

export default TechnicianDashboard;
