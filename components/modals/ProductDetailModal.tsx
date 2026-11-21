import React from 'react';
import { X, Star } from 'lucide-react';
import { Product } from '@/types';
import { fmt, calcDiscountPercent } from '@/utils/format';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onBuyNow: (product: Product) => void;
}

/**
 * Detailed modal view for a selected product with clean, centered BUY NOW action
 */
export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onBuyNow,
}) => {
  if (!product) return null;

  const discountPercent = calcDiscountPercent(product.price, product.old);

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
          {/* Gallery Image with zoom */}
          <div>
            <div className="bg-[#eae6df] aspect-square overflow-hidden">
              <img
                src={product.image}
                alt="Illustrative product gallery"
                className="w-full h-full object-cover hover:scale-125 transition duration-500 cursor-zoom-in"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Illustrative photo; replace with actual AERON product photography.
            </p>
          </div>

          {/* Details & Specifications */}
          <div className="pt-3">
            <p className="tag">{product.category}</p>
            <h2 className="serif text-3xl md:text-4xl mt-3">{product.name}</h2>

            <div className="flex items-center gap-2 text-sm mt-4">
              <Star size={16} className="text-gold" fill="currentColor" />
              <span>{product.rating}</span>
              <span className="text-gray-500">
                (sample rating — not a customer review)
              </span>
            </div>

            {/* Price display */}
            <div className="flex gap-3 items-center mt-5">
              <b className="text-2xl">{fmt(product.price)}</b>
              <s className="text-gray-400">{fmt(product.old)}</s>
              <span className="text-green-700 text-sm">{discountPercent}% OFF</span>
            </div>

            <p className="text-sm text-gray-600 leading-7 my-6">
              {product.description}
            </p>

            <p className="text-sm font-bold mb-3">Product Highlights</p>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2 mb-7">
              {product.specs.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>

            <p className="text-xs text-gray-500 mb-5">
              Availability, warranty, temperature and power ratings must be confirmed before selling.
            </p>

            {/* Centered BUY NOW Button */}
            <div className="mt-6 flex justify-center">
              <button
                className="btn btn-dark w-full text-center"
                onClick={() => onBuyNow(product)}
              >
                BUY NOW
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};