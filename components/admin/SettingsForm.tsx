
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import {
  Save,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Mail,
  ShieldCheck,
} from 'lucide-react';

interface SettingsFormProps {
  initialSettings: Record<string, string>;
}

// DEFAULT WEBSITE SETTINGS

const DEFAULTS: Record<string, string> = {
  brandName: 'AERON PROFESSIONAL',

  announcementBarText:
    'WELCOME TO AERON PROFESSIONAL ✦ ELEVATE YOUR EVERYDAY STYLE',

  announcementBarVisible: 'true',

  instagramUrl:
    'https://instagram.com/aeronproffessional',

  instagramHandle:
    '@aeronproffessional',

  // WHATSAPP SUPPORT

  whatsappNumber: '919819628073',

  whatsappMessage:
    'Hi AERON Professional, I have an inquiry.',

  whatsappUrl: '',

  // EMAIL SUPPORT

  contactEmail:
    'tkgroupsofindia@yahoo.co.in',

  supportEmail:
    'tkgroupsofindia@yahoo.co.in',

  // WARRANTY SUPPORT

  warrantySupportUrl: '',

  // BUSINESS INFORMATION

  businessPhone: '+91 98196 28073',

  copyrightText:
    'AERON PROFESSIONAL. All rights reserved.',

  priceDisclaimer:
    'Prices and availability may vary by retailer.',

  seoTitle:
    'AERON PROFESSIONAL | Salon-Grade Styling Tools',

  seoDescription:
    'Discover premium professional hair dryers, straighteners, curling tools and salon essentials.',
};

// COMMON FORM STYLES

const fieldClass =
  'w-full min-w-0 rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black disabled:opacity-60';

const labelClass =
  'mb-1.5 block text-xs font-bold tracking-wider text-gray-600';

const sectionClass =
  'space-y-4 rounded-lg border border-gray-200 bg-white p-4 sm:p-6';

// URL VALIDATION

function isValidUrl(
  value: string,
  httpsOnly = true
): boolean {
  if (!value) return true;

  try {
    const url = new URL(value);

    return (
      Boolean(url.hostname) &&
      !url.username &&
      !url.password &&
      (
        url.protocol === 'https:' ||
        (!httpsOnly && url.protocol === 'http:')
      )
    );
  } catch {
    return false;
  }
}

// WHATSAPP URL VALIDATION

function isValidWhatsAppUrl(
  value: string
): boolean {
  if (!value) return true;

  if (!isValidUrl(value)) return false;

  const url = new URL(value);

  return [
    'wa.me',
    'api.whatsapp.com',
    'web.whatsapp.com',
    'whatsapp.com',
    'www.whatsapp.com',
  ].includes(url.hostname.toLowerCase());
}

// REUSABLE TEXT FIELD

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block min-w-0">

      <span className={labelClass}>
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className={fieldClass}
      />

      {hint && (
        <span className="mt-1.5 block text-xs leading-5 text-gray-500">
          {hint}
        </span>
      )}

    </label>
  );
}

// REUSABLE TEXTAREA FIELD

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  rows?: number;
}) {
  return (
    <label className="block min-w-0">

      <span className={labelClass}>
        {label}
      </span>

      <textarea
        rows={rows}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className={`${fieldClass} resize-y`}
      />

      {hint && (
        <span className="mt-1.5 block text-xs leading-5 text-gray-500">
          {hint}
        </span>
      )}

    </label>
  );
}

// MAIN SETTINGS FORM

