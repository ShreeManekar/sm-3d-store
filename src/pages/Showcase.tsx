import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { GuaranteeBadges } from '../components/GuaranteeBadges';

export interface ReviewItem {
  id: string;
  customerName: string;
  designation?: string;
  rating: number;
  verifiedBuyer: boolean;
  productName: string;
  category: string;
  date: string;
  image?: string;
  review: string;
  material?: string;
  printTime?: string;
  weight?: string;
}

const FALLBACK_REVIEWS: ReviewItem[] = [
  {
    id: 'rev_1',
    customerName: 'Aarav Mehta',
    designation: 'Aerospace Engineering Student, IIT Bombay',
    rating: 5,
    verifiedBuyer: true,
    productName: 'CF-PETG Lightweight Drone Gimbal',
    category: 'Engineering & Drone Parts',
    date: '2026-10-18',
    image: '/assets/images/product_gearbox_1786179220985.webp',
    review: 'Dimensional accuracy was within ±0.08mm! The carbon-fiber composite is exceptionally stiff with zero flex under 6S motor vibration. Saved our robotics team weeks of CNC machining time.',
    material: 'Carbon Fiber PETG',
    printTime: '8h 24m',
    weight: '64g',
  },
  {
    id: 'rev_2',
    customerName: 'Priya Sundaram',
    designation: 'Lead Interior Architect, Bengaluru',
    rating: 5,
    verifiedBuyer: true,
    productName: 'Parametric Hexagon Planter & Water Reservoir',
    category: 'Home & Decor',
    date: '2026-10-21',
    image: '/assets/images/product_planter_1786179235105.webp',
    review: 'Ordered in Silk Aztec Gold. The water reservoir drainage tray fit together seamlessly with crisp watertight walls. Express dispatch arrived in Bengaluru in just 2 days with flawless packaging!',
    material: 'Silk Aztec Gold PLA',
    printTime: '11h 10m',
    weight: '142g',
  },
  {
    id: 'rev_3',
    customerName: 'Vikram Rajput',
    designation: 'Hardware Prototype Lead, Pune',
    rating: 5,
    verifiedBuyer: true,
    productName: 'Dual Planetary Reduction Mechanism',
    category: 'Robotics & Mechanisms',
    date: '2026-10-24',
    image: '/assets/images/product_dragon_1786179208256.webp',
    review: 'The print-in-place tolerances are incredible. All 5 planetary gears rotated freely right off the build plate without any binding or manual sanding needed. Outstanding print calibration.',
    material: 'High-Strength PETG',
    printTime: '6h 45m',
    weight: '98g',
  },
  {
    id: 'rev_4',
    customerName: 'Neha Deshmukh',
    designation: 'Product Designer, Mumbai',
    rating: 5,
    verifiedBuyer: true,
    productName: 'Ergonomic Studio Headphone Stand',
    category: 'Desk Accessories',
    date: '2026-10-25',
    image: '/assets/images/product_headphone_stand_1786179253396.webp',
    review: 'Rock solid base with zero wobble, gorgeous matte finish that looks like a factory-molded retail product. The integrated cable canal is super clean.',
    material: 'Matte Jet Black PLA+',
    printTime: '9h 15m',
    weight: '185g',
  },
];

interface BeforeAfterItem {
  id: string;
  title: string;
  material: string;
  beforeLabel: string;
  afterLabel: string;
  beforeImg: string;
  afterImg: string;
  technique: string;
  description: string;
}

const BEFORE_AFTER_SHOWCASE: BeforeAfterItem[] = [
  {
    id: 'ba_1',
    title: 'Planetary Gearbox Reduction Mechanism',
    material: 'High-Strength PETG',
    beforeLabel: 'Raw 0.20mm Layer Extrusion',
    afterLabel: 'Ultrasonic Cleaned & PTFE Lubricated',
    beforeImg: '/assets/images/product_gearbox_1786179220985.webp',
    afterImg: '/assets/images/product_dragon_1786179208256.webp',
    technique: 'Support release + ultrasonic cleaning + PTFE dry-film lubricant',
    description: 'Print-in-place planetary reduction gears smoothed to effortless zero-backlash rotation with silky mechanical glide.'
  },
  {
    id: 'ba_2',
    title: 'Parametric Hexagon Planter & Basin',
    material: 'Aztec Silk Gold PLA+',
    beforeLabel: 'Standard Sliced Shell',
    afterLabel: 'Vapor Smoothed & Hydro-Tested',
    beforeImg: '/assets/images/product_planter_1786179235105.webp',
    afterImg: '/assets/images/product_headphone_stand_1786179253396.webp',
    technique: 'Sub-micron chemical smoothing + 100% watertight reservoir pressure test',
    description: 'Satin silk finish sealed for continuous water contact without internal seepage or micro-porosity leaks.'
  },
  {
    id: 'ba_3',
    title: 'Ergonomic Studio Headphone Stand',
    material: 'Stealth Jet Black PETG',
    beforeLabel: 'Raw 3D Extrusion',
    afterLabel: 'Matte Bead-Blasted + Threaded Inserts',
    beforeImg: '/assets/images/product_headphone_stand_1786179253396.webp',
    afterImg: '/assets/images/hero_3d_printer_1786179196218.webp',
    technique: 'Micro-bead textured blast + M4 brass heat-set threaded inserts',
    description: 'Velvet matte finish eliminating visible layer strata, paired with factory-spec metal threading for repeated clamping.'
  }
];

const Showcase: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewItem[]>(FALLBACK_REVIEWS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [activeBaTabs, setActiveBaTabs] = useState<{ [key: string]: 'before' | 'after' }>({
    ba_1: 'after',
    ba_2: 'after',
    ba_3: 'after',
  });

  // Review submission state
  const [customerName, setCustomerName] = useState('');
  const [designation, setDesignation] = useState('');
  const [productName, setProductName] = useState('');
  const [material, setMaterial] = useState('PLA+');
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    axios
      .get('/api/reviews')
      .then((res) => {
        if (!isMounted) return;
        if (Array.isArray(res.data) && res.data.length > 0) {
          setReviews(res.data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = ['All', 'Engineering & Drone Parts', 'Home & Decor', 'Robotics & Mechanisms', 'Desk Accessories'];

  const filteredReviews = reviews.filter((r) => {
    if (selectedCategory === 'All') return true;
    return r.category === selectedCategory;
  });

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !productName.trim() || !reviewText.trim()) return;

    setSubmitting(true);
    try {
      const res = await axios.post('/api/reviews', {
        customerName: customerName.trim(),
        designation: designation.trim() || 'Verified Customer',
        productName: productName.trim(),
        material,
        rating,
        review: reviewText.trim(),
        category: 'Custom Print Showcase',
      });
      if (res.data?.review) {
        setReviews([res.data.review, ...reviews]);
      }
      setShowSubmitModal(false);
      setCustomerName('');
      setDesignation('');
      setProductName('');
      setReviewText('');
      setToastMsg('Thank you! Your print review has been posted.');
      setTimeout(() => setToastMsg(null), 3500);
    } catch (err) {
      alert('Failed to post review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-transparent text-inherit">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Toast */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#0b0f17] border border-amber-500/50 text-amber-300 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-fade-in">
            <span className="text-emerald-400">✓</span>
            <span className="text-xs font-semibold">{toastMsg}</span>
          </div>
        )}

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-amber-500 dark:hover:text-amber-400 transition">Home</Link>
          <span>/</span>
          <span className="text-amber-600 dark:text-amber-400 font-medium">Customer Showcase & Reviews</span>
        </nav>

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-block py-1 px-4 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-500 border border-amber-500/25 backdrop-blur-md">
            Real Customer Prints & Testimonials
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-950 dark:text-white tracking-tight leading-[1.08]">
            Precision Prints, <span className="apple-gold-gradient">Real Results</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-zinc-400 leading-relaxed font-normal">
            See photos and verified reviews from engineers, hobbyists, architects, and robotics teams who trust SM 3D Store for high-accuracy physical manufacturing.
          </p>

          {/* Aggregate Rating Banner */}
          <div className="inline-flex items-center gap-4 p-3.5 px-6 rounded-full apple-glass border border-gray-200/80 dark:border-white/[0.08] shadow-xl mt-2">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-lg">★</span>
              ))}
            </div>
            <div className="text-xs text-left">
              <span className="font-extrabold text-gray-900 dark:text-white text-sm">4.96 / 5.0 Rating</span>
              <p className="text-[10px] text-gray-500 dark:text-zinc-400">Over 350+ parts printed with zero delaminations</p>
            </div>
          </div>
        </div>

        {/* Guarantees Bar */}
        <GuaranteeBadges />

        {/* Filter & Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl apple-glass border border-gray-200/80 dark:border-white/[0.08] shadow-xl">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 active:scale-95 ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950 shadow-md shadow-amber-500/25'
                    : 'bg-gray-100 dark:bg-black/30 text-gray-700 dark:text-zinc-300 hover:text-amber-500 border border-gray-200/80 dark:border-white/[0.08]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="apple-btn-primary px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-105 text-gray-950 font-bold text-xs shadow-md shadow-amber-500/20 transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>✍️ Write a Print Review</span>
          </button>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="apple-glass apple-card-hover rounded-3xl p-6 sm:p-7 border border-gray-200/80 dark:border-white/[0.08] shadow-sm hover:shadow-2xl flex flex-col justify-between space-y-4 transition-all duration-500 ease-out"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-gray-900 dark:text-white text-base tracking-tight">{rev.customerName}</h3>
                      {rev.verifiedBuyer && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                          ✓ Verified Buyer
                        </span>
                      )}
                    </div>
                    {rev.designation && (
                      <span className="text-xs text-amber-400/90 font-medium">{rev.designation}</span>
                    )}
                  </div>

                  <div className="flex items-center text-amber-400 text-sm">
                    {[...Array(rev.rating)].map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                </div>

                {/* Print Specs Box */}
                <div className="p-3 rounded-2xl bg-[#121824] border border-gray-800 flex flex-wrap items-center justify-between gap-2 text-xs mb-3">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold">Fabricated Item</span>
                    <strong className="text-gray-100">{rev.productName}</strong>
                  </div>
                  {rev.material && (
                    <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-mono">
                      {rev.material}
                    </span>
                  )}
                  {rev.printTime && (
                    <span className="text-gray-400 text-[11px]">Print Time: {rev.printTime}</span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed italic">
                  "{rev.review}"
                </p>
              </div>

              <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
                <span>Category: {rev.category}</span>
                <span className="font-mono text-[11px]">{rev.date}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Before & After Post-Processing Showcase */}
        <div className="space-y-6 pt-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="inline-block py-0.5 px-3 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Interactive Surface Transformations
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Before & After <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">Post-Processing Quality</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-400">
              Toggle between raw as-printed physical geometry and our hand-finished, chemical-smoothed, or bead-blasted end-use parts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BEFORE_AFTER_SHOWCASE.map((item) => {
              const currentTab = activeBaTabs[item.id] || 'after';
              const currentImg = currentTab === 'before' ? item.beforeImg : item.afterImg;
              const currentLabel = currentTab === 'before' ? item.beforeLabel : item.afterLabel;

              return (
                <div
                  key={item.id}
                  className="rounded-3xl bg-[#0b0f17] border border-amber-500/20 p-5 shadow-2xl shadow-black/90 space-y-4 flex flex-col justify-between hover:border-amber-500/40 transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
                        {item.material}
                      </span>
                      {/* Interactive Before / After toggle */}
                      <div className="flex items-center bg-[#121824] p-1 rounded-xl border border-gray-800 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setActiveBaTabs({ ...activeBaTabs, [item.id]: 'before' })}
                          className={`px-2.5 py-1 rounded-lg transition ${
                            currentTab === 'before'
                              ? 'bg-amber-500 text-gray-950 shadow-sm'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Raw
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveBaTabs({ ...activeBaTabs, [item.id]: 'after' })}
                          className={`px-2.5 py-1 rounded-lg transition ${
                            currentTab === 'after'
                              ? 'bg-amber-500 text-gray-950 shadow-sm'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Finished
                        </button>
                      </div>
                    </div>

                    <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-black/60 border border-gray-800 group">
                      <img
                        src={currentImg}
                        alt={item.title}
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <div className="absolute bottom-2 left-2 right-2 px-3 py-1.5 rounded-xl bg-[#080b11]/85 backdrop-blur-md border border-amber-500/30 flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-gray-200">{currentLabel}</span>
                        <span className="text-amber-400 font-bold text-[10px] uppercase tracking-wider">{currentTab}</span>
                      </div>
                    </div>

                    <h3 className="font-bold text-white text-sm">{item.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{item.description}</p>
                  </div>

                  <div className="pt-3 border-t border-gray-800/80 text-[10px] text-gray-400 flex items-center gap-1.5">
                    <span className="text-amber-400 font-bold">⚙️ Process:</span>
                    <span>{item.technique}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Review Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[#0b0f17] border border-amber-500/40 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Share Your 3D Print Experience</h3>
                  <p className="text-xs text-gray-400 mt-1">Help other creators and engineers choose the best material and setup.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="text-gray-400 hover:text-white text-lg p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-[#121824] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Role / Organization (Optional)</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Mechanical Engineer, Pune"
                    className="w-full bg-[#121824] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Product / Model Name</label>
                    <input
                      type="text"
                      required
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="e.g. Robot Gripper"
                      className="w-full bg-[#121824] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Material Used</label>
                    <select
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      className="w-full bg-[#121824] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="PLA+">PLA+</option>
                      <option value="PETG">PETG</option>
                      <option value="ABS">ABS</option>
                      <option value="CF-PETG">Carbon Fiber PETG</option>
                      <option value="TPU">TPU 95A</option>
                      <option value="Resin">8K Tough Resin</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Star Rating (1 to 5)</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className={`text-2xl transition ${rating >= star ? 'text-amber-400 scale-110' : 'text-gray-600'}`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="text-amber-300 font-bold ml-2">{rating} Stars</span>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Your Review & Feedback</label>
                  <textarea
                    rows={3}
                    required
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Describe print quality, layer adhesion, tolerance fit, or delivery speed..."
                    className="w-full bg-[#121824] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-gray-950 font-bold"
                  >
                    {submitting ? 'Submitting...' : 'Post Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Showcase;
