import React, { useState } from 'react';
import { useCart } from '../context/CartContext';

export interface Swatch {
  id: string;
  name: string;
  material: string;
  finish: string;
  colorHex: string;
  accentHex?: string;
  description: string;
  specular: string;
}

export const SWATCHES: Swatch[] = [
  {
    id: 'swatch_silk_gold',
    name: 'Aztec Silk Gold',
    material: 'PLA+',
    finish: 'Ultra High-Gloss Silk',
    colorHex: '#f59e0b',
    accentHex: '#fde047',
    description: 'Luxurious metallic lustre with zero layer lines visible under ambient lighting. Ideal for decorative art, trophies, and premium cases.',
    specular: 'Mirror-like metallic sheen',
  },
  {
    id: 'swatch_matte_black',
    name: 'Stealth Jet Black',
    material: 'PETG / PLA+',
    finish: 'Deep Matte Obsidian',
    colorHex: '#18181b',
    accentHex: '#3f3f46',
    description: 'Light-absorbing velvet matte black. Perfect for tactical components, camera hoods, and industrial electronics enclosures.',
    specular: 'Non-reflective diffused matte',
  },
  {
    id: 'swatch_cf_charcoal',
    name: 'Carbon Fiber Charcoal',
    material: 'CF-PETG',
    finish: 'Micro-Carbon Textured',
    colorHex: '#27272a',
    accentHex: '#71717a',
    description: 'Embedded with 15% chopped high-modulus carbon micro-fibers for extreme stiffness and heat deflection up to 84°C.',
    specular: 'Structured micro-matte with carbon flakes',
  },
  {
    id: 'swatch_signal_white',
    name: 'Signal Pure White',
    material: 'PLA+ / PETG',
    finish: 'Crisp Architectural Satin',
    colorHex: '#f8fafc',
    accentHex: '#e2e8f0',
    description: 'Non-yellowing pure white pigment with high opacity. Preferred for architectural mockups, lithophanes, and medical models.',
    specular: 'Smooth satin reflection',
  },
  {
    id: 'swatch_ruby_red',
    name: 'Translucent Ruby Red',
    material: 'PETG',
    finish: 'Translucent Glass Gloss',
    colorHex: '#dc2626',
    accentHex: '#f87171',
    description: 'Crystal-clear tinted transparency allowing internal infill patterns and LED backlighting to shine through brilliantly.',
    specular: 'Glass crystal refractions',
  },
  {
    id: 'swatch_sapphire_blue',
    name: 'Galaxy Sapphire Blue',
    material: 'PLA+ Sparkle',
    finish: 'Sparkle Flake Glitter',
    colorHex: '#2563eb',
    accentHex: '#60a5fa',
    description: 'Deep navy blue infused with thousands of microscopic silver glitter flakes that shimmer as light angles shift.',
    specular: 'Cosmic micro-glitter twinkle',
  },
  {
    id: 'swatch_copper_bronze',
    name: 'Antique Copper Bronze',
    material: 'Metal-Fill PLA',
    finish: 'Heavy Metallic Antique',
    colorHex: '#b45309',
    accentHex: '#d97706',
    description: 'Compounded with real atomized copper powder. Can be polished with steel wool or chemically patinated for antique artifact looks.',
    specular: 'Burnished antique metal gleam',
  },
  {
    id: 'swatch_clear',
    name: 'Optic Clear Transparent',
    material: 'PETG / Resin',
    finish: 'High-Transparency Optic',
    colorHex: '#94a3b8',
    accentHex: '#cbd5e1',
    description: 'High-transmittance optical polymer. Ideal for light pipes, fluidic chambers, micro-scale reservoirs, and sight glasses.',
    specular: 'Clear refractive transparency',
  },
];

