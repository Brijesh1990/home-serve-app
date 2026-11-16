import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BadgeCheck,
  MapPin,
  Clock,
  Star,
  Heart,
  ShieldCheck,
  Briefcase,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { providerService } from '../../services/providerService';
import { serviceService } from '../../services/serviceService';
import { customerService } from '../../services/customerService';
import { analyticsService } from '../../services/analyticsService';
import { formatCurrency, formatDuration } from '../../utils/formatters';

export const ProviderDetailsPage = () => {
  const { id } = useParams();
  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isFavorite, setIsFavorite] = useState(true);

  useEffect(() => {
    providerService.getProviderById(id || 1).then(setProvider);
    serviceService.getServices().then((list) => setServices(list.slice(0, 4)));
    analyticsService.getReviews().then(setReviews);
  }, [id]);

  const handleToggleFavorite = async () => {
    const res = await customerService.toggleFavorite(provider?.id || 1);
    setIsFavorite(res.is_favorite);
    toast.success(
      res.is_favorite
        ? `${provider?.business_name} saved to your Favorite Providers!`
        : `Removed from Favorites`
    );
  };

  if (!provider) {
    return <div className="py-20 text-center text-sm text-slate-500">Loading provider profile...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Provider Hero Card */}
      <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xs">
        <div className="h-44 bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#2563EB] relative" />
        <div className="px-6 sm:px-8 pb-8 -mt-14 relative flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            <img
              src={provider.avatar}
              alt={provider.business_name}
              className="w-28 h-28 rounded-3xl object-cover border-4 border-white shadow-lg bg-white"
            />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                  <BadgeCheck className="w-4 h-4" /> HomeServe Verified Partner
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-bold">
                  {provider.subscription_plan || 'Enterprise'} Partner
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {provider.business_name}
              </h1>
              <p className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#2563EB]" /> {provider.city}
                </span>
                <span>•</span>
                <span>{provider.experience_years} Years Experience</span>
                <span>•</span>
                <span className="font-mono">License: {provider.license_number}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleFavorite}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                isFavorite
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              {isFavorite ? 'Saved in Favorites' : 'Save Partner'}
            </button>
            <Link
              to={`/checkout?providerId=${provider.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
            >
              Book Directly <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 text-center">
          <p className="text-2xl font-extrabold text-amber-500">★ {provider.rating}</p>
          <p className="text-xs text-slate-500">{provider.reviews_count} Customer Reviews</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 text-center">
          <p className="text-2xl font-extrabold text-[#2563EB]">{provider.completed_jobs}+</p>
          <p className="text-xs text-slate-500">Completed Bookings</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 text-center">
          <p className="text-2xl font-extrabold text-emerald-600">99.2%</p>
          <p className="text-xs text-slate-500">On-Time Arrival SLA</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 text-center">
          <p className="text-2xl font-extrabold text-purple-600">₹10,000</p>
          <p className="text-xs text-slate-500">Service Warranty Cover</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8 Cols: Services Offered & Reviews */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-3">
            <h2 className="text-base font-extrabold text-slate-900">About {provider.business_name}</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{provider.bio}</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#2563EB]" /> Services Offered by {provider.business_name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col justify-between gap-4 hover:shadow-md transition"
                >
                  <div>
                    <span className="text-[10px] font-bold text-[#2563EB] uppercase">
                      {s.category_name}
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">{s.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{s.description}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-base font-extrabold text-slate-900">
                        {formatCurrency(s.discount_price || s.base_price)}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {formatDuration(s.duration_minutes)}
                      </span>
                    </div>
                    <Link
                      to={`/checkout?serviceId=${s.id}&providerId=${provider.id}`}
                      className="px-3.5 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-blue-700"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Recent Customer Feedback</h3>
            {reviews.map((r) => (
              <div key={r.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{r.customer_name}</span>
                  <span className="text-amber-500 font-bold">{'★'.repeat(r.rating)}</span>
                </div>
                <p className="text-xs text-slate-600">{r.comment}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right 4 Cols: Service Areas & Working Hours */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#2563EB]" /> Covered Service Areas & PIN Codes
            </h3>
            <div className="space-y-2">
              {(provider.service_areas || []).map((area) => (
                <div
                  key={area.id}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                >
                  <span className="font-semibold text-slate-800">{area.area_name}</span>
                  <span className="font-mono text-slate-500">{area.postal_code}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#2563EB]" /> Weekly Operating Hours
            </h3>
            <div className="space-y-2 text-xs">
              {(provider.working_hours || []).map((wh) => (
                <div key={wh.day} className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="font-semibold text-slate-700">{wh.day}</span>
                  <span className="text-emerald-700 font-bold">
                    {wh.is_closed ? 'Closed' : `${wh.open} - ${wh.close}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ProviderDetailsPage;
