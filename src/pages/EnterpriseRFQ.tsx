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
          <span className="inline-block py-1 px-3.5 rounded-full text-xs font-bold tracking-wider uppercase bg-amber-500/10 text-amber-500 border border-amber-500/30">
            B2B Commercial & Educational Production
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Volume Discounts & <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">Enterprise RFQ</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
            High-volume additive manufacturing for hardware startups, universities, robotics teams, and industrial OEMs. Guaranteed capacity, NDA compliance, and batch discounts up to 35%.
          </p>
        </div>

        {/* Guarantees */}
        <GuaranteeBadges />

        {/* Interactive Volume Discount Tier Calculator */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0b0f17] border border-amber-500/30 shadow-2xl shadow-black/95 text-white space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-800 gap-2">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Interactive Calculator</span>
              <h2 className="text-2xl font-extrabold text-white mt-0.5">Volume Discount Tier Estimator</h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs self-start sm:self-auto">
              {currentTier.label}
            </span>
          </div>

          {/* Slider & Quantity Display */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Selected Production Quantity:</span>
              <span className="font-mono font-extrabold text-xl text-amber-400">{sliderQty} Units</span>
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
              className="w-full accent-amber-500 h-2 bg-gray-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-gray-400 font-mono">
              <span>1 pc (0%)</span>
              <span>10 pcs (15%)</span>
              <span>50 pcs (25%)</span>
              <span>200+ pcs (35% OFF)</span>
            </div>
          </div>

          {/* Tier Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className={`p-4 rounded-2xl border transition ${sliderQty < 10 ? 'bg-[#121824] border-amber-400 shadow-lg shadow-amber-500/10' : 'bg-[#080b11] border-gray-800'}`}>
              <div className="text-[10px] text-gray-400 uppercase font-bold">1 - 9 Units</div>
              <div className="text-sm font-extrabold text-white mt-0.5">Standard</div>
              <div className="text-[11px] text-amber-400 mt-1 font-semibold">0% Discount</div>
            </div>

            <div className={`p-4 rounded-2xl border transition ${sliderQty >= 10 && sliderQty < 50 ? 'bg-[#121824] border-amber-400 shadow-lg shadow-amber-500/10' : 'bg-[#080b11] border-gray-800'}`}>
              <div className="text-[10px] text-gray-400 uppercase font-bold">10 - 49 Units</div>
              <div className="text-sm font-extrabold text-white mt-0.5">Small Batch</div>
              <div className="text-[11px] text-amber-400 mt-1 font-semibold">15% OFF</div>
            </div>

            <div className={`p-4 rounded-2xl border transition ${sliderQty >= 50 && sliderQty < 200 ? 'bg-[#121824] border-amber-400 shadow-lg shadow-amber-500/10' : 'bg-[#080b11] border-gray-800'}`}>
              <div className="text-[10px] text-gray-400 uppercase font-bold">50 - 199 Units</div>
              <div className="text-sm font-extrabold text-white mt-0.5">Commercial</div>
              <div className="text-[11px] text-amber-400 mt-1 font-semibold">25% OFF</div>
            </div>

            <div className={`p-4 rounded-2xl border transition ${sliderQty >= 200 ? 'bg-[#121824] border-amber-400 shadow-lg shadow-amber-500/10' : 'bg-[#080b11] border-gray-800'}`}>
              <div className="text-[10px] text-gray-400 uppercase font-bold">200+ Units</div>
              <div className="text-sm font-extrabold text-white mt-0.5">Enterprise</div>
              <div className="text-[11px] text-emerald-400 mt-1 font-semibold">35% Maximum OFF</div>
            </div>
          </div>

          {/* Pricing Estimation Summary */}
          <div className="p-4 rounded-2xl bg-[#121824] border border-gray-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <span className="text-[10px] text-gray-400 block">Unit Cost Estimate</span>
              <strong className="text-base text-white">₹{unitDiscountedPrice} <span className="text-[10px] text-gray-400 font-normal">/ piece</span></strong>
            </div>

            <div>
              <span className="text-[10px] text-gray-400 block">Total Batch Estimate</span>
              <strong className="text-base text-amber-400">₹{totalDiscountedPrice.toLocaleString()}</strong>
            </div>

            {totalSavings > 0 && (
              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
                ✓ Total Savings: ₹{totalSavings.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* RFQ Submission Form */}
        {submittedRfq ? (
          <div className="rounded-3xl border border-amber-500/40 bg-[#0b0f17] p-8 sm:p-12 text-center shadow-2xl text-white max-w-2xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2 border border-amber-500/40">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
              RFQ ID: {submittedRfq.id}
            </span>
            <h2 className="text-2xl font-extrabold text-white">Enterprise RFQ Received!</h2>
            <p className="text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
              Our engineering lead will review your technical specifications for <strong className="text-amber-400">{submittedRfq.quantity} units</strong> in <strong className="text-amber-400">{submittedRfq.material}</strong>. An official commercial quotation and DFM feedback will be delivered to <strong className="text-white">{submittedRfq.email}</strong> within 12-24 hours.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSubmittedRfq(null)}
                className="px-6 py-2.5 rounded-xl bg-amber-500 text-gray-950 font-bold text-xs shadow-md transition"
              >
                Submit Another Inquiry
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0b0f17] border border-amber-500/20 shadow-2xl shadow-black/95 text-white space-y-6">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">Direct Submission</span>
              <h2 className="text-2xl font-extrabold text-white mt-1">Request Formal Enterprise Quotation</h2>
              <p className="text-xs text-gray-400 mt-1">
                Receive commercial pricing, production scheduling, and non-disclosure agreement execution within 24 hours.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-950/60 border border-red-500/40 text-red-300 rounded-xl text-xs flex items-center gap-2">
                <span>⚠️ {error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Company / Institution Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Robotics or IIT Bombay"
                    className="w-full bg-[#121824] border border-gray-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Contact Person Name *</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Vikram Sharma"
                    className="w-full bg-[#121824] border border-gray-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Corporate Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-[#121824] border border-gray-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">10-Digit Mobile / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9812345678"
                    className="w-full bg-[#121824] border border-gray-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Target Quantity (Units)</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(e.target.value);
                      const n = parseInt(e.target.value) || 1;
                      setSliderQty(Math.min(500, n));
                    }}
                    className="w-full bg-[#121824] border border-gray-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Preferred Polymer Material</label>
                  <select
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full bg-[#121824] border border-gray-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="CF-PETG">Carbon Fiber PETG (High Rigidity)</option>
                    <option value="PETG">High-Strength PETG (Functional)</option>
                    <option value="ABS">ABS (Automotive & High Temp)</option>
                    <option value="PLA+">PLA+ (High Detail Aesthetic)</option>
                    <option value="TPU">TPU 95A (Elastomer Flexible)</option>
                    <option value="PA12">Nylon PA12 (Industrial Low Friction)</option>
                    <option value="Resin">8K Tough Resin (Ultra-Fine SLA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Target Delivery Deadline</label>
                  <select
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-[#121824] border border-gray-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Priority Rush (24-48 Hours)">Priority Rush (24-48 Hours)</option>
                    <option value="Within 1 Week">Within 1 Week</option>
                    <option value="Within 2 Weeks">Within 2 Weeks</option>
                    <option value="Within 1 Month">Within 1 Month</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Technical Specifications & Tolerances</label>
                <textarea
                  rows={3}
                  value={projectNotes}
                  onChange={(e) => setProjectNotes(e.target.value)}
                  placeholder="Specify part dimensions, mating clearances, thread insert requirements, or share a CAD download link (Google Drive / WeTransfer)..."
                  className="w-full bg-[#121824] border border-gray-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#121824] border border-gray-800 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="ndaCheckbox"
                  checked={ndaRequired}
                  onChange={(e) => setNdaRequired(e.target.checked)}
                  className="rounded border-gray-700 text-amber-500 accent-amber-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="ndaCheckbox" className="text-gray-300 text-xs cursor-pointer select-none">
                  <strong className="text-white">Mutual NDA Required:</strong> Please send standard Non-Disclosure Agreement prior to CAD file inspection.
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-gray-950 font-extrabold text-sm shadow-xl shadow-amber-500/25 transition transform active:scale-95 flex items-center gap-2"
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
