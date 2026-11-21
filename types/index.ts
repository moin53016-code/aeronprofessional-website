/**
 * Type definitions for AERON PROFESSIONAL Storefront
 */

export type PlatformKey =
  | 'amazon'
  | 'flipkart'
  | 'nykaa'
  | 'myntra'
  | 'tatacliq'
  | 'meesho'
  | 'direct';

export interface StoreOption {
  key: PlatformKey | string;
  name: string;
  tagline: string;
  badge?: string;
  iconBg: string;
  textColor: string;
  buttonBg: string;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  old: number;
  rating: number;
  badge: string;
  image: string;
  description: string;
  specs: string[];
  buyLinks?: {
    amazon?: string;
    flipkart?: string;
    nykaa?: string;
    myntra?: string;
    tatacliq?: string;
    meesho?: string;
    direct?: string;
    [key: string]: string | undefined;
  };
}

export interface Category {
  name: string;
  label: string;
  img: string;
}

export interface PromoSlide {
  eyebrow: string;
  title: string;
  copy: string;
  img: string;
}

export type SortOption = 'featured' | 'low' | 'high' | 'rating';