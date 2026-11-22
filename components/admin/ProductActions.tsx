'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Archive, CheckCircle, XCircle } from 'lucide-react';

interface ProductActionsProps {
  productId: string;
  currentStatus: string;
}

export default function ProductActions({ productId, currentStatus }: ProductActionsProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const doAction = async (action: string) => {
    setLoading(true);
    setOpen(false);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error('Action failed');
      router.refresh();
    } catch {
      alert('Action failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!confirm('Archive this product? It will be hidden from the public site.')) return;
    doAction('archive');
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} disabled={loading} className="text-gray-500 hover:text-black transition p-1 cursor-pointer">
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-6 bg-white border border-gray-200 shadow-lg z-20 w-40 py-1">
            {currentStatus !== 'ACTIVE' && (
              <button onClick={() => doAction('publish')} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-gray-50 text-green-700 text-left cursor-pointer">
                <CheckCircle size={14} /> Publish
              </button>
            )}
            {currentStatus === 'ACTIVE' && (
              <button onClick={() => doAction('unpublish')} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-gray-50 text-orange-600 text-left cursor-pointer">
                <XCircle size={14} /> Unpublish
              </button>
            )}
            {currentStatus !== 'SOLD_OUT' && (
              <button onClick={() => doAction('sold_out')} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-gray-50 text-orange-700 text-left cursor-pointer">
                <XCircle size={14} /> Mark Sold Out
              </button>
            )}
            <button onClick={confirmDelete} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-gray-50 text-red-600 text-left cursor-pointer">
              <Archive size={14} /> Archive
            </button>
          </div>
        </>
      )}
    </div>
  );
}
