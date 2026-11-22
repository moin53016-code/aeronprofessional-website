
'use client';

import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  ShoppingBag,
} from 'lucide-react';

import { Product } from '@/types';
import {
  fmt,
  calcDiscountPercent,
} from '@/utils/format';

interface WhereToBuyModalProps {
  product: Product | null;
  onClose: () => void;
}

function getMarketplaceIcon(url: string): string | null {
  try {
    const parsed = new URL(url);

    if (parsed.protocol !== 'https:') {
      return null;
    }

    return (
      'https://www.google.com/s2/favicons?domain=' +
      encodeURIComponent(parsed.hostname) +
      '&sz=64'
    );
  } catch {
    return null;
  }
}

function MarketplaceIcon({
  name,
  url,
}: {
  name: string;
  url: string;
}) {
  const [failed, setFailed] = useState(false);
  const iconUrl = getMarketplaceIcon(url);

  if (!iconUrl || failed) {
    return (
      <ShoppingBag
        size={20}
        className="text-gray-500"
      />
    );
  }

  return (
    <img
      src={iconUrl}
      alt={`${name} icon`}
      width={28}
      height={28}
      loading="lazy"
      className="h-7 w-7 object-contain"
      onError={() => setFailed(true)}
    />
  );
}

export const WhereToBuyModal: React.FC<
  WhereToBuyModalProps
