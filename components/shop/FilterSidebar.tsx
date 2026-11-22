import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Category } from '@/types';
import { fmt } from '@/utils/format';

interface FilterSidebarProps {
  categories: Category[];
  currentCategory: string;
  maxPrice: number;
  maxCatalogPrice?: number;
  onSelectCategory: (category: string) => void;
  onPriceChange: (price: number) => void;
  onClearFilters: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  categories,
  currentCategory,
  maxPrice,
  maxCatalogPrice = 10000,
  onSelectCategory,
  onPriceChange,
  onClearFilters,
}) => {
  const categoryOptions = ['Shop All', ...categories.map((c) => c.name)];

  return (
    <aside className="md:w-56 shrink-0">
      <div className="flex items-center gap-2 font-bold text-sm mb-5">
        <SlidersHorizontal size={16} /> FILTERS
      </div>

      <div className="text-xs font-bold tracking-wider mb-3">CATEGORY</div>
      <div className="flex flex-wrap md:flex-col gap-2 mb-8">
        {categoryOptions.map((c) => (
          <button
            key={c}
            className={`text-left text-xs py-2 px-3 ${
              currentCategory === c
                ? 'bg-[#171717] text-white'
                : 'bg-white hover:bg-[#e7e0d5]'
            }`}
            onClick={() => onSelectCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="text-xs font-bold tracking-wider mb-3">
        MAX PRICE: {fmt(maxPrice)}
      </div>
      <input
        aria-label="Maximum price"
        type="range"
        min="500"
        max={maxCatalogPrice}
        step="500"
        value={maxPrice}
        onChange={(e) => onPriceChange(Number(e.target.value))}
        className="w-full accent-[#9e7b50]"
      />

      <button onClick={onClearFilters} className="text-xs underline mt-4">
        Clear filters
      </button>
    </aside>
  );
};
