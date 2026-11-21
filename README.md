# AERON PROFESSIONAL — E-commerce Storefront

A modern, responsive Next.js 15 / React 19 / Tailwind CSS / Framer Motion storefront prototype for **AERON PROFESSIONAL** salon-grade styling tools.

---

## 🚀 How to Run Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Start the development server:**
   ```bash
   npm run dev
   ```
3. **Open in browser:**
   ```
   http://localhost:3000
   ```

---

## 📁 Project Architecture & File Organization

The project is structured according to professional React & Next.js conventions to make debugging, maintaining, and scaling easy:

```text
aeron-professional/
├── app/
│   ├── globals.css              # Custom styling, animations, reset rules, and color utilities
│   ├── layout.tsx               # Root layout, HTML skeleton & page metadata
│   └── page.tsx                 # Master page orchestrator connecting state & views
│
├── components/
│   ├── common/                  # Reusable atomic UI elements
│   │   ├── AnnouncementBar.tsx  # Top ticker ribbon
│   │   ├── ProductCard.tsx      # Standard product card (price, discounts, actions)
│   │   └── ToastNotice.tsx      # Floating toast notification popup
│   ├── layout/                  # Global structural layout components
│   │   ├── Header.tsx           # Sticky nav header, search input & drawer buttons
│   │   ├── Footer.tsx           # Footer columns, policies, copyright
│   │   └── SideDrawer.tsx       # Off-canvas cart, wishlist & mobile navigation
│   ├── home/                    # Home landing page sections
│   │   ├── BrandDifference.tsx  # 3-pillar feature showcase
│   │   ├── CategoryGrid.tsx     # Visual category cards
│   │   ├── ComingSoonBanner.tsx # Newsletter/Insider teaser banner
│   │   ├── EditorialBanner.tsx  # Middle editorial banner
│   │   ├── HeroSlider.tsx       # Animated Framer Motion hero carousel
│   │   ├── HomeView.tsx         # Composite home view wrapper
│   │   ├── ProductShowcase.tsx  # Reusable grid section (Bestsellers & New/Noteworthy)
│   │   └── ValueProps.tsx       # Shipping, warranty, quality, care bar
│   ├── shop/                    # Catalog & filter pages
│   │   ├── FilterSidebar.tsx    # Category selector and price range slider
│   │   └── ShopView.tsx         # Full catalog view with sorting and search bar
│   ├── about/                   # Static content pages
│   │   └── AboutView.tsx        # Brand story page
│   └── modals/                  # Interactive dialogs
│       ├── CheckoutModal.tsx    # Demo checkout with coupon validation
│       └── ProductDetailModal.tsx # Quick-view modal with zoom & specifications
│
├── data/                        # Isolated mock data & assets
│   ├── products.ts              # Products array (prices, specs, images)
│   ├── categories.ts            # Categories array
│   └── promo.ts                 # Hero promo slides data
│
├── hooks/                       # Reusable business logic & state
│   ├── useProductFilters.ts     # Search, sort, filter & price logic
│   └── useStore.ts              # Cart, Wishlist, LocalStorage persistence & coupons
│
├── types/                       # TypeScript interfaces
│   └── index.ts                 # Product, Category, PromoSlide, DrawerType
│
└── utils/                       # Helper functions
    └── format.ts                # INR currency formatter (fmt) & discount calculations
```

---

## 🛠️ Where to Debug & Make Changes

| What you want to do | File to edit |
|---------------------|--------------|
| **Add / Edit products** (prices, images, specs) | `data/products.ts` |
| **Add / Edit categories** | `data/categories.ts` |
| **Update Hero slides** (headlines, copy, images) | `data/promo.ts` |
| **Change Cart / Wishlist / LocalStorage logic** | `hooks/useStore.ts` |
| **Change Search, Sort, or Filtering logic** | `hooks/useProductFilters.ts` |
| **Customize Checkout or Add Coupons** | `components/modals/CheckoutModal.tsx` |
| **Update Navigation Header or Links** | `components/layout/Header.tsx` |
| **Change Global Colors or Fonts** | `tailwind.config.js` and `app/globals.css` |
| **Edit Product Quick-View details** | `components/modals/ProductDetailModal.tsx` |

---

## 🛒 Features Included

- **Exact Visual Match:** 100% identical styling, colors (`#c6a77a` gold, `#101112` ink, `#f6f4ef` cream), typography, and responsiveness.
- **Persistent Cart & Wishlist:** Automatically synchronizes with browser `localStorage`.
- **Dynamic Search & Filtering:** Filter by category, price slider, and instant text search.
- **Interactive Modals:** Product quick-view modal with hover zoom, and checkout dialog with `AERON10` demo coupon support.
- **Clean Architecture:** Zero spaghetti code, cleanly separated components, typed props, and isolated business logic.
