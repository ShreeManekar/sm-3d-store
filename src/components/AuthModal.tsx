import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register' | 'admin';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'admin'>(initialTab);
  const { login, register, adminLogin } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regStreet, setRegStreet] = useState('');
  const [regPincode, setRegPincode] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regState, setRegState] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Admin states
  const [adminEmail, setAdminEmail] = useState('shreemanekar0@gmail.com');
  const [adminPassword, setAdminPassword] = useState('SM3dAdmin@9284');

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
    setError(null);
    setSuccess(null);
  }, [initialTab, isOpen]);

  // Handle live pincode lookup
  const handlePincodeChange = async (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setRegPincode(clean);

    if (clean.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${clean}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0].PostOffice?.length > 0) {
            const po = data[0].PostOffice[0];
            setRegCity(po.District || po.Block || po.Name);
            setRegState(po.State);
          }
        }
      } catch (err) {
        console.warn('Pincode fetch error:', err);
      }
    }
  };

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      setSuccess('Login successful! Redirecting...');
      setTimeout(() => {
        onClose();
        navigate('/account');
      }, 500);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        name: regName,
        email: regEmail,
        phone: regPhone,
        street: regStreet,
        pincode: regPincode,
        city: regCity,
        state: regState,
        password: regPassword,
      });
      setSuccess('Account created and logged in successfully!');
      setTimeout(() => {
        onClose();
        navigate('/account');
      }, 500);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await adminLogin(adminEmail, adminPassword);
      setSuccess('Admin authenticated successfully! Opening Admin Portal...');
      setTimeout(() => {
        onClose();
        navigate('/admin');
      }, 500);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Admin authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#111726] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition p-1"
          aria-label="Close authentication modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
              SM
            </span>
            <span className="font-bold text-lg text-gray-900 dark:text-white">SM 3D Authentication</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Sign in to track orders, manage custom print quotes, or authenticate as store admin.
          </p>

          {/* 3 Tabs */}
          <div className="flex rounded-xl bg-gray-100 dark:bg-gray-900/80 p-1 mt-4 gap-1">
            <button
              onClick={() => { setActiveTab('login'); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                activeTab === 'login'
                  ? 'bg-cyan-500 text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab('register'); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                activeTab === 'register'
                  ? 'bg-cyan-500 text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => { setActiveTab('admin'); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Admin Portal
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {/* TAB 1: Customer Login */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address or Mobile Number
                </label>
                <input
                  type="text"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@example.com or 10-digit mobile"
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sign In to Account'}
              </button>

              <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
                >
                  Create Account
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Customer Register */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Rahul Sharma"
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">10-Digit Mobile</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9812345678"
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={regStreet}
                  onChange={(e) => setRegStreet(e.target.value)}
                  placeholder="Flat 402, Sunshine Apartments, Main Road"
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">PIN Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={regPincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    placeholder="400050"
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    placeholder="Auto-detect"
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={regState}
                    onChange={(e) => setRegState(e.target.value)}
                    placeholder="Auto-detect"
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password (min 8 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Register New Account'}
              </button>

              <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-1">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
                >
                  Sign In here
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Admin Portal Login */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-950/30 border border-purple-300 dark:border-purple-500/30 rounded-xl flex items-center gap-2.5 text-xs text-purple-700 dark:text-purple-300">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Restricted administrator access. Authenticates token for product, order & user controls.</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Administrator Email
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@sm3dprint.com"
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Master Admin Password
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-400 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-purple-500/25 transition flex items-center justify-center gap-2"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Authenticate Admin Session'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
export default AuthModal;
