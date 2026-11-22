import React from 'react';
import { Instagram, MessageCircle, Mail } from 'lucide-react';
import { SupportTab } from '@/components/modals/SupportModal';
import { SiteSettings } from '@/types';

interface FooterProps {
  onNavigate: (view: string) => void;
  onOpenSupport: (tab: SupportTab) => void;
  settings: SiteSettings;
}

const EXPLORE_LINKS = [
  'Shop All',
  'Straighteners',
  'Hair Dryers',
  'Curling Tools',
  'Professional Collection',
];

const CARE_LINKS: { label: string; tab: SupportTab }[] = [
  { label: 'Contact Us', tab: 'contact' },
  { label: 'FAQs', tab: 'faqs' },
  { label: '1-Year Warranty Guide', tab: 'warranty' },
  { label: 'Salon & Bulk Inquiries', tab: 'bulk' },
];

const headingClass = 'text-xs leading-none tracking-widest font-bold mb-5 h-4';
const itemClass = 'flex items-center gap-2 w-full text-left text-sm leading-5 text-gray-400 hover:text-white transition';
const contactRowClass = 'flex items-center gap-3 text-sm text-gray-300 hover:text-gold transition group';
const iconWrapClass = 'w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gold group-hover:border-gold group-hover:bg-gold group-hover:text-black transition duration-300 shrink-0';

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenSupport, settings }) => {
  const whatsappUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(settings.whatsappMessage)}`;
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#151515] text-white">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10 items-start">
        {/* Brand & Contacts */}
        <div>
          <h3 className={headingClass}>
            AERON <span className="text-gold font-normal">PROFESSIONAL</span>
          </h3>
          <div className="space-y-3 -mt-1">
            {settings.instagramUrl && (
              <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className={contactRowClass}>
                <div className={iconWrapClass}><Instagram size={15} /></div>
                <span className="tracking-wide group-hover:text-gold transition">{settings.instagramHandle}</span>
              </a>
            )}
            {settings.whatsappNumber && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={contactRowClass}>
                <div className={iconWrapClass}><MessageCircle size={15} /></div>
                <span className="tracking-wide group-hover:text-gold transition">{settings.businessPhone}</span>
              </a>
            )}
            {settings.contactEmail && (
              <a href={`mailto:${settings.contactEmail}`} className={contactRowClass}>
                <div className={iconWrapClass}><Mail size={15} /></div>
                <span className="tracking-wide group-hover:text-gold transition break-all">{settings.contactEmail}</span>
              </a>
            )}
          </div>
        </div>

        {/* Explore */}
        <div>
          <h3 className={headingClass}>EXPLORE</h3>
          <ul className="space-y-3">
            {EXPLORE_LINKS.map((link) => (
              <li key={link}>
                <button onClick={() => onNavigate(link)} className={itemClass}>{link}</button>
              </li>
            ))}
          </ul>
        </div>

        {/* Customer Care */}
        <div>
          <h3 className={headingClass}>CUSTOMER CARE</h3>
          <ul className="space-y-3">
            {CARE_LINKS.map(({ label, tab }) => (
              <li key={tab}>
                <button onClick={() => onOpenSupport(tab)} className={itemClass}>{label}</button>
              </li>
            ))}
          </ul>
        </div>

        {/* Verified Stores */}
        <div>
          <h3 className={headingClass}>VERIFIED STORES</h3>
          <p className="text-sm leading-5 text-gray-400">
            Genuine AERON products are officially available on Amazon, Flipkart, Nykaa & authorized salon distributors.
          </p>
          <p className="text-sm leading-5 text-gray-500 mt-3">India • Prices shown in INR</p>
          {settings.priceDisclaimer && (
            <p className="text-xs leading-5 text-gray-600 mt-2">{settings.priceDisclaimer}</p>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 text-center text-xs text-gray-500 py-5 px-5">
        © {year} {settings.copyrightText}
      </div>
    </footer>
  );
};

export default Footer;
