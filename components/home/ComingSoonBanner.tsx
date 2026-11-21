import React from 'react';

interface ComingSoonBannerProps {
  onNavigate: (view: string) => void;
}

/**
 * Call-to-action banner for upcoming collection announcements
 */
export const ComingSoonBanner: React.FC<ComingSoonBannerProps> = ({ onNavigate }) => {
  return (
    <section className="bg-[#e9e2d8] py-16 text-center px-5">
      <p className="tag">COMING SOON</p>
      <h2 className="serif text-4xl mt-3">The AERON Insider Edit</h2>
      <p className="text-gray-600 mt-4 text-sm">
        New collections, launches and seasonal offers will appear here.
      </p>
      <button onClick={() => onNavigate('Shop All')} className="btn btn-dark mt-7">
        EXPLORE THE COLLECTION
      </button>
    </section>
  );
};
