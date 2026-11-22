
import React from 'react';

import {
  Product,
  Category,
  SortOption,
} from '@/types';

import { FilterSidebar } from './FilterSidebar';

import { ProductCard } from '@/components/common/ProductCard';

interface ShopViewProps {
  view: string;
  categories: Category[];
  products: Product[];
  search: string;
  sort: SortOption;
  maxPrice: number;
  maxCatalogPrice?: number;
  onSelectCategory: (category: string) => void;
  onPriceChange: (price: number) => void;
  onSearchChange: (search: string) => void;
  onSortChange: (sort: SortOption) => void;
  onClearFilters: () => void;
  onSelectProduct: (product: Product) => void;
  onWhereToBuy: (product: Product) => void;
}

/**
 * Fully responsive Shop / Product Catalog.
 *
 * - Flexible sidebar
 * - Responsive search and sorting
 * - 2-column mobile product grid
 * - 3-column desktop product grid
 * - Existing filters preserved
 */

export const ShopView: React.FC<ShopViewProps> = ({
  view,
  categories,
  products,
  search,
  sort,
  maxPrice,
  maxCatalogPrice = 10000,
  onSelectCategory,
  onPriceChange,
  onSearchChange,
  onSortChange,
  onClearFilters,
  onSelectProduct,
  onWhereToBuy,
}) => {
  const collectionTitle =
    view === 'Shop All'
      ? 'The Complete Collection'
      : view;

  return (
    <main
      className="
        mx-auto
        min-h-[70vh]
        w-full
        max-w-7xl
        min-w-0
        px-4
        py-10
        sm:px-6
        sm:py-12
        lg:px-8
        lg:py-14
      "
    >
      {/* PAGE HEADER */}

      <div className="mb-8 sm:mb-10">
        <p className="tag">
          AERON PROFESSIONAL / COLLECTION
        </p>

        <h1
          className="
            serif
            mb-4
            mt-3
            break-words
            text-[clamp(1.9rem,5vw,3.75rem)]
            leading-tight
          "
        >
          {collectionTitle}
        </h1>

        <p
          className="
            max-w-2xl
            text-sm
            leading-7
            text-gray-500
            sm:text-base
          "
        >
          Explore our curated selection of
          professional-inspired styling essentials.
        </p>
      </div>

      {/* FILTER SIDEBAR + PRODUCT CONTENT */}

      <div
        className="
          flex
          min-w-0
          flex-col
          gap-7
          lg:flex-row
          lg:items-start
          lg:gap-8
        "
      >
        {/* FILTERS */}

        <div
          className="
            w-full
            min-w-0
            lg:w-[240px]
            lg:shrink-0
          "
        >
          <FilterSidebar
            categories={categories}
            currentCategory={view}
            maxPrice={maxPrice}
            maxCatalogPrice={maxCatalogPrice}
            onSelectCategory={onSelectCategory}
            onPriceChange={onPriceChange}
            onClearFilters={onClearFilters}
          />
        </div>

        {/* PRODUCTS */}

        <div className="min-w-0 flex-1">

          {/* SEARCH + SORT */}

          <div
            className="
              mb-6
              flex
              flex-col
              gap-4
              sm:flex-row
              sm:flex-wrap
              sm:items-center
              sm:justify-between
            "
          >
            <p
              className="
                shrink-0
                text-xs
                font-medium
                text-gray-500
              "
            >
              {products.length}{' '}
              {products.length === 1
                ? 'product'
                : 'products'}
            </p>

            <div
              className="
                grid
                w-full
                min-w-0
                grid-cols-1
                gap-3
                min-[420px]:grid-cols-2
                sm:w-auto
              "
            >
              {/* SEARCH INPUT */}

              <input
                type="search"
                aria-label="Search products"
                className="
                  field
                  min-h-11
                  min-w-0
                  w-full
                  rounded-sm
                  text-sm
                  sm:w-[180px]
                "
                placeholder="Search products..."
                value={search}
                onChange={(event) =>
                  onSearchChange(event.target.value)
                }
              />

              {/* SORT SELECT */}

              <select
                aria-label="Sort products"
                className="
                  field
                  min-h-11
                  min-w-0
                  w-full
                  rounded-sm
                  text-sm
                  sm:w-[180px]
                "
                value={sort}
                onChange={(event) =>
                  onSortChange(
                    event.target.value as SortOption
                  )
                }
              >
                <option value="featured">
                  Featured
                </option>

                <option value="low">
                  Price: Low to High
                </option>

                <option value="high">
                  Price: High to Low
                </option>

                <option value="newest">
                  Newest Arrivals
                </option>
              </select>
            </div>
          </div>

          {/* RESPONSIVE PRODUCT GRID */}

          {products.length > 0 ? (
            <div
              className="
                grid
                w-full
                min-w-0
                grid-cols-2
                items-stretch
                gap-x-3
                gap-y-5
                sm:gap-x-5
                sm:gap-y-7
                md:grid-cols-3
                lg:grid-cols-2
                xl:grid-cols-3
                xl:gap-6
              "
            >
              {products.map((product) => (
                <div
                  key={product.id}
                  className="h-full min-w-0"
                >
                  <ProductCard
                    product={product}
                    onSelect={onSelectProduct}
                    onWhereToBuy={onWhereToBuy}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* EMPTY PRODUCTS STATE */

            <div
              className="
                flex
                min-h-[260px]
                flex-col
                items-center
                justify-center
                rounded-md
                border
                border-gray-200
                bg-white
                px-5
                py-12
                text-center
              "
            >
              <h3
                className="
                  text-base
                  font-semibold
                  text-gray-900
                "
              >
                No Products Found
              </h3>

              <p
                className="
                  mt-2
                  max-w-sm
                  text-sm
                  leading-6
                  text-gray-500
                "
              >
                No products match your current
                search or filters.
              </p>

              <button
                type="button"
                onClick={onClearFilters}
                className="
                  mt-5
                  inline-flex
                  min-h-11
                  items-center
                  justify-center
                  bg-black
                  px-5
                  py-3
                  text-xs
                  font-bold
                  tracking-wider
                  text-white
                  transition-colors
                  hover:bg-[#987345]
                "
              >
                CLEAR FILTERS
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default ShopView;
