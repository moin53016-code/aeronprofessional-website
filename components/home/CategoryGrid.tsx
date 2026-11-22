
import React from 'react';
import { ArrowRight, ImageIcon } from 'lucide-react';
import { Category } from '@/types';

interface CategoryGridProps {
  categories: Category[];
  onSelectCategory: (categoryName: string) => void;
}

/**
 * Responsive category grid.
 *
 * - Mobile: 2 columns
 * - Tablet: 3 columns
 * - Desktop: 4 columns
 * - Full image visible, no cropping
 * - Automatic center alignment
 * - Original image proportions preserved
 */

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  onSelectCategory,
}) => {
  return (
    <section
      className="
        mx-auto
        w-full
        max-w-7xl
        min-w-0
        px-4
        py-12
        sm:px-6
        sm:py-16
        lg:px-8
        lg:py-20
      "
      aria-labelledby="shop-by-category-heading"
    >
      {/* SECTION HEADING */}

      <div className="mb-8 text-center sm:mb-11">
        <p className="tag">
          DISCOVER YOUR TOOL
        </p>

        <h2
          id="shop-by-category-heading"
          className="
            serif
            mt-3
            text-[clamp(1.8rem,5vw,3rem)]
            leading-tight
          "
        >
          Shop by Category
        </h2>

        <p
          className="
            mx-auto
            mt-4
            max-w-xl
            text-sm
            leading-6
            text-gray-500
            sm:text-base
          "
        >
          Find the perfect tool for every style.
        </p>
      </div>

      {/* RESPONSIVE CATEGORY GRID */}

      <div
        className="
          grid
          min-w-0
          grid-cols-2
          gap-x-3
          gap-y-6
          sm:gap-x-5
          sm:gap-y-8
          md:grid-cols-3
          lg:grid-cols-4
          lg:gap-6
        "
      >
        {categories.map((category) => (
          <button
            key={category.id || category.name}
            type="button"
            onClick={() =>
              onSelectCategory(category.name)
            }
            className="
              group
              flex
              min-w-0
              flex-col
              text-left
              focus-visible:outline
              focus-visible:outline-2
              focus-visible:outline-offset-4
              focus-visible:outline-black
            "
            aria-label={`Shop ${category.label}`}
          >
            {/* CATEGORY IMAGE */}

            <div
              className="
                relative
                flex
                aspect-[4/4.5]
                w-full
                min-w-0
                items-center
                justify-center
                overflow-hidden
                rounded-sm
                bg-[#f1eee8]
                p-2
                sm:p-4
                lg:p-5
              "
            >
              {category.img ? (
                <img
                  src={category.img}
                  alt={category.label}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="
                    block
                    h-full
                    w-full
                    max-h-full
                    max-w-full
                    object-contain
                    object-center
                  "
                  style={{
                    objectFit: 'contain',
                    objectPosition: 'center',
                    transform: 'none',
                  }}
                />
              ) : (
                <div
                  className="
                    flex
                    h-full
                    w-full
                    flex-col
                    items-center
                    justify-center
                    gap-2
                    text-center
                    text-gray-400
                  "
                >
                  <ImageIcon
                    size={28}
                    aria-hidden="true"
                  />

                  <span className="text-xs">
                    No image available
                  </span>
                </div>
              )}
            </div>

            {/* CATEGORY NAME + ARROW */}

            <div
              className="
                flex
                w-full
                min-w-0
                flex-1
                items-center
                justify-between
                gap-2
                border-b
                border-[#d9d4cb]
                py-3
                sm:py-4
              "
            >
              <span
                className="
                  min-w-0
                  break-words
                  text-xs
                  font-semibold
                  leading-5
                  text-[#191919]
                  transition-colors
                  group-hover:text-[#987345]
                  sm:text-sm
                "
              >
                {category.label}
              </span>

              <ArrowRight
                size={17}
                aria-hidden="true"
                className="
                  shrink-0
                  text-[#191919]
                  transition-transform
                  duration-200
                  group-hover:translate-x-1
                "
              />
            </div>
          </button>
        ))}
      </div>

      {/* EMPTY STATE */}

      {categories.length === 0 && (
        <div
          className="
            rounded-md
            border
            border-gray-200
            bg-white
            px-5
            py-12
            text-center
          "
        >
          <p className="text-sm text-gray-500">
            Categories will appear here soon.
          </p>
        </div>
      )}
    </section>
  );
};

export default CategoryGrid;
