import React from 'react';

interface TopBannerProps {
  bannerText: string;
  cartSubtotal: number;
  freeDeliveryThreshold: number;
}

export default function TopBanner({ bannerText, cartSubtotal, freeDeliveryThreshold }: TopBannerProps) {
  const remaining = freeDeliveryThreshold - cartSubtotal;

  return (
    <div className="bg-pink-100 text-pink-800 py-2.5 px-4 text-xs md:text-sm font-medium tracking-wide border-b border-pink-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2 text-center">
        <div className="flex items-center gap-2 overflow-hidden w-full md:w-auto">
          <span className="inline-block animate-pulse text-pink-600 font-bold">✨</span>
          <p className="truncate text-center w-full">{bannerText}</p>
        </div>
        {cartSubtotal > 0 && (
          <div className="flex items-center gap-2 bg-white/80 px-3 py-1 rounded-full border border-pink-300 shadow-xs text-xs font-semibold">
            {remaining > 0 ? (
              <span>
                Add <strong className="text-pink-600">${remaining.toFixed(2)}</strong> more to qualify for <strong className="text-pink-600">FREE DELIVERY!</strong>
              </span>
            ) : (
              <span className="text-green-600 flex items-center gap-1">
                🎉 Congratulations! You qualify for <strong>FREE DELIVERY!</strong>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
