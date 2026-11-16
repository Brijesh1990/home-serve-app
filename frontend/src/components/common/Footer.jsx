import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Phone, Mail, MapPin, CheckCircle2 } from 'lucide-react';
import { BRAND } from '../../constants';

export const Footer = () => {
  return (
    <footer className="bg-[#0F172A] text-slate-300 pt-16 pb-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Column 1: Brand */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#6366F1] flex items-center justify-center text-white">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-extrabold text-white">
                  Home<span className="text-[#3B82F6]">Serve</span>
                </span>
                <p className="text-xs text-slate-400">{BRAND.tagline}</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              India’s trusted multi-role Home Services Booking SaaS platform connecting homeowners with background-verified service providers and skilled field technicians across 8+ metro cities.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="inline-flex items-center gap-1.5 text-xs bg-slate-800/90 text-emerald-400 px-3 py-1.5 rounded-lg border border-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> ₹10,000 Damage Protection
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs bg-slate-800/90 text-amber-400 px-3 py-1.5 rounded-lg border border-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Background Checked Pros
              </span>
            </div>
          </div>

          {/* Column 2: Top Categories */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Popular Categories
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/services?category=AC+%26+Appliance+Repair" className="hover:text-white transition">
                  AC & Appliance Repair
                </Link>
              </li>
              <li>
                <Link to="/services?category=Home+Cleaning" className="hover:text-white transition">
                  Full Home Deep Cleaning
                </Link>
              </li>
              <li>
                <Link to="/services?category=Plumbing" className="hover:text-white transition">
                  Plumbing & Waterproofing
                </Link>
              </li>
              <li>
                <Link to="/services?category=Electrical" className="hover:text-white transition">
                  Electrical & MCB Setup
                </Link>
              </li>
              <li>
                <Link to="/services?category=Pest+Control" className="hover:text-white transition">
                  Herbal Pest Control
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Role Portals */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              SaaS Role Portals
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/login" className="hover:text-white transition">
                  Super Admin Console
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition">
                  Customer Self-Service Portal
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition">
                  Service Provider Hub
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition">
                  Field Technician App
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-[#F59E0B] hover:underline font-medium">
                  Register as Service Partner
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Contact & GST Info
            </h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#3B82F6] shrink-0 mt-1" />
                <span>{BRAND.headquarters}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#3B82F6] shrink-0" />
                <span>{BRAND.supportPhone}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#3B82F6] shrink-0" />
                <span>{BRAND.supportEmail}</span>
              </li>
              <li className="text-xs text-slate-500 pt-1">
                GSTIN: <span className="font-mono text-slate-300">{BRAND.gstin}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {BRAND.fullName}. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Razorpay PCI-DSS Secured</span>
            <span>ISO 9001:2015 Certified</span>
            <span>18% GST Compliant Invoicing</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
