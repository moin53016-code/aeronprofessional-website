import type { Metadata } from 'next';
import { headers } from 'next/headers';

import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

import { requireAdminPage } from '@/lib/admin-page';

// ADMIN ROUTE CONFIGURATION

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ADMIN PAGE SEO PROTECTION

export const metadata: Metadata = {
  title: 'Admin',

  robots: {
    index: false,
    follow: false,
    nocache: true,

    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

// ADMIN LAYOUT

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  // READ TRUSTED MIDDLEWARE REQUEST HEADERS

  const requestHeaders = await headers();

  const isLoginPage =
    requestHeaders.get('x-aeron-login-page') === 'true';

  // LOGIN PAGE DOES NOT REQUIRE A SESSION

  if (isLoginPage) {
    return <>{children}</>;
  }

  // CENTRALIZED ADMIN SESSION VERIFICATION

  const session = await requireAdminPage();

  // EXTRACT SAFE ADMIN USER INFORMATION

  const adminUser = {
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
  };

  // RENDER PROTECTED ADMIN PANEL

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ROLE-BASED ADMIN SIDEBAR */}

      <AdminSidebar role={adminUser.role} />

      {/* ADMIN MAIN CONTAINER */}

      <div className="flex min-w-0 flex-1 flex-col">

        {/* ADMIN HEADER */}

        <AdminHeader user={adminUser} />

        {/* PROTECTED ADMIN PAGE CONTENT */}

        <main className="min-w-0 flex-1 overflow-auto p-4 sm:p-6">
          {children}
        </main>

      </div>

    </div>
  );
}