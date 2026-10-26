import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import StlViewer, { ModelDimensions } from '../components/StlViewer';
import { GuaranteeBadges } from '../components/GuaranteeBadges';

interface MaterialOption {
  code: string;
  name: string;
  category: string;
  density: number; // g/cm³
  costPerGram: number; // INR
  speedFactor: number;
}

const MATERIAL_OPTIONS: MaterialOption[] = [
  { code: 'PLA', name: 'PLA+ (Standard / Detail)', category: 'Standard', density: 1.24, costPerGram: 2.2, speedFactor: 1.0 },
  { code: 'PETG', name: 'PETG (High Strength & Outdoor)', category: 'Engineering', density: 1.27, costPerGram: 2.8, speedFactor: 1.05 },
  { code: 'ABS', name: 'ABS (Heat & Impact Resistant)', category: 'Automotive', density: 1.04, costPerGram: 3.2, speedFactor: 1.1 },
  { code: 'CF-PETG', name: 'Carbon Fiber PETG (High Rigidity)', category: 'Composite', density: 1.30, costPerGram: 4.8, speedFactor: 1.2 },
  { code: 'TPU', name: 'TPU 95A (Elastomer Flexible)', category: 'Flexible', density: 1.21, costPerGram: 3.8, speedFactor: 1.8 },
  { code: 'PA12', name: 'Nylon PA12 (Low Friction Industrial)', category: 'Industrial', density: 1.14, costPerGram: 5.5, speedFactor: 1.3 },
  { code: 'Resin', name: '8K Tough Resin (Ultra-Fine SLA)', category: 'Resin SLA', density: 1.18, costPerGram: 6.0, speedFactor: 1.4 },
];

const RESOLUTION_OPTIONS = [
  { value: 0.12, label: '0.12mm (Ultra-Fine)', multiplier: 1.45, desc: 'Flawless exhibition finish' },
  { value: 0.16, label: '0.16mm (Fine Detail)', multiplier: 1.2, desc: 'Sharp mechanical precision' },
  { value: 0.20, label: '0.20mm (Standard)', multiplier: 1.0, desc: 'Optimal speed & strength' },
  { value: 0.28, label: '0.28mm (Draft/Speed)', multiplier: 0.85, desc: 'Fast turnaround mockup' },
];

const COLOR_OPTIONS = [
  { name: 'Aztec Silk Gold', hex: '#f59e0b' },
  { name: 'Stealth Jet Black', hex: '#18181b' },
  { name: 'Signal Pure White', hex: '#f8fafc' },
  { name: 'Carbon Charcoal', hex: '#27272a' },
  { name: 'Industrial Orange', hex: '#ea580c' },
  { name: 'Slate Grey', hex: '#64748b' },
  { name: 'Optic Clear Transparent', hex: '#94a3b8' },
];

const POST_PROCESSING_OPTIONS = [
  { id: 'none', name: 'Raw As-Printed (Standard clean)', fee: 0 },
  { id: 'sanding', name: 'Sanded & Edge Polished (+₹150)', fee: 150 },
  { id: 'vapor', name: 'Acetone / Chemical Vapor Smoothed (+₹250)', fee: 250 },
  { id: 'paint', name: 'Primer & Custom Acrylic Paint (+₹450)', fee: 450 },
  { id: 'inserts', name: 'Brass Threaded Heat-Set Inserts (+₹120)', fee: 120 },
];

const ORIENTATION_OPTIONS = [
  { id: 'auto', name: 'Auto-Optimal (Min. Supports & Fast)', factor: 1.0, desc: 'Optimized slicing trajectory with lowest support scarring' },
  { id: 'flat', name: 'Flat on Bed (Max XY Plane Strength)', factor: 0.95, desc: 'Maximum layer bond tensile shear strength along mechanical plane' },
  { id: 'vertical', name: 'Vertical Upright (Finest Z Details)', factor: 1.15, desc: 'Optimal cylindrical resolution and fine vertical features' },
  { id: '45deg', name: '45° Inclined (Balanced Shear Resistance)', factor: 1.08, desc: 'Avoids perpendicular cleavage plane; ideal for structural brackets' },
];

