import React from 'react';
import { Link } from 'react-router-dom';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AdminTableProps {
  users: AdminUser[];
}

export const AdminTable: React.FC<AdminTableProps> = ({ users }) => (
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {users.map(user => (
        <tr key={user.id}>
          <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
          <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
          <td className="px-6 py-4 whitespace-nowrap">{user.role}</td>
          <td className="px-6 py-4 whitespace-nowrap">
            {user.role === 'admin' ? (
              <Link
                to={`/admin/edit/${user.id}`}
                className="text-indigo-600 hover:text-indigo-900"
              >
                Edit
              </Link>
            ) : (
              <span className="text-gray-400">N/A</span>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);
