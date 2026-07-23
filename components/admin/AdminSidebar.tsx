'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdmin } from '@/lib/admin-auth';
import { LayoutDashboard, Package, Grid3x3 as Grid3X3, Image, MessageSquare, ShoppingCart, LogOut, Menu, X, Receipt, Settings } from 'lucide-react';
import { useState } from 'react';
import ImageLogo from 'next/image';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Grid3X3 },
  { href: '/admin/gallery', label: 'Gallery', icon: Image },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/billing', label: 'Billing & Invoices', icon: Receipt },
  { href: '/admin/contacts', label: 'Contact Queries', icon: MessageSquare },
  { href: '/admin/settings', label: 'Company Settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { signOut, user } = useAdmin();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (item: typeof navItems[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-white border border-green-200 rounded-lg p-2 shadow-sm"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5 text-green-800" /> : <Menu className="w-5 h-5 text-green-800" />}
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-green-950 z-40 flex flex-col transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-green-900">
          <div className="flex items-center gap-3">
            <ImageLogo src="/bmn_logo.jpeg" alt="Bharat Advance" width={36} height={36} className="rounded-full object-cover" />
            <div>
              <p className="font-display font-bold text-white text-sm">Bharat Advance</p>
              <p className="text-xs text-green-500">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-xs font-medium text-green-700 uppercase tracking-wider px-3 mb-2">Navigation</p>
          <div className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'text-green-400 hover:text-white hover:bg-green-900'
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-3 border-t border-green-900">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-green-400 hover:text-white hover:bg-green-900 transition-colors mb-1"
          >
            View Store
          </Link>
          {user && (
            <div className="px-3 py-2 mb-1">
              <p className="text-xs text-green-600 truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-green-400 hover:text-white hover:bg-red-900/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
