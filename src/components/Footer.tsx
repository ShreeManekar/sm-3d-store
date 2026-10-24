import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => (
  <footer className="bg-gray-950 border-t border-gray-900 text-gray-400 py-10 mt-auto">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
      <div>
        <Link to="/" className="inline-flex items-center gap-2 font-bold text-xl text-white mb-3 hover:text-cyan-400 transition">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm shadow-md shadow-cyan-500/20">
            3D
          </span>
          <span>SM <span className="text-cyan-400">3D</span></span>
        </Link>
        <p className="text-sm text-gray-400">
          Precision additive manufacturing & on-demand custom 3D printing up to 160mm build volume.
        </p>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Shop & Services</h4>
        <ul className="space-y-2 text-sm">
          <li><Link to="/shop" className="hover:text-cyan-400 transition">Shop Catalog</Link></li>
          <li><Link to="/custom-print" className="hover:text-cyan-400 transition">Custom 3D Printing</Link></li>
          <li><Link to="/cart" className="hover:text-cyan-400 transition">Shopping Cart</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Tech Specs</h4>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>Max Build: 160 × 160 × 160 mm</li>
          <li>Layer Height: 0.12 - 0.28 mm</li>
          <li>Materials: PLA+, PETG, ABS</li>
        </ul>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Portal</h4>
        <ul className="space-y-2 text-sm">
          <li><Link to="/admin" className="hover:text-cyan-400 transition">Admin Login & Directory</Link></li>
          <li><Link to="/checkout" className="hover:text-cyan-400 transition">Instant Checkout</Link></li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-gray-900 text-center text-xs text-gray-400">
      &copy; {new Date().getFullYear()} SM 3D Printing Store. Precision Additive Manufacturing. All rights reserved.
    </div>
  </footer>
);
