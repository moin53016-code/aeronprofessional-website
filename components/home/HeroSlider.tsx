
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { PromoSlide } from '@/types';

interface HeroSliderProps {
  slides: PromoSlide[];
  currentSlide: number;
  onSlideChange: (index: number) => void;
  onNavigate: (view: string) => void;
}

/**
 * Responsive AERON Hero Slider
 *
 * - Full image visible on every device
 * - No cropping or stretching
 * - Image centered automatically
 * - Responsive typography and buttons
 * - Smooth slide transitions
 * - Mobile-friendly navigation
 */

export const HeroSlider: React.FC<HeroSliderProps> = ({
  slides,
  currentSlide,
  onSlideChange,
  onNavigate,
}) => {
  if (!slides.length) {
    return null;
  }

  const safeIndex =
    ((currentSlide % slides.length) + slides.length) %
    slides.length;

  const activeSlide = slides[safeIndex];

  const handlePrev = () => {
    onSlideChange(
      (safeIndex + slides.length - 1) % slides.length
    );
  };

  const handleNext = () => {
    onSlideChange(
      (safeIndex + 1) % slides.length
    );
  };

  return (
    <section
      className="
        relative
        w-full
        min-w-0
        overflow-hidden
        bg-[#181818]
        text-white
      "
      aria-label="Aeron promotional banners"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={safeIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full"
        >
          <div
            className="
              mx-auto
              grid
              w-full
              max-w-[1600px]
              grid-cols-1
              items-center
              lg:grid-cols-2
            "
          >
            {/* FULL RESPONSIVE BANNER IMAGE */}
            <div
              className="
                relative
                order-1
                flex
                w-full
                min-w-0
                items-center
                justify-center
                overflow-hidden
                bg-[#242424]
                px-4
                py-6
                sm:px-8
                sm:py-8
                lg:order-2
                lg:min-h-[570px]
                lg:px-10
                lg:py-12
                xl:min-h-[650px]
              "
            >
              <div
                className="
                  flex
                  aspect-[4/3]
                  w-full
                  max-w-[680px]
                  items-center
                  justify-center
                  sm:aspect-[16/10]
                  lg:aspect-square
                "
              >
                {activeSlide.img ? (
                  <img
                    src={activeSlide.img}
                    alt={
                      activeSlide.title ||
                      'AERON Professional banner'
                    }
                    loading={safeIndex === 0 ? 'eager' : 'lazy'}
                    draggable={false}
                    className="
                      block
                      h-full
                      w-full
                      max-h-full
                      max-w-full
                      object-contain
                      object-center
                    "
                    style={{
                      objectFit: 'contain',
                      objectPosition: 'center',
                      transform: 'none',
                    }}
                  />
                ) : (
                  <div
                    className="
                      flex
                      h-full
                      w-full
                      items-center
                      justify-center
                      text-sm
                      text-gray-400
                    "
                  >
                    AERON PROFESSIONAL
                  </div>
                )}
              </div>
            </div>

            {/* RESPONSIVE HERO CONTENT */}
            <div
              className="
                relative
                order-2
                flex
                min-w-0
                items-center
                bg-[#181818]
                px-5
                pb-24
                pt-8
                sm:px-8
                sm:pb-28
                sm:pt-12
                lg:order-1
                lg:min-h-[570px]
                lg:px-12
                lg:py-20
                xl:min-h-[650px]
                xl:px-16
              "
            >
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.1,
                }}
                className="w-full max-w-xl"
              >
                {/* EYEBROW */}
                {activeSlide.eyebrow && (
                  <p
                    className="
                      mb-4
                      break-words
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.2em]
                      text-[#c6a77a]
                      sm:mb-6
                      sm:text-xs
                    "
                  >
                    {activeSlide.eyebrow}
                  </p>
                )}

                {/* HEADING */}
                <h1
                  className="
                    serif
                    mb-5
                    break-words
                    text-[clamp(2rem,6vw,4.5rem)]
                    leading-[1.1]
                    sm:mb-6
                  "
                >
                  {activeSlide.title}
                </h1>

                {/* DESCRIPTION */}
                {activeSlide.copy && (
                  <p
                    className="
                      mb-7
                      max-w-lg
                      break-words
                      text-sm
                      leading-7
                      text-gray-300
                      sm:mb-9
                      sm:text-base
                      sm:leading-8
                    "
                  >
                    {activeSlide.copy}
                  </p>
                )}

                {/* HERO ACTION BUTTONS */}
                <div
                  className="
                    flex
                    w-full
                    flex-col
                    gap-3
                    min-[420px]:flex-row
                    min-[420px]:flex-wrap
                  "
                >
                  <button
                    type="button"
                    onClick={() => onNavigate('Shop All')}
                    className="
                      inline-flex
                      min-h-12
                      items-center
                      justify-center
                      gap-2
                      bg-[#c6a77a]
                      px-5
                      py-3
                      text-center
                      text-xs
                      font-bold
                      tracking-wider
                      text-black
                      transition-colors
                      hover:bg-white
                      sm:px-6
                    "
                  >
                    SHOP NOW
                    <ArrowRight size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onNavigate('Professional Collection')
                    }
                    className="
                      inline-flex
                      min-h-12
                      items-center
                      justify-center
                      border
                      border-white/50
                      px-5
                      py-3
                      text-center
                      text-xs
                      font-bold
                      tracking-wider
                      text-white
                      transition-colors
                      hover:border-white
                      hover:bg-white
                      hover:text-black
                      sm:px-6
                    "
                  >
                    EXPLORE COLLECTION
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* SLIDER NAVIGATION */}
      {slides.length > 1 && (
        <div
          className="
            absolute
            bottom-4
            left-0
            right-0
            z-20
            mx-auto
            flex
            w-full
            max-w-[1600px]
            items-center
            justify-between
            gap-3
            px-5
            sm:bottom-6
            sm:px-8
            lg:px-12
            xl:px-16
          "
        >
          {/* SLIDE INDICATORS */}
          <div
            className="
              flex
              min-w-0
              flex-wrap
              items-center
              gap-2
            "
          >
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onSlideChange(index)}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={
                  index === safeIndex ? 'true' : undefined
                }
                className="
                  flex
                  min-h-10
                  min-w-6
                  items-center
                  justify-center
                "
              >
                <span
                  className={`
                    block
                    h-1
                    rounded-full
                    transition-all
                    duration-300
                    ${
                      index === safeIndex
                        ? 'w-7 bg-[#c6a77a]'
                        : 'w-4 bg-white/40'
                    }
                  `}
                />
              </button>
            ))}
          </div>

          {/* PREVIOUS / NEXT BUTTONS */}
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              aria-label="Previous slide"
              onClick={handlePrev}
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                border
                border-white/40
                bg-[#181818]
                text-white
                transition-colors
                hover:bg-white
                hover:text-black
                sm:h-11
                sm:w-11
              "
            >
              <ArrowLeft size={17} />
            </button>

            <button
              type="button"
              aria-label="Next slide"
              onClick={handleNext}
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                border
                border-white/40
                bg-[#181818]
                text-white
                transition-colors
                hover:bg-white
                hover:text-black
                sm:h-11
                sm:w-11
              "
            >
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
