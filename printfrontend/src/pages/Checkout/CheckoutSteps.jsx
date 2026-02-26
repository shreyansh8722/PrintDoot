import React from 'react';
import { FaCheck, FaMapMarkerAlt, FaTruck, FaCreditCard, FaClipboardCheck } from 'react-icons/fa';

const STEPS = [
  { key: 'address', label: 'Address', icon: FaMapMarkerAlt },
  { key: 'shipping', label: 'Shipping', icon: FaTruck },
  { key: 'payment', label: 'Payment', icon: FaCreditCard },
  { key: 'review', label: 'Review', icon: FaClipboardCheck },
];

export default function CheckoutSteps({ currentStep }) {
  const currentIdx = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="mb-10">
      {/* Desktop */}
      <div className="hidden sm:flex items-center justify-between relative">
        {/* Connector line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 z-0" />
        <div
          className="absolute top-5 left-0 h-0.5 bg-black z-0 transition-all duration-500"
          style={{ width: `${(currentIdx / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = idx < currentIdx;
          const isActive = idx === currentIdx;
          const isFuture = idx > currentIdx;

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10 flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-black text-white'
                    : isActive
                    ? 'bg-black text-white ring-4 ring-black/10 scale-110'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? <FaCheck className="text-xs" /> : <Icon className="text-sm" />}
              </div>
              <span
                className={`mt-2 text-xs font-semibold transition-colors ${
                  isActive ? 'text-black' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile: compact */}
      <div className="sm:hidden flex items-center gap-2">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIdx;
          const isActive = idx === currentIdx;
          return (
            <div key={step.key} className="flex items-center gap-2 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  isCompleted
                    ? 'bg-black text-white'
                    : isActive
                    ? 'bg-black text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? <FaCheck className="text-[10px]" /> : idx + 1}
              </div>
              {isActive && (
                <span className="text-xs font-semibold text-black truncate">{step.label}</span>
              )}
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 ${idx < currentIdx ? 'bg-black' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Shared Order Summary Sidebar ── */
export function OrderSummarySidebar({ cartItems }) {
  const GST_RATE = 0.18;
  const FREE_SHIPPING_THRESHOLD = 999;
  const FLAT_SHIPPING = 99;

  const subtotal = cartItems.reduce((acc, item) => {
    const price = Number(item.finalPrice || item.basePrice || item.base_price || 0);
    const qty = item.quantity || 1;
    return acc + price * qty;
  }, 0);

  const taxes = +(subtotal * GST_RATE).toFixed(2);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
  const total = +(subtotal + taxes + shipping).toFixed(2);
  const totalItems = cartItems.reduce((a, i) => a + (i.quantity || 1), 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
      <h3 className="text-lg font-bold text-gray-900 mb-5">Order Summary</h3>

      {/* Items list */}
      <div className="space-y-3 pb-4 border-b border-gray-100 mb-4 max-h-60 overflow-y-auto">
        {cartItems.map((item) => {
          const price = Number(item.finalPrice || item.basePrice || item.base_price || 0);
          const qty = item.quantity || 1;
          return (
            <div key={item.cartId} className="flex gap-3 items-center">
              <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                <img
                  src={item.image || item.img || 'https://placehold.co/48x48'}
                  alt={item.title || 'Product'}
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.title || item.name}</p>
                <p className="text-xs text-gray-500">Qty: {qty}</p>
              </div>
              <span className="text-sm font-semibold text-gray-900">₹{(price * qty).toFixed(2)}</span>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Subtotal ({totalItems} items)</span>
          <span className="font-medium">₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Taxes (GST 18%)</span>
          <span className="font-medium">₹{taxes.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Shipping</span>
          {shipping === 0 ? (
            <span className="font-medium text-green-600">FREE</span>
          ) : (
            <span className="font-medium">₹{shipping.toFixed(2)}</span>
          )}
        </div>
      </div>

      <div className="border-t-2 border-gray-100 mt-4 pt-4">
        <div className="flex justify-between items-baseline">
          <span className="font-bold text-gray-900">Total</span>
          <span className="text-xl font-extrabold text-gray-900">₹{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
