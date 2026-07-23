'use client';

import { useEffect, useState } from 'react';
import { supabase, type Order } from '@/lib/supabase';
import { ShoppingCart, ChevronDown, Loader as Loader2, Eye, X, Package, FileText } from 'lucide-react';
import InvoiceModal from '@/components/InvoiceModal';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const statusOptions = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Order | null>(null);
  const [invoicing, setInvoicing] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    await supabase.from('orders').update({ status }).eq('id', id);
    setUpdatingId(null);
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: status as Order['status'] } : o));
    if (viewing?.id === id) setViewing((v) => v ? { ...v, status: status as Order['status'] } : v);
  };

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-green-900">Orders</h1>
          <p className="text-green-600 text-sm mt-1">Manage customer orders</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 text-sm border border-green-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-400">
            <option value="all">All Orders</option>
            {statusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-green-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-green-100">
          <ShoppingCart className="w-10 h-10 text-green-300 mx-auto mb-3" />
          <p className="text-green-600">No orders {filter !== 'all' ? `with status "${filter}"` : 'yet'}.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-green-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-green-50 border-b border-green-100">
                <th className="text-left px-6 py-4 text-xs font-medium text-green-600 uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide hidden md:table-cell">Product</th>
                <th className="text-left px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide">Base Price</th>
                <th className="text-left px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide hidden lg:table-cell">GST</th>
                <th className="text-left px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide">Final Price</th>
                <th className="text-left px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide hidden sm:table-cell">Date</th>
                <th className="px-4 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-green-50">
              {filtered.map((order) => {
                const base = order.product_price * order.quantity;
                const gst = (base * (order.gst_percentage ?? 18)) / 100;
                const final = base + gst;
                return (
                  <tr key={order.id} className="hover:bg-green-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-green-800">{order.customer_name}</p>
                      <p className="text-xs text-green-400">{order.customer_email}</p>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <p className="text-green-700 line-clamp-1">{order.product_name}</p>
                      <p className="text-xs text-green-400">Qty: {order.quantity}</p>
                    </td>
                    <td className="px-4 py-4 text-green-700">&#8377;{fmt(base)}</td>
                    <td className="px-4 py-4 hidden lg:table-cell text-green-600">{order.gst_percentage ?? 18}%</td>
                    <td className="px-4 py-4 font-bold text-green-900">&#8377;{fmt(final)}</td>
                    <td className="px-4 py-4">
                      <div className="relative">
                        <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)} disabled={updatingId === order.id} className={`text-xs font-medium px-2.5 py-1.5 rounded-full appearance-none pr-6 cursor-pointer border-0 focus:outline-none focus:ring-2 focus:ring-green-400 ${statusColors[order.status]}`}>
                          {statusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                        {updatingId === order.id ? <Loader2 className="w-3 h-3 animate-spin absolute right-2 top-1/2 -translate-y-1/2" /> : <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-green-500 hidden sm:table-cell">
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setInvoicing(order)} title="View Invoice" className="p-1.5 text-green-400 hover:text-green-700 hover:bg-green-100 rounded-lg transition-colors"><FileText className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setViewing(order)} title="Order Details" className="p-1.5 text-green-400 hover:text-green-700 hover:bg-green-100 rounded-lg transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Details Modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-green-100">
              <h3 className="font-display text-xl font-bold text-green-900">Order Details</h3>
              <button onClick={() => setViewing(null)} className="p-1 hover:bg-green-100 rounded-lg"><X className="w-5 h-5 text-green-500" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-green-600" />
                  <p className="font-medium text-green-900 text-sm">{viewing.product_name}</p>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-green-600">
                    <span>Base ({viewing.quantity} &#215; &#8377;{viewing.product_price.toLocaleString('en-IN')})</span>
                    <span>&#8377;{fmt(viewing.product_price * viewing.quantity)}</span>
                  </div>
                  <div className="flex justify-between text-green-500 text-xs">
                    <span>GST @ {viewing.gst_percentage ?? 18}%</span>
                    <span>&#8377;{fmt((viewing.product_price * viewing.quantity * (viewing.gst_percentage ?? 18)) / 100)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-green-900 pt-1 border-t border-green-200">
                    <span>Total</span>
                    <span>&#8377;{fmt(viewing.product_price * viewing.quantity * (1 + (viewing.gst_percentage ?? 18) / 100))}</span>
                  </div>
                </div>
              </div>
              {[
                { label: 'Customer', value: viewing.customer_name },
                { label: 'Email', value: viewing.customer_email },
                { label: 'Phone', value: viewing.customer_phone },
                { label: 'Address', value: viewing.customer_address },
                { label: 'Order Date', value: new Date(viewing.created_at).toLocaleString('en-IN') },
                { label: 'Notes', value: viewing.notes || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-3">
                  <span className="text-xs font-medium text-green-500 w-20 shrink-0 mt-0.5">{label}</span>
                  <span className="text-sm text-green-800 flex-1">{value}</span>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-green-500 w-20 shrink-0">Status</span>
                <select value={viewing.status} onChange={(e) => updateStatus(viewing.id, e.target.value)} className="text-sm border border-green-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50">
                  {statusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-green-100 flex gap-3">
              <button onClick={() => { setInvoicing(viewing); setViewing(null); }} className="flex items-center gap-2 px-4 py-2.5 border border-green-200 text-green-700 rounded-xl text-sm font-medium hover:bg-green-50 transition-colors">
                <FileText className="w-4 h-4" /> Invoice
              </button>
              <button onClick={() => setViewing(null)} className="flex-1 px-4 py-2.5 bg-green-800 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {invoicing && (
        <InvoiceModal order={invoicing} onClose={() => setInvoicing(null)} />
      )}
    </div>
  );
}
