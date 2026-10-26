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
    <footer className="bg-gray-100 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-900 text-gray-600 dark:text-gray-400 py-10 mt-auto transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-xl text-gray-900 dark:text-white mb-3 hover:text-cyan-600 dark:hover:text-cyan-400 transition">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm shadow-md shadow-cyan-500/20">
              3D
            </span>
            <span>SM <span className="text-cyan-600 dark:text-cyan-400">3D</span></span>
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Precision additive manufacturing & on-demand custom 3D printing up to 160mm build volume.
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Delivering to <strong>{deliveryCount}+ Cities</strong> across India</span>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Shop & Services</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/shop" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition">Shop Catalog</Link></li>
            <li><Link to="/custom-print" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition">Custom 3D Printing Quote</Link></li>
            <li><Link to="/cart" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition">Shopping Cart</Link></li>
          </ul>
        </div>

        {/* Tech Specs Box - Dynamically Loaded & Editable in Admin Portal */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Tech Specs</h4>
            {isAdmin && isEditorMode && (
              <Link
                to="/admin?tab=settings"
                className="text-[10px] bg-purple-600 hover:bg-purple-500 text-white font-bold px-2 py-0.5 rounded shadow transition"
                title="Edit Tech Specs in Admin Portal"
              >
                ✏️ Edit Tech Specs
              </Link>
            )}
          </div>
          <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <li>Max Build: {techSpecs.buildVolume}</li>
            <li>Layer Height: {techSpecs.layerHeight}</li>
            <li>Materials: {techSpecs.materials}</li>
            {techSpecs.nozzleSize && <li>Nozzle: {techSpecs.nozzleSize}</li>}
            {techSpecs.printSpeed && <li>Speed: {techSpecs.printSpeed}</li>}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Portals & Security</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/account" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition">My Account Portal</Link></li>
            <li><Link to="/admin" className="hover:text-purple-600 dark:hover:text-purple-400 transition">Admin Portal</Link></li>
            <li><Link to="/checkout" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition">Instant Checkout</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-gray-200 dark:border-gray-900 text-center text-xs text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} SM 3D Printing Store. Precision Additive Manufacturing. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
