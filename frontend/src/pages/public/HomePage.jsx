import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import * as Icons from 'lucide-react';
import { toast } from 'react-toastify';
import { BRAND, CITIES, DEMO_CREDENTIALS } from '../../constants';
import { setSelectedCity } from '../../store';
import { serviceService } from '../../services/serviceService';
import { providerService } from '../../services/providerService';
import { formatCurrency, formatDuration } from '../../utils/formatters';

export const HomePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const selectedCity = useSelector((state) => state.ui.selectedCity);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [openFaq, setOpenFaq] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');

  useEffect(() => {
    serviceService.getCategories().then(setCategories);
    serviceService.getServices().then((list) => setServices(list.slice(0, 6)));
    providerService.getProviders({ status: 'verified' }).then((list) => setProviders(list.slice(0, 4)));
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchKeyword.trim()) params.set('search', searchKeyword.trim());
    if (selectedCity && selectedCity !== 'All Cities') params.set('city', selectedCity);
    navigate(`/services?${params.toString()}`);
  };

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (!newsletterEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    toast.success(`Subscribed ${newsletterEmail}! Check your inbox for code WELCOME20.`);
    setNewsletterEmail('');
  };

  const faqs = [
    {
      q: 'How does HomeServe verify service providers and field technicians?',
      a: 'Every service provider on HomeServe undergoes a strict 5-point onboarding verification including GST/Trade license check, Aadhaar/PAN verification, criminal background screening, and technical trade skill evaluation.',
    },
    {
      q: 'What is covered under the ₹10,000 HomeServe Service Guarantee?',
      a: 'All bookings paid through HomeServe include a 30-day post-service workmanship warranty and up to ₹10,000 protection against accidental property damage during service execution.',
    },
    {
      q: 'Can I reschedule or cancel my appointment without penalty?',
      a: 'Yes! You can reschedule or cancel your booking free of charge up to 2 hours before the scheduled time slot directly from your Customer Dashboard.',
    },
    {
      q: 'Do I receive an official GST invoice for my booking?',
      a: 'Absolutely. Every completed or prepaid booking automatically generates a downloadable 18% GST-compliant tax invoice (CGST 9% + SGST 9%) with SAC code 998519.',
    },
  ];

  return (
    <div className="space-y-20 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#1D4ED8] text-white pt-16 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6" data-aos="fade-right">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-amber-300">
                <Icons.Sparkles className="w-4 h-4 text-[#F59E0B]" />
                <span>{BRAND.name} • "{BRAND.tagline}"</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12]">
                Trusted Home Services <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-[#F59E0B]">
                  at Your Fingertips
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Book background-verified AC technicians, licensed electricians, master plumbers, deep cleaners, and carpenters with transparent upfront pricing and 30-day service warranty.
              </p>

              {/* Search Bar */}
              <form
                onSubmit={handleHeroSearch}
                className="bg-white p-2.5 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-2xl"
              >
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl sm:w-44 shrink-0">
                  <Icons.MapPin className="w-4 h-4 text-[#2563EB] shrink-0" />
                  <select
                    aria-label="Select City"
                    value={selectedCity}
                    onChange={(e) => dispatch(setSelectedCity(e.target.value))}
                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none w-full cursor-pointer"
                  >
                    {CITIES.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 px-3 py-2 flex-1">
                  <Icons.Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Search 'AC Foam Jet', 'Deep Cleaning', 'Plumber'..."
                    className="w-full text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-3.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-bold transition shadow-md cursor-pointer shrink-0"
                >
                  Book a Service
                </button>
              </form>

              {/* Quick Role Demo Pills */}
              <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400 font-medium">Instant Role Portals:</span>
                {DEMO_CREDENTIALS.map((role) => (
                  <Link
                    key={role.role}
                    to="/login"
                    className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold transition border border-white/15"
                  >
                    {role.label} →
                  </Link>
                ))}
              </div>
            </div>

            {/* Hero Right Visual Cards */}
            <div className="lg:col-span-5" data-aos="fade-left">
              <div className="relative bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-5 shadow-2xl space-y-4">
                <img
                  src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80"
                  alt="HomeServe Verified Technician"
                  className="w-full h-64 object-cover rounded-2xl"
                />
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/10">
                    <p className="text-xl font-extrabold text-[#F59E0B]">4.9 ★</p>
                    <p className="text-[11px] text-slate-300">Customer Rating</p>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/10">
                    <p className="text-xl font-extrabold text-emerald-400">50,000+</p>
                    <p className="text-[11px] text-slate-300">Homes Served</p>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/10">
                    <p className="text-xl font-extrabold text-blue-400">₹10K</p>
                    <p className="text-[11px] text-slate-300">Service Protection</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. POPULAR 10 SERVICE CATEGORIES GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#2563EB]">
              Explore 10 Specialized Verticals
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Popular Home Service Categories
            </h2>
          </div>
          <Link
            to="/services"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2563EB] hover:underline"
          >
            View All Services <Icons.ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat, idx) => {
            const IconComp = Icons[cat.icon] || Icons.Wrench;
            return (
              <Link
                key={cat.id}
                to={`/services?category_id=${cat.id}`}
                data-aos="fade-up"
                data-aos-delay={idx * 40}
                className="group bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-[#2563EB]/40 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${
                      cat.color || 'from-blue-500 to-indigo-600'
                    } text-white flex items-center justify-center shadow-sm mb-4 group-hover:scale-105 transition`}
                  >
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#2563EB] transition">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{cat.description}</p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-slate-500">{cat.service_count || 10}+ Services</span>
                  <span className="text-[#2563EB]">From ₹{cat.starting_price || 249}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. FEATURED SERVICES GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#6366F1]">
              Most Booked Packages
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Featured Doorstep Services
            </h2>
          </div>
          <Link
            to="/services"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2563EB] hover:underline"
          >
            Browse Complete Catalog <Icons.ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, idx) => (
            <div
              key={service.id}
              data-aos="fade-up"
              data-aos-delay={idx * 60}
              className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-full object-cover hover:scale-105 transition duration-500"
                />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold">
                  {service.category_name}
                </span>
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1">
                  ★ {service.rating} ({service.reviews_count})
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <Link
                    to={`/services/${service.id}`}
                    className="text-base font-extrabold text-slate-900 hover:text-[#2563EB] transition line-clamp-1"
                  >
                    {service.name}
                  </Link>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                    {service.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-extrabold text-slate-900">
                        {formatCurrency(service.discount_price || service.base_price)}
                      </span>
                      {service.discount_price && service.discount_price < service.base_price && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatCurrency(service.base_price)}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Icons.Clock className="w-3 h-3" /> {formatDuration(service.duration_minutes)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/services/${service.id}`}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Details
                    </Link>
                    <Link
                      to={`/checkout?serviceId=${service.id}`}
                      className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. HOW IT WORKS 4-STEP WORKFLOW */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#F59E0B]">
              Seamless 4-Step Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">
              How HomeServe Works
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              From instant slot verification to field technician arrival and GST invoicing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Choose Service & Slot',
                desc: 'Select from 10+ categories with upfront pricing and live provider slot availability check.',
                icon: 'Search',
              },
              {
                step: '02',
                title: 'Provider Confirms & Assigns',
                desc: 'Your verified service provider confirms the order and dispatches a specialized field technician.',
                icon: 'UserCheck',
              },
              {
                step: '03',
                title: 'Doorstep Execution',
                desc: 'Technician arrives on time, logs before/after photos, and completes the job with precision.',
                icon: 'Wrench',
              },
              {
                step: '04',
                title: 'Pay & Get GST Invoice',
                desc: 'Pay securely via Razorpay UPI/Card and download your official 18% GST tax invoice.',
                icon: 'FileCheck2',
              },
            ].map((item, idx) => {
              const IconComp = Icons[item.icon] || Icons.CheckCircle2;
              return (
                <div
                  key={item.step}
                  data-aos="zoom-in"
                  data-aos-delay={idx * 80}
                  className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 relative"
                >
                  <span className="text-3xl font-black text-blue-400/30 absolute top-4 right-5">
                    {item.step}
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center mb-4">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. FEATURED VERIFIED PROVIDERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">
              100% Background & License Checked
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Top Verified Service Providers
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {providers.map((provider, idx) => (
            <div
              key={provider.id}
              data-aos="fade-up"
              data-aos-delay={idx * 60}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-lg transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={provider.avatar}
                    alt={provider.business_name}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                  />
                  <div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                      <Icons.BadgeCheck className="w-3 h-3" /> Verified Partner
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-900 mt-1 line-clamp-1">
                      {provider.business_name}
                    </h3>
                    <p className="text-xs text-slate-500">{provider.city} • {provider.experience_years} yrs exp</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 mb-4">{provider.bio}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs">
                  <span className="font-extrabold text-amber-600">★ {provider.rating}</span>
                  <span className="text-slate-400 ml-1">({provider.completed_jobs} jobs)</span>
                </div>
                <Link
                  to={`/providers/${provider.id}`}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 text-[#2563EB] text-xs font-bold hover:bg-blue-100 transition"
                >
                  View Profile →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. WHY CHOOSE HOMESERVE & FAQ ACCORDION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-5 bg-gradient-to-br from-[#2563EB] to-[#6366F1] text-white rounded-3xl p-8 space-y-6">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
            The HomeServe Promise
          </span>
          <h3 className="text-2xl font-extrabold leading-snug">
            Why 50,000+ Indian Households Trust HomeServe
          </h3>
          <div className="space-y-4">
            {[
              { title: '₹10,000 Service Protection Guarantee', desc: 'Full coverage against accidental damage during service delivery.' },
              { title: 'Transparent Upfront Pricing', desc: 'Standardized rate card with 18% GST tax invoice and zero hidden charges.' },
              { title: 'Background-Checked Technicians', desc: 'Police-verified & trade-certified field professionals.' },
              { title: 'Dedicated 24/7 Dispute Resolution', desc: 'Raise a ticket anytime from your dashboard for priority SLA resolution.' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <Icons.CheckCircle2 className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold">{item.title}</h4>
                  <p className="text-xs text-blue-100 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="lg:col-span-7 space-y-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#2563EB]">
              Got Questions?
            </span>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={faq.q}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 hover:bg-slate-50 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <Icons.ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform ${
                      openFaq === idx ? 'rotate-180 text-[#2563EB]' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Newsletter Box */}
          <form
            onSubmit={handleNewsletter}
            className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6"
          >
            <div>
              <h4 className="text-sm font-bold">Get Festive Coupons & Home Care Tips</h4>
              <p className="text-xs text-slate-400">Instant ₹250 OFF voucher on subscribing</p>
            </div>
            <div className="flex w-full sm:w-auto gap-2">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email..."
                className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none w-full sm:w-52"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#F59E0B] text-slate-950 text-xs font-extrabold hover:bg-amber-400 transition cursor-pointer shrink-0"
              >
                Subscribe
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
