import React from 'react';
import { Menu, Search } from 'lucide-react';

interface HeaderProps {
  showSearch: boolean;
  searchQuery: string;
  onNavigate: (view: string) => void;
  onToggleSearch: () => void;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  onOpenMobileMenu: () => void;
}

/**
 * Sticky global navigation header with search toggle and mobile menu trigger
 */
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
    <header className="sticky top-0 z-40 bg-[#faf9f6]/95 backdrop-blur border-b border-[#e5e1d9]">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 flex items-center justify-between h-[78px]">
        {/* Mobile menu trigger */}
        <button
          className="lg:hidden"
          aria-label="Open menu"
          onClick={onOpenMobileMenu}
        >
          <Menu size={23} />
        </button>

        {/* Brand Logo */}
        <button onClick={() => onNavigate('Home')} className="text-left leading-none">
          <span className="block font-semibold tracking-[.24em] text-xl md:text-2xl">
            AERON
          </span>
          <span className="block text-[9px] md:text-[10px] tracking-[.36em] mt-1 text-[#977447]">
            P R O F E S S I O N A L
          </span>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex gap-7">
          <button className="navlink" onClick={() => onNavigate('Home')}>
            Home
          </button>
          <button className="navlink" onClick={() => onNavigate('Shop All')}>
            Shop All
          </button>
          <button className="navlink" onClick={() => onNavigate('Straighteners')}>
            Straighteners
          </button>
          <button className="navlink" onClick={() => onNavigate('Hair Dryers')}>
            Hair Dryers
          </button>
          <button
            className="navlink"
            onClick={() => onNavigate('Professional Collection')}
          >
            Salon Collection
          </button>
          <button className="navlink" onClick={() => onNavigate('About Us')}>
            Our Story
          </button>
        </nav>

        {/* Right Action: Search */}
        <div className="flex items-center gap-4">
          <button
            aria-label="Search"
            onClick={onToggleSearch}
            className="p-2 hover:text-[#9e7b50] transition"
          >
            <Search size={21} />
          </button>
        </div>
      </div>

      {/* Expandable Search Input */}
      {showSearch && (
        <div className="max-w-7xl mx-auto px-5 pb-4 flex gap-3">
          <input
            autoFocus
            className="field"
            placeholder="Search straighteners, dryers, brushes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <button className="btn btn-dark" onClick={onSearchSubmit}>
            SEARCH
          </button>
        </div>
      )}
    </header>
  );
};