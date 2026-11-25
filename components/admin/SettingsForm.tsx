
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Save, CheckCircle, AlertCircle } from 'lucide-react';

interface SettingsFormProps {
  initialSettings: Record<string, string>;
}

// Matches the website's existing default settings.
const DEFAULTS: Record<string, string> = {
  brandName: 'AERON PROFESSIONAL',
  announcementBarText:
    'WELCOME TO AERON PROFESSIONAL ✦ ELEVATE YOUR EVERYDAY STYLE',
  announcementBarVisible: 'true',
  instagramUrl:
    'https://instagram.com/aeronproffessional',
  instagramHandle: '@aeronproffessional',
  whatsappNumber: '919819628073',
  whatsappMessage:
    'Hi AERON Professional, I have an inquiry.',
  contactEmail: 'tkgroupsofindia@yahoo.co.in',
  supportEmail: 'tkgroupsofindia@yahoo.co.in',
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

const fieldClass =
  'w-full min-w-0 rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black';

const labelClass =
  'mb-1.5 block text-xs font-bold tracking-wider text-gray-600';

const sectionClass =
  'space-y-4 rounded-lg border border-gray-200 bg-white p-4 sm:p-6';

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
      <span className={labelClass}>{label}</span>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={fieldClass}
      />

      {hint && (
        <span className="mt-1 block text-xs text-gray-500">
          {hint}
        </span>
      )}
    </label>
  );
}

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

  const [sameEmail, setSameEmail] = useState(
    !initialSettings.supportEmail ||
      (initialSettings.supportEmail ??
        DEFAULTS.supportEmail) ===
        (initialSettings.contactEmail ??
          DEFAULTS.contactEmail)
  );

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const update = (key: string, value: string) => {
    setSuccess(false);

    setSettings((previous) => ({
      ...previous,
      [key]: value,

      ...(key === 'contactEmail' && sameEmail
        ? { supportEmail: value }
        : {}),
    }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (loading) return;

    setError('');
    setSuccess(false);

    const payload = {
      ...settings,
      instagramUrl: settings.instagramUrl.trim(),
      instagramHandle: settings.instagramHandle.trim(),
      whatsappNumber:
        settings.whatsappNumber.replace(/\D/g, ''),
      contactEmail: settings.contactEmail.trim(),
      supportEmail: sameEmail
        ? settings.contactEmail.trim()
        : settings.supportEmail.trim(),
      businessPhone: settings.businessPhone.trim(),
    };

    if (
      payload.whatsappNumber &&
      !/^\d{8,15}$/.test(payload.whatsappNumber)
    ) {
      setError(
        'WhatsApp number must include country code and contain 8–15 digits. Example: 919819628073.'
      );
      return;
    }

    if (payload.instagramUrl) {
      try {
        const url = new URL(payload.instagramUrl);

        if (
          url.protocol !== 'https:' &&
          url.protocol !== 'http:'
        ) {
          throw new Error('Invalid protocol');
        }
      } catch {
        setError(
          'Please enter a valid Instagram URL starting with https://.'
        );
        return;
      }
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
          body: JSON.stringify(payload),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || 'Failed to save settings.'
        );
      }

      setSettings(payload);
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save settings.'
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
      {error && (
        <div
          role="alert"
          className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={18} className="shrink-0" />
          {error}
        </div>
      )}

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

      {/* CONTACT DETAILS */}

      <section className={sectionClass}>
        <div>
          <h2 className="text-lg font-semibold">
            Contact & Communication
          </h2>

          <p className="mt-1 text-xs leading-5 text-gray-500">
            Manage the contact information shown on
            your website.
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
            placeholder="yourname@yahoo.com"
          />

          <TextField
            label="BUSINESS PHONE"
            value={settings.businessPhone}
            onChange={(value) =>
              update('businessPhone', value)
            }
            placeholder="+91 98765 43210"
          />

          <TextField
            label="WHATSAPP NUMBER"
            type="tel"
            value={settings.whatsappNumber}
            onChange={(value) =>
              update('whatsappNumber', value)
            }
            hint="With country code. Example: 919819628073"
          />

          <TextField
            label="WHATSAPP MESSAGE"
            value={settings.whatsappMessage}
            onChange={(value) =>
              update('whatsappMessage', value)
            }
          />
        </div>

        {/* COMMON EMAIL SETTING */}

        <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={sameEmail}
              onChange={(event) => {
                const checked = event.target.checked;

                setSameEmail(checked);

                if (checked) {
                  setSettings((previous) => ({
                    ...previous,
                    supportEmail:
                      previous.contactEmail,
                  }));
                }
              }}
              className="mt-1 h-4 w-4 accent-black"
            />

            <span>
              <span className="block text-sm font-semibold">
                Use same email for Contact & Support
              </span>

              <span className="mt-1 block text-xs text-gray-500">
                Changing Contact Email will also
                update Support Email.
              </span>
            </span>
          </label>
        </div>

        {!sameEmail && (
          <TextField
            label="SEPARATE SUPPORT EMAIL"
            type="email"
            value={settings.supportEmail}
            onChange={(value) =>
              update('supportEmail', value)
            }
            placeholder="support@example.com"
          />
        )}
      </section>

      {/* SOCIAL MEDIA */}

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

      {/* GENERAL INFORMATION */}

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

      {/* ANNOUNCEMENT */}

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

      {/* PRICING */}

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

      {/* SEO */}

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

        <label className="block">
          <span className={labelClass}>
            SEO DESCRIPTION
          </span>

          <textarea
            rows={3}
            value={settings.seoDescription}
            onChange={(event) =>
              update(
                'seoDescription',
                event.target.value
              )
            }
            className={fieldClass}
          />
        </label>
      </section>

      {/* SAVE */}

      <div className="flex justify-end pb-6">
        <button
          type="submit"
          disabled={loading}
          className="
            inline-flex
            min-h-12
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
            hover:bg-gray-800
            disabled:opacity-50
          "
        >
          <Save size={16} />

          {loading
            ? 'SAVING...'
            : 'SAVE WEBSITE SETTINGS'}
        </button>
      </div>
    </form>
  );
}
