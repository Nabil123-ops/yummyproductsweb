import React, { useState } from 'react';
import { X, Send, CreditCard, ShieldCheck } from 'lucide-react';
import { OrderItem } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  couponDiscount: number;
  activeCouponCode: string;
  onSubmitOrder: (orderDetails: {
    customerName: string;
    phone: string;
    address: string;
    city: string;
    notes: string;
    paymentMethod: 'COD' | 'WishMoney';
  }) => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  subtotal,
  deliveryFee,
  couponDiscount,
  activeCouponCode,
  onSubmitOrder,
}: CheckoutModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'WishMoney'>('COD');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const total = Math.max(0, subtotal + deliveryFee - couponDiscount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || !address || !city) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmitOrder({
        customerName,
        phone,
        address,
        city,
        notes,
        paymentMethod,
      });
      setIsSubmitting(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div id="checkout-backdrop" onClick={onClose} className="fixed inset-0 bg-gray-950/60 backdrop-blur-xs transition-opacity" />

      {/* Modal Container */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full mx-auto overflow-hidden border border-pink-100 flex flex-col animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-pink-100 bg-pink-50/40">
          <div className="flex items-center gap-1.5">
            <span className="text-xl">💳</span>
            <h2 className="font-serif font-bold text-lg text-gray-900">Secure COD Checkout</h2>
          </div>
          <button
            id="btn-checkout-close"
            onClick={onClose}
            className="text-gray-400 hover:text-pink-650 p-2 rounded-full"
          >
            <X className="h-5.5 w-5.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
          {/* Progress Alert */}
          <div className="bg-pink-100/50 p-3 rounded-xl border border-pink-200/50 text-[11px] text-pink-800 font-semibold leading-relaxed">
            🚀 🛍️ After submitting the order, you will be redirected to WhatsApp to confirm delivery details with us. All orders are sent via Cash on Delivery or Wish Money inside Lebanon.
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-450 mb-1">
                Full Name <span className="text-pink-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Maya Dahdouh"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full text-xs border border-pink-150 rounded-xl px-3.5 py-3 outline-hidden focus:border-pink-500 focus:bg-pink-50/20"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-450 mb-1">
                Lebanese Phone Number <span className="text-pink-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">+961</span>
                <input
                  type="tel"
                  required
                  placeholder="76 477 025"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs border border-pink-150 rounded-xl pl-13 px-3.5 py-3 outline-hidden focus:border-pink-500 focus:bg-pink-50/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-450 mb-1">
                  City / Town <span className="text-pink-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Beirut / Tripoli"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-xs border border-pink-150 rounded-xl px-3.5 py-3 outline-hidden focus:border-pink-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-450 mb-1">
                  Full Address <span className="text-pink-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Street, Building, Floor"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs border border-pink-150 rounded-xl px-3.5 py-3 outline-hidden focus:border-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-450 mb-1">
                Order Placement Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Do you prefer delivery in the afternoon? Leave a note here."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs border border-pink-150 rounded-xl px-3.5 py-3 outline-hidden focus:border-pink-500 resize-none"
              />
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-450 mb-2">
                Preferred Payment Method <span className="text-pink-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-pink-500 bg-pink-100/30 text-pink-700 font-bold shadow-xs'
                      : 'border-pink-100 text-gray-500 bg-white hover:bg-gray-50'
                  }`}
                >
                  <span className="text-sm">💵</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider mt-1">Cash On Delivery</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('WishMoney')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    paymentMethod === 'WishMoney'
                      ? 'border-pink-500 bg-pink-100/30 text-pink-700 font-bold shadow-xs'
                      : 'border-pink-100 text-gray-500 bg-white hover:bg-gray-50'
                  }`}
                >
                  <span className="text-sm">💳</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider mt-1">Wish Money Transfer</span>
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Totals Recap */}
          <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl space-y-1.5 text-xs text-gray-600 font-medium">
            <div className="flex justify-between">
              <span>Items Total</span>
              <strong className="font-mono text-gray-800 font-semibold">${subtotal.toFixed(2)} USD</strong>
            </div>
            <div className="flex justify-between">
              <span>Delivery Charges</span>
              <strong className="font-mono text-gray-800 font-semibold">
                {deliveryFee === 0 ? <span className="text-green-600 font-bold">FREE</span> : `$${deliveryFee.toFixed(2)}`}
              </strong>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-pink-650 bg-pink-100/30 p-1.5 rounded-lg border border-pink-200/50">
                <span>Active Coupon Discount ({activeCouponCode})</span>
                <strong className="font-mono">-${couponDiscount.toFixed(2)}</strong>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-pink-100/40 pt-2 mt-2">
              <span>Final Payable Amount</span>
              <strong className="font-mono text-pink-650 text-base">${total.toFixed(2)} USD</strong>
            </div>
          </div>

          {/* Checkout submit button redirection */}
          <button
            type="submit"
            id="btn-checkout-submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 h-12 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-md hover:scale-101 active:scale-99 transition-all cursor-pointer"
          >
            <Send className="h-4 w-4" />
            <span>{isSubmitting ? 'Processing Order...' : 'Submit & Connect via WhatsApp'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
