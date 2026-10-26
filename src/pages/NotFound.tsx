import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => (
  <main className="min-h-[70vh] flex items-center justify-center py-16 px-4 bg-transparent text-inherit">
    <div className="max-w-md w-full text-center">
      <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-black/40">
        <span className="text-3xl font-extrabold font-mono">404</span>
      </div>
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Page Not Found</h1>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-8 leading-relaxed">
        The route you requested does not exist or has been relocated. Explore our 3D printing catalog or return to the home page.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <Link
          to="/"
          className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-950 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 shadow-md shadow-amber-500/20 transition"
        >
          Return to Home
        </Link>
        <Link
          to="/shop"
          className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-amber-500 hover:border-amber-500/50 transition shadow-sm"
        >
          Browse Shop
        </Link>
        <Link
          to="/custom-print"
          className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-amber-500/50 hover:text-amber-500 dark:hover:text-white transition shadow-sm"
        >
          Custom Print
        </Link>
      </div>
    </div>
  </main>
);

export default NotFound;
