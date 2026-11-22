import { unsplashImage } from './products';

export interface SeedCategory {
  name: string;
  label: string;
  img: string;
}

/**
 * Product categories available in AERON PROFESSIONAL
 */
export const categories: SeedCategory[] = [
  {
    name: 'Straighteners',
    label: 'Hair Straighteners',
    img: unsplashImage('photo-1590439471364-192aa70c0b53'),
  },
  {
    name: 'Hair Dryers',
    label: 'Hair Dryers',
    img: '/images/hair-dryer.png',
  }, 
  {
    name: 'Curling Tools',
    label: 'Curling Tools',
    img: unsplashImage('photo-1519699047748-de8e457a634e'),
  },
  {
    name: 'Hair Crimpers',
    label: 'Hair Crimpers',
    img: unsplashImage('photo-1560869713-7d0a29430803'),
  },
  {
    name: 'Clippers & Trimmers',
    label: 'Clippers & Trimmers',
    img: unsplashImage('photo-1599351431202-1e0f0137899a'),
  },
  {
    name: 'Hot Air Brushes',
    label: 'Hot Air Brushes',
    img: unsplashImage('photo-1527799820374-dcf8d9d4a388'),
  },
  {
    name: 'Professional Brushes',
    label: 'Professional Brushes',
    img: unsplashImage('photo-1590159763121-7c9fd312190d'),
  },
  {
    name: 'Salon Accessories',
    label: 'Salon Accessories',
    img: unsplashImage('photo-1521590832167-7bcbfaa6381f'),
  },
];
