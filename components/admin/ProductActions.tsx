
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

  const handleRemove = async () => {
    if (loading) return;

    const confirmed = window.confirm(
      'Remove this product from the website?\n\n' +
      'The product will be archived and hidden from customers. ' +
      'Its data will not be permanently deleted.'
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/products/${productId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || 'Failed to remove product.'
        );
      }

      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to remove product.';

      window.alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={loading}
      aria-label="Remove product"
      title="Remove product"
      className="
        inline-flex
        items-center
        justify-center
        rounded-md
        p-2
        text-red-600
        transition-colors
        hover:bg-red-50
        hover:text-red-700
        focus-visible:outline
        focus-visible:outline-2
        focus-visible:outline-offset-2
        focus-visible:outline-red-500
        disabled:cursor-not-allowed
        disabled:opacity-50
      "
    >
      {loading ? (
        <Loader2
          size={17}
          className="animate-spin"
        />
      ) : (
        <Trash2 size={17} />
      )}
    </button>
  );
}
