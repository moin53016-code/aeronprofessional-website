
'use client';

import React, { useEffect, useRef } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { Category } from '@/types';

interface SideDrawerProps {
  isOpen: boolean;
  categories: Category[];
  onClose: () => void;
  onNavigate: (view: string) => void;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({
  isOpen,
  categories,
  onClose,
  onNavigate,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus =
      document.activeElement as HTMLElement | null;

    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }

      if (event.key !== 'Tab') return;

      const drawer = document.getElementById(
        'aeron-mobile-navigation'
      );

      if (!drawer) return;

      const elements = drawer.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], input:not(:disabled)'
      );

      if (!elements.length) return;

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // The drawer is mobile/tablet only.
    // Close it if screen becomes desktop width.
    const media = window.matchMedia('(min-width: 1024px)');

    const handleDesktop = () => {
      if (media.matches) onClose();
    };

    media.addEventListener('change', handleDesktop);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener(
        'keydown',
        handleKeyDown
      );
      media.removeEventListener('change', handleDesktop);
      previousFocus?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const primaryItems = [
    { label: 'Home', view: 'Home' },
    { label: 'Shop All', view: 'Shop All' },
  ];

  const categoryItems = categories.map((category) => ({
    label: category.label || category.name,
    view: category.name,
    id: category.id,
  }));

  const secondaryItems = [
    { label: 'About Us', view: 'About Us' },
    { label: 'Customer Care', view: 'Customer Care' },
  ];

  const handleNavigate = (view: string) => {
    onNavigate(view);
    onClose();
  };

  const navButtonClass =
    'flex min-h-14 w-full items-center justify-between gap-3 border-b border-[#e9e5de] py-3 text-left text-[15px] font-medium text-[#191919] transition-colors hover:text-[#987345]';

  return (
    <div className="fixed inset-0 z-[70] lg:hidden">
      {/* BACKDROP */}

      <button
        type="button"
        onClick={onClose}
        aria-label="Close navigation menu"
        className="absolute inset-0 h-full w-full cursor-default bg-black/60"
      />

      {/* DRAWER */}

      <aside
        id="aeron-mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-labelledby="aeron-menu-title"
        className="absolute left-0 top-0 flex h-screen h-[100dvh] w-[min(100%,420px)] flex-col overflow-hidden rounded-r-xl bg-[#faf9f6] shadow-2xl"
      >
        {/* HEADER */}

        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#e5e1d9] px-5 py-5 sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-[0.22em] text-[#977447]">
              AERON PROFESSIONAL
            </p>

            <h2
              id="aeron-menu-title"
              className="serif mt-2 text-[27px] leading-tight text-[#191919]"
            >
              Explore AERON
            </h2>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[#e5e1d9] bg-white hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
          >
            <X size={23} />
          </button>
        </div>

        {/* SCROLLABLE CONTENT */}

        <nav
          aria-label="Mobile navigation"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6"
        >
          <div>
            {primaryItems.map((item) => (
              <button
                key={item.view}
                type="button"
                onClick={() => handleNavigate(item.view)}
                className={`${navButtonClass} font-semibold`}
              >
                <span>{item.label}</span>
                <ArrowRight size={17} className="shrink-0" />
              </button>
            ))}
          </div>

          {/* DYNAMIC CATEGORIES */}

          {categoryItems.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#977447]">
                Shop by Category
              </p>

              {categoryItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.view)}
                  className={navButtonClass}
                >
                  <span className="min-w-0 break-words">
                    {item.label}
                  </span>
                  <ArrowRight
                    size={17}
                    className="shrink-0"
                  />
                </button>
              ))}
            </div>
          )}

          {/* ABOUT / CUSTOMER CARE */}

          <div className="mt-8">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#977447]">
              Discover
            </p>

            {secondaryItems.map((item) => (
              <button
                key={item.view}
                type="button"
                onClick={() => handleNavigate(item.view)}
                className={navButtonClass}
              >
                <span>{item.label}</span>
                <ArrowRight size={17} className="shrink-0" />
              </button>
            ))}
          </div>
        </nav>

        {/* BOTTOM */}

        <div className="shrink-0 border-t border-[#e5e1d9] bg-[#f1eee8] px-5 py-4 text-center">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-[#977447]">
            ELEVATE YOUR EVERYDAY STYLE
          </p>
        </div>
      </aside>
    </div>
  );
};

export default SideDrawer;
