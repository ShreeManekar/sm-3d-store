import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => (
  <main className="min-h-[70vh] flex items-center justify-center py-16 px-4 bg-[#090d16] text-white">
    <div className="max-w-md w-full text-center">
      <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-6">
        <span className="text-3xl font-extrabold font-mono">404</span>
      </div>
      <h1 className="text-3xl font-extrabold text-white mb-2">Page Not Found</h1>
      <p className="text-gray-400 text-sm mb-8 leading-relaxed">
        The route you requested does not exist or has been relocated. Explore our 3D printing catalog or return to the home page.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <Link
          to="/"
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-md shadow-cyan-500/20 transition"
        >
          Return to Home
        </Link>
        <Link
          to="/shop"
          className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gray-900 border border-gray-800 text-cyan-400 hover:border-gray-700 hover:text-white transition"
        >
          Browse Shop
        </Link>
        <Link
          to="/custom-print"
          className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gray-900 border border-gray-800 text-gray-300 hover:border-gray-700 hover:text-white transition"
        >
          Custom Print
        </Link>
      </div>
    </div>
  </main>
);

export default NotFound;
