
'use client';

import React from 'react';
import { Menu, Search, X } from 'lucide-react';

interface HeaderProps {
  showSearch: boolean;
  searchQuery: string;
  activeView?: string;
  onNavigate: (view: string) => void;
  onToggleSearch: () => void;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  onOpenMobileMenu: () => void;
}

const navigationItems = [
  { label: 'Home', view: 'Home' },
  { label: 'Shop All', view: 'Shop All' },
  { label: 'About Us', view: 'About Us' },
  { label: 'Customer Care', view: 'Customer Care' },
];

export const Header: React.FC<HeaderProps> = ({
  showSearch,
  searchQuery,
  activeView,
  onNavigate,
  onToggleSearch,
  onSearchChange,
  onSearchSubmit,
  onOpenMobileMenu,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#e5e1d9] bg-[#faf9f6]/95 backdrop-blur-md">
      <div className="relative mx-auto flex h-[70px] w-full max-w-7xl items-center justify-between px-4 sm:h-[76px] sm:px-6 lg:h-[88px] lg:px-8">
        {/* MOBILE / TABLET MENU - LEFT */}

        <div className="flex w-12 items-center justify-start lg:hidden">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="flex h-11 w-11 items-center justify-center rounded-md transition-colors hover:bg-[#eee9df] focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* MOBILE / TABLET LOGO - CENTER */}

        <button
          type="button"
          onClick={() => onNavigate('Home')}
          aria-label="AERON Professional home"
          className="absolute left-1/2 top-1/2 flex h-[64px] w-[74px] -translate-x-1/2 -translate-y-1/2 items-center justify-center lg:hidden"
        >
          <img
            src="/aeron-header-logo.png"
            alt="AERON Professional"
            width={74}
            height={70}
            className="block max-h-full max-w-full object-contain"
            draggable={false}
          />
        </button>

        {/* DESKTOP LOGO - LEFT */}

        <div className="hidden w-[148px] shrink-0 items-center justify-start lg:flex">
          <button
            type="button"
            onClick={() => onNavigate('Home')}
            aria-label="AERON Professional home"
            className="flex h-[78px] w-[90px] items-center justify-center transition-opacity hover:opacity-80"
          >
            <img
              src="/aeron-header-logo.png"
              alt="AERON Professional"
              width={90}
              height={78}
              className="block max-h-full max-w-full object-contain"
              draggable={false}
            />
          </button>
        </div>

        {/* DESKTOP NAVIGATION - CENTER */}

        <nav
          aria-label="Main navigation"
          className="hidden min-w-0 flex-1 items-center justify-center gap-5 lg:flex xl:gap-9"
        >
          {navigationItems.map((item) => {
            const isActive =
              activeView === item.view ||
              (item.view === 'Shop All' &&
                activeView !== 'Home' &&
                activeView !== 'About Us' &&
                activeView !== 'Customer Care');

            return (
              <button
                key={item.view}
                type="button"
                onClick={() => onNavigate(item.view)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative whitespace-nowrap py-3 text-[12px] font-semibold tracking-[0.04em] transition-colors xl:text-[13px] ${
                  isActive
                    ? 'text-[#a47c49]'
                    : 'text-[#181818] hover:text-[#a47c49]'
                }`}
              >
                {item.label}

                {isActive && (
                  <span className="absolute bottom-1 left-0 h-[2px] w-full bg-[#a47c49]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* SEARCH - RIGHT */}

        <div className="flex w-12 shrink-0 items-center justify-end lg:w-[148px]">
          <button
            type="button"
            onClick={onToggleSearch}
            aria-label={
              showSearch ? 'Close search' : 'Open search'
            }
            aria-expanded={showSearch}
            aria-controls="aeron-header-search"
            className="flex h-11 w-11 items-center justify-center rounded-md transition-colors hover:bg-[#eee9df] hover:text-[#9e7b50] focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
          >
            {showSearch ? (
              <X size={23} />
            ) : (
              <Search size={23} />
            )}
          </button>
        </div>
      </div>

      {/* RESPONSIVE SEARCH BAR */}

      {showSearch && (
        <form
          id="aeron-header-search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            onSearchSubmit();
          }}
          className="mx-auto flex w-full max-w-7xl flex-col gap-2 border-t border-[#e5e1d9] px-4 py-3 min-[420px]:flex-row sm:gap-3 sm:px-6 lg:px-8"
        >
          <input
            autoFocus
            type="search"
            value={searchQuery}
            onChange={(event) =>
              onSearchChange(event.target.value)
            }
            aria-label="Search AERON products"
            placeholder="Search styling tools..."
            className="field min-h-11 min-w-0 flex-1 text-sm"
          />

          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#171717] px-6 py-3 text-xs font-bold tracking-wider text-white transition-colors hover:bg-[#9b784c]"
          >
            <Search size={15} />
            SEARCH
          </button>
        </form>
      )}
    </header>
  );
};

export default Header;
