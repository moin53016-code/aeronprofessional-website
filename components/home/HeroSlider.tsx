'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { PromoSlide } from '@/types';

interface HeroSliderProps {
  slides: PromoSlide[];
  currentSlide: number;
  onSlideChange: (index: number) => void;
  onNavigate: (view: string) => void;
}

/**
 * Editorial Hero slider with animated background transitions and text reveals
 */
export const HeroSlider: React.FC<HeroSliderProps> = ({
  slides,
  currentSlide,
  onSlideChange,
  onNavigate,
}) => {
  const activeSlide = slides[currentSlide];

  const handlePrev = () => {
    onSlideChange((currentSlide + slides.length - 1) % slides.length);
  };

  const handleNext = () => {
    onSlideChange((currentSlide + 1) % slides.length);
  };

  return (
    <section className="relative bg-[#181818] text-white min-h-[580px] md:min-h-[660px] flex items-center overflow-hidden">
      {/* Background Image Carousel with Framer Motion */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          <img
            src={activeSlide.img}
            className="w-full h-full object-cover opacity-45"
            alt="Professional hair styling editorial"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0b0b] via-[#0b0b0b]/75 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Hero Content */}
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 w-full py-24">
        <motion.div
          key={'text' + currentSlide}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-[700px]"
        >
          <p className="text-gold tracking-[.3em] text-xs font-bold mb-7">
            {activeSlide.eyebrow}
          </p>
          <h1 className="hero-title serif text-[54px] md:text-[76px] leading-[1.05] mb-6">
            {activeSlide.title}
          </h1>
          <p className="text-gray-300 text-sm md:text-base max-w-lg leading-8 mb-9">
            {activeSlide.copy}
          </p>

          <div className="flex gap-3 flex-wrap">
            <button
              className="btn bg-gold text-black hover:bg-white"
              onClick={() => onNavigate('Shop All')}
            >
              SHOP NOW <ArrowRight size={15} />
            </button>
            <button
              className="btn btn-outline"
              onClick={() => onNavigate('Professional Collection')}
            >
              EXPLORE COLLECTION
            </button>
          </div>
        </motion.div>
      </div>

      {/* Slide Navigation Buttons (Bottom Right) */}
      <div className="absolute bottom-8 right-8 flex gap-3">
        <button
          aria-label="Previous slide"
          onClick={handlePrev}
          className="border border-white/40 p-3"
        >
          <ArrowLeft size={17} />
        </button>
        <button
          aria-label="Next slide"
          onClick={handleNext}
          className="border border-white/40 p-3"
        >
          <ArrowRight size={17} />
        </button>
      </div>

      {/* Slide Progress Indicators (Bottom Left) */}
      <div className="absolute bottom-10 left-8 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Slide ${i + 1}`}
            onClick={() => onSlideChange(i)}
            className={`h-1 ${i === currentSlide ? 'w-9 bg-gold' : 'w-5 bg-white/40'}`}
          />
        ))}
      </div>
    </section>
  );
};
