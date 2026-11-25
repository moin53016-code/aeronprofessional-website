
import React from 'react';

import type {
  Product,
  Category,
  PromoSlide,
} from '@/types';

import { HeroSlider } from './HeroSlider';
import { ValueProps } from './ValueProps';
import { CategoryGrid } from './CategoryGrid';
import { ProductShowcase } from './ProductShowcase';
import { EditorialBanner } from './EditorialBanner';
import { BrandDifference } from './BrandDifference';

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
  const activeProducts = products
    .filter(
      (product) =>
        product.status === 'ACTIVE' ||
        product.status === 'SOLD_OUT'
    )
    .sort(
      (a, b) => a.displayOrder - b.displayOrder
    );

  const featured = activeProducts
    .filter((product) => product.isFeatured)
    .slice(0, 8);

  const newArrivals = activeProducts
    .filter((product) => product.isNew)
    .slice(0, 8);

  const showcaseFeatured =
    featured.length > 0
      ? featured
      : activeProducts.slice(0, 4);

  const showcaseNew =
    newArrivals.length > 0
      ? newArrivals
      : activeProducts.slice(4, 8);

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
        onSelectCategory={(categoryName) =>
          onNavigate(categoryName)
        }
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
    </main>
  );
};

export default HomeView;