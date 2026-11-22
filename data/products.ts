export interface SeedProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  old: number;
  rating?: number;
  badge: string;
  image: string;
  description: string;
  specs: string[];
  buyLinks?: Record<string, string>;
}

export const unsplashImage = (id: string): string =>
  `https://images.unsplash.com/${id}?auto=format&fit=max&w=1000&q=85`;

export const products: SeedProduct[] = [
  {
    id: 1,
    name: 'AERON Pro Ceramic Straightener',
    category: 'Straighteners',
    price: 3499,
    old: 4999,
    rating: 4.8,
    badge: 'BESTSELLER',
    image: unsplashImage('photo-1590439471364-192aa70c0b53'),
    description: 'Smooth, sleek results with ceramic styling plates and precision heat control.',
    specs: [
      'Ceramic styling plates',
      'Adjustable heat settings',
      '360° swivel cord',
      'Demo specifications — verify before launch',
    ],
    // 👇 Yahan aap apne e-commerce links paste karenge:
    buyLinks: {
      amazon: 'https://www.amazon.in/s?k=AERON+Pro+Ceramic+Straightener',
      flipkart: 'https://www.flipkart.com/search?q=AERON+Pro+Ceramic+Straightener',
      nykaa: 'https://www.nykaa.com/search/result/?q=AERON+Pro+Ceramic+Straightener',
      myntra: 'https://www.myntra.com/aeron-straightener',
    },
  },
  {
    id: 2,
    name: 'AERON Velocity Hair Dryer',
    category: 'Hair Dryers',
    price: 4299,
    old: 5999,
    rating: 4.9,
    badge: 'NEW',
    image: unsplashImage('photo-1522338140262-f46f5913618a'),
    description: 'A professional-inspired dryer designed for everyday styling confidence.',
    specs: [
      'Multiple airflow settings',
      'Concentrator attachment',
      'Ergonomic grip',
      'Demo specifications — verify before launch',
    ],
    buyLinks: {
      amazon: 'https://www.amazon.in/s?k=AERON+Velocity+Hair+Dryer',
      flipkart: 'https://www.flipkart.com/search?q=AERON+Velocity+Hair+Dryer',
      nykaa: 'https://www.nykaa.com/search/result/?q=AERON+Velocity+Hair+Dryer',
    },
  },
  {
    id: 3,
    name: 'AERON Curl Definition Wand',
    category: 'Curling Tools',
    price: 2999,
    old: 3999,
    rating: 4.7,
    badge: 'TRENDING',
    image: unsplashImage('photo-1519699047748-de8e457a634e'),
    description: 'Create polished curls and waves with a salon-inspired styling wand.',
    specs: [
      'Precision barrel',
      'Comfortable handle',
      'Swivel cord',
      'Demo specifications — verify before launch',
    ],
    buyLinks: {
      amazon: 'https://www.amazon.in/s?k=AERON+Curl+Definition+Wand',
      flipkart: 'https://www.flipkart.com/search?q=AERON+Curl+Definition+Wand',
      nykaa: 'https://www.nykaa.com/search/result/?q=AERON+Curl+Definition+Wand',
    },
  },
  {
    id: 4,
    name: 'AERON Volume Hot Air Brush',
    category: 'Hot Air Brushes',
    price: 3799,
    old: 4999,
    rating: 4.8,
    badge: 'POPULAR',
    image: unsplashImage('photo-1527799820374-dcf8d9d4a388'),
    description: 'Style, shape and create beautiful volume with one versatile tool.',
    specs: [
      'Volumizing barrel',
      'Easy-grip design',
      'Multi-setting control',
      'Demo specifications — verify before launch',
    ],
    buyLinks: {
      amazon: 'https://www.amazon.in/s?k=AERON+Volume+Hot+Air+Brush',
      flipkart: 'https://www.flipkart.com/search?q=AERON+Volume+Hot+Air+Brush',
      nykaa: 'https://www.nykaa.com/search/result/?q=AERON+Volume+Hot+Air+Brush',
    },
  },
  {
    id: 5,
    name: 'AERON Precision Trimmer',
    category: 'Clippers & Trimmers',
    price: 2599,
    old: 3499,
    rating: 4.6,
    badge: 'PRO PICK',
    image: unsplashImage('photo-1599351431202-1e0f0137899a'),
    description: 'Clean lines and controlled grooming with a precision-focused design.',
    specs: [
      'Precision cutting head',
      'Comfortable grip',
      'Salon-inspired design',
      'Demo specifications — verify before launch',
    ],
    buyLinks: {
      amazon: 'https://www.amazon.in/s?k=AERON+Precision+Trimmer',
      flipkart: 'https://www.flipkart.com/search?q=AERON+Precision+Trimmer',
      nykaa: 'https://www.nykaa.com/search/result/?q=AERON+Precision+Trimmer',
    },
  },
  {
    id: 6,
    name: 'AERON Texture Crimper',
    category: 'Hair Crimpers',
    price: 3299,
    old: 4499,
    rating: 4.7,
    badge: 'LIMITED',
    image: unsplashImage('photo-1560869713-7d0a29430803'),
    description: 'Add striking texture and dimension to your signature looks.',
    specs: [
      'Textured styling plates',
      'Heat-ready design',
      'Ergonomic handle',
      'Demo specifications — verify before launch',
    ],
    buyLinks: {
      amazon: 'https://www.amazon.in/s?k=AERON+Texture+Crimper',
      flipkart: 'https://www.flipkart.com/search?q=AERON+Texture+Crimper',
      nykaa: 'https://www.nykaa.com/search/result/?q=AERON+Texture+Crimper',
    },
  },
  {
    id: 7,
    name: 'AERON Salon Paddle Brush',
    category: 'Professional Brushes',
    price: 899,
    old: 1299,
    rating: 4.8,
    badge: 'ESSENTIAL',
    image: unsplashImage('photo-1590159763121-7c9fd312190d'),
    description: 'An everyday professional-inspired brush for smooth, comfortable styling.',
    specs: [
      'Comfort-grip handle',
      'Flexible bristle design',
      'Daily salon use',
      'Demo specifications — verify before launch',
    ],
    buyLinks: {
      amazon: 'https://www.amazon.in/s?k=AERON+Salon+Paddle+Brush',
      flipkart: 'https://www.flipkart.com/search?q=AERON+Salon+Paddle+Brush',
      nykaa: 'https://www.nykaa.com/search/result/?q=AERON+Salon+Paddle+Brush',
    },
  },
  {
    id: 8,
    name: 'AERON Stylist Tool Kit',
    category: 'Salon Accessories',
    price: 1499,
    old: 2199,
    rating: 4.6,
    badge: 'VALUE SET',
    image: unsplashImage('photo-1521590832167-7bcbfaa6381f'),
    description: 'Keep your styling station ready with essential salon accessories.',
    specs: [
      'Organized accessory kit',
      'Travel-friendly storage',
      'Stylist essentials',
      'Demo specifications — verify before launch',
    ],
    buyLinks: {
      amazon: 'https://www.amazon.in/s?k=AERON+Stylist+Tool+Kit',
      flipkart: 'https://www.flipkart.com/search?q=AERON+Stylist+Tool+Kit',
      nykaa: 'https://www.nykaa.com/search/result/?q=AERON+Stylist+Tool+Kit',
    },
  },
];