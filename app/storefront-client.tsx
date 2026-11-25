
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

  // Refresh server data while the website is visible.

  useEffect(() => {
    const refreshVisiblePage = () => {
      if (document.visibilityState === 'visible') {
        router.refresh();
      }
    };

    const intervalId = window.setInterval(
      refreshVisiblePage,
      15000
    );

    window.addEventListener(
      'focus',
      refreshVisiblePage
    );

    document.addEventListener(
      'visibilitychange',
      refreshVisiblePage
    );

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
    };
  }, [router]);

  // Keep the hero slider within its valid slide range.

  useEffect(() => {
    setActiveSlide((current) => {
      if (promoSlides.length === 0) return 0;

      return current >= promoSlides.length
        ? 0
        : current;
    });
  }, [promoSlides.length]);

  // Update open product dialogs when admin data changes.

  useEffect(() => {
    setSelectedProduct((current) => {
      if (!current) return null;

      return (
        products.find(
          (product) => product.id === current.id
        ) ?? null
      );
    });

    setWhereToBuyProduct((current) => {
      if (!current) return null;

      return (
        products.find(
          (product) => product.id === current.id
        ) ?? null
      );
    });
  }, [products]);

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

  const handleSearchSubmit = () => {
    setView('Shop All');
    setShowSearch(false);
    setIsMobileMenuOpen(false);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleWhereToBuy = (product: Product) => {
    setWhereToBuyProduct(product);
  };

  const isCustomerCare = view === 'Customer Care';

  return (
    <div className="min-h-screen">
      <AnnouncementBar settings={settings} />

      <Header
        activeView={view}
        showSearch={showSearch}
        searchQuery={search}
        onNavigate={navigateTo}
        onToggleSearch={() =>
          setShowSearch((previous) => !previous)
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
        <AboutView onNavigate={navigateTo} />
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

      {/* Footer appears on all storefront views
          EXCEPT Customer Care. */}

      {!isCustomerCare && (
        <Footer
          onOpenSupport={(tab) =>
            setSupportModalTab(tab)
          }
          settings={settings}
        />
      )}

      <ToastNotice notice="" />

      <SideDrawer
        isOpen={isMobileMenuOpen}
        categories={categories}
        onClose={() =>
          setIsMobileMenuOpen(false)
        }
        onNavigate={navigateTo}
      />

      <ProductDetailModal
        product={selectedProduct}
        onClose={() =>
          setSelectedProduct(null)
        }
        onWhereToBuy={handleWhereToBuy}
      />

      <WhereToBuyModal
        product={whereToBuyProduct}
        onClose={() =>
          setWhereToBuyProduct(null)
        }
      />

      {/* Existing footer support functionality
          remains available on other pages. */}

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