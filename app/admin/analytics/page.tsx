'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Store, Wallet, BarChart3, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';

const PIE_COLORS = ['#16a34a', '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444', '#06b6d4', '#8b5cf6'];

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'30d' | '90d' | 'all'>('30d');
  const [data, setData] = useState({
    onlineRevenue: 0, offlineRevenue: 0, totalRevenue: 0,
    totalExpenses: 0, totalPurchases: 0, netProfit: 0,
    onlineOrders: 0, offlineSales: 0, totalOrders: 0,
    avgOrderValue: 0,
    expenseByCategory: [] as { name: string; value: number }[],
    revenueByChannel: [] as { name: string; value: number }[],
    monthlyTrend: [] as { month: string; revenue: number; expenses: number }[],
    topProducts: [] as { name: string; sold: number; revenue: number }[],
  });

  useEffect(() => {
    const days = dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 3650;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().slice(0, 10);

    (async () => {
      const [
        { data: orders }, { data: offline }, { data: expenses }, { data: pos }, { data: products },
      ] = await Promise.all([
        supabase.from('orders').select('product_price, gst_percentage, quantity, status, created_at').gte('created_at', sinceStr),
        supabase.from('offline_sales').select('grand_total, sale_date, payment_status').gte('sale_date', sinceStr),
        supabase.from('expenses').select('category, total_amount, expense_date').gte('expense_date', sinceStr),
        supabase.from('purchase_orders').select('grand_total, status, order_date').gte('order_date', sinceStr),
        supabase.from('products').select('name, price, stock'),
      ]);

      const validOrders = (orders || []).filter((o: any) => o.status !== 'cancelled');
      const onlineRevenue = validOrders.reduce((s: number, o: any) => s + (o.product_price * (1 + o.gst_percentage / 100) * o.quantity), 0);
      const offlineRevenue = (offline || []).reduce((s: number, o: any) => s + Number(o.grand_total), 0);
      const totalRevenue = onlineRevenue + offlineRevenue;

      const totalExpenses = (expenses || []).reduce((s: number, e: any) => s + Number(e.total_amount), 0);
      const totalPurchases = (pos || []).filter((p: any) => p.status !== 'cancelled').reduce((s: number, p: any) => s + Number(p.grand_total), 0);
      const netProfit = totalRevenue - totalExpenses;

      const onlineOrders = validOrders.length;
      const offlineSales = (offline || []).length;
      const totalOrders = onlineOrders + offlineSales;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Expense by category
      const catMap: Record<string, number> = {};
      (expenses || []).forEach((e: any) => { catMap[e.category] = (catMap[e.category] || 0) + Number(e.total_amount); });
      const expenseByCategory = Object.entries(catMap).map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: v }));

      // Revenue by channel
      const revenueByChannel = [
        { name: 'Online Sales', value: onlineRevenue },
        { name: 'Offline Sales', value: offlineRevenue },
      ].filter(c => c.value > 0);

      // Monthly trend (last 6 months)
      const monthMap: Record<string, { revenue: number; expenses: number }> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString('en-IN', { month: 'short' });
        monthMap[key] = { revenue: 0, expenses: 0 };
      }
      validOrders.forEach((o: any) => {
        const d = new Date(o.created_at);
        const key = d.toLocaleDateString('en-IN', { month: 'short' });
        if (monthMap[key] !== undefined) monthMap[key].revenue += o.product_price * (1 + o.gst_percentage / 100) * o.quantity;
      });
      (offline || []).forEach((o: any) => {
        const d = new Date(o.sale_date);
        const key = d.toLocaleDateString('en-IN', { month: 'short' });
        if (monthMap[key] !== undefined) monthMap[key].revenue += Number(o.grand_total);
      });
      (expenses || []).forEach((e: any) => {
        const d = new Date(e.expense_date);
        const key = d.toLocaleDateString('en-IN', { month: 'short' });
        if (monthMap[key] !== undefined) monthMap[key].expenses += Number(e.total_amount);
      });
      const monthlyTrend = Object.entries(monthMap).map(([month, v]) => ({ month, ...v }));

      // Top products by stock value
      const topProducts = (products || []).map((p: any) => ({ name: p.name, sold: 0, revenue: 0 }))
        .sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 5);

      setData({
        onlineRevenue, offlineRevenue, totalRevenue, totalExpenses, totalPurchases, netProfit,
        onlineOrders, offlineSales, totalOrders, avgOrderValue,
        expenseByCategory, revenueByChannel, monthlyTrend, topProducts,
      });
      setLoading(false);
    })();
  }, [dateRange]);

  const fmt = (n: number) => `\u20B9${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const fmt2 = (n: number) => `\u20B9${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="h-8 bg-green-100 rounded-xl w-64 mb-8 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-green-100 rounded-2xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-64 bg-green-100 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-green-900">P&amp;L &amp; Analytics</h1>
          <p className="text-green-600 text-sm mt-1">Business performance overview</p>
        </div>
        <select value={dateRange} onChange={(e) => { setLoading(true); setDateRange(e.target.value as any); }} className="px-3 py-2.5 text-sm border border-green-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-400">
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-green-100 p-5">
          <div className="flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-green-500" /><p className="text-xs text-green-500">Total Revenue</p></div>
          <p className="text-2xl font-bold text-green-900">{fmt(data.totalRevenue)}</p>
          <div className="flex gap-3 mt-2 text-xs">
            <span className="text-green-600">Online: {fmt(data.onlineRevenue)}</span>
            <span className="text-green-600">Offline: {fmt(data.offlineRevenue)}</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-red-100 p-5">
          <div className="flex items-center gap-2 mb-2"><TrendingDown className="w-4 h-4 text-red-500" /><p className="text-xs text-red-500">Total Expenses</p></div>
          <p className="text-2xl font-bold text-red-700">{fmt(data.totalExpenses)}</p>
          <p className="text-xs text-green-500 mt-2">Purchases: {fmt(data.totalPurchases)}</p>
        </div>
        <div className={`bg-white rounded-2xl border p-5 ${data.netProfit >= 0 ? 'border-green-100' : 'border-red-100'}`}>
          <div className="flex items-center gap-2 mb-2">
            {data.netProfit >= 0 ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
            <p className={`text-xs ${data.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>Net Profit / Loss</p>
          </div>
          <p className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-green-900' : 'text-red-700'}`}>{fmt(data.netProfit)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-green-100 p-5">
          <div className="flex items-center gap-2 mb-2"><BarChart3 className="w-4 h-4 text-green-500" /><p className="text-xs text-green-500">Avg Order Value</p></div>
          <p className="text-2xl font-bold text-green-900">{fmt2(data.avgOrderValue)}</p>
          <p className="text-xs text-green-500 mt-2">{data.totalOrders} total orders</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Monthly trend */}
        <div className="bg-white rounded-2xl border border-green-100 p-5">
          <h3 className="font-display font-semibold text-green-900 mb-4">Revenue vs Expenses (6 months)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dcfce7" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#16a34a' }} />
              <YAxis tick={{ fontSize: 12, fill: '#16a34a' }} />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 12, border: '1px solid #dcfce7' }} />
              <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} name="Revenue" />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by channel */}
        <div className="bg-white rounded-2xl border border-green-100 p-5">
          <h3 className="font-display font-semibold text-green-900 mb-4">Revenue by Channel</h3>
          {data.revenueByChannel.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.revenueByChannel} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e: any) => e.name}>
                  {data.revenueByChannel.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-green-400 text-sm py-20">No revenue data yet</p>}
        </div>

        {/* Expense by category */}
        <div className="bg-white rounded-2xl border border-green-100 p-5">
          <h3 className="font-display font-semibold text-green-900 mb-4">Expenses by Category</h3>
          {data.expenseByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.expenseByCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#dcfce7" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#16a34a' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#16a34a' }} width={80} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 12 }} />
                <Bar dataKey="value" fill="#16a34a" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-green-400 text-sm py-20">No expense data yet</p>}
        </div>

        {/* Channel comparison */}
        <div className="bg-white rounded-2xl border border-green-100 p-5">
          <h3 className="font-display font-semibold text-green-900 mb-4">Sales Channel Comparison</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-green-600" /></div>
              <div className="flex-1">
                <div className="flex justify-between text-sm"><span className="font-medium text-green-800">Online Sales</span><span className="text-green-600">{data.onlineOrders} orders</span></div>
                <div className="flex justify-between text-xs text-green-500"><span>{fmt(data.onlineRevenue)}</span><span>{data.totalOrders > 0 ? Math.round(data.onlineOrders / data.totalOrders * 100) : 0}% of total</span></div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center"><Store className="w-5 h-5 text-green-600" /></div>
              <div className="flex-1">
                <div className="flex justify-between text-sm"><span className="font-medium text-green-800">Offline Sales</span><span className="text-green-600">{data.offlineSales} sales</span></div>
                <div className="flex justify-between text-xs text-green-500"><span>{fmt(data.offlineRevenue)}</span><span>{data.totalOrders > 0 ? Math.round(data.offlineSales / data.totalOrders * 100) : 0}% of total</span></div>
              </div>
            </div>
            <div className="border-t border-green-50 pt-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-800 flex items-center justify-center"><Wallet className="w-5 h-5 text-white" /></div>
              <div className="flex-1">
                <div className="flex justify-between text-sm"><span className="font-bold text-green-900">Total Revenue</span><span className="font-bold text-green-900">{fmt(data.totalRevenue)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
