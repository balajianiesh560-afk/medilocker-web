import React, { useState } from 'react';
import {
  Stethoscope,
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  KeyRound,
  CheckCircle2,
  X,
  HelpCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

const PRESET_HOSPITALS = [
  'St. Jude Memorial Trauma Center',
  'Metropolitan General Hospital',
  'University Health Science Center',
  'Harborview Regional Hospital',
];

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@hospital.com');
  const [password, setPassword] = useState('admin123');
  const [hospitalName, setHospitalName] = useState('St. Jude Memorial Trauma Center');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotHospital, setForgotHospital] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotStatus, setForgotStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.login(email.trim(), password.trim(), hospitalName.trim());
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.message || 'Invalid email or password.');
      }
    } catch (err: any) {
      setError(err?.message || 'Login connection failed. Please verify credentials or network.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@hospital.com');
    setPassword('admin123');
    setHospitalName('St. Jude Memorial Trauma Center');
    setError(null);
  };

  const openForgotPasswordModal = () => {
    setForgotEmail(email || 'admin@hospital.com');
    setForgotHospital(hospitalName || 'St. Jude Memorial Trauma Center');
    setForgotNewPassword('');
    setForgotStatus(null);
    setShowForgotModal(true);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotStatus({ type: 'error', message: 'Please enter your registered staff email address.' });
      return;
    }

    setIsResetting(true);
    setForgotStatus(null);

    try {
      const targetPassword = forgotNewPassword.trim() || 'admin123';
      const res = await api.forgotPassword(forgotEmail.trim(), targetPassword, forgotHospital.trim());
      if (res.success) {
        setForgotStatus({
          type: 'success',
          message: res.message || `Password successfully reset to '${targetPassword}'!`,
        });
        // Auto-sync into main form
        setEmail(forgotEmail.trim());
        setPassword(targetPassword);
        if (forgotHospital.trim()) {
          setHospitalName(forgotHospital.trim());
        }
      } else {
        setForgotStatus({ type: 'error', message: res.message || 'Password reset failed.' });
      }
    } catch (err: any) {
      setForgotStatus({
        type: 'error',
        message: err?.message || 'Could not reset password. Please try again.',
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-sky-500 text-white shadow-xl shadow-sky-500/20 mb-4 ring-8 ring-slate-800/80">
            <Stethoscope className="w-9 h-9 stroke-[2.2]" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">MediLocker</h1>
            <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30">
              AI
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-2 font-medium">
            Authorized Hospital Staff Emergency Identification Portal
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-700/80 p-8 shadow-2xl space-y-6">
          <div className="border-b border-slate-700/80 pb-4">
            <h2 className="text-lg font-bold text-white tracking-tight">Staff Authentication</h2>
            <p className="text-xs text-slate-400 mt-1">
              Secure clinical access for emergency triage, biometric cross-referencing, and case management.
            </p>
          </div>

          {error && (
            <div
              id="login-error-alert"
              className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hospital Name Option */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300" htmlFor="hospital-name-input">
                  Hospital / Facility Name
                </label>
                <span className="text-[11px] text-slate-400 font-normal">Registered Facility</span>
              </div>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="hospital-name-input"
                  type="text"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  placeholder="e.g. St. Jude Memorial Trauma Center"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-colors"
                />
              </div>

              {/* Quick Preset Hospital Pills */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {PRESET_HOSPITALS.map((hosp) => (
                  <button
                    key={hosp}
                    type="button"
                    onClick={() => setHospitalName(hosp)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer border ${
                      hospitalName === hosp
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                        : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                    title={hosp}
                  >
                    {hosp.split(' ')[0]} {hosp.split(' ')[1] || ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="email-input">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@hospital.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-colors"
                />
              </div>
            </div>

            {/* Password with View Option & Forgot Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300" htmlFor="password-input">
                  Access Password
                </label>
                <button
                  id="forgot-password-btn"
                  type="button"
                  onClick={openForgotPasswordModal}
                  className="text-xs text-sky-400 hover:text-sky-300 transition-colors font-medium cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-colors"
                />
                {/* Password Visibility Toggle */}
                <button
                  id="toggle-password-visibility-btn"
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer p-1"
                  title={showPassword ? 'Hide password' : 'View password'}
                  aria-label={showPassword ? 'Hide password' : 'View password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-500 hover:to-sky-500 text-white font-bold text-sm shadow-lg shadow-sky-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'Verifying Credentials...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Demo Login Credentials Box */}
          <div className="pt-2 border-t border-slate-700/80">
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>Demo Hospital Credentials</span>
                </div>
                <button
                  id="demo-fill-btn"
                  type="button"
                  onClick={handleFillDemo}
                  className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 underline cursor-pointer"
                >
                  Auto-Fill Demo
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-1">
                <div>
                  <span className="text-slate-500 block">Email:</span>
                  <span className="text-teal-300">admin@hospital.com</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Password:</span>
                  <span className="text-teal-300">admin123</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-1.5">
                Facility: <span className="text-slate-400 font-sans">{hospitalName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-500 mt-6">
          MediLocker AI • Built for Healthcare Hackathon • HIPAA Compliance Architecture
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          id="forgot-password-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 text-slate-100 space-y-5 relative">
            <div className="flex items-start justify-between border-b border-slate-700/80 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Reset Staff Password</h3>
                  <p className="text-xs text-slate-400">Emergency Care Clinician Recovery</p>
                </div>
              </div>
              <button
                id="close-forgot-modal-btn"
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  forgotStatus.type === 'success'
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                }`}
              >
                {forgotStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                )}
                <div className="flex-1 leading-relaxed font-medium">{forgotStatus.message}</div>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="forgot-email-input">
                  Registered Staff Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="forgot-email-input"
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="admin@hospital.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="forgot-hospital-input">
                  Hospital Facility (Optional)
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="forgot-hospital-input"
                    type="text"
                    value={forgotHospital}
                    onChange={(e) => setForgotHospital(e.target.value)}
                    placeholder="e.g. St. Jude Memorial Trauma Center"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300" htmlFor="forgot-new-password-input">
                    New Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotNewPassword('admin123')}
                    className="text-[11px] text-teal-400 hover:text-teal-300 cursor-pointer font-medium"
                  >
                    Set Default (admin123)
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="forgot-new-password-input"
                    type={showForgotNewPassword ? 'text' : 'password'}
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="Enter new password (min 4 characters)"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowForgotNewPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                    title={showForgotNewPassword ? 'Hide password' : 'View password'}
                  >
                    {showForgotNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="reset-password-confirm-btn"
                  type="submit"
                  disabled={isResetting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-md shadow-teal-600/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isResetting ? 'Updating...' : 'Reset & Apply'}
                </button>
              </div>
            </form>

            <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1 text-slate-300 font-semibold">
                <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
                <span>Default Recovery Credential</span>
              </div>
              <p>
                Staff accounts can always be restored with master credential <span className="font-mono text-teal-300">admin123</span> for email <span className="font-mono text-teal-300">admin@hospital.com</span>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
