
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';

interface ProductActionsProps {
  productId: string;
  currentStatus: string;
}

export default function ProductActions({
  productId,
}: ProductActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (loading) return;

    const first = window.confirm(
      'DELETE PRODUCT?\n\n' +
      'This product will be permanently removed from ' +
      'the website and database.\n\n' +
      'It will NOT be archived.\n\nContinue?'
    );

    if (!first) return;

    const second = window.confirm(
      'FINAL CONFIRMATION\n\n' +
      'Are you absolutely sure?\n\n' +
      'All associated product database records ' +
      'will be deleted.\n\n' +
      'THIS ACTION CANNOT BE UNDONE.'
    );

    if (!second) return;

    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/products/${encodeURIComponent(
          productId
        )}`,
        {
          method: 'DELETE',
          cache: 'no-store',
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !data.success || !data.deleted) {
        throw new Error(
          data.error ||
          'Product was not permanently deleted.'
        );
      }

      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : 'Failed to delete product.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      title="Permanently delete product"
      aria-label="Permanently delete product"
      className="inline-flex items-center justify-center rounded-md p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? (
        <Loader2 size={17} className="animate-spin" />
      ) : (
        <Trash2 size={17} />
      )}
    </button>
  );
}
