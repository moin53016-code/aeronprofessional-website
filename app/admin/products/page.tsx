
import Link from 'next/link';

import {
  Plus,
  Edit,
  Search,
  Package,
  RotateCcw,
} from 'lucide-react';

import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';
import { requireAdminPage } from '@/lib/admin-page';

import ProductStatusBadge from '@/components/admin/StatusBadge';
import ProductActions from '@/components/admin/ProductActions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SearchParams {
  search?: string;
  status?: string;
}

const PRODUCT_STATUSES = [
  'DRAFT',
  'ACTIVE',
  'SOLD_OUT',
  'ARCHIVED',
] as const;

type ProductStatus =
  (typeof PRODUCT_STATUSES)[number];

// VALIDATE PRODUCT STATUS

function isValidStatus(
  status: string
): status is ProductStatus {
  return PRODUCT_STATUSES.some(
    (item) => item === status
  );
}

// FORMAT PRICE FROM PAISE TO INR

function formatPrice(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

// LOAD PRODUCTS FROM DATABASE

async function getProducts(
  search: string,
  status: string
) {
  const where: Prisma.ProductWhereInput = {};

  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        sku: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        slug: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ];
  }

  if (isValidStatus(status)) {
    where.status = status;
  }

  return prisma.product.findMany({
    where,

    include: {
      categories: {
        include: {
          category: true,
        },
      },

      images: {
        orderBy: [
          {
            isPrimary: 'desc',
          },
          {
            displayOrder: 'asc',
          },
        ],

        take: 1,
      },
    },

    orderBy: [
      {
        updatedAt: 'desc',
      },
      {
        id: 'asc',
      },
    ],
  });
}

