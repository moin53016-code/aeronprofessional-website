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
 * Reusable product showcase section (used for Bestsellers and New & Noteworthy)
 */
export const ProductShowcase: React.FC<ProductShowcaseProps> = ({
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
    <section className={`py-20 ${backgroundColor ? backgroundColor : ''}`}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="flex justify-between items-end mb-9 gap-4">
          <div>
            <p className="tag">{tag}</p>
            <h2 className="serif text-4xl md:text-5xl mt-3">{title}</h2>
          </div>
          <button
            onClick={onViewAll}
            className="text-xs font-bold tracking-widest border-b border-black pb-2"
          >
            {buttonLabel} <ArrowRight size={13} className="inline" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
              onWhereToBuy={onBuyNow}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;