
import React from 'react';
import { ArrowRight } from 'lucide-react';

import { Product } from '@/types';
import { ProductCard } from '@/components/common/ProductCard';

interface ProductShowcaseProps {
  tag: string;
  title: string;
  buttonLabel?: string;
  products: Product[];
  backgroundColor?: string;
  onViewAll: () => void;
  onSelectProduct: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

/**
 * Responsive product showcase.
 *
 * Mobile: 2 columns
 * Tablet: 3 columns
 * Desktop: 4 columns
 */

export const ProductShowcase: React.FC<
  ProductShowcaseProps
> = ({
  tag,
  title,
  buttonLabel = 'VIEW ALL',
  products,
  backgroundColor,
  onViewAll,
  onSelectProduct,
  onBuyNow,
}) => {
  return (
    <section
      className={`
        w-full
        min-w-0
        py-12
        sm:py-16
        lg:py-20
        ${backgroundColor ?? ''}
      `}
    >
      <div
        className="
          mx-auto
          w-full
          max-w-7xl
          min-w-0
          px-4
          sm:px-6
          lg:px-8
        "
      >
        {/* SECTION HEADER */}

        <div
          className="
            mb-7
            flex
            flex-col
            items-start
            justify-between
            gap-4
            sm:mb-9
            sm:flex-row
            sm:items-end
          "
        >
          <div className="min-w-0">
            <p className="tag">{tag}</p>

            <h2
              className="
                serif
                mt-3
                break-words
                text-[clamp(1.8rem,5vw,3rem)]
                leading-tight
              "
            >
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onViewAll}
            className="
              inline-flex
              min-h-11
              shrink-0
              items-center
              justify-center
              gap-2
              border-b
              border-black
              text-xs
              font-bold
              tracking-widest
              transition-colors
              hover:text-[#987345]
            "
          >
            {buttonLabel}
            <ArrowRight size={14} />
          </button>
        </div>

        {/* RESPONSIVE PRODUCT GRID */}

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
            lg:grid-cols-4
            lg:gap-6
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
                onWhereToBuy={onBuyNow}
              />
            </div>
          ))}
        </div>

        {/* EMPTY STATE */}

        {products.length === 0 && (
          <div
            className="
              mt-5
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
              Products will appear here soon.
            </p>

            <button
              type="button"
              onClick={onViewAll}
              className="
                mt-4
                inline-flex
                min-h-11
                items-center
                justify-center
                gap-2
                bg-black
                px-5
                py-3
                text-xs
                font-bold
                text-white
              "
            >
              EXPLORE COLLECTION
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductShowcase;
