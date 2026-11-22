import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const unsplashImage = (id: string): string =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=85`;

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
const CATEGORIES = [
  {
    name: 'Straighteners',
    slug: 'straighteners',
    label: 'Hair Straighteners',
    description: 'Ceramic and titanium hair straighteners for sleek, smooth results.',
    imageUrl: unsplashImage('photo-1590439471364-192aa70c0b53'),
    displayOrder: 1,
  },
  {
    name: 'Hair Dryers',
    slug: 'hair-dryers',
    label: 'Hair Dryers',
    description: 'Powerful professional hair dryers for fast, frizz-free drying.',
    imageUrl: '/images/hair-dryer.png',
    displayOrder: 2,
  },
  {
    name: 'Curling Tools',
    slug: 'curling-tools',
    label: 'Curling Tools',
    description: 'Professional curling wands and irons for every curl type.',
    imageUrl: unsplashImage('photo-1519699047748-de8e457a634e'),
    displayOrder: 3,
  },
  {
    name: 'Hair Crimpers',
    slug: 'hair-crimpers',
    label: 'Hair Crimpers',
    description: 'Create stunning texture and dimension with AERON crimpers.',
    imageUrl: unsplashImage('photo-1560869713-7d0a29430803'),
    displayOrder: 4,
  },
  {
    name: 'Clippers & Trimmers',
    slug: 'clippers-trimmers',
    label: 'Clippers & Trimmers',
    description: 'Precision clippers and trimmers for clean grooming.',
    imageUrl: unsplashImage('photo-1599351431202-1e0f0137899a'),
    displayOrder: 5,
  },
  {
    name: 'Hot Air Brushes',
    slug: 'hot-air-brushes',
    label: 'Hot Air Brushes',
    description: 'Style and dry simultaneously with versatile hot air brushes.',
    imageUrl: unsplashImage('photo-1527799820374-dcf8d9d4a388'),
    displayOrder: 6,
  },
  {
    name: 'Professional Brushes',
    slug: 'professional-brushes',
    label: 'Professional Brushes',
    description: 'Salon-quality brushes for everyday professional styling.',
    imageUrl: unsplashImage('photo-1590159763121-7c9fd312190d'),
    displayOrder: 7,
  },
  {
    name: 'Salon Accessories',
    slug: 'salon-accessories',
    label: 'Salon Accessories',
    description: 'Essential accessories to complete your professional styling station.',
    imageUrl: unsplashImage('photo-1521590832167-7bcbfaa6381f'),
    displayOrder: 8,
  },
];

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
const PRODUCTS = [
  {
    name: 'AERON Pro Ceramic Straightener',
    slug: 'aeron-pro-ceramic-straightener',
    sku: 'AP-STR-001',
    shortDescription: 'Smooth, sleek results with ceramic styling plates and precision heat control.',
    description:
      'The AERON Pro Ceramic Straightener delivers salon-grade performance for home use. Featuring advanced ceramic-coated plates that distribute heat evenly, this straightener reduces frizz and seals the hair cuticle for a glossy, smooth finish. With adjustable heat settings and a 360° swivel cord, it offers the precision and flexibility that professionals demand.',
    priceInPaise: 349900,          // ₹3,499
    originalPriceInPaise: 499900,  // ₹4,999
    status: 'ACTIVE' as const,
    isFeatured: true,
    isNew: false,
    displayOrder: 1,
    badgeText: 'BESTSELLER',
    primaryImageUrl: unsplashImage('photo-1590439471364-192aa70c0b53'),
    categorySlug: 'straighteners',
    specs: [
      { label: 'Plate Material', value: 'Ceramic' },
      { label: 'Heat Settings', value: 'Adjustable' },
      { label: 'Cord', value: '360° Swivel' },
      { label: 'Note', value: 'Demo specifications — verify before launch' },
    ],
    buyLinks: {
      amazon: 'https://www.amazon.in/s?k=AERON+Pro+Ceramic+Straightener', // NOTE: replace with real URL
      flipkart: 'https://www.flipkart.com/search?q=AERON+Pro+Ceramic+Straightener', // NOTE: replace with real URL
      nykaa: 'https://www.nykaa.com/search/result/?q=AERON+Pro+Ceramic+Straightener', // NOTE: replace with real URL
      myntra: 'https://www.myntra.com/aeron-straightener', // NOTE: replace with real URL
    },
  },
  {
    name: 'AERON Velocity Hair Dryer',
    slug: 'aeron-velocity-hair-dryer',
    sku: 'AP-DRY-001',
    shortDescription: 'A professional-inspired dryer designed for everyday styling confidence.',
    description:
      'The AERON Velocity Hair Dryer combines powerful airflow with intelligent heat management. Its ergonomic design reduces wrist fatigue during extended styling sessions, while the included concentrator attachment allows for precise, frizz-free blowouts. The cool-shot button locks in your style for long-lasting results.',
    priceInPaise: 429900,          // ₹4,299
    originalPriceInPaise: 599900,  // ₹5,999
    status: 'ACTIVE' as const,
    isFeatured: true,
    isNew: false,
    displayOrder: 2,
    badgeText: 'NEW',
    primaryImageUrl: unsplashImage('photo-1522338140262-f46f5913618a'),
    categorySlug: 'hair-dryers',
    specs: [
      { label: 'Airflow', value: 'Multiple Settings' },
      { label: 'Attachments', value: 'Concentrator' },
      { label: 'Handle', value: 'Ergonomic Grip' },
      { label: 'Note', value: 'Demo specifications — verify before launch' },
    ],
    buyLinks: {
      amazon: 'https://www.amazon.in/s?k=AERON+Velocity+Hair+Dryer', // NOTE: replace with real URL
      flipkart: 'https://www.flipkart.com/search?q=AERON+Velocity+Hair+Dryer', // NOTE: replace with real URL
      nykaa: 'https://www.nykaa.com/search/result/?q=AERON+Velocity+Hair+Dryer', // NOTE: replace with real URL
    },
  },
  {
    name: 'AERON Curl Definition Wand',
    slug: 'aeron-curl-definition-wand',
    sku: 'AP-CUR-001',
    shortDescription: 'Create polished curls and waves with a salon-inspired styling wand.',
    description:
      'The AERON Curl Definition Wand gives you effortless control over your curls. The precision barrel heats evenly to create consistent waves and ringlets, while the comfortable, heat-resistant handle protects your hand during styling. Perfect for creating everything from loose beach waves to tight, defined curls.',
    priceInPaise: 299900,          // ₹2,999
    originalPriceInPaise: 399900,  // ₹3,999
    status: 'ACTIVE' as const,
    isFeatured: true,
    isNew: false,
    displayOrder: 3,
    badgeText: 'TRENDING',
    primaryImageUrl: unsplashImage('photo-1519699047748-de8e457a634e'),
    categorySlug: 'curling-tools',
    specs: [
      { label: 'Barrel', value: 'Precision Ceramic' },
      { label: 'Handle', value: 'Heat-Resistant Comfort Grip' },
      { label: 'Cord', value: 'Swivel' },
      { label: 'Note', value: 'Demo specifications — verify before launch' },
    ],
    buyLinks: {
      amazon: 'https://www.amazon.in/s?k=AERON+Curl+Definition+Wand', // NOTE: replace with real URL
      flipkart: 'https://www.flipkart.com/search?q=AERON+Curl+Definition+Wand', // NOTE: replace with real URL
      nykaa: 'https://www.nykaa.com/search/result/?q=AERON+Curl+Definition+Wand', // NOTE: replace with real URL
    },
  },
  {
    name: 'AERON Volume Hot Air Brush',
    slug: 'aeron-volume-hot-air-brush',
    sku: 'AP-HAB-001',
    shortDescription: 'Style, shape and create beautiful volume with one versatile tool.',
    description:
      'The AERON Volume Hot Air Brush is the ultimate multitasker for your styling routine. It dries, styles, and adds volume in a single step, reducing styling time significantly. The volumizing barrel lifts roots and smooths ends, while the multiple heat settings accommodate all hair types.',
    priceInPaise: 379900,          // ₹3,799
    originalPriceInPaise: 499900,  // ₹4,999
    status: 'ACTIVE' as const,
    isFeatured: true,
    isNew: false,
    displayOrder: 4,
    badgeText: 'POPULAR',
    primaryImageUrl: unsplashImage('photo-1527799820374-dcf8d9d4a388'),
    categorySlug: 'hot-air-brushes',
    specs: [
      { label: 'Barrel', value: 'Volumizing' },
      { label: 'Handle', value: 'Easy-Grip Design' },
      { label: 'Heat Control', value: 'Multi-Setting' },
      { label: 'Note', value: 'Demo specifications — verify before launch' },
    ],
    buyLinks: {
      amazon: 'https://www.amazon.in/s?k=AERON+Volume+Hot+Air+Brush', // NOTE: replace with real URL
      flipkart: 'https://www.flipkart.com/search?q=AERON+Volume+Hot+Air+Brush', // NOTE: replace with real URL
      nykaa: 'https://www.nykaa.com/search/result/?q=AERON+Volume+Hot+Air+Brush', // NOTE: replace with real URL
    },
  },
  {
    name: 'AERON Precision Trimmer',
    slug: 'aeron-precision-trimmer',
    sku: 'AP-TRM-001',
    shortDescription: 'Clean lines and controlled grooming with a precision-focused design.',
    description:
      'The AERON Precision Trimmer is engineered for clean, defined grooming. Its salon-inspired design and sharp precision cutting head make it ideal for edging, detailing, and maintaining sharp lines. Comfortable to hold during extended sessions with a grip designed for professional control.',
    priceInPaise: 259900,          // ₹2,599
    originalPriceInPaise: 349900,  // ₹3,499
    status: 'ACTIVE' as const,
    isFeatured: false,
    isNew: true,
    displayOrder: 5,
    badgeText: 'PRO PICK',
    primaryImageUrl: unsplashImage('photo-1599351431202-1e0f0137899a'),
    categorySlug: 'clippers-trimmers',
    specs: [
      { label: 'Cutting Head', value: 'Precision' },
      { label: 'Handle', value: 'Comfort Grip' },
      { label: 'Design', value: 'Salon-Inspired' },
      { label: 'Note', value: 'Demo specifications — verify before launch' },
    ],
    buyLinks: {
      amazon: 'https://www.amazon.in/s?k=AERON+Precision+Trimmer', // NOTE: replace with real URL
      flipkart: 'https://www.flipkart.com/search?q=AERON+Precision+Trimmer', // NOTE: replace with real URL
      nykaa: 'https://www.nykaa.com/search/result/?q=AERON+Precision+Trimmer', // NOTE: replace with real URL
    },
  },
  {
    name: 'AERON Texture Crimper',
    slug: 'aeron-texture-crimper',
    sku: 'AP-CRM-001',
    shortDescription: 'Add striking texture and dimension to your signature looks.',
    description:
      'The AERON Texture Crimper delivers bold, dimensional results with its precisely spaced crimping plates. Fast to heat and easy to use, it creates striking textured looks that last. The ergonomic handle provides confident control, while the heat-ready plates ensure consistent performance from root to tip.',
    priceInPaise: 329900,          // ₹3,299
    originalPriceInPaise: 449900,  // ₹4,499
    status: 'ACTIVE' as const,
    isFeatured: false,
    isNew: true,
    displayOrder: 6,
    badgeText: 'LIMITED',
    primaryImageUrl: unsplashImage('photo-1560869713-7d0a29430803'),
    categorySlug: 'hair-crimpers',
    specs: [
      { label: 'Plates', value: 'Textured Styling' },
      { label: 'Heat', value: 'Heat-Ready Design' },
      { label: 'Handle', value: 'Ergonomic' },
      { label: 'Note', value: 'Demo specifications — verify before launch' },
    ],
    buyLinks: {
      amazon: 'https://www.amazon.in/s?k=AERON+Texture+Crimper', // NOTE: replace with real URL
      flipkart: 'https://www.flipkart.com/search?q=AERON+Texture+Crimper', // NOTE: replace with real URL
      nykaa: 'https://www.nykaa.com/search/result/?q=AERON+Texture+Crimper', // NOTE: replace with real URL
    },
  },
  {
    name: 'AERON Salon Paddle Brush',
    slug: 'aeron-salon-paddle-brush',
    sku: 'AP-BRU-001',
    shortDescription: 'An everyday professional-inspired brush for smooth, comfortable styling.',
    description:
      'The AERON Salon Paddle Brush is a daily essential for smooth, polished hair. Its wide paddle surface detangles and smooths with ease, while the flexible bristle design is gentle on all hair types. The comfort-grip handle reduces fatigue during blowouts and everyday styling sessions.',
    priceInPaise: 89900,           // ₹899
    originalPriceInPaise: 129900,  // ₹1,299
    status: 'ACTIVE' as const,
    isFeatured: false,
    isNew: true,
    displayOrder: 7,
    badgeText: 'ESSENTIAL',
    primaryImageUrl: unsplashImage('photo-1590159763121-7c9fd312190d'),
    categorySlug: 'professional-brushes',
    specs: [
      { label: 'Handle', value: 'Comfort-Grip' },
      { label: 'Bristles', value: 'Flexible Design' },
      { label: 'Use', value: 'Daily Salon Use' },
      { label: 'Note', value: 'Demo specifications — verify before launch' },
    ],
    buyLinks: {
      amazon: 'https://www.amazon.in/s?k=AERON+Salon+Paddle+Brush', // NOTE: replace with real URL
      flipkart: 'https://www.flipkart.com/search?q=AERON+Salon+Paddle+Brush', // NOTE: replace with real URL
      nykaa: 'https://www.nykaa.com/search/result/?q=AERON+Salon+Paddle+Brush', // NOTE: replace with real URL
    },
  },
  {
    name: 'AERON Stylist Tool Kit',
    slug: 'aeron-stylist-tool-kit',
    sku: 'AP-KIT-001',
    shortDescription: 'Keep your styling station ready with essential salon accessories.',
    description:
      'The AERON Stylist Tool Kit contains everything you need to keep your styling station organized and professional. This carefully curated set of salon essentials is packed in a travel-friendly storage case, making it perfect for both salon professionals and on-the-go stylists.',
    priceInPaise: 149900,          // ₹1,499
    originalPriceInPaise: 219900,  // ₹2,199
    status: 'ACTIVE' as const,
    isFeatured: false,
    isNew: true,
    displayOrder: 8,
    badgeText: 'VALUE SET',
    primaryImageUrl: unsplashImage('photo-1521590832167-7bcbfaa6381f'),
    categorySlug: 'salon-accessories',
    specs: [
      { label: 'Contents', value: 'Organized Accessory Kit' },
      { label: 'Storage', value: 'Travel-Friendly Case' },
      { label: 'Includes', value: 'Stylist Essentials' },
      { label: 'Note', value: 'Demo specifications — verify before launch' },
    ],
    buyLinks: {
      amazon: 'https://www.amazon.in/s?k=AERON+Stylist+Tool+Kit', // NOTE: replace with real URL
      flipkart: 'https://www.flipkart.com/search?q=AERON+Stylist+Tool+Kit', // NOTE: replace with real URL
      nykaa: 'https://www.nykaa.com/search/result/?q=AERON+Stylist+Tool+Kit', // NOTE: replace with real URL
    },
  },
];

// ---------------------------------------------------------------------------
// Marketplaces
// ---------------------------------------------------------------------------
const MARKETPLACES = [
  {
    name: 'Amazon',
    slug: 'amazon',
    displayOrder: 1,
    tagline: 'Fast delivery & easy returns',
    buttonText: 'Buy on Amazon',
    badgeText: 'Prime',
    badgeColor: '#FF9900',
  },
  {
    name: 'Flipkart',
    slug: 'flipkart',
    displayOrder: 2,
    tagline: 'Assured quality & buyer protection',
    buttonText: 'Buy on Flipkart',
    badgeText: 'Assured',
    badgeColor: '#2874F0',
  },
  {
    name: 'Nykaa',
    slug: 'nykaa',
    displayOrder: 3,
    tagline: 'Your trusted beauty destination',
    buttonText: 'Buy on Nykaa',
    badgeText: 'Beauty',
    badgeColor: '#FC2779',
  },
  {
    name: 'Myntra',
    slug: 'myntra',
    displayOrder: 4,
    tagline: 'Fashion & lifestyle essentials',
    buttonText: 'Buy on Myntra',
    badgeText: 'Style',
    badgeColor: '#FF3F6C',
  },
  {
    name: 'Tata CLiQ',
    slug: 'tatacliq',
    displayOrder: 5,
    tagline: 'Premium shopping experience',
    buttonText: 'Buy on Tata CLiQ',
    badgeText: 'Premium',
    badgeColor: '#2D2D7C',
  },
  {
    name: 'Meesho',
    slug: 'meesho',
    displayOrder: 6,
    tagline: 'Great value, delivered to your door',
    buttonText: 'Buy on Meesho',
    badgeText: 'Value',
    badgeColor: '#9B2AB3',
  },
];

// ---------------------------------------------------------------------------
// Homepage banners (from promo.ts)
// ---------------------------------------------------------------------------
const HOMEPAGE_BANNERS = [
  {
    eyebrow: 'THE PROFESSIONAL EDIT',
    title: 'PROFESSIONAL STYLING. PERFECT RESULTS.',
    description: 'Discover salon-quality styling tools engineered for precision, performance, and creativity.',
    imageUrl: unsplashImage('photo-1522335789203-aabd1fc54bc9'),
    displayOrder: 1,
  },
  {
    eyebrow: 'TOOLS FOR THE ART OF STYLING',
    title: 'CREATE EVERY LOOK WITH CONFIDENCE.',
    description: 'Discover the tools behind your next signature style.',
    imageUrl: unsplashImage('photo-1560066984-138dadb4c035'),
    displayOrder: 2,
  },
  {
    eyebrow: 'THE SALON COLLECTION',
    title: 'CRAFTED FOR YOUR CREATIVE EDGE.',
    description: 'Elevate your styling station with professional-inspired essentials.',
    imageUrl: unsplashImage('photo-1521590832167-7bcbfaa6381f'),
    displayOrder: 3,
  },
];

// ---------------------------------------------------------------------------
// Site settings
// ---------------------------------------------------------------------------
const SITE_SETTINGS = [
  { key: 'brandName', value: 'AERON PROFESSIONAL' },
  { key: 'instagramUrl', value: 'https://instagram.com/aeronproffessional' },
  { key: 'instagramHandle', value: '@aeronproffessional' },
  { key: 'whatsappNumber', value: '919819628073' },
  { key: 'whatsappMessage', value: 'Hi AERON Professional, I have an inquiry.' },
  { key: 'contactEmail', value: 'tkgroupsofindia@yahoo.co.in' },
  { key: 'supportEmail', value: 'tkgroupsofindia@yahoo.co.in' },
  { key: 'businessPhone', value: '+91 98196 28073' },
  { key: 'announcementBarText', value: 'WELCOME TO AERON PROFESSIONAL ✦ ELEVATE YOUR EVERYDAY STYLE' },
  { key: 'announcementBarVisible', value: 'true' },
  { key: 'seoTitle', value: 'AERON PROFESSIONAL | Salon-Grade Styling Tools' },
  { key: 'seoDescription', value: 'Discover premium professional hair dryers, straighteners, curling tools and salon essentials.' },
  { key: 'priceDisclaimer', value: 'Prices and availability may vary by retailer.' },
  { key: 'copyrightText', value: 'AERON PROFESSIONAL. All rights reserved.' },
];

// ---------------------------------------------------------------------------
// FAQs (from SupportModal FAQ_LIST)
// ---------------------------------------------------------------------------
const FAQS = [
  {
    question: 'Where can I buy authentic AERON tools?',
    answer:
      'Authentic AERON Professional styling tools are officially sold through verified store listings on Amazon, Flipkart, Nykaa, and authorized salon distribution partners. Always ensure you purchase from the official brand listing.',
    displayOrder: 1,
  },
  {
    question: 'How do shipping, delivery, and returns work?',
    answer:
      'Because orders are fulfilled directly by our marketplace partners (such as Amazon Prime and Flipkart Assured), delivery timelines, real-time tracking, and 7-day replacement/return windows are safely managed under their official buyer protection policies.',
    displayOrder: 2,
  },
  {
    question: 'What is the warranty period for AERON tools?',
    answer:
      'All AERON styling appliances come with a standard 1-Year Manufacturer Warranty covering heating elements, thermal controls, and motor defects from the date of purchase.',
    displayOrder: 3,
  },
  {
    question: 'How do I claim or register my warranty?',
    answer:
      'No complicated registration required! Just keep a PDF or screenshot of your Amazon/Flipkart invoice. If you ever need support, simply send your invoice and a short video of the issue to our WhatsApp support number.',
    displayOrder: 4,
  },
  {
    question: 'Are AERON tools suitable for salon and daily use?',
    answer:
      'Yes, our appliances are engineered with salon-grade tourmaline-ceramic technology, rapid PTC heaters, and 360-degree swivel cords specifically built to withstand high-repetition professional salon styling.',
    displayOrder: 5,
  },
];

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------
async function main() {
  console.log('🌱 Starting seed...');

  // 1. Seed categories
  console.log('  → Seeding categories...');
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }
  console.log(`  ✓ ${CATEGORIES.length} categories seeded`);

  // 2. Seed marketplaces
  console.log('  → Seeding marketplaces...');
  for (const mp of MARKETPLACES) {
    await prisma.marketplace.upsert({
      where: { slug: mp.slug },
      update: mp,
      create: mp,
    });
  }
  console.log(`  ✓ ${MARKETPLACES.length} marketplaces seeded`);

  // 3. Seed products + specs + category links + marketplace links
  console.log('  → Seeding products...');
  for (const p of PRODUCTS) {
    const { categorySlug, specs, buyLinks, ...productData } = p;

    // Upsert product
    const product = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: { ...productData, publishedAt: new Date() },
      create: { ...productData, publishedAt: new Date() },
    });

    // Upsert specs (delete+recreate for idempotency)
    await prisma.productSpecification.deleteMany({ where: { productId: product.id } });
    for (let i = 0; i < specs.length; i++) {
      await prisma.productSpecification.create({
        data: {
          productId: product.id,
          label: specs[i].label,
          value: specs[i].value,
          displayOrder: i,
        },
      });
    }

    // Upsert primary product image
    const existingPrimary = await prisma.productImage.findFirst({
      where: { productId: product.id, isPrimary: true },
    });
    if (!existingPrimary && productData.primaryImageUrl) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: productData.primaryImageUrl,
          altText: productData.name,
          isPrimary: true,
          displayOrder: 0,
        },
      });
    }

    // Link category
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (category) {
      await prisma.productCategory.upsert({
        where: { productId_categoryId: { productId: product.id, categoryId: category.id } },
        update: {},
        create: { productId: product.id, categoryId: category.id },
      });
    }

    // Link marketplaces
    for (const [mpSlug, url] of Object.entries(buyLinks)) {
      const marketplace = await prisma.marketplace.findUnique({ where: { slug: mpSlug } });
      if (marketplace) {
        await prisma.productMarketplaceLink.upsert({
          where: { productId_marketplaceId: { productId: product.id, marketplaceId: marketplace.id } },
          update: { url, isActive: true },
          create: { productId: product.id, marketplaceId: marketplace.id, url, isActive: true },
        });
      }
    }
  }
  console.log(`  ✓ ${PRODUCTS.length} products seeded with specs, images, categories & marketplace links`);

  // 4. Seed homepage banners
  console.log('  → Seeding homepage banners...');
  for (const banner of HOMEPAGE_BANNERS) {
    // Check by title+eyebrow combination for idempotency
    const existing = await prisma.homepageBanner.findFirst({
      where: { title: banner.title, eyebrow: banner.eyebrow },
    });
    if (existing) {
      await prisma.homepageBanner.update({ where: { id: existing.id }, data: banner });
    } else {
      await prisma.homepageBanner.create({ data: banner });
    }
  }
  console.log(`  ✓ ${HOMEPAGE_BANNERS.length} homepage banners seeded`);

  // 5. Seed site settings
  console.log('  → Seeding site settings...');
  for (const setting of SITE_SETTINGS) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: { key: setting.key, value: setting.value },
    });
  }
  console.log(`  ✓ ${SITE_SETTINGS.length} site settings seeded`);

  // 6. Seed FAQs
  console.log('  → Seeding FAQs...');
  for (const faq of FAQS) {
    const existing = await prisma.fAQ.findFirst({ where: { question: faq.question } });
    if (existing) {
      await prisma.fAQ.update({ where: { id: existing.id }, data: faq });
    } else {
      await prisma.fAQ.create({ data: faq });
    }
  }
  console.log(`  ✓ ${FAQS.length} FAQs seeded`);

  console.log('\n✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
