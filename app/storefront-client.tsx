'use client';

import React, {
  useEffect,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import type {
  Product,
  Category,
  PromoSlide,
  SiteSettings,
  SortOption,
} from '@/types';

import { useProductFilters } from '@/hooks/useProductFilters';

import { AnnouncementBar } from '@/components/common/AnnouncementBar';
import { ToastNotice } from '@/components/common/ToastNotice';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SideDrawer } from '@/components/layout/SideDrawer';

import { HomeView } from '@/components/home/HomeView';
import { ShopView } from '@/components/shop/ShopView';
import { AboutView } from '@/components/about/AboutView';

import CustomerCareView from '@/components/customer-care/CustomerCareView';

import { ProductDetailModal } from '@/components/modals/ProductDetailModal';
import { WhereToBuyModal } from '@/components/modals/WhereToBuyModal';

import {
  SupportModal,
  type SupportTab,
} from '@/components/modals/SupportModal';

// STOREFRONT REFRESH CONFIGURATION

const REFRESH_INTERVAL = 60000;

const MIN_REFRESH_GAP = 15000;

// STOREFRONT PROPS

interface StorefrontClientProps {
  products: Product[];

  categories: Category[];

  promoSlides: PromoSlide[];

  settings: SiteSettings;

  faqs?: Array<{
    question: string;
    answer: string;
  }>;
}

