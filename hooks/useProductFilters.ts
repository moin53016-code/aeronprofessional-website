'use client';

import { useState, useMemo } from 'react';
import { Product } from '@/types';

export function useProductFilters(products: Product[], initialView: string = 'Home') {
  const [view, setView] = useState<string>(initialView);
  const [search, setSearch] = useState<string>('');
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [sort, setSort] = useState<string>('featured');
  const [maxPrice, setMaxPrice] = useState<number>(6000);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
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
        if (sort === 'rating') return b.rating - a.rating;
        return a.id - b.id; // default 'featured'
      });
  }, [products, view, maxPrice, search, sort]);

  const clearFilters = () => {
    setMaxPrice(6000);
    setSearch('');
    setSort('featured');
  };

  return {
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
  };
}
