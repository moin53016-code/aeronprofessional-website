'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Tags, Image, Percent,
  Settings, FileText, ChevronRight, Store
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/banners', label: 'Banners', icon: Image },
  { href: '/admin/marketplaces', label: 'Marketplaces', icon: Store },
  { href: '/admin/discounts', label: 'Discounts', icon: Percent },
  { href: '/admin/content', label: 'Content', icon: FileText },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#141414] text-white flex flex-col min-h-screen shrink-0 hidden lg:flex">
      <div className="p-6 border-b border-white/10">
        <div className="text-sm font-bold tracking-[.2em]">AERON</div>
        <div className="text-[9px] tracking-[.3em] text-[#c6a77a] mt-0.5">P R O F E S S I O N A L</div>
        <div className="text-[10px] text-gray-400 mt-1">Admin Panel</div>
      </div>

      <nav className="flex-1 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 text-sm transition ${
                isActive
                  ? 'bg-white/10 text-[#c6a77a] border-r-2 border-[#c6a77a]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={16} />
              {item.label}
              {isActive && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-white/10">
        <Link href="/" target="_blank" className="text-xs text-gray-500 hover:text-gray-300 transition">
          ↗ View Public Site
        </Link>
      </div>
    </aside>
  );
}
