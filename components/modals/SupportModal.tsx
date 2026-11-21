import React, { useState } from 'react';
import { X, MessageCircle, Mail, ShieldCheck, ChevronDown, ChevronUp, PackageCheck } from 'lucide-react';

export type SupportTab = 'contact' | 'faqs' | 'warranty' | 'bulk' | null;

interface SupportModalProps {
  activeTab: SupportTab;
  onClose: () => void;
}

// 💡 CONFIGURATION: Apna WhatsApp number aur email yahan daalein:
const WHATSAPP_NUMBER = '919876543210'; // e.g. 91 ke baad 10 digit number
const SUPPORT_EMAIL = 'support@aeronprofessional.com';

const FAQ_LIST = [
  {
    q: 'Where can I buy authentic AERON tools?',
    a: 'Authentic AERON Professional styling tools are officially sold through verified store listings on Amazon, Flipkart, Nykaa, and authorized salon distribution partners. Always ensure you purchase from the official brand listing.',
  },
  {
    q: 'How do shipping, delivery, and returns work?',
    a: 'Because orders are fulfilled directly by our marketplace partners (such as Amazon Prime and Flipkart Assured), delivery timelines, real-time tracking, and 7-day replacement/return windows are safely managed under their official buyer protection policies.',
  },
  {
    q: 'What is the warranty period for AERON tools?',
    a: 'All AERON styling appliances come with a standard 1-Year Manufacturer Warranty covering heating elements, thermal controls, and motor defects from the date of purchase.',
  },
  {
    q: 'How do I claim or register my warranty?',
    a: 'No complicated registration required! Just keep a PDF or screenshot of your Amazon/Flipkart invoice. If you ever need support, simply send your invoice and a short video of the issue to our WhatsApp support number.',
  },
  {
    q: 'Are AERON tools suitable for salon and daily use?',
    a: 'Yes, our appliances are engineered with salon-grade tourmaline-ceramic technology, rapid PTC heaters, and 360-degree swivel cords specifically built to withstand high-repetition professional salon styling.',
  },
];

/**
 * Universal Zero-Backend Customer Care Dialog (Contact, FAQs, Warranty, Bulk Orders)
 */
