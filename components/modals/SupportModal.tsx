import React, { useState } from 'react';
import { X, MessageCircle, Mail, ShieldCheck, ChevronDown, ChevronUp, PackageCheck } from 'lucide-react';
import { SiteSettings } from '@/types';

export type SupportTab = 'contact' | 'faqs' | 'warranty' | 'bulk' | null;

interface SupportModalProps {
  activeTab: SupportTab;
  onClose: () => void;
  settings: SiteSettings;
  faqs?: Array<{ question: string; answer: string }>;
}

const DEFAULT_FAQS = [
  {
    question: 'Where can I buy authentic AERON tools?',
    answer: 'Authentic AERON Professional styling tools are officially sold through verified store listings on Amazon, Flipkart, Nykaa, and authorized salon distribution partners. Always ensure you purchase from the official brand listing.',
  },
  {
    question: 'How do shipping, delivery, and returns work?',
    answer: 'Because orders are fulfilled directly by our marketplace partners (such as Amazon Prime and Flipkart Assured), delivery timelines, real-time tracking, and 7-day replacement/return windows are safely managed under their official buyer protection policies.',
  },
  {
    question: 'What is the warranty period for AERON tools?',
    answer: 'All AERON styling appliances come with a standard 1-Year Manufacturer Warranty covering heating elements, thermal controls, and motor defects from the date of purchase.',
  },
  {
    question: 'How do I claim or register my warranty?',
    answer: 'No complicated registration required! Just keep a PDF or screenshot of your Amazon/Flipkart invoice. If you ever need support, simply send your invoice and a short video of the issue to our WhatsApp support number.',
  },
  {
    question: 'Are AERON tools suitable for salon and daily use?',
    answer: 'Yes, our appliances are engineered with salon-grade tourmaline-ceramic technology, rapid PTC heaters, and 360-degree swivel cords specifically built to withstand high-repetition professional salon styling.',
  },
];

