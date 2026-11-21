import React from 'react';

interface AboutViewProps {
  onNavigate: (view: string) => void;
}

/**
 * About Us / Brand Story view
 */
export const AboutView: React.FC<AboutViewProps> = ({ onNavigate }) => {
  return (
    <main className="max-w-5xl mx-auto px-5 py-24">
      <p className="tag">OUR STORY</p>
      <h1 className="serif text-5xl md:text-7xl mt-4 mb-8">AERON PROFESSIONAL</h1>
      <p className="text-lg leading-9 text-gray-600 max-w-3xl">
        AERON PROFESSIONAL is a hair styling tools brand with a vision to bring design, creativity and professional-inspired performance together. This is introductory placeholder brand copy, ready to be replaced with your verified company story.
      </p>
      <button className="btn btn-dark mt-10" onClick={() => onNavigate('Shop All')}>
        EXPLORE OUR PRODUCTS
      </button>
    </main>
  );
};
