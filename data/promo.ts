import { PromoSlide } from '@/types';
import { unsplashImage } from './products';

/**
 * Editorial Hero slides data
 */
export const promoSlides: PromoSlide[] = [
  {
    eyebrow: 'THE PROFESSIONAL EDIT',
    title: 'PROFESSIONAL STYLING. PERFECT RESULTS.',
    copy: 'Discover salon-quality styling tools engineered for precision, performance, and creativity.',
    img: unsplashImage('photo-1522335789203-aabd1fc54bc9'),
  },
  {
    eyebrow: 'TOOLS FOR THE ART OF STYLING',
    title: 'CREATE EVERY LOOK WITH CONFIDENCE.',
    copy: 'Discover the tools behind your next signature style.',
    img: unsplashImage('photo-1560066984-138dadb4c035'),
  },
  {
    eyebrow: 'THE SALON COLLECTION',
    title: 'CRAFTED FOR YOUR CREATIVE EDGE.',
    copy: 'Elevate your styling station with professional-inspired essentials.',
    img: unsplashImage('photo-1521590832167-7bcbfaa6381f'),
  },
];
