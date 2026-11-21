'use client';

import React, { useState } from 'react';

// Data & Types
import { products } from '@/data/products';
import { categories } from '@/data/categories';
import { promoSlides } from '@/data/promo';
import { Product } from '@/types';

// Custom Hooks
import { useProductFilters } from '@/hooks/useProductFilters';

// Shared & Layout Components
import { AnnouncementBar } from '@/components/common/AnnouncementBar';
import { ToastNotice } from '@/components/common/ToastNotice';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SideDrawer } from '@/components/layout/SideDrawer';

// Page Views
import { HomeView } from '@/components/home/HomeView';
import { ShopView } from '@/components/shop/ShopView';
import { AboutView } from '@/components/about/AboutView';

// Modals
import { ProductDetailModal } from '@/components/modals/ProductDetailModal';
import { WhereToBuyModal } from '@/components/modals/WhereToBuyModal';
import { SupportModal, SupportTab } from '@/components/modals/SupportModal';

/**
 * Main Application Orchestrator for AERON PROFESSIONAL Storefront
 */
export default function Home() {
  // Navigation & Modal State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [buyNowProduct, setBuyNowProduct] = useState<Product | null>(null);
  const [supportModalTab, setSupportModalTab] = useState<SupportTab>(null);
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [notice, setNotice] = useState<string>('');

  // Catalog Filtering & Sorting
  const {
    view,
    search,
    showSearch,
    sort,
    maxPrice,
    filteredProducts,
    setView,
    setSearch,
    setShowSearch,
    setSort,
    setMaxPrice,
    clearFilters,
  } = useProductFilters(products, 'Home');

  // Navigation Handler
  const navigateTo = (targetView: string) => {
    setView(targetView);
    setIsMobileMenuOpen(false);
    setSelectedProduct(null);
    setShowSearch(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Where to Buy / External Store Selection Handler
  const handleBuyNow = (product: Product) => {
    setBuyNowProduct(product);
  };

  return (
    <div className="min-h-screen">
      {/* 1. Global Announcement Banner */}
      <AnnouncementBar />

      {/* 2. Sticky Header with Search & Mobile Menu */}
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

      {/* 3. Main Dynamic Content View */}
      {view === 'Home' ? (
        <HomeView
          promoSlides={promoSlides}
          currentSlide={activeSlide}
          categories={categories}
          products={products}
          onSlideChange={setActiveSlide}
          onNavigate={navigateTo}
          onSelectProduct={setSelectedProduct}
          onBuyNow={handleBuyNow}
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
          onSelectCategory={(category) => {
            setView(category);
            setSearch('');
          }}
          onPriceChange={setMaxPrice}
          onSearchChange={setSearch}
          onSortChange={setSort}
          onClearFilters={clearFilters}
          onSelectProduct={setSelectedProduct}
          onBuyNow={handleBuyNow}
        />
      )}

      {/* 4. Global Footer with Zero-Backend Support Links */}
      <Footer
        onNavigate={navigateTo}
        onOpenSupport={(tab) => setSupportModalTab(tab)}
      />

      {/* 5. Notification Toast */}
      <ToastNotice notice={notice} />

      {/* 6. Mobile Navigation Drawer */}
      <SideDrawer
        isOpen={isMobileMenuOpen}
        categories={categories}
        onClose={() => setIsMobileMenuOpen(false)}
        onNavigate={navigateTo}
      />

      {/* 7. Product Detail Quick-View Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onBuyNow={handleBuyNow}
      />

      {/* 8. Where To Buy External Stores Modal */}
      <WhereToBuyModal
        product={buyNowProduct}
        onClose={() => setBuyNowProduct(null)}
      />

      {/* 9. Zero-Backend Customer Care Modal (Contact, FAQs, Warranty, Bulk) */}
      <SupportModal
        activeTab={supportModalTab}
        onClose={() => setSupportModalTab(null)}
      />
    </div>
  );
}