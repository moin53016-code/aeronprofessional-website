import React from 'react';
import { Product, Category } from '@/types';
import { FilterSidebar } from './FilterSidebar';
import { ProductCard } from '@/components/common/ProductCard';

interface ShopViewProps {
  view: string;
  categories: Category[];
  products: Product[];
  search: string;
  sort: string;
  maxPrice: number;
  onSelectCategory: (category: string) => void;
  onPriceChange: (price: number) => void;
  onSearchChange: (search: string) => void;
  onSortChange: (sort: string) => void;
  onClearFilters: () => void;
  onSelectProduct: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

/**
 * Main catalog / shop collection view with sidebar filtering, sorting, and direct BUY NOW actions
 */
export const ShopView: React.FC<ShopViewProps> = ({
  view,
  categories,
  products,
  search,
  sort,
  maxPrice,
  onSelectCategory,
  onPriceChange,
  onSearchChange,
  onSortChange,
  onClearFilters,
  onSelectProduct,
  onBuyNow,
}) => {
  const collectionTitle = view === 'Shop All' ? 'The Complete Collection' : view;

  return (
    <main className="max-w-7xl mx-auto px-5 lg:px-8 py-14 min-h-[70vh]">
      <p className="tag">AERON PROFESSIONAL / COLLECTION</p>
      <h1 className="serif text-4xl md:text-6xl mt-3 mb-4">{collectionTitle}</h1>
      <p className="text-sm text-gray-500 mb-10">
        Explore our curated selection of professional-inspired styling essentials.
      </p>

      <div className="flex flex-col md:flex-row gap-7">
        {/* Sidebar */}
        <FilterSidebar
          categories={categories}
          currentCategory={view}
          maxPrice={maxPrice}
          onSelectCategory={onSelectCategory}
          onPriceChange={onPriceChange}
          onClearFilters={onClearFilters}
        />

        {/* Product Grid & Controls */}
        <div className="flex-1">
          <div className="flex flex-wrap justify-between gap-3 items-center mb-5">
            <span className="text-xs text-gray-500">{products.length} products</span>
            <div className="flex gap-2">
              <input
                className="field max-w-[180px] text-xs"
                placeholder="Search products"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              <select
                aria-label="Sort products"
                className="field text-xs"
                value={sort}
                onChange={(e) => onSortChange(e.target.value)}
              >
                <option value="featured">Featured</option>
                <option value="low">Price: Low to High</option>
                <option value="high">Price: High to Low</option>
                <option value="rating">Rating</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={onSelectProduct}
                onBuyNow={onBuyNow}
              />
            ))}
          </div>

          {products.length === 0 && (
            <p className="py-20 text-center text-gray-500">
              No products match your filters.
            </p>
          )}
        </div>
      </div>
    </main>
  );
};