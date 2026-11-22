'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, CheckCircle } from 'lucide-react';

interface SettingsFormProps {
  initialSettings: Record<string, string>;
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [settings, setSettings] = useState<Record<string, string>>({
    brandName: initialSettings.brandName ?? 'AERON PROFESSIONAL',
    announcementBarText: initialSettings.announcementBarText ?? 'FREE SHIPPING ON ALL ORDERS ACROSS INDIA',
    announcementBarVisible: initialSettings.announcementBarVisible ?? 'true',
    instagramUrl: initialSettings.instagramUrl ?? 'https://instagram.com/aeronprofessional',
    instagramHandle: initialSettings.instagramHandle ?? '@aeronprofessional',
    whatsappNumber: initialSettings.whatsappNumber ?? '+919876543210',
    whatsappMessage: initialSettings.whatsappMessage ?? 'Hello AERON team, I am interested in your products.',
    contactEmail: initialSettings.contactEmail ?? 'contact@aeronprofessional.com',
    supportEmail: initialSettings.supportEmail ?? 'support@aeronprofessional.com',
    businessPhone: initialSettings.businessPhone ?? '+91 98765 43210',
    copyrightText: initialSettings.copyrightText ?? '© 2026 AERON PROFESSIONAL. All Rights Reserved.',
    priceDisclaimer: initialSettings.priceDisclaimer ?? 'Prices inclusive of all taxes. Free shipping across India.',
    seoTitle: initialSettings.seoTitle ?? 'AERON PROFESSIONAL | Precision Salon Grade Tools',
    seoDescription: initialSettings.seoDescription ?? 'Discover AERON Professional hair dryers, stylers and salon tools engineered for perfection.',
  });

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save settings');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = "w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black";
  const labelClass = "block text-xs font-bold tracking-wider text-gray-600 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-4 rounded flex items-center gap-2">
          <CheckCircle size={16} /> Settings successfully updated!
        </div>
      )}

      {/* Brand & General */}
      <div className="bg-white border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
          Brand & General Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>BRAND NAME</label>
            <input
              value={settings.brandName}
              onChange={(e) => handleChange('brandName', e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>COPYRIGHT TEXT</label>
            <input
              value={settings.copyrightText}
              onChange={(e) => handleChange('copyrightText', e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>
      </div>

      {/* Announcement Bar */}
      <div className="bg-white border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
          Announcement Bar
        </h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>ANNOUNCEMENT TEXT</label>
            <input
              value={settings.announcementBarText}
              onChange={(e) => handleChange('announcementBarText', e.target.value)}
              className={fieldClass}
              placeholder="SPECIAL PROMOTION OR SHIPPING MESSAGE"
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.announcementBarVisible === 'true'}
              onChange={(e) => handleChange('announcementBarVisible', e.target.checked ? 'true' : 'false')}
              className="accent-black w-4 h-4"
            />
            <span className="text-sm font-medium">Show Announcement Bar on Website</span>
          </label>
        </div>
      </div>

      {/* Contact & Support */}
      <div className="bg-white border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
          Contact & Communication
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>CONTACT EMAIL</label>
            <input
              type="email"
              value={settings.contactEmail}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>SUPPORT EMAIL</label>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => handleChange('supportEmail', e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>BUSINESS PHONE</label>
            <input
              value={settings.businessPhone}
              onChange={(e) => handleChange('businessPhone', e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>WHATSAPP NUMBER</label>
            <input
              value={settings.whatsappNumber}
              onChange={(e) => handleChange('whatsappNumber', e.target.value)}
              className={fieldClass}
              placeholder="+91..."
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>DEFAULT WHATSAPP PRE-FILLED MESSAGE</label>
            <input
              value={settings.whatsappMessage}
              onChange={(e) => handleChange('whatsappMessage', e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className="bg-white border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
          Social Media Links
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>INSTAGRAM PROFILE URL</label>
            <input
              value={settings.instagramUrl}
              onChange={(e) => handleChange('instagramUrl', e.target.value)}
              className={fieldClass}
              placeholder="https://instagram.com/..."
            />
          </div>
          <div>
            <label className={labelClass}>INSTAGRAM HANDLE</label>
            <input
              value={settings.instagramHandle}
              onChange={(e) => handleChange('instagramHandle', e.target.value)}
              className={fieldClass}
              placeholder="@aeronprofessional"
            />
          </div>
        </div>
      </div>

      {/* Pricing & Policy */}
      <div className="bg-white border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
          Pricing & Disclaimers
        </h2>
        <div>
          <label className={labelClass}>PRICE & TAX DISCLAIMER</label>
          <input
            value={settings.priceDisclaimer}
            onChange={(e) => handleChange('priceDisclaimer', e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      {/* SEO & Meta */}
      <div className="bg-white border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
          Global SEO
        </h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>DEFAULT SEO TITLE</label>
            <input
              value={settings.seoTitle}
              onChange={(e) => handleChange('seoTitle', e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>DEFAULT META DESCRIPTION</label>
            <textarea
              value={settings.seoDescription}
              onChange={(e) => handleChange('seoDescription', e.target.value)}
              rows={3}
              className={fieldClass}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-black text-white px-8 py-3 text-xs font-bold tracking-wider hover:bg-gray-800 transition disabled:opacity-50 cursor-pointer"
        >
          <Save size={14} /> {loading ? 'SAVING...' : 'SAVE SETTINGS'}
        </button>
      </div>
    </form>
  );
}
