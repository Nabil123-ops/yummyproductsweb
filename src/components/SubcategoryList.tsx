import React from 'react';
import { Category } from '../types';

interface SubcategoryListProps {
  categories: Category[];
  selectedCategorySlug: string | null;
  selectedSubcategory: string | null;
  onCategorySelect: (slug: string | null) => void;
  onSubcategorySelect: (sub: string | null) => void;
}

export default function SubcategoryList({
  categories,
  selectedCategorySlug,
  selectedSubcategory,
  onCategorySelect,
  onSubcategorySelect,
}: SubcategoryListProps) {
  
  const activeCategory = categories.find(c => c.slug === selectedCategorySlug);
  const activeSubcategories = activeCategory ? activeCategory.subcategories : [];

  return (
    <div className="bg-pink-50/40 py-8 border-b border-pink-100/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* All Circular categories display (Rows of magnificent cosmetics circle items) */}
        <div className="text-center mb-6">
          <h2 className="text-xs uppercase font-bold tracking-widest text-pink-600 mb-1">
            Browse Luxury Collections
          </h2>
          <p className="font-serif text-2xl font-bold text-gray-900">
            {activeCategory ? activeCategory.name : 'All Luxury Essentials'}
          </p>
        </div>

        {/* Categories circles scroll wrapper */}
        <div id="circle-categories-list" className="flex items-center gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-pink-200 scrollbar-track-transparent">
          {/* Circular badge for All Products */}
          <div
            id="category-circle-all"
            onClick={() => {
              onCategorySelect(null);
              onSubcategorySelect(null);
            }}
            className="flex flex-col items-center cursor-pointer shrink-0 group"
          >
            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center border-3 transition-all ${
              selectedCategorySlug === null
                ? 'border-pink-500 scale-105 shadow-md bg-white'
                : 'border-pink-200 bg-pink-50/50 hover:border-pink-400'
            }`}>
              <span className="text-3xl text-pink-500">🛍️</span>
            </div>
            <span className={`mt-2 text-xs font-semibold text-center group-hover:text-pink-600 transition-colors ${
              selectedCategorySlug === null ? 'text-pink-600 font-bold' : 'text-gray-650'
            }`}>All Products</span>
          </div>

          {/* Actual category items with images */}
          {categories.filter(c => !c.isHidden).map((category) => (
            <div
              key={category.id}
              id={`category-circle-${category.slug}`}
              onClick={() => {
                onCategorySelect(category.slug);
                onSubcategorySelect(null);
              }}
              className="flex flex-col items-center cursor-pointer shrink-0 group"
            >
              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-3 transition-all relative ${
                selectedCategorySlug === category.slug
                  ? 'border-pink-500 scale-105 shadow-md'
                  : 'border-pink-200/80 hover:border-pink-400 hover:scale-103'
              }`}>
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition-colors" />
              </div>
              <span className={`mt-2 text-xs font-semibold text-center group-hover:text-pink-600 transition-all ${
                selectedCategorySlug === category.slug ? 'text-pink-600 font-bold' : 'text-gray-600'
              }`}>{category.name}</span>
            </div>
          ))}
        </div>

        {/* Horizontal Subcategory row selector (Subcategory-First browsing!) */}
        {activeSubcategories.length > 0 && (
          <div id="subcategory-tag-row" className="mt-6 flex flex-wrap items-center justify-center gap-2 pt-4 border-t border-pink-100/40">
            <button
              onClick={() => onSubcategorySelect(null)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                selectedSubcategory === null
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'bg-white hover:bg-pink-50 text-gray-700 border border-pink-100'
              }`}
            >
              Show All Subcategories
            </button>
            {activeSubcategories.map((sub) => (
              <button
                key={sub}
                onClick={() => onSubcategorySelect(sub)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                  selectedSubcategory === sub
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'bg-white hover:bg-pink-50 text-gray-700 border border-pink-100'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
