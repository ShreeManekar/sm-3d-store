import React, { useState } from 'react';

const CustomPrint: React.FC = () => {
  const [material, setMaterial] = useState('PLA');
  const [infill, setInfill] = useState(20);
  const [quality, setQuality] = useState('Standard (0.20mm)');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-white py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <span className="inline-block py-1 px-3 rounded-full text-xs font-bold tracking-wider uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-3">
            On-Demand Manufacturing
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Request Custom 3D Print</h1>
          <p className="text-gray-400 text-sm mt-2 max-w-lg mx-auto">
            Upload your specifications for automated slicing, volume calculation, and fast fulfillment up to 160×160×160mm.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-2xl border border-cyan-500/40 bg-gray-900 p-8 text-center shadow-xl">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Quote Request Submitted!</h3>
            <p className="text-gray-300 text-sm max-w-md mx-auto mb-6">
              Our engineering team is calculating slicing parameters and filament consumption. We will contact you shortly with confirmation.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 text-gray-950 font-bold hover:bg-cyan-400 transition"
            >
              Submit Another Print Request
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-800 bg-gray-900/80 backdrop-blur p-6 sm:p-8 space-y-6 shadow-2xl">
            {/* File Upload Zone */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">3D Model File (.STL, .OBJ, .STEP)</label>
              <div className="border-2 border-dashed border-gray-700 hover:border-cyan-500/60 rounded-xl p-8 text-center cursor-pointer transition bg-gray-950/40">
                <svg className="w-10 h-10 text-cyan-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div className="text-sm font-medium text-gray-300">Click or drag file here to upload</div>
                <div className="text-xs text-gray-500 mt-1">Maximum volume: 160 × 160 × 160 mm. Max file size: 50MB</div>
              </div>
            </div>

            {/* Print Parameters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-1.5">Material</label>
                <select
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="PLA">PLA+ (High Detail, Rigid)</option>
                  <option value="PETG">PETG (Tough, Heat Resistant)</option>
                  <option value="ABS">ABS (Impact Resistant, Durable)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-1.5">Layer Height / Quality</label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="Ultra Fine (0.12mm)">Ultra Fine (0.12mm)</option>
                  <option value="Standard (0.20mm)">Standard (0.20mm)</option>
                  <option value="Draft Fast (0.28mm)">Draft Fast (0.28mm)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-semibold text-gray-200 mb-1.5">
                <span>Infill Density: {infill}%</span>
                <span className="text-xs text-gray-400">15-30% recommended for standard parts</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={infill}
                onChange={(e) => setInfill(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-1.5">Special Instructions or Orientation Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mention any critical dimensional tolerances, thread requirements, or custom color preferences..."
                className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-400 text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 transition transform hover:-translate-y-0.5"
            >
              Calculate Quote & Submit Print Request
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CustomPrint;
