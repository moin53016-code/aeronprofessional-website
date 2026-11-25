
'use client';

import React, { useState } from 'react';

import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronUp,
  Headphones,
  Mail,
  MessageCircle,
  Search,
  ShieldCheck,
  Store,
  FileText,
  PackageCheck,
  CheckCircle2,
} from 'lucide-react';

import type { SiteSettings } from '@/types';

interface CustomerCareViewProps {
  settings: SiteSettings;
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
}

type Section = 'contact' | 'faqs' | 'warranty' | 'bulk';

const sections = [
  {
    id: 'contact',
    title: 'Contact Us',
    subtitle: 'Speak with our team',
    icon: Headphones,
    number: '01',
  },
  {
    id: 'faqs',
    title: 'FAQs',
    subtitle: 'Find your answers',
    icon: MessageCircle,
    number: '02',
  },
  {
    id: 'warranty',
    title: 'Warranty',
    subtitle: 'Product assistance',
    icon: ShieldCheck,
    number: '03',
  },
  {
    id: 'bulk',
    title: 'Salon & Bulk',
    subtitle: 'Business enquiries',
    icon: Store,
    number: '04',
  },
] as const;

const fallbackFaqs = [
  {
    question: 'Where can I buy AERON products?',
    answer:
      'Browse our styling tools and use the verified retailer links shown on each product listing.',
  },
  {
    question: 'How does delivery work?',
    answer:
      'Orders are fulfilled by the marketplace or seller you choose. Tracking, delivery and returns follow that platform’s applicable policies.',
  },
  {
    question: 'How do I get warranty assistance?',
    answer:
      'Keep your purchase invoice and product model details ready. Contact our support team through WhatsApp or email to request assistance.',
  },
  {
    question: 'Can I enquire about salon or bulk orders?',
    answer:
      'Yes. Salon owners, distributors and beauty academies can contact our team about professional and bulk purchase requirements.',
  },
];

const eyebrow =
  'text-[10px] font-bold uppercase tracking-[0.22em] text-[#a27c4c]';

const darkButton =
  'inline-flex min-h-12 items-center justify-center gap-3 rounded-sm bg-[#191919] px-6 py-3 text-xs font-semibold tracking-wide text-white transition-colors hover:bg-[#987345]';

export const CustomerCareView: React.FC<
  CustomerCareViewProps
