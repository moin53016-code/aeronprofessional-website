import React from 'react';
import { Product, Category, PromoSlide } from '@/types';
import { HeroSlider } from './HeroSlider';
import { ValueProps } from './ValueProps';
import { CategoryGrid } from './CategoryGrid';
import { ProductShowcase } from './ProductShowcase';
import { EditorialBanner } from './EditorialBanner';
import { BrandDifference } from './BrandDifference';
import { ComingSoonBanner } from './ComingSoonBanner';

interface HomeViewProps {
  promoSlides: PromoSlide[];
  currentSlide: number;
  categories: Category[];
  products: Product[];
  onSlideChange: (index: number) => void;
  onNavigate: (view: string) => void;
  onSelectProduct: (product: Product) => void;
  onWhereToBuy: (product: Product) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  promoSlides,
  currentSlide,
  categories,
  products,
  onSlideChange,
  onNavigate,
  onSelectProduct,
  onWhereToBuy,
}) => {
  // Use admin-managed flags instead of array positions
  const featured = products
    .filter((p) => p.isFeatured && (p.status === 'ACTIVE' || p.status === 'SOLD_OUT'))
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .slice(0, 8);

  const newArrivals = products
    .filter((p) => p.isNew && (p.status === 'ACTIVE' || p.status === 'SOLD_OUT'))
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .slice(0, 8);

  // Fallback: if no featured/new set, show first N products
  const showcaseFeatured = featured.length > 0
    ? featured
    : products.filter((p) => p.status === 'ACTIVE' || p.status === 'SOLD_OUT').slice(0, 4);

  const showcaseNew = newArrivals.length > 0
    ? newArrivals
    : products.filter((p) => p.status === 'ACTIVE' || p.status === 'SOLD_OUT').slice(4, 8);

  return (
    <main>
      <HeroSlider
        slides={promoSlides}
        currentSlide={currentSlide}
        onSlideChange={onSlideChange}
        onNavigate={onNavigate}
      />

      <ValueProps />

      <CategoryGrid
        categories={categories}
        onSelectCategory={(categoryName) => onNavigate(categoryName)}
      />

      <ProductShowcase
        tag="CURATED FOR YOU"
        title="Featured Products"
        buttonLabel="VIEW ALL"
        backgroundColor="bg-[#eeebe5]"
        products={showcaseFeatured}
        onViewAll={() => onNavigate('Shop All')}
        onSelectProduct={onSelectProduct}
        onBuyNow={onWhereToBuy}
      />

      <EditorialBanner onNavigate={onNavigate} />

      <ProductShowcase
        tag="EXPLORE MORE"
        title="New Arrivals"
        buttonLabel="SHOP ALL"
        products={showcaseNew}
        onViewAll={() => onNavigate('Shop All')}
        onSelectProduct={onSelectProduct}
        onBuyNow={onWhereToBuy}
      />

      <BrandDifference />

      <ComingSoonBanner onNavigate={onNavigate} />
    </main>
  );
};

export default HomeView;
