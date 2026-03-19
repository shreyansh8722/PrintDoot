import React, { useEffect, useState, useMemo } from 'react';
import { useShop } from '../../context/ShopContext';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash, FaEdit, FaPaintBrush, FaTruck, FaShieldAlt, FaTag, FaSearchPlus, FaTimes } from 'react-icons/fa';
import zakekeService from '../../services/zakekeService';
import userService from '../../services/userService';

/* ───── Constants ───── */
const GST_RATE = 0.18; // 18% GST
const FREE_SHIPPING_THRESHOLD = 999;

/* ═══════════════════════════════════
   CartItem Component
   ═══════════════════════════════════ */
const CartItem = ({ item, onRemove, onUpdateQuantity }) => {
  const [designDetails, setDesignDetails] = useState(null);
  const [loading, setLoading] = useState(!!item.designId);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (item.designId) {
      zakekeService
        .getDesignDetails(item.designId)
        .then((data) => {
          setDesignDetails(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [item.designId]);

  const basePrice = Number(item.finalPrice || item.basePrice || item.base_price || 0);
  const customizationPrice = Number(designDetails?.designUnitPrice || 0);
  const unitPrice = basePrice + customizationPrice;
  const qty = item.quantity || 1;
  const lineTotal = unitPrice * qty;
  const previewUrl = designDetails?.tempPreviewImageUrl;
  const imgSrc = previewUrl || item.image || item.img || 'https://placehold.co/120x120';

  return (
    <>
    <div className="flex gap-4 sm:gap-6 py-6 border-b border-gray-100 last:border-0">
      {/* Image */}
      <div
        className={`w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 ${
          previewUrl ? 'cursor-pointer ring-2 ring-purple-200 hover:ring-purple-400 transition-all' : ''
        }`}
        onClick={() => previewUrl && setShowPreview(true)}
        title={previewUrl ? 'Click to preview your design' : ''}
      >
        {loading ? (
          <div className="w-full h-full animate-pulse bg-gray-200" />
        ) : (
          <img
            src={imgSrc}
            alt={item.title || 'Product'}
            className="w-full h-full object-contain p-2"
          />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-900 text-base sm:text-lg leading-tight line-clamp-2">
              {item.title || item.name || 'Product'}
            </h3>
            {item.designId && (
              <span className="inline-flex items-center gap-1 mt-1 bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full text-xs font-medium">
                <FaPaintBrush className="text-[10px]" /> Custom Design
              </span>
            )}
          </div>
          <button
            onClick={() => onRemove(item.cartId)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
            title="Remove"
          >
            <FaTrash className="text-sm" />
          </button>
        </div>

        {/* Price breakdown */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Base price</span>
            <span className="text-gray-700 font-medium">₹{basePrice.toFixed(2)}</span>
          </div>
          {customizationPrice > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-600">+ Customization</span>
              <span className="text-green-600 font-medium">₹{customizationPrice.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Quantity + line total */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => onUpdateQuantity(item.cartId, Math.max(1, qty - 1))}
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors text-lg font-medium"
            >
              −
            </button>
            <span className="w-10 text-center text-sm font-semibold text-gray-900">{qty}</span>
            <button
              onClick={() => onUpdateQuantity(item.cartId, qty + 1)}
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors text-lg font-medium"
            >
              +
            </button>
          </div>
          <span className="text-lg font-bold text-gray-900">
            ₹{lineTotal.toFixed(2)}
          </span>
        </div>

        {/* Design action buttons */}
        {item.designId && (
          <div className="flex items-center gap-3 mt-2">
            {previewUrl && (
              <button
                onClick={() => setShowPreview(true)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-all"
              >
                <FaSearchPlus className="text-xs" /> Preview Design
              </button>
            )}
            <Link
              to={`/zakeke-editor/${item.slug}?designId=${item.designId}`}
              className="inline-flex items-center gap-1 text-sm text-brand hover:underline"
            >
              <FaEdit className="text-xs" /> Edit Design
            </Link>
          </div>
        )}
      </div>
    </div>

    {/* Full-screen design preview modal */}
    {showPreview && previewUrl && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        onClick={() => setShowPreview(false)}
      >
        <div
          className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setShowPreview(false)}
            className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
          >
            <FaTimes />
          </button>
          <p className="text-sm font-bold text-gray-900 mb-3 pr-8 truncate">
            {item.title || item.name} — Your Design Preview
          </p>
          <img
            src={previewUrl}
            alt="Your custom design"
            className="w-full rounded-xl border border-gray-100"
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-gray-400">
              This is a preview of your customized design
            </p>
            <Link
              to={`/zakeke-editor/${item.slug}?designId=${item.designId}`}
              className="text-xs font-semibold text-brand hover:underline"
            >
              Edit Design →
            </Link>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

/* ═══════════════════════════════════
   Cart Page
   ═══════════════════════════════════ */
const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useShop();
  const navigate = useNavigate();

  /* ── Quantity updater ── */
  const handleUpdateQuantity = (cartId, newQty) => {
    updateQuantity(cartId, newQty);
  };

  /* ── Price calculations ── */
  const pricing = useMemo(() => {
    const subtotal = cartItems.reduce((acc, item) => {
      const base = Number(item.finalPrice || item.basePrice || item.base_price || 0);
      const qty = item.quantity || 1;
      return acc + base * qty;
    }, 0);

    const customizationTotal = 0; // Will be calculated when design details load
    const itemsTotal = subtotal + customizationTotal;
    const taxes = +(itemsTotal * GST_RATE).toFixed(2);
    const isFreeShipping = itemsTotal >= FREE_SHIPPING_THRESHOLD;
    const total = +(itemsTotal + taxes).toFixed(2);
    const totalItems = cartItems.reduce((a, i) => a + (i.quantity || 1), 0);

    return { subtotal, customizationTotal, taxes, isFreeShipping, total, totalItems };
  }, [cartItems]);

  /* ── Empty cart ── */
  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <div className="text-7xl mb-6">🛒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Looks like you haven't added anything yet.</p>
        <Link
          to="/view-all"
          className="bg-black text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Shopping Cart</h1>
            <p className="text-sm text-gray-500 mt-1">
              {pricing.totalItems} item{pricing.totalItems !== 1 ? 's' : ''} in your cart
            </p>
          </div>
          <button
            onClick={clearCart}
            className="text-sm text-red-500 hover:text-red-700 font-medium hover:underline"
          >
            Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Cart Items ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
              {cartItems.map((item) => (
                <CartItem
                  key={item.cartId}
                  item={item}
                  onRemove={removeFromCart}
                  onUpdateQuantity={handleUpdateQuantity}
                />
              ))}
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-6 mt-6 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <FaShieldAlt className="text-green-500" /> Secure Checkout
              </span>
              <span className="flex items-center gap-2">
                <FaTruck className="text-brand" /> Free Shipping over ₹999
              </span>
              <span className="flex items-center gap-2">
                <FaTag className="text-orange-500" /> Best Price Guarantee
              </span>
            </div>
          </div>

          {/* ── Order Summary Sidebar ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h3>

              {/* Pricing breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Subtotal ({pricing.totalItems} item{pricing.totalItems !== 1 ? 's' : ''})
                  </span>
                  <span className="font-medium text-gray-900">₹{pricing.subtotal.toFixed(2)}</span>
                </div>

                {pricing.customizationTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Customization</span>
                    <span className="font-medium text-green-600">₹{pricing.customizationTotal.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxes (GST 18%)</span>
                  <span className="font-medium text-gray-900">₹{pricing.taxes.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  {pricing.isFreeShipping ? (
                    <span className="font-medium text-green-600">FREE</span>
                  ) : (
                    <span className="font-medium text-gray-500 italic">Calculated at checkout</span>
                  )}
                </div>

                {!pricing.isFreeShipping && (
                  <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                    Add ₹{(FREE_SHIPPING_THRESHOLD - pricing.subtotal).toFixed(2)} more for free shipping
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="border-t-2 border-gray-100 my-5" />

              {/* Total */}
              <div className="flex justify-between items-baseline mb-6">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span className="text-2xl font-extrabold text-gray-900">₹{pricing.total.toFixed(2)}</span>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={() => {
                  if (userService.isAuthenticated()) {
                    navigate('/checkout/address');
                  } else {
                    navigate('/login', { state: { from: { pathname: '/checkout/address' } } });
                  }
                }}
                className="w-full bg-black text-white text-base font-bold py-4 rounded-full hover:bg-gray-800 transition-all active:scale-[0.98] shadow-lg"
              >
                {userService.isAuthenticated() ? 'Proceed to Checkout' : 'Sign in to Checkout'}
              </button>

              <Link
                to="/view-all"
                className="block text-center text-sm text-gray-500 hover:text-black mt-4 transition-colors"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
