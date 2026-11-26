import { prisma } from '@/lib/db';

import {
  requireAdminPage,
} from '@/lib/admin-page';

import {
  PERMISSIONS,
} from '@/lib/permissions';

import SettingsForm from '@/components/admin/SettingsForm';

// ==========================================
// ROUTE CONFIGURATION
// ==========================================

export const dynamic = 'force-dynamic';

export const revalidate = 0;

// ==========================================
// ADMIN WEBSITE SETTINGS PAGE
// ==========================================

export default async function SettingsPage() {

  // ========================================
  // SERVER-SIDE WEBSITE SETTINGS PERMISSIONS
  //
  // OWNER: ALLOWED
  // ADMIN: ALLOWED
  // EDITOR: DENIED
  // ========================================

  await requireAdminPage({
    permissions: [
      PERMISSIONS.SETTINGS_VIEW,
      PERMISSIONS.SETTINGS_MANAGE,
    ],

    permissionMode: 'all',
  });

  // ========================================
  // LOAD PROTECTED WEBSITE SETTINGS
  // ONLY AFTER PERMISSION VERIFICATION
  // ========================================

  const rows =
    await prisma.siteSetting.findMany({
      orderBy: {
        key: 'asc',
      },

      select: {
        key: true,

        value: true,
      },
    });

  // ========================================
  // CONVERT DATABASE SETTINGS INTO FORM DATA
  // ========================================

  const settings: Record<string, string> =
    Object.fromEntries(
      rows.map((row) => [
        row.key,

        row.value ?? '',
      ])
    );

  // ========================================
  // RENDER AUTHORIZED WEBSITE SETTINGS PAGE
  // ========================================

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

      {/* AUTHORIZED WEBSITE SETTINGS FORM */}

      <SettingsForm
        initialSettings={settings}
      />

    </div>
  );
}