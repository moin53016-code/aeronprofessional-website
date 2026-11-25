
/**
 * Type definitions for AERON PROFESSIONAL Storefront
 *
 * Ratings and reviews are intentionally NOT included.
 */

// PRODUCT STATUS

export type ProductStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'SOLD_OUT'
  | 'ARCHIVED';

// PRODUCT SORTING

export type SortOption =
  | 'featured'
  | 'low'
  | 'high'
  | 'newest';

// MARKETPLACE LINKS

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

// PUBLIC PRODUCT DATA

export interface Product {
  id: string;

  name: string;

  slug: string;

  // PRIMARY CATEGORY

  category: string;

  categoryId?: string;

  // ALL ASSIGNED CATEGORIES

  categoryIds?: string[];

  categoryNames?: string[];

  // PRODUCT PRICING

  price: number;

  originalPrice?: number;

  // PRODUCT STATUS

  status: ProductStatus;

  isFeatured: boolean;

  isNew: boolean;

  displayOrder: number;

  badge?: string;

  // PRODUCT IMAGES

  image: string;

  images: string[];

  // PRODUCT DESCRIPTION

  description: string;

  shortDescription?: string;

  specs: string[];

  // CENTRAL MARKETPLACE LINKS

  marketplaceLinks: MarketplaceLink[];

  // PRODUCT PUBLISHING DATE

  publishedAt?: string;
}

// PRODUCT CATEGORY

export interface Category {
  id: string;

  name: string;

  slug: string;

  label: string;

  img: string;

  description?: string;

  displayOrder: number;
}

// HOMEPAGE PROMOTIONAL SLIDES

export interface PromoSlide {
  id: string;

  eyebrow: string;

  title: string;

  copy: string;

  img: string;

  buttonLabel?: string;

  buttonTarget?: string;
}

// GLOBAL WEBSITE SETTINGS

export interface SiteSettings {
  // BRAND INFORMATION

  brandName: string;

  logoUrl?: string | null;

  // INSTAGRAM

  instagramUrl: string;

  instagramHandle: string;

  // WHATSAPP SUPPORT

  whatsappNumber: string;

  whatsappMessage: string;

  whatsappUrl?: string;

  // EMAIL SUPPORT

  contactEmail: string;

  supportEmail: string;

  // WARRANTY SUPPORT

  warrantySupportUrl?: string;

  // BUSINESS CONTACT

  businessPhone: string;

  // FOOTER SETTINGS

  copyrightText: string;

  footerText?: string;

  // ANNOUNCEMENT BAR

  announcementBarText: string;

  announcementBarVisible: boolean;

  // SEO SETTINGS

  seoTitle: string;

  seoDescription: string;

  // PRODUCT DISCLAIMER

  priceDisclaimer: string;
}
