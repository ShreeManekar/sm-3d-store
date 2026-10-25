import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AdminBar: React.FC = () => {
  const { currentUser, isAdmin, isEditorMode, toggleEditorMode } = useAuth();

  if (!isAdmin) return null;

  return (
    <div className="bg-gradient-to-r from-purple-950 via-gray-900 to-indigo-950 text-white text-xs py-2 px-4 border-b border-purple-500/30 sticky top-0 z-50 shadow-md backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-bold tracking-wide text-amber-300 flex items-center gap-1">
            <span>👑</span> Admin Mode
          </span>
          <span className="text-gray-400 hidden sm:inline">|</span>
          <span className="text-gray-300 text-[11px] hidden sm:inline truncate max-w-[200px]">
            {currentUser?.email}
          </span>
          <span className="text-gray-400 hidden md:inline">•</span>
          <span className="text-[11px] font-medium text-cyan-300 hidden md:inline">
            {isEditorMode ? '🎨 In-Page Editor Active' : '👁️ Normal Storefront View'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Dual Interface Toggle Button */}
          <button
            onClick={toggleEditorMode}
            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition border ${
              isEditorMode
                ? 'bg-purple-600/30 border-purple-400 text-purple-200 hover:bg-purple-600/40'
                : 'bg-white/10 border-white/20 text-gray-200 hover:bg-white/20'
            }`}
            title="Toggle between normal storefront and in-page editing interface"
          >
            {isEditorMode ? '✓ Switch to Normal View' : '✏️ Enable Editor Interface'}
          </button>

          <Link
            to="/admin?tab=settings"
            className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-[11px] font-medium transition hidden sm:inline-block border border-gray-700"
          >
            ⚙️ Tech Specs
          </Link>

          <Link
            to="/admin?tab=payments"
            className="px-2.5 py-1 rounded-lg bg-emerald-900/40 hover:bg-emerald-800/50 text-emerald-300 hover:text-emerald-200 text-[11px] font-medium transition hidden sm:inline-block border border-emerald-700/40"
          >
            💳 Payments
          </Link>

          <Link
            to="/admin"
            className="px-3 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-[11px] font-bold shadow-sm transition"
          >
            Admin Control Center ↗
          </Link>
        </div>
      </div>
    </div>
  );
};
