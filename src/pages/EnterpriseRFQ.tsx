import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { GuaranteeBadges } from '../components/GuaranteeBadges';

const EnterpriseRFQ: React.FC = () => {
  // Volume calculator state
  const [sliderQty, setSliderQty] = useState<number>(50);
  const [sampleBasePrice] = useState<number>(450); // average base price per piece in INR

  // RFQ form state
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [quantity, setQuantity] = useState('50');
  const [material, setMaterial] = useState('CF-PETG');
  const [targetDate, setTargetDate] = useState('Within 2 Weeks');
  const [projectNotes, setProjectNotes] = useState('');
  const [ndaRequired, setNdaRequired] = useState(false);

  // Submission state
  const [loading, setLoading] = useState(false);
  const [submittedRfq, setSubmittedRfq] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calculate discount tier
  const getDiscountTier = (qty: number) => {
    if (qty >= 200) return { pct: 35, label: '35% Enterprise Discount', tier: 'Enterprise Tier (200+ pcs)' };
    if (qty >= 50) return { pct: 25, label: '25% Batch Discount', tier: 'Commercial Batch (50-199 pcs)' };
    if (qty >= 10) return { pct: 15, label: '15% Volume Discount', tier: 'Small Batch (10-49 pcs)' };
    return { pct: 0, label: 'Standard Single Unit Price', tier: 'Prototyping (1-9 pcs)' };
  };

  const currentTier = getDiscountTier(sliderQty);
  const unitDiscountedPrice = Math.round(sampleBasePrice * (1 - currentTier.pct / 100));
  const totalStandardPrice = sampleBasePrice * sliderQty;
  const totalDiscountedPrice = unitDiscountedPrice * sliderQty;
  const totalSavings = totalStandardPrice - totalDiscountedPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setError('Please provide a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        companyName: companyName.trim(),
        contactName: contactName.trim(),
        email: email.trim().toLowerCase(),
        phone: `+91 ${cleanPhone}`,
        quantity: parseInt(quantity) || sliderQty,
        material,
        targetDate,
        projectNotes: projectNotes.trim(),
        ndaRequired,
      };

      const res = await axios.post('/api/rfq', payload);
      setSubmittedRfq(res.data?.rfq || { id: `RFQ-${Date.now().toString().slice(-4)}`, ...payload });
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to submit enterprise RFQ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-transparent text-inherit">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-amber-500 dark:hover:text-amber-400 transition">Home</Link>
          <span>/</span>
          <span className="text-amber-600 dark:text-amber-400 font-medium">Enterprise & Bulk RFQ</span>
        </nav>

        {/* Title */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 py-1 px-3.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            B2B Commercial & Educational Production
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-display text-gray-900 dark:text-white leading-[1.08]">
            Volume Discounts & <span className="apple-gold-gradient">Enterprise RFQ</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-normal leading-relaxed max-w-2xl mx-auto">
            High-volume additive manufacturing for hardware startups, universities, robotics teams, and industrial OEMs. Guaranteed capacity, NDA compliance, and batch discounts up to 35%.
          </p>
        </div>

        {/* Guarantees */}
        <GuaranteeBadges />

        {/* Interactive Volume Discount Tier Calculator */}
        <div className="p-6 sm:p-8 rounded-3xl apple-glass apple-card-hover border border-gray-200/80 dark:border-white/[0.08] shadow-2xl backdrop-blur-xl transition-all duration-500 ease-apple text-gray-900 dark:text-white space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-200/80 dark:border-white/[0.08] gap-2">
            <div>
              <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-widest block">Interactive Calculator</span>
              <h2 className="text-2xl font-extrabold font-display text-gray-900 dark:text-white mt-0.5">Volume Discount Tier Estimator</h2>
            </div>
            <span className="px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-300 font-bold text-xs self-start sm:self-auto backdrop-blur-md">
              {currentTier.label}
            </span>
          </div>

          {/* Slider & Quantity Display */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600 dark:text-gray-400 font-medium">Selected Production Quantity:</span>
              <span className="font-mono font-extrabold text-2xl text-amber-500 dark:text-amber-400">{sliderQty} Units</span>
            </div>
            <input
              type="range"
              min="1"
              max="500"
              step="5"
              value={sliderQty}
              onChange={(e) => {
                const val = Number(e.target.value);
                setSliderQty(val);
                setQuantity(String(val));
              }}
              className="w-full accent-amber-500 h-2 bg-gray-200 dark:bg-gray-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400 font-mono">
              <span>1 pc (0%)</span>
              <span>10 pcs (15%)</span>
              <span>50 pcs (25%)</span>
              <span>200+ pcs (35% OFF)</span>
            </div>
          </div>

          {/* Tier Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className={`p-4 rounded-2xl border transition-all duration-300 ease-apple ${sliderQty < 10 ? 'bg-amber-500/10 border-amber-400/80 shadow-lg shadow-amber-500/10' : 'bg-gray-100/60 dark:bg-white/[0.03] border-gray-200/60 dark:border-white/[0.06]'}`}>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">1 - 9 Units</div>
              <div className="text-sm font-extrabold text-gray-900 dark:text-white mt-0.5">Standard</div>
              <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-semibold">0% Discount</div>
            </div>

            <div className={`p-4 rounded-2xl border transition-all duration-300 ease-apple ${sliderQty >= 10 && sliderQty < 50 ? 'bg-amber-500/10 border-amber-400/80 shadow-lg shadow-amber-500/10' : 'bg-gray-100/60 dark:bg-white/[0.03] border-gray-200/60 dark:border-white/[0.06]'}`}>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">10 - 49 Units</div>
              <div className="text-sm font-extrabold text-gray-900 dark:text-white mt-0.5">Small Batch</div>
              <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-semibold">15% OFF</div>
            </div>

            <div className={`p-4 rounded-2xl border transition-all duration-300 ease-apple ${sliderQty >= 50 && sliderQty < 200 ? 'bg-amber-500/10 border-amber-400/80 shadow-lg shadow-amber-500/10' : 'bg-gray-100/60 dark:bg-white/[0.03] border-gray-200/60 dark:border-white/[0.06]'}`}>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">50 - 199 Units</div>
              <div className="text-sm font-extrabold text-gray-900 dark:text-white mt-0.5">Commercial</div>
              <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-semibold">25% OFF</div>
            </div>

            <div className={`p-4 rounded-2xl border transition-all duration-300 ease-apple ${sliderQty >= 200 ? 'bg-amber-500/10 border-amber-400/80 shadow-lg shadow-amber-500/10' : 'bg-gray-100/60 dark:bg-white/[0.03] border-gray-200/60 dark:border-white/[0.06]'}`}>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">200+ Units</div>
              <div className="text-sm font-extrabold text-gray-900 dark:text-white mt-0.5">Enterprise</div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">35% Maximum OFF</div>
            </div>
          </div>

          {/* Pricing Estimation Summary */}
          <div className="p-4 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 block font-medium">Unit Cost Estimate</span>
              <strong className="text-base text-gray-900 dark:text-white font-extrabold">₹{unitDiscountedPrice} <span className="text-[10px] text-gray-500 dark:text-gray-400 font-normal">/ piece</span></strong>
            </div>

            <div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 block font-medium">Total Batch Estimate</span>
              <strong className="text-base text-amber-600 dark:text-amber-400 font-extrabold">₹{totalDiscountedPrice.toLocaleString()}</strong>
            </div>

            {totalSavings > 0 && (
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 font-bold backdrop-blur-md">
                ✓ Total Savings: ₹{totalSavings.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* RFQ Submission Form */}
        {submittedRfq ? (
          <div className="rounded-3xl border border-amber-500/30 apple-glass p-8 sm:p-12 text-center shadow-2xl backdrop-blur-xl text-gray-900 dark:text-white max-w-2xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-2 border border-amber-500/30 shadow-lg shadow-amber-500/10">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest">
              RFQ ID: {submittedRfq.id}
            </span>
            <h2 className="text-3xl font-extrabold font-display text-gray-900 dark:text-white">Enterprise RFQ Received!</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
              Our engineering lead will review your technical specifications for <strong className="text-amber-500">{submittedRfq.quantity} units</strong> in <strong className="text-amber-500">{submittedRfq.material}</strong>. An official commercial quotation and DFM feedback will be delivered to <strong className="text-gray-900 dark:text-white">{submittedRfq.email}</strong> within 12-24 hours.
            </p>
            <div className="pt-3">
              <button
                type="button"
                onClick={() => setSubmittedRfq(null)}
                className="apple-btn-primary px-7 py-3 rounded-2xl text-gray-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all duration-300 ease-apple active:scale-95"
              >
                Submit Another Inquiry
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 rounded-3xl apple-glass border border-gray-200/80 dark:border-white/[0.08] shadow-2xl backdrop-blur-xl transition-all duration-500 ease-apple text-gray-900 dark:text-white space-y-6">
            <div>
              <span className="text-xs font-bold text-amber-500 uppercase tracking-widest block">Direct Submission</span>
              <h2 className="text-2xl font-extrabold font-display text-gray-900 dark:text-white mt-1">Request Formal Enterprise Quotation</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                Receive commercial pricing, production scheduling, and non-disclosure agreement execution within 24 hours.
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 rounded-2xl text-xs flex items-center gap-2">
                <span>⚠️ {error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1.5">Company / Institution Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Robotics or IIT Bombay"
                    className="w-full bg-gray-50/80 dark:bg-white/[0.04] border border-gray-300/80 dark:border-white/[0.1] rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1.5">Contact Person Name *</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Vikram Sharma"
                    className="w-full bg-gray-50/80 dark:bg-white/[0.04] border border-gray-300/80 dark:border-white/[0.1] rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1.5">Corporate Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-gray-50/80 dark:bg-white/[0.04] border border-gray-300/80 dark:border-white/[0.1] rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1.5">10-Digit Mobile / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9812345678"
                    className="w-full bg-gray-50/80 dark:bg-white/[0.04] border border-gray-300/80 dark:border-white/[0.1] rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 font-mono transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1.5">Target Quantity (Units)</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(e.target.value);
                      const n = parseInt(e.target.value) || 1;
                      setSliderQty(Math.min(500, n));
                    }}
                    className="w-full bg-gray-50/80 dark:bg-white/[0.04] border border-gray-300/80 dark:border-white/[0.1] rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 font-mono transition"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1.5">Preferred Polymer Material</label>
                  <select
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full bg-gray-50/80 dark:bg-white/[0.04] border border-gray-300/80 dark:border-white/[0.1] rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 transition"
                  >
                    <option value="CF-PETG" className="dark:bg-gray-900">Carbon Fiber PETG (High Rigidity)</option>
                    <option value="PETG" className="dark:bg-gray-900">High-Strength PETG (Functional)</option>
                    <option value="ABS" className="dark:bg-gray-900">ABS (Automotive & High Temp)</option>
                    <option value="PLA+" className="dark:bg-gray-900">PLA+ (High Detail Aesthetic)</option>
                    <option value="TPU" className="dark:bg-gray-900">TPU 95A (Elastomer Flexible)</option>
                    <option value="PA12" className="dark:bg-gray-900">Nylon PA12 (Industrial Low Friction)</option>
                    <option value="Resin" className="dark:bg-gray-900">8K Tough Resin (Ultra-Fine SLA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1.5">Target Delivery Deadline</label>
                  <select
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-gray-50/80 dark:bg-white/[0.04] border border-gray-300/80 dark:border-white/[0.1] rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 transition"
                  >
                    <option value="Priority Rush (24-48 Hours)" className="dark:bg-gray-900">Priority Rush (24-48 Hours)</option>
                    <option value="Within 1 Week" className="dark:bg-gray-900">Within 1 Week</option>
                    <option value="Within 2 Weeks" className="dark:bg-gray-900">Within 2 Weeks</option>
                    <option value="Within 1 Month" className="dark:bg-gray-900">Within 1 Month</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1.5">Technical Specifications & Tolerances</label>
                <textarea
                  rows={3}
                  value={projectNotes}
                  onChange={(e) => setProjectNotes(e.target.value)}
                  placeholder="Specify part dimensions, mating clearances, thread insert requirements, or share a CAD download link (Google Drive / WeTransfer)..."
                  className="w-full bg-gray-50/80 dark:bg-white/[0.04] border border-gray-300/80 dark:border-white/[0.1] rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 transition"
                />
              </div>

              <div className="p-4 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.08] flex items-center gap-3">
                <input
                  type="checkbox"
                  id="ndaCheckbox"
                  checked={ndaRequired}
                  onChange={(e) => setNdaRequired(e.target.checked)}
                  className="rounded border-gray-400 dark:border-gray-600 text-amber-500 accent-amber-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="ndaCheckbox" className="text-gray-700 dark:text-gray-300 text-xs cursor-pointer select-none">
                  <strong className="text-gray-900 dark:text-white">Mutual NDA Required:</strong> Please send standard Non-Disclosure Agreement prior to CAD file inspection.
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="apple-btn-primary px-8 py-3.5 rounded-2xl text-gray-950 font-extrabold text-sm shadow-xl shadow-amber-500/20 transition-all duration-300 ease-apple active:scale-95 flex items-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Submit Enterprise RFQ &rarr;</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnterpriseRFQ;
