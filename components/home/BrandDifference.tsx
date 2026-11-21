import React from 'react';
import { ShieldCheck, Star, Headphones } from 'lucide-react';

/**
 * Three-column brand pillars highlighting focus, design, and customer care
 */
export const BrandDifference: React.FC = () => {
  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-5 text-center">
        <p className="tag">THE AERON DIFFERENCE</p>
        <h2 className="serif text-4xl md:text-5xl mt-3 mb-12">Made to Inspire Confidence</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <ShieldCheck className="mx-auto mb-5 text-[#a88556]" size={34} />
            <h3 className="font-bold mb-3">Professional Focus</h3>
            <p className="text-sm text-gray-500 leading-7">
              Thoughtful styling essentials with a focus on practical performance.
            </p>
          </div>

          <div>
            <Star className="mx-auto mb-5 text-[#a88556]" size={34} />
            <h3 className="font-bold mb-3">Design-Led Tools</h3>
            <p className="text-sm text-gray-500 leading-7">
              Refined design for the modern beauty routine and salon station.
            </p>
          </div>

          <div>
            <Headphones className="mx-auto mb-5 text-[#a88556]" size={34} />
            <h3 className="font-bold mb-3">Here to Help</h3>
            <p className="text-sm text-gray-500 leading-7">
              Dedicated space for product guidance and customer support.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
