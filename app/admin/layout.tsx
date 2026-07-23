'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminProvider, useAdmin } from '@/lib/admin-auth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Loader as Loader2 } from 'lucide-react';
import Image from 'next/image';

const AUTH_PATHS = ['/admin/login', '/admin/signup'];

function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAdmin();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = AUTH_PATHS.includes(pathname);

  useEffect(() => {
    if (loading) return;
    if (!user && !isAuthPage) {
      router.replace('/admin/login');
    } else if (user && isAuthPage) {
      router.replace('/admin');
    }
  }, [user, loading, isAuthPage, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-green-950 flex items-center justify-center">
        <div className="text-center">
          <Image src="/bmn_logo.jpeg" alt="Bharat Advance" width={56} height={56} className="rounded-full object-cover mx-auto mb-4" />
          <Loader2 className="w-5 h-5 text-green-300 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-green-950 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-green-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-green-50">
      <AdminSidebar />
      <main className="flex-1 md:ml-64 min-h-screen overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  );
}
