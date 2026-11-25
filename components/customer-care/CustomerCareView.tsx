
'use client';

import React, { useState } from 'react';

import {
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Headphones,
  Mail,
  MessageCircle,
  ShieldCheck,
  PackageCheck,
  Store,
  FileText,
} from 'lucide-react';

import { SiteSettings } from '@/types';

interface CustomerCareViewProps {
  settings: SiteSettings;
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
}

const DEFAULT_FAQS = [
  {
    question: 'Where can I buy authentic AERON tools?',
    answer:
      'You can explore AERON Professional styling tools through the verified marketplace links provided on our product listings.',
  },
  {
    question: 'How does shipping and delivery work?',
    answer:
      'Orders placed through marketplace partners follow the delivery and tracking processes of the respective seller or platform.',
  },
  {
    question: 'What is the warranty period?',
    answer:
      'AERON Professional offers a 1-year manufacturer warranty on eligible styling appliances. Check your product documentation for applicable terms and exclusions.',
  },
  {
    question: 'How can I request warranty assistance?',
    answer:
      'Keep your purchase invoice and product details ready. Contact our support team through WhatsApp or email to receive assistance.',
  },
  {
    question: 'Can salon owners enquire about bulk orders?',
    answer:
      'Yes. Salon owners, distributors and beauty academies can contact the AERON team for bulk purchase enquiries.',
  },
];

const sectionTag =
  'text-[11px] font-bold uppercase tracking-[0.22em] text-[#a47c49]';

const cardClass =
  'group min-w-0 border border-[#e6e0d7] bg-white p-5 transition-colors hover:border-[#b69a76] sm:p-7';

export const CustomerCareView: React.FC<
  CustomerCareViewProps
