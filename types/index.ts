/**
 * Type definitions for AERON PROFESSIONAL Storefront
 * Ratings and reviews are intentionally NOT included.
 */

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'SOLD_OUT' | 'ARCHIVED';

export type SortOption = 'featured' | 'low' | 'high' | 'newest';

export interface MarketplaceLink {
  marketplaceId: string;
  marketplaceName: string;
  marketplaceSlug: string;
  url: string;
  tagline?: string;
  badgeText?: string;
  badgeColor?: string;
  buttonText?: string;
  displayOrder: number;
}

/** Public product DTO — safe to pass to client components */
export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;        // primary category name (for display)
  categoryId?: string;     // primary category id
  price: number;           // display price in INR (not paise)
  originalPrice?: number;  // MRP in INR
  status: ProductStatus;
  isFeatured: boolean;
  isNew: boolean;
  displayOrder: number;
  badge?: string;
  image: string;           // primary image URL
  images: string[];        // all image URLs
  description: string;
  shortDescription?: string;
  specs: string[];         // display-ready spec strings
  marketplaceLinks: MarketplaceLink[];
  publishedAt?: string;    // ISO string
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  label: string;
  img: string;             // imageUrl
  description?: string;
  displayOrder: number;
}

export interface PromoSlide {
  id: string;
  eyebrow: string;
  title: string;
  copy: string;            // description field mapped to copy for compatibility
  img: string;             // imageUrl
  buttonLabel?: string;
  buttonTarget?: string;
}

export interface SiteSettings {
  brandName: string;
  instagramUrl: string;
  instagramHandle: string;
  whatsappNumber: string;
  whatsappMessage: string;
  contactEmail: string;
  supportEmail: string;
  businessPhone: string;
  copyrightText: string;
  announcementBarText: string;
  announcementBarVisible: boolean;
  seoTitle: string;
  seoDescription: string;
  priceDisclaimer: string;
  logoUrl?: string | null;
  footerText?: string;
}