> = ({ product, onClose }) => {
  if (!product) return null;

  const discount = calcDiscountPercent(
    product.price,
    product.originalPrice ?? 0
  );

  const isSoldOut = product.status === 'SOLD_OUT';

  const availableLinks = (
    product.marketplaceLinks ?? []
  ).filter((link) => {
    try {
      return new URL(link.url).protocol === 'https:';
    } catch {
      return false;
    }
  });

  return (
    <div
      className="
        modal
        fixed
        inset-0
        z-[80]
        grid
        place-items-center
        overflow-y-auto
        p-2
        sm:p-5
      "
      role="dialog"
      aria-modal="true"
      aria-label={`Where to buy ${product.name}`}
    >
      {/* BACKDROP */}

      <div
        className="overlay fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* MODAL PANEL */}

      <div
        className="
          modal-panel
          relative
          z-[81]
          mx-auto
          w-full
          max-w-xl
          min-w-0
          max-h-[95dvh]
          overflow-y-auto
          bg-white
          p-4
          sm:p-6
          md:p-8
        "
      >
        {/* CLOSE */}

        <button
          type="button"
          onClick={onClose}
          aria-label="Close where to buy"
          className="
            absolute
            right-3
            top-3
            z-10
            flex
            h-10
            w-10
            items-center
            justify-center
            bg-white
            transition-colors
            hover:bg-gray-100
          "
        >
          <X size={20} />
        </button>

        {/* HEADER */}

        <p className="tag pr-12">
          WHERE TO BUY
        </p>

        <h2
          className="
            serif
            mb-2
            mt-3
            pr-10
            text-2xl
            leading-tight
            sm:text-3xl
            md:text-4xl
          "
        >
          Select Your Store
        </h2>

        <p
          className="
            mb-6
            text-xs
            leading-6
            text-gray-500
          "
        >
          Choose your preferred marketplace.
          You will be redirected to its website.
        </p>

        {/* PRODUCT SUMMARY */}

        <div
          className="
            mb-6
            flex
            min-w-0
            items-center
            gap-3
            border
            border-[#e5e1d9]
            bg-[#f6f4ef]
            p-3
            sm:gap-4
            sm:p-4
          "
        >
          {/* FULL IMAGE - NO CROP */}

          {product.image && (
            <div
              className="
                flex
                h-20
                w-20
                shrink-0
                items-center
                justify-center
                overflow-hidden
                bg-white
                p-2
                sm:h-24
                sm:w-24
              "
            >
              <img
                src={product.image}
                alt={product.name}
                loading="lazy"
                className="
                  block
                  h-full
                  w-full
                  object-contain
                  object-center
                "
                style={{
                  objectFit: 'contain',
                  objectPosition: 'center',
                }}
              />
            </div>
          )}

          {/* PRODUCT DETAILS */}

          <div className="min-w-0 flex-1">
            <span className="tag block">
              {product.category}
            </span>

            <h3
              className="
                mt-1
                break-words
                text-sm
                font-semibold
                leading-5
                sm:text-base
              "
            >
              {product.name}
            </h3>

            <div
              className="
                mt-2
                flex
                flex-wrap
                items-center
                gap-x-2
                gap-y-1
              "
            >
              <b className="text-sm sm:text-base">
                {fmt(product.price)}
              </b>

              {product.originalPrice &&
                product.originalPrice > product.price && (
                  <s className="text-xs text-gray-400">
                    {fmt(product.originalPrice)}
                  </s>
                )}

              {discount > 0 && (
                <span
                  className="
                    text-[10px]
                    font-semibold
                    text-green-700
                  "
                >
                  {discount}% OFF
                </span>
              )}
            </div>

            {isSoldOut && (
              <span
                className="
                  mt-2
                  block
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-wider
                  text-red-600
                "
              >
                Currently Sold Out
              </span>
            )}
          </div>
        </div>

        {/* MARKETPLACE LIST */}

        {isSoldOut ? (
          <div className="py-8 text-center text-gray-500">
            <p className="text-sm font-semibold">
              This product is currently sold out.
            </p>

            <p className="mt-2 text-xs">
              Please check back later.
            </p>
          </div>
        ) : availableLinks.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <ShoppingBag
              size={32}
              className="mx-auto mb-3 opacity-30"
            />

            <p className="text-sm font-semibold">
              No marketplaces available right now.
            </p>

            <p className="mt-2 text-xs">
              Please check back soon.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {availableLinks.map((link) => (
              <a
                key={link.marketplaceId}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  group
                  flex
                  min-w-0
                  items-center
                  justify-between
                  gap-3
                  border
                  border-[#e3e0d8]
                  bg-white
                  p-3
                  transition-colors
                  hover:border-[#141414]
                  hover:bg-[#faf8f5]
                  sm:p-4
                "
              >
                {/* MARKETPLACE DETAILS */}

                <div
                  className="
                    flex
                    min-w-0
                    flex-1
                    items-center
                    gap-3
                  "
                >
                  <div
                    className="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      border
                      border-gray-200
                      bg-white
                    "
                  >
                    <MarketplaceIcon
                      key={link.url}
                      name={link.marketplaceName}
                      url={link.url}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div
                      className="
                        flex
                        flex-wrap
                        items-center
                        gap-2
                      "
                    >
                      <span
                        className="
                          min-w-0
                          break-words
                          text-sm
                          font-bold
                        "
                      >
                        {link.marketplaceName}
                      </span>

                      {link.badgeText && (
                        <span
                          className="
                            bg-gray-100
                            px-2
                            py-1
                            text-[9px]
                            font-bold
                            uppercase
                            text-gray-700
                          "
                        >
                          {link.badgeText}
                        </span>
                      )}
                    </div>

                    {link.tagline && (
                      <p
                        className="
                          mt-1
                          break-words
                          text-xs
                          leading-5
                          text-gray-500
                        "
                      >
                        {link.tagline}
                      </p>
                    )}
                  </div>
                </div>

                {/* VISIT STORE */}

                <div
                  className="
                    ml-1
                    flex
                    shrink-0
                    items-center
                    gap-2
                  "
                >
                  <span
                    className="
                      hidden
                      text-xs
                      font-semibold
                      sm:inline
                    "
                  >
                    Visit Store
                  </span>

                  <div
                    className="
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-full
                      bg-[#f6f4ef]
                      transition-colors
                      group-hover:bg-[#141414]
                      group-hover:text-white
                    "
                  >
                    <ExternalLink size={15} />
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* DISCLAIMER */}

        <p
          className="
            mt-6
            text-center
            text-[11px]
            leading-5
            text-gray-400
          "
        >
          You will be redirected to an external
          marketplace. Prices and availability
          may vary by retailer.
        </p>
      </div>
    </div>
  );
};

export default WhereToBuyModal;
