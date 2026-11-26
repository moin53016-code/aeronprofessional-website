import { prisma } from '@/lib/db';

import {
  requireAdminPage,
} from '@/lib/admin-page';

import {
  PERMISSIONS,
} from '@/lib/permissions';

import FAQManager from '@/components/admin/FAQManager';

// ==========================================
// ROUTE CONFIGURATION
// ==========================================

export const dynamic = 'force-dynamic';

export const revalidate = 0;

// ==========================================
// ADMIN CONTENT MANAGEMENT PAGE
// ==========================================

export default async function ContentPage() {

  // ========================================
  // SERVER-SIDE CONTENT AND FAQ PERMISSIONS
  // ========================================

  await requireAdminPage({
    permissions: [
      PERMISSIONS.CONTENT_VIEW,
      PERMISSIONS.CONTENT_MANAGE,
      PERMISSIONS.FAQ_VIEW,
      PERMISSIONS.FAQ_MANAGE,
    ],

    permissionMode: 'all',
  });

  // ========================================
  // LOAD PROTECTED FAQ DATA
  // ONLY AFTER PERMISSION VERIFICATION
  // ========================================

  const faqs =
    await prisma.fAQ.findMany({
      orderBy: [
        {
          displayOrder: 'asc',
        },

        {
          id: 'asc',
        },
      ],
    });

  // ========================================
  // CALCULATE TOTAL FAQS
  // ========================================

  const totalFaqs =
    faqs.length;

  // ========================================
  // CALCULATE ACTIVE FAQS
  // ========================================

  const activeFaqs =
    faqs.filter(
      (faq) =>
        faq.isActive
    ).length;

  // ========================================
  // CALCULATE INACTIVE FAQS
  // ========================================

  const inactiveFaqs =
    totalFaqs - activeFaqs;

  // ========================================
  // RENDER AUTHORIZED CONTENT MANAGEMENT
  // ========================================

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

      {/* AUTHORIZED FAQ MANAGEMENT COMPONENT */}

      <FAQManager
        initialFaqs={faqs}
      />

    </div>
  );
}