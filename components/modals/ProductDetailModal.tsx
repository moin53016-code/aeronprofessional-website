import React from 'react';
import { X } from 'lucide-react';
import { Product } from '@/types';
import { fmt, calcDiscountPercent } from '@/utils/format';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onWhereToBuy: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onWhereToBuy,
}) => {
  if (!product) return null;

  const discountPercent = calcDiscountPercent(product.price, product.originalPrice ?? 0);
  const isSoldOut = product.status === 'SOLD_OUT';

  return (
    <div className="modal">
      <div className="overlay" onClick={onClose} />
      <div className="modal-panel z-[81] p-5 md:p-9">
        <button
          className="absolute right-4 top-4 z-10 bg-white p-2"
          aria-label="Close product"
          onClick={onClose}
        >
          <X />
        </button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Gallery Image */}
          <div>
            <div className="bg-[#eae6df] aspect-square overflow-hidden">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-125 transition duration-500 cursor-zoom-in"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-xs text-gray-400">No image available</span>
                </div>
              )}
            </div>
          </div>

          {/* Details & Specifications */}
          <div className="pt-3">
            <p className="tag">{product.category}</p>
            <h2 className="serif text-3xl md:text-4xl mt-3">{product.name}</h2>

            {/* Price display */}
            <div className="flex gap-3 items-center mt-5">
              <b className="text-2xl">{fmt(product.price)}</b>
              {product.originalPrice && product.originalPrice > product.price && (
                <>
                  <s className="text-gray-400">{fmt(product.originalPrice)}</s>
                  {discountPercent > 0 && (
                    <span className="text-green-700 text-sm">{discountPercent}% OFF</span>
                  )}
                </>
              )}
            </div>

            <p className="text-xs text-gray-400 mt-1">
              Prices and availability may vary by retailer.
            </p>

            <p className="text-sm text-gray-600 leading-7 my-6">
              {product.description}
            </p>

            {product.specs.length > 0 && (
              <>
                <p className="text-sm font-bold mb-3">Product Highlights</p>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2 mb-7">
                  {product.specs.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </>
            )}

            {/* WHERE TO BUY Button */}
            <div className="mt-6 flex justify-center">
              <button
                className={`btn w-full text-center ${
                  isSoldOut
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'btn-dark'
                }`}
                onClick={() => !isSoldOut && onWhereToBuy(product)}
                disabled={isSoldOut}
              >
                {isSoldOut ? 'CURRENTLY SOLD OUT' : 'WHERE TO BUY'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
