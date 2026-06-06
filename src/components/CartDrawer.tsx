import React, { useState } from 'react';
import { X, ShoppingBag, Plus, Minus, Trash2, Tag, Percent, ArrowRight } from 'lucide-react';
import { OrderItem, Coupon } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: OrderItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  coupons: Coupon[];
  freeDeliveryThreshold: number;
  deliveryFee: number;
  onCheckOut: (discount: number, activeCouponCode: string) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  coupons,
  freeDeliveryThreshold,
  deliveryFee,
  onCheckOut,
}: CartDrawerProps) {
  const [couponCode, setCouponCode] = useState('');
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  if (!isOpen) return null;

  // Calculators
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const remainingForFree = freeDeliveryThreshold - subtotal;
  const delivery = subtotal >= freeDeliveryThreshold ? 0 : deliveryFee;

  // Apply Coupon
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');

    const query = couponCode.toUpperCase().trim();
    if (!query) return;

    const coupon = coupons.find((c) => c.code === query && c.isActive);
    if (!coupon) {
      setCouponError('Invalid coupon code or expired');
      setActiveCoupon(null);
      return;
    }

    // Expiration check
    const exp = new Date(coupon.expirationDate);
    if (new Date() > exp) {
      setCouponError('This coupon code is expired');
      setActiveCoupon(null);
      return;
    }

    // Limit check
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      setCouponError('Coupon has reached its usage limit');
      setActiveCoupon(null);
      return;
    }

    setActiveCoupon(coupon);
    setCouponSuccess(`Promotional code "${coupon.code}" applied successfully!`);
  };

  const couponDiscount = activeCoupon
    ? activeCoupon.type === 'percentage'
      ? (subtotal * activeCoupon.value) / 100
      : activeCoupon.value
    : 0;

  const total = Math.max(0, subtotal + delivery - couponDiscount);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div id="cart-backdrop" onClick={onClose} className="fixed inset-0 bg-gray-950/60 backdrop-blur-xs transition-opacity" />

      {/* Drawer content */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-pink-100 bg-pink-50/50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5.5 w-5.5 text-pink-600" />
            <h2 className="font-serif font-bold text-lg text-gray-900">Your Yummy Cart</h2>
            {cartItems.length > 0 && (
              <span className="bg-pink-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                {cartItems.length} items
              </span>
            )}
          </div>
          <button
            id="btn-cart-close"
            onClick={onClose}
            className="text-gray-500 hover:text-pink-600 p-2 rounded-full"
          >
            <X className="h-5.5 w-5.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Free delivery tracker progress bar (highly responsive, visual indicator) */}
          {cartItems.length > 0 && (
            <div className="bg-pink-50 p-4 rounded-2xl border border-pink-100/50 text-xs">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-700">Delivery Status</span>
                {remainingForFree > 0 ? (
                  <span className="text-pink-600 font-bold">Add ${remainingForFree.toFixed(2)} more for FREE DELIVERY</span>
                ) : (
                  <span className="text-emerald-600 font-bold">🎉 FREE DELIVERY UNLOCKED</span>
                )}
              </div>
              <div className="w-full bg-pink-200/50 rounded-full h-2">
                <div
                  className="bg-pink-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(100, (subtotal / freeDeliveryThreshold) * 100)}%` }}
                />
              </div>
              {remainingForFree > 0 && (
                <p className="text-[10px] text-gray-400 mt-2 text-center uppercase tracking-wide">
                  Avoid paying standard <strong>${deliveryFee} USD</strong> delivery fees!
                </p>
              )}
            </div>
          )}

          {cartItems.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="h-16 w-16 text-pink-200 mx-auto mb-4 animate-bounce" />
              <p className="font-serif text-lg font-semibold text-gray-900">Your cart is empty!</p>
              <p className="text-xs text-gray-400 mt-1 mb-6">Fill it with yummy body oils, bath bombs and makeup.</p>
              <button
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-pink-650 hover:bg-pink-700 text-white font-bold text-xs rounded-xl shadow-xs transition-transform hover:scale-103"
              >
                Start Shop Now <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="divide-y divide-pink-50">
              {cartItems.map((item) => (
                <div key={item.productId} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0 group">
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    className="w-16 h-16 rounded-xl object-cover border border-pink-100 group-hover:border-pink-300 transition-colors"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 truncate tracking-tight">{item.productName}</h3>
                    <span className="text-[10px] text-pink-500 font-extrabold uppercase tracking-wide block mb-1">
                      Cash On Delivery
                    </span>
                    <strong className="text-xs text-gray-650 font-semibold font-mono">${item.price.toFixed(2)}</strong>
                  </div>

                  {/* Quantity Actions */}
                  <div className="flex flex-col items-end gap-2.5">
                    <div className="flex items-center border border-pink-100 rounded-lg overflow-hidden h-7 text-xs">
                      <button
                        onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                        className="px-2 text-gray-400 hover:text-pink-600 hover:bg-pink-50 h-full transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-2 font-bold text-gray-900 font-mono">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                        className="px-2 text-gray-400 hover:text-pink-600 hover:bg-pink-50 h-full transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.productId)}
                      className="text-gray-400 hover:text-pink-600 p-1 rounded-full transition-colors"
                      title="Remove Product"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions and totals */}
        {cartItems.length > 0 && (
          <div className="border-t border-pink-100 p-5 bg-pink-50/20 space-y-4">
            
            {/* Promo coupon code entry box */}
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-pink-400" />
                <input
                  type="text"
                  placeholder="Enter Promotional Code (e.g. YUMMY2026)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="w-full text-xs text-gray-800 border border-pink-200 rounded-xl pl-9 px-3.5 py-2.5 bg-white font-semibold uppercase tracking-wider outline-hidden"
                />
              </div>
              <button
                type="submit"
                className="px-4.5 py-2.5 bg-gray-950 text-white font-bold hover:bg-pink-700 transition-colors rounded-xl text-xs"
              >
                Apply
              </button>
            </form>

            {couponError && <p id="err-coupon" className="text-[10px] text-red-500 font-bold px-1">{couponError}</p>}
            {couponSuccess && <p id="success-coupon" className="text-[10px] text-emerald-600 font-bold px-1">{couponSuccess}</p>}

            {/* Calculations specs */}
            <div className="space-y-1.5 text-xs text-gray-600 pt-2 font-medium">
              <div className="flex justify-between">
                <span>Basket Subtotal</span>
                <span className="font-mono text-gray-800 font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span className="font-mono text-gray-850">
                  {delivery === 0 ? <strong className="text-green-600">FREE</strong> : `$${delivery.toFixed(2)}`}
                </span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-pink-650 bg-pink-100/40 p-1.5 rounded-lg border border-pink-200/50">
                  <span className="flex items-center gap-1 font-bold">
                    <Percent className="h-3 w-3" /> Discount ({activeCoupon?.code})
                  </span>
                  <span className="font-mono font-bold">-${couponDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-serif font-black text-gray-900 border-t border-pink-100/60 pt-2 mt-2">
                <span>Order Total</span>
                <span className="font-mono text-pink-650 leading-none">${total.toFixed(2)} USD</span>
              </div>
            </div>

            {/* Check Out Call To Action */}
            <button
              id="btn-checkout-box"
              onClick={() => onCheckOut(couponDiscount, activeCoupon?.code || '')}
              className="w-full h-12 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-pink-200 text-sm hover:scale-102 active:scale-98"
            >
              <span>Submit Checkout Order</span>
              <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
