import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const [query, setQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#090d16]/95 backdrop-blur border-b border-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <span className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </span>
            <span>SM <span className="text-cyan-400">3D</span></span>
          </Link>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 3D prints, materials..."
              className="w-full bg-gray-900/90 text-sm text-gray-200 pl-10 pr-4 py-2 rounded-full border border-gray-700 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </form>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link to="/" className="text-gray-300 hover:text-cyan-400 transition">Home</Link>
            <Link to="/shop" className="text-gray-300 hover:text-cyan-400 transition">Shop All</Link>
            <Link to="/custom-print" className="px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition">
              Request Custom 3D Print
            </Link>
            <Link to="/cart" className="relative text-gray-300 hover:text-cyan-400 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </Link>
            <Link to="/admin" className="text-gray-400 hover:text-white transition text-xs border border-gray-700 px-2.5 py-1 rounded">
              Admin
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-3">
            <Link to="/cart" className="text-gray-300 hover:text-cyan-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-400 hover:text-white focus:outline-none"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800 space-y-3">
            <form onSubmit={handleSearch} className="relative mb-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-gray-900 text-sm text-gray-200 pl-9 pr-3 py-2 rounded-lg border border-gray-700"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </form>
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-gray-300 hover:text-cyan-400">Home</Link>
            <Link to="/shop" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-gray-300 hover:text-cyan-400">Shop All Products</Link>
            <Link to="/custom-print" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-cyan-400 font-medium">Request Custom 3D Print</Link>
            <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-gray-400">Admin Portal</Link>
          </div>
        )}
      </div>
    </header>
  );
};
