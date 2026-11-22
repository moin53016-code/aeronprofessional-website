import React from 'react';
import { Truck, ShieldCheck, Star, Headphones } from 'lucide-react';

/**
 * Value propositions ribbon highlighting shipping, warranty, quality, and care
 */
export const ValueProps: React.FC = () => {
  return (
    <section className="bg-white border-b border-[#eee]">
      <div className="max-w-7xl mx-auto px-5 py-6 grid grid-cols-2 md:grid-cols-4 gap-5 text-xs">
        <div className="flex items-center gap-3">
          <Truck className="text-[#a88556]" />
          <span>Shipping information at checkout</span>
        </div>
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-[#a88556]" />
          <span>Warranty details by product</span>
        </div>
        <div className="flex items-center gap-3">
          <Star className="text-[#a88556]" />
          <span>Professional-inspired quality</span>
        </div>
        <div className="flex items-center gap-3">
          <Headphones className="text-[#a88556]" />
          <span>Customer care</span>
        </div>
      </div>
    </section>
  );
};
