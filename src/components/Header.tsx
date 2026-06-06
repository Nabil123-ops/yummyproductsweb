import React, { useState } from 'react';
import { Search, ShoppingBag, Heart, User, Sparkles, Menu, X, ArrowRight, Star, MoreVertical, Clock } from 'lucide-react';
import { Category, Product } from '../types';

interface HeaderProps {
  categories: Category[];
  cartCount: number;
  wishlistCount: number;
  onCartClick: () => void;
  onWishlistClick: () => void;
  onAdminClick: () => void;
  onCategorySelect: (slug: string | null) => void;
  selectedCategorySlug: string | null;
  products: Product[];
  onProductClick: (product: Product) => void;
}

export default function Header({
  categories,
  cartCount,
  wishlistCount,
  onCartClick,
  onWishlistClick,
  onAdminClick,
  onCategorySelect,
  selectedCategorySlug,
  products,
  onProductClick,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('yummy_search_history');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  // AJAX live predictive search
  const filteredProducts = searchQuery.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.subcategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
      ).filter(p => !p.isArchived).slice(0, 5)
    : [];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-pink-100 shadow-[0_2px_15px_-4px_rgba(244,114,182,0.08)]">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Hamburger Mobile Menu Toggle */}
            <div className="flex md:hidden">
              <button
                id="btn-mobile-menu-open"
                onClick={() => setIsMobileMenuOpen(true)}
                className="text-gray-950 hover:text-pink-600 p-1.5 sm:p-2.5 bg-pink-50 hover:bg-pink-100 transition-all rounded-xl focus:outline-hidden flex items-center gap-1 border border-pink-100/60 shadow-2xs cursor-pointer text-xs"
                aria-label="Menu / القائمة"
              >
                <MoreVertical className="h-5.5 w-5.5 sm:h-6.5 sm:w-6.5 text-pink-600 stroke-[2.5]" />
                <span className="text-[10px] sm:text-xs font-black uppercase text-pink-700 tracking-wider hidden xs:inline">Menu</span>
              </button>
            </div>

            {/* Circular Stamp Logo Component */}
            <div className="flex items-center cursor-pointer" onClick={() => onCategorySelect(null)}>
              <div className="relative w-11 h-11 xs:w-13 xs:h-13 sm:w-15 sm:h-15 mr-1.5 xs:mr-3 select-none flex items-center justify-center bg-white rounded-full p-0.5">
                <img 
                  src="https://www.image2url.com/r2/default/images/1780745942465-101ab094-b828-4763-b5f7-b05c5bf092b1.webp" 
                  alt="YummyProducts Logo" 
                  className="w-full h-full rounded-full object-cover border border-pink-200 shadow-md hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="hidden sm:block">
                <span className="font-serif text-xl sm:text-2xl font-black tracking-widest text-pink-700 block leading-tight">
                  YUMMY<span className="text-gray-900">Products</span>
                </span>
                <span className="text-[9px] sm:text-[11px] uppercase font-semibold text-pink-550 tracking-widest block leading-none">
                  Luxury Care Lebanon / فخامة الطبيعة 🌸
                </span>
              </div>
            </div>

            {/* Deskop Navigation - Premium Subcategory & Category selectors */}
            <nav className="hidden md:flex space-x-1.5 lg:space-x-5">
              <button
                id="nav-all-products"
                onClick={() => onCategorySelect(null)}
                className={`px-3.5 py-2.5 text-[15px] lg:text-[17px] font-black transition-all rounded-lg tracking-wide uppercase ${
                  selectedCategorySlug === null
                    ? 'text-pink-700 bg-pink-50 ring-2 ring-pink-100'
                    : 'text-gray-750 hover:text-pink-650 hover:bg-pink-50/30'
                }`}
              >
                All Products
              </button>
              {categories.slice(0, 5).map((category) => (
                <button
                  key={category.id}
                  id={`nav-${category.slug}`}
                  onClick={() => onCategorySelect(category.slug)}
                  className={`px-3.5 py-2.5 text-[15px] lg:text-[17px] font-black transition-all rounded-lg tracking-wide uppercase ${
                    selectedCategorySlug === category.slug
                      ? 'text-pink-700 bg-pink-50 ring-2 ring-pink-100'
                      : 'text-gray-750 hover:text-pink-650 hover:bg-pink-50/30'
                  }`}
                >
                  {category.name}
                </button>
              ))}
              {categories.length > 5 && (
                <div className="relative group flex items-center">
                  <button className="px-3.5 py-2.5 text-[15px] lg:text-[17px] font-black text-gray-755 hover:text-pink-600 flex items-center gap-1.5 transition-all rounded-lg">
                    More <span className="text-xs text-pink-500">✦</span>
                  </button>
                  <div className="absolute top-full left-0 hidden group-hover:block bg-white border border-pink-100 rounded-xl shadow-2xl py-2.5 w-56 mt-0 z-50 animate-fade-in">
                    {categories.slice(5).map((category) => (
                      <button
                        key={category.id}
                        onClick={() => onCategorySelect(category.slug)}
                        className={`w-full text-left px-5 py-3 text-sm font-bold hover:bg-pink-50 hover:text-pink-600 transition-colors uppercase ${
                          selectedCategorySlug === category.slug ? 'text-pink-600 font-extrabold bg-pink-50/50' : 'text-gray-700'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </nav>

            {/* Icons rail */}
            <div className="flex items-center space-x-0.5 xs:space-x-1 sm:space-x-3">
              <button
                id="btn-search-trigger"
                onClick={() => setIsSearchOpen(true)}
                className="p-1.5 xs:p-2.5 text-gray-650 hover:text-pink-600 transition-all hover:bg-pink-50 rounded-full focus:outline-hidden cursor-pointer"
                aria-label="Search"
              >
                <Search className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
              </button>

              <button
                id="btn-wishlist-trigger"
                onClick={onWishlistClick}
                className="relative p-1.5 xs:p-2.5 text-gray-655 hover:text-pink-600 transition-all hover:bg-pink-50 rounded-full focus:outline-hidden cursor-pointer"
                aria-label="Wishlist"
              >
                <Heart className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-[15px] h-[15px] px-1 text-[8px] sm:text-[10px] font-bold leading-none text-white bg-pink-500 rounded-full border border-white">
                    {wishlistCount}
                  </span>
                )}
              </button>

              <button
                id="btn-cart-trigger"
                onClick={onCartClick}
                className="relative p-1.5 xs:p-2.5 text-gray-655 hover:text-pink-600 transition-all hover:bg-pink-55 rounded-full focus:outline-hidden cursor-pointer"
                aria-label="Cart"
              >
                <ShoppingBag className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-[15px] h-[15px] px-1 text-[8px] sm:text-[10px] font-bold leading-none text-white bg-pink-600 rounded-full border border-white">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Advanced Drawer Hamburger menu for Mobile & Category browsing */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            id="mobile-menu-backdrop"
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          <div className="relative flex flex-col w-full max-w-xs bg-white h-full shadow-2xl overflow-y-auto animate-slide-in-left">
            <div className="flex items-center justify-between p-5 border-b border-pink-100 bg-pink-50/50">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌸</span>
                <span className="font-serif text-lg font-bold text-pink-700">Explore Yummy</span>
              </div>
              <button
                id="btn-mobile-menu-close"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-500 hover:text-pink-600 p-2.5 rounded-full"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="px-4 py-5 flex-1">
              <h3 className="text-sm font-black text-pink-600 uppercase tracking-widest px-3 mb-4.5 font-sans">
                All Shopping Categories / الأصناف 🌸
              </h3>
              <div className="space-y-1.5 animate-fade-in">
                <button
                  onClick={() => {
                    onCategorySelect(null);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-base font-extrabold transition-colors ${
                    selectedCategorySlug === null
                      ? 'bg-pink-50 text-pink-700 font-black ring-1 ring-pink-100'
                      : 'text-gray-750 hover:bg-pink-55/40'
                  }`}
                >
                  <span className="flex items-center gap-2.5">🛍️ All Products</span>
                  <ArrowRight className="h-5 w-5 text-pink-500" />
                </button>

                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      onCategorySelect(category.slug);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-base font-extrabold transition-colors ${
                      selectedCategorySlug === category.slug
                        ? 'bg-pink-50 text-pink-700 font-black ring-1 ring-pink-100'
                        : 'text-gray-750 hover:bg-pink-50/50'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <img src={category.image} className="w-7 h-7 rounded-full object-cover border border-pink-300 shadow-xs" alt="" referrerPolicy="no-referrer" />
                      {category.name}
                    </span>
                    <ArrowRight className="h-5 w-5 text-pink-500" />
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 border-t border-pink-100 bg-pink-50/30 text-center">
              <p className="text-xs text-gray-500">Need immediate help? WhatsApp us 24/7</p>
              <a
                href="https://wa.me/96176477025"
                target="_blank"
                rel="noreferrer"
                className="mt-2.5 inline-flex items-center gap-1.5 justify-center w-full px-4 py-2 text-xs font-bold text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors shadow-sm"
              >
                <span>💬 Start WhatsApp Chat</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Predictive Search Modal */}
      {isSearchOpen && (
        <div id="search-modal" className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
          <div
            id="search-backdrop"
            onClick={() => {
              setIsSearchOpen(false);
              setSearchQuery('');
            }}
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs transition-opacity"
          />

          <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-pink-100 animate-slide-in-top">
            <div className="flex items-center p-4 border-b border-pink-100 bg-pink-50/20">
              <Search className="h-6 w-6 text-pink-500 mr-3 shrink-0" />
              <input
                id="search-input"
                type="text"
                placeholder="Search premium body cream, makhmaria, lipstick..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim() !== '') {
                    const term = searchQuery.trim();
                    setSearchHistory((prev) => {
                      const filtered = prev.filter((item) => item.toLowerCase() !== term.toLowerCase());
                      const updated = [term, ...filtered].slice(0, 6);
                      localStorage.setItem('yummy_search_history', JSON.stringify(updated));
                      return updated;
                    });
                  }
                }}
                className="w-full text-base outline-hidden text-gray-800 placeholder-gray-400"
                autoFocus
              />
              <button
                id="btn-search-close"
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className="text-gray-500 hover:text-pink-600 p-1 rounded-full ml-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Results display */}
            <div className="max-h-96 overflow-y-auto p-4">
              {searchQuery.trim() === '' ? (
                <div className="space-y-4 py-2 text-left">
                  {searchHistory.length > 0 && (
                    <div className="px-1">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Recent Searches</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSearchHistory([]);
                            localStorage.setItem('yummy_search_history', JSON.stringify([]));
                          }}
                          className="text-[10px] font-bold text-pink-600 hover:text-pink-850 transition-colors uppercase cursor-pointer"
                        >
                          Clear History
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {searchHistory.map((historyItem, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSearchQuery(historyItem);
                            }}
                            className="text-xs font-semibold px-3 py-1.5 bg-pink-50/40 hover:bg-pink-100 text-slate-800 hover:text-pink-700 rounded-xl border border-pink-100/50 transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Clock className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                            <span>{historyItem}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="text-center py-6 border-t border-pink-50/40 pt-6">
                    <Sparkles className="h-7 w-7 text-pink-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-500 font-serif">Search YummyProducts luxury listings</p>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Sub-second dynamic results updated in real time</p>
                  </div>
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-pink-600 uppercase tracking-widest mb-1 px-1">
                    Matching Products ({filteredProducts.length})
                  </h4>
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => {
                        // Save to history on click
                        const term = searchQuery.trim();
                        if (term) {
                          setSearchHistory((prev) => {
                            const filtered = prev.filter((item) => item.toLowerCase() !== term.toLowerCase());
                            const updated = [term, ...filtered].slice(0, 6);
                            localStorage.setItem('yummy_search_history', JSON.stringify(updated));
                            return updated;
                          });
                        }
                        onProductClick(product);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="flex items-center p-2 rounded-xl hover:bg-pink-50/50 border border-transparent hover:border-pink-100 transition-all cursor-pointer"
                    >
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover border border-pink-200"
                        referrerPolicy="no-referrer"
                      />
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                        <p className="text-xs text-gray-500 truncate">{product.category} • {product.subcategory}</p>
                      </div>
                      <div className="text-right ml-4">
                        {product.salePrice ? (
                          <>
                            <p className="text-sm font-bold text-pink-600">${product.salePrice}</p>
                            <p className="text-xs text-gray-400 line-through">${product.price}</p>
                          </>
                        ) : (
                          <p className="text-sm font-bold text-gray-900">${product.price}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No products found matching &ldquo;{searchQuery}&rdquo;</p>
                  <p className="text-xs text-gray-400 mt-1">Try searching for other skincare, lips or intimate items</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
