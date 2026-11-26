import Link from 'next/link';

import {
  Package,
  Tags,
  Image,
  Percent,
  Plus,
  Settings,
  Globe,
  FileText,
} from 'lucide-react';

import { prisma } from '@/lib/db';

import {
  requireAdminPage,
} from '@/lib/admin-page';

import {
  PERMISSIONS,
  hasPermission,
} from '@/lib/permissions';

// ==========================================
// ROUTE CONFIGURATION
// ==========================================

export const dynamic = 'force-dynamic';

export const revalidate = 0;

// ==========================================
// LOAD DASHBOARD STATISTICS
// ==========================================

async function getDashboardStats() {
  const [
    totalProducts,
    activeProducts,
    soldOutProducts,
    draftProducts,
    archivedProducts,
    totalCategories,
    activeBanners,
    activeDiscounts,
    recentProducts,
  ] = await Promise.all([

    prisma.product.count(),

    prisma.product.count({
      where: {
        status: 'ACTIVE',
      },
    }),

    prisma.product.count({
      where: {
        status: 'SOLD_OUT',
      },
    }),

    prisma.product.count({
      where: {
        status: 'DRAFT',
      },
    }),

    prisma.product.count({
      where: {
        status: 'ARCHIVED',
      },
    }),

    prisma.category.count({
      where: {
        isPublished: true,
      },
    }),

    prisma.homepageBanner.count({
      where: {
        isActive: true,
      },
    }),

    prisma.discountCampaign.count({
      where: {
        isActive: true,
      },
    }),

    prisma.product.findMany({
      take: 5,

      orderBy: {
        updatedAt: 'desc',
      },

      select: {
        id: true,

        name: true,

        status: true,

        updatedAt: true,
      },
    }),
  ]);

  return {
    totalProducts,
    activeProducts,
    soldOutProducts,
    draftProducts,
    archivedProducts,
    totalCategories,
    activeBanners,
    activeDiscounts,
    recentProducts,
  };
}

// ==========================================
// PRODUCT STATUS COLORS
// ==========================================

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',

  SOLD_OUT: 'bg-orange-100 text-orange-700',

  DRAFT: 'bg-gray-100 text-gray-600',

  ARCHIVED: 'bg-red-100 text-red-600',
};

// ==========================================
// ADMIN DASHBOARD
// ==========================================

