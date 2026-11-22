
export const dynamic = 'force-dynamic';

// Server Component — loads data and passes props to client
import StorefrontClient from './storefront-client';
import {
  Product,
  Category,
  PromoSlide,
  SiteSettings,
} from '@/types';

// Fallback data
import { products as seedProducts } from '@/data/products';
import { categories as seedCategories } from '@/data/categories';
import { promoSlides as seedPromoSlides } from '@/data/promo';

async function getPublicData(): Promise<{
  products: Product[];
  categories: Category[];
  promoSlides: PromoSlide[];
  settings: SiteSettings;
  faqs: Array<{ question: string; answer: string }>;
}> {
  const defaultSettings: SiteSettings = {
    brandName: 'AERON PROFESSIONAL',
    instagramUrl: 'https://instagram.com/aeronproffessional',
    instagramHandle: '@aeronproffessional',
    whatsappNumber: '919819628073',
    whatsappMessage:
      'Hi AERON Professional, I have an inquiry.',
    contactEmail: 'tkgroupsofindia@yahoo.co.in',
    supportEmail: 'tkgroupsofindia@yahoo.co.in',
    businessPhone: '+91 98196 28073',
    copyrightText:
      'AERON PROFESSIONAL. All rights reserved.',
    announcementBarText:
      'WELCOME TO AERON PROFESSIONAL ✦ ELEVATE YOUR EVERYDAY STYLE',
    announcementBarVisible: true,
    seoTitle:
      'AERON PROFESSIONAL | Salon-Grade Styling Tools',
    seoDescription:
      'Discover premium professional hair dryers, straighteners, curling tools and salon essentials.',
    priceDisclaimer:
      'Prices and availability may vary by retailer.',
    logoUrl: null,
    footerText: '',
  };

  try {
    // Load fresh database data
    const { prisma } = await import('@/lib/db');

    const now = new Date();

    const [
      dbProducts,
      dbCategories,
      dbBanners,
      dbSettings,
      dbFaqs,
      dbMarketplaces,
    ] = await Promise.all([
      // PRODUCTS
      prisma.product.findMany({
        where: {
          status: {
            in: ['ACTIVE', 'SOLD_OUT'],
          },
        },
        include: {
          images: {
            orderBy: {
              displayOrder: 'asc',
            },
          },
          specifications: {
            orderBy: {
              displayOrder: 'asc',
            },
          },
          categories: {
            include: {
              category: true,
            },
          },
          // Old product-specific marketplace links
          // are intentionally no longer loaded.
        },
        orderBy: {
          displayOrder: 'asc',
        },
      }),

      // CATEGORIES
      prisma.category.findMany({
        where: {
          isPublished: true,
          isVisible: true,
        },
        orderBy: {
          displayOrder: 'asc',
        },
      }),

      // HOMEPAGE BANNERS
      prisma.homepageBanner.findMany({
        where: {
          isActive: true,
          OR: [
            {
              startsAt: null,
            },
            {
              startsAt: {
                lte: now,
              },
            },
          ],
          AND: [
            {
              OR: [
                {
                  endsAt: null,
                },
                {
                  endsAt: {
                    gte: now,
                  },
                },
              ],
            },
          ],
        },
        orderBy: {
          displayOrder: 'asc',
        },
      }),

      // SITE SETTINGS
      prisma.siteSetting.findMany(),

      // FAQS
      prisma.fAQ.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          displayOrder: 'asc',
        },
      }),

      // MARKETPLACES — ONLY FROM ADMIN DATABASE
      prisma.marketplace.findMany({
        where: {
          isActive: true,
          url: {
            not: null,
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
    ]);

    // Create central marketplace links from Admin panel
    const globalMarketplaceLinks =
      dbMarketplaces
        .filter((mp) => {
          if (!mp.url) return false;

          try {
            return new URL(mp.url).protocol === 'https:';
          } catch {
            return false;
          }
        })
        .map((mp, index) => ({
          marketplaceId: mp.id,
          marketplaceName: mp.name,
          marketplaceSlug: mp.slug,
          url: mp.url!,
          tagline: mp.tagline ?? undefined,
          badgeText: mp.badgeText ?? undefined,
          badgeColor: mp.badgeColor ?? undefined,
          buttonText: mp.buttonText ?? undefined,
          displayOrder: index,
        }));

    // MAP PRODUCTS
    const products: Product[] = dbProducts.map((p) => {
      const primaryCat = p.categories[0]?.category;

      const primaryImage =
        p.images.find((i) => i.isPrimary) ??
        p.images[0];

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,

        category: primaryCat?.name ?? '',
        categoryId: primaryCat?.id,

        price: Math.round(p.priceInPaise / 100),

        originalPrice: p.originalPriceInPaise
          ? Math.round(p.originalPriceInPaise / 100)
          : undefined,

        status: p.status as Product['status'],

        isFeatured: p.isFeatured,
        isNew: p.isNew,
        displayOrder: p.displayOrder,

        badge: p.badgeText ?? undefined,

        image:
          primaryImage?.url ??
          p.primaryImageUrl ??
          '',

        images: p.images.map((i) => i.url),

        description: p.description,

        shortDescription:
          p.shortDescription ?? undefined,

        specs: p.specifications.map((s) =>
          s.value
            ? `${s.label}: ${s.value}`
            : s.label
        ),

        // Every product gets marketplaces managed
        // centrally from Admin -> Marketplaces.
        marketplaceLinks: globalMarketplaceLinks.map(
          (link) => ({ ...link })
        ),

        publishedAt: p.publishedAt
          ? p.publishedAt.toISOString()
          : undefined,
      };
    });

    // MAP CATEGORIES
    const categories: Category[] = dbCategories.map(
      (c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        label: c.label,
        img: c.imageUrl ?? '',
        description: c.description ?? undefined,
        displayOrder: c.displayOrder,
      })
    );

    // MAP HOMEPAGE BANNERS
    const promoSlides: PromoSlide[] = dbBanners.map(
      (b) => ({
        id: b.id,
        eyebrow: b.eyebrow,
        title: b.title,
        copy: b.description,
        img: b.imageUrl,
        buttonLabel:
          b.buttonLabel ?? undefined,
        buttonTarget:
          b.buttonTarget ?? undefined,
      })
    );

    // MAP SITE SETTINGS
    const settingsMap = Object.fromEntries(
      dbSettings.map((s) => [
        s.key,
        s.value ?? '',
      ])
    );

    const settings: SiteSettings = {
      brandName:
        settingsMap.brandName ||
        defaultSettings.brandName,

      instagramUrl:
        settingsMap.instagramUrl ||
        defaultSettings.instagramUrl,

      instagramHandle:
        settingsMap.instagramHandle ||
        defaultSettings.instagramHandle,

      whatsappNumber:
        settingsMap.whatsappNumber ||
        defaultSettings.whatsappNumber,

      whatsappMessage:
        settingsMap.whatsappMessage ||
        defaultSettings.whatsappMessage,

      contactEmail:
        settingsMap.contactEmail ||
        defaultSettings.contactEmail,

      supportEmail:
        settingsMap.supportEmail ||
        defaultSettings.supportEmail,

      businessPhone:
        settingsMap.businessPhone ||
        defaultSettings.businessPhone,

      footerText:
        settingsMap.footerText || '',

      copyrightText:
        settingsMap.copyrightText ||
        defaultSettings.copyrightText,

      announcementBarText:
        settingsMap.announcementBarText ||
        defaultSettings.announcementBarText,

      announcementBarVisible:
        settingsMap.announcementBarVisible !== 'false',

      seoTitle:
        settingsMap.seoTitle ||
        defaultSettings.seoTitle,

      seoDescription:
        settingsMap.seoDescription ||
        defaultSettings.seoDescription,

      priceDisclaimer:
        settingsMap.priceDisclaimer ||
        defaultSettings.priceDisclaimer,

      logoUrl:
        settingsMap.logoUrl || null,
    };

    // MAP FAQS
    const faqs = dbFaqs.map((f) => ({
      question: f.question,
      answer: f.answer,
    }));

    return {
      products,
      categories,
      promoSlides,
      settings,
      faqs,
    };
  } catch (err) {
    console.error(
      'Database unavailable:',
      err instanceof Error ? err.message : err
    );

    // Fallback data for website display.
    // Marketplace URLs are NEVER loaded from seed data.
    const fallbackProducts: Product[] = (
      seedProducts as any[]
    ).map((p, i) => ({
      id: String(p.id),

      name: p.name,

      slug: p.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-'),

      category: p.category,

      price: p.price,

      originalPrice:
        p.old ?? p.originalPrice,

      status: 'ACTIVE' as const,

      isFeatured: i < 4,
      isNew: i >= 4,

      displayOrder: i,
      badge: p.badge,

      image: p.image,
      images: [p.image],

      description: p.description,
      specs: p.specs,

      // No hardcoded fallback marketplace links.
      marketplaceLinks: [],
    }));

    const fallbackCategories: Category[] = (
      seedCategories as any[]
    ).map((c, i) => ({
      id: c.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-'),

      name: c.name,

      slug: c.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-'),

      label: c.label,
      img: c.img,
      displayOrder: i,
    }));

    const fallbackSlides: PromoSlide[] = (
      seedPromoSlides as any[]
    ).map((s, i) => ({
      id: String(i),
      eyebrow: s.eyebrow,
      title: s.title,
      copy: s.copy,
      img: s.img,
    }));

    return {
      products: fallbackProducts,
      categories: fallbackCategories,
      promoSlides: fallbackSlides,
      settings: defaultSettings,
      faqs: [],
    };
  }
}

export default async function Home() {
  const data = await getPublicData();

  return (
    <StorefrontClient
      products={data.products}
      categories={data.categories}
      promoSlides={data.promoSlides}
      settings={data.settings}
      faqs={data.faqs}
    />
  );
}
