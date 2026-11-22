import { prisma } from '@/lib/db';
import SettingsForm from '@/components/admin/SettingsForm';

export default async function SettingsPage() {
  const rows = await prisma.siteSetting.findMany().catch(() => []);
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value ?? '']));
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Website Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Global brand and contact configuration</p>
      </div>
      <SettingsForm initialSettings={settings} />
    </div>
  );
}
