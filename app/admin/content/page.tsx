
import { prisma } from '@/lib/db';
import { requireAdminPage } from '@/lib/admin-page';

import FAQManager from '@/components/admin/FAQManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ContentPage() {
  // VERIFY ADMIN SESSION

  await requireAdminPage();

  // LOAD FRESH FAQ DATA FROM DATABASE

  const faqs = await prisma.fAQ.findMany({
    orderBy: [
      {
        displayOrder: 'asc',
      },
      {
        id: 'asc',
      },
    ],
  });

  // CALCULATE FAQ STATISTICS

  const totalFaqs = faqs.length;

  const activeFaqs = faqs.filter(
    (faq) => faq.isActive
  ).length;

  const inactiveFaqs =
    totalFaqs - activeFaqs;

  return (
    <div className="w-full min-w-0">

      {/* PAGE HEADING */}

      <div className="mb-6">

        <h1 className="text-2xl font-bold text-gray-900">
          Content Management
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage frequently asked questions and
          editable website content.
        </p>

      </div>

      {/* FAQ STATISTICS */}

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">

        {/* TOTAL FAQS */}

        <div className="rounded-lg border border-gray-200 bg-white p-4">

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Total FAQs
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {totalFaqs}
          </p>

        </div>

        {/* ACTIVE FAQS */}

        <div className="rounded-lg border border-gray-200 bg-white p-4">

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Active FAQs
          </p>

          <p className="mt-2 text-2xl font-bold text-green-700">
            {activeFaqs}
          </p>

        </div>

        {/* INACTIVE FAQS */}

        <div className="rounded-lg border border-gray-200 bg-white p-4">

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Inactive FAQs
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-500">
            {inactiveFaqs}
          </p>

        </div>

      </div>

      {/* FAQ MANAGEMENT COMPONENT */}

      <FAQManager
        initialFaqs={faqs}
      />

    </div>
  );
}
