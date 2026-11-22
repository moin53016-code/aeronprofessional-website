'use client';

import React, { useState } from 'react';
import { Product, Category, PromoSlide, SiteSettings, SortOption } from '@/types';
import { useProductFilters } from '@/hooks/useProductFilters';
import { AnnouncementBar } from '@/components/common/AnnouncementBar';
import { ToastNotice } from '@/components/common/ToastNotice';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SideDrawer } from '@/components/layout/SideDrawer';
import { HomeView } from '@/components/home/HomeView';
import { ShopView } from '@/components/shop/ShopView';
import { AboutView } from '@/components/about/AboutView';
import { ProductDetailModal } from '@/components/modals/ProductDetailModal';
import { WhereToBuyModal } from '@/components/modals/WhereToBuyModal';
import { SupportModal, SupportTab } from '@/components/modals/SupportModal';

interface StorefrontClientProps {
  products: Product[];
  categories: Category[];
  promoSlides: PromoSlide[];
  settings: SiteSettings;
  faqs?: Array<{ question: string; answer: string }>;
}

export default function StorefrontClient({
  products,
  categories,
  promoSlides,
  settings,
  faqs,
}: StorefrontClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [whereToBuyProduct, setWhereToBuyProduct] = useState<Product | null>(null);
  const [supportModalTab, setSupportModalTab] = useState<SupportTab>(null);
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [notice, setNotice] = useState<string>('');

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

  const navigateTo = (targetView: string) => {
    setView(targetView);
    setIsMobileMenuOpen(false);
    setSelectedProduct(null);
    setShowSearch(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWhereToBuy = (product: Product) => {
    setWhereToBuyProduct(product);
  };

  return (
    <div className="min-h-screen">
      <AnnouncementBar settings={settings} />

      <Header
        showSearch={showSearch}
        searchQuery={search}
        onNavigate={navigateTo}
        onToggleSearch={() => setShowSearch((prev) => !prev)}
        onSearchChange={(query) => {
          setSearch(query);
          setView('Shop All');
        }}
        onSearchSubmit={() => navigateTo('Shop All')}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
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
          }}
          onPriceChange={setMaxPrice}
          onSearchChange={setSearch}
          onSortChange={(s) => setSort(s as SortOption)}
          onClearFilters={clearFilters}
          onSelectProduct={setSelectedProduct}
          onWhereToBuy={handleWhereToBuy}
        />
      )}

      <Footer
        onNavigate={navigateTo}
        onOpenSupport={(tab) => setSupportModalTab(tab)}
        settings={settings}
      />

      <ToastNotice notice={notice} />

      <SideDrawer
        isOpen={isMobileMenuOpen}
        categories={categories}
        onClose={() => setIsMobileMenuOpen(false)}
        onNavigate={navigateTo}
      />

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onWhereToBuy={handleWhereToBuy}
      />

      <WhereToBuyModal
        product={whereToBuyProduct}
        onClose={() => setWhereToBuyProduct(null)}
      />

      <SupportModal
        activeTab={supportModalTab}
        onClose={() => setSupportModalTab(null)}
        settings={settings}
        faqs={faqs}
      />
    </div>
  );
}
