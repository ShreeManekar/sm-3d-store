import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { GuaranteeBadges } from '../components/GuaranteeBadges';

export interface Stage {
  key: string;
  title: string;
  desc: string;
  time: string;
  completed: boolean;
  active: boolean;
}

export interface TrackingData {
  orderId: string;
  found: boolean;
  customerName: string;
  destinationCity: string;
  destinationState: string;
  courierPartner: string;
  trackingNumber: string;
  estimatedDelivery: string;
  currentStageIndex: number;
  statusText: string;
  stages: Stage[];
  orderDetails: {
    total: number | string;
    itemsCount: number;
    material: string;
    color: string;
    createdAt: string;
  } | null;
}

const OrderTracking: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialOrderId = searchParams.get('orderId') || 'ORD-2026-8801';
  const [orderInput, setOrderInput] = useState<string>(initialOrderId);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTracking = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/track/${encodeURIComponent(id.trim())}`);
      setTrackingData(res.data);
      setSearchParams({ orderId: id.trim() });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to retrieve tracking record for this order ID.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderId) {
      fetchTracking(initialOrderId);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(orderInput);
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-transparent text-inherit">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-amber-500 dark:hover:text-amber-400 transition">Home</Link>
          <span>/</span>
          <span className="text-amber-600 dark:text-amber-400 font-medium">Live Production Order Tracking</span>
        </nav>

        {/* Title */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="inline-block py-1 px-3.5 rounded-full text-xs font-bold tracking-wider uppercase bg-amber-500/10 text-amber-500 border border-amber-500/30">
            Real-Time Farm Telemetry
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
            Track <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">3D Print Production</span> & Shipment
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Monitor each fabrication stage from slicing and active printer bed status to ISO caliper inspection and courier dispatch.
          </p>
        </div>

        {/* Search Bar */}
        <div className="p-6 rounded-3xl bg-[#0b0f17] border border-amber-500/30 shadow-2xl shadow-black/95">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={orderInput}
                onChange={(e) => setOrderInput(e.target.value)}
                placeholder="Enter Order ID (e.g. ORD-2026-8801 or cust_101)..."
                className="w-full pl-11 pr-4 py-3 bg-[#121824] border border-gray-700 rounded-2xl text-sm text-white placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-mono"
              />
              <svg className="w-5 h-5 text-amber-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-gray-950 font-extrabold text-sm shadow-lg shadow-amber-500/25 transition transform active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                'Track Production'
              )}
            </button>
          </form>

          {/* Quick Demo Shortcuts */}
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
            <span>Quick test IDs:</span>
            <button
              type="button"
              onClick={() => { setOrderInput('ORD-2026-8801'); fetchTracking('ORD-2026-8801'); }}
              className="text-amber-400 hover:underline font-mono text-[11px]"
            >
              ORD-2026-8801
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => { setOrderInput('cust_101'); fetchTracking('cust_101'); }}
              className="text-amber-400 hover:underline font-mono text-[11px]"
            >
              cust_101
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Tracking Details & Stepper */}
        {trackingData && (
          <div className="space-y-6">
            {/* Overview Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0b0f17] border border-amber-500/30 shadow-2xl shadow-black/95 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-800 gap-4">
                <div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Order ID</span>
                  <div className="text-2xl font-extrabold font-mono text-amber-400 mt-0.5">{trackingData.orderId}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Customer: <strong className="text-gray-200">{trackingData.customerName}</strong> • Destination: <strong className="text-gray-200">{trackingData.destinationCity}, {trackingData.destinationState}</strong>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Status</span>
                  <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-xs mt-1">
                    {trackingData.statusText}
                  </span>
                  <div className="text-xs text-emerald-400 font-semibold mt-1 flex items-center sm:justify-end gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Est. Delivery: {trackingData.estimatedDelivery}</span>
                  </div>
                </div>
              </div>

              {/* Courier info banner */}
              <div className="mt-5 p-4 rounded-2xl bg-[#121824] border border-gray-800 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider">Logistics Partner</span>
                  <span className="font-bold text-gray-200 flex items-center gap-1.5 mt-0.5">
                    <span>🚚</span> {trackingData.courierPartner}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider">AWB Consignment Number</span>
                  <span className="font-mono font-bold text-amber-300 mt-0.5 block">{trackingData.trackingNumber}</span>
                </div>
                <a
                  href={`https://wa.me/919284118601?text=Hi%20SM%203D%2C%20I%20am%20inquiring%20about%20Order%20ID%20${encodeURIComponent(trackingData.orderId)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1"
                >
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Stepper Pipeline */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0b0f17] border border-amber-500/20 shadow-2xl shadow-black/95 text-white">
              <h3 className="text-base font-bold text-gray-100 mb-6 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span>Fabrication & Dispatch Timeline</span>
              </h3>

              <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-800">
                {trackingData.stages.map((stage, idx) => {
                  const isCurrent = stage.active;
                  const isPast = stage.completed && !stage.active;
                  return (
                    <div key={stage.key} className="relative flex items-start gap-4">
                      {/* Step Indicator Dot */}
                      <div
                        className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs border transition ${
                          isCurrent
                            ? 'bg-amber-500 text-gray-950 border-amber-300 ring-4 ring-amber-500/30 shadow-lg shadow-amber-500/50'
                            : isPast
                            ? 'bg-emerald-500 text-gray-950 border-emerald-400'
                            : 'bg-[#121824] text-gray-500 border-gray-700'
                        }`}
                      >
                        {isPast ? '✓' : idx + 1}
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className={`text-sm font-bold ${isCurrent ? 'text-amber-400' : isPast ? 'text-gray-100' : 'text-gray-400'}`}>
                            {stage.title}
                          </h4>
                          <span className="text-[11px] font-mono text-gray-400">{stage.time}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{stage.desc}</p>
                        {isCurrent && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Current Operational Stage
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <GuaranteeBadges />
      </div>
    </div>
  );
};

export default OrderTracking;