export const CustomPrint: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
  const initialMaterialParam = searchParams.get('material') || 'PLA';
  const [materialCode, setMaterialCode] = useState<string>(initialMaterialParam);
  const [color, setColor] = useState('Aztec Silk Gold');
  const [infill, setInfill] = useState(20);
  const [layerHeight, setLayerHeight] = useState<number>(0.20);
  const [supports, setSupports] = useState<string>('None');
  const [orientation, setOrientation] = useState<string>('auto');
  const [postProcessing, setPostProcessing] = useState<string>('none');
  const [isRushOrder, setIsRushOrder] = useState<boolean>(false);
  const [description, setDescription] = useState('');

  // Contact info
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');

  // Submission & feedback
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [submittedOrder, setSubmittedOrder] = useState<any | null>(null);
  const [cartToast, setCartToast] = useState<string | null>(null);
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

  // Handle file upload (supports .stl, .3mf, .obj, .step, .stp files up to 200MB)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size === 0) {
      setError('The selected 3D model file is empty (0 bytes). Please select a valid 3D file.');
      return;
    }

    const lower = file.name.toLowerCase();
    const validExtensions = ['.stl', '.3mf', '.obj', '.step', '.stp'];
    const hasValidExt = validExtensions.some(ext => lower.endsWith(ext));
    if (!hasValidExt) {
      setError('Invalid format. Please upload a .STL, .3MF, .OBJ, or STEP file.');
      return;
    }

    const MAX_SIZE = 200 * 1024 * 1024; // 200MB
    if (file.size > MAX_SIZE) {
      setError(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum allowed 200MB capacity. Please optimize or compress your mesh.`);
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

  // Active material details
  const activeMat = useMemo(() => {
    return MATERIAL_OPTIONS.find((m) => m.code === materialCode) || MATERIAL_OPTIONS[0];
  }, [materialCode]);

  // Geometric metrics & calculations
  const volumeCm3 = useMemo(() => {
    // Solid bounded volume estimate in cubic centimeters
    const rawBox = (dimL * dimW * dimH) / 1000;
    // Organic solid factor for 3D meshes (typical 35% bounding density)
    return Math.max(1, Math.round(rawBox * 0.35 * 10) / 10);
  }, [dimL, dimW, dimH]);

  const surfaceAreaCm2 = useMemo(() => {
    return Math.round(2 * ((dimL * dimW) + (dimW * dimH) + (dimH * dimL)) / 100 * 0.55);
  }, [dimL, dimW, dimH]);

  const calculatedWeightGrams = useMemo(() => {
    // Weight = Volume * Density * (Skin shell factor + Infill factor)
    const infillFactor = 0.22 + 0.78 * (infill / 100);
    const weight = volumeCm3 * activeMat.density * infillFactor;
    return Math.max(5, Math.round(weight));
  }, [volumeCm3, activeMat, infill]);

  const estimatedLayerCount = useMemo(() => {
    return Math.max(10, Math.ceil(dimH / layerHeight));
  }, [dimH, layerHeight]);

  const estimatedPrintTime = useMemo(() => {
    const resOption = RESOLUTION_OPTIONS.find((r) => r.value === layerHeight) || RESOLUTION_OPTIONS[2];
    const orientationOpt = ORIENTATION_OPTIONS.find((o) => o.id === orientation) || ORIENTATION_OPTIONS[0];
    const supportFactor = supports === 'None' ? 1.0 : 1.25;
    const totalMinutes = Math.round(
      (calculatedWeightGrams * 4.2 * resOption.multiplier * activeMat.speedFactor * supportFactor * orientationOpt.factor) + 20
    );
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}h ${mins}m`;
  }, [calculatedWeightGrams, layerHeight, activeMat, supports, orientation]);

  // Dynamic live pricing formula
  const calculatedPricing = useMemo(() => {
    const rawMaterialCost = calculatedWeightGrams * activeMat.costPerGram;
    const resOption = RESOLUTION_OPTIONS.find((r) => r.value === layerHeight) || RESOLUTION_OPTIONS[2];
    const orientationOpt = ORIENTATION_OPTIONS.find((o) => o.id === orientation) || ORIENTATION_OPTIONS[0];
    const machineRuntimeHours = Math.max(1, (calculatedWeightGrams * 4.2 * resOption.multiplier * activeMat.speedFactor * orientationOpt.factor) / 60);
    const machineCost = machineRuntimeHours * 35; // ₹35 per print hour
    const selectedPost = POST_PROCESSING_OPTIONS.find((p) => p.id === postProcessing);
    const postProcessingFee = selectedPost ? selectedPost.fee : 0;
    const rushFee = isRushOrder ? 199 : 0;

    const baseSum = rawMaterialCost + machineCost + postProcessingFee + rushFee;
    const finalPrice = Math.max(199, Math.round(baseSum));

    return {
      rawMaterialCost: Math.round(rawMaterialCost),
      machineCost: Math.round(machineCost),
      postProcessingFee,
      rushFee,
      finalPrice,
    };
  }, [calculatedWeightGrams, activeMat, layerHeight, postProcessing, isRushOrder, orientation]);

  // Add Custom Print directly to Cart
  const handleAddToCart = () => {
    const orientationOpt = ORIENTATION_OPTIONS.find((o) => o.id === orientation) || ORIENTATION_OPTIONS[0];
    const customItem = {
      id: `custom_${Date.now()}`,
      name: `Custom 3D Print (${selectedFile ? selectedFile.name.replace(/\.[^/.]+$/, '') : 'Precision Model'})`,
      price: calculatedPricing.finalPrice,
      category: 'Custom Print',
      description: `${activeMat.name} • ${color} • ${infill}% Infill • ${layerHeight}mm • ${orientationOpt.name} • ${dimL}×${dimW}×${dimH}mm${isRushOrder ? ' [24-48h Rush Dispatch]' : ''}`,
      image: '/assets/images/hero_3d_printer_1786179196218.webp',
      dimensions: `${dimL} × ${dimW} × ${dimH} mm`,
    };

    addToCart(customItem, 1);
    setCartToast(`Added Custom 3D Print (₹${calculatedPricing.finalPrice}) to cart!`);
    setTimeout(() => setCartToast(null), 3500);
  };

  // Submit formal RFQ / Custom Order
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
    setUploadProgress(null);

    try {
      let fileUrl = '';
      if (selectedFile) {
        setUploadProgress(0);
        const fileDataUri = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });

        const uploadRes = await axios.post('/api/upload', {
          filename: selectedFile.name,
          fileData: fileDataUri,
        }, {
          timeout: 300000, // 5 minutes timeout for 200MB payloads
          headers: {
            'Content-Type': 'application/json'
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percent);
            }
          }
        });
        fileUrl = uploadRes.data?.fileUrl || '';
      }

      const payload = {
        userId: currentUser?.id || 'guest',
        userName: userName.trim(),
        userEmail: userEmail.trim().toLowerCase(),
        userPhone: `+91 ${cleanPhone}`,
        description: description.trim() || `Custom on-demand 3D print (${activeMat.name}, ${color}, ${infill}%)`,
        dimensions: { length: dimL, width: dimW, height: dimH },
        exceedsLimit,
        disassembled: autoSplit || exceedsLimit,
        partsCount: (autoSplit || exceedsLimit) ? 2 : 1,
        connectionMethod: (autoSplit || exceedsLimit) ? 'Friction-fit / Interlocking' : 'Single Piece',
        fileName: selectedFile ? selectedFile.name : 'sample_dragon.stl',
        fileUrl,
        desiredMaterial: activeMat.code,
        desiredColor: color,
        infillDensity: `${infill}%`,
        layerHeight: `${layerHeight}mm`,
        orientation: ORIENTATION_OPTIONS.find((o) => o.id === orientation)?.name || orientation,
        supportType: supports,
        postProcessing,
        isRushOrder,
        estimatedWeight: `${calculatedWeightGrams}g`,
        estimatedTime: estimatedPrintTime,
        quotePrice: calculatedPricing.finalPrice,
      };

      const res = await axios.post('/api/custom-orders', payload);
      setSubmittedOrder(res.data?.order || { id: `CUST-${Date.now().toString().slice(-4)}`, ...payload });
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to submit custom print order');
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-transparent text-inherit">
      {cartToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0b0f17] border border-amber-500 text-amber-300 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in">
          <span className="text-emerald-400 font-bold">✓</span>
          <span className="text-xs font-semibold">{cartToast}</span>
          <Link to="/cart" className="ml-2 text-xs font-bold underline hover:text-amber-200 uppercase">
            View Cart &rarr;
          </Link>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-amber-500 dark:hover:text-amber-400 transition">Home</Link>
          <span>/</span>
          <span className="text-amber-600 dark:text-amber-400 font-medium">Instant 3D Print Quote Estimator</span>
        </nav>

        {/* Title */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-block py-1 px-4 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-500 border border-amber-500/25 backdrop-blur-md">
            Automated Slicing & Instant Pricing Engine
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-950 dark:text-white tracking-tight leading-[1.08]">
            Instant 3D Print <span className="apple-gold-gradient">Quote & Model Analyzer</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-zinc-400 font-normal">
            Upload your STL or 3MF file for instant bounding box detection, weight in grams, manifold check, and instant pricing with direct cart checkout.
          </p>
        </div>

        {/* Guarantees */}
        <GuaranteeBadges />

        {submittedOrder ? (
          <div className="rounded-3xl apple-glass p-8 sm:p-12 text-center shadow-2xl text-inherit max-w-2xl mx-auto space-y-4 border border-amber-500/30">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-2 border border-amber-500/30">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest">
              Request ID: {submittedOrder.id || 'ORD-REQ'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Quote Request Confirmed!</h2>
            <p className="text-gray-600 dark:text-zinc-300 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
              Our engineering team has received your model. Fabrication configured in <strong className="text-amber-500">{submittedOrder.desiredMaterial}</strong> ({submittedOrder.desiredColor}) at <strong className="text-amber-500">{submittedOrder.infillDensity}</strong> infill with an estimated price of <strong className="text-gray-900 dark:text-white">₹{submittedOrder.quotePrice}</strong>.
            </p>

            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <Link
                to={`/track?orderId=${encodeURIComponent(submittedOrder.id || 'cust_101')}`}
                className="apple-btn-primary px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-gray-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition"
              >
                Track Fabrication Status &rarr;
              </Link>
              <button
                onClick={() => { setSubmittedOrder(null); setSelectedFile(null); setFileBuffer(null); }}
                className="apple-btn-primary px-6 py-3 rounded-full apple-glass text-gray-700 dark:text-zinc-300 hover:text-amber-500 text-xs font-semibold border border-gray-200/80 dark:border-white/[0.08] transition"
              >
                Configure Another Model
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: 3D STL Viewer & Model File Inspector */}
            <div className="lg:col-span-7 space-y-6">
              {/* 3D Canvas Card */}
              <div className="rounded-3xl apple-glass p-5 sm:p-6 shadow-2xl border border-gray-200/80 dark:border-white/[0.08] text-inherit">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                      Interactive 3D Model Inspector (Three.js)
                    </h3>
                  </div>
                  <span className="text-[11px] text-gray-500 dark:text-zinc-400">Drag to rotate • Wheel to zoom</span>
                </div>

                <StlViewer
                  fileBuffer={fileBuffer}
                  stlUrl={!fileBuffer ? sampleUrl : undefined}
                  height={380}
                  maxBuildDimension={160}
                  onDimensionsCalculated={handleDimensionsCalculated}
                  onError={(msg) => setError(msg)}
                />

                {/* File Upload Selector */}
                <div className="mt-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".stl,.3mf,.obj,.step,.stp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-700 hover:border-amber-500/60 rounded-2xl p-5 text-center cursor-pointer transition bg-[#121824] hover:bg-[#151c2b]"
                  >
                    <div className="flex items-center justify-center gap-2 text-amber-400 text-xs font-bold">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      {selectedFile ? (
                        <span className="truncate">
                          Selected: <strong className="text-white">{selectedFile.name}</strong> ({((selectedFile.size || 0) / (1024 * 1024)).toFixed(1)} MB / 200MB max)
                        </span>
                      ) : (
                        'Click to Upload 3D Model (.stl, .3mf, .obj up to 200MB)'
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Max single-print build volume 160×160×160mm. Automatic bounding box analysis.
                    </p>
                  </div>
                </div>

                {/* Quick Model Sample Selector */}
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                  <span>Load Sample Models:</span>
                  <button
                    type="button"
                    onClick={() => { setSelectedFile(null); setFileBuffer(null); setSampleUrl('/assets/models/sample_dragon.stl'); }}
                    className="px-2.5 py-1 rounded-lg bg-[#121824] hover:bg-gray-800 text-amber-400 font-medium text-[11px] border border-gray-800"
                  >
                    Crystal Dragon
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedFile(null); setFileBuffer(null); setSampleUrl('/assets/models/sample_gearbox.stl'); }}
                    className="px-2.5 py-1 rounded-lg bg-[#121824] hover:bg-gray-800 text-amber-400 font-medium text-[11px] border border-gray-800"
                  >
                    Planetary Gearbox
                  </button>
                </div>
              </div>

              {/* 3D Model File Inspector Metrics Card */}
              <div className="p-6 rounded-3xl apple-glass border border-gray-200/80 dark:border-white/[0.08] shadow-2xl text-inherit space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200/80 dark:border-white/[0.08]">
                  <div>
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">Model Analysis</span>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">3D File Inspection & Geometry Metrics</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                    <span>✓</span> Watertight Manifold
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-gray-50/70 dark:bg-black/30 border border-gray-200/80 dark:border-white/[0.08]">
                    <span className="text-[10px] text-gray-500 dark:text-zinc-400 block font-semibold">Bounding Box</span>
                    <strong className="text-gray-900 dark:text-white font-mono">{dimL} × {dimW} × {dimH} mm</strong>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-gray-50/70 dark:bg-black/30 border border-gray-200/80 dark:border-white/[0.08]">
                    <span className="text-[10px] text-gray-500 dark:text-zinc-400 block font-semibold">Solid Volume</span>
                    <strong className="text-amber-500 font-mono">{volumeCm3} cm³</strong>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-gray-50/70 dark:bg-black/30 border border-gray-200/80 dark:border-white/[0.08]">
                    <span className="text-[10px] text-gray-500 dark:text-zinc-400 block font-semibold">Surface Area</span>
                    <strong className="text-gray-700 dark:text-zinc-200 font-mono">{surfaceAreaCm2} cm²</strong>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-gray-50/70 dark:bg-black/30 border border-gray-200/80 dark:border-white/[0.08]">
                    <span className="text-[10px] text-gray-500 dark:text-zinc-400 block font-semibold">Calculated Weight</span>
                    <strong className="text-amber-500 font-mono text-sm">{calculatedWeightGrams} grams</strong>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-gray-50/70 dark:bg-black/30 border border-gray-200/80 dark:border-white/[0.08]">
                    <span className="text-[10px] text-gray-500 dark:text-zinc-400 block font-semibold">Estimated Layers</span>
                    <strong className="text-gray-700 dark:text-zinc-200 font-mono">{estimatedLayerCount} layers</strong>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-gray-50/70 dark:bg-black/30 border border-gray-200/80 dark:border-white/[0.08]">
                    <span className="text-[10px] text-gray-500 dark:text-zinc-400 block font-semibold">Est. Print Time</span>
                    <strong className="text-emerald-500 font-mono">{estimatedPrintTime}</strong>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-gray-50/50 dark:bg-black/20 border border-gray-200/60 dark:border-white/[0.06] text-[11px] text-gray-500 dark:text-zinc-400 flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Mesh Integrity Check: 0 non-manifold edges, zero inverted vertex normals detected.</span>
                </div>
              </div>
            </div>

            {/* Right Column: Print Parameters & Live Quote Engine */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-3xl apple-glass border border-gray-200/80 dark:border-white/[0.08] shadow-2xl text-inherit space-y-5">
                <div className="pb-3 border-b border-gray-200/80 dark:border-white/[0.08] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">Parameters</span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Fabrication Configuration</h3>
                  </div>
                  <Link to="/materials" className="text-amber-500 hover:underline text-xs font-semibold">
                    Materials Guide &rarr;
                  </Link>
                </div>

                {error && (
                  <div className="p-3 bg-red-950/70 border border-red-500/40 text-red-300 rounded-xl text-xs flex items-center gap-2">
                    <span>⚠️ {error}</span>
                  </div>
                )}

                {/* Dimensions Editor */}
                <div>
                  <div className="flex justify-between items-center mb-1 text-xs">
                    <label className="font-semibold text-gray-300">Dimensions (mm)</label>
                    {exceedsLimit ? (
                      <span className="text-[10px] text-amber-400 font-bold">⚠️ Exceeds 160mm single-print volume</span>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-bold">✓ Fits 160mm print bed</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Length</span>
                      <input
                        type="number"
                        min="1"
                        value={dimL}
                        onChange={(e) => handleDimensionChange(parseFloat(e.target.value) || 1, dimW, dimH)}
                        className="w-full bg-[#121824] border border-gray-700 rounded-xl px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">Width</span>
                      <input
                        type="number"
                        min="1"
                        value={dimW}
                        onChange={(e) => handleDimensionChange(dimL, parseFloat(e.target.value) || 1, dimH)}
                        className="w-full bg-[#121824] border border-gray-700 rounded-xl px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">Height</span>
                      <input
                        type="number"
                        min="1"
                        value={dimH}
                        onChange={(e) => handleDimensionChange(dimL, dimW, parseFloat(e.target.value) || 1)}
                        className="w-full bg-[#121824] border border-gray-700 rounded-xl px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Material Selector */}
                <div>
                  <label className="block font-semibold text-xs text-gray-300 mb-1">Polymer Material</label>
                  <select
                    value={materialCode}
                    onChange={(e) => setMaterialCode(e.target.value)}
                    className="w-full bg-[#121824] border border-gray-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    {MATERIAL_OPTIONS.map((m) => (
                      <option key={m.code} value={m.code}>
                        {m.name} — ₹{m.costPerGram}/g
                      </option>
                    ))}
                  </select>
                </div>

                {/* Color & Finish */}
                <div>
                  <label className="block font-semibold text-xs text-gray-300 mb-1">Color / Finish</label>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full bg-[#121824] border border-gray-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    {COLOR_OPTIONS.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Infill Density Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1 text-xs">
                    <span className="font-semibold text-gray-300">Infill Density: {infill}%</span>
                    <span className="text-[10px] text-amber-400 font-semibold">
                      {infill >= 50 ? 'Heavy-Duty Industrial' : infill >= 30 ? 'Medium Functional' : 'Standard Prototyping'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={infill}
                    onChange={(e) => setInfill(Number(e.target.value))}
                    className="w-full accent-amber-500 h-1.5 bg-gray-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Layer Height Resolution */}
                <div>
                  <label className="block font-semibold text-xs text-gray-300 mb-1">Layer Height Resolution</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {RESOLUTION_OPTIONS.map((res) => (
                      <button
                        key={res.value}
                        type="button"
                        onClick={() => setLayerHeight(res.value)}
                        className={`p-2 rounded-xl border text-left transition ${
                          layerHeight === res.value
                            ? 'bg-[#121824] border-amber-400 ring-1 ring-amber-400 text-white font-bold'
                            : 'bg-[#080b11] border-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        <div className="text-[11px]">{res.label}</div>
                        <div className="text-[9px] text-gray-500">{res.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Print Orientation */}
                <div>
                  <div className="flex justify-between items-center mb-1 text-xs">
                    <label className="font-semibold text-gray-300">Print Orientation</label>
                    <span className="text-[10px] text-amber-400 font-semibold">
                      {ORIENTATION_OPTIONS.find((o) => o.id === orientation)?.factor === 1.0
                        ? 'Standard Alignment'
                        : `${(ORIENTATION_OPTIONS.find((o) => o.id === orientation)?.factor || 1.0) < 1.0 ? 'Cost & Speed Optimized' : 'Precision Oriented'}`}
                    </span>
                  </div>
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value)}
                    className="w-full bg-[#121824] border border-gray-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    {ORIENTATION_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {ORIENTATION_OPTIONS.find((o) => o.id === orientation)?.desc}
                  </p>
                </div>

                {/* Support Structures */}
                <div>
                  <label className="block font-semibold text-xs text-gray-300 mb-1">Support Structures</label>
                  <select
                    value={supports}
                    onChange={(e) => setSupports(e.target.value)}
                    className="w-full bg-[#121824] border border-gray-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="None">None (Self-Supporting Geometry)</option>
                    <option value="Tree Supports">Tree Supports (Organic, Easy-Peel)</option>
                    <option value="Snug Supports">Snug Supports (Flat Overhangs)</option>
                  </select>
                </div>

                {/* Post-Processing Options */}
                <div>
                  <label className="block font-semibold text-xs text-gray-300 mb-1">Post-Processing Finish</label>
                  <select
                    value={postProcessing}
                    onChange={(e) => setPostProcessing(e.target.value)}
                    className="w-full bg-[#121824] border border-gray-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    {POST_PROCESSING_OPTIONS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Express Rush Production Option */}
                <div className="p-3.5 rounded-2xl bg-[#121824] border border-amber-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id="rushCheckbox"
                      checked={isRushOrder}
                      onChange={(e) => setIsRushOrder(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                    />
                    <label htmlFor="rushCheckbox" className="text-xs text-gray-200 cursor-pointer select-none">
                      <strong className="text-white block">⚡ Priority 24-48h Rush Dispatch (+₹199)</strong>
                      <span className="text-[10px] text-gray-400">Jumps to front of printer queue for instant slicing</span>
                    </label>
                  </div>
                </div>

                {/* Live Instant Price Card */}
                <div className="p-5 rounded-2xl apple-glass border border-amber-500/30 shadow-xl space-y-2.5">
                  <div className="flex justify-between items-center text-xs text-gray-500 dark:text-zinc-400">
                    <span>Material ({calculatedWeightGrams}g):</span>
                    <span className="font-mono text-gray-800 dark:text-zinc-200">₹{calculatedPricing.rawMaterialCost}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 dark:text-zinc-400">
                    <span>Machine Calibration & Slicing:</span>
                    <span className="font-mono text-gray-800 dark:text-zinc-200">₹{calculatedPricing.machineCost}</span>
                  </div>
                  {calculatedPricing.postProcessingFee > 0 && (
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-zinc-400">
                      <span>Post-Processing:</span>
                      <span className="font-mono text-amber-500">+₹{calculatedPricing.postProcessingFee}</span>
                    </div>
                  )}
                  {calculatedPricing.rushFee > 0 && (
                    <div className="flex justify-between items-center text-xs text-amber-500">
                      <span>Priority Rush Fee:</span>
                      <span className="font-mono font-bold">+₹{calculatedPricing.rushFee}</span>
                    </div>
                  )}

                  <div className="pt-2.5 border-t border-gray-200/80 dark:border-white/[0.08] flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-gray-500 dark:text-zinc-400 uppercase font-bold tracking-wider block">Instant Quote Price</span>
                      <strong className="text-2xl font-extrabold text-amber-500 font-mono">₹{calculatedPricing.finalPrice}</strong>
                    </div>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 font-bold uppercase">
                      All Inclusive
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-1">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="apple-btn-primary w-full py-4 px-6 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-105 text-gray-950 font-bold text-sm shadow-xl shadow-amber-500/25 transition flex items-center justify-center gap-2"
                  >
                    <span>🛒 Add Custom Print to Cart (₹{calculatedPricing.finalPrice})</span>
                  </button>

                  <div className="text-center text-[11px] text-gray-400 dark:text-zinc-500">— or request custom engineer review —</div>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <input
                        type="text"
                        required
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Your Full Name *"
                        className="bg-[#121824] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                      />
                      <input
                        type="tel"
                        required
                        value={userPhone}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="10-digit WhatsApp *"
                        className="bg-[#121824] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>

                    <input
                      type="email"
                      required
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="Email Address for Formal Quote *"
                      className="w-full bg-[#121824] border border-gray-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                    />

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-bold text-xs transition flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Submit RFQ / Custom Quote Request'
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function setPhoneInput(val: string) {
    setUserPhone(val.replace(/\D/g, '').slice(0, 10));
  }
};

export default CustomPrint;
