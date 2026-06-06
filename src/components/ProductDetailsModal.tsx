import React, { useState } from 'react';
import { X, Star, MessageSquare, ShieldCheck, Heart, ShoppingBag, Plus, Minus, Send, Image } from 'lucide-react';
import { Product, Review } from '../types';

interface ProductDetailsModalProps {
  product: Product;
  reviews: Review[];
  isWishlisted: boolean;
  onWishlistToggle: () => void;
  onAddToCart: (quantity: number) => void;
  onClose: () => void;
  onSubmitReview: (reviewText: string, rating: number, customerName: string) => void;
}

export default function ProductDetailsModal({
  product,
  reviews,
  isWishlisted,
  onWishlistToggle,
  onAddToCart,
  onClose,
  onSubmitReview,
}: ProductDetailsModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [customerName, setCustomerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewSuccess, setShowReviewSuccess] = useState(false);

  const outOfStock = product.stockQuantity <= 0;

  // Filter approved reviews for this product
  const approvedReviews = reviews.filter((r) => r.productId === product.id && r.isApproved);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !reviewText.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmitReview(reviewText, rating, customerName);
      setReviewText('');
      setCustomerName('');
      setRating(5);
      setIsSubmitting(false);
      setShowReviewSuccess(true);
      setTimeout(() => setShowReviewSuccess(false), 5000);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div id="modal-backdrop" onClick={onClose} className="fixed inset-0 bg-gray-950/60 backdrop-blur-xs transition-opacity" />

      {/* Modal Container */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full mx-auto overflow-hidden border border-pink-100 flex flex-col max-h-[90vh] animate-scale-in">
        {/* Header Close button */}
        <button
          id="btn-details-close"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/90 text-gray-400 hover:text-pink-600 rounded-full border border-pink-50 hover:bg-pink-50 transition-colors"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Product Image Panel */}
            <div className="bg-pink-50/20 p-6 flex flex-col justify-center items-center border-r border-pink-100/50 min-h-[350px] md:min-h-[450px]">
              <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden shadow-xs border border-pink-100 bg-white">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Product Meta Specifications Panel */}
            <div className="p-6 md:p-8 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold tracking-widest text-pink-600 block uppercase mb-1">
                  {product.category} • {product.subcategory}
                </span>
                <h1 className="font-serif font-bold text-2xl text-gray-900 tracking-tight leading-tight mb-2">
                  {product.name}
                </h1>

                {/* Rating display */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center text-amber-500 gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4.5 w-4.5 ${
                          star <= (product.ratingAverage || 5) ? 'fill-amber-500 text-amber-500' : 'text-gray-200'
                        }`}
                      />
                    ))}
                    <span className="ml-1 text-sm font-extrabold text-gray-800">
                      {product.ratingAverage ? product.ratingAverage.toFixed(1) : '5.0'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 font-semibold">•</span>
                  <span className="text-xs font-bold text-gray-550 underline cursor-pointer">
                    {approvedReviews.length} Verified Reviews
                  </span>
                </div>

                {/* Price block */}
                <div className="mb-5 bg-pink-50/30 border border-pink-100/30 p-4 rounded-xl">
                  {product.salePrice ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-pink-600">${product.salePrice}</span>
                      <span className="text-sm text-gray-450 line-through">${product.price}</span>
                      <span className="text-xs font-bold text-green-600 ml-1">
                        SAVE ${(product.price - product.salePrice).toFixed(2)} USD
                      </span>
                    </div>
                  ) : (
                    <span className="text-3xl font-black text-gray-950">${product.price}</span>
                  )}
                  <span className="text-[10px] text-gray-500 block uppercase font-medium mt-1 tracking-wide">
                    📦 Cash On Delivery / Wish Money inside Lebanon
                  </span>
                </div>

                {/* Specifications List */}
                <div className="grid grid-cols-2 gap-3 text-xs mb-6">
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <span className="text-gray-400 block mb-0.5">SKU No.</span>
                    <strong className="text-gray-800 font-semibold">{product.sku}</strong>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <span className="text-gray-400 block mb-0.5">Weight</span>
                    <strong className="text-gray-800 font-semibold">{product.weight || 'N/A'}</strong>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <span className="text-gray-400 block mb-0.5">Availability</span>
                    <strong className={`font-semibold ${outOfStock ? 'text-red-600' : 'text-green-600'}`}>
                      {outOfStock ? 'Out of stock' : `${product.stockQuantity} items in stock`}
                    </strong>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <span className="text-gray-400 block mb-0.5">Brand</span>
                    <strong className="text-gray-800 font-semibold">{product.brand || 'Yummy Products'}</strong>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-xs uppercase font-extrabold text-pink-600 tracking-widest mb-2">
                    Product Description
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line mb-6 border-b border-pink-50 pb-5">
                    {product.description}
                  </p>
                </div>
              </div>

              {/* Add to Cart Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex items-center border border-pink-200 rounded-xl bg-white overflow-hidden w-full sm:w-auto justify-between h-12">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="px-4 text-gray-500 hover:text-pink-650 hover:bg-pink-50 h-full transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 text-sm font-bold text-gray-900 font-mono">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    disabled={quantity >= product.stockQuantity}
                    className="px-4 text-gray-500 hover:text-pink-650 hover:bg-pink-50 h-full transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full">
                  <button
                    onClick={() => onAddToCart(quantity)}
                    disabled={outOfStock}
                    className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-bold transition-all shadow-sm ${
                      outOfStock
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-pink-600 hover:bg-pink-700 text-white shadow-pink-200 hover:scale-101 active:scale-99'
                    }`}
                  >
                    <ShoppingBag className="h-4.5 w-4.5" />
                    <span>Add to Cart</span>
                  </button>

                  <button
                    onClick={onWishlistToggle}
                    className="p-3 bg-pink-50 hover:bg-pink-100 text-pink-650 rounded-xl transition-all h-12 border border-pink-100"
                    aria-label="WishlistToggle"
                  >
                    <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-pink-500 text-pink-500' : ''}`} />
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* Customer Reviews Section */}
          <div className="border-t border-pink-100 mt-8 p-6 md:p-8 bg-pink-50/15">
            <h2 className="font-serif font-bold text-lg text-gray-900 mb-6 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-pink-600" /> Customer Reviews & Appraisals
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              
              {/* Write a Review widget */}
              <div className="md:col-span-2">
                <div className="bg-white p-5 border border-pink-100 rounded-2xl shadow-xs">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
                    Leave Your Appraisal
                  </h3>
                  
                  {showReviewSuccess ? (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-xl text-xs flex flex-col items-center text-center animate-fade-in">
                      <ShieldCheck className="h-8 w-8 text-emerald-500 mb-2" />
                      <strong className="font-semibold text-emerald-900 block mb-1">Review Submitted!</strong>
                      Your feedback has been received and is waiting for moderator approval.
                    </div>
                  ) : (
                    <form onSubmit={handleReviewSubmit} className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                          Appraisal Score
                        </label>
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className="text-amber-400 hover:scale-110 active:scale-95 transition-transform"
                            >
                              <Star className={`h-6.5 w-6.5 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Maya Dahdouh"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full text-xs border border-pink-100 rounded-xl px-3.5 py-2.5 outline-hidden focus:border-pink-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                          Appraisal description
                        </label>
                        <textarea
                          required
                          rows={3}
                          placeholder="What did you love about our Yumminess?"
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          className="w-full text-xs border border-pink-100 rounded-xl px-3.5 py-2.5 outline-hidden focus:border-pink-500 resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>{isSubmitting ? 'Submitting...' : 'Submit Appraisal'}</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Review list */}
              <div className="md:col-span-3 space-y-4">
                {approvedReviews.length > 0 ? (
                  approvedReviews.map((rev) => (
                    <div key={rev.id} className="bg-white p-4 border border-pink-100/50 rounded-2xl relative">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <strong className="text-sm text-gray-900 block font-semibold">{rev.customerName}</strong>
                          <span className="text-[10px] text-gray-400 block font-medium">
                            {new Date(rev.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex text-amber-500">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${star <= rev.rating ? 'fill-amber-500 text-amber-500' : 'text-gray-200'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-650 leading-relaxed whitespace-pre-line bg-pink-50/10 p-2.5 rounded-lg italic">
                        &ldquo;{rev.text}&rdquo;
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 bg-white border border-pink-100/40 rounded-2xl">
                    <p className="text-xs text-gray-500 font-medium">Be the first to leave an appraisal!</p>
                    <p className="text-[10px] text-gray-405 mt-1">Appraisal submission takes under 1 second</p>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
