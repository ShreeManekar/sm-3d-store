import React from 'react';

export const GuaranteeBadges: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 ${className}`}>
      <div className="p-4 rounded-2xl bg-[#0b0f17] border border-amber-500/20 shadow-lg shadow-black/80 flex items-center gap-3 group hover:border-amber-500/40 transition">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <div className="text-xs font-bold text-gray-100">100% Fit Guarantee</div>
          <div className="text-[11px] text-gray-400">±0.15mm precision tolerance</div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#0b0f17] border border-amber-500/20 shadow-lg shadow-black/80 flex items-center gap-3 group hover:border-amber-500/40 transition">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <div>
          <div className="text-xs font-bold text-gray-100">Free Reprint Guarantee</div>
          <div className="text-[11px] text-gray-400">Immediate replacement if defective</div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#0b0f17] border border-amber-500/20 shadow-lg shadow-black/80 flex items-center gap-3 group hover:border-amber-500/40 transition">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <div className="text-xs font-bold text-gray-100">24-48h Rush Dispatch</div>
          <div className="text-[11px] text-gray-400">Priority production available</div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#0b0f17] border border-amber-500/20 shadow-lg shadow-black/80 flex items-center gap-3 group hover:border-amber-500/40 transition">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <div>
          <div className="text-xs font-bold text-gray-100">ISO-Grade Inspection</div>
          <div className="text-[11px] text-gray-400">Digital caliper & optical verification</div>
        </div>
      </div>
    </div>
  );
};
