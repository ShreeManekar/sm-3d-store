import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GuaranteeBadges } from '../components/GuaranteeBadges';

export interface MaterialInfo {
  id: string;
  name: string;
  shortCode: string;
  category: string;
  tensileStrength: string;
  heatDeflection: string;
  flexibility: string;
  uvResistance: string;
  foodSafe: string;
  finish: string;
  density: number;
  baseCostPerGram: number;
  leadTime: string;
  bestUses: string[];
  pros: string[];
  cons: string[];
}

const FALLBACK_MATERIALS: MaterialInfo[] = [
  {
    id: 'mat_pla',
    name: 'PLA+ (Polylactic Acid)',
    shortCode: 'PLA',
    category: 'Standard / Precision Detail',
    tensileStrength: '55-65 MPa',
    heatDeflection: '55 °C',
    flexibility: 'Low (1.5% elongation)',
    uvResistance: 'Moderate',
    foodSafe: 'Food Contact Safe (Raw resin)',
    finish: 'Smooth Satin / Aztec Gold Silk',
    density: 1.24,
    baseCostPerGram: 2.2,
    leadTime: '24-48 Hours',
    bestUses: ['Visual Prototypes', 'Articulated Miniatures', 'Architectural Models', 'Desk Accessories'],
    pros: ['Ultra-fine 0.12mm layer capability', 'Zero warping', 'Crisp overhangs', 'Biodegradable eco-polymer'],
    cons: ['Softens above 55°C', 'Brittle under repeated high-impact shocks'],
  },
  {
    id: 'mat_petg',
    name: 'PETG (High-Strength Glycol)',
    shortCode: 'PETG',
    category: 'Engineering / Outdoor Functional',
    tensileStrength: '50-58 MPa',
    heatDeflection: '75 °C',
    flexibility: 'Moderate (7% elongation)',
    uvResistance: 'Excellent (Weatherproof)',
    foodSafe: 'FDA Approved polymer',
    finish: 'Semi-gloss industrial durable',
    density: 1.27,
    baseCostPerGram: 2.8,
    leadTime: '24-48 Hours',
    bestUses: ['Outdoor Enclosures', 'Waterproof Reservoirs', 'Snap-fit Hinges', 'Drone Mounts', 'Automotive Clamps'],
    pros: ['Superior layer-to-layer weld strength', 'Chemically resistant to acids & oils', 'Weatherproof UV stability'],
    cons: ['Slightly more flexible than PLA', 'Requires high temperature dry storage'],
  },
  {
    id: 'mat_abs',
    name: 'ABS (Heat & Impact Resistant)',
    shortCode: 'ABS',
    category: 'High-Impact / Automotive',
    tensileStrength: '42-48 MPa',
    heatDeflection: '98 °C',
    flexibility: 'High (10% elongation)',
    uvResistance: 'Moderate',
    foodSafe: 'Not Recommended',
    finish: 'Matte (Acetone vapor-smoothable to glossy)',
    density: 1.04,
    baseCostPerGram: 3.2,
    leadTime: '2-3 Days',
    bestUses: ['Under-the-Hood Car Trim', 'Power Tool Casings', 'Electronics Housings', 'Machinable Fixtures'],
    pros: ['Withstands heat up to 98°C', 'Can be acetone vapor-smoothed to mirror gloss', 'High ductile impact toughness'],
    cons: ['Requires heated enclosure to print', 'Thermal contraction requires calibrated compensation'],
  },
  {
    id: 'mat_cf_petg',
    name: 'Carbon Fiber PETG (CF-PETG)',
    shortCode: 'CF-PETG',
    category: 'Advanced Composite',
    tensileStrength: '78-88 MPa',
    heatDeflection: '84 °C',
    flexibility: 'Ultra Rigid (<1% flex)',
    uvResistance: 'Superior',
    foodSafe: 'No',
    finish: 'Stealth Matte Charcoal with micro-fiber texture',
    density: 1.30,
    baseCostPerGram: 4.8,
    leadTime: '2-4 Days',
    bestUses: ['UAV / Drone Airframes', 'Robotic Arms', 'Precision Measurement Jigs', 'Motorsport Brackets'],
    pros: ['Exceptional strength-to-weight ratio', 'Virtually invisible layer seams', 'High dimensional stability'],
    cons: ['Requires hardened tool-steel nozzles', 'Higher material cost'],
  },
  {
    id: 'mat_tpu',
    name: 'TPU 95A (Flexible Elastomer)',
    shortCode: 'TPU',
    category: 'Flexible / Cushioning',
    tensileStrength: '35-42 MPa',
    heatDeflection: '60 °C',
    flexibility: 'Extreme (450% elongation)',
    uvResistance: 'High',
    foodSafe: 'Specific industrial grades',
    finish: 'Matte rubberized grip',
    density: 1.21,
    baseCostPerGram: 3.8,
    leadTime: '2-4 Days',
    bestUses: ['Vibration Dampers', 'Protective Bumpers', 'Sealing Gaskets', 'RC Tires', 'Ergonomic Grips'],
    pros: ['Virtually tear-proof', 'High elasticity and bounceback', 'Resistant to greases and lubricants'],
    cons: ['Slow print speed (25-35 mm/s)', 'Supports difficult to remove'],
  },
  {
    id: 'mat_nylon',
    name: 'Nylon PA12',
    shortCode: 'PA12',
    category: 'Industrial Low-Friction',
    tensileStrength: '65-72 MPa',
    heatDeflection: '110 °C',
    flexibility: 'Tough & Yielding',
    uvResistance: 'Good',
    foodSafe: 'Contact compliant grades',
    finish: 'Industrial velvet matte',
    density: 1.14,
    baseCostPerGram: 5.5,
    leadTime: '3-4 Days',
    bestUses: ['Kinematic Gear Trains', 'Heavy-Duty Snap Clips', 'Bushings & Bearings', 'Functional End-Use Machinery'],
    pros: ['Self-lubricating low friction coefficient', 'High fatigue cycle resistance', 'Continuous 110°C rating'],
    cons: ['Highly hygroscopic (needs active drybox feeding)', 'Warps without specialized adhesive beds'],
  },
  {
    id: 'mat_resin',
    name: 'Tough 8K Photopolymer Resin',
    shortCode: 'Resin',
    category: 'Ultra-High Detail Micro-SLA',
    tensileStrength: '48-56 MPa',
    heatDeflection: '65 °C',
    flexibility: 'Rigid / Glass-like',
    uvResistance: 'Requires clear UV-blocking topcoat',
    foodSafe: 'No',
    finish: 'Injection-mold smooth (0.025 - 0.05mm layers)',
    density: 1.18,
    baseCostPerGram: 6.0,
    leadTime: '2-3 Days',
    bestUses: ['Jewelry Master Molds', 'Tabletop Figurines & Miniatures', 'Medical & Dental Mockups', 'Fine Prototypes'],
    pros: ['Micron-level sharpness', 'Zero visible layer lines', 'Glass-like intricate resolution'],
    cons: ['Requires isopropyl wash & UV post-curing', 'More brittle than FDM filaments'],
  },
];