export default function SettingsForm({
  initialSettings,
}: SettingsFormProps) {
  const router = useRouter();

  const [settings, setSettings] = useState<
    Record<string, string>
  >({
    ...DEFAULTS,
    ...initialSettings,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // UPDATE INDIVIDUAL SETTINGS

  const update = (
    key: string,
    value: string
  ) => {
    setSuccess(false);
    setError('');

    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  // SAVE WEBSITE SETTINGS

  const submit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (loading) return;

    setError('');
    setSuccess(false);

    // ONLY SEND EDITABLE FORM SETTINGS

    const payload: Record<string, string> =
      Object.fromEntries(
        Object.keys(DEFAULTS).map((key) => [
          key,
          settings[key] ?? DEFAULTS[key],
        ])
      );

    // NORMALIZE SETTINGS

    payload.instagramUrl =
      payload.instagramUrl.trim();

    payload.instagramHandle =
      payload.instagramHandle.trim();

    payload.whatsappNumber =
      payload.whatsappNumber
        .trim()
        .replace(/[\s()+-]/g, '');

    payload.whatsappMessage =
      payload.whatsappMessage.trim();

    payload.whatsappUrl =
      payload.whatsappUrl.trim();

    payload.contactEmail =
      payload.contactEmail.trim();

    payload.supportEmail =
      payload.supportEmail.trim();

    payload.warrantySupportUrl =
      payload.warrantySupportUrl.trim();

    payload.businessPhone =
      payload.businessPhone.trim();

    // VALIDATE WHATSAPP NUMBER

    if (
      payload.whatsappNumber &&
      !/^[1-9]\d{7,14}$/.test(
        payload.whatsappNumber
      )
    ) {
      setError(
        'Enter a valid WhatsApp number with country code.'
      );

      return;
    }

    // VALIDATE WHATSAPP URL

    if (
      !isValidWhatsAppUrl(
        payload.whatsappUrl
      )
    ) {
      setError(
        'Please enter a valid HTTPS WhatsApp URL, such as https://wa.me/919819628073.'
      );

      return;
    }

    // VALIDATE WARRANTY SUPPORT URL

    if (
      !isValidUrl(
        payload.warrantySupportUrl
      )
    ) {
      setError(
        'Warranty Support URL must be a valid HTTPS website link.'
      );

      return;
    }

    // VALIDATE INSTAGRAM URL

    if (
      !isValidUrl(
        payload.instagramUrl,
        false
      )
    ) {
      setError(
        'Please enter a valid Instagram URL.'
      );

      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        '/api/admin/settings',
        {
          method: 'PATCH',

          headers: {
            'Content-Type': 'application/json',
          },

          credentials: 'same-origin',

          cache: 'no-store',

          body: JSON.stringify(payload),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (
        !response.ok ||
        data?.success !== true
      ) {
        throw new Error(
          data?.error ||
          'Failed to save website settings.'
        );
      }

      // VERIFY SERVER SAVED THE NEW FIELDS

      if (
        data.settings?.whatsappUrl !==
          payload.whatsappUrl ||
        data.settings?.warrantySupportUrl !==
          payload.warrantySupportUrl
      ) {
        throw new Error(
          'Customer Care URLs could not be saved. Please check the updated settings API.'
        );
      }

      // UPDATE FORM WITH SAVED DATABASE VALUES

      setSettings({
        ...DEFAULTS,
        ...payload,
        ...(data.settings ?? {}),
      });

      setSuccess(true);

      router.refresh();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save website settings.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-4xl space-y-6"
    >

      {/* ERROR MESSAGE */}

      {error && (
        <div
          role="alert"
          className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle
            size={18}
            className="shrink-0"
          />

          {error}
        </div>
      )}

      {/* SUCCESS MESSAGE */}

      {success && (
        <div
          role="status"
          className="flex gap-2 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700"
        >
          <CheckCircle
            size={18}
            className="shrink-0"
          />

          Settings saved successfully.
        </div>
      )}

      <fieldset
        disabled={loading}
        className="min-w-0 space-y-6"
      >

        {/* CONTACT DETAILS */}

        <section className={sectionClass}>

          <div>
            <h2 className="text-lg font-semibold">
              Contact & Communication
            </h2>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Manage your general business contact
              information.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">

            <TextField
              label="CONTACT EMAIL"
              type="email"
              value={settings.contactEmail}
              onChange={(value) =>
                update('contactEmail', value)
              }
              placeholder="contact@example.com"
            />

            <TextField
              label="BUSINESS PHONE"
              type="tel"
              value={settings.businessPhone}
              onChange={(value) =>
                update('businessPhone', value)
              }
              placeholder="+91 98765 43210"
            />

          </div>

        </section>

        {/* CUSTOMER CARE CONFIGURATION */}

        <section className={sectionClass}>

          <div>

            <h2 className="text-lg font-semibold">
              Customer Care Configuration
            </h2>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Manage WhatsApp, email and warranty
              support links displayed on the
              Customer Care page.
            </p>

          </div>

          {/* WHATSAPP SUPPORT */}

          <div className="space-y-4 rounded-lg border border-gray-200 p-4">

            <div className="flex items-center gap-2">

              <MessageCircle
                size={21}
                className="text-green-600"
              />

              <h3 className="text-sm font-semibold text-gray-900">
                WhatsApp Support
              </h3>

            </div>

            <TextField
              label="WHATSAPP NUMBER"
              type="tel"
              value={settings.whatsappNumber}
              onChange={(value) =>
                update('whatsappNumber', value)
              }
              placeholder="919819628073"
              hint="Enter the number with country code."
            />

            <TextareaField
              label="DEFAULT MESSAGE"
              value={settings.whatsappMessage}
              onChange={(value) =>
                update('whatsappMessage', value)
              }
              placeholder="Hello AERON Professional, I need assistance."
              hint="This message is used when opening a chat using the WhatsApp number."
            />

            <TextField
              label="WHATSAPP URL LINK"
              type="url"
              value={settings.whatsappUrl}
              onChange={(value) =>
                update('whatsappUrl', value)
              }
              placeholder="https://wa.me/919819628073"
              hint="Optional. If provided, this link takes priority over the automatically generated WhatsApp link."
            />

          </div>

          {/* EMAIL SUPPORT */}

          <div className="space-y-4 rounded-lg border border-gray-200 p-4">

            <div className="flex items-center gap-2">

              <Mail
                size={21}
                className="text-[#977447]"
              />

              <h3 className="text-sm font-semibold text-gray-900">
                Email Support
              </h3>

            </div>

            <TextField
              label="SUPPORT EMAIL ADDRESS"
              type="email"
              value={settings.supportEmail}
              onChange={(value) =>
                update('supportEmail', value)
              }
              placeholder="support@example.com"
              hint="Customers will open their email compose window with this recipient. Subject and message will remain blank."
            />

          </div>

          {/* WARRANTY SUPPORT */}

          <div className="space-y-4 rounded-lg border border-gray-200 p-4">

            <div className="flex items-center gap-2">

              <ShieldCheck
                size={21}
                className="text-[#977447]"
              />

              <h3 className="text-sm font-semibold text-gray-900">
                Warranty Support
              </h3>

            </div>

            <TextField
              label="WARRANTY SUPPORT URL"
              type="url"
              value={settings.warrantySupportUrl}
              onChange={(value) =>
                update('warrantySupportUrl', value)
              }
              placeholder="https://..."
              hint="Enter any valid HTTPS URL, including Google Forms, WhatsApp, warranty registration pages or support websites."
            />

          </div>

        </section>

        {/* SOCIAL MEDIA LINKS */}

        <section className={sectionClass}>

          <h2 className="text-lg font-semibold">
            Social Media Links
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">

            <TextField
              label="INSTAGRAM PROFILE URL"
              type="url"
              value={settings.instagramUrl}
              onChange={(value) =>
                update('instagramUrl', value)
              }
              placeholder="https://instagram.com/..."
            />

            <TextField
              label="INSTAGRAM HANDLE"
              value={settings.instagramHandle}
              onChange={(value) =>
                update('instagramHandle', value)
              }
              placeholder="@username"
            />

          </div>

        </section>

        {/* BRAND AND GENERAL INFORMATION */}

        <section className={sectionClass}>

          <h2 className="text-lg font-semibold">
            Brand & General Information
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">

            <TextField
              label="BRAND NAME"
              value={settings.brandName}
              onChange={(value) =>
                update('brandName', value)
              }
            />

            <TextField
              label="COPYRIGHT TEXT"
              value={settings.copyrightText}
              onChange={(value) =>
                update('copyrightText', value)
              }
            />

          </div>

        </section>

        {/* ANNOUNCEMENT BAR */}

        <section className={sectionClass}>

          <h2 className="text-lg font-semibold">
            Announcement Bar
          </h2>

          <TextField
            label="ANNOUNCEMENT TEXT"
            value={settings.announcementBarText}
            onChange={(value) =>
              update('announcementBarText', value)
            }
          />

          <label className="flex cursor-pointer items-center gap-3">

            <input
              type="checkbox"
              checked={
                settings.announcementBarVisible ===
                'true'
              }
              onChange={(event) =>
                update(
                  'announcementBarVisible',
                  String(event.target.checked)
                )
              }
              className="h-4 w-4 accent-black"
            />

            <span className="text-sm">
              Show announcement bar on website
            </span>

          </label>

        </section>

        {/* PRICING AND DISCLAIMER */}

        <section className={sectionClass}>

          <h2 className="text-lg font-semibold">
            Pricing & Disclaimer
          </h2>

          <TextField
            label="PRICE DISCLAIMER"
            value={settings.priceDisclaimer}
            onChange={(value) =>
              update('priceDisclaimer', value)
            }
          />

        </section>

        {/* SEO SETTINGS */}

        <section className={sectionClass}>

          <h2 className="text-lg font-semibold">
            SEO & Search Results
          </h2>

          <TextField
            label="DEFAULT SEO TITLE"
            value={settings.seoTitle}
            onChange={(value) =>
              update('seoTitle', value)
            }
          />

          <TextareaField
            label="SEO DESCRIPTION"
            value={settings.seoDescription}
            onChange={(value) =>
              update('seoDescription', value)
            }
            rows={3}
          />

        </section>

        {/* SAVE SETTINGS BUTTON */}

        <div className="flex justify-end pb-6">

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="
              inline-flex
              min-h-12
              w-full
              items-center
              justify-center
              gap-2
              rounded-md
              bg-black
              px-7
              py-3
              text-xs
              font-bold
              tracking-wider
              text-white
              transition-colors
              hover:bg-gray-800
              disabled:cursor-not-allowed
              disabled:opacity-50
              sm:w-auto
            "
          >

            <Save size={16} />

            {loading
              ? 'SAVING...'
              : 'SAVE WEBSITE SETTINGS'}

          </button>

        </div>

      </fieldset>

    </form>
  );
}
