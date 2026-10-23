import React from 'react';
import { Link } from 'react-router-dom';

export const Header: React.FC = () => (
  <header className="bg-gray-800 text-white py-4 px-6 flex justify-between items-center">
    <Link to="/" className="text-xl font-bold">SM 3D Printing Store</Link>
    <nav className="space-x-4">
      <Link to="/shop" className="hover:underline">Browse Store</Link>
      <Link to="/custom-print" className="hover:underline">Custom Print</Link>
      <Link to="/admin" className="hover:underline">Admin</Link>
    </nav>
  </header>
);
