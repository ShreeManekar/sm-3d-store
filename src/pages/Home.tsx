import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart, ProductItem } from '../context/CartContext';
import { GuaranteeBadges } from '../components/GuaranteeBadges';
import { FilamentSwatches } from '../components/FilamentSwatches';
import { ProductCard } from '../components/ProductCard';

const DEFAULT_FEATURED: ProductItem[] = [
  {
    id: 'prod_1',
    name: 'Articulated Crystal Dragon',
    price: 749,
    category: 'Art & Figures',
    description: 'Flexible print-in-place dragon with moving articulated joints in Aztec Gold.',
    image: '/assets/images/product_dragon_1786179208256.webp',
    dimensions: '150 × 45 × 30 mm',
  },
  {
    id: 'prod_2',
    name: 'Planetary Gearbox Toy',
    price: 399,
    category: 'Engineering & Gadgets',
    description: 'Mechanical desk fidget with smooth 5:1 gear reduction and tight tolerances.',
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
    description: 'Ergonomic curved desk stand with cable organizer channel in matte black.',
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

const HOME_FAQS = [
  {
    q: 'How fast will my custom 3D print be fabricated and dispatched?',
    a: 'We offer standard production runs within 3-5 days, as well as Priority 24-48h Rush Dispatch for urgent mechanical prototypes and student deadlines.',
  },
  {
    q: 'What dimensional accuracy can I expect?',
    a: 'Our direct-drive extrusion printers are calibrated to maintain tight tolerances of ±0.15mm on outer perimeters and ±0.08mm on mating surfaces.',
  },
  {
    q: 'What happens if a printed part arrives defective?',
    a: 'Under our Free Reprint Guarantee, notify us within 48 hours with a photo and we will immediately reprint and rush-dispatch a replacement at zero charge.',
  },
  {
    q: 'Which file formats can I upload for instant quoting?',
    a: 'We accept .STL and .3MF files directly with up to 100MB capacity. For parametric STEP, IGES, or SolidWorks parts, contact our Enterprise RFQ desk.',
  },
];

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

  // Interactive volume calculator slider on home
  const [bulkQty, setBulkQty] = useState<number>(50);

  // FAQ accordion
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    let isMounted = true;
    axios
      .get('/api/products')
      .then((res) => {
        if (!isMounted) return;
        if (Array.isArray(res.data)) {
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
      .catch(() => {});

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

  const getBulkDiscount = (qty: number) => {
    if (qty >= 200) return 35;
    if (qty >= 50) return 25;
    if (qty >= 10) return 15;
    return 0;
  };

  return (
    <div className="min-h-screen bg-transparent text-inherit">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0b0f17] text-amber-300 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-amber-500/50 animate-fade-in">
          <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-semibold">{toastMessage}</span>
          <Link
            to="/cart"
            className="ml-2 text-xs font-bold underline hover:text-amber-200 uppercase tracking-wider"
          >
            View Cart &rarr;
          </Link>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
        {/* Subtle background glow */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-10 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Text & CTAs */}
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-5">
                <span className="inline-block py-1 px-3.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-500 border border-amber-500/25 backdrop-blur-md">
                  Precision Additive Manufacturing
                </span>
                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(true)}
                  className="inline-flex items-center gap-1.5 py-1 px-3.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 transition shadow-sm cursor-pointer group"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>🚚 Delivering Across <strong>{deliveryCityCount}+ Cities</strong> Nationwide</span>
                  <span className="text-[10px] underline ml-0.5 group-hover:translate-x-0.5 transition font-bold">&rarr;</span>
                </button>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-950 dark:text-white leading-[1.06] mb-6">
                Crafting Ideas Into <span className="apple-gold-gradient">Precision 3D</span> Physical Reality
              </h1>

              <p className="text-base sm:text-lg text-gray-600 dark:text-zinc-300 mb-8 max-w-xl leading-relaxed font-normal">
                Instant 3D model slicing, industrial engineering materials (PLA+, PETG, Carbon Fiber, TPU, Resin), and door-to-door express dispatch with a 100% precision fit guarantee.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/custom-print"
                  className="apple-btn-primary inline-flex justify-center items-center px-7 py-4 rounded-full font-bold text-gray-950 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-105 shadow-xl shadow-amber-500/25 transition-all duration-300"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Instant 3D Print Quote
                </Link>

                <Link
                  to="/shop"
                  className="apple-btn-primary inline-flex justify-center items-center px-7 py-4 rounded-full font-semibold text-gray-900 dark:text-zinc-200 apple-glass hover:border-amber-500/40 hover:text-amber-500 transition-all duration-300 shadow-md"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Browse Store Catalog
                </Link>
              </div>

              {/* Trust Subtext */}
              <div className="flex flex-wrap items-center gap-5 mt-8 text-xs text-gray-500 dark:text-zinc-400 font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-500 font-bold">✓</span>
                  <span>±0.15mm Tolerance</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-500 font-bold">✓</span>
                  <span>Free Reprint Guarantee</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-500 font-bold">✓</span>
                  <span>24-48h Rush Dispatch</span>
                </div>
              </div>
            </div>

            {/* Hero Media / Image */}
            <div className="relative">
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-amber-500/30 to-yellow-500/10 blur-2xl opacity-60"></div>
              <div className="relative rounded-3xl overflow-hidden border border-gray-200/80 dark:border-white/[0.1] bg-[#0b0f17] shadow-2xl">
                <img
                  src="/assets/images/hero_3d_printer_1786179196218.webp"
                  alt="3D Printer in Action"
                  className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-700 ease-out"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guarantee Badges Section */}
      <section className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <GuaranteeBadges />
      </section>

      {/* Features Row */}
      <section className="py-14 border-t border-gray-200/80 dark:border-white/[0.06] bg-gray-50/50 dark:bg-[#080b11]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="apple-glass apple-card-hover p-6 rounded-3xl border border-gray-200/80 dark:border-white/[0.08] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 border border-amber-500/25">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5 tracking-tight">160mm Max Build Volume</h3>
                <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">
                  Precision single-piece prints up to 160×160×160mm with smart modular split options for oversized mechanical assemblies.
                </p>
              </div>
            </div>

            <div className="apple-glass apple-card-hover p-6 rounded-3xl border border-gray-200/80 dark:border-white/[0.08] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 border border-amber-500/25">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5 tracking-tight">7 Calibrated Materials</h3>
                <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">
                  PLA+, PETG, ABS, Carbon Fiber, TPU 95A, Nylon PA12, and 8K SLA Resin for industrial-grade strength and finish.
                </p>
              </div>
            </div>

            <div className="apple-glass apple-card-hover p-6 rounded-3xl border border-gray-200/80 dark:border-white/[0.08] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 border border-amber-500/25">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5 tracking-tight">Instant Slicing & Quoting</h3>
                <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">
                  Upload STL/3MF files for automatic bounding box detection, weight in grams, manifold check, and instant pricing.
                </p>
              </div>
            </div>

            <div
              onClick={() => setShowDeliveryModal(true)}
              className="apple-glass apple-card-hover p-6 rounded-3xl border border-emerald-500/25 flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300 border border-emerald-500/25">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">Shipping to {deliveryCityCount}+ Hubs</h3>
                  <span className="text-xs font-bold text-emerald-500 group-hover:translate-x-1 transition-transform duration-300">&rarr;</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">
                  Express 1-4 day delivery across India with shockproof bubble packaging and live tracking telemetry.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Showcase */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <span className="text-amber-500 font-semibold text-xs uppercase tracking-wider">Catalog</span>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Popular Precision 3D Prints</h2>
            </div>
            <Link to="/shop" className="text-amber-500 hover:text-amber-400 font-bold text-xs sm:text-sm flex items-center gap-1">
              View all products <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          {featuredProducts.length === 0 ? (
            <div className="text-center py-14 px-6 rounded-3xl apple-glass border border-gray-200/80 dark:border-white/[0.08] shadow-lg max-w-xl mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-3 border border-amber-500/25">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5">Catalog Being Updated</h3>
              <p className="text-xs text-gray-600 dark:text-zinc-400 mb-5 leading-relaxed">
                New precision 3D models are being curated. In the meantime, you can upload and slice your own custom 3D model with our instant quote engine.
              </p>
              <Link
                to="/custom-print"
                className="apple-btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950 font-bold text-xs shadow-md shadow-amber-500/20 hover:brightness-105 transition"
              >
                <span>Upload Custom 3D Model</span>
                <span>&rarr;</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  imageUrl={product.image}
                  category={product.category}
                  description={product.description}
                  onAddToCart={() => handleAddToCart(product, false)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Filament Swatches & Surface Finish Showcase */}
      <FilamentSwatches />

      {/* Volume Discount Tier Calculator Section */}
      <section className="py-16 border-t border-gray-200/80 dark:border-white/[0.06] text-inherit">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl apple-glass border border-gray-200/80 dark:border-white/[0.08] shadow-2xl">
            <div className="max-w-2xl mb-8">
              <span className="text-[11px] font-bold text-amber-500 uppercase tracking-widest block mb-1">
                Batch & Commercial Manufacturing
              </span>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Scale Up with Volume Tier Savings</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 mt-2 leading-relaxed">
                Need multiple units for robotics competitions, product packaging, or hardware validation? Get instant discounts up to 35% on batch orders.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-700 dark:text-zinc-300 font-medium">Batch Quantity:</span>
                  <span className="font-mono text-xl font-extrabold text-amber-500">{bulkQty} Units</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="300"
                  step="5"
                  value={bulkQty}
                  onChange={(e) => setBulkQty(Number(e.target.value))}
                  className="w-full accent-amber-500 h-2 bg-gray-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
                />

                <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-black/30 border border-gray-200/80 dark:border-white/[0.08] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-500 dark:text-zinc-400 block text-[10px] uppercase font-bold">Automatic Discount</span>
                    <strong className="text-lg text-emerald-500 font-mono">{getBulkDiscount(bulkQty)}% OFF</strong>
                  </div>
                  <Link
                    to={`/rfq?qty=${bulkQty}`}
                    className="apple-btn-primary px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-105 text-gray-950 font-bold text-xs transition shadow-md shadow-amber-500/20"
                  >
                    Request Enterprise Quote &rarr;
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-black/30 border border-gray-200/80 dark:border-white/[0.08]">
                  <div className="text-[10px] text-gray-500 dark:text-zinc-400 uppercase font-bold">10-49 Units</div>
                  <div className="text-base font-extrabold text-gray-900 dark:text-white mt-0.5 tracking-tight">15% Discount</div>
                  <p className="text-[10px] text-gray-500 dark:text-zinc-400 mt-1">Small batches & team kits</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-black/30 border border-gray-200/80 dark:border-white/[0.08]">
                  <div className="text-[10px] text-gray-500 dark:text-zinc-400 uppercase font-bold">50-199 Units</div>
                  <div className="text-base font-extrabold text-gray-900 dark:text-white mt-0.5 tracking-tight">25% Discount</div>
                  <p className="text-[10px] text-gray-500 dark:text-zinc-400 mt-1">Commercial pre-orders</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-black/30 border border-gray-200/80 dark:border-white/[0.08]">
                  <div className="text-[10px] text-gray-500 dark:text-zinc-400 uppercase font-bold">200+ Units</div>
                  <div className="text-base font-extrabold text-amber-500 mt-0.5 tracking-tight">35% Discount</div>
                  <p className="text-[10px] text-gray-500 dark:text-zinc-400 mt-1">Enterprise OEM contract</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-black/30 border border-gray-200/80 dark:border-white/[0.08]">
                  <div className="text-[10px] text-gray-500 dark:text-zinc-400 uppercase font-bold">NDA Protected</div>
                  <div className="text-base font-extrabold text-gray-900 dark:text-white mt-0.5 tracking-tight">100% Confidential</div>
                  <p className="text-[10px] text-gray-500 dark:text-zinc-400 mt-1">IP & proprietary CAD security</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ & DFAM Knowledge Base Accordion Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-widest block">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Additive Manufacturing Guidelines</h2>
          </div>

          <div className="space-y-3">
            {HOME_FAQS.map((faq, idx) => {
              const isOpen = faqOpenIndex === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition overflow-hidden ${
                    isOpen
                      ? 'bg-white dark:bg-[#0b0f17] border-amber-500/40 shadow-lg'
                      : 'bg-white/60 dark:bg-[#0b0f17]/70 border-gray-200 dark:border-gray-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setFaqOpenIndex(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-gray-900 dark:text-white"
                  >
                    <span>{faq.q}</span>
                    <span className={`text-xs text-amber-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 text-xs text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-800/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center pt-2">
            <Link to="/faq" className="text-xs font-bold text-amber-500 hover:underline">
              Read the full Design for Additive Manufacturing (DFAM) Guide &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* DELIVERY AVAILABILITY LOOKUP MODAL */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0b0f17] border border-amber-500/40 w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] flex flex-col text-white">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block py-0.5 px-2.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-2">
                  Nationwide Express Shipping Network
                </span>
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <span>🚚 Check Delivery Coverage</span>
                  <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold">
                    {deliveryCityCount}+ Cities
                  </span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  We ship precision custom 3D prints & ready catalog items across India with robust protective packaging.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setShowDeliveryModal(false); setCityLookupQuery(''); }}
                className="text-gray-400 hover:text-white text-lg p-1.5 rounded-xl hover:bg-gray-800 transition"
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
                className="w-full pl-10 pr-4 py-3 bg-[#121824] border border-gray-700 rounded-2xl text-xs text-white placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {cityLookupQuery && (
                <button
                  type="button"
                  onClick={() => setCityLookupQuery('')}
                  className="absolute right-3.5 top-3.5 text-xs text-gray-400 hover:text-white font-bold"
                >
                  ✕ Clear
                </button>
              )}
            </div>

            {/* City Grid / Directory */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div className="flex items-center justify-between text-xs text-gray-400 font-semibold uppercase tracking-wider">
                <span>Verified Direct Coverage Hubs ({deliveryCities.filter(c => c.active !== false).length})</span>
                <span className="text-[10px] lowercase font-normal">active express hubs</span>
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
                      className="p-3 rounded-2xl bg-[#121824] border border-gray-800 flex items-center justify-between hover:border-amber-500/40 transition"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-1">
                          <span className="text-amber-400 text-xs">📍</span>
                          <span>{city.name}</span>
                        </div>
                        <span className="text-[10px] text-gray-400">{city.state}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
                        {city.estimatedDays || '2-4 Days'}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-3 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-gray-400 text-[11px] flex items-center gap-1.5">
                <span>⚡ Express dispatch within 24-48 hours with door-to-door tracking.</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Link
                  to="/shop"
                  onClick={() => setShowDeliveryModal(false)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-gray-950 font-bold text-xs shadow-md transition"
                >
                  Browse Store &rarr;
                </Link>
                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs transition"
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
