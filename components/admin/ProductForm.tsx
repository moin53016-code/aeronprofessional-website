
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
} from 'lucide-react';

import ProductImageInput from '@/components/admin/ProductImageInput';

interface Category {
  id: string;
  name: string;
  label: string;
}

interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
  displayOrder: number;
}

interface ProductSpec {
  id: string;
  label: string;
  value: string | null;
  displayOrder: number;
}

interface ProductData {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  shortDescription?: string | null;
  description: string;
  priceInPaise: number;
  originalPriceInPaise?: number | null;
  status: string;
  isFeatured: boolean;
  isNew: boolean;
  displayOrder: number;
  badgeText?: string | null;
  primaryImageUrl?: string | null;
  images: ProductImage[];
  specifications: ProductSpec[];
  categories: Array<{
    category: Category;
  }>;
}

interface ProductFormProps {
  product?: ProductData;
  categories: Category[];
  marketplaces?: unknown[];
}

const fieldClass =
  'w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black';

const labelClass =
  'block text-xs font-bold tracking-wider text-gray-600 mb-2';

function calculateDiscount(
  sellingPrice: string,
  originalPrice: string
): string {
  const selling = Number(sellingPrice);
  const original = Number(originalPrice);

  if (
    !originalPrice ||
    original <= 0 ||
    selling >= original ||
    selling < 0
  ) {
    return '0';
  }

  return String(
    Math.round(((original - selling) / original) * 100)
  );
}

function generateSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function ProductForm({
  product,
  categories,
}: ProductFormProps) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState(
    product?.name ?? ''
  );

  const [slug, setSlug] = useState(
    product?.slug ?? ''
  );

  const [sku, setSku] = useState(
    product?.sku ?? ''
  );

  const [shortDesc, setShortDesc] = useState(
    product?.shortDescription ?? ''
  );

  const [description, setDescription] = useState(
    product?.description ?? ''
  );

  const [price, setPrice] = useState(
    product
      ? String(product.priceInPaise / 100)
      : ''
  );

  const [originalPrice, setOriginalPrice] = useState(
    product?.originalPriceInPaise != null
      ? String(product.originalPriceInPaise / 100)
      : ''
  );

  const [discountPercent, setDiscountPercent] = useState(
    calculateDiscount(
      product
        ? String(product.priceInPaise / 100)
        : '',
      product?.originalPriceInPaise != null
        ? String(product.originalPriceInPaise / 100)
        : ''
    )
  );

  const [status, setStatus] = useState(
    product?.status ?? 'DRAFT'
  );

  const [isFeatured, setIsFeatured] = useState(
    product?.isFeatured ?? false
  );

  const [isNew, setIsNew] = useState(
    product?.isNew ?? false
  );

  const [displayOrder, setDisplayOrder] = useState(
    String(product?.displayOrder ?? 0)
  );

  const [badgeText, setBadgeText] = useState(
    product?.badgeText ?? ''
  );

  const [imageUrl, setImageUrl] = useState(
    product?.primaryImageUrl ||
    product?.images.find((image) => image.isPrimary)?.url ||
    product?.images[0]?.url ||
    ''
  );

  const [specs, setSpecs] = useState<string[]>(
    product?.specifications.map((spec) =>
      spec.value
        ? `${spec.label}: ${spec.value}`
        : spec.label
    ) ?? ['']
  );

  const [selectedCategories, setSelectedCategories] =
    useState<string[]>(
      product?.categories.map(
        (item) => item.category.id
      ) ?? []
    );

  // PRICING

  const handleOriginalPriceChange = (value: string) => {
    setOriginalPrice(value);

    const mrp = Number(value);
    const discount = Number(discountPercent);

    if (
      value !== '' &&
      Number.isFinite(mrp) &&
      mrp > 0 &&
      discount >= 0 &&
      discount <= 100
    ) {
      const calculated =
        Math.round(mrp * (1 - discount / 100) * 100) / 100;

      setPrice(String(calculated));
    }
  };

  const handleDiscountChange = (value: string) => {
    setDiscountPercent(value);

    if (value === '') return;

    const discount = Number(value);
    const mrp = Number(originalPrice);

    if (
      !Number.isFinite(discount) ||
      discount < 0 ||
      discount > 100 ||
      !originalPrice ||
      mrp <= 0
    ) {
      return;
    }

    const selling =
      Math.round(mrp * (1 - discount / 100) * 100) / 100;

    setPrice(String(selling));
  };

  const handlePriceChange = (value: string) => {
    setPrice(value);

    setDiscountPercent(
      calculateDiscount(value, originalPrice)
    );
  };

  // SAVE PRODUCT

  const handleSubmit = async (
    e: FormEvent,
    submitStatus?: string
  ) => {
    e.preventDefault();

    if (loading) return;

    setError('');
    setSuccess('');

    const priceNum = Number(price);
    const originalNum =
      originalPrice === ''
        ? null
        : Number(originalPrice);

    const discountNum = Number(discountPercent);

    if (
      price.trim() === '' ||
      !Number.isFinite(priceNum) ||
      priceNum < 0
    ) {
      setError('Please enter a valid selling price.');
      return;
    }

    if (
      originalNum !== null &&
      (!Number.isFinite(originalNum) || originalNum <= 0)
    ) {
      setError('Please enter a valid MRP.');
      return;
    }

    if (
      !Number.isFinite(discountNum) ||
      discountNum < 0 ||
      discountNum > 100
    ) {
      setError('Discount must be between 0% and 100%.');
      return;
    }

    if (
      originalNum !== null &&
      priceNum > originalNum
    ) {
      setError('Selling price cannot exceed MRP.');
      return;
    }

    if (
      discountNum > 0 &&
      (originalNum === null || originalNum <= 0)
    ) {
      setError('Please enter MRP before adding discount.');
      return;
    }

    const finalSlug = slug.trim() || generateSlug(name);

    if (!name.trim() || !finalSlug) {
      setError('Product name and slug are required.');
      return;
    }

    const parsedSpecs = specs
      .map((item, index) => {
        const [rawLabel, ...rest] = item.split(':');

        return {
          label: rawLabel.trim(),
          value: rest.join(':').trim() || null,
          displayOrder: index,
        };
      })
      .filter((item) => item.label.length > 0);

    const body = {
      name: name.trim(),
      slug: finalSlug,
      sku: sku.trim() || null,
      shortDescription: shortDesc.trim() || null,
      description,
      priceInPaise: Math.round(priceNum * 100),
      originalPriceInPaise:
        originalNum !== null
          ? Math.round(originalNum * 100)
          : null,
      status: submitStatus || status,
      isFeatured,
      isNew,
      displayOrder: Math.max(
        0,
        Math.floor(Number(displayOrder) || 0)
      ),
      badgeText: badgeText.trim() || null,

      // Selected image URL, from upload or direct URL.
      primaryImageUrl: imageUrl.trim() || null,

      images: imageUrl.trim()
        ? [
            {
              url: imageUrl.trim(),
              altText: name.trim(),
              displayOrder: 0,
              isPrimary: true,
            },
          ]
        : [],

      specifications: parsedSpecs,
      categoryIds: selectedCategories,
    };

    setLoading(true);

    try {
      const url = isEdit
        ? `/api/admin/products/${product!.id}`
        : '/api/admin/products';

      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || 'Failed to save product.'
        );
      }

      setSuccess('Product saved successfully!');

      if (!isEdit && data.product?.id) {
        router.push(
          `/admin/products/${data.product.id}/edit`
        );
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save product.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <Link
          href="/admin/products"
          className="text-sm text-gray-500 hover:text-black flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Products
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-3 mb-4 text-sm">
          {success}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* PRODUCT INFORMATION */}

          <div className="bg-white border border-gray-200 p-5">
            <h2 className="font-semibold mb-4">
              Product Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>
                  PRODUCT NAME *
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);

                    if (!isEdit) {
                      setSlug(generateSlug(e.target.value));
                    }
                  }}
                  className={fieldClass}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    URL SLUG
                  </label>
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    SKU
                  </label>
                  <input
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className={fieldClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  SHORT DESCRIPTION
                </label>
                <textarea
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  rows={2}
                  className={fieldClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  FULL DESCRIPTION
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className={fieldClass}
                />
              </div>
            </div>
          </div>

          {/* PRICING */}

          <div className="bg-white border border-gray-200 p-5">
            <h2 className="font-semibold mb-4">
              Pricing & Discount
            </h2>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>
                  ORIGINAL PRICE / MRP (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={originalPrice}
                  onChange={(e) =>
                    handleOriginalPriceChange(e.target.value)
                  }
                  className={fieldClass}
                  placeholder="5000"
                />
              </div>

              <div>
                <label className={labelClass}>
                  DISCOUNT (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={discountPercent}
                  onChange={(e) =>
                    handleDiscountChange(e.target.value)
                  }
                  className={fieldClass}
                  placeholder="20"
                />
              </div>

              <div>
                <label className={labelClass}>
                  SELLING PRICE (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) =>
                    handlePriceChange(e.target.value)
                  }
                  className={fieldClass}
                  placeholder="4000"
                />
              </div>
            </div>

            {originalPrice &&
              Number(originalPrice) > Number(price) &&
              price !== '' && (
                <div className="mt-4 bg-green-50 border border-green-200 p-4">
                  <p className="font-semibold text-green-800 text-sm">
                    Discount Preview
                  </p>

                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="font-bold">
                      ₹{Number(price).toLocaleString('en-IN')}
                    </span>

                    <span className="line-through text-gray-400">
                      ₹{Number(originalPrice).toLocaleString('en-IN')}
                    </span>

                    <span className="text-green-700 font-bold text-sm">
                      {calculateDiscount(price, originalPrice)}% OFF
                    </span>
                  </div>
                </div>
              )}

            <p className="text-xs text-gray-500 mt-3">
              Change discount to calculate selling price
              automatically.
            </p>
          </div>

          {/* PRODUCT IMAGE — URL OR UPLOAD */}

          <div className="bg-white border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">
              Product Image
            </h2>

            <ProductImageInput
              value={imageUrl}
              onChange={setImageUrl}
            />

            <p className="text-xs text-gray-500 mt-4">
              Upload an image from your computer or paste a
              direct image URL. The selected image will be
              saved as the product&apos;s primary image.
            </p>
          </div>

          {/* SPECIFICATIONS */}

          <div className="bg-white border border-gray-200 p-5">
            <h2 className="font-semibold mb-4">
              Product Specifications
            </h2>

            <div className="space-y-3">
              {specs.map((spec, index) => (
                <div
                  key={index}
                  className="flex gap-2"
                >
                  <input
                    value={spec}
                    onChange={(e) => {
                      const updated = [...specs];
                      updated[index] = e.target.value;
                      setSpecs(updated);
                    }}
                    className={fieldClass}
                    placeholder="Power: 2000W"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setSpecs(
                        specs.filter((_, i) => i !== index)
                      )
                    }
                    className="text-red-500 p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setSpecs([...specs, ''])}
                className="flex items-center gap-2 text-sm text-gray-600"
              >
                <Plus size={15} />
                Add Specification
              </button>
            </div>
          </div>
        </div>

        {/* SIDEBAR */}

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 p-5">
            <h2 className="font-semibold mb-4">
              Status & Visibility
            </h2>

            <label className={labelClass}>
              STATUS
            </label>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={fieldClass}
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="SOLD_OUT">Sold Out</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            <label className="flex gap-3 mt-4 text-sm">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) =>
                  setIsFeatured(e.target.checked)
                }
              />
              Featured Product
            </label>

            <label className="flex gap-3 mt-3 text-sm">
              <input
                type="checkbox"
                checked={isNew}
                onChange={(e) =>
                  setIsNew(e.target.checked)
                }
              />
              New Arrival
            </label>

            <div className="mt-4">
              <label className={labelClass}>
                PRODUCT DISPLAY ORDER
              </label>

              <input
                type="number"
                min="0"
                value={displayOrder}
                onChange={(e) =>
                  setDisplayOrder(e.target.value)
                }
                className={fieldClass}
              />
            </div>
          </div>

          {/* BADGE */}

          <div className="bg-white border border-gray-200 p-5">
            <h2 className="font-semibold mb-4">
              Product Badge
            </h2>

            <input
              value={badgeText}
              onChange={(e) => setBadgeText(e.target.value)}
              className={fieldClass}
              placeholder="BESTSELLER"
              maxLength={20}
            />
          </div>

          {/* CATEGORIES */}

          <div className="bg-white border border-gray-200 p-5">
            <h2 className="font-semibold mb-4">
              Categories
            </h2>

            <div className="space-y-3">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex gap-3 items-center text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(
                      category.id
                    )}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategories((prev) => [
                          ...prev,
                          category.id,
                        ]);
                      } else {
                        setSelectedCategories((prev) =>
                          prev.filter(
                            (id) => id !== category.id
                          )
                        );
                      }
                    }}
                  />

                  {category.label}
                </label>
              ))}
            </div>
          </div>

          {/* SAVE BUTTONS */}

          <div className="bg-white border border-gray-200 p-5 space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 text-xs font-bold disabled:opacity-50"
            >
              <Save size={15} />
              {loading ? 'SAVING...' : 'SAVE PRODUCT'}
            </button>

            {status !== 'ACTIVE' && (
              <button
                type="button"
                disabled={loading}
                onClick={(e) =>
                  handleSubmit(e, 'ACTIVE')
                }
                className="w-full bg-green-700 text-white py-3 text-xs font-bold disabled:opacity-50"
              >
                SAVE & PUBLISH
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
