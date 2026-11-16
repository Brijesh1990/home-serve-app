import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Clock, Star, MapPin, ArrowRight } from 'lucide-react';
import { CITIES } from '../../constants';
import { serviceService } from '../../services/serviceService';
import { formatCurrency, formatDuration } from '../../utils/formatters';
import EmptyState from '../../components/common/EmptyState';

export const ServicesListingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category_id') || '0'
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || 'All Cities');
  const [maxPrice, setMaxPrice] = useState(5000);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => {
    serviceService.getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    setLoading(true);
    serviceService
      .getServices({
        category_id: selectedCategory !== '0' ? selectedCategory : undefined,
        search: searchQuery,
        city: selectedCity,
        max_price: maxPrice,
        min_rating: minRating,
        sort: sortBy,
      })
      .then((res) => {
        setServices(res);
        setLoading(false);
      });
  }, [selectedCategory, searchQuery, selectedCity, maxPrice, minRating, sortBy]);

  const handleResetFilters = () => {
    setSelectedCategory('0');
    setSearchQuery('');
    setSelectedCity('All Cities');
    setMaxPrice(5000);
    setMinRating(0);
    setSortBy('popular');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#F59E0B]">
            HomeServe Verified Catalog
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            Explore Professional Home Services
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Standardized upfront pricing • 30-day warranty • Instant online slot confirmation
          </p>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2 bg-white rounded-2xl p-2 w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search AC, Plumber, Cleaning, RO..."
            className="w-full text-xs sm:text-sm text-slate-800 focus:outline-none"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={() => setSelectedCategory('0')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            selectedCategory === '0'
              ? 'bg-[#2563EB] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Categories ({categories.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(String(cat.id))}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              String(selectedCategory) === String(cat.id)
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Filters + Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Filters */}
        <aside className="lg:col-span-3 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-sm font-extrabold text-slate-900">Filter Services</h3>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
            >
              Reset
            </button>
          </div>

          {/* City Filter */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Operating City</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#2563EB]"
            >
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Max Price Range */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-700">Max Price</span>
              <span className="text-[#2563EB]">{formatCurrency(maxPrice)}</span>
            </div>
            <input
              type="range"
              min={299}
              max={5000}
              step={100}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[#2563EB] cursor-pointer"
            />
          </div>

          {/* Minimum Rating */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Minimum Rating</label>
            <div className="grid grid-cols-3 gap-2">
              {[0, 4.5, 4.8].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setMinRating(r)}
                  className={`py-1.5 px-2 rounded-xl border text-xs font-bold cursor-pointer ${
                    minRating === r
                      ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {r === 0 ? 'Any' : `${r}+ ★`}
                </button>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Sort Results</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </aside>

        {/* Services Cards */}
        <div className="lg:col-span-9">
          {loading ? (
            <div className="text-center py-16 text-sm text-slate-500">Loading services...</div>
          ) : services.length === 0 ? (
            <EmptyState
              title="No matching services found"
              description="Try clearing your search keyword or expanding the maximum price slider."
              actionLabel="Reset All Filters"
              onAction={handleResetFilters}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((service) => (
                <div
                  key={service.id}
                  data-aos="fade-up"
                  className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-lg transition flex flex-col"
                >
                  <div className="relative h-48">
                    <img
                      src={service.image}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900/80 text-white text-[11px] font-bold">
                      {service.category_name}
                    </span>
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-extrabold">
                      ★ {service.rating} ({service.reviews_count})
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#2563EB]" /> {service.city || 'All Metro Cities'}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatDuration(service.duration_minutes)}
                        </span>
                      </div>
                      <Link
                        to={`/services/${service.id}`}
                        className="text-base font-extrabold text-slate-900 hover:text-[#2563EB] transition"
                      >
                        {service.name}
                      </Link>
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                        {service.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-xl font-extrabold text-slate-900">
                          {formatCurrency(service.discount_price || service.base_price)}
                        </span>
                        {service.discount_price < service.base_price && (
                          <span className="text-xs text-slate-400 line-through ml-1.5">
                            {formatCurrency(service.base_price)}
                          </span>
                        )}
                        <p className="text-[10px] text-emerald-600 font-semibold">
                          ✓ Includes 30-day warranty
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          to={`/services/${service.id}`}
                          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          View Details
                        </Link>
                        <Link
                          to={`/checkout?serviceId=${service.id}`}
                          className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
                        >
                          Book <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServicesListingPage;