// ADMIN PRODUCTS PAGE

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // VERIFY ADMIN SESSION

  await requireAdminPage();

  const params = await searchParams;

  const search =
    typeof params.search === 'string'
      ? params.search.trim().slice(0, 200)
      : '';

  const status =
    typeof params.status === 'string' &&
    isValidStatus(params.status)
      ? params.status
      : '';

  // LOAD FRESH PRODUCTS
  // DATABASE ERRORS ARE HANDLED BY error.tsx

  const products = await getProducts(
    search,
    status
  );

  const hasFilters = Boolean(search || status);

  return (
    <div className="w-full min-w-0">

      {/* PAGE HEADER */}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Products
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {products.length}{' '}
            {products.length === 1
              ? 'product'
              : 'products'}
            {hasFilters ? ' found' : ''}
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-black px-4 py-3 text-xs font-bold tracking-wider text-white transition-colors hover:bg-gray-800"
        >
          <Plus size={16} />

          ADD PRODUCT
        </Link>

      </div>

      {/* SEARCH AND FILTERS */}

      <form
        method="GET"
        action="/admin/products"
        className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-4"
      >

        {/* SEARCH INPUT */}

        <div className="relative min-w-0 flex-1 basis-full sm:basis-[220px]">

          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="search"
            name="search"
            defaultValue={search}
            maxLength={200}
            placeholder="Search products or SKU..."
            aria-label="Search products"
            className="min-h-11 w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm outline-none focus:border-black"
          />

        </div>

        {/* STATUS FILTER */}

        <select
          name="status"
          defaultValue={status}
          aria-label="Filter by product status"
          className="min-h-11 min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-black sm:flex-none"
        >
          <option value="">
            All Status
          </option>

          <option value="DRAFT">
            Draft
          </option>

          <option value="ACTIVE">
            Active
          </option>

          <option value="SOLD_OUT">
            Sold Out
          </option>

          <option value="ARCHIVED">
            Archived
          </option>
        </select>

        {/* APPLY FILTER */}

        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-black px-5 py-2 text-xs font-bold tracking-wider text-white transition-colors hover:bg-gray-800"
        >
          FILTER
        </button>

        {/* RESET FILTER */}

        {hasFilters && (
          <Link
            href="/admin/products"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-600 transition-colors hover:border-black hover:text-black"
          >
            <RotateCcw size={14} />

            Reset
          </Link>
        )}

      </form>

      {/* PRODUCT LIST */}

      <div className="w-full min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white">

        {products.length === 0 ? (

          /* EMPTY STATE */

          <div className="px-5 py-16 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <Package size={28} />
            </div>

            <h2 className="mt-5 text-base font-semibold text-gray-900">
              {hasFilters
                ? 'No matching products'
                : 'No products added yet'}
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              {hasFilters
                ? 'Try another search or reset your filters.'
                : 'Create your first product to start building your catalog.'}
            </p>

            <Link
              href={
                hasFilters
                  ? '/admin/products'
                  : '/admin/products/new'
              }
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md bg-black px-5 py-2 text-xs font-semibold text-white hover:bg-gray-800"
            >
              {hasFilters
                ? 'CLEAR FILTERS'
                : 'ADD PRODUCT'}
            </Link>

          </div>

        ) : (

          /* RESPONSIVE PRODUCT TABLE */

          <div className="w-full overflow-x-auto">

            <table className="w-full min-w-[650px] text-sm">

              <thead className="border-b border-gray-200 bg-gray-50">

                <tr>
                  <th className="px-4 py-4 text-left text-xs font-bold tracking-wider text-gray-500">
                    PRODUCT
                  </th>

                  <th className="px-4 py-4 text-left text-xs font-bold tracking-wider text-gray-500">
                    CATEGORY
                  </th>

                  <th className="px-4 py-4 text-left text-xs font-bold tracking-wider text-gray-500">
                    PRICE
                  </th>

                  <th className="px-4 py-4 text-left text-xs font-bold tracking-wider text-gray-500">
                    STATUS
                  </th>

                  <th className="px-4 py-4 text-left text-xs font-bold tracking-wider text-gray-500">
                    ACTIONS
                  </th>
                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {products.map((product) => {
                  const imageUrl =
                    product.images[0]?.url ||
                    product.primaryImageUrl ||
                    '';

                  const categoryNames = product.categories
                    .map(
                      (item) => item.category.name
                    )
                    .join(', ');

                  return (
                    <tr
                      key={product.id}
                      className="transition-colors hover:bg-gray-50"
                    >

                      {/* PRODUCT INFORMATION */}

                      <td className="px-4 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-100 bg-gray-50">

                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={product.name}
                                loading="lazy"
                                className="block h-full w-full object-contain"
                              />
                            ) : (
                              <Package
                                size={22}
                                className="text-gray-300"
                              />
                            )}

                          </div>

                          <div className="min-w-0">

                            <Link
                              href={`/admin/products/${product.id}/edit`}
                              className="font-semibold text-gray-900 transition-colors hover:text-[#977447]"
                            >
                              {product.name}
                            </Link>

                            {product.sku && (
                              <p className="mt-1 text-[11px] text-gray-500">
                                SKU: {product.sku}
                              </p>
                            )}

                            {product.badgeText && (
                              <p className="mt-1 text-[10px] font-medium text-[#977447]">
                                {product.badgeText}
                              </p>
                            )}

                          </div>

                        </div>

                      </td>

                      {/* PRODUCT CATEGORIES */}

                      <td className="max-w-[220px] break-words px-4 py-4 text-xs leading-6 text-gray-600">
                        {categoryNames ||
                          'Uncategorized'}
                      </td>

                      {/* PRODUCT PRICE */}

                      <td className="whitespace-nowrap px-4 py-4">

                        <div className="font-semibold text-gray-900">
                          {formatPrice(
                            product.priceInPaise
                          )}
                        </div>

                        {product.originalPriceInPaise != null &&
                          product.originalPriceInPaise >
                            product.priceInPaise && (
                            <div className="mt-1 text-xs text-gray-400 line-through">
                              {formatPrice(
                                product.originalPriceInPaise
                              )}
                            </div>
                          )}

                      </td>

                      {/* PRODUCT STATUS */}

                      <td className="whitespace-nowrap px-4 py-4">

                        <ProductStatusBadge
                          status={product.status}
                        />

                      </td>

                      {/* PRODUCT ACTIONS */}

                      <td className="px-4 py-4">

                        <div className="flex items-center gap-2">

                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            aria-label={`Edit ${product.name}`}
                            title="Edit product"
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition-colors hover:border-black hover:text-black"
                          >
                            <Edit size={16} />
                          </Link>

                          <ProductActions
                            productId={product.id}
                            currentStatus={product.status}
                          />

                        </div>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}
