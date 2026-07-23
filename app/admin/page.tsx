'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Package, Grid3x3 as Grid3X3, ShoppingCart, MessageSquare, Image, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';

type Stats = {
  products: number;
  categories: number;
  orders: number;
  contacts: number;
  gallery: number;
  pendingOrders: number;
  newContacts: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [p, c, o, co, g, po, nc] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('contact_queries').select('id', { count: 'exact', head: true }),
        supabase.from('gallery').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('contact_queries').select('id', { count: 'exact', head: true }).eq('status', 'new'),
      ]);
      setStats({
        products: p.count || 0,
        categories: c.count || 0,
        orders: o.count || 0,
        contacts: co.count || 0,
        gallery: g.count || 0,
        pendingOrders: po.count || 0,
        newContacts: nc.count || 0,
      });
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5);
      setRecentOrders(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const statCards = [
    { label: 'Products', value: stats?.products, icon: Package, href: '/admin/products', color: 'bg-green-50 text-green-700' },
    { label: 'Categories', value: stats?.categories, icon: Grid3X3, href: '/admin/categories', color: 'bg-green-100 text-green-800' },
    { label: 'Total Orders', value: stats?.orders, icon: ShoppingCart, href: '/admin/orders', color: 'bg-green-50 text-green-700', badge: stats?.pendingOrders ? `${stats.pendingOrders} pending` : undefined },
    { label: 'Contact Queries', value: stats?.contacts, icon: MessageSquare, href: '/admin/contacts', color: 'bg-green-100 text-green-800', badge: stats?.newContacts ? `${stats.newContacts} new` : undefined },
    { label: 'Gallery Items', value: stats?.gallery, icon: Image, href: '/admin/gallery', color: 'bg-green-50 text-green-700' },
  ];

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-green-900">Dashboard</h1>
        <p className="text-green-600 text-sm mt-1">Welcome back! Here's what's happening with your store.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white rounded-2xl border border-green-100 p-5 hover:border-green-300 hover:shadow-md transition-all duration-200 group"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-green-900">
              {loading ? <div className="h-7 w-10 bg-green-100 rounded animate-pulse" /> : card.value}
            </div>
            <p className="text-xs text-green-600 mt-1">{card.label}</p>
            {card.badge && (
              <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{card.badge}</span>
            )}
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-green-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-green-50">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h2 className="font-display font-semibold text-green-900">Recent Orders</h2>
          </div>
          <Link href="/admin/orders" className="text-xs text-green-600 hover:text-green-800 font-medium">View all</Link>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-12 bg-green-50 rounded-xl animate-pulse" />)}
          </div>
        ) : recentOrders.length > 0 ? (
          <div className="divide-y divide-green-50">
            {recentOrders.map((order) => (
              <div key={order.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-800 text-sm">{order.customer_name}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                    <Package className="w-3 h-3" /> {order.product_name} &middot; Qty: {order.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-green-800 text-sm">&#8377;{(order.product_price * order.quantity).toLocaleString('en-IN')}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[order.status]}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center">
            <Clock className="w-8 h-8 text-green-300 mx-auto mb-2" />
            <p className="text-green-400 text-sm">No orders yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
