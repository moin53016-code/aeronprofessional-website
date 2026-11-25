
import React from 'react';

import {
  Instagram,
  MessageCircle,
  Mail,
} from 'lucide-react';

import { SupportTab } from '@/components/modals/SupportModal';
import { SiteSettings } from '@/types';

interface FooterProps {
  onOpenSupport: (tab: SupportTab) => void;
  settings: SiteSettings;
}

const CARE_LINKS: {
  label: string;
  tab: SupportTab;
}[] = [
  { label: 'Contact Us', tab: 'contact' },
  { label: 'FAQs', tab: 'faqs' },
  { label: '1-Year Warranty Guide', tab: 'warranty' },
  { label: 'Salon & Bulk Inquiries', tab: 'bulk' },
];

const headingClass =
  'mb-5 text-xs font-bold tracking-widest text-white';

const linkClass =
  'flex min-h-9 w-full items-center text-left text-sm leading-6 text-gray-400 transition-colors hover:text-white';

const contactClass =
  'group flex min-w-0 items-center gap-3 text-sm leading-6 text-gray-300 transition-colors hover:text-[#c6a77a]';

const iconClass =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#c6a77a] transition-colors group-hover:border-[#c6a77a]';

export const Footer: React.FC<FooterProps> = ({
  onOpenSupport,
  settings,
}) => {
  const year = new Date().getFullYear();

  const whatsappNumber =
    settings.whatsappNumber.replace(/\D/g, '');

  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        settings.whatsappMessage || ''
      )}`
    : '';

  return (
    <footer className="w-full min-w-0 bg-[#151515] text-white">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-start gap-x-12 gap-y-12 px-4 py-14 sm:grid-cols-2 sm:px-6 sm:py-16 lg:grid-cols-3 lg:gap-x-16 lg:px-8 lg:py-20">
        {/* BRAND / CONTACT */}

        <div className="min-w-0">
          <h3 className={headingClass}>
            AERON{' '}
            <span className="font-normal text-[#c6a77a]">
              PROFESSIONAL
            </span>
          </h3>

          <p className="mb-7 max-w-sm text-sm leading-7 text-gray-400">
            Professional-inspired styling tools
            designed for your everyday routine.
          </p>

          <div className="space-y-4">
            {settings.instagramUrl && (
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={contactClass}
                aria-label="Visit AERON Instagram"
              >
                <span className={iconClass}>
                  <Instagram size={17} />
                </span>

                <span className="min-w-0 break-words">
                  {settings.instagramHandle ||
                    'Instagram'}
                </span>
              </a>
            )}

            {whatsappNumber && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={contactClass}
                aria-label="Contact AERON on WhatsApp"
              >
                <span className={iconClass}>
                  <MessageCircle size={17} />
                </span>

                <span className="min-w-0 break-words">
                  {settings.businessPhone ||
                    `+${whatsappNumber}`}
                </span>
              </a>
            )}

            {settings.contactEmail && (
              <a
                href={`mailto:${settings.contactEmail}`}
                className={contactClass}
                aria-label="Email AERON"
              >
                <span className={iconClass}>
                  <Mail size={17} />
                </span>

                <span className="min-w-0 break-all">
                  {settings.contactEmail}
                </span>
              </a>
            )}
          </div>
        </div>

        {/* CUSTOMER CARE */}

        <div className="min-w-0">
          <h3 className={headingClass}>
            CUSTOMER CARE
          </h3>

          <ul className="space-y-2">
            {CARE_LINKS.map(({ label, tab }) => (
              <li key={label}>
                <button
                  type="button"
                  onClick={() => onOpenSupport(tab)}
                  className={linkClass}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* VERIFIED STORES */}

        <div className="min-w-0 sm:col-span-2 lg:col-span-1">
          <h3 className={headingClass}>
            VERIFIED STORES
          </h3>

          <p className="max-w-sm text-sm leading-7 text-gray-400">
            Explore genuine AERON Professional
            products through our verified marketplace
            listings and authorized distribution
            partners.
          </p>

          <p className="mt-4 text-sm leading-6 text-gray-500">
            India • Prices shown in INR
          </p>

          {settings.priceDisclaimer && (
            <p className="mt-3 max-w-sm break-words text-xs leading-6 text-gray-500">
              {settings.priceDisclaimer}
            </p>
          )}
        </div>
      </div>

      {/* COPYRIGHT */}

      <div className="border-t border-white/10 px-4 py-6 sm:px-6">
        <p className="mx-auto max-w-7xl break-words text-center text-xs leading-6 text-gray-500">
          © {year} {settings.copyrightText}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