export default function StorefrontClient({
  products,
  categories,
  promoSlides,
  settings,
  faqs,
}: StorefrontClientProps) {

  const router = useRouter();

  const [
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  ] = useState(false);

  const [
    selectedProduct,
    setSelectedProduct,
  ] = useState<Product | null>(null);

  const [
    whereToBuyProduct,
    setWhereToBuyProduct,
  ] = useState<Product | null>(null);

  const [
    supportModalTab,
    setSupportModalTab,
  ] = useState<SupportTab>(null);

  const [
    activeSlide,
    setActiveSlide,
  ] = useState(0);

  const {
    view,
    search,
    showSearch,
    sort,
    maxPrice,
    catalogMaxPrice,
    filteredProducts,
    setView,
    setSearch,
    setShowSearch,
    setSort,
    setMaxPrice,
    clearFilters,
  } = useProductFilters(products, 'Home');

  // OPTIMIZED AUTOMATIC DATA REFRESH

  useEffect(() => {

    let lastRefreshAt = Date.now();

    const refreshVisiblePage = () => {

      // DO NOT REFRESH BACKGROUND TABS

      if (
        document.visibilityState !== 'visible'
      ) {
        return;
      }

      // DO NOT REFRESH WHILE OFFLINE

      if (!navigator.onLine) {
        return;
      }

      const now = Date.now();

      // PREVENT REPEATED REFRESH REQUESTS

      if (
        now - lastRefreshAt < MIN_REFRESH_GAP
      ) {
        return;
      }

      lastRefreshAt = now;

      router.refresh();
    };

    // REFRESH ACTIVE WEBSITE EVERY 60 SECONDS

    const intervalId = window.setInterval(
      refreshVisiblePage,
      REFRESH_INTERVAL
    );

    // REFRESH WHEN USER RETURNS TO WEBSITE

    window.addEventListener(
      'focus',
      refreshVisiblePage
    );

    document.addEventListener(
      'visibilitychange',
      refreshVisiblePage
    );

    // REFRESH AFTER INTERNET RECONNECTION

    window.addEventListener(
      'online',
      refreshVisiblePage
    );

    // CLEANUP EVENT LISTENERS

    return () => {

      window.clearInterval(intervalId);

      window.removeEventListener(
        'focus',
        refreshVisiblePage
      );

      document.removeEventListener(
        'visibilitychange',
        refreshVisiblePage
      );

      window.removeEventListener(
        'online',
        refreshVisiblePage
      );
    };

  }, [router]);

  // KEEP HERO SLIDER WITHIN VALID RANGE

  useEffect(() => {

    setActiveSlide((current) => {

      if (promoSlides.length === 0) {
        return 0;
      }

      return current >= promoSlides.length
        ? 0
        : current;
    });

  }, [promoSlides.length]);

  // KEEP PRODUCT DIALOGS SYNCHRONIZED

  useEffect(() => {

    setSelectedProduct((current) => {

      if (!current) {
        return null;
      }

      return (
        products.find(
          (product) =>
            product.id === current.id
        ) ?? null
      );
    });

    setWhereToBuyProduct((current) => {

      if (!current) {
        return null;
      }

      return (
        products.find(
          (product) =>
            product.id === current.id
        ) ?? null
      );
    });

  }, [products]);

  // STOREFRONT NAVIGATION

  const navigateTo = (targetView: string) => {

    setView(targetView);

    setIsMobileMenuOpen(false);

    setSelectedProduct(null);

    setWhereToBuyProduct(null);

    setSupportModalTab(null);

    setShowSearch(false);

    if (typeof window !== 'undefined') {

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  // PRODUCT SEARCH

  const handleSearchSubmit = () => {

    setView('Shop All');

    setShowSearch(false);

    setIsMobileMenuOpen(false);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // MARKETPLACE DIALOG

  const handleWhereToBuy = (
    product: Product
  ) => {

    setWhereToBuyProduct(product);
  };

  const isCustomerCare =
    view === 'Customer Care';

  // STOREFRONT UI

  return (
    <div className="min-h-screen">

      <AnnouncementBar
        settings={settings}
      />

      <Header
        activeView={view}
        showSearch={showSearch}
        searchQuery={search}
        onNavigate={navigateTo}
        onToggleSearch={() =>
          setShowSearch(
            (previous) => !previous
          )
        }
        onSearchChange={(query) => {
          setSearch(query);
          setView('Shop All');
        }}
        onSearchSubmit={handleSearchSubmit}
        onOpenMobileMenu={() =>
          setIsMobileMenuOpen(true)
        }
      />

      {view === 'Home' ? (

        <HomeView
          promoSlides={promoSlides}
          currentSlide={activeSlide}
          categories={categories}
          products={products}
          onSlideChange={setActiveSlide}
          onNavigate={navigateTo}
          onSelectProduct={setSelectedProduct}
          onWhereToBuy={handleWhereToBuy}
        />

      ) : view === 'About Us' ? (

        <AboutView
          onNavigate={navigateTo}
        />

      ) : isCustomerCare ? (

        <CustomerCareView
          settings={settings}
          faqs={faqs}
        />

      ) : (

        <ShopView
          view={view}
          categories={categories}
          products={filteredProducts}
          search={search}
          sort={sort}
          maxPrice={maxPrice}
          maxCatalogPrice={catalogMaxPrice}
          onSelectCategory={(category) => {

            setView(category);

            setSearch('');

            setShowSearch(false);

            window.scrollTo({
              top: 0,
              behavior: 'smooth',
            });
          }}
          onPriceChange={setMaxPrice}
          onSearchChange={setSearch}
          onSortChange={(value) =>
            setSort(value as SortOption)
          }
          onClearFilters={clearFilters}
          onSelectProduct={setSelectedProduct}
          onWhereToBuy={handleWhereToBuy}
        />

      )}

      {/* STOREFRONT FOOTER */}

      {!isCustomerCare && (

        <Footer
          onOpenSupport={(tab) =>
            setSupportModalTab(tab)
          }
          settings={settings}
        />

      )}

      <ToastNotice notice="" />

      {/* MOBILE NAVIGATION */}

      <SideDrawer
        isOpen={isMobileMenuOpen}
        categories={categories}
        onClose={() =>
          setIsMobileMenuOpen(false)
        }
        onNavigate={navigateTo}
      />

      {/* PRODUCT DETAILS */}

      <ProductDetailModal
        product={selectedProduct}
        onClose={() =>
          setSelectedProduct(null)
        }
        onWhereToBuy={handleWhereToBuy}
      />

      {/* MARKETPLACE LINKS */}

      <WhereToBuyModal
        product={whereToBuyProduct}
        onClose={() =>
          setWhereToBuyProduct(null)
        }
      />

      {/* CUSTOMER SUPPORT */}

      <SupportModal
        activeTab={supportModalTab}
        onClose={() =>
          setSupportModalTab(null)
        }
        settings={settings}
        faqs={faqs}
      />

    </div>
  );
}