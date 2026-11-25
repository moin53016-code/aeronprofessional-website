
import type {
  Product,
  Category,
  PromoSlide,
  SiteSettings,
  MarketplaceLink,
} from '@/types';

import StorefrontClient from './storefront-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// PUBLIC WEBSITE DATA TYPES

interface PublicData {
  products: Product[];
  categories: Category[];
  promoSlides: PromoSlide[];
  settings: SiteSettings;

  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

// DEFAULT BRAND SETTINGS
// USED ONLY WHEN SETTINGS ARE MISSING

const defaultSettings: SiteSettings = {
  brandName: 'AERON PROFESSIONAL',

  instagramUrl:
    'https://instagram.com/aeronproffessional',

  instagramHandle:
    '@aeronproffessional',

  whatsappNumber: '919819628073',

  whatsappMessage:
    'Hi AERON Professional, I have an inquiry.',

  contactEmail:
    'tkgroupsofindia@yahoo.co.in',

  supportEmail:
    'tkgroupsofindia@yahoo.co.in',

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

// VALIDATE PUBLIC MARKETPLACE URLS

function isValidMarketplaceUrl(
  value: string | null
): value is string {
  if (!value) return false;

  try {
    const url = new URL(value);

    return (
      url.protocol === 'https:' &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

// LOAD LIVE WEBSITE DATA

async function getPublicData(): Promise<PublicData> {
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

    // PUBLIC PRODUCTS

    prisma.product.findMany({
      where: {
        status: {
          in: ['ACTIVE', 'SOLD_OUT'],
        },
      },

      include: {
        images: {
          orderBy: [
            {
              displayOrder: 'asc',
            },
            {
              id: 'asc',
            },
          ],
        },

        specifications: {
          orderBy: [
            {
              displayOrder: 'asc',
            },
            {
              id: 'asc',
            },
          ],
        },

        categories: {
          include: {
            category: true,
          },
        },
      },

      orderBy: [
        {
          displayOrder: 'asc',
        },
        {
          id: 'asc',
        },
      ],
    }),

    // PUBLISHED AND VISIBLE CATEGORIES

    prisma.category.findMany({
      where: {
        isPublished: true,
        isVisible: true,
      },

      orderBy: [
        {
          displayOrder: 'asc',
        },
        {
          id: 'asc',
        },
      ],
    }),

    // LIVE HOMEPAGE BANNERS

    prisma.homepageBanner.findMany({
      where: {
        isActive: true,

        AND: [
          {
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
          },

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

      orderBy: [
        {
          displayOrder: 'asc',
        },
        {
          id: 'asc',
        },
      ],
    }),

    // WEBSITE SETTINGS

    prisma.siteSetting.findMany({
      select: {
        key: true,
        value: true,
      },
    }),

    // ACTIVE FAQS

    prisma.fAQ.findMany({
      where: {
        isActive: true,
      },

      orderBy: [
        {
          displayOrder: 'asc',
        },
        {
          id: 'asc',
        },
      ],
    }),

    // CENTRAL MARKETPLACE LINKS

    prisma.marketplace.findMany({
      where: {
        isActive: true,

        url: {
          not: null,
        },
      },

      orderBy: [
        {
          createdAt: 'asc',
        },
        {
          id: 'asc',
        },
      ],
    }),
  ]);

  // MAP GLOBAL MARKETPLACE LINKS

  const globalMarketplaceLinks: MarketplaceLink[] =
    dbMarketplaces
      .filter((marketplace) =>
        isValidMarketplaceUrl(marketplace.url)
      )
      .map((marketplace, index) => ({
        marketplaceId: marketplace.id,

        marketplaceName: marketplace.name,

        marketplaceSlug: marketplace.slug,

        url: marketplace.url!,

        tagline:
          marketplace.tagline ?? undefined,

        badgeText:
          marketplace.badgeText ?? undefined,

        badgeColor:
          marketplace.badgeColor ?? undefined,

        buttonText:
          marketplace.buttonText ?? undefined,

        displayOrder: index,
      }));

  // MAP PUBLIC PRODUCTS

  const products: Product[] = dbProducts.map(
    (product) => {
      const primaryCategory =
        product.categories[0]?.category;

      const primaryImage =
        product.images.find(
          (image) => image.isPrimary
        ) ?? product.images[0];

      return {
        id: product.id,

        name: product.name,

        slug: product.slug,

        category:
          primaryCategory?.name ?? '',

        categoryId:
          primaryCategory?.id,

        // ACCURATE PAISE TO INR CONVERSION

        price:
          product.priceInPaise / 100,

        originalPrice:
          product.originalPriceInPaise != null
            ? product.originalPriceInPaise / 100
            : undefined,

        status: product.status as Product['status'],

        isFeatured: product.isFeatured,

        isNew: product.isNew,

        displayOrder: product.displayOrder,

        badge:
          product.badgeText ?? undefined,

        image:
          primaryImage?.url ??
          product.primaryImageUrl ??
          '',

        images: product.images.map(
          (image) => image.url
        ),

        description: product.description,

        shortDescription:
          product.shortDescription ?? undefined,

        specs: product.specifications.map(
          (specification) =>
            specification.value
              ? `${specification.label}: ${specification.value}`
              : specification.label
        ),

        // ALL PRODUCTS USE CENTRAL MARKETPLACES

        marketplaceLinks:
          globalMarketplaceLinks.map(
            (link) => ({
              ...link,
            })
          ),

        publishedAt:
          product.publishedAt?.toISOString(),
      };
    }
  );

  // MAP PUBLIC CATEGORIES

  const categories: Category[] =
    dbCategories.map((category) => ({
      id: category.id,

      name: category.name,

      slug: category.slug,

      label: category.label,

      img: category.imageUrl ?? '',

      description:
        category.description ?? undefined,

      displayOrder: category.displayOrder,
    }));

  // MAP LIVE HOMEPAGE BANNERS

  const promoSlides: PromoSlide[] =
    dbBanners.map((banner) => ({
      id: banner.id,

      eyebrow: banner.eyebrow,

      title: banner.title,

      copy: banner.description,

      img: banner.imageUrl,

      buttonLabel:
        banner.buttonLabel ?? undefined,

      buttonTarget:
        banner.buttonTarget ?? undefined,
    }));

  // MAP WEBSITE SETTINGS

  const settingsMap: Record<string, string> =
    Object.fromEntries(
      dbSettings.map((setting) => [
        setting.key,
        setting.value ?? '',
      ])
    );

  // PRESERVE INTENTIONALLY EMPTY ADMIN SETTINGS

  const settings: SiteSettings = {
    brandName:
      settingsMap.brandName ??
      defaultSettings.brandName,

    instagramUrl:
      settingsMap.instagramUrl ??
      defaultSettings.instagramUrl,

    instagramHandle:
      settingsMap.instagramHandle ??
      defaultSettings.instagramHandle,

    whatsappNumber:
      settingsMap.whatsappNumber ??
      defaultSettings.whatsappNumber,

    whatsappMessage:
      settingsMap.whatsappMessage ??
      defaultSettings.whatsappMessage,

    contactEmail:
      settingsMap.contactEmail ??
      defaultSettings.contactEmail,

    supportEmail:
      settingsMap.supportEmail ??
      defaultSettings.supportEmail,

    businessPhone:
      settingsMap.businessPhone ??
      defaultSettings.businessPhone,

    copyrightText:
      settingsMap.copyrightText ??
      defaultSettings.copyrightText,

    announcementBarText:
      settingsMap.announcementBarText ??
      defaultSettings.announcementBarText,

    announcementBarVisible:
      settingsMap.announcementBarVisible === undefined
        ? defaultSettings.announcementBarVisible
        : settingsMap.announcementBarVisible === 'true',

    seoTitle:
      settingsMap.seoTitle ??
      defaultSettings.seoTitle,

    seoDescription:
      settingsMap.seoDescription ??
      defaultSettings.seoDescription,

    priceDisclaimer:
      settingsMap.priceDisclaimer ??
      defaultSettings.priceDisclaimer,

    logoUrl:
      settingsMap.logoUrl || null,

    footerText:
      settingsMap.footerText ?? '',
  };

  // MAP CUSTOMER CARE FAQS

  const faqs = dbFaqs.map((faq) => ({
    question: faq.question,

    answer: faq.answer,
  }));

  return {
    products,
    categories,
    promoSlides,
    settings,
    faqs,
  };
}

// WEBSITE DATABASE ERROR SCREEN

function WebsiteUnavailable() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf9f6] px-5 py-12">

      <div className="w-full max-w-lg text-center">

        {/* AERON BRAND */}

        <div className="mb-10">

          <p className="text-3xl font-bold tracking-[0.22em] text-gray-900 sm:text-5xl">
            AERON
          </p>

          <p className="mt-2 text-[10px] font-semibold tracking-[0.4em] text-[#977447] sm:text-xs">
            PROFESSIONAL
          </p>

        </div>

        {/* DECORATIVE DIVIDER */}

        <div className="mx-auto mb-8 h-px w-16 bg-[#977447]" />

        {/* ERROR MESSAGE */}

        <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
          Temporarily Unavailable
        </h1>

        <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-gray-500">
          Our website is experiencing a temporary
          technical issue. Please try again shortly.
        </p>

        {/* RETRY WEBSITE */}

        <form
          action="/"
          method="GET"
          className="mt-8"
        >
          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center bg-black px-10 py-4 text-xs font-semibold tracking-[0.18em] text-white transition-colors hover:bg-gray-800"
          >
            TRY AGAIN
          </button>
        </form>

        {/* FOOTER */}

        <p className="mt-12 text-[10px] uppercase tracking-widest text-gray-400">
          AERON PROFESSIONAL
        </p>

      </div>

    </main>
  );
}

// MAIN PUBLIC WEBSITE

export default async function Home() {
  let data: PublicData;

  try {
    data = await getPublicData();
  } catch (error) {
    // LOG ERROR ON SERVER
    // NEVER DISPLAY SENSITIVE DATABASE INFORMATION

    console.error(
      'Unable to load AERON storefront:',
      error
    );

    // NEVER LOAD STATIC OR DUMMY PRODUCTS

    return <WebsiteUnavailable />;
  }

  // RENDER EXISTING STOREFRONT DESIGN

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
