import React from 'react';
import { Star } from 'lucide-react';
import { Product } from '@/types';
import { fmt, calcDiscountPercent } from '@/utils/format';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

/**
 * Clean product card with centered BUY NOW button
 */
export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onBuyNow,
}) => {
  const discountPercent = calcDiscountPercent(product.price, product.old);

  return (
    <div className="product-card group bg-white">
      {/* Product Image & Badge */}
      <div
        className="card-image relative aspect-[4/4.4] cursor-pointer"
        onClick={() => onSelect(product)}
      >
        <img
          src={product.image}
          alt={`Illustrative styling image for ${product.name}`}
          loading="lazy"
        />
        <span className="absolute top-3 left-3 bg-[#191919] text-white text-[9px] tracking-[.16em] px-3 py-2">
          {product.badge}
        </span>
      </div>

      {/* Product Information */}
      <div className="p-4">
        <p className="tag mb-2">{product.category}</p>
        <button
          onClick={() => onSelect(product)}
          className="text-left text-sm font-semibold min-h-[40px] hover:text-[#987345]"
        >
          {product.name}
        </button>

        {/* Rating */}
        <div className="flex items-center gap-1 my-2 text-[#bd975e]">
          <Star size={12} fill="currentColor" />
          <span className="text-xs text-[#555]">
            {product.rating.toFixed(1)} <span className="text-[#aaa]">(sample)</span>
          </span>
        </div>

        {/* Pricing */}
        <div className="flex gap-2 items-center flex-wrap">
          <b>{fmt(product.price)}</b>
          <s className="text-xs text-gray-400">{fmt(product.old)}</s>
          <span className="text-[10px] text-green-700">{discountPercent}% OFF</span>
        </div>

        {/* Centered BUY NOW Button */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => onBuyNow(product)}
            className="w-full bg-black text-white text-[11px] tracking-wider font-bold py-3 text-center hover:bg-[#9b784c] transition"
          >
            BUY NOW
          </button>
        </div>
      </div>
    </div>
  );
};