> = ({ settings, faqs }) => {
  const [active, setActive] =
    useState<Section>('contact');

  const [faqSearch, setFaqSearch] = useState('');
  const [openFaq, setOpenFaq] =
    useState<number | null>(0);

  const [copied, setCopied] = useState(false);

  const whatsappNumber = (
    settings.whatsappNumber || ''
  ).replace(/\D/g, '');

  const supportEmail =
    settings.supportEmail || settings.contactEmail || '';

  const whatsappLink = (message: string) =>
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      message
    )}`;

  const faqItems =
    faqs && faqs.length > 0
      ? faqs
      : fallbackFaqs;

  const filteredFaqs = faqItems.filter((item) =>
    `${item.question} ${item.answer}`
      .toLowerCase()
      .includes(faqSearch.trim().toLowerCase())
  );

  const changeSection = (section: Section) => {
    setActive(section);
    setOpenFaq(0);
  };

  const copyEmail = async () => {
    if (!supportEmail) return;

    try {
      await navigator.clipboard.writeText(supportEmail);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="min-h-[calc(100dvh-150px)] bg-[#faf9f6] text-[#1d1b18]">
      {/* REFINED HERO */}

      <section className="relative overflow-hidden border-b border-[#e6e0d8] bg-[#f1eee9]">
        <div className="pointer-events-none absolute -right-20 -top-44 h-[340px] w-[340px] rounded-full border border-[#c7ab85]/20 sm:h-[480px] sm:w-[480px]" />

        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 sm:py-16 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div className="max-w-2xl">
            <p className={eyebrow}>
              AERON PROFESSIONAL / HELP CENTER
            </p>

            <h1 className="serif mt-4 text-[clamp(2.8rem,5vw,4.5rem)] leading-[1.08] tracking-tight">
              Here to help<span className="text-[#b69870]">.</span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-[#67615a] sm:text-base">
              Product questions, warranty support
              or professional enquiries. Everything
              you need, in one place.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 border-t border-[#ded5c9] pt-5 lg:border-t-0 lg:pt-0">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#bd9c70]/50 bg-white text-[#9d794c]">
              <Headphones size={21} />
            </span>

            <div>
              <p className="text-xs font-semibold">
                AERON Customer Care
              </p>
              <p className="mt-1 text-xs text-[#80796e]">
                Select a service below
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SUPPORT WORKSPACE */}

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-7">
          <p className={eyebrow}>PERSONAL ASSISTANCE</p>

          <h2 className="serif mt-2 text-2xl sm:text-3xl">
            How can we assist you?
          </h2>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[275px_minmax(0,1fr)] lg:gap-7">
          {/* INTERACTIVE MENU */}

          <div
            role="tablist"
            aria-label="Customer care services"
            className="grid grid-cols-2 gap-2 self-start sm:grid-cols-4 lg:grid-cols-1"
          >
            {sections.map((section) => {
              const Icon = section.icon;
              const selected = active === section.id;

              return (
                <button
                  key={section.id}
                  id={`aeron-care-tab-${section.id}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="aeron-care-content"
                  onClick={() =>
                    changeSection(section.id)
                  }
                  className={`group flex min-w-0 items-center gap-3 rounded-sm border px-3 py-4 text-left transition-all duration-200 sm:px-4 lg:px-5 ${
                    selected
                      ? 'border-[#191919] bg-[#191919] text-white shadow-md'
                      : 'border-[#e6e0d8] bg-white hover:border-[#b69870] hover:bg-[#f6f2ec]'
                  }`}
                >
                  <Icon
                    size={20}
                    className={`shrink-0 ${
                      selected
                        ? 'text-[#d3b386]'
                        : 'text-[#a27c4c]'
                    }`}
                  />

                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold sm:text-sm">
                      {section.title}
                    </span>

                    <span
                      className={`mt-1 hidden text-[11px] leading-4 sm:block ${
                        selected
                          ? 'text-[#c7c4bf]'
                          : 'text-[#89827a]'
                      }`}
                    >
                      {section.subtitle}
                    </span>
                  </span>

                  <ArrowRight
                    size={15}
                    className={`hidden shrink-0 lg:block ${
                      selected
                        ? 'text-[#d3b386]'
                        : 'text-[#bdb6ae]'
                    }`}
                  />
                </button>
              );
            })}

            <div className="mt-4 hidden border-t border-[#e4ded5] pt-5 lg:block">
              <p className={eyebrow}>NEED MORE HELP?</p>
              <p className="mt-2 text-xs leading-6 text-[#79736c]">
                Select Contact Us to reach our
                customer support team directly.
              </p>
            </div>
          </div>

          {/* CONTENT PANEL */}

          <div
            id="aeron-care-content"
            role="tabpanel"
            aria-labelledby={`aeron-care-tab-${active}`}
            key={active}
            className="min-w-0 overflow-hidden rounded-sm border border-[#e6e0d8] bg-white shadow-[0_12px_40px_rgba(43,31,15,0.035)] motion-safe:animate-[fadeIn_250ms_ease-out]"
          >
            {active === 'contact' && (
              <div className="p-5 sm:p-8 lg:p-10">
                <p className={eyebrow}>
                  CONNECT WITH AERON
                </p>

                <h3 className="serif mt-3 text-3xl sm:text-4xl">
                  Let's talk.
                </h3>

                <p className="mt-3 max-w-xl text-sm leading-7 text-[#726c64]">
                  Whether you need product guidance
                  or after-sales assistance, we're
                  ready to hear from you.
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  {whatsappNumber && (
                    <a
                      href={whatsappLink(
                        settings.whatsappMessage ||
                          'Hi AERON Professional, I need assistance.'
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex min-h-[210px] flex-col justify-between border border-[#e5dfd6] bg-[#faf9f6] p-5 transition-colors hover:border-[#b69870] sm:p-6"
                    >
                      <div className="flex items-start justify-between">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eae1d4] text-[#937248]">
                          <MessageCircle size={21} />
                        </span>
                        <ArrowUpRight
                          size={19}
                          className="text-[#9b7a51] transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
                        />
                      </div>

                      <div className="mt-6">
                        <h4 className="text-lg font-semibold">
                          WhatsApp
                        </h4>

                        <p className="mt-2 text-xs leading-6 text-[#777067]">
                          Message our team about your
                          enquiry or product.
                        </p>

                        <p className="mt-4 text-sm font-semibold text-[#987345]">
                          {settings.businessPhone ||
                            `+${whatsappNumber}`}
                        </p>
                      </div>
                    </a>
                  )}

                  {supportEmail && (
                    <div className="flex min-h-[210px] flex-col justify-between border border-[#e5dfd6] bg-[#faf9f6] p-5 sm:p-6">
                      <div className="flex items-start justify-between">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eae1d4] text-[#937248]">
                          <Mail size={21} />
                        </span>

                        <button
                          type="button"
                          onClick={copyEmail}
                          className="flex min-h-9 items-center gap-1 rounded-sm border border-[#ddd3c6] px-3 text-[11px] font-semibold hover:border-[#9b7a51]"
                        >
                          {copied ? (
                            <>
                              <Check size={13} />
                              Copied
                            </>
                          ) : (
                            'Copy email'
                          )}
                        </button>
                      </div>

                      <div className="mt-6">
                        <h4 className="text-lg font-semibold">
                          Email Support
                        </h4>

                        <p className="mt-2 text-xs leading-6 text-[#777067]">
                          Send us your detailed question
                          or support request.
                        </p>

                        <a
                          href={`mailto:${supportEmail}?subject=${encodeURIComponent(
                            'AERON Professional Support'
                          )}`}
                          className="mt-4 block break-all text-sm font-semibold text-[#987345] underline-offset-4 hover:underline"
                        >
                          {supportEmail}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {active === 'faqs' && (
              <div className="p-5 sm:p-8 lg:p-10">
                <p className={eyebrow}>HELP & ANSWERS</p>

                <h3 className="serif mt-3 text-3xl sm:text-4xl">
                  Frequently asked questions.
                </h3>

                <p className="mt-3 text-sm leading-7 text-[#726c64]">
                  Search a question or browse the
                  answers below.
                </p>

                <div className="relative mt-7">
                  <Search
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9b7a51]"
                  />

                  <input
                    type="search"
                    value={faqSearch}
                    onChange={(event) => {
                      setFaqSearch(event.target.value);
                      setOpenFaq(null);
                    }}
                    placeholder="Search help topics..."
                    aria-label="Search frequently asked questions"
                    className="min-h-12 w-full border border-[#ddd5ca] bg-[#faf9f6] py-3 pl-12 pr-4 text-sm outline-none focus:border-[#9b7a51]"
                  />
                </div>

                <div className="mt-5 divide-y divide-[#ebe6df] border-y border-[#ebe6df]">
                  {filteredFaqs.length > 0 ? (
                    filteredFaqs.map((faq, index) => {
                      const expanded = openFaq === index;

                      return (
                        <div
                          key={`${faq.question}-${index}`}
                        >
                          <button
                            type="button"
                            aria-expanded={expanded}
                            aria-controls={`aeron-answer-${index}`}
                            onClick={() =>
                              setOpenFaq(
                                expanded ? null : index
                              )
                            }
                            className="flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold leading-6 hover:text-[#987345]"
                          >
                            <span>{faq.question}</span>

                            {expanded ? (
                              <ChevronUp
                                size={18}
                                className="shrink-0 text-[#987345]"
                              />
                            ) : (
                              <ChevronDown
                                size={18}
                                className="shrink-0 text-[#987345]"
                              />
                            )}
                          </button>

                          {expanded && (
                            <div
                              id={`aeron-answer-${index}`}
                              className="pb-5 pr-5 text-sm leading-7 text-[#726c64]"
                            >
                              {faq.answer}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-10 text-center">
                      <p className="text-sm font-semibold">
                        No matching questions
                      </p>
                      <p className="mt-2 text-xs text-[#79736c]">
                        Try a different search term.
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setFaqSearch('')
                        }
                        className="mt-4 text-xs font-semibold text-[#987345] underline"
                      >
                        Clear search
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {active === 'warranty' && (
              <div className="p-5 sm:p-8 lg:p-10">
                <p className={eyebrow}>
                  PRODUCT ASSURANCE
                </p>

                <h3 className="serif mt-3 text-3xl sm:text-4xl">
                  Warranty & service.
                </h3>

                <p className="mt-3 max-w-xl text-sm leading-7 text-[#726c64]">
                  Need support for your AERON tool?
                  Follow these simple steps to share
                  the information our team needs.
                </p>

                <div className="mt-8 space-y-3">
                  {[
                    {
                      number: '01',
                      icon: FileText,
                      title: 'Keep your invoice',
                      text: 'Have your proof of purchase and order details available.',
                    },
                    {
                      number: '02',
                      icon: PackageCheck,
                      title: 'Describe the issue',
                      text: 'Share your product model and relevant photos or video.',
                    },
                    {
                      number: '03',
                      icon: CheckCircle2,
                      title: 'Get guided assistance',
                      text: 'Our support team will explain the available next steps.',
                    },
                  ].map((step) => {
                    const Icon = step.icon;

                    return (
                      <div
                        key={step.number}
                        className="flex items-start gap-4 border border-[#e8e2d9] bg-[#faf9f6] p-4 sm:p-5"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eae1d4] text-[#937248]">
                          <Icon size={19} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className={eyebrow}>
                            STEP {step.number}
                          </span>

                          <h4 className="mt-1 text-sm font-semibold">
                            {step.title}
                          </h4>

                          <p className="mt-1 text-xs leading-6 text-[#726c64] sm:text-sm">
                            {step.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-5 text-xs leading-6 text-[#898178]">
                  Warranty eligibility is subject to
                  the terms applicable to your product.
                </p>

                {whatsappNumber ? (
                  <a
                    href={whatsappLink(
                      'Hi AERON Professional, I need warranty assistance.'
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${darkButton} mt-6`}
                  >
                    REQUEST WARRANTY SUPPORT
                    <ArrowUpRight size={16} />
                  </a>
                ) : (
                  supportEmail && (
                    <a
                      href={`mailto:${supportEmail}?subject=Warranty%20Support`}
                      className={`${darkButton} mt-6`}
                    >
                      EMAIL SUPPORT
                      <ArrowRight size={16} />
                    </a>
                  )
                )}
              </div>
            )}

            {active === 'bulk' && (
              <div className="p-5 sm:p-8 lg:p-10">
                <p className={eyebrow}>
                  PROFESSIONAL PARTNERSHIPS
                </p>

                <h3 className="serif mt-3 text-3xl leading-tight sm:text-4xl">
                  Let's grow together.
                </h3>

                <p className="mt-3 max-w-xl text-sm leading-7 text-[#726c64]">
                  Salon owners, distributors and beauty
                  academies can connect with AERON for
                  professional product enquiries.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {[
                    'Salon equipment enquiries',
                    'Wholesale purchases',
                    'Distributor enquiries',
                    'Beauty academy requirements',
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex min-h-16 items-center gap-3 border border-[#e8e2d9] bg-[#faf9f6] p-4"
                    >
                      <Check
                        size={17}
                        className="shrink-0 text-[#987345]"
                      />
                      <span className="text-sm font-medium">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-between gap-5 border-t border-[#ebe6df] pt-6">
                  <div>
                    <p className="text-sm font-semibold">
                      Ready to enquire?
                    </p>

                    <p className="mt-1 text-xs text-[#726c64]">
                      Tell us about your business needs.
                    </p>
                  </div>

                  {whatsappNumber ? (
                    <a
                      href={whatsappLink(
                        'Hi AERON Professional, I would like to enquire about salon and bulk purchases.'
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={darkButton}
                    >
                      START AN ENQUIRY
                      <ArrowUpRight size={16} />
                    </a>
                  ) : (
                    supportEmail && (
                      <a
                        href={`mailto:${supportEmail}?subject=Salon%20and%20Bulk%20Enquiry`}
                        className={darkButton}
                      >
                        EMAIL OUR TEAM
                        <ArrowRight size={16} />
                      </a>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default CustomerCareView;