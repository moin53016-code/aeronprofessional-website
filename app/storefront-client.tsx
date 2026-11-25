
'use client';

import React, {
  useEffect,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import {
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

import { CustomerCareView } from '@/components/customer-care/CustomerCareView';

import { ProductDetailModal } from '@/components/modals/ProductDetailModal';
import { WhereToBuyModal } from '@/components/modals/WhereToBuyModal';

import {
  SupportModal,
  SupportTab,
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
  ] = useState<boolean>(false);

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
  ] = useState<number>(0);

  const [
    notice,
    setNotice,
  ] = useState<string>('');

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

  // REFRESH ADMIN-MANAGED WEBSITE DATA
  // Every 15 seconds while tab is visible.

  useEffect(() => {
    const refreshWebsite = () => {
      if (document.visibilityState === 'visible') {
        router.refresh();
      }
    };

    const interval = window.setInterval(
      refreshWebsite,
      15000
    );

    window.addEventListener(
      'focus',
      refreshWebsite
    );

    document.addEventListener(
      'visibilitychange',
      refreshWebsite
    );

    return () => {
      window.clearInterval(interval);

      window.removeEventListener(
        'focus',
        refreshWebsite
      );

      document.removeEventListener(
        'visibilitychange',
        refreshWebsite
      );
    };
  }, [router]);

  // KEEP PRODUCT MODALS UPDATED

  useEffect(() => {
    if (selectedProduct) {
      const latest = products.find(
        (product) =>
          product.id === selectedProduct.id
      );

      if (!latest) {
        setSelectedProduct(null);
      } else if (latest !== selectedProduct) {
        setSelectedProduct(latest);
      }
    }

    if (whereToBuyProduct) {
      const latest = products.find(
        (product) =>
          product.id === whereToBuyProduct.id
      );

      if (!latest) {
        setWhereToBuyProduct(null);
      } else if (latest !== whereToBuyProduct) {
        setWhereToBuyProduct(latest);
      }
    }
  }, [
    products,
    selectedProduct,
    whereToBuyProduct,
  ]);

  // KEEP HERO SLIDER INDEX IN RANGE

  useEffect(() => {
    if (
      promoSlides.length === 0 ||
      activeSlide >= promoSlides.length
    ) {
      setActiveSlide(0);
    }
  }, [
    promoSlides.length,
    activeSlide,
  ]);

  // MAIN NAVIGATION

  const navigateTo = (targetView: string) => {
    setView(targetView);

    setIsMobileMenuOpen(false);
    setSelectedProduct(null);
    setWhereToBuyProduct(null);
    setSupportModalTab(null);
    setShowSearch(false);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // PRODUCT MARKETPLACE ACTION

  const handleWhereToBuy = (product: Product) => {
    setWhereToBuyProduct(product);
  };

  return (
    <div className="min-h-screen">
      {/* ANNOUNCEMENT */}

      <AnnouncementBar settings={settings} />

      {/* RESPONSIVE HEADER */}

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
        onSearchSubmit={() =>
          navigateTo('Shop All')
        }
        onOpenMobileMenu={() =>
          setIsMobileMenuOpen(true)
        }
      />

      {/* MAIN PAGE SWITCHING */}

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
      ) : view === 'Customer Care' ? (
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

      {/* FOOTER WITHOUT EXPLORE COLUMN */}

      <Footer
        onOpenSupport={(tab) =>
          setSupportModalTab(tab)
        }
        settings={settings}
      />

      {/* NOTIFICATIONS */}

      <ToastNotice notice={notice} />

      {/* MOBILE / TABLET DRAWER */}

      <SideDrawer
        isOpen={isMobileMenuOpen}
        categories={categories}
        onClose={() =>
          setIsMobileMenuOpen(false)
        }
        onNavigate={navigateTo}
      />

      {/* PRODUCT DETAILS MODAL */}

      <ProductDetailModal
        product={selectedProduct}
        onClose={() =>
          setSelectedProduct(null)
        }
        onWhereToBuy={handleWhereToBuy}
      />

      {/* MARKETPLACE MODAL */}

      <WhereToBuyModal
        product={whereToBuyProduct}
        onClose={() =>
          setWhereToBuyProduct(null)
        }
      />

      {/* EXISTING FOOTER SUPPORT MODAL */}

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
