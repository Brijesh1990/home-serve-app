import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck, Lock, Mail, Zap, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { BRAND, DEMO_CREDENTIALS } from '../../constants';
import { loginSchema } from '../../validations/schemas';
import { useAuth } from '../../hooks/useAuth';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, getRoleDashboardPath } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'customer@homeserve.com',
      password: 'Password@123',
    },
  });

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const user = await login(values);
      toast.success(`Welcome back, ${user.full_name || user.email}!`);
      navigate(getRoleDashboardPath(user.role));
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async (demo) => {
    setValue('email', demo.email);
    setValue('password', demo.password);
    setSubmitting(true);
    try {
      const user = await login({ email: demo.email, password: demo.password });
      toast.success(`Signed in as ${demo.label} (${user.full_name})`);
      navigate(demo.redirect);
    } catch (err) {
      toast.error(err.message || 'Demo login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Left 6 Cols: 1-Click Demo Role Switcher */}
        <div className="lg:col-span-6 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#1D4ED8] text-white p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold">
              <Zap className="w-3.5 h-3.5" /> 1-Click Evaluator Sandbox
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
              Explore All 4 Role Dashboards Instantly
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Click any role card below to sign in with pre-configured demo credentials and test the complete multi-tenant workflow.
            </p>
          </div>

          <div className="space-y-3">
            {DEMO_CREDENTIALS.map((demo) => (
              <button
                key={demo.role}
                type="button"
                disabled={submitting}
                onClick={() => handleQuickDemoLogin(demo)}
                className="w-full text-left p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 transition flex items-center justify-between gap-3 group cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-white">
                      {demo.label}
                    </span>
                    <span className="text-[11px] font-mono text-amber-300">
                      {demo.email}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{demo.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition shrink-0" />
              </button>
            ))}
          </div>

          <p className="text-[11px] text-slate-400">
            Default Password for all demo accounts: <code className="text-amber-300 font-bold">Password@123</code>
          </p>
        </div>

        {/* Right 6 Cols: Standard Login Form */}
        <div className="lg:col-span-6 p-8 sm:p-10 flex flex-col justify-center space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Sign In to {BRAND.name}</h2>
              <p className="text-xs text-slate-500">{BRAND.tagline}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  {...register('email')}
                  placeholder="you@homeserve.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-[#2563EB]"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-[#2563EB] hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-[#2563EB]"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-sm shadow-md transition cursor-pointer"
            >
              {submitting ? 'Signing In...' : 'Sign In to Workspace'}
            </button>
          </form>

          <p className="text-xs text-center text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#2563EB] font-bold hover:underline">
              Create Customer or Service Partner Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
