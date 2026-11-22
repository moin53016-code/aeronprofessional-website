
import React from 'react';
import { Menu, Search, X } from 'lucide-react';

interface HeaderProps {
  showSearch: boolean;
  searchQuery: string;
  onNavigate: (view: string) => void;
  onToggleSearch: () => void;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  onOpenMobileMenu: () => void;
}

const navigationItems = [
  { label: 'Home', view: 'Home' },
  { label: 'Shop All', view: 'Shop All' },
  { label: 'Straighteners', view: 'Straighteners' },
  { label: 'Hair Dryers', view: 'Hair Dryers' },
  {
    label: 'Salon Collection',
    view: 'Professional Collection',
  },
  { label: 'Our Story', view: 'About Us' },
];

export const Header: React.FC<HeaderProps> = ({
  showSearch,
  searchQuery,
  onNavigate,
  onToggleSearch,
  onSearchChange,
  onSearchSubmit,
  onOpenMobileMenu,
}) => {
  return (
    <header
      className="
        sticky
        top-0
        z-40
        w-full
        min-w-0
        border-b
        border-[#e5e1d9]
        bg-[#faf9f6]/95
        backdrop-blur-md
      "
    >
      {/* MAIN HEADER */}

      <div
        className="
          relative
          mx-auto
          flex
          h-[64px]
          w-full
          max-w-7xl
          items-center
          justify-between
          gap-3
          px-4
          sm:h-[72px]
          sm:px-6
          xl:h-[78px]
          xl:px-8
        "
      >
        {/* MOBILE / TABLET MENU BUTTON */}

        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-md
            transition-colors
            hover:bg-[#eee9df]
            focus-visible:outline
            focus-visible:outline-2
            focus-visible:outline-black
            xl:hidden
          "
        >
          <Menu size={23} />
        </button>

        {/* BRAND LOGO */}

        <button
          type="button"
          onClick={() => onNavigate('Home')}
          aria-label="AERON Professional - Home"
          className="
            absolute
            left-1/2
            flex
            max-w-[calc(100%-120px)]
            -translate-x-1/2
            flex-col
            items-center
            justify-center
            text-center
            leading-none
            xl:static
            xl:max-w-none
            xl:translate-x-0
            xl:items-start
            xl:text-left
          "
        >
          <span
            className="
              block
              text-[19px]
              font-semibold
              tracking-[0.22em]
              sm:text-[23px]
              xl:text-[24px]
            "
          >
            AERON
          </span>

          <span
            className="
              mt-1
              block
              whitespace-nowrap
              text-[7px]
              font-medium
              tracking-[0.16em]
              text-[#977447]
              sm:text-[9px]
              sm:tracking-[0.2em]
            "
          >
            PROFESSIONAL
          </span>
        </button>

        {/* DESKTOP NAVIGATION */}

        <nav
          aria-label="Main navigation"
          className="
            hidden
            min-w-0
            items-center
            justify-center
            gap-4
            xl:flex
            2xl:gap-7
          "
        >
          {navigationItems.map((item) => (
            <button
              key={item.view}
              type="button"
              onClick={() => onNavigate(item.view)}
              className="
                navlink
                whitespace-nowrap
                py-3
                text-[10px]
                transition-colors
                hover:text-[#ae8857]
                2xl:text-[11px]
              "
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* SEARCH BUTTON */}

        <div className="ml-auto flex shrink-0 items-center">
          <button
            type="button"
            onClick={onToggleSearch}
            aria-label={
              showSearch ? 'Close search' : 'Open search'
            }
            aria-expanded={showSearch}
            aria-controls="aeron-header-search"
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-md
              transition-colors
              hover:bg-[#eee9df]
              hover:text-[#9e7b50]
              focus-visible:outline
              focus-visible:outline-2
              focus-visible:outline-black
            "
          >
            {showSearch ? (
              <X size={21} />
            ) : (
              <Search size={21} />
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
          className="
            mx-auto
            flex
            w-full
            max-w-7xl
            min-w-0
            flex-col
            gap-2
            border-t
            border-[#e5e1d9]
            px-4
            py-3
            min-[420px]:flex-row
            sm:gap-3
            sm:px-6
            xl:px-8
          "
        >
          <input
            autoFocus
            type="search"
            value={searchQuery}
            onChange={(event) =>
              onSearchChange(event.target.value)
            }
            aria-label="Search AERON products"
            placeholder="Search straighteners, dryers, brushes..."
            className="
              field
              min-h-11
              min-w-0
              flex-1
              text-sm
            "
          />

          <button
            type="submit"
            className="
              inline-flex
              min-h-11
              items-center
              justify-center
              gap-2
              bg-[#171717]
              px-6
              py-3
              text-xs
              font-bold
              tracking-wider
              text-white
              transition-colors
              hover:bg-[#9b784c]
            "
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
