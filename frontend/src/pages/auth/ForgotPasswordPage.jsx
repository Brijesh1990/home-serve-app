import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, KeyRound, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { authService } from '../../services/authService';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [sentInfo, setSentInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    const res = await authService.forgotPassword(email);
    setSentInfo(res);
    toast.success('Password reset instructions generated!');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg space-y-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
          <KeyRound className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Forgot Your Password?</h1>
          <p className="text-xs text-slate-500 mt-1">
            Enter your registered email to receive a password reset token.
          </p>
        </div>

        {sentInfo ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3 text-xs text-emerald-900">
            <p className="font-bold">{sentInfo.message}</p>
            <Link
              to={`/reset-password?token=${sentInfo.reset_token || 'HS-RESET-2026'}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] text-white font-bold"
            >
              Proceed to Reset Password <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@homeserve.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
            >
              Send Reset Link
            </button>
          </form>
        )}

        <p className="text-xs text-center text-slate-500">
          Remembered your password?{' '}
          <Link to="/login" className="text-[#2563EB] font-bold hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
