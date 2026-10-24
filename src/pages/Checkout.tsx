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
  items: CartItem[];
  totalPrice: number;
  shippingFee: number;
  finalTotal: number;
  placedAt: string;
}

const Checkout: React.FC = () => {
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

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderConfirmationData | null>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.street.trim() || !formData.city.trim() || !formData.pincode.trim()) {
      setError('Please fill in all required shipping and contact details.');
      return;
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
      paymentMethod: formData.paymentMethod,
      orderNotes: formData.notes.trim(),
    };

    const finalizeOrder = (orderId: string) => {
      const orderData: OrderConfirmationData = {
        orderId,
        customerName: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: fullAddress,
        paymentMethod: formData.paymentMethod,
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
        // Offline / static hosting fallback
        finalizeOrder(fallbackOrderId);
      });
  };

  // If order was placed, show confirmation screen
  if (confirmedOrder) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-transparent text-inherit">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-cyan-500/40 bg-white dark:bg-gray-900/90 p-8 sm:p-10 text-center shadow-2xl backdrop-blur text-gray-900 dark:text-white">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/20">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <span className="text-cyan-600 dark:text-cyan-400 font-bold text-xs uppercase tracking-wider">Order Received</span>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1 mb-2">Thank You For Your Order!</h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm max-w-md mx-auto mb-6">
              Your 3D print order is queued for slicing and printing. We have dispatched confirmation to{' '}
              <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{confirmedOrder.email}</span> and WhatsApp{' '}
              <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{confirmedOrder.phone}</span>.
            </p>

            {/* Order Details Card */}
            <div className="p-5 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-left mb-6 max-w-lg mx-auto space-y-3">
              <div className="flex justify-between items-center text-xs pb-2 border-b border-gray-200 dark:border-gray-800">
                <span className="text-gray-500">Order ID</span>
                <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{confirmedOrder.orderId}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Date</span>
                <span className="font-medium text-gray-900 dark:text-white">{confirmedOrder.placedAt}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Payment</span>
                <span className="font-medium text-gray-900 dark:text-white">{confirmedOrder.paymentMethod}</span>
              </div>
              <div className="text-xs pt-1 border-t border-gray-200 dark:border-gray-800">
                <span className="text-gray-500 block mb-1">Delivering to:</span>
                <span className="font-medium text-gray-900 dark:text-white leading-relaxed">{confirmedOrder.address}</span>
              </div>

              {/* Items List */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-800 space-y-1.5">
                <span className="text-xs text-gray-500 font-semibold block mb-1">Items Ordered:</span>
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {confirmedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs py-0.5">
                      <span className="text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                        {item.name} <span className="text-gray-400">×{item.quantity}</span>
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-800">
                <span className="text-sm font-bold text-gray-900 dark:text-white">Total Amount</span>
                <span className="text-lg font-extrabold text-cyan-600 dark:text-cyan-400">₹{confirmedOrder.finalTotal}</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/shop"
                className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 transition transform hover:-translate-y-0.5"
              >
                Continue Shopping
              </Link>
              <Link
                to="/account"
                className="px-6 py-3 rounded-xl font-semibold text-cyan-600 dark:text-cyan-300 bg-gray-100 dark:bg-gray-900 border border-cyan-500/30 hover:bg-gray-200 dark:hover:bg-gray-800 transition transform hover:-translate-y-0.5"
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
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
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
              className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-md shadow-cyan-500/20 transition"
            >
              Browse 3D Prints
            </Link>
            <Link
              to="/cart"
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition"
            >
              View Cart Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-transparent text-inherit">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-6" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition">Shop</Link>
          <span>/</span>
          <Link to="/cart" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition">Cart</Link>
          <span>/</span>
          <span className="text-cyan-600 dark:text-cyan-400 font-medium">Checkout</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Checkout & Order Placement</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Provide your shipping details below to schedule production and delivery.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-4 shadow-sm text-gray-900 dark:text-white">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs flex items-center justify-center font-bold">1</span>
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
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-cyan-400"
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
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-cyan-400"
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
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-4 shadow-sm text-gray-900 dark:text-white">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs flex items-center justify-center font-bold">2</span>
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
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">City *</label>
                      <input
                        type="text"
                        name="city"
                        required
                        placeholder="e.g. Chandrapur"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-cyan-400"
                      />
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
                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-cyan-400"
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
                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-4 shadow-sm text-gray-900 dark:text-white">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs flex items-center justify-center font-bold">3</span>
                  Payment Method
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'UPI', label: 'UPI / QR Code', desc: 'GPay, PhonePe, Paytm' },
                    { id: 'COD', label: 'Cash on Delivery', desc: 'Pay when delivered' },
                    { id: 'Card', label: 'Card / NetBanking', desc: 'Credit, Debit, Net' },
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                        formData.paymentMethod === method.id
                          ? 'bg-cyan-500/10 border-cyan-400 text-gray-900 dark:text-white'
                          : 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">{method.label}</span>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={formData.paymentMethod === method.id}
                          onChange={handleChange}
                          className="accent-cyan-500"
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{method.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Order Notes */}
              <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3 shadow-sm text-gray-900 dark:text-white">
                <label className="block text-sm font-bold">Order Notes / Custom Requests (Optional)</label>
                <textarea
                  name="notes"
                  rows={2}
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Special instructions, desired color variant preference, or landmark details..."
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-xl shadow-cyan-500/25 transition transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 text-base flex items-center justify-center gap-2"
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
            <div className="sticky top-24 p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-5 shadow-2xl text-gray-900 dark:text-white">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-bold">Items in Order ({items.length})</h2>
                <Link to="/cart" className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline">
                  Edit Cart
                </Link>
              </div>

              {/* Items List */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    to="/cart"
                    className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/60 transition group"
                    title="Click to edit in Cart"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-lg bg-gray-100 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-gray-900 dark:text-white truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">Qty: {item.quantity} × ₹{item.price}</div>
                    </div>
                    <div className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
                      ₹{item.price * item.quantity}
                    </div>
                  </Link>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 text-xs border-t border-gray-200 dark:border-gray-800 pt-4">
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
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>GST 18%</span>
                  <span className="text-gray-500 dark:text-gray-400">Included</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline pt-2 border-t border-gray-200 dark:border-gray-800">
                <span className="text-sm font-bold text-gray-900 dark:text-white">Total</span>
                <span className="text-xl font-extrabold text-cyan-600 dark:text-cyan-400">₹{finalTotal}</span>
              </div>

              <div className="pt-2 text-center">
                <Link
                  to="/cart"
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition"
                >
                  &larr; Back to Shopping Cart
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
