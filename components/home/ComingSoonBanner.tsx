
import React from 'react';
import { ArrowRight } from 'lucide-react';

interface ComingSoonBannerProps {
  onNavigate: (view: string) => void;
}

export const ComingSoonBanner: React.FC<
  ComingSoonBannerProps
> = ({ onNavigate }) => {
  return (
    <section
      className="
        w-full
        min-w-0
        bg-[#e9e2d8]
        px-4
        py-12
        text-center
        sm:px-6
        sm:py-16
        lg:px-8
        lg:py-20
      "
    >
      <div
        className="
          mx-auto
          flex
          w-full
          max-w-3xl
          flex-col
          items-center
          justify-center
        "
      >
        <p className="tag">
          COMING SOON
        </p>

        <h2
          className="
            serif
            mt-3
            break-words
            text-[clamp(1.9rem,5vw,3rem)]
            leading-tight
          "
        >
          The AERON Insider Edit
        </h2>

        <p
          className="
            mt-4
            max-w-xl
            break-words
            text-sm
            leading-7
            text-gray-600
            sm:text-base
          "
        >
          New collections, launches and seasonal
          offers will appear here.
        </p>

        <button
          type="button"
          onClick={() => onNavigate('Shop All')}
          className="
            mt-7
            inline-flex
            min-h-12
            w-full
            max-w-xs
            items-center
            justify-center
            gap-2
            bg-[#171717]
            px-5
            py-3
            text-center
            text-xs
            font-bold
            tracking-wider
            text-white
            transition-colors
            hover:bg-[#9b784c]
            sm:w-auto
          "
        >
          EXPLORE THE COLLECTION
          <ArrowRight
            size={16}
            className="shrink-0"
          />
        </button>
      </div>
    </section>
  );
};

export default ComingSoonBanner;
