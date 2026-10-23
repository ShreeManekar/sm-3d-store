import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#090d16] text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text & CTAs */}
            <div>
              <span className="inline-block py-1 px-3 rounded-full text-xs font-bold tracking-wider uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-4">
                Precision Additive Manufacturing
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight mb-6">
                Crafting Ideas Into <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Precision 3D</span> Physical Reality
              </h1>
              <p className="text-lg text-gray-300 mb-8 max-w-xl leading-relaxed">
                Ready-made high quality 3D printed objects & custom print-on-demand up to 160mm build volume. Fast prototyping, industrial-grade materials, and rapid turnaround.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/shop"
                  className="inline-flex justify-center items-center px-6 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 transition transform hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Browse Store
                </Link>
                <Link
                  to="/custom-print"
                  className="inline-flex justify-center items-center px-6 py-3.5 rounded-xl font-semibold text-cyan-300 bg-gray-900 border border-cyan-500/30 hover:bg-gray-800 hover:border-cyan-400 transition transform hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Order Custom 3D Print
                </Link>
              </div>
            </div>

            {/* Hero Media / Image */}
            <div className="relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 opacity-20 blur-xl"></div>
              <div className="relative rounded-2xl overflow-hidden border border-gray-800 bg-gray-900 shadow-2xl">
                <img
                  src="/assets/images/hero_3d_printer_1786179196218.webp"
                  alt="3D Printer in Action"
                  className="w-full h-auto object-cover transform hover:scale-105 transition duration-700"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Row */}
      <section className="py-12 border-t border-gray-900 bg-gray-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl border border-gray-800 bg-gray-900/60 backdrop-blur">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">160mm Max Build Volume</h3>
              <p className="text-sm text-gray-400">
                Custom print validation up to 160×160×160mm with smart split options for larger models.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-gray-800 bg-gray-900/60 backdrop-blur">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Premium Materials</h3>
              <p className="text-sm text-gray-400">
                PLA+, PETG, and Carbon Fiber blends calibrated for dimensional accuracy and structural rigidity.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-gray-800 bg-gray-900/60 backdrop-blur">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Instant Slicing & Quoting</h3>
              <p className="text-sm text-gray-400">
                Upload your STL/OBJ models for automatic volume calculation, print-time estimate, and live pricing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Showcase */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <span className="text-cyan-400 font-semibold text-sm uppercase tracking-wider">Catalog</span>
              <h2 className="text-3xl font-extrabold text-white">Popular 3D Prints</h2>
            </div>
            <Link to="/shop" className="text-cyan-400 hover:text-cyan-300 font-medium text-sm flex items-center gap-1">
              View all <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden hover:border-cyan-500/50 transition duration-300">
              <div className="h-48 overflow-hidden bg-gray-950 flex items-center justify-center">
                <img src="/assets/images/product_dragon_1786179208256.webp" alt="Articulated Crystal Dragon" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-white mb-1">Articulated Crystal Dragon</h3>
                <p className="text-sm text-gray-400 mb-3">Flexible print-in-place dragon with moving joints.</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-cyan-400">₹749</span>
                  <Link to="/shop" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-cyan-500 hover:text-gray-950 transition">View</Link>
                </div>
              </div>
            </div>

            <div className="group rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden hover:border-cyan-500/50 transition duration-300">
              <div className="h-48 overflow-hidden bg-gray-950 flex items-center justify-center">
                <img src="/assets/images/product_gearbox_1786179220985.webp" alt="Planetary Gearbox Fidget" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-white mb-1">Planetary Gearbox Toy</h3>
                <p className="text-sm text-gray-400 mb-3">Mechanical desk fidget with smooth gear reduction.</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-cyan-400">₹399</span>
                  <Link to="/shop" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-cyan-500 hover:text-gray-950 transition">View</Link>
                </div>
              </div>
            </div>

            <div className="group rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden hover:border-cyan-500/50 transition duration-300">
              <div className="h-48 overflow-hidden bg-gray-950 flex items-center justify-center">
                <img src="/assets/images/product_planter_1786179235105.webp" alt="Geometric Hex Planter" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-white mb-1">Geometric Hex Planter</h3>
                <p className="text-sm text-gray-400 mb-3">Modern succulent pot with internal drainage reservoir.</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-cyan-400">₹449</span>
                  <Link to="/shop" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-cyan-500 hover:text-gray-950 transition">View</Link>
                </div>
              </div>
            </div>

            <div className="group rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden hover:border-cyan-500/50 transition duration-300">
              <div className="h-48 overflow-hidden bg-gray-950 flex items-center justify-center">
                <img src="/assets/images/product_headphone_stand_1786179253396.webp" alt="Minimalist Headphone Stand" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-white mb-1">Minimalist Headphone Stand</h3>
                <p className="text-sm text-gray-400 mb-3">Ergonomic curved desk stand with cable organizer.</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-cyan-400">₹699</span>
                  <Link to="/shop" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-cyan-500 hover:text-gray-950 transition">View</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
