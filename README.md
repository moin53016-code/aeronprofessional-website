# AERON PROFESSIONAL — Full-Stack Showcase & Admin Panel

A production-ready brand showcase and product discovery platform with a secure admin dashboard for **AERON PROFESSIONAL**, built with Next.js 15, TypeScript, Tailwind CSS, Prisma ORM, Neon PostgreSQL, and Cloudflare.

---

## 1. Business Model & Core Journey

AERON PROFESSIONAL is a high-end salon styling brand. **This website is NOT an e-commerce store with direct checkout.**

- **No Customer Accounts:** No customer registration, login, profiles, carts, or payment gateways.
- **Product Discovery:** Visitors explore professional appliances, filter by category and price, and view specifications.
- **Where to Buy Flow:** When a customer clicks **Where to Buy**, a modal opens displaying only verified, admin-configured marketplace listings (Amazon, Flipkart, Nykaa, Myntra, Tata CLiQ, etc.).
- **External Redirection:** Clicking a marketplace redirects the buyer to the official external product listing in a new tab. All transactions occur on third-party marketplaces.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons |
| **Backend** | Next.js Server Components, Server Actions & Authenticated Route Handlers |
| **Database** | Neon PostgreSQL (Serverless & Driver Adapter compatible) |
| **ORM** | Prisma 6 LTS with `@prisma/adapter-neon` / `@neondatabase/serverless` |
| **Authentication** | Admin-only secure session cookies (HttpOnly, SameSite=Strict) via `jose` and `bcryptjs` |
| **Image Storage** | Cloudflare R2 Object Storage / Secure Presigned URLs |
| **Deployment** | Cloudflare Workers via OpenNext (`@opennextjs/cloudflare`) |

---

## 3. Project Structure

```
├── app/
│   ├── layout.tsx                # Global HTML shell & metadata
│   ├── globals.css               # Brand Tailwind theme & styling
│   ├── page.tsx                  # Public storefront (Server Component with DB fetching)
│   ├── storefront-client.tsx     # Client-side storefront orchestrator & modals
│   ├── admin/
│   │   ├── layout.tsx            # Protected admin shell layout
│   │   ├── page.tsx              # Admin dashboard with live stats & quick actions
│   │   ├── login/page.tsx        # Secure admin login
│   │   ├── products/             # Product catalog table & filters
│   │   │   ├── new/page.tsx      # Add new product
│   │   │   └── [id]/edit/page.tsx# Edit product, specs, images & marketplace links
│   │   ├── categories/page.tsx   # Category management & visibility toggles
│   │   ├── banners/page.tsx      # Homepage hero slide manager
│   │   ├── marketplaces/page.tsx # Marketplace platform configurations
│   │   ├── discounts/page.tsx    # Promotional campaigns
│   │   ├── content/page.tsx      # FAQ & editable content blocks
│   │   └── settings/page.tsx     # Centralized brand, contact & WhatsApp settings
│   └── api/
│       └── admin/                # 18 Authenticated Route Handlers (Auth, CRUD, Uploads)
├── components/
│   ├── admin/                    # Admin sidebar, header, forms, tables & action dropdowns
│   ├── common/                   # ProductCard (Where to Buy, no ratings), AnnouncementBar
│   ├── home/                     # HeroSlider, CategoryGrid, ProductShowcase, BrandDifference
│   ├── modals/                   # ProductDetailModal, WhereToBuyModal, SupportModal
│   ├── layout/                   # Header, Footer, SideDrawer
│   └── shop/                     # ShopView, FilterSidebar (dynamic max price)
├── lib/
│   ├── db.ts                     # Prisma client singleton (Edge & Server compatible)
│   ├── auth.ts                   # JWT session creation, validation & cookie handlers
│   └── site-settings.ts          # Cached global settings accessor & WhatsApp URL builder
├── prisma/
│   ├── schema.prisma             # Full relational database schema (16 models & enums)
│   └── seed.ts                   # Idempotent seed script (8 products, 8 categories, 3 banners, FAQs)
├── scripts/
│   └── setup-admin.ts            # CLI script to securely bootstrap the OWNER admin account
├── middleware.ts                 # Route guard protecting /admin/* and /api/admin/*
├── wrangler.toml                 # Cloudflare Workers deployment configuration
└── .env.example                  # Environment variable template
```

---

## 4. Setup & Local Development

### Prerequisites
- Node.js 20+
- pnpm (or npm / yarn)

### Step 1: Install Dependencies
```bash
pnpm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env.local` (or `.env`):
```bash
cp .env.example .env.local
```

Fill in your actual Neon PostgreSQL connection string and secrets:
```env
# Neon PostgreSQL
DATABASE_URL="postgresql://user:password@ep-sample-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
DATABASE_DIRECT_URL="postgresql://user:password@ep-sample-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# Auth Secret (Minimum 32 random characters)
AUTH_SECRET="your-32-character-ultra-secure-random-secret"

# Cloudflare R2 (Optional for local dev, uses local uploads fallback)
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="aeron-media"
R2_PUBLIC_BASE_URL="https://pub-sample.r2.dev"

# Public Site URL
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### Step 3: Run Database Migrations
```bash
pnpm run db:migrate
# or in production:
pnpm run db:migrate:prod
```

### Step 4: Seed Initial Catalog Data
Migrates the existing 8 AERON products, 8 categories, 3 hero banners, 6 marketplace platforms, and initial settings into Neon:
```bash
pnpm run db:seed
```

### Step 5: Bootstrap Owner Admin Account
Run the secure admin creation script:
```bash
# Via command line arguments:
pnpm run admin:setup admin@aeronprofessional.com YourSecurePassword123 "AERON Owner"