export const FilamentSwatches: React.FC<{ onSelectSwatch?: (swatch: Swatch) => void }> = ({ onSelectSwatch }) => {
  const [selectedSwatch, setSelectedSwatch] = useState<Swatch>(SWATCHES[0]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { addToCart } = useCart();

  const handleOrderSwatchPack = () => {
    addToCart(
      {
        id: 'prod_swatch_pack',
        name: 'SM 3D Material Swatch Box (8 Materials & Finishes)',
        price: 199,
        category: 'Sample Packs',
        description: 'Physical set of 8 calibrated filament sample discs (PLA, Silk Gold, PETG, CF-PETG, TPU, Resin) with labeled tolerances.',
        image: '/assets/images/product_gearbox_1786179220985.webp',
        dimensions: '8 × (40 × 40 × 3 mm)',
      },
      1
    );
    setToastMessage('Added Swatch Sample Pack to your cart!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <section className="py-14 bg-[#080b11] border-t border-amber-500/20 text-white relative overflow-hidden">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0b0f17] border border-amber-500/50 text-amber-300 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-fade-in">
          <span className="text-emerald-400">✓</span>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Subtle gold glow background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="inline-block py-0.5 px-3 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30 mb-2">
              Color Palette & Finish Inspector
            </span>
            <h2 className="text-3xl font-extrabold text-white">Filament Swatches & Surface Finishes</h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-xl">
              Inspect physical surface textures and optical properties before printing. Order our sample pack for real-world tactile evaluation.
            </p>
          </div>

          <button
            onClick={handleOrderSwatchPack}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-gray-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition transform hover:-translate-y-0.5 self-start md:self-auto"
          >
            <span>📦 Order Physical Swatch Pack (₹199)</span>
          </button>
        </div>

        {/* Swatches Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          {SWATCHES.map((swatch) => {
            const isSelected = selectedSwatch.id === swatch.id;
            return (
              <button
                key={swatch.id}
                type="button"
                onClick={() => {
                  setSelectedSwatch(swatch);
                  if (onSelectSwatch) onSelectSwatch(swatch);
                }}
                className={`p-3 rounded-2xl bg-[#0b0f17] border text-left transition transform hover:-translate-y-1 ${
                  isSelected
                    ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20 bg-[#121824]'
                    : 'border-gray-800 hover:border-amber-500/40'
                }`}
              >
                <div
                  className="w-full h-12 rounded-xl mb-2.5 shadow-inner border border-white/10 relative overflow-hidden flex items-center justify-center"
                  style={{
                    backgroundColor: swatch.colorHex,
                    backgroundImage: `linear-gradient(135deg, ${swatch.colorHex} 0%, ${swatch.accentHex || swatch.colorHex} 100%)`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/20" />
                  {isSelected && (
                    <span className="relative z-10 w-5 h-5 rounded-full bg-black/60 text-amber-300 text-xs flex items-center justify-center font-bold">
                      ✓
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-bold text-gray-100 truncate">{swatch.name}</div>
                <div className="text-[10px] text-amber-400/90 font-medium">{swatch.material}</div>
              </button>
            );
          })}
        </div>

        {/* Selected Swatch Detailed Card */}
        <div className="p-6 rounded-3xl bg-[#0b0f17] border border-amber-500/30 shadow-2xl shadow-black/90 flex flex-col md:flex-row items-center gap-6">
          <div
            className="w-24 h-24 rounded-2xl shadow-xl border border-white/20 shrink-0 relative overflow-hidden flex items-center justify-center"
            style={{
              backgroundColor: selectedSwatch.colorHex,
              backgroundImage: `linear-gradient(135deg, ${selectedSwatch.colorHex} 0%, ${selectedSwatch.accentHex || selectedSwatch.colorHex} 100%)`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-white/30" />
            <span className="text-2xl drop-shadow">💎</span>
          </div>

          <div className="flex-1 text-center md:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h3 className="text-lg font-bold text-white">{selectedSwatch.name}</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                {selectedSwatch.material}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-gray-800 text-gray-300 text-[10px] font-medium border border-gray-700">
                Finish: {selectedSwatch.finish}
              </span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed pt-1">{selectedSwatch.description}</p>
            <div className="text-[11px] text-amber-400 font-semibold pt-1">
              Optical Surface: <span className="text-gray-300">{selectedSwatch.specular}</span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleOrderSwatchPack}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs transition shadow-md shadow-amber-500/20"
            >
              Order Sample Pack (₹199)
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
