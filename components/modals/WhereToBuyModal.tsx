
'use client';

import React, { useState } from 'react';
import { X, ExternalLink, ShoppingBag } from 'lucide-react';
import { Product } from '@/types';
import { fmt, calcDiscountPercent } from '@/utils/format';

interface WhereToBuyModalProps {
  product: Product | null;
  onClose: () => void;
}

// Get marketplace icon automatically from its website URL.
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
      key={iconUrl}
      src={iconUrl}
      alt={`${name} icon`}
      width={28}
      height={28}
      className="w-7 h-7 object-contain"
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

  // Only show marketplaces provided by the website's
  // admin-managed database data.
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
    <div className="modal">
      {/* Backdrop */}
      <div
        className="overlay"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="modal-panel z-[81] max-w-xl p-6 md:p-8 rounded-none">
        {/* Close */}
        <button
          type="button"
          className="absolute right-4 top-4 z-10 bg-white p-2 hover:bg-gray-100 transition"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <p className="tag">WHERE TO BUY</p>

        <h2 className="serif text-3xl md:text-4xl mt-2 mb-2">
          Select Your Store
        </h2>

        <p className="text-xs text-gray-500 mb-6">
          Choose your preferred marketplace.
          You will be redirected to its website.
        </p>

        {/* Selected Product */}
        <div className="flex items-center gap-4 p-4 bg-[#f6f4ef] border border-[#e5e1d9] mb-6">
          {product.image && (
            <img
              src={product.image}
              alt={product.name}
              className="w-16 h-16 object-cover bg-white shrink-0"
            />
          )}

          <div className="min-w-0 flex-1">
            <span className="tag block">
              {product.category}
            </span>

            <h3 className="font-semibold text-sm truncate">
              {product.name}
            </h3>

            <div className="flex items-center gap-2 mt-1">
              <b className="text-sm">
                {fmt(product.price)}
              </b>

              {product.originalPrice &&
                product.originalPrice > product.price && (
                  <s className="text-xs text-gray-400">
                    {fmt(product.originalPrice)}
                  </s>
                )}

              {discount > 0 && (
                <span className="text-[10px] text-green-700 font-semibold">
                  {discount}% OFF
                </span>
              )}
            </div>

            {isSoldOut && (
              <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider">
                Currently Sold Out
              </span>
            )}
          </div>
        </div>

        {/* Marketplace List */}
        {isSoldOut ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm font-semibold">
              This product is currently sold out.
            </p>

            <p className="text-xs mt-2">
              Please check back later.
            </p>
          </div>
        ) : availableLinks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ShoppingBag
              size={32}
              className="mx-auto mb-3 opacity-30"
            />

            <p className="text-sm font-semibold">
              No marketplaces available right now.
            </p>

            <p className="text-xs mt-2">
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
                className="flex items-center justify-between p-4 border border-[#e3e0d8] hover:border-[#141414] bg-white hover:bg-[#faf8f5] transition group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Automatic Marketplace Icon */}
                  <div className="w-11 h-11 bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <MarketplaceIcon
                      key={link.url}
                      name={link.marketplaceName}
                      url={link.url}
                    />
                  </div>

                  {/* Name, Tag & Tagline */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm">
                        {link.marketplaceName}
                      </span>

                      {link.badgeText && (
                        <span className="text-[9px] uppercase px-2 py-0.5 font-bold bg-gray-100 text-gray-700">
                          {link.badgeText}
                        </span>
                      )}
                    </div>

                    {link.tagline && (
                      <p className="text-xs text-gray-500 mt-1">
                        {link.tagline}
                      </p>
                    )}
                  </div>
                </div>

                {/* Open Marketplace */}
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="hidden sm:inline text-xs font-semibold text-[#141414]">
                    Visit Store
                  </span>

                  <div className="w-8 h-8 rounded-full bg-[#f6f4ef] group-hover:bg-[#141414] group-hover:text-white flex items-center justify-center transition">
                    <ExternalLink size={14} />
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-[11px] text-gray-400 text-center mt-6">
          You will be redirected to an external marketplace.
          Prices and availability may vary by retailer.
        </p>
      </div>
    </div>
  );
};
