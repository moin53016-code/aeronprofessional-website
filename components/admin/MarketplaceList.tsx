
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  ShoppingBag,
} from 'lucide-react';

type Marketplace = {
  id: string;
  name: string;
  slug: string;
  url: string | null;
  badgeText: string | null;
  tagline: string | null;
};

type Fields = {
  name: string;
  badgeText: string;
  tagline: string;
  url: string;
};

const empty: Fields = {
  name: '',
  badgeText: '',
  tagline: '',
  url: '',
};

function getFavicon(url: string): string | null {
  try {
    const parsed = new URL(url);

    if (parsed.protocol !== 'https:') {
      return null;
    }

    return (
      'https://www.google.com/s2/favicons?domain=' +
      encodeURIComponent(parsed.hostname) +
      '&sz=64'
    );
  } catch {
    return null;
  }
}

function MarketplaceIcon({
  url,
  name,
}: {
  url: string;
  name: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = getFavicon(url);

  if (!src || failed) {
    return (
      <ShoppingBag
        size={24}
        className="text-gray-400"
      />
    );
  }

  return (
    <img
      key={src}
      src={src}
      alt={`${name} icon`}
      width={28}
      height={28}
      className="h-7 w-7 object-contain"
      onError={() => setFailed(true)}
    />
  );
}

export default function MarketplaceList({
  initialMarketplaces,
}: {
  initialMarketplaces: Marketplace[];
}) {
  const router = useRouter();

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [newData, setNewData] = useState<Fields>(empty);
  const [editData, setEditData] = useState<Fields>(empty);
  const [error, setError] = useState('');

  const field =
    'w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black';

  const label =
    'block text-xs font-bold tracking-wider text-gray-600 mb-1';

  const slugify = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  async function request(
    url: string,
    method: 'POST' | 'PUT' | 'DELETE',
    data?: Fields
  ) {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      ...(data
        ? {
            body: JSON.stringify({
              name: data.name.trim(),
              badgeText: data.badgeText.trim() || null,
              tagline: data.tagline.trim() || null,
              url: data.url.trim(),
              ...(method === 'POST'
                ? { slug: slugify(data.name) }
                : {}),
            }),
          }
        : {}),
    });

    const payload = await response
      .json()
      .catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        payload.error || 'Marketplace request failed'
      );
    }

    router.refresh();
  }

  function isValid(data: Fields) {
    if (!data.name.trim()) {
      setError('Marketplace name is required');
      return false;
    }

    if (!getFavicon(data.url.trim())) {
      setError('Enter a valid HTTPS marketplace link');
      return false;
    }

    return true;
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!isValid(newData)) return;

    setSaving(true);

    try {
      await request(
        '/api/admin/marketplaces',
        'POST',
        newData
      );

      setAdding(false);
      setNewData(empty);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Save failed'
      );
    } finally {
      setSaving(false);
    }
  }

  async function save(id: string) {
    setError('');

    if (!isValid(editData)) return;

    setSaving(true);

    try {
      await request(
        `/api/admin/marketplaces/${encodeURIComponent(id)}`,
        'PUT',
        editData
      );

      setEditingId(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Save failed'
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(mp: Marketplace) {
    const confirmed = window.confirm(
      `Delete ${mp.name}?\n\n` +
      'This marketplace will disappear from the website for every product.'
    );

    if (!confirmed) return;

    setError('');
    setSaving(true);

    try {
      await request(
        `/api/admin/marketplaces/${encodeURIComponent(mp.id)}`,
        'DELETE'
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Delete failed'
      );
    } finally {
      setSaving(false);
    }
  }

  function inputs(
    data: Fields,
    setData: (value: Fields) => void
  ) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(
          [
            ['name', 'NAME *', 'Amazon India'],
            ['badgeText', 'TAG NAME', 'OFFICIAL STORE'],
            ['tagline', 'TAGLINE', 'Shop on Amazon'],
            [
              'url',
              'LINK (HTTPS) *',
              'https://www.amazon.in/',
            ],
          ] as const
        ).map(([key, title, placeholder]) => (
          <div key={key}>
            <label className={label}>{title}</label>

            <input
              type={key === 'url' ? 'url' : 'text'}
              required={
                key === 'name' || key === 'url'
              }
              value={data[key]}
              onChange={(e) =>
                setData({
                  ...data,
                  [key]: e.target.value,
                })
              }
              placeholder={placeholder}
              className={field}
            />
          </div>
        ))}

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center border border-gray-200 bg-white">
            <MarketplaceIcon
              key={data.url}
              url={data.url}
              name={data.name || 'Marketplace'}
            />
          </div>

          <span className="text-xs text-gray-500">
            Icon automatically detected from your link
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={() => {
            setAdding(!adding);
            setError('');
          }}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 text-xs font-bold tracking-wider"
        >
          {adding ? (
            <X size={14} />
          ) : (
            <Plus size={14} />
          )}

          {adding ? 'CANCEL' : 'ADD MARKETPLACE'}
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 p-3 bg-red-50 text-red-700 text-sm"
        >
          {error}
        </p>
      )}

      {adding && (
        <form
          onSubmit={add}
          className="bg-white border border-gray-200 p-5 mb-6 space-y-4"
        >
          <h3 className="font-semibold">
            Add Marketplace
          </h3>

          {inputs(newData, setNewData)}

          <button
            type="submit"
            disabled={saving}
            className="bg-black text-white px-5 py-2 text-xs font-bold disabled:opacity-50"
          >
            {saving ? 'SAVING...' : 'CREATE MARKETPLACE'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {initialMarketplaces.length === 0 && (
          <p className="text-gray-500 p-5 bg-white border">
            No marketplaces configured.
          </p>
        )}

        {initialMarketplaces.map((mp) => (
          <div
            key={mp.id}
            className="bg-white border border-gray-200 p-4"
          >
            {editingId === mp.id ? (
              <div className="space-y-4">
                {inputs(editData, setEditData)}

                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => save(mp.id)}
                    className="flex items-center gap-2 bg-black text-white px-4 py-2 text-xs font-bold"
                  >
                    <Save size={14} />
                    SAVE
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="flex items-center gap-2 px-4 py-2 text-xs border"
                  >
                    <X size={14} />
                    CANCEL
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 border flex items-center justify-center shrink-0">
                  <MarketplaceIcon
                    url={mp.url || ''}
                    name={mp.name}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">
                    {mp.name}

                    {mp.badgeText && (
                      <span className="text-xs ml-2 bg-gray-100 px-2 py-1">
                        {mp.badgeText}
                      </span>
                    )}
                  </p>

                  <p className="text-sm text-gray-500">
                    {mp.tagline || '—'}
                  </p>

                  <p className="text-xs text-gray-400 break-all">
                    {mp.url ||
                      'Link not set — edit to add'}
                  </p>
                </div>

                <button
                  type="button"
                  title="Edit"
                  onClick={() => {
                    setEditingId(mp.id);
                    setError('');
                    setEditData({
                      name: mp.name,
                      badgeText: mp.badgeText ?? '',
                      tagline: mp.tagline ?? '',
                      url: mp.url ?? '',
                    });
                  }}
                  className="p-2 text-gray-600 hover:text-black"
                >
                  <Edit2 size={17} />
                </button>

                <button
                  type="button"
                  title="Delete"
                  disabled={saving}
                  onClick={() => remove(mp)}
                  className="p-2 text-red-600"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
