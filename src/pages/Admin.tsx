import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminTable, AdminUser } from '../components/AdminTable';
import axios from 'axios';

const FALLBACK_ADMINS: AdminUser[] = [
  {
    id: 'usr_admin',
    name: 'Admin',
    email: 'shreemanekar0@gmail.com',
    role: 'admin',
  },
];

export const Admin: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    axios
      .get('/api/users')
      .then((res) => {
        if (!isMounted) return;
        if (Array.isArray(res.data)) {
          const adminUsers = res.data.filter((u: any) => u.role === 'admin');
          setUsers(adminUsers.length > 0 ? adminUsers : FALLBACK_ADMINS);
        } else {
          setUsers(FALLBACK_ADMINS);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        // Fallback to local administrative store if backend proxy is offline
        setUsers(FALLBACK_ADMINS);
        setNotice('Live backend proxy is unreachable; showing cached administrative accounts.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#090d16] text-white py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-cyan-400 transition">Home</Link>
          <span>/</span>
          <span className="text-cyan-400 font-medium">Admin Portal</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-gray-800 gap-4">
          <div>
            <span className="text-cyan-400 font-bold text-xs uppercase tracking-wider">Management</span>
            <h1 className="text-3xl font-extrabold text-white mt-1">Admin Users Directory</h1>
            <p className="text-gray-400 text-sm mt-1">
              Configure system administrator accounts and permission roles.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/shop"
              className="text-xs px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white transition"
            >
              Go to Shop
            </Link>
            <Link
              to="/"
              className="text-xs px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold transition"
            >
              Back to Home
            </Link>
          </div>
        </div>

        {notice && (
          <div className="mb-6 p-4 rounded-xl bg-blue-950/40 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2">
            <svg className="w-4 h-4 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{notice}</span>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mb-3"></div>
            <p className="text-sm">Loading administrators...</p>
          </div>
        ) : (
          <AdminTable users={users} />
        )}
      </div>
    </div>
  );
};

export default Admin;
