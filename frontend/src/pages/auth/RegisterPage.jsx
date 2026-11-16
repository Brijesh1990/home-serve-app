import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Building2, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import { CITIES, DEFAULT_CATEGORIES } from '../../constants';
import { customerRegisterSchema, providerRegisterSchema } from '../../validations/schemas';
import { useAuth } from '../../hooks/useAuth';

export const RegisterPage = () => {
  const [tab, setTab] = useState('customer'); // customer | provider
  const { registerCustomer, registerProvider } = useAuth();
  const navigate = useNavigate();

  const customerForm = useForm({
    resolver: zodResolver(customerRegisterSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      city: 'Mumbai',
      password: '',
      confirm_password: '',
    },
  });

  const providerForm = useForm({
    resolver: zodResolver(providerRegisterSchema),
    defaultValues: {
      full_name: '',
      business_name: '',
      email: '',
      phone: '',
      category: 'AC & Appliance Repair',
      city: 'Mumbai',
      experience_years: 5,
      license_number: 'MH-GST-27AABCH2026Z1',
      password: '',
      confirm_password: '',
    },
  });

  const handleCustomerSubmit = async (values) => {
    try {
      await registerCustomer(values);
      toast.success('Customer account created! Redirecting to your dashboard.');
      navigate('/customer/dashboard');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    }
  };

  const handleProviderSubmit = async (values) => {
    try {
      await registerProvider(values);
      toast.success('Service Provider application submitted! Redirecting to Partner Hub.');
      navigate('/provider/dashboard');
    } catch (err) {
      toast.error(err.message || 'Provider registration failed');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0F172A] text-white p-6 sm:p-8 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#2563EB] flex items-center justify-center mx-auto mb-2">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold">Join HomeServe</h1>
          <p className="text-xs text-slate-400">
            Register as a Homeowner or apply as a Verified Service Partner
          </p>

          {/* Role Toggle Tabs */}
          <div className="grid grid-cols-2 gap-2 max-w-md mx-auto pt-4">
            <button
              type="button"
              onClick={() => setTab('customer')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
                tab === 'customer'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <User className="w-4 h-4" />
              Customer Account
            </button>
            <button
              type="button"
              onClick={() => setTab('provider')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
                tab === 'provider'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Service Provider Partner
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          {tab === 'customer' ? (
            <form
              onSubmit={customerForm.handleSubmit(handleCustomerSubmit)}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  {...customerForm.register('full_name')}
                  placeholder="Aarav Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
                {customerForm.formState.errors.full_name && (
                  <p className="text-xs text-red-600 mt-1">
                    {customerForm.formState.errors.full_name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  {...customerForm.register('email')}
                  placeholder="aarav@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
                {customerForm.formState.errors.email && (
                  <p className="text-xs text-red-600 mt-1">
                    {customerForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                <input
                  type="text"
                  {...customerForm.register('phone')}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
                {customerForm.formState.errors.phone && (
                  <p className="text-xs text-red-600 mt-1">
                    {customerForm.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                <select
                  {...customerForm.register('city')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                >
                  {CITIES.filter((c) => c !== 'All Cities').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  {...customerForm.register('password')}
                  placeholder="Min 8 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
                {customerForm.formState.errors.password && (
                  <p className="text-xs text-red-600 mt-1">
                    {customerForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  {...customerForm.register('confirm_password')}
                  placeholder="Confirm password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
                {customerForm.formState.errors.confirm_password && (
                  <p className="text-xs text-red-600 mt-1">
                    {customerForm.formState.errors.confirm_password.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2 pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-sm transition cursor-pointer"
                >
                  Create Customer Account
                </button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={providerForm.handleSubmit(handleProviderSubmit)}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Owner Name</label>
                <input
                  type="text"
                  {...providerForm.register('full_name')}
                  placeholder="Rajeshwari Nair"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
                {providerForm.formState.errors.full_name && (
                  <p className="text-xs text-red-600 mt-1">
                    {providerForm.formState.errors.full_name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Registered Business Name
                </label>
                <input
                  type="text"
                  {...providerForm.register('business_name')}
                  placeholder="Apex Home Solutions Pvt Ltd"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
                {providerForm.formState.errors.business_name && (
                  <p className="text-xs text-red-600 mt-1">
                    {providerForm.formState.errors.business_name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Business Email</label>
                <input
                  type="email"
                  {...providerForm.register('email')}
                  placeholder="partner@business.in"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Business Phone</label>
                <input
                  type="text"
                  {...providerForm.register('phone')}
                  placeholder="+91 98112 22334"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Service Specialization
                </label>
                <select
                  {...providerForm.register('category')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                >
                  {DEFAULT_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary City</label>
                <select
                  {...providerForm.register('city')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                >
                  {CITIES.filter((c) => c !== 'All Cities').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Years of Experience
                </label>
                <input
                  type="number"
                  {...providerForm.register('experience_years')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  GSTIN / Trade License Number
                </label>
                <input
                  type="text"
                  {...providerForm.register('license_number')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  {...providerForm.register('password')}
                  placeholder="Min 8 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  {...providerForm.register('confirm_password')}
                  placeholder="Confirm password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="sm:col-span-2 pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-sm transition cursor-pointer"
                >
                  Submit Partner Registration & Verification Request
                </button>
              </div>
            </form>
          )}

          <p className="text-xs text-center text-slate-500 mt-6">
            Already registered?{' '}
            <Link to="/login" className="text-[#2563EB] font-bold hover:underline">
              Sign In or Use 1-Click Demo Roles
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
