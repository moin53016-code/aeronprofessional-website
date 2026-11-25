
'use client';

import {
  useMemo,
  useState,
} from 'react';

import type {
  Product,
  SortOption,
} from '@/types';

// GLOBAL PRODUCT COLLECTION VIEWS

const GLOBAL_VIEWS = new Set([
  'home',
  'shop all',
  'professional collection',
]);

// NORMALIZE SEARCH AND CATEGORY TEXT

function normalizeText(
  value: string
): string {
  return value.trim().toLowerCase();
}

// CHECK PRODUCT CATEGORY MEMBERSHIP

function matchesProductCategory(
  product: Product,
  view: string
): boolean {
  const normalizedView =
    normalizeText(view);

  // SHOW ALL PRODUCTS IN GLOBAL VIEWS

  if (GLOBAL_VIEWS.has(normalizedView)) {
    return true;
  }

  // CHECK ALL ASSIGNED CATEGORY IDS

  if (
    product.categoryIds?.includes(view)
  ) {
    return true;
  }

  // CHECK ALL ASSIGNED CATEGORY NAMES

  if (
    Array.isArray(product.categoryNames)
  ) {
    return product.categoryNames.some(
      (name) =>
        normalizeText(name) ===
        normalizedView
    );
  }

  // PRIMARY CATEGORY FALLBACK

  return (
    product.categoryId === view ||
    normalizeText(product.category) ===
      normalizedView
  );
}

// GET PRODUCT PUBLISHING TIMESTAMP

function getPublishedTimestamp(
  product: Product
): number {
  if (!product.publishedAt) return 0;

  return (
    Date.parse(product.publishedAt) || 0
  );
}

// STABLE PRODUCT SORTING

function compareDisplayOrder(
  a: Product,
  b: Product
): number {
  return (
    a.displayOrder - b.displayOrder ||
    a.name.localeCompare(b.name) ||
    a.id.localeCompare(b.id)
  );
}

// MAIN PRODUCT FILTER HOOK

export function useProductFilters(
  products: Product[],
  initialView: string = 'Home'
) {
  // VIEW STATE

  const [view, setView] =
    useState(initialView);

  // SEARCH STATE

  const [search, setSearch] =
    useState('');

  const [showSearch, setShowSearch] =
    useState(false);

  // SORTING STATE

  const [sort, setSort] =
    useState<SortOption>('featured');

  // PRICE FILTER STATE

  const [priceLimit, setPriceLimit] =
    useState<number | null>(null);

  // PUBLIC PRODUCTS ONLY

  const publicProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.status === 'ACTIVE' ||
          product.status === 'SOLD_OUT'
      ),
    [products]
  );

  // CALCULATE DYNAMIC MAXIMUM PRICE

  const catalogMaxPrice = useMemo(() => {
    const highestPrice =
      publicProducts.reduce(
        (maximum, product) => {
          const sellingPrice =
            Number.isFinite(product.price)
              ? product.price
              : 0;

          const originalPrice =
            typeof product.originalPrice === 'number' &&
            Number.isFinite(product.originalPrice)
              ? product.originalPrice
              : 0;

          return Math.max(
            maximum,
            sellingPrice,
            originalPrice
          );
        },
        10000
      );

    return (
      Math.ceil(highestPrice / 100) * 100
    );
  }, [publicProducts]);

  // CURRENT PRICE LIMIT

  const maxPrice =
    priceLimit === null
      ? catalogMaxPrice
      : Math.min(
          priceLimit,
          catalogMaxPrice
        );

  // UPDATE MAXIMUM PRICE

  const setMaxPrice = (
    value: number
  ) => {
    if (!Number.isFinite(value)) return;

    setPriceLimit(
      value >= catalogMaxPrice
        ? null
        : Math.max(0, value)
    );
  };

  // FILTER AND SORT PRODUCTS

  const filteredProducts = useMemo(() => {
    const query = normalizeText(search);

    // SUPPORT MULTIPLE SEARCH WORDS

    const searchTerms = query
      .split(/\s+/)
      .filter(Boolean);

    return publicProducts
      .filter((product) => {

        // MULTIPLE CATEGORY FILTERING

        const matchesCategory =
          matchesProductCategory(
            product,
            view
          );

        // PRICE FILTERING

        const matchesPrice =
          Number.isFinite(product.price) &&
          product.price >= 0 &&
          product.price <= maxPrice;

        // SEARCH ALL PRODUCT INFORMATION

        const searchableText = [
          product.name,
          product.slug,
          product.category,

          ...(product.categoryNames ?? []),

          product.description,
          product.shortDescription ?? '',
          product.badge ?? '',

          ...product.specs,
        ]
          .join(' ')
          .toLowerCase();

        // ALL SEARCH WORDS MUST MATCH

        const matchesSearch =
          searchTerms.every(
            (term) =>
              searchableText.includes(term)
          );

        return (
          matchesCategory &&
          matchesPrice &&
          matchesSearch
        );
      })

      // PRODUCT SORTING

      .sort((a, b) => {
        switch (sort) {

          // PRICE: LOW TO HIGH

          case 'low':
            return (
              a.price - b.price ||
              compareDisplayOrder(a, b)
            );

          // PRICE: HIGH TO LOW

          case 'high':
            return (
              b.price - a.price ||
              compareDisplayOrder(a, b)
            );

          // NEWEST PRODUCTS FIRST

          case 'newest':
            return (
              getPublishedTimestamp(b) -
              getPublishedTimestamp(a) ||
              compareDisplayOrder(a, b)
            );

          // FEATURED SORTING

          default:
            return (
              Number(b.isFeatured) -
                Number(a.isFeatured) ||
              compareDisplayOrder(a, b)
            );
        }
      });
  }, [
    publicProducts,
    view,
    search,
    maxPrice,
    sort,
  ]);

  // RESET ALL PRODUCT FILTERS

  const clearFilters = () => {
    setPriceLimit(null);

    setSearch('');

    setSort('featured');
  };

  // RETURN EXISTING HOOK INTERFACE

  return {
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
  };
}
