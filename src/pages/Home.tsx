import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart, ProductItem } from '../context/CartContext';

const DEFAULT_FEATURED: ProductItem[] = [
  {
    id: 'prod_1',
    name: 'Articulated Crystal Dragon',
    price: 749,
    category: 'Art & Figures',
    description: 'Flexible print-in-place dragon with moving articulated joints.',
    image: '/assets/images/product_dragon_1786179208256.webp',
    dimensions: '150 × 45 × 30 mm',
  },
  {
    id: 'prod_2',
    name: 'Planetary Gearbox Toy',
    price: 399,
    category: 'Engineering & Gadgets',
    description: 'Mechanical desk fidget with smooth 5:1 gear reduction.',
    image: '/assets/images/product_gearbox_1786179220985.webp',
    dimensions: '75 × 75 × 22 mm',
  },
  {
    id: 'prod_3',
    name: 'Geometric Hex Planter',
    price: 449,
    category: 'Home & Decor',
    description: 'Modern succulent pot with hidden internal drainage reservoir.',
    image: '/assets/images/product_planter_1786179235105.webp',
    dimensions: '90 × 90 × 85 mm',
  },
  {
    id: 'prod_4',
    name: 'Minimalist Headphone Stand',
    price: 699,
    category: 'Desk Accessories',
    description: 'Ergonomic curved desk stand with cable organizer channel.',
    image: '/assets/images/product_headphone_stand_1786179253396.webp',
    dimensions: '140 × 120 × 240 mm',
  },
];

interface DeliveryCity {
  id: string;
  name: string;
  state: string;
  estimatedDays?: string;
  active: boolean;
  pincodes?: string;
}

