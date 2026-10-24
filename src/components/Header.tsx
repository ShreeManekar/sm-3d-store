import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AuthModal } from './AuthModal';
import axios from 'axios';

interface AutocompleteItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
}

export const Header: React.FC = () => {
  const [query, setQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'register' | 'admin'>('login');

  // Autocomplete states
  const [suggestions, setSuggestions] = useState<AutocompleteItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const { totalItems } = useCart();
  const { currentUser, isLoggedIn, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Autocomplete search debounce
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`/api/products?q=${encodeURIComponent(query.trim())}`);
        if (Array.isArray(res.data)) {
          setSuggestions(res.data.slice(0, 5));
          setShowDropdown(true);
        }
      } catch (err) {
        console.warn('Autocomplete fetch failed:', err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
      setShowDropdown(false);
      setMobileMenuOpen(false);
    }
  };

  const handleSelectProduct = (productId: string) => {
    setQuery('');
    setShowDropdown(false);
    navigate(`/shop?search=${encodeURIComponent(productId)}`);
  };

  const handleProfileClick = () => {
    if (isLoggedIn) {
      navigate('/account');
    } else {
      setAuthInitialTab('login');
      setAuthModalOpen(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#090d16]/95 dark:bg-[#090d16]/95 light:bg-white/95 backdrop-blur border-b border-gray-800 dark:border-gray-800 light:border-gray-200 text-white dark:text-white light:text-gray-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <span className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </span>
              <span>SM <span className="text-cyan-400 font-extrabold">3D</span></span>
            </Link>

            {/* Global Search Bar with Live Autocomplete */}
            <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-md mx-8 relative">
              <form onSubmit={handleSearchSubmit} className="w-full relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
                  placeholder="Search 3D prints, materials, models..."
                  className="w-full bg-gray-900/90 dark:bg-gray-900/90 light:bg-gray-100 text-sm text-gray-200 dark:text-gray-200 light:text-gray-900 pl-10 pr-4 py-2 rounded-full border border-gray-700 dark:border-gray-700 light:border-gray-300 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </form>

              {/* Autocomplete Dropdown */}
              {showDropdown && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#111726] border border-gray-700 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-gray-800">
                  {suggestions.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectProduct(p.name)}
                      className="p-3 flex items-center gap-3 hover:bg-gray-800/60 cursor-pointer transition"
                    >
                      <img
                        src={p.image || '/assets/images/product_dragon_1786179208256.webp'}
                        alt={p.name}
                        className="w-10 h-10 object-cover rounded-lg border border-gray-700"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/images/product_dragon_1786179208256.webp';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">{p.name}</div>
                        <div className="text-[10px] text-gray-400">{p.category}</div>
                      </div>
                      <div className="text-xs font-extrabold text-cyan-400">₹{p.price}</div>
                    </div>
                  ))}
                  <div
                    onClick={handleSearchSubmit}
                    className="p-2 text-center text-[11px] text-cyan-400 font-semibold hover:bg-gray-800/80 cursor-pointer"
                  >
                    View all matching results for "{query}" →
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Actions & Navigation */}
            <nav className="hidden md:flex items-center space-x-5 text-sm font-medium">
              <Link to="/" className="text-gray-300 hover:text-cyan-400 transition">Home</Link>
              <Link to="/shop" className="text-gray-300 hover:text-cyan-400 transition">Shop All</Link>
              <Link
                to="/custom-print"
                className="px-3.5 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition text-xs font-semibold"
              >
                Request Custom 3D Print
              </Link>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800/60 transition border border-gray-700/60"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                aria-label="Toggle theme mode"
              >
                {theme === 'dark' ? (
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* Shopping Cart Button */}
              <Link
                to="/cart"
                className="relative p-2 text-gray-300 hover:text-cyan-400 transition"
                aria-label={`Shopping Cart with ${totalItems} items`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shadow-lg shadow-cyan-500/50">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </Link>

              {/* User Profile Button */}
              <button
                onClick={handleProfileClick}
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-800/60 transition"
                title={isLoggedIn ? `Logged in as ${currentUser?.name} (${currentUser?.role})` : 'Sign In / Account Portal'}
                aria-label="User account"
              >
                {isLoggedIn ? (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md ${
                    currentUser?.role === 'admin'
                      ? 'bg-gradient-to-tr from-purple-600 to-pink-600 border border-purple-400'
                      : 'bg-gradient-to-tr from-cyan-500 to-blue-600 border border-cyan-400'
                  }`}>
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-300 hover:text-white hover:border-cyan-400 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </button>

              {/* Admin Portal Nav link */}
              <Link
                to="/admin"
                className={`text-xs px-2.5 py-1.5 rounded-lg border transition flex items-center gap-1.5 ${
                  isAdmin
                    ? 'border-purple-500/40 bg-purple-950/30 text-purple-300 font-semibold'
                    : 'border-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Admin
              </Link>
            </nav>

            {/* Mobile Actions: Theme, Cart, Profile, Hamburger */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-1.5 text-gray-300 hover:text-white"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              <button
                onClick={handleProfileClick}
                className="p-1.5 text-gray-300 hover:text-white"
                aria-label="User account"
              >
                {isLoggedIn ? (
                  <span className="w-6 h-6 rounded-full bg-cyan-500 text-white font-bold text-[10px] flex items-center justify-center">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </button>

              <Link
                to="/cart"
                className="relative p-1.5 text-gray-300 hover:text-cyan-400 transition"
                aria-label={`Shopping Cart with ${totalItems} items`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
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
              <form onSubmit={handleSearchSubmit} className="relative mb-3">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search 3D prints..."
                  className="w-full bg-gray-900 text-sm text-gray-200 pl-9 pr-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-cyan-400"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </form>
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-gray-300 hover:text-cyan-400">Home</Link>
              <Link to="/shop" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-gray-300 hover:text-cyan-400">Shop All Products</Link>
              <Link to="/custom-print" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-cyan-400 font-medium">Request Custom 3D Print</Link>
              <Link to="/account" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-gray-300 hover:text-cyan-400">
                {isLoggedIn ? `My Account (${currentUser?.name})` : 'Sign In / Register'}
              </Link>
              <Link to="/cart" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between py-1.5 text-gray-300 hover:text-cyan-400">
                <span>Shopping Cart</span>
                {totalItems > 0 && (
                  <span className="bg-cyan-500/20 text-cyan-400 text-xs font-bold px-2 py-0.5 rounded-full border border-cyan-500/30">
                    {totalItems} items
                  </span>
                )}
              </Link>
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-purple-400 hover:text-white font-medium">Admin Portal</Link>
            </div>
          )}
        </div>
      </header>

      {/* Auth Modal Triggered from Header */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authInitialTab}
      />
    </>
  );
};
export default Header;