# Or via environment variables:
ADMIN_EMAIL=admin@aeronprofessional.com ADMIN_PASSWORD=YourSecurePassword123 pnpm run admin:setup
```

### Step 6: Start Development Server
```bash
pnpm run dev
```
- Storefront: `http://localhost:3000`
- Admin Dashboard: `http://localhost:3000/admin`
- Admin Login: `http://localhost:3000/admin/login`

---

## 5. Admin Panel Capabilities

### Dashboard (`/admin`)
- Real-time catalog metrics: Total, Active, Sold Out, Draft, and Archived products.
- Active homepage banners, categories, and promotional campaigns.
- Recently modified products table.
- Quick action navigation cards.

### Product Management (`/admin/products`)
- Search by product name/description, filter by status.
- Add, Edit, Save as Draft, Publish, Mark Sold Out, Archive.
- Multi-category assignment.
- Dynamic specifications list (add/remove custom key-value pairs).
- Per-product Marketplace purchase link management.
- Image URL configuration with visual preview.
- Featured product & New arrival toggles for homepage curation.

### Category Management (`/admin/categories`)
- Add new categories with custom slugs, labels, and imagery.
- In-place renaming and label updates.
- One-click visibility toggle (hides category from shop and navigation without deleting).

### Where to Buy Marketplaces (`/admin/marketplaces`)
- Manage active platform partners (Amazon, Flipkart, Nykaa, Myntra, Tata CLiQ, etc.).
- Configure custom badge text, taglines, and action button labels per marketplace.

### Homepage Hero Banners (`/admin/banners`)
- Add, edit, and reorder hero slider banners.
- Set eyebrow text, headline, description, image, and CTA target.
- Enable/disable slides instantly.

### Centralized Website Settings (`/admin/settings`)
- Updating settings here automatically updates **every shared component on the public site** (Header, Footer, Support Modal, Announcement Bar):
  - Brand name & copyright text
  - Instagram URL & handle
  - WhatsApp phone number & predefined chat message
  - Support & customer contact emails
  - Business telephone number
  - Announcement bar text & visibility toggle
  - Global price disclaimer
  - SEO default title and meta description

---

## 6. Key Business & Technical Rules Implemented

1. **Complete Removal of Ratings & Reviews:**
   - All star icons, review counts, sample review notes, rating sorting, and rating filters have been permanently eliminated from the entire codebase and database schema.
2. **"Where to Buy" Redirection Only:**
   - Every purchase action now displays "WHERE TO BUY" (or "SOLD OUT" when out of stock).
   - `WhereToBuyModal` displays **only** administrator-configured marketplace links with verified HTTPS schemes. The previous generic search fallback has been removed.
   - Products with no configured links display a polite "Currently unavailable" state.
3. **Graceful Build-Time Fallback:**
   - Next.js Server Components on `app/page.tsx` gracefully fall back to existing catalog data if the database connection is not yet configured, preventing build failures.
4. **Edge & Serverless Compatibility:**
   - Configured with `@neondatabase/serverless` and `@prisma/adapter-neon` to support deployment to Cloudflare Workers and Vercel Edge networks without Node socket restrictions.

---

## 7. Cloudflare Workers Deployment

1. Install Wrangler CLI:
   ```bash
   pnpm add -D wrangler @opennextjs/cloudflare
   ```
2. Authenticate with Cloudflare:
   ```bash
   npx wrangler login
   ```
3. Set your production secrets in Cloudflare:
   ```bash
   npx wrangler secret put DATABASE_URL
   npx wrangler secret put DATABASE_DIRECT_URL
   npx wrangler secret put AUTH_SECRET
   npx wrangler secret put R2_ACCESS_KEY_ID
   npx wrangler secret put R2_SECRET_ACCESS_KEY
   ```
4. Build and Deploy:
   ```bash
   npx opennextjs-cloudflare
   npx wrangler deploy
   ```
5. Custom Domain:
   In the Cloudflare Dashboard, navigate to **Workers & Pages** → your worker → **Settings** → **Domains & Routes** → add `www.aeronprofessional.com`.

---

## 8. Verification & Verification Results

| Check | Command / Scenario | Result |
|---|---|---|
| **TypeScript Compilation** | `npx tsc --noEmit` | **0 errors (100% clean)** |
| **Production Build** | `npx next build` | **Successfully generated 25 static & dynamic routes** |
| **Admin Route Protection** | Unauthenticated access to `/admin` | **Redirected to `/admin/login` via `middleware.ts`** |
| **Rating Removal** | `ProductCard`, `ProductDetailModal`, `ShopView` | **No stars, counts, or rating sort remaining** |
| **Where to Buy Action** | `WhereToBuyModal` | **Displays only verified marketplace links, no search fallback** |
| **Seed Execution** | `pnpm run db:seed` | **Idempotent upsert of all 8 products, 8 categories, 3 banners** |
