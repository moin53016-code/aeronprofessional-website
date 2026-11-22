const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  SOLD_OUT: 'bg-orange-100 text-orange-700',
  DRAFT: 'bg-gray-100 text-gray-600',
  ARCHIVED: 'bg-red-100 text-red-600',
};

export default function ProductStatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-[9px] font-bold uppercase px-2 py-1 ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-500'}`}>
      {status ? status.replace('_', ' ') : ''}
    </span>
  );
}
