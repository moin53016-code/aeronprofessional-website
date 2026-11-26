'use client';

import Link from 'next/link';

import { usePathname } from 'next/navigation';

import {
  LayoutDashboard,
  Package,
  Tags,
  Image,
  Percent,
  Settings,
  FileText,
  ChevronRight,
  Store,
} from 'lucide-react';

import {
  PERMISSIONS,
  hasAllPermissions,
} from '@/lib/permissions';

import type {
  Permission,
} from '@/lib/permissions';

import type {
  Role,
} from '@/generated/prisma/enums';

// ==========================================
// ADMIN SIDEBAR PROPS
// ==========================================

interface AdminSidebarProps {
  role?: Role;
}

// ==========================================
// NAVIGATION ITEM TYPE
// ==========================================

interface NavItem {
  href: string;

  label: string;

  icon: typeof LayoutDashboard;

  exact?: boolean;

  permissions: readonly Permission[];
}

// ==========================================
// ROLE-BASED ADMIN NAVIGATION
// ==========================================

const NAV_ITEMS: readonly NavItem[] = [

  // DASHBOARD

  {
    href: '/admin',

    label: 'Dashboard',

    icon: LayoutDashboard,

    exact: true,

    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
    ],
  },

  // PRODUCTS

  {
    href: '/admin/products',

    label: 'Products',

    icon: Package,

    permissions: [
      PERMISSIONS.PRODUCT_VIEW,
    ],
  },

  // CATEGORIES

  {
    href: '/admin/categories',

    label: 'Categories',

    icon: Tags,

    permissions: [
      PERMISSIONS.CATEGORY_VIEW,
    ],
  },

  // BANNERS

  {
    href: '/admin/banners',

    label: 'Banners',

    icon: Image,

    permissions: [
      PERMISSIONS.BANNER_VIEW,
      PERMISSIONS.BANNER_MANAGE,
    ],
  },

  // MARKETPLACES

  {
    href: '/admin/marketplaces',

    label: 'Marketplaces',

    icon: Store,

    permissions: [
      PERMISSIONS.MARKETPLACE_VIEW,
    ],
  },

  // DISCOUNTS

  {
    href: '/admin/discounts',

    label: 'Discounts',

    icon: Percent,

    permissions: [
      PERMISSIONS.DISCOUNT_VIEW,
    ],
  },

  // CONTENT MANAGEMENT

  {
    href: '/admin/content',

    label: 'Content',

    icon: FileText,

    permissions: [
      PERMISSIONS.CONTENT_VIEW,
      PERMISSIONS.CONTENT_MANAGE,
      PERMISSIONS.FAQ_VIEW,
      PERMISSIONS.FAQ_MANAGE,
    ],
  },

  // WEBSITE SETTINGS

  {
    href: '/admin/settings',

    label: 'Settings',

    icon: Settings,

    permissions: [
      PERMISSIONS.SETTINGS_VIEW,
      PERMISSIONS.SETTINGS_MANAGE,
    ],
  },
];

// ==========================================
// ADMIN SIDEBAR COMPONENT
// ==========================================

export default function AdminSidebar({
  role,
}: AdminSidebarProps) {

  const pathname = usePathname();

  // ========================================
  // FILTER NAVIGATION USING USER PERMISSIONS
  // ========================================

  const allowedNavItems =
    NAV_ITEMS.filter((item) =>
      hasAllPermissions(
        role,
        item.permissions
      )
    );

  // ========================================
  // RENDER ROLE-BASED SIDEBAR
  // ========================================

  return (
    <aside className="w-64 bg-[#141414] text-white flex flex-col min-h-screen shrink-0 hidden lg:flex">

      {/* AERON BRAND HEADER */}

      <div className="p-6 border-b border-white/10">

        <div className="text-sm font-bold tracking-[.2em]">
          AERON
        </div>

        <div className="text-[9px] tracking-[.3em] text-[#c6a77a] mt-0.5">
          P R O F E S S I O N A L
        </div>

        <div className="text-[10px] text-gray-400 mt-1">
          Admin Panel
        </div>

      </div>

      {/* AUTHORIZED NAVIGATION LINKS */}

      <nav
        aria-label="Admin navigation"
        className="flex-1 py-4"
      >

        {allowedNavItems.map((item) => {

          // ==================================
          // DETERMINE ACTIVE NAVIGATION ITEM
          // ==================================

          const isActive =
            item.exact
              ? pathname === item.href
              : pathname === item.href ||
                pathname.startsWith(
                  `${item.href}/`
                );

          const Icon = item.icon;

          return (
            <Link
              key={item.href}

              href={item.href}

              aria-current={
                isActive
                  ? 'page'
                  : undefined
              }

              className={`flex items-center gap-3 px-6 py-3 text-sm transition ${
                isActive
                  ? 'bg-white/10 text-[#c6a77a] border-r-2 border-[#c6a77a]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >

              <Icon size={16} />

              {item.label}

              {isActive && (
                <ChevronRight
                  size={14}
                  className="ml-auto"
                />
              )}

            </Link>
          );
        })}

      </nav>

      {/* PUBLIC WEBSITE LINK */}

      <div className="p-6 border-t border-white/10">

        <Link
          href="/"

          target="_blank"

          rel="noopener noreferrer"

          className="text-xs text-gray-500 hover:text-gray-300 transition"
        >

          ↗ View Public Site

        </Link>

      </div>

    </aside>
  );
}