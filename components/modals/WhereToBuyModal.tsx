import React from 'react';
import { X, ExternalLink, ShoppingCart } from 'lucide-react';
import { Product } from '@/types';
import { fmt, calcDiscountPercent } from '@/utils/format';

interface WhereToBuyModalProps {
  product: Product | null;
  onClose: () => void;
}

interface PlatformConfig {
  name: string;
  tagline: string;
  badge?: string;
  badgeColor?: string;
  bgColor: string;
  hoverColor: string;
  textColor: string;
  buttonText: string;
  getDefaultUrl: (productName: string) => string;
}

// Configuration for popular Indian E-commerce platforms
const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  amazon: {
    name: 'Amazon India',
    tagline: 'Fast delivery & Prime benefits available',
    badge: 'Popular',
    badgeColor: 'bg-amber-100 text-amber-800',
    bgColor: 'bg-white border-[#e3e0d8] hover:border-[#141414]',
    hoverColor: 'hover:bg-[#faf8f5]',
    textColor: 'text-[#141414]',
    buttonText: 'Buy on Amazon',
    getDefaultUrl: (name) => `https://www.amazon.in/s?k=${encodeURIComponent(name)}`,
  },
  flipkart: {
    name: 'Flipkart',
    tagline: 'Assured quality & seasonal discounts',
    badge: 'Assured',
    badgeColor: 'bg-blue-100 text-blue-800',
    bgColor: 'bg-white border-[#e3e0d8] hover:border-[#141414]',
    hoverColor: 'hover:bg-[#faf8f5]',
    textColor: 'text-[#141414]',
    buttonText: 'Buy on Flipkart',
    getDefaultUrl: (name) => `https://www.flipkart.com/search?q=${encodeURIComponent(name)}`,
  },
  nykaa: {
    name: 'Nykaa',
    tagline: '100% authentic beauty & salon appliances',
    badge: 'Verified Salon',
    badgeColor: 'bg-pink-100 text-pink-800',
    bgColor: 'bg-white border-[#e3e0d8] hover:border-[#141414]',
    hoverColor: 'hover:bg-[#faf8f5]',
    textColor: 'text-[#141414]',
    buttonText: 'Buy on Nykaa',
    getDefaultUrl: (name) => `https://www.nykaa.com/search/result/?q=${encodeURIComponent(name)}`,
  },
  myntra: {
    name: 'Myntra',
    tagline: 'Curated styling essentials & quick delivery',
    badge: 'Trending',
    badgeColor: 'bg-rose-100 text-rose-800',
    bgColor: 'bg-white border-[#e3e0d8] hover:border-[#141414]',
    hoverColor: 'hover:bg-[#faf8f5]',
    textColor: 'text-[#141414]',
    buttonText: 'Buy on Myntra',
    getDefaultUrl: (name) => `https://www.myntra.com/${encodeURIComponent(name)}`,
  },
  tatacliq: {
    name: 'Tata CLiQ',
    tagline: 'Genuine brands & trusted Tata reliability',
    bgColor: 'bg-white border-[#e3e0d8] hover:border-[#141414]',
    hoverColor: 'hover:bg-[#faf8f5]',
    textColor: 'text-[#141414]',
    buttonText: 'Buy on Tata CLiQ',
    getDefaultUrl: (name) => `https://www.tatacliq.com/search/?searchCategory=all&text=${encodeURIComponent(name)}`,
  },
};

/**
 * Modal dialog presenting external e-commerce store purchase options
 */
export const WhereToBuyModal: React.FC<WhereToBuyModalProps> = ({
  product,
  onClose,
}) => {
  if (!product) return null;

  const discount = calcDiscountPercent(product.price, product.old);

  // If specific buyLinks are defined for this product, use them.
  // Otherwise, fallback to popular default platforms (Amazon, Flipkart, Nykaa)
  const availablePlatforms = product.buyLinks
    ? Object.keys(product.buyLinks).filter((key) => Boolean(product.buyLinks?.[key]))
    : ['amazon', 'flipkart', 'nykaa'];

  const handleOpenStore = (platformKey: string) => {
    // 1. Get explicit link if provided in data/products.ts
    const explicitUrl = product.buyLinks?.[platformKey];
    
    // 2. Otherwise fallback to auto-search URL
    const targetUrl =
      explicitUrl && explicitUrl.startsWith('http')
        ? explicitUrl
        : PLATFORM_CONFIGS[platformKey]?.getDefaultUrl(product.name) ||
          `https://www.google.com/search?q=${encodeURIComponent(product.name)}`;

    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="modal">
      {/* Backdrop */}
      <div className="overlay" onClick={onClose} />

      {/* Dialog Box */}
      <div className="modal-panel z-[81] max-w-xl p-6 md:p-8 rounded-none">
        {/* Close Button */}
        <button
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
          Choose where you want to purchase this product. You will be redirected to the official listing.
        </p>

        {/* Selected Product Summary */}
        <div className="flex items-center gap-4 p-4 bg-[#f6f4ef] border border-[#e5e1d9] mb-6">
          <img
            src={product.image}
            alt={product.name}
            className="w-16 h-16 object-cover bg-white shrink-0"
          />
          <div className="min-w-0 flex-1">
            <span className="tag block">{product.category}</span>
            <h3 className="font-semibold text-sm truncate">{product.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <b className="text-sm">{fmt(product.price)}</b>
              <s className="text-xs text-gray-400">{fmt(product.old)}</s>
              <span className="text-[10px] text-green-700 font-semibold">
                {discount}% OFF
              </span>
            </div>
          </div>
        </div>

        {/* Store Options List */}
        <div className="space-y-3">
          {availablePlatforms.map((platformKey) => {
            const config = PLATFORM_CONFIGS[platformKey] || {
              name: platformKey.toUpperCase(),
              tagline: `Buy on ${platformKey}`,
              bgColor: 'bg-white border-[#e3e0d8] hover:border-[#141414]',
              hoverColor: 'hover:bg-[#faf8f5]',
              textColor: 'text-[#141414]',
              buttonText: `Buy on ${platformKey}`,
              getDefaultUrl: (name: string) =>
                `https://www.google.com/search?q=${encodeURIComponent(name)}`,
            };

            return (
              <div
                key={platformKey}
                onClick={() => handleOpenStore(platformKey)}
                className={`flex items-center justify-between p-4 border transition cursor-pointer group ${config.bgColor} ${config.hoverColor}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#171717] text-white flex items-center justify-center font-bold text-sm tracking-widest shrink-0">
                    <ShoppingCart size={17} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{config.name}</span>
                      {config.badge && (
                        <span
                          className={`text-[9px] uppercase px-2 py-0.5 font-bold ${config.badgeColor}`}
                        >
                          {config.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{config.tagline}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline text-xs font-bold text-[#141414] group-hover:text-[#9e7b50] transition">
                    {config.buttonText}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#f6f4ef] group-hover:bg-[#141414] group-hover:text-white flex items-center justify-center transition">
                    <ExternalLink size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Secure Note */}
        <p className="text-[11px] text-gray-400 text-center mt-6">
          ✦ You will be redirected to the selected platform's official verified store.
        </p>
      </div>
    </div>
  );
};