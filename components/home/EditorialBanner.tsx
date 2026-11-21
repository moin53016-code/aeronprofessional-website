import React from 'react';
import { ArrowRight } from 'lucide-react';
import { unsplashImage } from '@/data/products';

interface EditorialBannerProps {
  onNavigate: (view: string) => void;
}

/**
 * Mid-page high-impact editorial brand banner
 */
export const EditorialBanner: React.FC<EditorialBannerProps> = ({ onNavigate }) => {
  return (
    <section className="relative bg-[#1b1b1b] text-white min-h-[440px] flex items-center">
      <img
        src={unsplashImage('photo-1560066984-138dadb4c035')}
        className="absolute inset-0 w-full h-full object-cover opacity-35"
        alt="Professional salon interior"
        loading="lazy"
      />
      <div className="relative max-w-7xl mx-auto w-full px-6 lg:px-8 py-24">
        <p className="tag">MADE FOR THE CRAFT</p>
        <h2 className="serif text-5xl md:text-6xl max-w-xl my-5">
          Where artistry meets performance.
        </h2>
        <p className="max-w-md text-gray-300 leading-7 text-sm mb-8">
          Professional-inspired essentials designed to support the creativity of stylists and beauty enthusiasts.
        </p>
        <button
          className="btn bg-gold text-black"
          onClick={() => onNavigate('Professional Collection')}
        >
          DISCOVER THE SALON EDIT <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
};
