
import { prisma } from '@/lib/db';
import { requireAdminPage } from '@/lib/admin-page';

import SettingsForm from '@/components/admin/SettingsForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SettingsPage() {
  // VERIFY ADMIN SESSION

  await requireAdminPage();

  // LOAD WEBSITE SETTINGS

  const rows = await prisma.siteSetting.findMany({
    orderBy: {
      key: 'asc',
    },

    select: {
      key: true,
      value: true,
    },
  });

  // CONVERT DATABASE SETTINGS INTO FORM DATA

  const settings: Record<string, string> =
    Object.fromEntries(
      rows.map((row) => [
        row.key,
        row.value ?? '',
      ])
    );

  return (
    <div className="w-full min-w-0">

      {/* PAGE HEADING */}

      <div className="mb-6">

        <h1 className="text-2xl font-bold text-gray-900">
          Website Settings
        </h1>

        <p className="mt-1 text-sm leading-6 text-gray-500">
          Manage global brand information,
          contact details and website configuration.
        </p>

      </div>

      {/* WEBSITE SETTINGS FORM */}

      <SettingsForm
        initialSettings={settings}
      />

    </div>
  );
}