export const SupportModal: React.FC<SupportModalProps> = ({
  activeTab,
  onClose,
  settings,
  faqs,
}) => {
  const [currentTab, setCurrentTab] = useState<SupportTab>(activeTab || 'faqs');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  React.useEffect(() => {
    if (activeTab) setCurrentTab(activeTab);
  }, [activeTab]);

  if (!activeTab) return null;

  const faqList = (faqs && faqs.length > 0) ? faqs : DEFAULT_FAQS;
  const whatsappUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(settings.whatsappMessage)}`;
  const warrantyWhatsappUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent('Hi AERON, I want to register my warranty for my recent purchase.')}`;
  const bulkWhatsappUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent('Hi AERON, I am a salon owner interested in bulk purchases.')}`;

  return (
    <div className="modal">
      <div className="overlay" onClick={onClose} />
      <div className="modal-panel z-[81] max-w-2xl p-6 md:p-8">
        <button className="absolute right-4 top-4 z-10 bg-white p-2 hover:bg-gray-100 transition" aria-label="Close dialog" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="flex border-b border-[#e5e1d9] gap-2 md:gap-6 mb-6 overflow-x-auto text-xs font-bold tracking-wider uppercase">
          {(['contact', 'faqs', 'warranty', 'bulk'] as SupportTab[]).map((tab) => (
            <button
              key={tab!}
              onClick={() => setCurrentTab(tab)}
              className={`pb-3 border-b-2 transition whitespace-nowrap ${currentTab === tab ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'}`}
            >
              {tab === 'contact' ? 'Contact Us' : tab === 'faqs' ? 'FAQs' : tab === 'warranty' ? 'Warranty' : 'Salon & Bulk Orders'}
            </button>
          ))}
        </div>

        {currentTab === 'contact' && (
          <div>
            <p className="tag">GET IN TOUCH</p>
            <h2 className="serif text-3xl mt-1 mb-3">Customer Support</h2>
            <p className="text-sm text-gray-600 mb-6 leading-6">
              Have questions about an AERON tool? Our team is available Mon – Sat (10:00 AM – 7:00 PM IST).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 border border-[#e5e1d9] bg-[#faf8f5] hover:border-black transition group">
                <div className="w-12 h-12 bg-[#25D366] text-white rounded-full flex items-center justify-center shrink-0"><MessageCircle size={24} /></div>
                <div>
                  <h4 className="font-bold text-sm">WhatsApp Chat</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Quick replies in minutes</p>
                </div>
              </a>
              <a href={`mailto:${settings.supportEmail}?subject=AERON%20Customer%20Inquiry`} className="flex items-center gap-4 p-4 border border-[#e5e1d9] bg-[#faf8f5] hover:border-black transition group">
                <div className="w-12 h-12 bg-[#171717] text-white rounded-full flex items-center justify-center shrink-0"><Mail size={22} /></div>
                <div>
                  <h4 className="font-bold text-sm">Email Support</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{settings.supportEmail}</p>
                </div>
              </a>
            </div>
          </div>
        )}

        {currentTab === 'faqs' && (
          <div>
            <p className="tag">HELP & ASSISTANCE</p>
            <h2 className="serif text-3xl mt-1 mb-4">Frequently Asked Questions</h2>
            <div className="divide-y divide-[#eee]">
              {faqList.map((faq, i) => {
                const isOpen = openFaqIndex === i;
                return (
                  <div key={i} className="py-3">
                    <button onClick={() => setOpenFaqIndex(isOpen ? null : i)} className="w-full flex justify-between items-center text-left py-2 font-semibold text-sm hover:text-[#9e7b50] transition">
                      <span>{faq.question}</span>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {isOpen && <p className="text-xs text-gray-600 leading-6 pb-2 pr-4">{faq.answer}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {currentTab === 'warranty' && (
          <div>
            <p className="tag">PEACE OF MIND</p>
            <h2 className="serif text-3xl mt-1 mb-3">1-Year Brand Warranty</h2>
            <p className="text-sm text-gray-600 mb-6 leading-6">Every authentic AERON PROFESSIONAL appliance is backed by a 12-month manufacturer warranty.</p>
            <div className="space-y-3 bg-[#faf8f5] border border-[#e5e1d9] p-5 mb-6 text-xs text-gray-700 leading-6">
              <div className="flex items-start gap-3"><ShieldCheck className="text-[#a88556] shrink-0 mt-0.5" size={18} /><span><b>Step 1:</b> Keep your Amazon / Flipkart purchase invoice saved.</span></div>
              <div className="flex items-start gap-3"><PackageCheck className="text-[#a88556] shrink-0 mt-0.5" size={18} /><span><b>Step 2:</b> If any heating or motor issue arises, share invoice copy & a short video on WhatsApp.</span></div>
              <div className="flex items-start gap-3"><ShieldCheck className="text-[#a88556] shrink-0 mt-0.5" size={18} /><span><b>Step 3:</b> Our support team will guide you through replacement or repair service.</span></div>
            </div>
            <a href={warrantyWhatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-dark w-full text-center">CLAIM / REGISTER ON WHATSAPP</a>
          </div>
        )}

        {currentTab === 'bulk' && (
          <div>
            <p className="tag">B2B & TRADE PARTNERS</p>
            <h2 className="serif text-3xl mt-1 mb-3">Salon & Wholesale Inquiries</h2>
            <p className="text-sm text-gray-600 mb-6 leading-6">Equip your salon station or beauty academy with AERON Professional styling tools.</p>
            <div className="bg-[#faf8f5] border border-[#e5e1d9] p-5 mb-6 text-xs text-gray-600 leading-6">
              <p className="font-bold text-[#141414] text-sm mb-2">Trade Benefits:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Exclusive wholesale / distributor margins</li>
                <li>Priority warranty handling for salon stations</li>
                <li>Official AERON display material & styling guides</li>
              </ul>
            </div>
            <a href={bulkWhatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-dark w-full text-center">CHAT WITH TRADE DESK ON WHATSAPP</a>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportModal;
