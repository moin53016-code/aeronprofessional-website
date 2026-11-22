import { prisma } from '@/lib/db';
import FAQManager from '@/components/admin/FAQManager';

export default async function ContentPage() {
  const faqs = await prisma.fAQ.findMany({ orderBy: { displayOrder: 'asc' } }).catch(() => []);
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
        <p className="text-sm text-gray-500 mt-1">Manage FAQs and editable content</p>
      </div>
      <FAQManager initialFaqs={faqs} />
    </div>
  );
}
