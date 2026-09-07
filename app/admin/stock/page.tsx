'use client';

import { useEffect, useState } from 'react';
import { supabase, type Product, type StockMovement } from '@/lib/supabase';
import { Warehouse, Search, Package, AlertTriangle, TrendingDown, TrendingUp, History } from 'lucide-react';

export default function AdminStock() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'overview' | 'movements'>('overview');

  const load = async () => {
    const [{ data: prods }, { data: movs }] = await Promise.all([
      supabase.from('products').select('*, categories(*)').order('name'),
      supabase.from('stock_movements').select('*, products(name, slug)').order('created_at', { ascending: false }).limit(50),
    ]);
    setProducts((prods as Product[]) || []);
    setMovements((movs as StockMovement[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || (p.categories?.name || '').toLowerCase().includes(q);
  });

  const totalStock = products.reduce((s, p) => s + p.stock, 0);
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5);
  const outOfStock = products.filter(p => p.stock === 0);
  const stockValue = products.reduce((s, p) => s + p.stock * p.price, 0);

  const movementTypeColors: Record<string, string> = {
    purchase: 'text-green-600', sale: 'text-red-600', adjustment: 'text-amber-600', return: 'text-blue-600', transfer: 'text-purple-600',
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-green-900">Central Stock</h1>
        <p className="text-green-600 text-sm mt-1">Unified inventory across all sales channels</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-green-100 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-green-500" />
            <p className="text-xs text-green-500">Total Units</p>
          </div>
          <p className="text-2xl font-bold text-green-900">{totalStock.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-2xl border border-green-100 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Warehouse className="w-4 h-4 text-green-500" />
            <p className="text-xs text-green-500">Stock Value</p>
          </div>
          <p className="text-2xl font-bold text-green-900">&#8377;{stockValue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-white rounded-2xl border border-amber-100 p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <p className="text-xs text-amber-500">Low Stock</p>
          </div>
          <p className="text-2xl font-bold text-amber-700">{lowStock.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-red-100 p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <p className="text-xs text-red-500">Out of Stock</p>
          </div>
          <p className="text-2xl font-bold text-red-700">{outOfStock.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('overview')} className={`text-sm px-4 py-2 rounded-xl font-medium transition-colors ${tab === 'overview' ? 'bg-green-800 text-white' : 'bg-white text-green-600 border border-green-100 hover:bg-green-50'}`}>Stock Overview</button>
        <button onClick={() => setTab('movements')} className={`text-sm px-4 py-2 rounded-xl font-medium transition-colors ${tab === 'movements' ? 'bg-green-800 text-white' : 'bg-white text-green-600 border border-green-100 hover:bg-green-50'}`}>
          <span className="flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> Recent Movements</span>
        </button>
      </div>

      {tab === 'overview' ? (
        <>
          <div className="relative mb-4 max-w-sm">
            <Search className="w-4 h-4 text-green-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm border border-green-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-400" />
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-green-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-green-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-green-50 border-b border-green-100">
                      <th className="text-left px-6 py-4 text-xs font-medium text-green-600 uppercase tracking-wide">Product</th>
                      <th className="text-left px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide hidden md:table-cell">Category</th>
                      <th className="text-right px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide">Stock</th>
                      <th className="text-right px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide hidden sm:table-cell">Unit Price</th>
                      <th className="text-right px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide">Stock Value</th>
                      <th className="text-center px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-50">
                    {filtered.map(p => (
                      <tr key={p.id} className="hover:bg-green-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="w-8 h-8 rounded-lg object-cover" /> : <Package className="w-4 h-4 text-green-300" />}
                            <span className="font-medium text-green-800">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-green-600 text-xs hidden md:table-cell">{p.categories?.name || '—'}</td>
                        <td className="px-4 py-4 text-right font-medium text-green-900">{p.stock}</td>
                        <td className="px-4 py-4 text-right text-green-600 hidden sm:table-cell">&#8377;{p.price.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-4 text-right text-green-700">&#8377;{(p.stock * p.price).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-4 text-center">
                          {p.stock === 0 ? <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">Out</span>
                           : p.stock <= 5 ? <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">Low</span>
                           : <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">OK</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-green-100 overflow-hidden">
          {movements.length === 0 ? (
            <div className="text-center py-16">
              <History className="w-10 h-10 text-green-300 mx-auto mb-3" />
              <p className="text-green-600">No stock movements yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-green-50">
              {movements.map(m => (
                <div key={m.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.quantity > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                      {m.quantity > 0 ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800">{m.products?.name || 'Unknown product'}</p>
                      <p className="text-xs text-green-500">{m.movement_type} · {new Date(m.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${movementTypeColors[m.movement_type]}`}>{m.quantity > 0 ? '+' : ''}{m.quantity}</p>
                    {m.notes && <p className="text-xs text-green-400">{m.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