export const SupportModal: React.FC<SupportModalProps> = ({
  activeTab,
  onClose,
}) => {
  const [currentTab, setCurrentTab] = useState<SupportTab>(activeTab || 'faqs');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  React.useEffect(() => {
    if (activeTab) setCurrentTab(activeTab);
  }, [activeTab]);

  if (!activeTab) return null;

  return (
    <div className="modal">
      <div className="overlay" onClick={onClose} />

      <div className="modal-panel z-[81] max-w-2xl p-6 md:p-8">
        {/* Close Button */}
        <button
          className="absolute right-4 top-4 z-10 bg-white p-2 hover:bg-gray-100 transition"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        {/* Tab Switcher Buttons */}
        <div className="flex border-b border-[#e5e1d9] gap-2 md:gap-6 mb-6 overflow-x-auto text-xs font-bold tracking-wider uppercase">
          <button
            onClick={() => setCurrentTab('contact')}
            className={`pb-3 border-b-2 transition whitespace-nowrap ${
              currentTab === 'contact'
                ? 'border-black text-black'
                : 'border-transparent text-gray-400 hover:text-black'
            }`}
          >
            Contact Us
          </button>
          <button
            onClick={() => setCurrentTab('faqs')}
            className={`pb-3 border-b-2 transition whitespace-nowrap ${
              currentTab === 'faqs'
                ? 'border-black text-black'
                : 'border-transparent text-gray-400 hover:text-black'
            }`}
          >
            FAQs
          </button>
          <button
            onClick={() => setCurrentTab('warranty')}
            className={`pb-3 border-b-2 transition whitespace-nowrap ${
              currentTab === 'warranty'
                ? 'border-black text-black'
                : 'border-transparent text-gray-400 hover:text-black'
            }`}
          >
            Warranty
          </button>
          <button
            onClick={() => setCurrentTab('bulk')}
            className={`pb-3 border-b-2 transition whitespace-nowrap ${
              currentTab === 'bulk'
                ? 'border-black text-black'
                : 'border-transparent text-gray-400 hover:text-black'
            }`}
          >
            Salon & Bulk Orders
          </button>
        </div>

        {/* TAB 1: CONTACT US */}
        {currentTab === 'contact' && (
          <div>
            <p className="tag">GET IN TOUCH</p>
            <h2 className="serif text-3xl mt-1 mb-3">Customer Support</h2>
            <p className="text-sm text-gray-600 mb-6 leading-6">
              Have questions about an AERON tool or need help with your order? Our team is available Mon – Sat (10:00 AM – 7:00 PM IST).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* WhatsApp Button */}
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20AERON%20Support,%20I%20have%20an%20inquiry%20regarding%20your%20products.`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 border border-[#e5e1d9] bg-[#faf8f5] hover:border-black transition group"
              >
                <div className="w-12 h-12 bg-[#25D366] text-white rounded-full flex items-center justify-center shrink-0">
                  <MessageCircle size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">WhatsApp Chat</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Quick replies in minutes</p>
                </div>
              </a>

              {/* Email Button */}
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=AERON%20Customer%20Inquiry`}
                className="flex items-center gap-4 p-4 border border-[#e5e1d9] bg-[#faf8f5] hover:border-black transition group"
              >
                <div className="w-12 h-12 bg-[#171717] text-white rounded-full flex items-center justify-center shrink-0">
                  <Mail size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Email Support</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{SUPPORT_EMAIL}</p>
                </div>
              </a>
            </div>
          </div>
        )}

        {/* TAB 2: FAQS */}
        {currentTab === 'faqs' && (
          <div>
            <p className="tag">HELP & ASSISTANCE</p>
            <h2 className="serif text-3xl mt-1 mb-4">Frequently Asked Questions</h2>

            <div className="divide-y divide-[#eee]">
              {FAQ_LIST.map((faq, i) => {
                const isOpen = openFaqIndex === i;
                return (
                  <div key={i} className="py-3">
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                      className="w-full flex justify-between items-center text-left py-2 font-semibold text-sm hover:text-[#9e7b50] transition"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {isOpen && (
                      <p className="text-xs text-gray-600 leading-6 pb-2 pr-4">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: WARRANTY INFORMATION */}
        {currentTab === 'warranty' && (
          <div>
            <p className="tag">PEACE OF MIND</p>
            <h2 className="serif text-3xl mt-1 mb-3">1-Year Brand Warranty</h2>
            <p className="text-sm text-gray-600 mb-6 leading-6">
              Every authentic AERON PROFESSIONAL appliance is backed by a 12-month manufacturer warranty.
            </p>

            <div className="space-y-3 bg-[#faf8f5] border border-[#e5e1d9] p-5 mb-6 text-xs text-gray-700 leading-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="text-[#a88556] shrink-0 mt-0.5" size={18} />
                <span><b>Step 1:</b> Keep your Amazon / Flipkart purchase invoice saved.</span>
              </div>
              <div className="flex items-start gap-3">
                <PackageCheck className="text-[#a88556] shrink-0 mt-0.5" size={18} />
                <span><b>Step 2:</b> If any heating or motor issue arises, share invoice copy & a short video on WhatsApp.</span>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="text-[#a88556] shrink-0 mt-0.5" size={18} />
                <span><b>Step 3:</b> Our support team will guide you through replacement or repair service.</span>
              </div>
            </div>

            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20AERON,%20I%20want%20to%20register%20my%20warranty%20for%20my%20recent%20purchase.`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-dark w-full text-center"
            >
              CLAIM / REGISTER ON WHATSAPP
            </a>
          </div>
        )}

        {/* TAB 4: SALON & BULK ORDERS */}
        {currentTab === 'bulk' && (
          <div>
            <p className="tag">B2B & TRADE PARTNERS</p>
            <h2 className="serif text-3xl mt-1 mb-3">Salon & Wholesale Inquiries</h2>
            <p className="text-sm text-gray-600 mb-6 leading-6">
              Equip your salon station or beauty academy with AERON Professional styling tools. We offer special pricing for salon owners, hairstylists, and beauty academies ordering in bulk.
            </p>

            <div className="bg-[#faf8f5] border border-[#e5e1d9] p-5 mb-6 text-xs text-gray-600 leading-6">
              <p className="font-bold text-[#141414] text-sm mb-2">Trade Benefits:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Exclusive wholesale / distributor margins</li>
                <li>Priority warranty handling for salon stations</li>
                <li>Official AERON display material & styling guides</li>
              </ul>
            </div>

            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20AERON,%20I%20am%20a%20salon%20owner%20interested%20in%20bulk%20purchases.`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-dark w-full text-center"
            >
              CHAT WITH TRADE DESK ON WHATSAPP
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportModal;