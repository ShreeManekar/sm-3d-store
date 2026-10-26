import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  color?: string;
}

interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: string;
}

interface CustomOrder {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  description: string;
  dimensions: { length: number; width: number; height: number };
  desiredMaterial: string;
  desiredColor: string;
  infillDensity: string;
  status: string;
  quotePrice: number | null;
  adminNotes: string;
  fileName?: string;
  createdAt: string;
}

export const Account: React.FC = () => {
  const { currentUser, isLoggedIn, isAdmin, logout, login, register, adminLogin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Tab state for when not logged in
  const [authTab, setAuthTab] = useState<'login' | 'register' | 'admin'>(
    searchParams.get('tab') === 'admin' ? 'admin' : 'login'
  );

  // Auth form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Loading & error
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Orders and custom quotes
  const [orders, setOrders] = useState<Order[]>([]);
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('tab') === 'admin') {
      setAuthTab('admin');
    }
  }, [searchParams]);

  useEffect(() => {
    if (isLoggedIn && currentUser?.email) {
      setDataLoading(true);
      Promise.all([
        axios.get(`/api/orders?userEmail=${encodeURIComponent(currentUser.email)}`).catch(() => ({ data: [] })),
        axios.get(`/api/custom-orders?userEmail=${encodeURIComponent(currentUser.email)}`).catch(() => ({ data: [] })),
      ]).then(([resOrders, resCustom]) => {
        setOrders(Array.isArray(resOrders.data) ? resOrders.data : []);
        setCustomOrders(Array.isArray(resCustom.data) ? resCustom.data : []);
        setDataLoading(false);
      });
    }
  }, [isLoggedIn, currentUser?.email]);

  const handlePincodeChange = async (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setPincode(clean);
    if (clean.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${clean}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0].PostOffice?.length > 0) {
            const po = data[0].PostOffice[0];
            setCity(po.District || po.Block || po.Name);
            setState(po.State);
          }
        }
      } catch (err) {
        console.warn('Pincode fetch error:', err);
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setAuthError(err.response?.data?.error || err.message || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      await register({
        name,
        email,
        phone,
        street,
        pincode,
        city,
        state,
        password,
      });
    } catch (err: any) {
      setAuthError(err.response?.data?.error || err.message || 'Registration failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      await adminLogin(adminEmail, adminPassword);
      navigate('/admin');
    } catch (err: any) {
      setAuthError(err.response?.data?.error || err.message || 'Admin authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // If user is NOT logged in, render the login/signup/admin card
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center bg-transparent text-inherit">
        <div className="w-full max-w-md bg-white dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-2xl backdrop-blur">
          <div className="text-center mb-6">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-gray-950 font-black shadow-lg shadow-amber-500/20 mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Account Authentication</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Sign in to manage your 3D orders, view custom print quotes, or access the admin panel.
            </p>

            {/* Tab switch */}
            <div className="flex bg-gray-100 dark:bg-gray-950 p-1 rounded-xl mt-6 border border-gray-200 dark:border-gray-800 gap-1">
              <button
                onClick={() => { setAuthTab('login'); setAuthError(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  authTab === 'login' ? 'bg-amber-500 text-gray-950 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setAuthTab('register'); setAuthError(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  authTab === 'register' ? 'bg-amber-500 text-gray-950 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Sign Up
              </button>
              <button
                onClick={() => { setAuthTab('admin'); setAuthError(null); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1 ${
                  authTab === 'admin' ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-gray-950 font-bold shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Admin
              </button>
            </div>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/40 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{authError}</span>
            </div>
          )}

          {/* Customer Login Form */}
          {authTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address or Mobile Number
                </label>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com or mobile"
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-gray-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
              >
                {authLoading ? <div className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" /> : 'Sign In'}
              </button>
            </form>
          )}

          {/* Customer Register Form */}
          {authTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rahul Sharma"
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rahul@example.com"
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile (10 digits)</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9812345678"
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Flat 402, Sunshine Apartments"
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">PIN Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    placeholder="400050"
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Auto-fill"
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Auto-fill"
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Password (min 8 chars)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-gray-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 mt-2"
              >
                {authLoading ? <div className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" /> : 'Register Account'}
              </button>
            </form>
          )}

          {/* Admin Portal Tab */}
          {authTab === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/30 rounded-xl flex items-center gap-2.5 text-xs text-purple-700 dark:text-purple-300">
                <svg className="w-5 h-5 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Store administrator sign in with master token verification.</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Email</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@sm3dprint.com"
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Master Password</label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-purple-500/25 transition flex items-center justify-center gap-2"
              >
                {authLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Authenticate Admin'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // If user IS logged in: Render full account dashboard!
  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-transparent text-inherit">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 shadow-xl shadow-black/40">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-gray-950 text-xl font-black shadow-lg shadow-amber-500/20">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">{currentUser?.name}</h1>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  currentUser?.role === 'admin'
                    ? 'bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/40'
                    : 'bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/40'
                }`}>
                  {currentUser?.role === 'admin' ? 'Store Administrator' : 'Verified Customer'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{currentUser?.email} • {currentUser?.phone || 'No phone'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition shadow-sm"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/40 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 transition flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* Administrator Quick Action Banner (Shown if user is admin) */}
        {isAdmin && (
          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 dark:from-amber-950/40 via-yellow-500/10 dark:via-yellow-900/20 to-gray-50 dark:to-gray-900 border border-amber-500/30 shadow-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider">Administrator Access</span>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-1">Full Store Administration & Management Portal</h2>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  Manage inventory listings, quote custom customer prints, track orders, edit system administrators, and export data.
                </p>
              </div>
              <Link
                to="/admin"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-xs shadow-lg shadow-purple-500/25 transition flex items-center gap-2 whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Open Admin Portal
              </Link>
            </div>
          </div>
        )}

        {/* Profile / Address Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3">User Details</h3>
            <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
              <div><span className="text-gray-400 dark:text-gray-500">Name:</span> <strong className="text-gray-900 dark:text-white">{currentUser?.name}</strong></div>
              <div><span className="text-gray-400 dark:text-gray-500">Account ID:</span> <code className="text-gray-700 dark:text-gray-400">{currentUser?.id}</code></div>
              <div><span className="text-gray-400 dark:text-gray-500">Role:</span> <span className="text-amber-500 font-semibold">{currentUser?.role}</span></div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3">Contact Info</h3>
            <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
              <div><span className="text-gray-400 dark:text-gray-500">Email:</span> <strong className="text-gray-900 dark:text-white">{currentUser?.email}</strong></div>
              <div><span className="text-gray-400 dark:text-gray-500">Phone:</span> <strong className="text-gray-900 dark:text-white">{currentUser?.phone || 'N/A'}</strong></div>
              <div><span className="text-gray-400 dark:text-gray-500">Country:</span> <strong className="text-gray-900 dark:text-white">{currentUser?.country || 'India (+91)'}</strong></div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3">Saved Shipping Address</h3>
            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
              <p className="text-gray-900 dark:text-white font-medium">{currentUser?.street || 'No street provided'}</p>
              <p>{[currentUser?.city, currentUser?.state].filter(Boolean).join(', ')} {currentUser?.pincode}</p>
              <p className="text-gray-400 dark:text-gray-500">{currentUser?.country || 'India (+91)'}</p>
            </div>
          </div>
        </div>

        {/* Customer Orders History */}
        <div className="p-6 rounded-3xl bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-xl shadow-black/40 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              My Order History
            </h2>
            <Link to="/shop" className="text-xs text-amber-500 hover:underline">
              Browse More 3D Prints →
            </Link>
          </div>

          {dataLoading ? (
            <p className="text-xs text-gray-500 py-4 text-center">Loading orders...</p>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-xs">
              No orders found for this account. Ready to print?{' '}
              <Link to="/shop" className="text-amber-500 hover:underline">Explore store</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {orders.map((ord) => (
                <div key={ord.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-500">{ord.id}</span>
                      <span className="text-[11px] text-gray-500">
                        {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      {ord.items?.map((item) => `${item.name} × ${item.quantity}`).join(', ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      ord.fulfillmentStatus === 'Delivered'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                    }`}>
                      {ord.fulfillmentStatus || 'Processing'}
                    </span>
                    <span className="text-sm font-extrabold text-gray-900 dark:text-white">₹{ord.total}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom Print Requests History */}
        <div className="p-6 rounded-3xl bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              My Custom Print Requests & Quotes
            </h2>
            <Link to="/custom-print" className="text-xs text-purple-600 dark:text-purple-400 hover:underline">
              Request Another Custom Print →
            </Link>
          </div>

          {dataLoading ? (
            <p className="text-xs text-gray-500 py-4 text-center">Loading custom print requests...</p>
          ) : customOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-xs">
              No custom print requests submitted yet.{' '}
              <Link to="/custom-print" className="text-purple-600 dark:text-purple-400 hover:underline">Request a quote</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {customOrders.map((co) => (
                <div key={co.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">{co.id}</span>
                      <span className="text-[11px] text-gray-500">
                        {co.createdAt ? new Date(co.createdAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 font-medium">{co.description}</p>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      Dims: {co.dimensions?.length}×{co.dimensions?.width}×{co.dimensions?.height} mm • Material: {co.desiredMaterial} ({co.desiredColor}) • Infill: {co.infillDensity}
                    </div>
                    {co.adminNotes && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1 bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded border border-amber-200 dark:border-amber-800/40 inline-block">
                        Admin Note: {co.adminNotes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      co.status === 'Quoted'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30'
                        : co.status === 'In Production'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
                    }`}>
                      {co.status || 'Requested'}
                    </span>
                    <span className="text-sm font-extrabold text-gray-900 dark:text-white">
                      {co.quotePrice ? `₹${co.quotePrice}` : 'Quote Pending'}
                    </span>
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
export default Account;
