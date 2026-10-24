import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Cart: React.FC = () => {
  const {
    items,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    shippingFee,
    freeShippingThreshold,
    finalTotal
  } = useCart();
  const navigate = useNavigate();

  const progressPercent = Math.min(100, Math.round((totalPrice / freeShippingThreshold) * 100));

  return (
    <div className="min-h-screen bg-[#090d16] text-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-cyan-400 transition">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-cyan-400 transition">Shop</Link>
          <span>/</span>
          <span className="text-cyan-400 font-medium">Cart</span>
        </nav>

        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="max-w-2xl mx-auto text-center py-16 px-4">
            <div className="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-cyan-500/10">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-3">Your Cart is Empty</h1>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed max-w-md mx-auto">
              Looks like you haven't added any 3D printed models to your cart yet. Explore our precision ready-made prints or submit a custom 3D model!
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/shop"
                className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 transition transform hover:-translate-y-0.5"
              >
                Browse 3D Print Catalog
              </Link>
              <Link
                to="/custom-print"
                className="px-6 py-3 rounded-xl font-semibold text-cyan-300 bg-gray-900 border border-cyan-500/30 hover:bg-gray-800 hover:border-cyan-400 transition transform hover:-translate-y-0.5"
              >
                Request Custom Print
              </Link>
            </div>
          </div>
        ) : (
          /* Active Cart State */
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-gray-800 gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-white">Shopping Cart</h1>
                <p className="text-sm text-gray-400 mt-1">
                  You have <span className="text-cyan-400 font-semibold">{totalItems} {totalItems === 1 ? 'item' : 'items'}</span> in your cart.
                </p>
              </div>
              <button
                onClick={clearCart}
                className="text-xs text-gray-400 hover:text-red-400 border border-gray-800 hover:border-red-500/40 px-3 py-1.5 rounded-lg transition self-start sm:self-auto flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear Cart
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Items List */}
              <div className="lg:col-span-2 space-y-4">
                {/* Shipping Progress */}
                <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800 mb-6">
                  <div className="flex justify-between items-center text-xs mb-2">
                    {totalPrice >= freeShippingThreshold ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Unlocked FREE Delivery across India!
                      </span>
                    ) : (
                      <span className="text-gray-300">
                        Add <span className="text-cyan-400 font-bold">₹{freeShippingThreshold - totalPrice}</span> more to unlock <span className="text-white font-semibold">FREE Delivery</span>
                      </span>
                    )}
                    <span className="text-gray-400">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 rounded-2xl bg-gray-900/80 border border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition hover:border-gray-700"
                  >
                    {/* Product info + image */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Link
                        to="/shop"
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gray-950 border border-gray-800 overflow-hidden flex-shrink-0 flex items-center justify-center p-1 hover:border-cyan-400 transition"
                        title="View in Shop"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        {item.category && (
                          <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider block mb-1">
                            {item.category}
                          </span>
                        )}
                        <Link
                          to="/shop"
                          className="font-bold text-white text-base truncate block mb-1 hover:text-cyan-300 transition"
                          title="View in Shop"
                        >
                          {item.name}
                        </Link>
                        {item.dimensions && (
                          <div className="text-xs text-gray-500 mb-1">
                            Dimensions: {item.dimensions}
                          </div>
                        )}
                        <div className="text-sm text-cyan-400 font-semibold">
                          ₹{item.price} each
                        </div>
                      </div>
                    </div>

                    {/* Quantity controls + Line Total + Remove */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-800">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-gray-700 rounded-xl bg-gray-950 overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-1 text-gray-400 hover:text-white hover:bg-gray-800 transition text-sm font-bold"
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          -
                        </button>
                        <span className="px-3 py-1 text-sm font-semibold text-white min-w-[28px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, Math.min(99, item.quantity + 1))}
                          className="px-3 py-1 text-gray-400 hover:text-white hover:bg-gray-800 transition text-sm font-bold disabled:opacity-40"
                          aria-label={`Increase quantity of ${item.name}`}
                          disabled={item.quantity >= 99}
                        >
                          +
                        </button>
                      </div>

                      {/* Line total */}
                      <div className="text-right min-w-[80px]">
                        <div className="text-xs text-gray-500 sm:hidden">Total</div>
                        <div className="text-lg font-bold text-white">
                          ₹{item.price * item.quantity}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition"
                        title="Remove item"
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Continue Shopping Link */}
                <div className="pt-4">
                  <Link
                    to="/shop"
                    className="inline-flex items-center text-sm font-medium text-cyan-400 hover:text-cyan-300 transition gap-1.5"
                  >
                    <span>&larr;</span> Continue Shopping
                  </Link>
                </div>
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-5 shadow-2xl">
                  <h2 className="text-xl font-bold text-white">Order Summary</h2>

                  <div className="space-y-3 text-sm border-b border-gray-800 pb-4">
                    <div className="flex justify-between text-gray-300">
                      <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
                      <span className="font-semibold text-white">₹{totalPrice}</span>
                    </div>

                    <div className="flex justify-between text-gray-300">
                      <span>Delivery / Shipping</span>
                      {shippingFee === 0 ? (
                        <span className="text-emerald-400 font-semibold uppercase text-xs bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          FREE
                        </span>
                      ) : (
                        <span className="font-semibold text-white">₹{shippingFee}</span>
                      )}
                    </div>

                    <div className="flex justify-between text-gray-300">
                      <span>Taxes (GST 18%)</span>
                      <span className="text-xs text-gray-400">Included in price</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-base font-bold text-white">Total Amount</span>
                    <span className="text-2xl font-extrabold text-cyan-400">₹{finalTotal}</span>
                  </div>

                  <button
                    onClick={() => navigate('/checkout')}
                    className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 transition transform hover:-translate-y-0.5 active:scale-95 text-center flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Checkout</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>

                  <div className="pt-4 border-t border-gray-800/80 space-y-2.5 text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>160mm precision additive manufacturing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <span>Industrial grade PLA+, PETG & ABS</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Fast fulfillment & dispatched with protective cushioning</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