const MaterialsGuide: React.FC = () => {
  const [materials, setMaterials] = useState<MaterialInfo[]>(FALLBACK_MATERIALS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeMaterial, setActiveMaterial] = useState<MaterialInfo>(FALLBACK_MATERIALS[0]);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    axios
      .get('/api/materials')
      .then((res) => {
        if (!isMounted) return;
        if (Array.isArray(res.data) && res.data.length > 0) {
          setMaterials(res.data);
          setActiveMaterial(res.data[0]);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = ['All', 'Standard', 'Engineering', 'Composite', 'Flexible', 'Resin'];

  const filteredMaterials = materials.filter((m) => {
    const matchesCat =
      selectedCategory === 'All' ||
      (selectedCategory === 'Standard' && m.shortCode === 'PLA') ||
      (selectedCategory === 'Engineering' && (m.shortCode === 'PETG' || m.shortCode === 'ABS' || m.shortCode === 'PA12')) ||
      (selectedCategory === 'Composite' && m.shortCode === 'CF-PETG') ||
      (selectedCategory === 'Flexible' && m.shortCode === 'TPU') ||
      (selectedCategory === 'Resin' && m.shortCode === 'Resin');

    const matchesQuery =
      !searchQuery.trim() ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.bestUses.some((u) => u.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCat && matchesQuery;
  });

  const handleQuoteInMaterial = (mat: MaterialInfo) => {
    navigate(`/custom-print?material=${encodeURIComponent(mat.shortCode)}`);
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-transparent text-inherit">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-amber-500 dark:hover:text-amber-400 transition">Home</Link>
          <span>/</span>
          <span className="text-amber-600 dark:text-amber-400 font-medium">3D Printing Materials Guide</span>
        </nav>

        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-block py-1 px-4 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-500 border border-amber-500/25 backdrop-blur-md">
            Engineering & Metallurgy Matrix
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-950 dark:text-white tracking-tight leading-[1.08]">
            Comprehensive <span className="apple-gold-gradient">3D Material Guide</span> & Matrix
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-zinc-400 leading-relaxed font-normal">
            Select the optimal polymer, elastomer, or carbon-fiber composite for your application. Compare tensile strength, heat deflection, UV durability, and mechanical properties.
          </p>
        </div>

        {/* Guarantees Bar */}
        <GuaranteeBadges />

        {/* Filter & Search Bar */}
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

          <div className="w-full sm:w-72 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by property, use-case..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-black/30 border border-gray-200/80 dark:border-white/[0.08] rounded-full text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-amber-500"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Materials Comparison Grid / Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((mat) => {
            const isSelected = activeMaterial.id === mat.id;
            return (
              <div
                key={mat.id}
                onClick={() => setActiveMaterial(mat)}
                className={`apple-glass apple-card-hover rounded-3xl p-6 transition-all duration-500 ease-out flex flex-col justify-between cursor-pointer border ${
                  isSelected
                    ? 'border-amber-500/60 ring-2 ring-amber-500/25 shadow-2xl shadow-amber-500/10'
                    : 'border-gray-200/80 dark:border-white/[0.08] hover:border-amber-500/40 shadow-sm hover:shadow-2xl'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 block">
                        {mat.category}
                      </span>
                      <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mt-1 tracking-tight">{mat.name}</h3>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-500 font-mono font-bold text-xs">
                      {mat.shortCode}
                    </span>
                  </div>

                  {/* Spec Badges Grid */}
                  <div className="grid grid-cols-2 gap-2.5 my-4 text-xs">
                    <div className="p-3 rounded-2xl bg-gray-50/70 dark:bg-black/30 border border-gray-200/80 dark:border-white/[0.08]">
                      <span className="text-[10px] text-gray-500 dark:text-zinc-400 block font-semibold">Tensile Strength</span>
                      <strong className="text-gray-900 dark:text-zinc-100 font-mono">{mat.tensileStrength}</strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-gray-50/70 dark:bg-black/30 border border-gray-200/80 dark:border-white/[0.08]">
                      <span className="text-[10px] text-gray-500 dark:text-zinc-400 block font-semibold">Heat Deflection</span>
                      <strong className="text-amber-500 font-mono">{mat.heatDeflection}</strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-gray-50/70 dark:bg-black/30 border border-gray-200/80 dark:border-white/[0.08]">
                      <span className="text-[10px] text-gray-500 dark:text-zinc-400 block font-semibold">Flexibility</span>
                      <span className="text-gray-800 dark:text-zinc-200 text-[11px] truncate block font-medium">{mat.flexibility}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-gray-50/70 dark:bg-black/30 border border-gray-200/80 dark:border-white/[0.08]">
                      <span className="text-[10px] text-gray-500 dark:text-zinc-400 block font-semibold">UV Resistance</span>
                      <span className="text-emerald-500 text-[11px] font-semibold">{mat.uvResistance}</span>
                    </div>
                  </div>

                  {/* Best Uses Chips */}
                  <div className="space-y-1.5 mb-4">
                    <span className="text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block">Best Applications:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {mat.bestUses.map((use, idx) => (
                        <span key={idx} className="text-[11px] px-2.5 py-1 rounded-full bg-gray-100 dark:bg-black/40 text-gray-700 dark:text-zinc-300 border border-gray-200/80 dark:border-white/[0.08]">
                          {use}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer Action */}
                <div className="pt-4 border-t border-gray-200/80 dark:border-white/[0.08] flex items-center justify-between mt-2">
                  <div>
                    <span className="text-[10px] text-gray-500 dark:text-zinc-400 block">Lead Time</span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{mat.leadTime}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuoteInMaterial(mat);
                    }}
                    className="apple-btn-primary px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-gray-950 font-bold text-xs shadow-md shadow-amber-500/20 transition active:scale-95"
                  >
                    Quote in {mat.shortCode} &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Material Deep Technical Breakdown Card */}
        {activeMaterial && (
          <div className="rounded-3xl p-6 sm:p-8 bg-[#0b0f17] border border-amber-500/40 shadow-2xl shadow-black/95 text-white space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-800 gap-4">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Deep Technical Specimen Analysis</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  {activeMaterial.name} ({activeMaterial.shortCode})
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  Polymer Class: {activeMaterial.category} • Specific Gravity / Density: {activeMaterial.density} g/cm³
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleQuoteInMaterial(activeMaterial)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-gray-950 font-extrabold text-sm shadow-xl shadow-amber-500/25 transition transform hover:-translate-y-0.5"
              >
                Instant 3D Print Quote in {activeMaterial.shortCode} &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pros */}
              <div className="p-5 rounded-2xl bg-[#121824] border border-emerald-500/20 space-y-2">
                <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                  <span>✓</span> Engineering Advantages & Strengths
                </h4>
                <ul className="space-y-1.5 text-xs text-gray-300">
                  {activeMaterial.pros.map((pro, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cons & Design Considerations */}
              <div className="p-5 rounded-2xl bg-[#121824] border border-amber-500/20 space-y-2">
                <h4 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                  <span>⚠️</span> Design Considerations & Limitations
                </h4>
                <ul className="space-y-1.5 text-xs text-gray-300">
                  {activeMaterial.cons.map((con, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#080b11] border border-gray-800 text-xs flex flex-wrap items-center justify-between gap-4 text-gray-400">
              <div>
                Surface Appearance: <strong className="text-gray-200">{activeMaterial.finish}</strong>
              </div>
              <div>
                Food Contact Safety: <strong className="text-gray-200">{activeMaterial.foodSafe}</strong>
              </div>
              <div>
                Base Material Unit Pricing: <strong className="text-amber-400">₹{activeMaterial.baseCostPerGram} / gram</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialsGuide;
