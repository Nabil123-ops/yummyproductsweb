import React from 'react';
import { Heart, ShoppingCart, Eye, Star } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  key?: any;
  product: Product;
  isWishlisted: boolean;
  onWishlistToggle: () => void;
  onAddToCart: () => void;
  onViewDetails: () => void;
}

export default function ProductCard({
  product,
  isWishlisted,
  onWishlistToggle,
  onAddToCart,
  onViewDetails,
}: ProductCardProps) {
  
  // Calculate discount percentage
  const discountPercent = product.salePrice && product.price
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  const outOfStock = product.stockQuantity <= 0;

  return (
    <div
      id={`product-card-${product.id}`}
      className="group bg-white rounded-2xl border border-pink-100/70 overflow-hidden shadow-[0_4px_20px_-8px_rgba(244,114,182,0.12)] hover:shadow-[0_12px_30px_-6px_rgba(244,114,182,0.18)] hover:border-pink-350 transition-all duration-500 flex flex-col h-full relative"
    >
      {/* Visual Badges (Discount percent/New/Featured) */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 pointer-events-none">
        {discountPercent > 0 && !outOfStock && (
          <span className="bg-gradient-to-r from-rose-500 to-pink-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md">
            SAVE {discountPercent}%
          </span>
        )}
        {product.isNewArrival && !outOfStock && (
          <span className="bg-gradient-to-r from-amber-500 to-pink-500 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md">
            NEW ARRIVAL
          </span>
        )}
        {outOfStock && (
          <span className="bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md">
            OUT OF STOCK
          </span>
        )}
      </div>

      {/* Wishlist toggle buttons */}
      <button
        id={`btn-wishlist-${product.id}`}
        onClick={(e) => {
          e.stopPropagation();
          onWishlistToggle();
        }}
        className="absolute top-3 right-3 z-10 p-2.5 bg-white/95 backdrop-blur-sm text-gray-400 hover:text-pink-600 rounded-full border border-pink-100/50 shadow-md hover:scale-110 active:scale-90 transition-all duration-300 focus:outline-hidden cursor-pointer"
        aria-label="WishlistToggle"
      >
        <Heart className={`h-4.5 w-4.5 transition-colors duration-300 ${
          isWishlisted ? 'fill-pink-500 text-pink-500' : 'text-gray-400 group-hover:text-pink-400'
        }`} />
      </button>

      {/* Image container with hover zooms */}
      <div
        onClick={onViewDetails}
        className="relative pt-[120%] overflow-hidden bg-pink-50/10 cursor-pointer border-b border-pink-50/50"
      >
        <img
          src={product.imageUrl}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700 ease-out"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        {/* Luxury Gold/Pink Ambient Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-pink-850/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center pb-4">
          <span className="bg-slate-900/95 backdrop-blur-xs text-white px-4 py-2 rounded-full text-[10px] uppercase font-black tracking-widest shadow-lg flex items-center gap-1.5 transform translate-y-3 group-hover:translate-y-0 transition-all duration-500">
            <Eye className="h-3.5 w-3.5 text-pink-400 animate-pulse" /> View Collection
          </span>
        </div>
      </div>

      {/* Meta Content */}
      <div className="p-3.5 sm:p-4.5 flex-1 flex flex-col justify-between bg-gradient-to-b from-white to-pink-50/5">
        <div className="cursor-pointer" onClick={onViewDetails}>
          {/* Subcategory tagline */}
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-pink-600 block mb-1">
            {product.subcategory || product.category}
          </span>
          <h3 className="font-serif font-bold text-gray-950 text-base sm:text-lg group-hover:text-pink-700 transition-colors duration-300 line-clamp-1 mb-1 tracking-wide">
            {product.name}
          </h3>
          <p className="text-[11px] sm:text-xs text-gray-500 line-clamp-2 min-h-[34px] sm:min-h-[40px] mb-3 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Brand & rating */}
        <div className="flex items-center justify-between mb-3.5 text-[11px]">
          <span className="text-[9px] font-extrabold tracking-widest uppercase text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
            {product.brand || 'Yummy Products'}
          </span>
          <div className="flex items-center text-amber-500 gap-0.5 bg-amber-50/50 border border-amber-100/30 px-1.5 py-0.5 rounded-full">
            <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
            <span className="text-[10px] font-extrabold">{product.ratingAverage || 5.0}</span>
          </div>
        </div>

        {/* Pricing & Add to Cart button box with absolute responsive safety for mini screens */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-pink-50/80">
          <div className="min-w-[65px]">
            {product.salePrice ? (
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="text-base sm:text-lg font-extrabold text-pink-600 tracking-tight">${product.salePrice}</span>
                <span className="text-[11px] text-gray-400 line-through">${product.price}</span>
              </div>
            ) : (
              <span className="text-base sm:text-lg font-extrabold text-gray-950 block">${product.price}</span>
            )}
            <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider scale-95 origin-left leading-none mt-0.5">COD / WISH</span>
          </div>

          <button
            id={`btn-add-to-cart-${product.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart();
            }}
            disabled={outOfStock}
            className={`px-3.5 py-2 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 focus:outline-hidden shrink-0 cursor-pointer ${
              outOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white hover:scale-103 active:scale-97 shadow-[0_4px_12px_rgba(236,72,153,0.2)]'
            }`}
            aria-label="Add to Cart"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span className="inline">Add</span>
          </button>
        </div>

      </div>
    </div>
  );
}
