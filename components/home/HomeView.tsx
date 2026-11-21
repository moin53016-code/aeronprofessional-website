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
  onBuyNow: (product: Product) => void;
}

/**
 * Composite view for the Home landing page
 */
export const HomeView: React.FC<HomeViewProps> = ({
  promoSlides,
  currentSlide,
  categories,
  products,
  onSlideChange,
  onNavigate,
  onSelectProduct,
  onBuyNow,
}) => {
  const bestsellers = products.slice(0, 4);
  const newAndNoteworthy = products.slice(4);

  return (
    <main>
      {/* 1. Hero Carousel */}
      <HeroSlider
        slides={promoSlides}
        currentSlide={currentSlide}
        onSlideChange={onSlideChange}
        onNavigate={onNavigate}
      />

      {/* 2. Key Value Highlights */}
      <ValueProps />

      {/* 3. Category Browser */}
      <CategoryGrid
        categories={categories}
        onSelectCategory={(categoryName) => onNavigate(categoryName)}
      />

      {/* 4. The Bestsellers Showcase */}
      <ProductShowcase
        tag="CURATED FOR YOU"
        title="The Bestsellers"
        buttonLabel="VIEW ALL"
        backgroundColor="bg-[#eeebe5]"
        products={bestsellers}
        onViewAll={() => onNavigate('Shop All')}
        onSelectProduct={onSelectProduct}
        onBuyNow={onBuyNow}
      />

      {/* 5. Editorial Storytelling Banner */}
      <EditorialBanner onNavigate={onNavigate} />

      {/* 6. New & Noteworthy Showcase */}
      <ProductShowcase
        tag="EXPLORE MORE"
        title="New & Noteworthy"
        buttonLabel="SHOP ALL"
        products={newAndNoteworthy}
        onViewAll={() => onNavigate('Shop All')}
        onSelectProduct={onSelectProduct}
        onBuyNow={onBuyNow}
      />

      {/* 7. Brand Pillars / Difference */}
      <BrandDifference />

      {/* 8. Coming Soon Editorial */}
      <ComingSoonBanner onNavigate={onNavigate} />
    </main>
  );
};

export default HomeView;