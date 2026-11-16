import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  ShieldCheck,
  BadgeCheck,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { TIME_SLOTS } from '../../constants';
import { serviceService } from '../../services/serviceService';
import { providerService } from '../../services/providerService';
import { analyticsService } from '../../services/analyticsService';
import { formatCurrency, formatDuration } from '../../utils/formatters';

export const ServiceDetailsPage = () => {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [providers, setProviders] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    serviceService.getServiceById(id || 1).then(setService);
    providerService.getProviders({ status: 'verified' }).then(setProviders);
    analyticsService.getReviews().then(setReviews);
  }, [id]);

  if (!service) {
    return <div className="py-20 text-center text-sm text-slate-500">Loading service details...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Breadcrumb */}
      <div className="text-xs font-semibold text-slate-500 flex items-center gap-2">
        <Link to="/" className="hover:text-[#2563EB]">Home</Link>
        <span>/</span>
        <Link to="/services" className="hover:text-[#2563EB]">Services</Link>
        <span>/</span>
        <span className="text-slate-900 font-bold">{service.name}</span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 Cols */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs">
            <img
              src={service.image}
              alt={service.name}
              className="w-full h-72 sm:h-96 object-cover"
            />
            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-blue-50 text-[#2563EB] text-xs font-bold">
                  {service.category_name}
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {service.rating} ({service.reviews_count} verified reviews)
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {formatDuration(service.duration_minutes)}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {service.name}
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">{service.description}</p>
            </div>
          </div>

          {/* Inclusions & Exclusions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-emerald-200/80 shadow-xs space-y-3">
              <h3 className="text-sm font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#16A34A]" /> What's Included
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-700">
                {(service.inclusions || [
                  'Complete diagnostic inspection & servicing',
                  'Background-verified & certified field technician',
                  '30-day post-service HomeServe warranty',
                ]).map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-red-200/80 shadow-xs space-y-3">
              <h3 className="text-sm font-extrabold text-red-800 uppercase tracking-wider flex items-center gap-2">
                <XCircle className="w-5 h-5 text-[#DC2626]" /> What's Excluded
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-700">
                {(service.exclusions || [
                  'Spare parts or hardware replacements (billed at transparent MRP)',
                  'Major civil or masonry structural modifications',
                ]).map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Available Verified Providers */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">
              Verified Service Providers Offering This Package
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {providers.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={p.avatar}
                      alt={p.business_name}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div>
                      <p className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
                        {p.business_name}
                        <BadgeCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                      </p>
                      <p className="text-[11px] text-slate-500">
                        ★ {p.rating} • {p.completed_jobs} jobs
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/checkout?serviceId=${service.id}&providerId=${p.id}`}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 text-[#2563EB] text-xs font-bold hover:bg-blue-100"
                  >
                    Select
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Reviews */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Verified Customer Reviews</h3>
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{rev.customer_name}</span>
                    <span className="text-xs font-extrabold text-amber-500">
                      {'★'.repeat(rev.rating)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                  {rev.provider_response && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                      <strong className="text-[#2563EB]">Partner Response:</strong> {rev.provider_response}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 4 Cols Sticky Booking Box */}
        <aside className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-lg sticky top-24 space-y-5">
          <div className="pb-4 border-b border-slate-100 flex items-baseline justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Package Price</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-extrabold text-slate-900">
                  {formatCurrency(service.discount_price || service.base_price)}
                </span>
                {service.discount_price < service.base_price && (
                  <span className="text-sm text-slate-400 line-through">
                    {formatCurrency(service.base_price)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">+ 18% GST applicable at checkout</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
              Save {formatCurrency(service.base_price - (service.discount_price || service.base_price))}
            </span>
          </div>

          {/* Live Slot Availability Preview */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#2563EB]" /> Today's Available Time Slots
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {TIME_SLOTS.slice(0, 4).map((slot) => (
                <div
                  key={slot}
                  className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-between"
                >
                  <span>{slot}</span>
                  <span className="text-[10px] font-bold text-emerald-600">Available</span>
                </div>
              ))}
            </div>
          </div>

          <Link
            to={`/checkout?serviceId=${service.id}`}
            className="w-full py-3.5 rounded-2xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition"
          >
            <span>Book This Service Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
              HomeServe Protection Included
            </div>
            <p className="text-[11px] leading-relaxed">
              30-day unconditional rework guarantee + ₹10,000 damage insurance + verified technician ID tracking.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ServiceDetailsPage;
