
import React from 'react';
import { X } from 'lucide-react';
import { Product } from '@/types';
import { fmt, calcDiscountPercent } from '@/utils/format';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onWhereToBuy: (product: Product) => void;
}

export const ProductDetailModal: React.FC<
  ProductDetailModalProps
> = ({
  product,
  onClose,
  onWhereToBuy,
}) => {
  if (!product) return null;

  const discountPercent = calcDiscountPercent(
    product.price,
    product.originalPrice ?? 0
  );

  const isSoldOut = product.status === 'SOLD_OUT';

  return (
    <div
      className="
        modal
        fixed
        inset-0
        z-[80]
        flex
        items-center
        justify-center
        overflow-y-auto
        p-3
        sm:p-5
        md:p-8
      "
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
    >
      {/* BACKDROP */}
      <div
        className="overlay fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* MODAL CONTENT */}
      <div
        className="
          modal-panel
          relative
          z-[81]
          mx-auto
          w-full
          max-w-5xl
          max-h-[94dvh]
          overflow-y-auto
          bg-white
          p-4
          sm:p-6
          md:p-9
        "
      >
        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close product details"
          className="
            absolute
            right-3
            top-3
            z-30
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-full
            bg-white
            shadow-sm
            transition
            hover:bg-gray-100
            focus-visible:outline
            focus-visible:outline-2
            focus-visible:outline-black
          "
        >
          <X size={20} />
        </button>

        <div
          className="
            grid
            min-w-0
            grid-cols-1
            gap-5
            sm:gap-7
            md:grid-cols-2
            md:gap-8
            lg:gap-10
          "
        >
          {/* RESPONSIVE PRODUCT IMAGE */}
          <div className="min-w-0">
            <div
              className="
                relative
                flex
                aspect-square
                w-full
                items-center
                justify-center
                overflow-hidden
                bg-[#f6f4ef]
                p-3
                sm:p-5
                lg:p-8
              "
            >
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  loading="eager"
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
                    items-center
                    justify-center
                    text-center
                  "
                >
                  <span className="text-sm text-gray-400">
                    No image available
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* PRODUCT DETAILS */}
          <div className="min-w-0 pt-1 sm:pt-3">
            <p className="tag">
              {product.category}
            </p>

            <h2
              className="
                serif
                mt-3
                break-words
                text-2xl
                leading-tight
                sm:text-3xl
                lg:text-4xl
              "
            >
              {product.name}
            </h2>

            {/* PRICING */}
            <div
              className="
                mt-5
                flex
                flex-wrap
                items-center
                gap-x-3
                gap-y-2
              "
            >
              <b className="text-xl sm:text-2xl">
                {fmt(product.price)}
              </b>

              {product.originalPrice &&
                product.originalPrice > product.price && (
                  <>
                    <s className="text-sm text-gray-400">
                      {fmt(product.originalPrice)}
                    </s>

                    {discountPercent > 0 && (
                      <span
                        className="
                          rounded
                          bg-green-50
                          px-2
                          py-1
                          text-xs
                          font-semibold
                          text-green-700
                        "
                      >
                        {discountPercent}% OFF
                      </span>
                    )}
                  </>
                )}
            </div>

            <p className="mt-2 text-xs text-gray-400">
              Prices and availability may vary by retailer.
            </p>

            {/* DESCRIPTION */}
            {product.description && (
              <p
                className="
                  my-5
                  whitespace-pre-line
                  break-words
                  text-sm
                  leading-7
                  text-gray-600
                  sm:my-6
                "
              >
                {product.description}
              </p>
            )}

            {/* SPECIFICATIONS */}
            {product.specs.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-bold">
                  Product Highlights
                </h3>

                <ul
                  className="
                    list-disc
                    space-y-2
                    pl-5
                    text-sm
                    leading-6
                    text-gray-600
                  "
                >
                  {product.specs.map((spec, index) => (
                    <li
                      key={index}
                      className="break-words"
                    >
                      {spec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* WHERE TO BUY */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  if (!isSoldOut) {
                    onWhereToBuy(product);
                  }
                }}
                disabled={isSoldOut}
                className={`
                  flex
                  min-h-12
                  w-full
                  items-center
                  justify-center
                  px-4
                  py-3
                  text-center
                  text-xs
                  font-bold
                  tracking-wider
                  transition
                  ${
                    isSoldOut
                      ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                      : 'bg-black text-white hover:bg-[#9b784c]'
                  }
                `}
              >
                {isSoldOut
                  ? 'CURRENTLY SOLD OUT'
                  : 'WHERE TO BUY'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
