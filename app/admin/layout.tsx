'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminProvider, useAdmin } from '@/lib/admin-auth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Loader as Loader2 } from 'lucide-react';
import Image from 'next/image';

const AUTH_PATHS = ['/admin/login', '/admin/signup'];

function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAdmin();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = AUTH_PATHS.includes(pathname);

  // ============================================================
  // AUTH REDIRECT
  // ============================================================

  useEffect(() => {
    if (loading) return;

    if (!user && !isAuthPage) {
      router.replace('/admin/login');
      return;
    }

    if (user && isAuthPage) {
      router.replace('/admin');
    }
  }, [user, loading, isAuthPage, router]);

  // ============================================================
  // AUTH LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-green-950 flex items-center justify-center">
        <div className="text-center">
          <Image
            src="/bmn_logo.jpeg"
            alt="Bharat Advance"
            width={56}
            height={56}
            priority
            className="rounded-full object-cover mx-auto mb-4"
          />

          <Loader2 className="w-5 h-5 text-green-300 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // ============================================================
  // AUTH PAGES
  // ============================================================

  if (isAuthPage) {
    return <>{children}</>;
  }

  // ============================================================
  // NOT AUTHENTICATED
  // ============================================================

  if (!user) {
    return (
      <div className="min-h-screen bg-green-950 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-green-300 animate-spin" />
      </div>
    );
  }

  // ============================================================
  // ADMIN APPLICATION
  // ============================================================

  return (
    <div
      className="
        relative
        flex
        min-h-screen
        w-full
        bg-green-50
        isolate
      "
    >
      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className="
          relative
          z-[100]
          shrink-0
        "
      >
        <AdminSidebar />
      </aside>

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <main
        className="
          relative
          z-0
          flex-1
          min-w-0
          min-h-screen
          md:ml-64
          bg-green-50
        "
      >
        <div className="relative z-0 min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProvider>
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  );
}