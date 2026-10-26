import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { GuaranteeBadges } from '../components/GuaranteeBadges';

export interface FaqItem {
  category: string;
  q: string;
  a: string;
  details?: string[];
}

const DEFAULT_FAQS: FaqItem[] = [
  {
    category: 'File Guidelines & Mesh Integrity',
    q: 'What 3D file formats do you accept for custom printing?',
    a: 'We accept .STL and .3MF files directly through our automated 3D web inspector with files up to 100MB supported. For native parametric CAD formats (.STEP, .STP, .IGES, or SolidWorks .SLDPRT), you can submit an Enterprise RFQ or share them with us via WhatsApp.',
    details: [
      'STL: Industry standard polygon mesh format.',
      '3MF: Next-generation XML package preserving unit scale, multiple color bodies, and orientation.',
      'Maximum file size: 100MB per model upload.',
    ],
  },
  {
    category: 'File Guidelines & Mesh Integrity',
    q: 'How do I ensure my 3D file is watertight (manifold)?',
    a: 'A 3D model must be a contiguous solid manifold volume without inverted normal faces, open boundaries, or non-manifold edges. Our web inspector verifies watertightness automatically. If your model has holes, 3D software such as Blender (3D Print Toolbox), Autodesk Meshmixer, or Bambu Studio can execute an automated manifold repair.',
  },
  {
    category: 'Design for Additive Manufacturing (DFAM)',
    q: 'What are the minimum wall thicknesses for strong prints?',
    a: 'For functional and structural parts, we recommend minimum shell wall thicknesses of 1.2mm to 1.6mm (3 to 4 perimeters with a 0.4mm nozzle). Purely decorative non-load-bearing shells can go down to 0.8mm minimum.',
    details: [
      'Decorative parts: 0.8mm minimum wall thickness.',
      'Structural / mechanical load parts: 1.6mm to 2.4mm minimum.',
      'Snap-fit clips & cantilever springs: 1.5mm - 2.0mm with generous root fillet radius.',
    ],
  },
  {
    category: 'Design for Additive Manufacturing (DFAM)',
    q: 'What is the 45° overhang rule and how do supports work?',
    a: 'Any feature inclined at less than 45° relative to the horizontal build plate can be printed cleanly without support structures. Features exceeding 45° or horizontal cantilevers require tree supports or snug supports, which our slicer can generate automatically.',
  },
  {
    category: 'Tolerances & Moving Assemblies',
    q: 'What clearances should I design for print-in-place moving parts and hinges?',
    a: 'Our calibrated direct-drive printers achieve dimensional accuracies within ±0.15mm. For print-in-place mechanisms (like our planetary gearbox or articulated dragons), design an offset air gap of 0.30mm to 0.40mm between moving surfaces. For tight press-fit pins, 0.15mm to 0.20mm clearance is ideal.',
  },
  {
    category: 'Materials & Thermal Limits',
    q: 'Can PLA parts be left inside a hot car or outdoors?',
    a: 'Standard PLA has a heat deflection temperature of 55°C (131°F) and will warp if left in a hot parked car or exposed to intense summer sun. For automotive interiors, outdoor solar enclosures, or hot environments, we recommend PETG (rated to 75°C), ABS (rated to 98°C), or Carbon Fiber PETG (rated to 84°C).',
  },
  {
    category: 'Infill & Structural Strength',
    q: 'What infill density and pattern should I choose?',
    a: 'Infill density determines the internal solidity of the print. 15% to 20% infill with a Gyroid or Grid pattern is ideal for 90% of prints, providing tremendous stiffness at low weight. For high-torque brackets or gear trains, choose 40% to 60% infill. 100% solid infill is rarely necessary since outer wall perimeters provide 80% of part rigidity.',
  },
  {
    category: 'Threads & Fasteners',
    q: 'Can I print screw threads or install metal screws?',
    a: 'Yes! For coarse machine threads (M4 and above), threads can be printed directly with 0.12mm or 0.16mm layer heights. For maximum strength and repeated disassembly, we recommend designing pilot holes for brass threaded heat-set inserts (M3/M4/M5), which we can install during post-processing.',
  },
  {
    category: 'Guarantees & Turnaround',
    q: 'How fast will my order arrive and what if a print is defective?',
    a: 'We offer Standard 3-5 business day production as well as Priority 24-48h Rush Dispatch. Every completed print undergoes caliper and optical inspection before being packed into shockproof cushioning. Under our Free Reprint Guarantee, any defect reported within 48 hours qualifies for an immediate free reprint.',
  },
];

