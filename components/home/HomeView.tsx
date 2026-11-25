
import React, { useMemo } from 'react';

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

// NORMALIZE CATEGORY NAMES

function normalizeName(
  value: string
): string {
  return value.trim().toLowerCase();
}

// CALCULATE ACCURATE DISCOUNT PERCENTAGE

function getDiscountPercentage(
  product: Product
): number {
  const originalPrice = product.originalPrice;

  const sellingPrice = product.price;

  if (
    typeof originalPrice !== 'number' ||
    !Number.isFinite(originalPrice) ||
    !Number.isFinite(sellingPrice) ||
    originalPrice <= 0 ||
    sellingPrice < 0 ||
    sellingPrice >= originalPrice
  ) {
    return 0;
  }

  return (
    ((originalPrice - sellingPrice) /
      originalPrice) *
    100
  );
}

// CHECK ALL ASSIGNED PRODUCT CATEGORIES

function belongsToCategory(
  product: Product,
  category: Category
): boolean {

  // MULTIPLE CATEGORY SUPPORT

  if (Array.isArray(product.categoryIds)) {
    return product.categoryIds.includes(
      category.id
    );
  }

  // PRIMARY CATEGORY FALLBACK

  if (product.categoryId) {
    return product.categoryId === category.id;
  }

  // CATEGORY NAME FALLBACK

  if (
    Array.isArray(product.categoryNames) &&
    product.categoryNames.length > 0
  ) {
    return product.categoryNames.some(
      (name) =>
        normalizeName(name) ===
        normalizeName(category.name)
    );
  }

  return (
    normalizeName(product.category) ===
    normalizeName(category.name)
  );
}

// SORT PRODUCTS BY BEST DISCOUNT

function compareProducts(
  a: Product,
  b: Product
): number {

  // HIGHEST DISCOUNT FIRST

  const discountDifference =
    getDiscountPercentage(b) -
    getDiscountPercentage(a);

  if (discountDifference !== 0) {
    return discountDifference;
  }

  // ADMIN DISPLAY ORDER

  const orderDifference =
    a.displayOrder - b.displayOrder;

  if (orderDifference !== 0) {
    return orderDifference;
  }

  // STABLE FINAL SORTING

  return a.id.localeCompare(b.id);
}

// SELECT ONE PRODUCT PER CATEGORY

function getFeaturedProducts(
  products: Product[],
  categories: Category[]
): Product[] {

  // ONLY AVAILABLE PRODUCTS

  const activeProducts = products
    .filter(
      (product) =>
        product.status === 'ACTIVE'
    )
    .sort(compareProducts);

  // FOLLOW ADMIN CATEGORY DISPLAY ORDER

  const sortedCategories = [...categories].sort(
    (a, b) =>
      a.displayOrder - b.displayOrder ||
      a.name.localeCompare(b.name) ||
      a.id.localeCompare(b.id)
  );

  // PREVENT DUPLICATE PRODUCT CARDS

  const selectedIds = new Set<string>();

  const featuredProducts: Product[] = [];

  for (const category of sortedCategories) {

    // FIND HIGHEST-DISCOUNT AVAILABLE PRODUCT

    const bestProduct = activeProducts.find(
      (product) =>
        !selectedIds.has(product.id) &&
        belongsToCategory(
          product,
          category
        )
    );

    // SKIP EMPTY CATEGORIES

    if (!bestProduct) {
      continue;
    }

    featuredProducts.push(bestProduct);

    selectedIds.add(bestProduct.id);
  }

  return featuredProducts;
}

// MAIN HOMEPAGE

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

  // AUTOMATIC FEATURED PRODUCT SELECTION

  const featuredProducts = useMemo(
    () =>
      getFeaturedProducts(
        products,
        categories
      ),
    [products, categories]
  );

  return (
    <main>

      {/* HOMEPAGE HERO SLIDER */}

      <HeroSlider
        slides={promoSlides}
        currentSlide={currentSlide}
        onSlideChange={onSlideChange}
        onNavigate={onNavigate}
      />

      {/* BRAND VALUE PROPOSITIONS */}

      <ValueProps />

      {/* PRODUCT CATEGORIES */}

      <CategoryGrid
        categories={categories}
        onSelectCategory={(categoryName) =>
          onNavigate(categoryName)
        }
      />

      {/* AUTOMATIC FEATURED PRODUCTS */}

      {featuredProducts.length > 0 && (

        <ProductShowcase
          tag="CURATED FOR YOU"
          title="Featured Products"
          buttonLabel="VIEW ALL"
          backgroundColor="bg-[#eeebe5]"
          products={featuredProducts}
          onViewAll={() =>
            onNavigate('Shop All')
          }
          onSelectProduct={onSelectProduct}
          onBuyNow={onWhereToBuy}
        />

      )}

      {/* EDITORIAL BANNER */}

      <EditorialBanner
        onNavigate={onNavigate}
      />

      {/* BRAND DIFFERENCE */}

      <BrandDifference />

    </main>
  );
};

export default HomeView;
