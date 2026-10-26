import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export interface TechSpecsData {
  buildVolume?: string;
  layerHeight?: string;
  materials?: string;
  nozzleSize?: string;
  printSpeed?: string;
  notes?: string;
}

export const Footer: React.FC = () => {
  const { isAdmin, isEditorMode } = useAuth();
  const [deliveryCount, setDeliveryCount] = useState<number>(40);
  const [techSpecs, setTechSpecs] = useState<TechSpecsData>({
    buildVolume: '160 × 160 × 160 mm',
    layerHeight: '0.12 - 0.28 mm',
    materials: 'PLA, PETG, ABS, CF-PETG, TPU',
    nozzleSize: '0.4 mm Precision Hardened',
  });

  useEffect(() => {
    let isMounted = true;
    axios.get('/api/settings')
      .then((res) => {
        if (!isMounted) return;
        if (res.data?.techSpecs) {
          setTechSpecs({
            buildVolume: res.data.techSpecs.buildVolume || `${res.data.maxPrintDimension || 160} × ${res.data.maxPrintDimension || 160} × ${res.data.maxPrintDimension || 160} mm`,
            layerHeight: res.data.techSpecs.layerHeight || '0.12 - 0.28 mm',
            materials: res.data.techSpecs.materials || 'PLA, PETG, ABS, CF-PETG, TPU',
            nozzleSize: res.data.techSpecs.nozzleSize || '0.4 mm Precision Hardened',
            printSpeed: res.data.techSpecs.printSpeed,
            notes: res.data.techSpecs.notes,
          });
        }
      })
      .catch(() => {});

    axios.get('/api/delivery-cities')
      .then((res) => {
        if (!isMounted) return;
        if (res.data?.count) setDeliveryCount(res.data.count);
      })
      .catch(() => {});

    return () => { isMounted = false; };
  }, []);

  return (
    <footer className="bg-gray-100 dark:bg-[#080b11] border-t border-gray-200 dark:border-amber-500/20 text-gray-600 dark:text-gray-400 py-12 mt-auto transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-5 gap-8">
        <div className="md:col-span-2">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-xl text-gray-900 dark:text-white mb-3 hover:text-amber-500 dark:hover:text-amber-400 transition">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-600 flex items-center justify-center text-gray-950 font-black text-sm shadow-md shadow-amber-500/20">
              3D
            </span>
            <span>SM <span className="text-amber-500 dark:text-amber-400 font-extrabold">3D</span></span>
          </Link>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm">
            Precision additive manufacturing, engineering prototypes, and high-volume commercial 3D printing up to 160mm single-print build volume. ISO-grade digital caliper inspection on every shipment.
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Express Delivery to <strong>{deliveryCount}+ Verified Hubs</strong> Nationwide</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-500/90 font-medium">
            🛡️ 100% Fit & Free Reprint Guarantee
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3 text-amber-500">Shop & Fabricate</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/shop" className="hover:text-amber-500 dark:hover:text-amber-400 transition">Shop Catalog</Link></li>
            <li><Link to="/custom-print" className="hover:text-amber-500 dark:hover:text-amber-400 transition font-semibold text-amber-400">Instant 3D Print Quote</Link></li>
            <li><Link to="/materials" className="hover:text-amber-500 dark:hover:text-amber-400 transition">Materials Comparison Guide</Link></li>
            <li><Link to="/cart" className="hover:text-amber-500 dark:hover:text-amber-400 transition">Shopping Cart</Link></li>
            <li><Link to="/checkout" className="hover:text-amber-500 dark:hover:text-amber-400 transition">Instant Checkout</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3 text-amber-500">Resources & Tracking</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/track" className="hover:text-amber-500 dark:hover:text-amber-400 transition font-semibold">Track Production Order</Link></li>
            <li><Link to="/showcase" className="hover:text-amber-500 dark:hover:text-amber-400 transition">Real Print Showcase & Reviews</Link></li>
            <li><Link to="/faq" className="hover:text-amber-500 dark:hover:text-amber-400 transition">DFAM Engineering & FAQ</Link></li>
            <li><Link to="/rfq" className="hover:text-amber-500 dark:hover:text-amber-400 transition">Enterprise Bulk RFQ</Link></li>
            <li><Link to="/account" className="hover:text-amber-500 dark:hover:text-amber-400 transition">Customer Portal</Link></li>
          </ul>
        </div>

        {/* Tech Specs Box */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider text-amber-500">Tech Specs</h4>
            {isAdmin && isEditorMode && (
              <Link
                to="/admin?tab=settings"
                className="text-[10px] bg-purple-600 hover:bg-purple-500 text-white font-bold px-2 py-0.5 rounded shadow transition"
                title="Edit Tech Specs in Admin Portal"
              >
                ✏️ Edit
              </Link>
            )}
          </div>
          <ul className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
            <li><strong className="text-gray-300">Max Build:</strong> {techSpecs.buildVolume}</li>
            <li><strong className="text-gray-300">Resolution:</strong> {techSpecs.layerHeight}</li>
            <li><strong className="text-gray-300">Materials:</strong> {techSpecs.materials}</li>
            {techSpecs.nozzleSize && <li><strong className="text-gray-300">Nozzle:</strong> {techSpecs.nozzleSize}</li>}
            {techSpecs.printSpeed && <li><strong className="text-gray-300">Speed:</strong> {techSpecs.printSpeed}</li>}
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-gray-200 dark:border-gray-900 text-center text-xs text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} SM 3D Printing Store. Precision Additive Manufacturing & Custom 3D Printing Service. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
