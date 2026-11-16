import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ShieldCheck,
  MapPin,
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Sparkles,
  CalendarPlus,
} from 'lucide-react';
import { BRAND, CITIES } from '../../constants';
import { setSelectedCity } from '../../store';
import { useAuth } from '../../hooks/useAuth';

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const selectedCity = useSelector((state) => state.ui.selectedCity);
  const { user, isAuthenticated, logout, getRoleDashboardPath } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top Promo Ribbon */}
      <div className="bg-[#0F172A] text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>
              <strong>{BRAND.name}:</strong> {BRAND.tagline} — Use code{' '}
              <span className="font-mono font-bold text-[#F59E0B]">WELCOME20</span> for flat 20% OFF!
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-slate-300">
            <span>24/7 Helpline: {BRAND.supportPhone}</span>
            <span>•</span>
            <Link to="/register" className="text-[#F59E0B] hover:underline font-medium">
              Become a Verified Service Partner →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#6366F1] flex items-center justify-center text-white shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Home<span className="text-[#2563EB]">Serve</span>
            </span>
            <p className="text-[10px] font-medium text-slate-500 -mt-1 hidden sm:block">
              {BRAND.tagline}
            </p>
          </div>
        </Link>

        {/* City Selector & Nav Links */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <MapPin className="w-4 h-4 text-[#2563EB]" />
            <select
              aria-label="Select City"
              value={selectedCity}
              onChange={(e) => dispatch(setSelectedCity(e.target.value))}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <nav className="flex items-center gap-5 text-sm font-semibold text-slate-600">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? 'text-[#2563EB]' : 'hover:text-slate-900 transition'
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/services"
              className={({ isActive }) =>
                isActive ? 'text-[#2563EB]' : 'hover:text-slate-900 transition'
              }
            >
              Explore Services
            </NavLink>
            <NavLink
              to="/providers/1"
              className={({ isActive }) =>
                isActive ? 'text-[#2563EB]' : 'hover:text-slate-900 transition'
              }
            >
              Verified Pros
            </NavLink>
            <NavLink
              to="/checkout"
              className={({ isActive }) =>
                isActive ? 'text-[#2563EB]' : 'hover:text-slate-900 transition'
              }
            >
              Instant Checkout
            </NavLink>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/checkout"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold hover:bg-amber-100 transition"
          >
            <CalendarPlus className="w-4 h-4 text-[#F59E0B]" />
            Book Now
          </Link>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Link
                to={getRoleDashboardPath()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-blue-700 transition shadow-xs"
              >
                <LayoutDashboard className="w-4 h-4" />
                {user.role?.toUpperCase()} Dashboard
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                title="Sign Out"
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
              >
                <User className="w-4 h-4" />
                Login / Demo Roles
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-blue-700 transition shadow-xs"
              >
                Sign Up Free
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-700"
          aria-label="Toggle Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-5 space-y-3">
          <div className="flex flex-col space-y-2 text-sm font-semibold text-slate-700">
            <Link to="/" onClick={() => setMobileOpen(false)} className="py-1.5">
              Home
            </Link>
            <Link to="/services" onClick={() => setMobileOpen(false)} className="py-1.5">
              Explore Services
            </Link>
            <Link to="/providers/1" onClick={() => setMobileOpen(false)} className="py-1.5">
              Verified Providers
            </Link>
            <Link to="/checkout" onClick={() => setMobileOpen(false)} className="py-1.5">
              Book a Service
            </Link>
          </div>
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {isAuthenticated && user ? (
              <>
                <Link
                  to={getRoleDashboardPath()}
                  onClick={() => setMobileOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-[#2563EB] text-white text-center text-xs font-bold"
                >
                  Go to {user.role?.toUpperCase()} Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="w-full py-2 rounded-xl border border-red-200 text-red-600 text-xs font-bold"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-center text-xs font-bold text-slate-800"
                >
                  Login / 1-Click Demo Roles
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-[#2563EB] text-white text-center text-xs font-bold"
                >
                  Register Account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
