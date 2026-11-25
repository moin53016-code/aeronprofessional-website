
'use client';

import {
  useMemo,
  useState,
} from 'react';

import type {
  Product,
  SortOption,
} from '@/types';

export function useProductFilters(
  products: Product[],
  initialView: string = 'Home'
) {
  const [view, setView] = useState(initialView);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const [sort, setSort] =
    useState<SortOption>('featured');

  const [priceLimit, setPriceLimit] =
    useState<number | null>(null);

  const catalogMaxPrice = useMemo(() => {
    const highest = products.reduce(
      (maximum, product) =>
        Math.max(
          maximum,
          product.price,
          product.originalPrice ?? 0
        ),
      10000
    );

    return Math.ceil(highest / 100) * 100;
  }, [products]);

  const maxPrice =
    priceLimit === null
      ? catalogMaxPrice
      : Math.min(priceLimit, catalogMaxPrice);

  const setMaxPrice = (value: number) => {
    if (!Number.isFinite(value)) return;

    setPriceLimit(
      value >= catalogMaxPrice
        ? null
        : Math.max(0, value)
    );
  };

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products
      .filter((product) => {
        if (
          product.status !== 'ACTIVE' &&
          product.status !== 'SOLD_OUT'
        ) {
          return false;
        }

        const matchesCategory =
          view === 'Home' ||
          view === 'Shop All' ||
          view === 'Professional Collection' ||
          product.category === view;

        const matchesPrice =
          product.price <= maxPrice;

        const searchableText = [
          product.name,
          product.category,
          product.description,
          product.shortDescription ?? '',
          ...product.specs,
        ].join(' ').toLowerCase();

        return (
          matchesCategory &&
          matchesPrice &&
          searchableText.includes(query)
        );
      })
      .sort((a, b) => {
        switch (sort) {
          case 'low':
            return a.price - b.price;

          case 'high':
            return b.price - a.price;

          case 'newest':
            return (
              (b.publishedAt
                ? Date.parse(b.publishedAt) || 0
                : 0) -
              (a.publishedAt
                ? Date.parse(a.publishedAt) || 0
                : 0)
            );

          default:
            return (
              Number(b.isFeatured) -
                Number(a.isFeatured) ||
              a.displayOrder - b.displayOrder
            );
        }
      });
  }, [
    products,
    view,
    search,
    maxPrice,
    sort,
  ]);

  const clearFilters = () => {
    setPriceLimit(null);
    setSearch('');
    setSort('featured');
  };

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
