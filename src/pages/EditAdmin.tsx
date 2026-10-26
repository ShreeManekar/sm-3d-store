import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export const EditAdmin: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAdminHeaders, isAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    password: '',
    role: 'admin',
  });

  useEffect(() => {
    if (!id) return;
    const headers = getAdminHeaders();

    axios
      .get('/api/users', { headers })
      .then((res) => {
        if (Array.isArray(res.data)) {
          const user = res.data.find((u: any) => u.id === id);
          if (user) {
            setForm({
              name: user.name || '',
              email: user.email || '',
              phone: user.phone || '',
              street: user.street || '',
              city: user.city || '',
              state: user.state || '',
              pincode: user.pincode || '',
              password: '',
              role: user.role || 'admin',
            });
            setLoading(false);
            return;
          }
        }
        throw new Error('User not found');
      })
      .catch(() => {
        // Fallback for demo/usr_admin
        if (id === 'usr_admin') {
          setForm({
            name: 'Admin',
            email: 'shreemanekar0@gmail.com',
            phone: '+919284118601',
            street: 'Chandrapur',
            city: 'Chandrapur',
            state: 'Maharashtra',
            pincode: '442401',
            password: '',
            role: 'admin',
          });
        }
        setLoading(false);
      });
  }, [id, getAdminHeaders]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError(null);
    setSuccess(null);

    const headers = getAdminHeaders();
    try {
      const payload: any = { ...form };
      if (!payload.password) {
        delete payload.password;
      }
      await axios.put(`/api/users/${id}`, payload, { headers });
      setSuccess('Administrator profile updated successfully!');
      setTimeout(() => {
        navigate('/admin');
      }, 800);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to update admin profile');
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-inherit py-10 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-amber-500 dark:hover:text-amber-400 transition">Home</Link>
          <span>/</span>
          <Link to="/admin" className="hover:text-amber-500 dark:hover:text-amber-400 transition">Admin Portal</Link>
          <span>/</span>
          <span className="text-amber-500 dark:text-amber-400 font-medium">Edit Administrator</span>
        </nav>

        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-amber-500/30 shadow-xl shadow-black/40">
          <div className="mb-6">
            <span className="text-amber-500 font-bold text-xs uppercase tracking-wider">Access Control</span>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">Edit Administrator Details</h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
              Account Identifier: <span className="font-mono text-amber-500">{id}</span>
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-300 text-xs">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs">
              {success}
            </div>
          )}

          {loading ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
              Loading user details...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Street Address</label>
                <input
                  name="street"
                  value={form.street}
                  onChange={handleChange}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">City</label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">State</label>
                  <input
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Pincode</label>
                  <input
                    name="pincode"
                    value={form.pincode}
                    onChange={handleChange}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  New Password (leave blank to keep current)
                </label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-800">
                <Link
                  to="/admin"
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/20 transition"
                >
                  Save Administrator Details
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
export default EditAdmin;
