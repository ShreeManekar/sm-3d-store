import React from 'react';
import { Link } from 'react-router-dom';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AdminTableProps {
  users: AdminUser[];
}

export const AdminTable: React.FC<AdminTableProps> = ({ users }) => (
  <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900/90 shadow-xl">
    <table className="min-w-full divide-y divide-gray-800 text-left text-sm text-gray-300">
      <thead className="bg-gray-950 text-xs uppercase tracking-wider text-gray-400">
        <tr>
          <th className="px-6 py-3.5 font-semibold">User</th>
          <th className="px-6 py-3.5 font-semibold">Email</th>
          <th className="px-6 py-3.5 font-semibold">Role</th>
          <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-800/60">
        {users.length === 0 ? (
          <tr>
            <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
              No administrator records found.
            </td>
          </tr>
        ) : (
          users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-800/40 transition">
              <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{user.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-400 font-mono text-xs">{user.email}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {user.role}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                {user.role === 'admin' ? (
                  <Link
                    to={`/admin/edit/${user.id}`}
                    className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition"
                  >
                    <span>Edit User</span>
                    <span>&rarr;</span>
                  </Link>
                ) : (
                  <span className="text-gray-500">N/A</span>
                )}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);
