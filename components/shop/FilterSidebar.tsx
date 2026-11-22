
'use client';

import React, { useState } from 'react';
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

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

export const FilterSidebar: React.FC<
  FilterSidebarProps
> = ({
  categories,
  currentCategory,
  maxPrice,
  maxCatalogPrice = 10000,
  onSelectCategory,
  onPriceChange,
  onClearFilters,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const categoryOptions = [
    'Shop All',
    ...categories.map((category) => category.name),
  ];

  const sliderMax = Math.max(
    500,
    Math.ceil(maxCatalogPrice / 100) * 100
  );

  const sliderValue = Math.min(
    sliderMax,
    Math.max(0, maxPrice)
  );

  const handleCategory = (category: string) => {
    onSelectCategory(category);
    setMobileOpen(false);
  };

  return (
    <aside className="w-full min-w-0 lg:w-[240px]">
      {/* MOBILE FILTER BUTTON */}

      <button
        type="button"
        onClick={() => setMobileOpen((prev) => !prev)}
        aria-expanded={mobileOpen}
        aria-controls="aeron-shop-filters"
        className="
          flex
          min-h-12
          w-full
          items-center
          justify-between
          gap-3
          border
          border-[#ded9d0]
          bg-white
          px-4
          py-3
          text-sm
          font-bold
          lg:hidden
        "
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal size={18} />
          FILTER PRODUCTS
        </span>

        {mobileOpen ? (
          <ChevronUp size={18} />
        ) : (
          <ChevronDown size={18} />
        )}
      </button>

      {/* FILTER CONTENT */}

      <div
        id="aeron-shop-filters"
        className={`
          min-w-0
          border
          border-[#e5e1d9]
          bg-[#faf9f6]
          p-4
          lg:block
          lg:border-0
          lg:bg-transparent
          lg:p-0
          ${mobileOpen ? 'block' : 'hidden'}
        `}
      >
        {/* DESKTOP HEADING */}

        <div
          className="
            mb-6
            hidden
            items-center
            gap-2
            text-sm
            font-bold
            lg:flex
          "
        >
          <SlidersHorizontal size={17} />
          FILTERS
        </div>

        {/* CATEGORY */}

        <h3
          className="
            mb-3
            text-xs
            font-bold
            tracking-wider
          "
        >
          CATEGORY
        </h3>

        <div
          className="
            mb-7
            flex
            min-w-0
            flex-wrap
            gap-2
            lg:flex-col
          "
        >
          {categoryOptions.map((category) => {
            const active =
              currentCategory === category;

            return (
              <button
                key={category}
                type="button"
                onClick={() =>
                  handleCategory(category)
                }
                aria-pressed={active}
                className={`
                  min-h-10
                  max-w-full
                  break-words
                  rounded-sm
                  px-3
                  py-2
                  text-left
                  text-xs
                  font-medium
                  transition-colors
                  ${
                    active
                      ? 'bg-[#171717] text-white'
                      : 'bg-white text-[#292929] hover:bg-[#e7e0d5]'
                  }
                `}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* PRICE RANGE */}

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="aeron-max-price"
            className="
              text-xs
              font-bold
              tracking-wider
            "
          >
            MAXIMUM PRICE
          </label>

          <span className="text-sm font-semibold">
            {fmt(sliderValue)}
          </span>
        </div>

        <input
          id="aeron-max-price"
          aria-label="Maximum price"
          type="range"
          min={0}
          max={sliderMax}
          step={100}
          value={sliderValue}
          onChange={(event) =>
            onPriceChange(
              Number(event.target.value)
            )
          }
          className="
            h-2
            w-full
            cursor-pointer
            accent-[#9e7b50]
          "
        />

        <div
          className="
            mt-2
            flex
            justify-between
            text-xs
            text-gray-500
          "
        >
          <span>{fmt(0)}</span>
          <span>{fmt(sliderMax)}</span>
        </div>

        {/* CLEAR FILTERS */}

        <button
          type="button"
          onClick={() => {
            onClearFilters();
            setMobileOpen(false);
          }}
          className="
            mt-6
            inline-flex
            min-h-10
            items-center
            text-xs
            font-semibold
            underline
            underline-offset-4
            transition-colors
            hover:text-[#987345]
          "
        >
          Clear all filters
        </button>
      </div>
    </aside>
  );
};

export default FilterSidebar;
