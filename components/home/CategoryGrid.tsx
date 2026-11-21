import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Category } from '@/types';

interface CategoryGridProps {
  categories: Category[];
  onSelectCategory: (categoryName: string) => void;
}

/**
 * Visual category browser section
 */
export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  onSelectCategory,
}) => {
  return (
    <section className="max-w-7xl mx-auto px-5 lg:px-8 py-20">
      <div className="text-center mb-11">
        <p className="tag">DISCOVER YOUR TOOL</p>
        <h2 className="serif text-4xl md:text-5xl mt-3">Shop by Category</h2>
        <p className="text-gray-500 text-sm mt-4">Find the perfect tool for every style.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {categories.map((c) => (
          <button
            key={c.name}
            onClick={() => onSelectCategory(c.name)}
            className="group text-left"
          >
            <div className="aspect-[4/4.5] overflow-hidden bg-[#e9e5df]">
              <img
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                src={c.img}
                alt={c.label}
                loading="lazy"
              />
            </div>
            <div className="flex justify-between items-center py-4 border-b border-[#d9d4cb]">
              <span className="font-semibold text-sm">{c.label}</span>
              <ArrowRight size={16} />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