> = ({ settings, faqs }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqItems =
    faqs && faqs.length > 0 ? faqs : DEFAULT_FAQS;

  const whatsappNumber = settings.whatsappNumber.replace(
    /\D/g,
    ''
  );

  const whatsappLink = (message: string) =>
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      message
    )}`;

  const mainWhatsAppUrl = whatsappLink(
    settings.whatsappMessage ||
      'Hi AERON Professional, I need assistance.'
  );

  const warrantyWhatsAppUrl = whatsappLink(
    'Hi AERON Professional, I need help with my product warranty.'
  );

  const bulkWhatsAppUrl = whatsappLink(
    'Hi AERON Professional, I am interested in salon or bulk purchases.'
  );

  const supportEmail =
    settings.supportEmail || settings.contactEmail;

  return (
    <main className="min-h-[70vh] w-full bg-[#faf9f6] text-[#171717]">
      {/* HERO */}

      <section className="border-b border-[#e5e1d9] bg-[#f1eee8]">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.4fr_0.6fr] lg:items-end lg:px-8 lg:py-24">
          <div>
            <p className={sectionTag}>
              AERON PROFESSIONAL / SUPPORT
            </p>

            <h1 className="serif mt-5 text-[clamp(2.8rem,7vw,5.6rem)] leading-[1.05] tracking-tight">
              Customer Care
            </h1>

            <p className="mt-6 max-w-2xl text-sm leading-8 text-gray-600 sm:text-base">
              From choosing the right styling tool to
              product support and warranty assistance,
              we&apos;re here to help you.
            </p>
          </div>

          <div className="flex items-center gap-4 border-t border-[#d8d0c5] pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#171717] text-[#c6a77a]">
              <Headphones size={26} />
            </div>

            <div>
              <p className="text-xs font-bold tracking-wider">
                NEED ASSISTANCE?
              </p>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                Reach our team through the contact
                options below.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK SECTION LINKS */}

      <nav
        aria-label="Customer care sections"
        className="border-b border-[#e5e1d9] bg-white"
      >
        <div className="mx-auto flex w-full max-w-7xl gap-6 overflow-x-auto px-4 py-4 sm:gap-9 sm:px-6 lg:px-8">
          {[
            ['Contact', 'care-contact'],
            ['FAQs', 'care-faqs'],
            ['Warranty', 'care-warranty'],
            ['Salon & Bulk', 'care-bulk'],
          ].map(([label, id]) => (
            <a
              key={id}
              href={`#${id}`}
              className="shrink-0 whitespace-nowrap text-xs font-semibold tracking-wide text-[#171717] hover:text-[#a47c49]"
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      {/* CONTACT SECTION */}

      <section
        id="care-contact"
        className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <p className={sectionTag}>GET IN TOUCH</p>

          <h2 className="serif mt-3 text-3xl sm:text-5xl">
            How can we help you?
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600">
            Choose the way that works best for you.
            Please include your product model and
            purchase details when requesting support.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* WHATSAPP */}

            {whatsappNumber && (
              <a
                href={mainWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cardClass}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-13 w-13 items-center justify-center rounded-full bg-[#f0e9df] p-3 text-[#88663c]">
                    <MessageCircle size={23} />
                  </div>

                  <ArrowUpRight
                    size={21}
                    className="text-gray-400 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
                  />
                </div>

                <h3 className="mt-7 text-xl font-semibold">
                  WhatsApp Support
                </h3>

                <p className="mt-3 text-sm leading-7 text-gray-600">
                  Chat with our team for product
                  assistance, enquiries and support.
                </p>

                <p className="mt-6 break-words text-sm font-semibold text-[#99754b]">
                  {settings.businessPhone ||
                    `+${whatsappNumber}`}
                </p>
              </a>
            )}

            {/* EMAIL */}

            {supportEmail && (
              <a
                href={`mailto:${supportEmail}?subject=${encodeURIComponent(
                  'AERON Professional Customer Support'
                )}`}
                className={cardClass}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-13 w-13 items-center justify-center rounded-full bg-[#f0e9df] p-3 text-[#88663c]">
                    <Mail size={23} />
                  </div>

                  <ArrowUpRight
                    size={21}
                    className="text-gray-400 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
                  />
                </div>

                <h3 className="mt-7 text-xl font-semibold">
                  Email Support
                </h3>

                <p className="mt-3 text-sm leading-7 text-gray-600">
                  Send us a detailed enquiry and our
                  team can review your request.
                </p>

                <p className="mt-6 break-all text-sm font-semibold text-[#99754b]">
                  {supportEmail}
                </p>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* WARRANTY SECTION */}

      <section
        id="care-warranty"
        className="scroll-mt-28 bg-[#f1eee8] px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <p className={sectionTag}>PRODUCT ASSURANCE</p>

            <h2 className="serif mt-4 text-3xl leading-tight sm:text-5xl">
              Warranty & Product Support
            </h2>

            <p className="mt-5 text-sm leading-8 text-gray-600">
              Keep your purchase invoice and product
              information ready. Warranty eligibility
              is subject to the terms applicable to
              your product.
            </p>

            {whatsappNumber && (
              <a
                href={warrantyWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 bg-[#171717] px-6 py-3 text-xs font-bold tracking-wider text-white transition-colors hover:bg-[#99754b]"
              >
                REQUEST WARRANTY SUPPORT
                <ArrowUpRight size={17} />
              </a>
            )}
          </div>

          <div className="space-y-4">
            {[
              {
                icon: FileText,
                step: '01',
                title: 'Keep your invoice',
                description:
                  'Save the purchase invoice or order confirmation for reference.',
              },
              {
                icon: PackageCheck,
                step: '02',
                title: 'Share product details',
                description:
                  'Provide the product model and a description of the issue. Photos or a short video may help.',
              },
              {
                icon: ShieldCheck,
                step: '03',
                title: 'Get assistance',
                description:
                  'Our team can guide you through the available support process.',
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.step}
                  className="flex items-start gap-4 border border-[#e2dbd1] bg-white p-5 sm:p-6"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#f5f0e8] text-[#987345]">
                    <Icon size={22} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold tracking-widest text-[#987345]">
                      STEP {item.step}
                    </p>

                    <h3 className="mt-1 text-base font-semibold">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-sm leading-7 text-gray-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}

      <section
        id="care-faqs"
        className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className={sectionTag}>
              ANSWERS TO YOUR QUESTIONS
            </p>

            <h2 className="serif mt-4 text-3xl sm:text-5xl">
              Frequently Asked Questions
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-gray-600">
              Helpful answers about shopping,
              product care and support.
            </p>
          </div>

          <div className="mt-10 divide-y divide-[#e5e1d9] border-y border-[#e5e1d9]">
            {faqItems.map((faq, index) => {
              const isOpen = openFaq === index;

              return (
                <div key={`${faq.question}-${index}`}>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenFaq(isOpen ? null : index)
                    }
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-5 py-5 text-left text-sm font-semibold leading-6 transition-colors hover:text-[#99754b] sm:py-6 sm:text-base"
                  >
                    <span>{faq.question}</span>

                    {isOpen ? (
                      <ChevronUp
                        size={19}
                        className="shrink-0"
                      />
                    ) : (
                      <ChevronDown
                        size={19}
                        className="shrink-0"
                      />
                    )}
                  </button>

                  {isOpen && (
                    <p className="max-w-3xl pb-6 pr-5 text-sm leading-8 text-gray-600">
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SALON AND BULK */}

      <section
        id="care-bulk"
        className="scroll-mt-28 bg-[#171717] px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className={sectionTag}>
              PROFESSIONAL PARTNERSHIPS
            </p>

            <h2 className="serif mt-4 text-3xl leading-tight sm:text-5xl">
              Salon & Bulk Enquiries
            </h2>

            <p className="mt-5 max-w-2xl text-sm leading-8 text-gray-300">
              Are you a salon owner, distributor or
              beauty academy? Connect with us to
              discuss AERON Professional products
              and bulk purchase requirements.
            </p>
          </div>

          {whatsappNumber ? (
            <a
              href={bulkWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-3 bg-[#c6a77a] px-7 py-4 text-xs font-bold tracking-wider text-[#171717] transition-colors hover:bg-white"
            >
              <Store size={18} />
              ENQUIRE ON WHATSAPP
              <ArrowUpRight size={17} />
            </a>
          ) : (
            supportEmail && (
              <a
                href={`mailto:${supportEmail}?subject=Salon%20and%20Bulk%20Enquiry`}
                className="inline-flex min-h-12 items-center justify-center gap-3 bg-[#c6a77a] px-7 py-4 text-xs font-bold tracking-wider text-[#171717] transition-colors hover:bg-white"
              >
                <Mail size={18} />
                EMAIL OUR TEAM
              </a>
            )
          )}
        </div>
      </section>
    </main>
  );
};

export default CustomerCareView;
