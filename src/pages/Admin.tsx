import React, { useEffect, useState } from 'react';
import { AdminTable } from '../components/AdminTable';
import axios from 'axios';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const Admin: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get('/api/users') // endpoint should return list of users (admin+others)
      .then(res => {
        // filter only admins for display
        const adminUsers = res.data.filter((u: any) => u.role === 'admin');
        setUsers(adminUsers);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load users');
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Admin Users</h2>
      <AdminTable users={users} />
    </div>
  );
};

export default Admin;
