'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';

interface AdminHeaderProps {
  user: { name: string; email: string; role: string };
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      router.push('/admin/login');
      router.refresh();
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="text-sm text-gray-500">
        Welcome back, <span className="font-semibold text-gray-900">{user.name}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User size={16} />
          <span className="hidden sm:inline">{user.role}</span>
        </div>
        <button
          onClick={handleLogout}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition disabled:opacity-50 cursor-pointer"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
