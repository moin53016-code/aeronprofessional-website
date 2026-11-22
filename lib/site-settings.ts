import { prisma } from './db';
import { unstable_cache } from 'next/cache';

export interface SiteSettings {
  brandName: string;
  instagramUrl: string;
  instagramHandle: string;
  whatsappNumber: string;
  whatsappMessage: string;
  contactEmail: string;
  supportEmail: string;
  businessPhone: string;
  footerText: string;
  copyrightText: string;
  announcementBarText: string;
  announcementBarVisible: boolean;
  seoTitle: string;
  seoDescription: string;
  priceDisclaimer: string;
  logoUrl: string | null;
}

const DEFAULT_SETTINGS: SiteSettings = {
  brandName: 'AERON PROFESSIONAL',
  instagramUrl: 'https://instagram.com/aeronproffessional',
  instagramHandle: '@aeronproffessional',
  whatsappNumber: '919819628073',
  whatsappMessage: 'Hi AERON Professional, I have an inquiry.',
  contactEmail: 'tkgroupsofindia@yahoo.co.in',
  supportEmail: 'tkgroupsofindia@yahoo.co.in',
  businessPhone: '+91 98196 28073',
  footerText: '',
  copyrightText: 'AERON PROFESSIONAL. All rights reserved.',
  announcementBarText: 'WELCOME TO AERON PROFESSIONAL ✦ ELEVATE YOUR EVERYDAY STYLE',
  announcementBarVisible: true,
  seoTitle: 'AERON PROFESSIONAL | Salon-Grade Styling Tools',
  seoDescription: 'Discover premium professional hair dryers, straighteners, curling tools and salon essentials.',
  priceDisclaimer: 'Prices and availability may vary by retailer.',
  logoUrl: null,
};

export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    try {
      const rows = await prisma.siteSetting.findMany();
      const map = Object.fromEntries(rows.map((r) => [r.key, r.value ?? '']));
      return {
        brandName: map.brandName || DEFAULT_SETTINGS.brandName,
        instagramUrl: map.instagramUrl || DEFAULT_SETTINGS.instagramUrl,
        instagramHandle: map.instagramHandle || DEFAULT_SETTINGS.instagramHandle,
        whatsappNumber: map.whatsappNumber || DEFAULT_SETTINGS.whatsappNumber,
        whatsappMessage: map.whatsappMessage || DEFAULT_SETTINGS.whatsappMessage,
        contactEmail: map.contactEmail || DEFAULT_SETTINGS.contactEmail,
        supportEmail: map.supportEmail || DEFAULT_SETTINGS.supportEmail,
        businessPhone: map.businessPhone || DEFAULT_SETTINGS.businessPhone,
        footerText: map.footerText || DEFAULT_SETTINGS.footerText,
        copyrightText: map.copyrightText || DEFAULT_SETTINGS.copyrightText,
        announcementBarText: map.announcementBarText || DEFAULT_SETTINGS.announcementBarText,
        announcementBarVisible: map.announcementBarVisible !== 'false',
        seoTitle: map.seoTitle || DEFAULT_SETTINGS.seoTitle,
        seoDescription: map.seoDescription || DEFAULT_SETTINGS.seoDescription,
        priceDisclaimer: map.priceDisclaimer || DEFAULT_SETTINGS.priceDisclaimer,
        logoUrl: map.logoUrl || null,
      };
    } catch {
      // Fallback to defaults if DB not connected
      return DEFAULT_SETTINGS;
    }
  },
  ['site-settings'],
  { tags: ['site-settings'], revalidate: 300 }
);

export function getWhatsAppUrl(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
