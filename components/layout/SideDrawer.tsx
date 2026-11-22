
'use client';

import React, { useEffect, useRef } from 'react';
import {
  X,
  ArrowRight,
} from 'lucide-react';

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

  // Prevent scrolling behind the drawer.
  // Escape key closes the menu.
  // Restore focus when the drawer closes.

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow =
      document.body.style.overflow;

    const previousFocus =
      document.activeElement as HTMLElement | null;

    document.body.style.overflow = 'hidden';

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }

      if (event.key === 'Tab') {
        const drawer = document.getElementById(
          'aeron-mobile-navigation'
        );

        if (!drawer) return;

        const focusableElements =
          drawer.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled)'
          );

        if (!focusableElements.length) return;

        const first = focusableElements[0];

        const last =
          focusableElements[focusableElements.length - 1];

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
      }
    };

    document.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.removeEventListener(
        'keydown',
        handleKeyDown
      );

      previousFocus?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const primaryItems = [
    { label: 'Home', view: 'Home' },
    { label: 'Shop All', view: 'Shop All' },
  ];

  const categoryItems = categories.map(
    (category) => ({
      label: category.label || category.name,
      view: category.name,
    })
  );

  const secondaryItems = [
    {
      label: 'Salon Collection',
      view: 'Professional Collection',
    },
    { label: 'Our Story', view: 'About Us' },
  ];

  const handleNavigate = (view: string) => {
    onNavigate(view);
    onClose();
  };

  return (
    <div
      className="
        fixed
        inset-0
        z-[70]
        xl:hidden
      "
    >
      {/* BACKDROP */}

      <div
        className="
          absolute
          inset-0
          bg-black/60
        "
        onClick={onClose}
        aria-hidden="true"
      />

      {/* SIDE DRAWER */}

      <aside
        id="aeron-mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-labelledby="aeron-menu-title"
        className="
          absolute
          right-0
          top-0
          flex
          h-screen
          h-[100dvh]
          w-full
          max-w-[420px]
          flex-col
          overflow-hidden
          bg-[#faf9f6]
          shadow-2xl
          sm:w-[420px]
        "
      >
        {/* DRAWER HEADER */}

        <div
          className="
            flex
            shrink-0
            items-center
            justify-between
            gap-3
            border-b
            border-[#e5e1d9]
            px-5
            py-5
            sm:px-6
          "
        >
          <div className="min-w-0">
            <p
              className="
                text-[10px]
                font-bold
                tracking-[0.2em]
                text-[#977447]
              "
            >
              AERON PROFESSIONAL
            </p>

            <h2
              id="aeron-menu-title"
              className="
                serif
                mt-1
                text-2xl
                text-[#191919]
              "
            >
              Explore AERON
            </h2>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-md
              border
              border-[#e5e1d9]
              bg-white
              transition-colors
              hover:bg-gray-100
              focus-visible:outline
              focus-visible:outline-2
              focus-visible:outline-black
            "
          >
            <X size={22} />
          </button>
        </div>

        {/* SCROLLABLE MENU CONTENT */}

        <nav
          aria-label="Mobile navigation"
          className="
            min-h-0
            flex-1
            overflow-y-auto
            overscroll-contain
            px-5
            py-5
            sm:px-6
          "
        >
          {/* PRIMARY LINKS */}

          <div className="space-y-1">
            {primaryItems.map((item) => (
              <button
                key={item.view}
                type="button"
                onClick={() =>
                  handleNavigate(item.view)
                }
                className="
                  flex
                  min-h-12
                  w-full
                  items-center
                  justify-between
                  gap-3
                  border-b
                  border-[#e9e5de]
                  py-3
                  text-left
                  text-sm
                  font-semibold
                  transition-colors
                  hover:text-[#987345]
                "
              >
                <span>{item.label}</span>

                <ArrowRight
                  size={16}
                  className="shrink-0"
                />
              </button>
            ))}
          </div>

          {/* CATEGORIES */}

          {categoryItems.length > 0 && (
            <div className="mt-7">
              <p
                className="
                  mb-3
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.2em]
                  text-[#977447]
                "
              >
                Shop by Category
              </p>

              <div className="space-y-1">
                {categoryItems.map((item) => (
                  <button
                    key={item.view}
                    type="button"
                    onClick={() =>
                      handleNavigate(item.view)
                    }
                    className="
                      flex
                      min-h-12
                      w-full
                      items-center
                      justify-between
                      gap-3
                      border-b
                      border-[#e9e5de]
                      py-3
                      text-left
                      text-sm
                      font-medium
                      transition-colors
                      hover:text-[#987345]
                    "
                  >
                    <span className="min-w-0 break-words">
                      {item.label}
                    </span>

                    <ArrowRight
                      size={16}
                      className="shrink-0"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* OTHER LINKS */}

          <div className="mt-7">
            <p
              className="
                mb-3
                text-[10px]
                font-bold
                uppercase
                tracking-[0.2em]
                text-[#977447]
              "
            >
              Discover
            </p>

            <div className="space-y-1">
              {secondaryItems.map((item) => (
                <button
                  key={item.view}
                  type="button"
                  onClick={() =>
                    handleNavigate(item.view)
                  }
                  className="
                    flex
                    min-h-12
                    w-full
                    items-center
                    justify-between
                    gap-3
                    border-b
                    border-[#e9e5de]
                    py-3
                    text-left
                    text-sm
                    font-medium
                    transition-colors
                    hover:text-[#987345]
                  "
                >
                  <span>{item.label}</span>

                  <ArrowRight
                    size={16}
                    className="shrink-0"
                  />
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* DRAWER FOOTER */}

        <div
          className="
            shrink-0
            border-t
            border-[#e5e1d9]
            bg-[#f1eee8]
            px-5
            py-4
            text-center
            sm:px-6
          "
        >
          <p
            className="
              text-[10px]
              font-semibold
              tracking-[0.14em]
              text-[#977447]
            "
          >
            ELEVATE YOUR EVERYDAY STYLE
          </p>
        </div>
      </aside>
    </div>
  );
};

export default SideDrawer;
