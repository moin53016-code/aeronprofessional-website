
import React from 'react';
import { Product } from '@/types';
import { fmt, calcDiscountPercent } from '@/utils/format';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onWhereToBuy: (product: Product) => void;
}

/**
 * Responsive product card:
 * - Full image visible
 * - Center aligned
 * - No cropping or stretching
 * - Responsive on all screens
 */
export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onWhereToBuy,
}) => {
  const discountPercent = calcDiscountPercent(
    product.price,
    product.originalPrice ?? 0
  );

  const isSoldOut = product.status === 'SOLD_OUT';

  return (
    <div className="product-card group bg-white">
      {/* PRODUCT IMAGE */}
      <div
        className="card-image relative aspect-[4/4.4] w-full cursor-pointer bg-white"
        onClick={() => onSelect(product)}
      >
        <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-5 md:p-6">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="block !w-full !h-full !object-contain !object-center"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                objectPosition: 'center',
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#f6f4ef]">
              <span className="text-xs text-gray-400">
                No image available
              </span>
            </div>
          )}
        </div>

        {/* PRODUCT BADGE */}
        {product.badge && (
          <span className="absolute top-3 left-3 z-10 bg-[#191919] text-white text-[9px] tracking-[.16em] px-3 py-2">
            {product.badge}
          </span>
        )}

        {/* SOLD OUT OVERLAY */}
        {isSoldOut && (
          <div className="absolute inset-0 z-20 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-black text-[9px] tracking-[.16em] font-bold px-4 py-2">
              SOLD OUT
            </span>
          </div>
        )}
      </div>

      {/* PRODUCT INFORMATION */}
      <div className="p-4">
        <p className="tag mb-2">
          {product.category}
        </p>

        <button
          type="button"
          onClick={() => onSelect(product)}
          className="text-left text-sm font-semibold min-h-[40px] hover:text-[#987345]"
        >
          {product.name}
        </button>

        {/* PRICING */}
        <div className="flex gap-2 items-center flex-wrap mt-2">
          <b>{fmt(product.price)}</b>

          {product.originalPrice &&
            product.originalPrice > product.price && (
              <>
                <s className="text-xs text-gray-400">
                  {fmt(product.originalPrice)}
                </s>

                {discountPercent > 0 && (
                  <span className="text-[10px] text-green-700">
                    {discountPercent}% OFF
                  </span>
                )}
              </>
            )}
        </div>

        {/* WHERE TO BUY BUTTON */}
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() =>
              !isSoldOut && onWhereToBuy(product)
            }
            disabled={isSoldOut}
            className={`w-full text-[11px] tracking-wider font-bold py-3 text-center transition ${
              isSoldOut
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-black text-white hover:bg-[#9b784c]'
            }`}
          >
            {isSoldOut ? 'SOLD OUT' : 'WHERE TO BUY'}
          </button>
        </div>
      </div>
    </div>
  );
};
