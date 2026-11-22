'use client';

import { useState, useMemo } from 'react';
import { Product, SortOption } from '@/types';

export function useProductFilters(products: Product[], initialView: string = 'Home') {
  const [view, setView] = useState<string>(initialView);
  const [search, setSearch] = useState<string>('');
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [sort, setSort] = useState<SortOption>('featured');

  // Dynamic max price from actual catalog
  const catalogMaxPrice = useMemo(() => {
    if (products.length === 0) return 10000;
    return Math.max(...products.map((p) => p.originalPrice ?? p.price), 10000);
  }, [products]);

  const [maxPrice, setMaxPrice] = useState<number>(catalogMaxPrice);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Only show ACTIVE and SOLD_OUT products on public site
        if (p.status !== 'ACTIVE' && p.status !== 'SOLD_OUT') return false;

        const matchesCategory =
          view === 'Shop All' ||
          view === 'Home' ||
          view === 'Professional Collection' ||
          p.category === view;

        const matchesPrice = p.price <= maxPrice;

        const matchesSearch = (p.name + ' ' + p.category)
          .toLowerCase()
          .includes(search.toLowerCase());

        return matchesCategory && matchesPrice && matchesSearch;
      })
      .sort((a, b) => {
        if (sort === 'low') return a.price - b.price;
        if (sort === 'high') return b.price - a.price;
        if (sort === 'newest') {
          const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          return bDate - aDate;
        }
        // 'featured': featured first, then by displayOrder
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return a.displayOrder - b.displayOrder;
      });
  }, [products, view, maxPrice, search, sort]);

  const clearFilters = () => {
    setMaxPrice(catalogMaxPrice);
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
