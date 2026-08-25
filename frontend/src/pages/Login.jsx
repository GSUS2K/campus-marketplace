import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { requestJson } from '../lib/api';

const HOSTELS = ['BH1', 'BH2', 'BH3', 'BH4', 'BH5', 'BH6', 'BH7', 'BH8', 'BH9', 'BH10', 'Boys Studio', 'Day Scholar', 'GH1', 'GH2', 'GH3', 'GH4', 'GH5', 'GH6', 'Staff Residence'];
const DEMO_ACCOUNTS = [
  { label: 'Buyer', email: 'buyer@lpu.in' },
  { label: 'Seller', email: 'seller@lpu.in' },
  { label: 'Admin', email: 'admin@lpu.in' }
];

const Login = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    campusLocation: 'BH1',
    role: 'buyer',
    phone: '',
    otp: '',
    newPassword: ''
  });

  useEffect(() => {
    const savedEmail = localStorage.getItem('outfit_remembered_email');
    if (savedEmail) {
      setFormData((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fillDemoAccount = (email) => {
    setMode('login');
    setErrorMsg('');
    setSuccessMsg('Demo credentials filled. Click Authenticate to continue.');
    setFormData((prev) => ({ ...prev, email, password: 'password123' }));
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if ((mode === 'register' || mode === 'login' || mode === 'forgot' || mode === 'reset' || mode === 'verify' || mode === 'mobile-verify') && !/^[^\s@]+@lpu\.in$/i.test(formData.email.trim())) {
      setErrorMsg('Only @lpu.in accounts are allowed.');
      setIsLoading(false);
      return;
    }

    let endpoint = '/api/auth/login';
    let payload = { email: formData.email, password: formData.password };

    if (mode === 'register') {
      endpoint = '/api/auth/register';
      payload = { email: formData.email, password: formData.password, name: formData.name, campusLocation: formData.campusLocation, role: formData.role, phone: formData.phone || undefined };
    } else if (mode === 'verify') {
      endpoint = '/api/auth/verify-otp';
      payload = { email: formData.email, otp: formData.otp };
    } else if (mode === 'forgot') {
      endpoint = '/api/auth/password/request';
      payload = { email: formData.email };
    } else if (mode === 'mobile-verify') {
      endpoint = '/api/auth/mobile/verify';
      payload = { email: formData.email, otp: formData.otp };
    } else if (mode === 'reset') {
      endpoint = '/api/auth/password/reset';
      payload = { email: formData.email, otp: formData.otp, newPassword: formData.newPassword };
    }

    try {
      const { response: res, data } = await requestJson(endpoint, {
        method: mode === 'reset' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        if ((data.requiresMobileVerification || data.sellerApprovalRequired) && mode === 'login') {
          if (data.sellerApprovalRequired) { setSuccessMsg(data.msg || 'Seller access is waiting for admin approval.'); return; }
          const mobileRequest = await requestJson('/api/auth/mobile/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: formData.email }) });
          if (!mobileRequest.response.ok) throw new Error(mobileRequest.data.msg || 'Could not send mobile verification code.');
          setMode('mobile-verify');
          setSuccessMsg('A mobile verification code was sent.');
          return;
        }
        throw new Error(data.msg || data.errors?.[0]?.msg || 'Authentication failed');
      }

      if (mode === 'verify' && data.sellerApprovalRequired) {
        setMode('login'); setSuccessMsg('Email verified. Your seller access request is waiting for admin approval.');
      } else if (mode === 'verify' && data.requiresMobileVerification) {
        const mobileRequest = await requestJson('/api/auth/mobile/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: formData.email }) });
        if (!mobileRequest.response.ok) throw new Error(mobileRequest.data.msg || 'Could not send mobile verification code.');
        setMode('mobile-verify'); setSuccessMsg('Email verified. A mobile verification code was sent.');
      } else if (mode === 'mobile-verify' && data.sellerApprovalRequired) {
        setMode('login'); setSuccessMsg('Mobile verified. Your seller access request is waiting for admin approval.');
      } else if ((mode === 'login' || mode === 'verify' || mode === 'mobile-verify') && data.token) {
        if (rememberMe) {
          localStorage.setItem('outfit_remembered_email', formData.email);
        } else {
          localStorage.removeItem('outfit_remembered_email');
        }
        localStorage.setItem('trms_token', data.token);
        localStorage.setItem('trms_user', JSON.stringify(data.user));
        navigate('/');
      } else if (mode === 'reset') {
        setMode('login');
        setSuccessMsg('Password updated successfully. You may now authenticate.');
      } else if (mode === 'forgot') {
        setMode('reset');
        setSuccessMsg(`Reset PIN dispatched to ${formData.email}. Check inbox.`);
      } else {
        setFormData((prev) => ({ ...prev, otp: '' }));
        setMode('verify');
        setSuccessMsg(`OTP dispatched to ${formData.email}. Check your inbox and spam folder.`);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center px-4 py-10 font-sans">
      <div className="glass-panel w-full max-w-[560px] rounded-[2rem] p-6 sm:p-10 lg:p-12">
        <div className="mb-10">
          <h1 className="mb-3 text-4xl font-semibold tracking-[-0.07em] text-theme md:text-5xl">
            {mode === 'login' && 'ACCESS'}
            {mode === 'register' && 'JOIN'}
            {mode === 'verify' && 'CONFIRM'}
            {mode === 'forgot' && 'RECOVER'}
            {mode === 'reset' && 'RESET'}
          </h1>
          <p className="text-sm text-theme/55">
            {mode === 'login' && 'Return to the curation.'}
            {mode === 'register' && 'Exclusive access for academics.'}
            {mode === 'verify' && 'Identity validation.'}
            {mode === 'mobile-verify' && 'Mobile validation.'}
            {mode === 'forgot' && 'Transmit reset sequence.'}
            {mode === 'reset' && 'Establish new key.'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 w-full rounded-2xl border border-accent/50 bg-accent/10 p-4 text-center">
            <p className="font-bold text-[10px] leading-relaxed uppercase text-theme">{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 w-full rounded-2xl border border-theme/15 bg-theme/5 p-4 text-center">
            <p className="font-bold text-[11px] uppercase text-theme">{successMsg}</p>
          </div>
        )}

        <form className="w-full space-y-6" onSubmit={handleAuthSubmit}>
          {(mode === 'verify' || mode === 'mobile-verify' || mode === 'reset') ? (
            <div className="space-y-6">
              <input
                name="otp"
                type="text"
                required
                onChange={handleChange}
                maxLength={6}
                value={formData.otp}
                className="w-full bg-transparent border-b-[3px] border-theme py-4 text-center text-4xl tracking-[1em] font-black text-theme focus:outline-none transition-colors placeholder-theme/30"
                placeholder="------"
              />
              {mode === 'reset' && (
                <input
                  name="newPassword"
                  type="password"
                  required
                  onChange={handleChange}
                  value={formData.newPassword}
                  className="w-full bg-transparent border-b-[3px] border-theme py-4 font-bold text-[13px] uppercase text-theme focus:outline-none transition-colors placeholder-theme/30"
                  placeholder="New Security Key"
                />
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {mode === 'register' && (
                <div className="space-y-6">
                  <input
                    name="name"
                    type="text"
                    required
                    onChange={handleChange}
                    value={formData.name}
                    className="w-full bg-transparent border-b-[3px] border-theme py-4 font-bold text-[13px] uppercase text-theme focus:outline-none transition-colors placeholder-theme/30"
                  placeholder="Full Name"
                  />

                  <input
                    name="phone"
                    type="tel"
                    pattern="\\+[1-9][0-9]{7,14}"
                    onChange={handleChange}
                    value={formData.phone}
                    className="w-full bg-transparent border-b-[3px] border-theme py-4 font-bold text-[13px] uppercase text-theme focus:outline-none transition-colors placeholder-theme/30"
                    placeholder="Mobile (+91...) · optional"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <select
                      name="campusLocation"
                      value={formData.campusLocation}
                      onChange={handleChange}
                      className="w-full bg-transparent border-b-[3px] border-theme py-4 font-bold text-[13px] uppercase text-theme focus:outline-none appearance-none cursor-pointer"
                    >
                      {HOSTELS.map((h) => <option key={h} value={h} className="bg-bg text-theme">{h}</option>)}
                    </select>

                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full bg-transparent border-b-[3px] border-theme py-4 font-bold text-[13px] uppercase text-theme focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="buyer" className="bg-bg text-theme">Buyer</option>
                      <option value="seller" className="bg-bg text-theme">Seller</option>
                    </select>
                  </div>
                </div>
              )}

              <input
                name="email"
                type="email"
                required
                onChange={handleChange}
                value={formData.email}
                className="w-full bg-transparent border-b-[3px] border-theme py-4 font-bold text-[13px] uppercase text-theme focus:outline-none transition-colors placeholder-theme/30"
                placeholder="Email (@lpu.in)"
              />

              {mode !== 'forgot' && (
                <div className="relative">
                  <input
                    name="password"
                    type="password"
                    required
                    onChange={handleChange}
                    value={formData.password}
                    className="w-full bg-transparent border-b-[3px] border-theme py-4 font-bold text-[13px] uppercase text-theme focus:outline-none transition-colors placeholder-theme/30"
                    placeholder="Security Key"
                  />
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                      className="absolute right-0 top-4 font-bold text-[11px] uppercase opacity-50 hover:opacity-100 transition-opacity"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
              )}

              {mode === 'login' && (
                <label className="flex items-center gap-3 cursor-pointer mt-4 group w-max">
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-theme cursor-pointer"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="font-bold text-[12px] uppercase opacity-80 group-hover:opacity-100 transition-opacity text-theme">
                    Remember Me
                  </span>
                </label>
              )}
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-theme py-4 text-sm font-semibold text-bg transition hover:opacity-85 disabled:opacity-40"
            >
              {isLoading ? 'Processing...' :
                mode === 'login' ? 'Authenticate' :
                mode === 'register' ? 'Submit' :
                mode === 'forgot' ? 'Send Pin' :
                mode === 'reset' ? 'Update Key' :
                'Verify'}
            </button>
          </div>
        </form>

        {(mode !== 'verify' && mode !== 'mobile-verify' && mode !== 'reset') && (
          <div className="mt-8 border-t border-theme/10 pt-6 text-center">
            {mode === 'login' && <div className="mb-6 rounded-2xl border border-theme/10 bg-theme/5 p-4 text-left"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-theme/45">Presentation accounts</p><p className="mt-1 text-xs text-theme/50">Seeded LPU demo workspaces</p></div><span className="rounded-full bg-accent/15 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-accent">Demo</span></div><div className="mt-3 grid grid-cols-3 gap-2">{DEMO_ACCOUNTS.map((account) => <button key={account.email} type="button" onClick={() => fillDemoAccount(account.email)} className="rounded-xl border border-theme/10 px-2 py-2 text-xs font-semibold transition hover:bg-theme hover:text-bg">{account.label}</button>)}</div></div>}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrorMsg(''); setSuccessMsg(''); }}
              type="button"
              className="font-bold text-[12px] uppercase opacity-50 hover:opacity-100 transition-opacity"
            >
              {mode === 'login' ? 'Request Access' : mode === 'forgot' ? 'Return to Login' : 'Already Verified?'}
            </button>
            <Link to="/?demo=1" className="block mt-5 py-4 rounded-full border border-theme/20 text-[10px] tracking-[0.25em] uppercase text-theme/65 hover:bg-theme hover:text-bg transition-colors">
              Explore Preview Mode
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