const KnowledgeBase: React.FC = () => {
  const [faqs, setFaqs] = useState<FaqItem[]>(DEFAULT_FAQS);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  useEffect(() => {
    let isMounted = true;
    axios
      .get('/api/faqs')
      .then((res) => {
        if (!isMounted) return;
        if (Array.isArray(res.data) && res.data.length > 0) {
          setFaqs(res.data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = [
    'All',
    'File Guidelines & Mesh Integrity',
    'Design for Additive Manufacturing (DFAM)',
    'Tolerances & Moving Assemblies',
    'Materials & Thermal Limits',
    'Infill & Structural Strength',
    'Threads & Fasteners',
    'Guarantees & Turnaround',
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCat = activeCategory === 'All' || faq.category === activeCategory;
    const matchesQuery =
      !searchQuery.trim() ||
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-transparent text-inherit">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-amber-500 dark:hover:text-amber-400 transition">Home</Link>
          <span>/</span>
          <span className="text-amber-600 dark:text-amber-400 font-medium">Knowledge Base & DFAM Guide</span>
        </nav>

        {/* Title */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-block py-1 px-3.5 rounded-full text-xs font-bold tracking-wider uppercase bg-amber-500/10 text-amber-500 border border-amber-500/30">
            3D Printing Engineering Knowledge Base
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Design for <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">Additive Manufacturing</span> (DFAM)
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
            Essential guidelines for tolerances, minimum wall thicknesses, overhangs, watertight meshes, and filament thermal resistance.
          </p>
        </div>

        {/* Guarantee Badges */}
        <GuaranteeBadges />

        {/* Search Bar */}
        <div className="p-4 sm:p-6 rounded-3xl bg-[#0b0f17] border border-amber-500/20 shadow-2xl shadow-black/95">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search design guidelines, tolerances, materials, threads (e.g. wall thickness, 45 degree, heat)..."
              className="w-full pl-11 pr-4 py-3 bg-[#121824] border border-gray-700 rounded-2xl text-xs sm:text-sm text-white placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
            <svg className="w-5 h-5 text-amber-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeCategory === cat
                    ? 'bg-amber-500 text-gray-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-[#121824] text-gray-300 hover:text-white hover:bg-gray-800 border border-gray-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {filteredFaqs.map((faq, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <div
                key={index}
                className={`rounded-3xl border transition duration-200 overflow-hidden ${
                  isExpanded
                    ? 'bg-[#0b0f17] border-amber-500/50 shadow-xl shadow-amber-500/10'
                    : 'bg-[#0b0f17]/90 border-gray-800/80 hover:border-amber-500/30 shadow-md'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-4 focus:outline-none"
                >
                  <div>
                    <span className="text-[10px] font-bold text-amber-400/90 uppercase tracking-widest block mb-1">
                      {faq.category}
                    </span>
                    <h3 className="text-sm sm:text-base font-extrabold text-white">{faq.q}</h3>
                  </div>

                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition transform ${
                      isExpanded
                        ? 'bg-amber-500 text-gray-950 rotate-180 shadow-md shadow-amber-500/30'
                        : 'bg-[#121824] text-gray-400 border border-gray-700'
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {isExpanded && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-gray-300 leading-relaxed border-t border-gray-800/60 space-y-3">
                    <p>{faq.a}</p>
                    {faq.details && faq.details.length > 0 && (
                      <div className="p-3.5 rounded-2xl bg-[#121824] border border-gray-800/80 space-y-1 text-xs">
                        <strong className="text-amber-400 font-bold block mb-1">Engineering Takeaways:</strong>
                        {faq.details.map((detail, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-gray-300">
                            <span className="text-amber-400">•</span>
                            <span>{detail}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Card */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-[#0b0f17] to-[#121824] border border-amber-500/30 shadow-2xl shadow-black/95 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-white">Have a Unique Geometry or Custom Tolerance?</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-lg">
              Our engineering team can inspect your CAD file, advise on print orientation, and recommend modular splitting.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/custom-print"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-gray-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition"
            >
              Upload 3D File &rarr;
            </Link>
            <a
              href="https://wa.me/919284118601?text=Hi%20SM%203D%2C%20I%20have%20a%20technical%20question%20regarding%20my%203D%20model"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
            >
              Ask on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;