export default async function AdminDashboardPage() {

  // ========================================
  // SERVER-SIDE DASHBOARD PERMISSION
  // ========================================

  const session = await requireAdminPage({
    permission:
      PERMISSIONS.DASHBOARD_VIEW,
  });

  const role = session.user.role;

  // ========================================
  // PRODUCT PERMISSIONS
  // ========================================

  const canViewProducts = hasPermission(
    role,
    PERMISSIONS.PRODUCT_VIEW
  );

  const canCreateProducts = hasPermission(
    role,
    PERMISSIONS.PRODUCT_CREATE
  );

  const canUpdateProducts = hasPermission(
    role,
    PERMISSIONS.PRODUCT_UPDATE
  );

  // ========================================
  // CATEGORY PERMISSIONS
  // ========================================

  const canViewCategories = hasPermission(
    role,
    PERMISSIONS.CATEGORY_VIEW
  );

  const canManageCategories = hasPermission(
    role,
    PERMISSIONS.CATEGORY_MANAGE
  );

  // ========================================
  // BANNER PERMISSIONS
  // ========================================

  const canViewBanners = hasPermission(
    role,
    PERMISSIONS.BANNER_VIEW
  );

  const canManageBanners = hasPermission(
    role,
    PERMISSIONS.BANNER_MANAGE
  );

  // ========================================
  // DISCOUNT PERMISSIONS
  // ========================================

  const canViewDiscounts = hasPermission(
    role,
    PERMISSIONS.DISCOUNT_VIEW
  );

  const canManageDiscounts = hasPermission(
    role,
    PERMISSIONS.DISCOUNT_MANAGE
  );

  // ========================================
  // MARKETPLACE PERMISSIONS
  // ========================================

  const canViewMarketplaces = hasPermission(
    role,
    PERMISSIONS.MARKETPLACE_VIEW
  );

  const canManageMarketplaces = hasPermission(
    role,
    PERMISSIONS.MARKETPLACE_MANAGE
  );

  // ========================================
  // CONTENT AND FAQ PERMISSIONS
  // ========================================

  const canViewFaqs = hasPermission(
    role,
    PERMISSIONS.FAQ_VIEW
  );

  const canManageFaqs = hasPermission(
    role,
    PERMISSIONS.FAQ_MANAGE
  );

  // ========================================
  // WEBSITE SETTINGS PERMISSIONS
  // ========================================

  const canViewSettings = hasPermission(
    role,
    PERMISSIONS.SETTINGS_VIEW
  );

  // ========================================
  // LOAD PROTECTED DASHBOARD DATA
  // ========================================

  const stats = await getDashboardStats();

  // ========================================
  // ROLE-BASED QUICK ACTIONS
  // ========================================

  const quickActions = [
    {
      href: '/admin/products/new',

      icon: Package,

      label: 'Add Product',

      allowed: canCreateProducts,
    },

    {
      href: '/admin/categories',

      icon: Tags,

      label: canManageCategories
        ? 'Manage Categories'
        : 'View Categories',

      allowed: canViewCategories,
    },

    {
      href: '/admin/banners',

      icon: Image,

      label: canManageBanners
        ? 'Manage Banners'
        : 'View Banners',

      allowed: canViewBanners,
    },

    {
      href: '/admin/discounts',

      icon: Percent,

      label: canManageDiscounts
        ? 'Manage Discounts'
        : 'View Discounts',

      allowed: canViewDiscounts,
    },

    {
      href: '/admin/marketplaces',

      icon: Globe,

      label: canManageMarketplaces
        ? 'Marketplaces'
        : 'View Marketplaces',

      allowed: canViewMarketplaces,
    },

    {
      href: '/admin/content',

      icon: FileText,

      label: canManageFaqs
        ? 'Manage FAQs'
        : 'View FAQs',

      allowed: canViewFaqs,
    },

    {
      href: '/admin/settings',

      icon: Settings,

      label: 'Website Settings',

      allowed: canViewSettings,
    },
  ].filter((action) => action.allowed);

  // ========================================
  // RENDER ADMIN DASHBOARD
  // ========================================

  return (
    <div className="w-full min-w-0">

      {/* DASHBOARD HEADING */}

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            AERON PROFESSIONAL Admin Overview
          </p>
        </div>

        {canCreateProducts && (
          <Link
            href="/admin/products/new"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-black px-4 py-3 text-xs font-bold tracking-wider text-white transition hover:bg-gray-800"
          >
            <Plus size={16} />
            ADD PRODUCT
          </Link>
        )}

      </div>

      {/* DASHBOARD STATISTICS */}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* TOTAL PRODUCTS */}

        {canViewProducts && (
          <div className="min-w-0 rounded-lg border border-gray-200 bg-white p-5">

            <Package
              size={22}
              className="mb-4 text-[#977447]"
            />

            <div className="text-3xl font-bold text-gray-900">
              {stats.totalProducts}
            </div>

            <div className="mt-1 text-xs uppercase tracking-wider text-gray-500">
              Total Products
            </div>

            <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">

              <div className="flex justify-between text-xs">
                <span className="text-green-600">
                  Active
                </span>

                <span>
                  {stats.activeProducts}
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-orange-600">
                  Sold Out
                </span>

                <span>
                  {stats.soldOutProducts}
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-gray-500">
                  Draft
                </span>

                <span>
                  {stats.draftProducts}
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-red-500">
                  Archived
                </span>

                <span>
                  {stats.archivedProducts}
                </span>
              </div>

            </div>

          </div>
        )}

        {/* CATEGORIES */}

        {canViewCategories && (
          <div className="min-w-0 rounded-lg border border-gray-200 bg-white p-5">

            <Tags
              size={22}
              className="mb-4 text-[#977447]"
            />

            <div className="text-3xl font-bold text-gray-900">
              {stats.totalCategories}
            </div>

            <div className="mt-1 text-xs uppercase tracking-wider text-gray-500">
              Published Categories
            </div>

            <Link
              href="/admin/categories"
              className="mt-5 inline-block text-xs font-medium text-[#977447] hover:underline"
            >
              {canManageCategories
                ? 'Manage categories'
                : 'View categories'} →
            </Link>

          </div>
        )}

        {/* BANNERS */}

        {canViewBanners && (
          <div className="min-w-0 rounded-lg border border-gray-200 bg-white p-5">

            <Image
              size={22}
              className="mb-4 text-[#977447]"
            />

            <div className="text-3xl font-bold text-gray-900">
              {stats.activeBanners}
            </div>

            <div className="mt-1 text-xs uppercase tracking-wider text-gray-500">
              Enabled Banners
            </div>

            <Link
              href="/admin/banners"
              className="mt-5 inline-block text-xs font-medium text-[#977447] hover:underline"
            >
              {canManageBanners
                ? 'Manage banners'
                : 'View banners'} →
            </Link>

          </div>
        )}

        {/* DISCOUNTS */}

        {canViewDiscounts && (
          <div className="min-w-0 rounded-lg border border-gray-200 bg-white p-5">

            <Percent
              size={22}
              className="mb-4 text-[#977447]"
            />

            <div className="text-3xl font-bold text-gray-900">
              {stats.activeDiscounts}
            </div>

            <div className="mt-1 text-xs uppercase tracking-wider text-gray-500">
              Enabled Discounts
            </div>

            <Link
              href="/admin/discounts"
              className="mt-5 inline-block text-xs font-medium text-[#977447] hover:underline"
            >
              {canManageDiscounts
                ? 'Manage discounts'
                : 'View discounts'} →
            </Link>

          </div>
        )}

      </div>

      {/* RECENT PRODUCTS AND QUICK ACTIONS */}

      <div className="grid min-w-0 gap-6 xl:grid-cols-2">

        {/* RECENT PRODUCTS */}

        {canViewProducts && (
          <section className="min-w-0 rounded-lg border border-gray-200 bg-white p-5">

            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

              <h2 className="font-semibold text-gray-900">
                Recently Updated Products
              </h2>

              <Link
                href="/admin/products"
                className="text-xs font-medium text-gray-500 hover:text-black"
              >
                View all →
              </Link>

            </div>

            {stats.recentProducts.length === 0 ? (

              <div className="rounded-md border border-dashed border-gray-200 py-10 text-center">

                <Package
                  size={28}
                  className="mx-auto text-gray-400"
                />

                <p className="mt-3 text-sm text-gray-500">
                  No products added yet.
                </p>

                {canCreateProducts && (
                  <Link
                    href="/admin/products/new"
                    className="mt-3 inline-block text-xs font-semibold text-[#977447] hover:underline"
                  >
                    Add your first product
                  </Link>
                )}

              </div>

            ) : (

              <div className="divide-y divide-gray-100">

                {stats.recentProducts.map((product) => (

                  <div
                    key={product.id}
                    className="flex min-w-0 items-center justify-between gap-3 py-4"
                  >

                    <div className="min-w-0">

                      {canUpdateProducts ? (

                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="break-words text-sm font-medium text-gray-900 transition hover:text-[#977447]"
                        >
                          {product.name}
                        </Link>

                      ) : (

                        <span className="break-words text-sm font-medium text-gray-900">
                          {product.name}
                        </span>

                      )}

                      <p className="mt-1 text-xs text-gray-400">
                        {product.updatedAt.toLocaleDateString(
                          'en-IN',
                          {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            timeZone: 'Asia/Kolkata',
                          }
                        )}
                      </p>

                    </div>

                    <span
                      className={`shrink-0 rounded px-2 py-1 text-[9px] font-bold uppercase ${
                        statusColors[product.status] ||
                        'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {product.status.replace(/_/g, ' ')}
                    </span>

                  </div>

                ))}

              </div>

            )}

          </section>
        )}

        {/* ROLE-BASED QUICK ACTIONS */}

        {quickActions.length > 0 && (
          <section className="min-w-0 rounded-lg border border-gray-200 bg-white p-5">

            <h2 className="mb-5 font-semibold text-gray-900">
              Quick Actions
            </h2>

            <div className="grid grid-cols-2 gap-3">

              {quickActions.map((action) => {

                const Icon = action.icon;

                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex min-w-0 flex-col items-center justify-center gap-3 rounded-md border border-gray-200 p-5 text-center transition hover:border-[#977447] hover:bg-[#faf9f6]"
                  >

                    <Icon
                      size={23}
                      className="text-gray-600 transition group-hover:text-[#977447]"
                    />

                    <span className="text-xs font-semibold text-gray-700">
                      {action.label}
                    </span>

                  </Link>
                );
              })}

            </div>

          </section>
        )}

      </div>

    </div>
  );
}