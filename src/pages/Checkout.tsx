import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart, CartItem } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface OrderConfirmationData {
  orderId: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  paymentMethod: string;
  upiTransactionId?: string;
  items: CartItem[];
  totalPrice: number;
  shippingFee: number;
  finalTotal: number;
  placedAt: string;
}

export const Checkout: React.FC = () => {
  const { items, totalPrice, shippingFee, finalTotal, clearCart } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone ? currentUser.phone.replace(/\D/g, '').slice(-10) : '',
    street: currentUser?.street || '',
    city: currentUser?.city || '',
    state: currentUser?.state || '',
    pincode: currentUser?.pincode || '',
    paymentMethod: 'UPI',
    notes: '',
  });

  // Settings loaded from backend (UPI ID, Scanner QR, Bank details)
  const [storeSettings, setStoreSettings] = useState<any>({
    upiId: 'shreemanekar0@okaxis',
    upiQrImage: '',
    accountNumber: '928411860101',
    ifscCode: 'SBIN0001234',
    bankName: 'State Bank of India',
    accountHolderName: 'SM 3D Technologies',
  });

  const [upiTransactionId, setUpiTransactionId] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderConfirmationData | null>(null);

  // Delivery coverage cities for autocomplete & verification
  const [deliveryCities, setDeliveryCities] = useState<any[]>([]);
  const [selectedCityCoverage, setSelectedCityCoverage] = useState<any | null>(null);
  const [showCitiesModal, setShowCitiesModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    axios.get('/api/settings')
      .then((res) => {
        if (!isMounted) return;
        if (res.data) {
          setStoreSettings((prev: any) => ({ ...prev, ...res.data }));
        }
      })
      .catch(() => {});

    axios.get('/api/delivery-cities')
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res.data?.cities) ? res.data.cities : (Array.isArray(res.data) ? res.data : []);
        setDeliveryCities(list);
      })
      .catch(() => {});

    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!formData.city.trim() || deliveryCities.length === 0) {
      setSelectedCityCoverage(null);
      return;
    }
    const match = deliveryCities.find(
      (c) => c.active !== false && c.name.toLowerCase() === formData.city.trim().toLowerCase()
    );
    setSelectedCityCoverage(match || null);
  }, [formData.city, deliveryCities]);

  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || currentUser.name || '',
        email: prev.email || currentUser.email || '',
        phone: prev.phone || (currentUser.phone ? currentUser.phone.replace(/\D/g, '').slice(-10) : ''),
        street: prev.street || currentUser.street || '',
        city: prev.city || currentUser.city || '',
        state: prev.state || currentUser.state || '',
        pincode: prev.pincode || currentUser.pincode || '',
      }));
    }
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(`Copied ${label}!`);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  const handlePasteUpi = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const digitsOnly = text.replace(/\D/g, '');
      if (digitsOnly) {
        setUpiTransactionId(digitsOnly);
        setCopyFeedback('UPI ID pasted from clipboard');
        setTimeout(() => setCopyFeedback(null), 2000);
      }
    } catch {
      // Clipboard permissions denied
    }
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size === 0) {
      setError('The selected file is empty (0 bytes).');
      e.target.value = '';
      return;
    }

    const lower = file.name.toLowerCase();
    const validImageExts = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.bmp', '.jfif'];
    const hasImageExt = validImageExts.some((ext) => lower.endsWith(ext));
    if (!file.type.startsWith('image/') && !hasImageExt) {
      setError('Please upload an image file (PNG, JPG, WEBP, etc.) for payment proof.');
      e.target.value = '';
      return;
    }

    const MAX_SIZE = 200 * 1024 * 1024; // 200MB
    if (file.size > MAX_SIZE) {
      setError(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds 200MB limit.`);
      e.target.value = '';
      return;
    }

    setUploadingScreenshot(true);
    setError(null);
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await axios.post('/api/upload', {
        filename: `proof_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
        fileData: base64Data,
      }, {
        timeout: 300000,
      });

      setScreenshotUrl(res.data?.fileUrl || '');
    } catch (err: any) {
      setError('Failed to upload payment proof screenshot. You may still proceed with UPI reference number.');
    } finally {
      setUploadingScreenshot(false);
      e.target.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.street.trim() || !formData.city.trim() || !formData.pincode.trim()) {
      setError('Please fill in all required shipping and contact details.');
      return;
    }

    // Validation for UPI / Account Transfer: requires at least 12 digits
    if (formData.paymentMethod === 'UPI' || formData.paymentMethod === 'Card') {
      const cleanDigits = upiTransactionId.replace(/\D/g, '');
      if (cleanDigits.length < 12) {
        setError('Transaction Verification Failed — Please enter a valid 12 or more digit UPI Transaction ID / UTR reference number.');
        return;
      }
    }

    setIsSubmitting(true);

    const fullAddress = `${formData.street}, ${formData.city}, ${formData.state || ''} - ${formData.pincode}, India`;
    const fallbackOrderId = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const orderPayload = {
      userId: currentUser ? currentUser.id : 'guest',
      userName: formData.name.trim(),
      userEmail: formData.email.trim(),
      userPhone: formData.phone.trim(),
      shippingAddress: {
        street: formData.street.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
      },
      items: items.map((i) => ({
        productId: i.id,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      })),
      subtotal: totalPrice,
      shippingFee,
      total: finalTotal,
      paymentMethod: formData.paymentMethod === 'Card' ? 'Account transfer' : formData.paymentMethod,
      upiTransactionId: (formData.paymentMethod === 'UPI' || formData.paymentMethod === 'Card') ? upiTransactionId.trim() : '',
      paymentScreenshotUrl: screenshotUrl,
      orderNotes: formData.notes.trim(),
    };

    const finalizeOrder = (orderId: string) => {
      const orderData: OrderConfirmationData = {
        orderId,
        customerName: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: fullAddress,
        paymentMethod: formData.paymentMethod === 'Card' ? 'Account transfer' : formData.paymentMethod,
        upiTransactionId: upiTransactionId.trim(),
        items: [...items],
        totalPrice,
        shippingFee,
        finalTotal,
        placedAt: new Date().toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setConfirmedOrder(orderData);
      clearCart();
      setIsSubmitting(false);
    };

    axios
      .post('/api/orders', orderPayload)
      .then((res) => {
        const backendOrderId = res.data?.order?.id || fallbackOrderId;
        finalizeOrder(backendOrderId);
      })
      .catch(() => {
        // Fallback for static/offline
        finalizeOrder(fallbackOrderId);
      });
  };

  // If order was placed, show confirmation screen with requested exact phrase
  if (confirmedOrder) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-transparent text-inherit animate-fadeIn">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl border border-amber-500/30 apple-glass p-8 sm:p-12 text-center shadow-2xl backdrop-blur-xl text-gray-900 dark:text-white transition-all duration-500 ease-apple">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/10 border border-emerald-500/30">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
              Request Received Successfully
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-gray-900 dark:text-white mt-1 mb-3 leading-snug">
              Your order request is collected succesfully, will be contacted soon for further delivery instructions
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm max-w-lg mx-auto mb-6 leading-relaxed">
              Our 3D printing engineering team has received your order specifications and will reach out via WhatsApp or email for slicing review and courier dispatch.
            </p>

            {/* Order Details Card */}
            <div className="p-6 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.08] text-left mb-6 max-w-lg mx-auto space-y-3">
              <div className="flex justify-between items-center text-xs pb-2 border-b border-gray-200/60 dark:border-white/[0.08]">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Order Reference</span>
                <span className="font-mono font-bold text-amber-500">{confirmedOrder.orderId}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Date</span>
                <span className="font-semibold text-gray-900 dark:text-white">{confirmedOrder.placedAt}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Payment Option</span>
                <span className="font-semibold text-gray-900 dark:text-white">{confirmedOrder.paymentMethod}</span>
              </div>
              {confirmedOrder.upiTransactionId && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">UPI / Reference ID</span>
                  <span className="font-mono text-amber-500 font-semibold">{confirmedOrder.upiTransactionId}</span>
                </div>
              )}
              <div className="text-xs pt-1.5 border-t border-gray-200/60 dark:border-white/[0.08]">
                <span className="text-gray-500 dark:text-gray-400 block mb-1 font-medium">Shipping Destination:</span>
                <span className="font-medium text-gray-900 dark:text-white leading-relaxed">{confirmedOrder.address}</span>
              </div>

              {/* Items List */}
              <div className="pt-2 border-t border-gray-200/60 dark:border-white/[0.08] space-y-1.5">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold block mb-1">Items in Production:</span>
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {confirmedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs py-0.5">
                      <span className="text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                        • {item.name} <span className="text-gray-400">×{item.quantity}</span>
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-200/60 dark:border-white/[0.08]">
                <span className="text-sm font-bold text-gray-900 dark:text-white">Total Amount</span>
                <span className="text-2xl font-extrabold text-amber-500">₹{confirmedOrder.finalTotal}</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/shop"
                className="apple-btn-primary px-7 py-3 rounded-2xl font-bold text-gray-950 shadow-lg shadow-amber-500/20 transition-all duration-300 ease-apple active:scale-95"
              >
                Continue Shopping
              </Link>
              <Link
                to="/account"
                className="px-7 py-3 rounded-2xl font-semibold text-amber-500 bg-gray-100/80 dark:bg-white/[0.05] border border-amber-500/30 hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-all duration-300 ease-apple active:scale-95"
              >
                View My Account & Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If cart is empty
  if (items.length === 0) {
    return (
      <div className="min-h-screen py-16 px-4 bg-transparent text-inherit">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-500/30 shadow-xl shadow-black/40">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">No Items to Checkout</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            Your shopping cart is currently empty. Please select a product from our catalog before proceeding to checkout.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to="/shop"
              className="w-full py-3 rounded-xl font-bold text-gray-950 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 shadow-md shadow-amber-500/20 transition"
            >
              Browse 3D Prints
            </Link>
            <Link
              to="/cart"
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-amber-500 transition"
            >
              View Cart Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const activeUpiId = storeSettings.upiId || 'shreemanekar0@okaxis';
  const qrCodeUrl = storeSettings.upiQrImage || `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`upi://pay?pa=${activeUpiId}&pn=SM3DStore&am=${finalTotal}&cu=INR`)}`;

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-transparent text-inherit">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-6" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-amber-500 dark:hover:text-amber-400 transition">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-amber-500 dark:hover:text-amber-400 transition">Shop</Link>
          <span>/</span>
          <Link to="/cart" className="hover:text-amber-500 dark:hover:text-amber-400 transition">Cart</Link>
          <span>/</span>
          <span className="text-amber-500 dark:text-amber-400 font-medium">Checkout</span>
        </nav>

        <div className="mb-8">
          <span className="inline-flex items-center gap-1.5 py-1 px-3.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 backdrop-blur-md mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Secure Encrypted Checkout
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-gray-900 dark:text-white leading-[1.1]">
            Checkout & <span className="apple-gold-gradient">Order Placement</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mt-2 max-w-2xl font-normal leading-relaxed">
            Provide your shipping details below to schedule production and delivery.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 text-sm flex items-center gap-3 shadow-sm animate-shake">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {copyFeedback && (
          <div className="fixed bottom-6 right-6 z-50 bg-gray-950/90 text-white px-5 py-3 rounded-2xl shadow-2xl border border-amber-500/40 text-xs font-semibold animate-fadeIn flex items-center gap-2 backdrop-blur-md">
            <span className="text-emerald-400">✓</span> {copyFeedback}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div className="p-6 sm:p-8 rounded-3xl apple-glass border border-gray-200/80 dark:border-white/[0.08] space-y-4 shadow-xl backdrop-blur-xl text-gray-900 dark:text-white transition-all duration-300 ease-apple">
                <h2 className="text-lg font-bold font-display flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 text-xs flex items-center justify-center font-bold">1</span>
                  Contact Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Shree Manekar"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full bg-gray-50/80 dark:bg-white/[0.04] border border-gray-300/80 dark:border-white/[0.1] rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="e.g. shree@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-gray-50/80 dark:bg-white/[0.04] border border-gray-300/80 dark:border-white/[0.1] rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 transition"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Phone Number (WhatsApp updates) *</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-gray-50/80 dark:bg-white/[0.04] border border-gray-300/80 dark:border-white/[0.1] rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 font-mono transition"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="p-6 sm:p-8 rounded-3xl apple-glass border border-gray-200/80 dark:border-white/[0.08] space-y-4 shadow-xl backdrop-blur-xl text-gray-900 dark:text-white transition-all duration-300 ease-apple">
                <h2 className="text-lg font-bold font-display flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 text-xs flex items-center justify-center font-bold">2</span>
                  Delivery Address
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Street Address / House No / Landmark *</label>
                    <input
                      type="text"
                      name="street"
                      required
                      placeholder="e.g. Flat 301, Lakeview Residency, Civil Lines"
                      value={formData.street}
                      onChange={handleChange}
                      className="w-full bg-gray-50/80 dark:bg-white/[0.04] border border-gray-300/80 dark:border-white/[0.1] rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">City *</label>
                        {deliveryCities.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowCitiesModal(true)}
                            className="text-[10px] text-amber-500 hover:underline font-bold"
                          >
                            {deliveryCities.filter(c => c.active !== false).length}+ Cities
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        name="city"
                        required
                        list="supported-delivery-cities"
                        placeholder="e.g. Chandrapur, Nagpur, Pune"
                        value={formData.city}
                        onChange={(e) => {
                          const val = e.target.value;
                          const matched = deliveryCities.find(
                            (c) => c.active !== false && c.name.toLowerCase() === val.trim().toLowerCase()
                          );
                          setFormData((prev) => ({
                            ...prev,
                            city: val,
                            state: matched?.state && !prev.state ? matched.state : prev.state
                          }));
                        }}
                        className="w-full bg-gray-50/80 dark:bg-white/[0.04] border border-gray-300/80 dark:border-white/[0.1] rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 transition"
                      />
                      <datalist id="supported-delivery-cities">
                        {deliveryCities
                          .filter((c) => c.active !== false)
                          .map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.state} ({c.estimatedDays || '2-4 Days'})
                            </option>
                          ))}
                      </datalist>

                      {selectedCityCoverage ? (
                        <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <span>✓ Verified Hub ({selectedCityCoverage.estimatedDays || '2-4 Days'})</span>
                        </div>
                      ) : formData.city.trim() ? (
                        <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                          <span>Standard courier dispatch to this PIN/City</span>
                        </div>
                      ) : null}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">State *</label>
                      <input
                        type="text"
                        name="state"
                        required
                        placeholder="e.g. Maharashtra"
                        value={formData.state}
                        onChange={handleChange}
                        className="w-full bg-gray-50/80 dark:bg-white/[0.04] border border-gray-300/80 dark:border-white/[0.1] rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">PIN Code *</label>
                      <input
                        type="text"
                        name="pincode"
                        required
                        placeholder="e.g. 442401"
                        value={formData.pincode}
                        onChange={handleChange}
                        className="w-full bg-gray-50/80 dark:bg-white/[0.04] border border-gray-300/80 dark:border-white/[0.1] rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 font-mono transition"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="p-6 sm:p-8 rounded-3xl apple-glass border border-gray-200/80 dark:border-white/[0.08] space-y-4 shadow-xl backdrop-blur-xl text-gray-900 dark:text-white transition-all duration-300 ease-apple">
                <h2 className="text-lg font-bold font-display flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 text-xs flex items-center justify-center font-bold">3</span>
                  Payment Method
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'UPI', label: 'UPI / QR Code', desc: 'Scan & Pay via GPay, PhonePe, Paytm' },
                    { id: 'Card', label: 'Account transfer', desc: 'Account Transfer takes 24 to confirm your order.' },
                    { id: 'COD', label: 'Cash on Delivery', desc: 'Pay cash when package arrives' },
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 ease-apple flex flex-col justify-between ${
                        formData.paymentMethod === method.id
                          ? 'bg-amber-500/10 border-amber-400 text-gray-900 dark:text-white shadow-sm ring-1 ring-amber-500/30'
                          : 'bg-gray-100/50 dark:bg-white/[0.03] border-gray-200/60 dark:border-white/[0.06] text-gray-700 dark:text-gray-300 hover:border-amber-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm">{method.label}</span>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={formData.paymentMethod === method.id}
                          onChange={handleChange}
                          className="accent-amber-500 w-4 h-4 cursor-pointer"
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{method.desc}</span>
                    </label>
                  ))}
                </div>

                {/* DYNAMIC PAYMENT VERIFICATION CARD (for UPI & Account Transfer) */}
                {(formData.paymentMethod === 'UPI' || formData.paymentMethod === 'Card') && (
                  <div className="mt-4 p-6 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.08] space-y-4 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      {/* QR Scanner Display */}
                      <div className="flex flex-col items-center p-4 rounded-2xl bg-white dark:bg-black/60 border border-gray-200/80 dark:border-white/[0.1] shadow-md">
                        <img
                          src={qrCodeUrl}
                          alt="Admin UPI Scanner QR"
                          className="w-40 h-40 object-contain rounded-xl"
                        />
                        <span className="text-[10px] font-bold text-amber-500 mt-2 uppercase tracking-wider">
                          Scan to Pay ₹{finalTotal}
                        </span>
                      </div>

                      {/* Payment Details */}
                      <div className="flex-1 space-y-2 text-xs">
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                          <span className="text-gray-500 dark:text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Admin Official UPI ID</span>
                          <div className="flex items-center justify-between mt-1">
                            <span className="font-mono font-bold text-sm text-amber-500">{activeUpiId}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(activeUpiId, 'UPI ID')}
                              className="apple-btn-primary px-3 py-1 rounded-lg text-gray-950 font-bold text-[11px] shadow-sm transition-all duration-300 ease-apple active:scale-95"
                            >
                              Copy UPI ID
                            </button>
                          </div>
                        </div>

                        {formData.paymentMethod === 'Card' && (
                          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-1.5 text-xs">
                            <div className="font-bold text-purple-700 dark:text-purple-300 text-xs flex items-center gap-1.5">
                              <span>🏦</span> Admin Bank Account Details (IMPS / NEFT)
                            </div>
                            <div className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                              <span className="font-medium text-gray-500">Holder:</span> {storeSettings.accountHolderName || 'SM 3D Technologies'}<br />
                              <span className="font-medium text-gray-500">Bank:</span> {storeSettings.bankName || 'State Bank of India'}<br />
                              <span className="font-medium text-gray-500">A/C Number:</span> <span className="font-mono font-bold text-gray-900 dark:text-white">{storeSettings.accountNumber || '928411860101'}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(storeSettings.accountNumber || '928411860101', 'Account Number')}
                                className="ml-2 text-[10px] text-purple-600 dark:text-purple-400 hover:underline font-semibold"
                              >
                                [Copy]
                              </button><br />
                              <span className="font-medium text-gray-500">IFSC Code:</span> <span className="font-mono font-bold text-gray-900 dark:text-white">{storeSettings.ifscCode || 'SBIN0001234'}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(storeSettings.ifscCode || 'SBIN0001234', 'IFSC Code')}
                                className="ml-2 text-[10px] text-purple-600 dark:text-purple-400 hover:underline font-semibold"
                              >
                                [Copy]
                              </button>
                            </div>
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold pt-1">
                              * Account Transfer takes 24 to confirm your order.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* UPI Transaction ID Input with Paste Button */}
                    <div className="pt-2 border-t border-gray-200/60 dark:border-white/[0.08]">
                      <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">
                        UPI Transaction ID / UTR Number (12+ Digits) *
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          required
                          value={upiTransactionId}
                          onChange={(e) => setUpiTransactionId(e.target.value.replace(/\D/g, ''))}
                          placeholder="Enter 12+ digit transaction number (e.g. 428912345678)"
                          className="w-full bg-white/80 dark:bg-white/[0.04] border border-gray-300/80 dark:border-white/[0.1] rounded-xl pl-4 pr-20 py-2.5 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 transition"
                        />
                        <button
                          type="button"
                          onClick={handlePasteUpi}
                          className="absolute right-2 px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.12] text-gray-700 dark:text-gray-300 text-xs font-bold transition shadow-sm border border-gray-300/80 dark:border-white/[0.1]"
                          title="Paste from clipboard"
                        >
                          📋 Paste
                        </button>
                      </div>
                      <div className="flex justify-between items-center mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                        <span>Digits entered: {upiTransactionId.length} (minimum 12 numbers required)</span>
                        {upiTransactionId.length >= 12 && (
                          <span className="text-emerald-500 font-semibold">✓ Valid length</span>
                        )}
                      </div>
                    </div>

                    {/* Upload Payment Screenshot Proof (Optional) */}
                    <div>
                      <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">
                        Upload Screenshot of Payment (Optional)
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="px-4 py-2.5 rounded-xl bg-white/80 dark:bg-white/[0.04] border border-dashed border-gray-300/80 dark:border-white/[0.15] hover:border-amber-500 text-amber-500 text-xs font-semibold cursor-pointer transition-all duration-300 ease-apple flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <span>{uploadingScreenshot ? 'Uploading Proof...' : (screenshotUrl ? 'Change Screenshot' : 'Choose Payment Screenshot')}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleScreenshotUpload}
                            disabled={uploadingScreenshot}
                            className="hidden"
                          />
                        </label>
                        {screenshotUrl && (
                          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                            <img src={screenshotUrl} alt="Payment Proof" className="w-8 h-8 rounded-lg object-cover border border-emerald-500" />
                            <span>✓ Screenshot attached</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Notes */}
              <div className="p-6 sm:p-8 rounded-3xl apple-glass border border-gray-200/80 dark:border-white/[0.08] space-y-3 shadow-xl backdrop-blur-xl text-gray-900 dark:text-white transition-all duration-300 ease-apple">
                <label className="block text-sm font-bold font-display">Order Notes / Custom Requests (Optional)</label>
                <textarea
                  name="notes"
                  rows={2}
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Special instructions, desired color variant preference, or landmark details..."
                  className="w-full bg-gray-50/80 dark:bg-white/[0.04] border border-gray-300/80 dark:border-white/[0.1] rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 transition"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="apple-btn-primary w-full py-4 rounded-2xl font-black text-gray-950 text-base shadow-xl shadow-amber-500/25 transition-all duration-300 ease-apple hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Processing Order...</span>
                ) : (
                  <>
                    <span>Place Order (₹{finalTotal})</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 p-6 sm:p-8 rounded-3xl apple-glass border border-gray-200/80 dark:border-white/[0.08] space-y-5 shadow-2xl backdrop-blur-xl text-gray-900 dark:text-white transition-all duration-300 ease-apple">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200/60 dark:border-white/[0.08]">
                <h2 className="text-lg font-bold font-display">Items in Order ({items.length})</h2>
                <Link to="/cart" className="text-xs text-amber-500 hover:underline font-semibold">
                  Edit Cart
                </Link>
              </div>

              {/* Items List */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    to="/cart"
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100/60 dark:hover:bg-white/[0.05] transition-all duration-300 ease-apple group"
                    title="Click to edit in Cart"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-xl bg-gray-100 dark:bg-gray-950 border border-gray-200/80 dark:border-white/[0.08] flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-gray-900 dark:text-white truncate group-hover:text-amber-500 transition">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">Qty: {item.quantity} × ₹{item.price}</div>
                    </div>
                    <div className="text-xs font-bold text-amber-500">
                      ₹{item.price * item.quantity}
                    </div>
                  </Link>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 text-xs border-t border-gray-200/60 dark:border-white/[0.08] pt-4">
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900 dark:text-white">₹{totalPrice}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Delivery Fee</span>
                  {shippingFee === 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold uppercase">FREE</span>
                  ) : (
                    <span className="font-semibold text-gray-900 dark:text-white">₹{shippingFee}</span>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-baseline pt-2 border-t border-gray-200/60 dark:border-white/[0.08]">
                <span className="text-sm font-bold text-gray-900 dark:text-white">Total</span>
                <span className="text-2xl font-extrabold text-amber-500">₹{finalTotal}</span>
              </div>

              <div className="pt-2 text-center">
                <Link
                  to="/cart"
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-amber-500 transition"
                >
                  &larr; Back to Shopping Cart
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* DELIVERY CITIES COVERAGE SELECTION MODAL */}
      {showCitiesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="apple-glass border border-gray-200/80 dark:border-white/[0.08] w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-4 max-h-[85vh] flex flex-col text-gray-900 dark:text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold font-display text-gray-900 dark:text-white text-base flex items-center gap-2">
                  <span>🚚 Deliverable Destinations</span>
                  <span className="text-xs bg-amber-500/10 text-amber-500 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold">
                    {deliveryCities.filter(c => c.active !== false).length} Cities
                  </span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Click your city to automatically fill shipping details.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCitiesModal(false)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white text-base p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {deliveryCities
                  .filter((c) => c.active !== false)
                  .map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          city: city.name,
                          state: city.state || prev.state
                        }));
                        setShowCitiesModal(false);
                      }}
                      className="p-3.5 rounded-2xl bg-gray-100/60 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/[0.06] text-left hover:border-amber-500/50 hover:bg-amber-500/10 transition-all duration-300 ease-apple flex items-center justify-between group"
                    >
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white group-hover:text-amber-500 block transition">
                          {city.name}
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">{city.state}</span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {city.estimatedDays || '2-4 Days'}
                      </span>
                    </button>
                  ))}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200/60 dark:border-white/[0.08] flex items-center justify-between text-xs">
              <span className="text-[11px] text-gray-500 dark:text-gray-400">Don't see your city? We deliver nationwide via Speed Post.</span>
              <button
                type="button"
                onClick={() => setShowCitiesModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.1] text-gray-700 dark:text-gray-300 font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