const Home: React.FC = () => {
  const { addToCart, items } = useCart();
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState<ProductItem[]>(DEFAULT_FEATURED);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Delivery coverage modal & stats
  const [deliveryCities, setDeliveryCities] = useState<DeliveryCity[]>([]);
  const [deliveryCityCount, setDeliveryCityCount] = useState<number>(40);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [cityLookupQuery, setCityLookupQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    axios
      .get('/api/products')
      .then((res) => {
        if (!isMounted) return;
        if (Array.isArray(res.data) && res.data.length > 0) {
          const loaded: ProductItem[] = res.data.slice(0, 4).map((p: any) => ({
            id: p.id,
            name: p.name,
            price: Number(p.price) || 0,
            category: p.category || 'General',
            description: p.description || '',
            image: p.image || p.images?.[0] || '/assets/images/hero_3d_printer_1786179196218.webp',
            dimensions: typeof p.dimensions === 'string' ? p.dimensions : '100 × 100 × 100 mm',
          }));
          setFeaturedProducts(loaded);
        }
      })
      .catch(() => {
        // Fallback to DEFAULT_FEATURED
      });

    // Fetch live delivery cities
    axios
      .get('/api/delivery-cities')
      .then((res) => {
        if (!isMounted) return;
        const list: DeliveryCity[] = Array.isArray(res.data?.cities)
          ? res.data.cities
          : Array.isArray(res.data)
          ? res.data
          : [];
        setDeliveryCities(list);
        if (res.data?.count) {
          setDeliveryCityCount(res.data.count);
        } else if (list.length > 0) {
          setDeliveryCityCount(list.filter((c) => c.active !== false).length);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddToCart = (product: ProductItem, goToCart: boolean = true) => {
    addToCart(product, 1);
    if (goToCart) {
      navigate('/cart');
    } else {
      setToastMessage(`Added "${product.name}" to cart!`);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const getItemQuantityInCart = (productId: string) => {
    const item = items.find((i) => i.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="min-h-screen bg-transparent text-inherit">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-cyan-400/40 animate-fade-in">
          <svg className="w-5 h-5 text-cyan-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-semibold">{toastMessage}</span>
          <Link
            to="/cart"
            className="ml-2 text-xs font-bold underline hover:text-cyan-200 uppercase tracking-wider"
          >
            View Cart &rarr;
          </Link>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text & CTAs */}
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <span className="inline-block py-1 px-3 rounded-full text-xs font-bold tracking-wider uppercase bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  Precision Additive Manufacturing
                </span>
                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(true)}
                  className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition shadow-sm cursor-pointer group"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>🚚 Delivering Across <strong>{deliveryCityCount}+ Cities</strong> Nationwide</span>
                  <span className="text-[10px] underline ml-0.5 group-hover:translate-x-0.5 transition font-bold">Check City &rarr;</span>
                </button>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight mb-6">
                Crafting Ideas Into <span className="bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-500 bg-clip-text text-transparent">Precision 3D</span> Physical Reality
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-xl leading-relaxed">
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
                  className="inline-flex justify-center items-center px-6 py-3.5 rounded-xl font-semibold text-cyan-600 dark:text-cyan-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-cyan-500/30 hover:bg-gray-50 dark:hover:bg-gray-800 transition transform hover:-translate-y-0.5 shadow-sm"
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
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 shadow-2xl">
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
      <section className="py-12 border-t border-gray-200 dark:border-gray-900 bg-gray-100/60 dark:bg-gray-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 backdrop-blur shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">160mm Max Build Volume</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Custom print validation up to 160×160×160mm with smart split options for larger models.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 backdrop-blur shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Premium Materials</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                PLA+, PETG, and Carbon Fiber blends calibrated for dimensional accuracy and structural rigidity.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 backdrop-blur shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Instant Slicing & Quoting</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Upload STL/3MF models for automatic volume calculation, print-time estimate, and live pricing.
              </p>
            </div>

            <div
              onClick={() => setShowDeliveryModal(true)}
              className="p-6 rounded-2xl border border-emerald-500/30 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-cyan-500/5 to-transparent backdrop-blur shadow-sm hover:border-emerald-500/60 transition cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delivering to {deliveryCityCount}+ Cities</h3>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition">Check &rarr;</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Fast 1-4 day express delivery across {deliveryCityCount}+ cities with protective shockproof packaging.
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
              <span className="text-cyan-600 dark:text-cyan-400 font-semibold text-sm uppercase tracking-wider">Catalog</span>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Popular 3D Prints</h2>
            </div>
            <Link to="/shop" className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 font-medium text-sm flex items-center gap-1">
              View all <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => {
              const qtyInCart = getItemQuantityInCart(product.id);
              return (
                <div
                  key={product.id}
                  className="group rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-cyan-500/50 transition duration-300 flex flex-col justify-between shadow-md"
                >
                  <Link to="/shop" className="block focus:outline-none">
                    <div className="h-48 overflow-hidden bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-2 relative">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition duration-500"
                      />
                      {qtyInCart > 0 && (
                        <span className="absolute top-3 right-3 bg-cyan-500 text-gray-950 text-xs font-extrabold px-2 py-0.5 rounded-full shadow-lg">
                          {qtyInCart} in cart
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-1">{product.category}</div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition">{product.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{product.description}</p>
                    </div>
                  </Link>

                  <div className="p-4 pt-0 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between mt-2">
                    <span className="text-lg font-bold text-cyan-600 dark:text-cyan-400">₹{product.price}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAddToCart(product, false)}
                        title="Add to cart"
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 transition transform active:scale-95 flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add</span>
                      </button>
                      <button
                        onClick={() => handleAddToCart(product, true)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20 transition transform active:scale-95"
                      >
                        Add to Cart &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* DELIVERY AVAILABILITY LOOKUP MODAL */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block py-0.5 px-2.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 mb-2">
                  Nationwide Express Shipping Network
                </span>
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>🚚 Check Delivery Coverage</span>
                  <span className="text-xs bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
                    {deliveryCityCount}+ Cities
                  </span>
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  We ship precision custom 3D prints & ready catalog items across India with robust protective packaging.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setShowDeliveryModal(false); setCityLookupQuery(''); }}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white text-lg p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                ✕
              </button>
            </div>

            {/* Instant City Search Input */}
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={cityLookupQuery}
                onChange={(e) => setCityLookupQuery(e.target.value)}
                placeholder="Type your city or PIN code (e.g. Chandrapur, Pune, Mumbai, Delhi)..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-inner"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {cityLookupQuery && (
                <button
                  type="button"
                  onClick={() => setCityLookupQuery('')}
                  className="absolute right-3.5 top-3.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold"
                >
                  ✕ Clear
                </button>
              )}
            </div>

            {/* Search Match Result Indicator */}
            {cityLookupQuery.trim() && (
              <div>
                {(() => {
                  const queryNorm = cityLookupQuery.toLowerCase().trim();
                  const exactOrPrefix = deliveryCities.filter(
                    (c) =>
                      c.active !== false &&
                      (c.name.toLowerCase().includes(queryNorm) ||
                        (c.state || '').toLowerCase().includes(queryNorm) ||
                        (c.pincodes || '').includes(queryNorm))
                  );

                  if (exactOrPrefix.length > 0) {
                    return (
                      <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs animate-fadeIn">
                        <div className="flex items-center gap-2">
                          <span className="text-base text-emerald-500">✓</span>
                          <div>
                            <span className="font-bold text-emerald-700 dark:text-emerald-300">
                              Yes! We deliver to {exactOrPrefix[0].name}, {exactOrPrefix[0].state}
                            </span>
                            <p className="text-[11px] text-gray-600 dark:text-gray-400">
                              Estimated Turnaround: <strong>{exactOrPrefix[0].estimatedDays || '2-4 Days'}</strong> with express shipment tracking.
                            </p>
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-lg text-[10px] uppercase">
                          Verified Hub
                        </span>
                      </div>
                    );
                  } else {
                    return (
                      <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between text-xs animate-fadeIn">
                        <div className="flex items-center gap-2">
                          <span className="text-base text-blue-500">ℹ️</span>
                          <div>
                            <span className="font-bold text-blue-700 dark:text-blue-300">
                              Custom Nationwide Delivery Available!
                            </span>
                            <p className="text-[11px] text-gray-600 dark:text-gray-400">
                              Even if not on this top hub list, we ship custom prints across India to all 19,000+ PIN codes via IndiaPost Speed Post & BlueDart.
                            </p>
                          </div>
                        </div>
                        <a
                          href="https://wa.me/919284118601?text=Hi%20SM%203D%2C%20I%20would%20like%20to%20check%20shipping%20availability%20for%20my%20PIN%20code"
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] shrink-0"
                        >
                          Ask on WhatsApp
                        </a>
                      </div>
                    );
                  }
                })()}
              </div>
            )}

            {/* City Grid / Directory */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div className="flex items-center justify-between text-xs text-gray-500 font-semibold uppercase tracking-wider">
                <span>Verified Direct Coverage Hubs ({deliveryCities.filter(c => c.active !== false).length})</span>
                <span className="text-[10px] lowercase font-normal">showing active cities</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {deliveryCities
                  .filter((c) => {
                    if (c.active === false) return false;
                    if (!cityLookupQuery.trim()) return true;
                    const q = cityLookupQuery.toLowerCase().trim();
                    return (
                      c.name.toLowerCase().includes(q) ||
                      (c.state || '').toLowerCase().includes(q) ||
                      (c.pincodes || '').includes(q)
                    );
                  })
                  .map((city) => (
                    <div
                      key={city.id}
                      className="p-3 rounded-xl bg-gray-50 dark:bg-gray-950/70 border border-gray-200 dark:border-gray-800 flex items-center justify-between hover:border-cyan-500/40 transition"
                    >
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1">
                          <span className="text-cyan-500 text-xs">📍</span>
                          <span>{city.name}</span>
                        </div>
                        <span className="text-[10px] text-gray-500">{city.state}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 whitespace-nowrap">
                        {city.estimatedDays || '2-4 Days'}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-gray-500 text-[11px] flex items-center gap-1.5">
                <span>⚡ Express dispatch within 24-48 hours with door-to-door tracking.</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Link
                  to="/shop"
                  onClick={() => setShowDeliveryModal(false)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-md transition"
                >
                  Browse Store &rarr;
                </Link>
                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-xs transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
