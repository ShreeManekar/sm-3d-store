import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import StlViewer, { ModelDimensions } from '../components/StlViewer';

export const CustomPrint: React.FC = () => {
  const { currentUser } = useAuth();

  // File & 3D state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [sampleUrl, setSampleUrl] = useState<string>('/assets/models/sample_dragon.stl');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dimensions
  const [dimL, setDimL] = useState<number>(100);
  const [dimW, setDimW] = useState<number>(80);
  const [dimH, setDimH] = useState<number>(60);
  const [exceedsLimit, setExceedsLimit] = useState<boolean>(false);
  const [autoSplit, setAutoSplit] = useState<boolean>(false);

  // Print parameters
  const [material, setMaterial] = useState('PLA');
  const [color, setColor] = useState('Pure White');
  const [infill, setInfill] = useState(20);
  const [description, setDescription] = useState('');

  // Contact info
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');

  // Submission
  const [loading, setLoading] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Prefill contact info if user is logged in
  useEffect(() => {
    if (currentUser) {
      if (!userName && currentUser.name) setUserName(currentUser.name);
      if (!userEmail && currentUser.email) setUserEmail(currentUser.email);
      if (!userPhone && currentUser.phone) setUserPhone(currentUser.phone.replace(/\D/g, '').slice(-10));
    }
  }, [currentUser, userName, userEmail, userPhone]);

  // Handle dimensions calculated from 3D viewer
  const handleDimensionsCalculated = (dims: ModelDimensions) => {
    setDimL(dims.length);
    setDimW(dims.width);
    setDimH(dims.height);
    setExceedsLimit(dims.exceedsLimit);
    if (dims.exceedsLimit) {
      setAutoSplit(true);
    }
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.stl')) {
      alert('Please upload a valid .stl 3D file.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        setFileBuffer(reader.result);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDimensionChange = (l: number, w: number, h: number) => {
    setDimL(l);
    setDimW(w);
    setDimH(h);
    const exceeds = l > 160 || w > 160 || h > 160;
    setExceedsLimit(exceeds);
    if (exceeds) setAutoSplit(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = userPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setError('Please provide a valid 10-digit mobile number for WhatsApp updates.');
      return;
    }

    if (dimL <= 0 || dimW <= 0 || dimH <= 0) {
      setError('Dimensions must be positive values.');
      return;
    }

    setLoading(true);

    try {
      let fileUrl = '';
      // If a file was selected, upload via /api/upload using native FileReader.readAsDataURL
      if (selectedFile) {
        try {
          const fileDataUri = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(selectedFile);
          });

          const uploadRes = await axios.post('/api/upload', {
            filename: selectedFile.name,
            fileData: fileDataUri,
          });
          fileUrl = uploadRes.data?.fileUrl || '';
        } catch (uploadErr) {
          console.warn('File upload fallback:', uploadErr);
        }
      }

      const payload = {
        userId: currentUser?.id || 'guest',
        userName: userName.trim(),
        userEmail: userEmail.trim().toLowerCase(),
        userPhone: `+91 ${cleanPhone}`,
        description: description.trim() || 'Custom on-demand 3D print request',
        dimensions: { length: dimL, width: dimW, height: dimH },
        exceedsLimit,
        disassembled: autoSplit || exceedsLimit,
        partsCount: (autoSplit || exceedsLimit) ? 2 : 1,
        connectionMethod: (autoSplit || exceedsLimit) ? 'Friction-fit / Interlocking' : 'Single Piece',
        fileName: selectedFile ? selectedFile.name : 'sample_dragon.stl',
        fileUrl,
        desiredMaterial: material,
        desiredColor: color,
        infillDensity: `${infill}%`,
      };

      const res = await axios.post('/api/custom-orders', payload);
      setSubmittedOrder(res.data?.order || { id: `CUST-${Date.now().toString().slice(-4)}`, ...payload });
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to submit custom print order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-transparent text-inherit">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition">Home</Link>
          <span>/</span>
          <span className="text-cyan-600 dark:text-cyan-400 font-medium">Custom 3D Print Request</span>
        </nav>

        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block py-1 px-3 rounded-full text-xs font-bold tracking-wider uppercase bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 mb-3">
            Interactive On-Demand Additive Manufacturing
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">Request Custom 3D Print</h1>
          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mt-2">
            Upload your STL model for automated build volume verification (up to 160×160×160mm), real-time 3D inspection, and fast quote dispatch.
          </p>
        </div>

        {submittedOrder ? (
          <div className="rounded-3xl border border-cyan-500/40 bg-white dark:bg-gray-900/90 p-8 sm:p-12 text-center shadow-2xl backdrop-blur max-w-2xl mx-auto text-gray-900 dark:text-white">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto mb-4 border border-cyan-500/40">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">
              Request ID: {submittedOrder.id || 'ORD-REQ'}
            </span>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1 mb-2">Quote Request Submitted!</h2>
            <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm max-w-md mx-auto mb-6">
              Our engineering team is slicing your model in <strong className="text-cyan-600 dark:text-cyan-400">{submittedOrder.desiredMaterial}</strong> ({submittedOrder.desiredColor}) at <strong className="text-cyan-600 dark:text-cyan-400">{submittedOrder.infillDensity}</strong> infill. We will notify you at <strong className="text-gray-900 dark:text-white">{submittedOrder.userEmail}</strong> and WhatsApp with your quote.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/account"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition"
              >
                Track in My Account Portal
              </Link>
              <button
                onClick={() => { setSubmittedOrder(null); setSelectedFile(null); setFileBuffer(null); }}
                className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-xs font-medium border border-gray-300 dark:border-gray-700 transition"
              >
                Submit Another Model
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: 3D STL Viewer & Upload */}
            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 p-5 shadow-2xl backdrop-blur text-gray-900 dark:text-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                      Interactive 3D Preview (Three.js)
                    </h3>
                  </div>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">Drag to rotate • Wheel to zoom</span>
                </div>

                {/* 3D STL Viewer Canvas */}
                <StlViewer
                  fileBuffer={fileBuffer}
                  stlUrl={!fileBuffer ? sampleUrl : undefined}
                  height={380}
                  maxBuildDimension={160}
                  onDimensionsCalculated={handleDimensionsCalculated}
                />

                {/* File Upload Selector */}
                <div className="mt-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".stl"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-cyan-500/60 rounded-2xl p-5 text-center cursor-pointer transition bg-gray-50 dark:bg-gray-950/60 hover:bg-gray-100 dark:hover:bg-gray-950"
                  >
                    <div className="flex items-center justify-center gap-2 text-cyan-600 dark:text-cyan-400 text-xs font-bold">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      {selectedFile ? `Selected: ${selectedFile.name}` : 'Click to Upload Your Custom .STL File'}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Max build volume 160×160×160mm. Automatically detects dimensions & bounds.
                    </p>
                  </div>
                </div>

                {/* Quick Model Sample Selector */}
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 dark:text-gray-400">
                  <span>Load Sample Models:</span>
                  <button
                    type="button"
                    onClick={() => { setSelectedFile(null); setFileBuffer(null); setSampleUrl('/assets/models/sample_dragon.stl'); }}
                    className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-cyan-600 dark:text-cyan-400 font-medium text-[11px]"
                  >
                    Crystal Dragon
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedFile(null); setFileBuffer(null); setSampleUrl('/assets/models/sample_gearbox.stl'); }}
                    className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-purple-600 dark:text-purple-400 font-medium text-[11px]"
                  >
                    Planetary Gearbox
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Custom Print Configuration Form */}
            <div className="lg:col-span-5">
              <form onSubmit={handleSubmit} className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/90 backdrop-blur p-6 space-y-4 shadow-2xl text-xs text-gray-900 dark:text-white">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider pb-2 border-b border-gray-200 dark:border-gray-800">
                  Print Specs & Custom Quote
                </h3>

                {error && (
                  <div className="p-3 bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-300 rounded-xl flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {/* Dimensions (Auto-filled by STL or Manual) */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-gray-700 dark:text-gray-300">Dimensions (mm)</label>
                    {exceedsLimit ? (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">⚠️ Exceeds 160mm build plate</span>
                    ) : (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">✓ Within 160mm limit</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-gray-500 block">Length</span>
                      <input
                        type="number"
                        min="1"
                        value={dimL}
                        onChange={(e) => handleDimensionChange(parseFloat(e.target.value) || 1, dimW, dimH)}
                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-2.5 py-1.5 text-gray-900 dark:text-white font-mono focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">Width</span>
                      <input
                        type="number"
                        min="1"
                        value={dimW}
                        onChange={(e) => handleDimensionChange(dimL, parseFloat(e.target.value) || 1, dimH)}
                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-2.5 py-1.5 text-gray-900 dark:text-white font-mono focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">Height</span>
                      <input
                        type="number"
                        min="1"
                        value={dimH}
                        onChange={(e) => handleDimensionChange(dimL, dimW, parseFloat(e.target.value) || 1)}
                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-2.5 py-1.5 text-gray-900 dark:text-white font-mono focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Multi-part assembly option */}
                {exceedsLimit && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/30 rounded-xl text-amber-800 dark:text-amber-300 space-y-1.5">
                    <div className="font-bold">Multi-Part Assembly Recommendation</div>
                    <p className="text-[11px] text-gray-600 dark:text-gray-300">
                      Since one or more dimensions exceed the 160mm single-print build volume, our technicians will intelligently split the geometry into modular interlocking components.
                    </p>
                    <label className="flex items-center gap-2 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoSplit}
                        onChange={(e) => setAutoSplit(e.target.checked)}
                        className="rounded border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-cyan-500"
                      />
                      <span className="text-gray-800 dark:text-white font-medium text-[11px]">Enable smart multi-part split</span>
                    </label>
                  </div>
                )}

                {/* Material & Color */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Material</label>
                    <select
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="PLA">PLA (Standard / Detailed)</option>
                      <option value="PETG">PETG (High Strength)</option>
                      <option value="ABS">ABS (Heat & Impact Resistant)</option>
                      <option value="CF-PETG">Carbon-Fiber Reinforced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Color</label>
                    <select
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="Pure White">Pure White</option>
                      <option value="Matte Black">Matte Black</option>
                      <option value="Industrial Orange">Industrial Orange</option>
                      <option value="Slate Grey">Slate Grey</option>
                      <option value="Iridescent Silk">Iridescent Silk</option>
                    </select>
                  </div>
                </div>

                {/* Infill Density slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Infill Density: {infill}%</span>
                    <span className="text-[10px] text-gray-500">{infill >= 40 ? 'Heavy Duty' : 'Standard'}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={infill}
                    onChange={(e) => setInfill(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                {/* Special Notes */}
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Project Notes / Instructions</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Specify tolerances, threads, or special assembly requirements..."
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Customer Contact Details */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-800 space-y-2.5">
                  <span className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[11px] block">
                    Contact for Quote Delivery
                  </span>

                  <div>
                    <input
                      type="text"
                      required
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Your Full Name"
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="email"
                      required
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="Email Address"
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-400"
                    />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit WhatsApp #"
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Submit Custom Print Request
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default CustomPrint;
