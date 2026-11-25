
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

// DEFAULT WEBSITE SETTINGS

const defaultSettings: SiteSettings = {
  brandName: 'AERON PROFESSIONAL',

  instagramUrl:
    'https://instagram.com/aeronproffessional',

  instagramHandle:
    '@aeronproffessional',

  // WHATSAPP SUPPORT

  whatsappNumber: '919819628073',

  whatsappMessage:
    'Hi AERON Professional, I have an inquiry.',

  whatsappUrl: '',

  // EMAIL SUPPORT

  contactEmail:
    'tkgroupsofindia@yahoo.co.in',

  supportEmail:
    'tkgroupsofindia@yahoo.co.in',

  // WARRANTY SUPPORT

  warrantySupportUrl: '',

  // BUSINESS CONTACT

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

// VALIDATE HTTPS URLS

function isValidHttpsUrl(
  value: string | null | undefined
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

// NORMALIZE OPTIONAL SUPPORT URLS

function getSafeSupportUrl(
  value: string | undefined
): string {
  const cleaned = value?.trim() ?? '';

  return isValidHttpsUrl(cleaned)
    ? cleaned
    : '';
}

// LOAD LIVE DATABASE DATA

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

    // ACTIVE MARKETPLACE LINKS

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

  // PUBLIC CATEGORY LOOKUP

  const visibleCategoryIds = new Set(
    dbCategories.map((category) => category.id)
  );

  // GLOBAL MARKETPLACE LINKS

  const globalMarketplaceLinks: MarketplaceLink[] =
    dbMarketplaces
      .filter((marketplace) =>
        isValidHttpsUrl(marketplace.url)
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

      // GET ALL VISIBLE ASSIGNED CATEGORIES

      const assignedCategories =
        product.categories
          .map((item) => item.category)
          .filter((category) =>
            visibleCategoryIds.has(category.id)
          )
          .sort(
            (a, b) =>
              a.displayOrder - b.displayOrder ||
              a.id.localeCompare(b.id)
          );

      // REMOVE DUPLICATE CATEGORY IDS

      const categoryIds = Array.from(
        new Set(
          assignedCategories.map(
            (category) => category.id
          )
        )
      );

      // GET ALL CATEGORY NAMES

      const categoryNames = Array.from(
        new Set(
          assignedCategories.map(
            (category) => category.name
          )
        )
      );

      // PRIMARY CATEGORY

      const primaryCategory =
        assignedCategories[0];

      // PRIMARY PRODUCT IMAGE

      const primaryImage =
        product.images.find(
          (image) => image.isPrimary
        ) ?? product.images[0];

      return {
        id: product.id,

        name: product.name,

        slug: product.slug,

        // PRIMARY CATEGORY

        category:
          primaryCategory?.name ?? '',

        categoryId:
          primaryCategory?.id,

        // MULTIPLE CATEGORY SUPPORT

        categoryIds,

        categoryNames,

        // ACCURATE PRODUCT PRICING

        price:
          product.priceInPaise / 100,

        originalPrice:
          product.originalPriceInPaise != null
            ? product.originalPriceInPaise / 100
            : undefined,

        status:
          product.status as Product['status'],

        isFeatured: product.isFeatured,

        isNew: product.isNew,

        displayOrder: product.displayOrder,

        badge:
          product.badgeText ?? undefined,

        // PRODUCT IMAGES

        image:
          primaryImage?.url ??
          product.primaryImageUrl ??
          '',

        images: product.images.map(
          (image) => image.url
        ),

        // PRODUCT DESCRIPTION

        description: product.description,

        shortDescription:
          product.shortDescription ?? undefined,

        // PRODUCT SPECIFICATIONS

        specs: product.specifications.map(
          (specification) =>
            specification.value
              ? `${specification.label}: ${specification.value}`
              : specification.label
        ),

        // CENTRAL MARKETPLACES

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

  // MAP HOMEPAGE BANNERS

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

  // CONVERT DATABASE SETTINGS

  const settingsMap: Record<string, string> =
    Object.fromEntries(
      dbSettings.map((setting) => [
        setting.key,
        setting.value ?? '',
      ])
    );

  // MAP DYNAMIC WEBSITE SETTINGS

  const settings: SiteSettings = {

    // BRAND INFORMATION

    brandName:
      settingsMap.brandName ??
      defaultSettings.brandName,

    logoUrl:
      settingsMap.logoUrl || null,

    // INSTAGRAM

    instagramUrl:
      settingsMap.instagramUrl ??
      defaultSettings.instagramUrl,

    instagramHandle:
      settingsMap.instagramHandle ??
      defaultSettings.instagramHandle,

    // WHATSAPP SUPPORT

    whatsappNumber:
      settingsMap.whatsappNumber ??
      defaultSettings.whatsappNumber,

    whatsappMessage:
      settingsMap.whatsappMessage ??
      defaultSettings.whatsappMessage,

    whatsappUrl:
      getSafeSupportUrl(
        settingsMap.whatsappUrl
      ),

    // EMAIL SUPPORT

    contactEmail:
      settingsMap.contactEmail ??
      defaultSettings.contactEmail,

    supportEmail:
      settingsMap.supportEmail ??
      defaultSettings.supportEmail,

    // WARRANTY SUPPORT URL

    warrantySupportUrl:
      getSafeSupportUrl(
        settingsMap.warrantySupportUrl
      ),

    // BUSINESS CONTACT

    businessPhone:
      settingsMap.businessPhone ??
      defaultSettings.businessPhone,

    // FOOTER SETTINGS

    copyrightText:
      settingsMap.copyrightText ??
      defaultSettings.copyrightText,

    footerText:
      settingsMap.footerText ?? '',

    // ANNOUNCEMENT BAR

    announcementBarText:
      settingsMap.announcementBarText ??
      defaultSettings.announcementBarText,

    announcementBarVisible:
      settingsMap.announcementBarVisible === undefined
        ? defaultSettings.announcementBarVisible
        : settingsMap.announcementBarVisible === 'true',

    // SEO SETTINGS

    seoTitle:
      settingsMap.seoTitle ??
      defaultSettings.seoTitle,

    seoDescription:
      settingsMap.seoDescription ??
      defaultSettings.seoDescription,

    // PRICE DISCLAIMER

    priceDisclaimer:
      settingsMap.priceDisclaimer ??
      defaultSettings.priceDisclaimer,
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
    console.error(
      'Unable to load AERON storefront:',
      error
    );

    return <WebsiteUnavailable />;
  }

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
