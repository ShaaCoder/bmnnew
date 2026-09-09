'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, type Product, type Category, type StockMovement } from '@/lib/supabase';
import {
  Boxes, Search, Plus, Pencil, Trash2, X, Loader as Loader2,
  AlertTriangle, Package, TrendingUp, TrendingDown, History,
  ArrowUpCircle, ArrowDownCircle, PackageCheck, Save, Filter, BarChart3,
} from 'lucide-react';

type AdjType = 'in' | 'out' | 'damage' | 'return' | 'transfer';

const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt0 = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const adjConfig: Record<AdjType, { label: string; icon: typeof ArrowUpCircle; color: string; bg: string; sign: number }> = {
  in:       { label: 'Stock In',     icon: ArrowUpCircle,   color: 'text-green-600',  bg: 'bg-green-100',  sign: 1 },
  out:      { label: 'Stock Out',     icon: ArrowDownCircle, color: 'text-red-600',    bg: 'bg-red-100',    sign: -1 },
  damage:   { label: 'Damage/Loss',   icon: AlertTriangle,   color: 'text-amber-600',  bg: 'bg-amber-100',  sign: -1 },
  return:   { label: 'Return',        icon: PackageCheck,     color: 'text-blue-600',  bg: 'bg-blue-100',   sign: 1 },
  transfer: { label: 'Transfer',     icon: TrendingUp,       color: 'text-purple-600', bg: 'bg-purple-100', sign: 0 },
};

export default function AdminInventory() {
  const [products, setProducts] = useState<(Product & { categories?: Category })[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'offline' | 'low' | 'out'>('all');
  const [tab, setTab] = useState<'overview' | 'movements'>('overview');

  // Product modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Adjustment modal
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [adjProduct, setAdjProduct] = useState<Product | null>(null);
  const [adjType, setAdjType] = useState<AdjType>('in');
  const [adjQty, setAdjQty] = useState(1);
  const [adjNote, setAdjNote] = useState('');
  const [adjSaving, setAdjSaving] = useState(false);

  // Product form
  const [pName, setPName] = useState('');
  const [pSlug, setPSlug] = useState('');
  const [pCategory, setPCategory] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pCostPrice, setPCostPrice] = useState('');
  const [pGst, setPGst] = useState('18');
  const [pStock, setPStock] = useState('0');
  const [pMinStock, setPMinStock] = useState('0');
  const [pBarcode, setPBarcode] = useState('');
  const [pSku, setPSku] = useState('');
  const [pUom, setPUom] = useState('NOS');
  const [pIsOffline, setPIsOffline] = useState(true);
  const [pDesc, setPDesc] = useState('');

  const load = useCallback(async () => {
    const [{ data: prods }, { data: movs }, { data: cats }] = await Promise.all([
      supabase.from('products').select('*, categories(*)').order('name'),
      supabase.from('stock_movements').select('*, products(name, slug, uom)').order('created_at', { ascending: false }).limit(60),
      supabase.from('categories').select('*').order('name'),
    ]);
    setProducts((prods as any) || []);
    setMovements((movs as StockMovement[]) || []);
    setCategories(cats || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.barcode || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q);
    const matchFilter =
      filter === 'all' ||
      (filter === 'offline' && p.is_offline) ||
      (filter === 'low' && p.stock > 0 && p.stock <= (p.min_stock || 5)) ||
      (filter === 'out' && p.stock <= 0);
    return matchSearch && matchFilter;
  });

  const totalUnits = products.reduce((s, p) => s + p.stock, 0);
  const stockValueCost = products.reduce((s, p) => s + p.stock * (p.cost_price || 0), 0);
  const stockValueRetail = products.reduce((s, p) => s + p.stock * p.price, 0);
  const lowStockItems = products.filter(p => p.stock > 0 && p.stock <= (p.min_stock || 5));
  const outOfStockItems = products.filter(p => p.stock <= 0);
  const offlineCount = products.filter(p => p.is_offline).length;

  const resetProductForm = () => {
    setEditingProduct(null);
    setPName(''); setPSlug(''); setPCategory(''); setPPrice(''); setPCostPrice('');
    setPGst('18'); setPStock('0'); setPMinStock('0'); setPBarcode(''); setPSku('');
    setPUom('NOS'); setPIsOffline(true); setPDesc(''); setError('');
  };

  const openCreate = () => { resetProductForm(); setShowProductModal(true); };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setPName(p.name); setPSlug(p.slug); setPCategory(p.category_id || '');
    setPPrice(String(p.price)); setPCostPrice(String(p.cost_price || 0));
    setPGst(String(p.gst_percentage ?? 18)); setPStock(String(p.stock));
    setPMinStock(String(p.min_stock || 0)); setPBarcode(p.barcode || '');
    setPSku(p.sku || ''); setPUom(p.uom || 'NOS'); setPIsOffline(p.is_offline);
    setPDesc(p.description || ''); setError('');
    setShowProductModal(true);
  };

  const handleSaveProduct = async () => {
    if (!pName.trim()) { setError('Product name is required'); return; }
    if (!pPrice) { setError('Selling price is required'); return; }
    setSaving(true); setError('');
    const slug = pSlug.trim() || slugify(pName);
    const payload = {
      name: pName.trim(),
      slug,
      category_id: pCategory || null,
      description: pDesc.trim() || null,
      price: parseFloat(pPrice) || 0,
      cost_price: parseFloat(pCostPrice) || 0,
      gst_percentage: parseFloat(pGst) || 0,
      stock: parseInt(pStock) || 0,
      min_stock: parseInt(pMinStock) || 0,
      barcode: pBarcode.trim() || null,
      sku: pSku.trim() || null,
      uom: pUom,
      is_offline: pIsOffline,
    };
    try {
      if (editingProduct) {
        const { error: e } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from('products').insert(payload);
        if (e) throw e;
      }
      setSaving(false); setShowProductModal(false); resetProductForm(); load();
    } catch (err: any) {
      setSaving(false); setError(err.message || 'Failed to save product');
    }
  };

  const handleDelete = async (p: Product) => {
    if (!confirm(`Delete "${p.name}" from inventory? This cannot be undone.`)) return;
    await supabase.from('products').delete().eq('id', p.id);
    load();
  };

  const openAdjustment = (p: Product) => {
    setAdjProduct(p);
    setAdjType('in');
    setAdjQty(1);
    setAdjNote('');
    setShowAdjModal(true);
  };

  const handleAdjustment = async () => {
    if (!adjProduct || adjQty <= 0) return;
    setAdjSaving(true);
    const cfg = adjConfig[adjType];
    const newStock = Math.max(0, adjProduct.stock + cfg.sign * adjQty);

    try {
      await supabase.from('products').update({ stock: newStock }).eq('id', adjProduct.id);
      await supabase.from('stock_movements').insert({
        product_id: adjProduct.id,
        movement_type: adjType === 'in' ? 'purchase' : adjType === 'out' ? 'sale' : adjType,
        quantity: cfg.sign * adjQty,
        reference_type: 'manual_adjustment',
        reference_id: adjProduct.id,
        notes: `${cfg.label}: ${adjNote || '—'}`,
      });
      setAdjSaving(false); setShowAdjModal(false); load();
    } catch (err: any) {
      setAdjSaving(false); setError(err.message || 'Failed to adjust stock');
    }
  };

  const movementColor: Record<string, string> = {
    purchase: 'text-green-600', sale: 'text-red-600', adjustment: 'text-amber-600',
    return: 'text-blue-600', transfer: 'text-purple-600', damage: 'text-amber-600',
    in: 'text-green-600', out: 'text-red-600',
  };

  const inputCls = "w-full px-3 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50/30";
  const labelCls = "text-xs font-medium text-green-600 uppercase tracking-wide";
  const cardCls = "bg-white rounded-2xl border border-green-100 overflow-hidden";

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-green-900">Inventory Management</h1>
          <p className="text-green-600 text-sm mt-1">Track and manage offline/physical store products</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-green-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">
          <Plus className="w-4 h-4" /> Add Inventory Item
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-green-100 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Boxes className="w-4 h-4 text-green-500" />
            <p className="text-xs text-green-500">Total Units in Stock</p>
          </div>
          <p className="text-2xl font-bold text-green-900">{fmt0(totalUnits)}</p>
          <p className="text-xs text-green-400 mt-1">{offlineCount} offline products</p>
        </div>
        <div className="bg-white rounded-2xl border border-green-100 p-5">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-green-500" />
            <p className="text-xs text-green-500">Stock Value (Cost)</p>
          </div>
          <p className="text-2xl font-bold text-green-900">&#8377;{fmt0(stockValueCost)}</p>
          <p className="text-xs text-green-400 mt-1">Retail: &#8377;{fmt0(stockValueRetail)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-amber-100 p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <p className="text-xs text-amber-500">Low Stock Alerts</p>
          </div>
          <p className="text-2xl font-bold text-amber-700">{lowStockItems.length}</p>
          <p className="text-xs text-amber-400 mt-1">Need reorder soon</p>
        </div>
        <div className="bg-white rounded-2xl border border-red-100 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-red-500" />
            <p className="text-xs text-red-500">Out of Stock</p>
          </div>
          <p className="text-2xl font-bold text-red-700">{outOfStockItems.length}</p>
          <p className="text-xs text-red-400 mt-1">Restock needed</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('overview')} className={`text-sm px-4 py-2 rounded-xl font-medium transition-colors ${tab === 'overview' ? 'bg-green-800 text-white' : 'bg-white text-green-600 border border-green-100 hover:bg-green-50'}`}>
          <span className="flex items-center gap-1.5"><Boxes className="w-3.5 h-3.5" /> Stock Overview</span>
        </button>
        <button onClick={() => setTab('movements')} className={`text-sm px-4 py-2 rounded-xl font-medium transition-colors ${tab === 'movements' ? 'bg-green-800 text-white' : 'bg-white text-green-600 border border-green-100 hover:bg-green-50'}`}>
          <span className="flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> Movement History</span>
        </button>
      </div>

      {tab === 'overview' ? (
        <>
          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-green-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Search by name, barcode, or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm border border-green-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-green-400" />
              {(['all', 'offline', 'low', 'out'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`text-xs px-3 py-2 rounded-lg font-medium transition-colors ${filter === f ? 'bg-green-800 text-white' : 'bg-white text-green-600 border border-green-100 hover:bg-green-50'}`}>
                  {f === 'all' ? 'All' : f === 'offline' ? 'Offline' : f === 'low' ? 'Low Stock' : 'Out of Stock'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-green-100 rounded-xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-green-100">
              <Boxes className="w-10 h-10 text-green-300 mx-auto mb-3" />
              <p className="text-green-600">No inventory items found.</p>
              <button onClick={openCreate} className="mt-4 text-sm text-green-700 font-medium hover:text-green-800">Add your first item</button>
            </div>
          ) : (
            <div className={cardCls}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-green-50 border-b border-green-100">
                      <th className="text-left px-4 py-3 text-xs font-medium text-green-600 uppercase tracking-wide">Product</th>
                      <th className="text-left px-3 py-3 text-xs font-medium text-green-600 uppercase tracking-wide hidden md:table-cell">SKU/Barcode</th>
                      <th className="text-left px-3 py-3 text-xs font-medium text-green-600 uppercase tracking-wide hidden lg:table-cell">Category</th>
                      <th className="text-right px-3 py-3 text-xs font-medium text-green-600 uppercase tracking-wide">Stock</th>
                      <th className="text-right px-3 py-3 text-xs font-medium text-green-600 uppercase tracking-wide hidden sm:table-cell">Min</th>
                      <th className="text-right px-3 py-3 text-xs font-medium text-green-600 uppercase tracking-wide hidden md:table-cell">Cost</th>
                      <th className="text-right px-3 py-3 text-xs font-medium text-green-600 uppercase tracking-wide hidden lg:table-cell">Value</th>
                      <th className="text-center px-3 py-3 text-xs font-medium text-green-600 uppercase tracking-wide">Status</th>
                      <th className="px-3 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-50">
                    {filtered.map(p => {
                      const isLow = p.stock > 0 && p.stock <= (p.min_stock || 5);
                      const isOut = p.stock <= 0;
                      return (
                        <tr key={p.id} className="hover:bg-green-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="w-8 h-8 rounded-lg object-cover" /> : <Package className="w-4 h-4 text-green-300" />}
                              <div>
                                <p className="font-medium text-green-800">{p.name}</p>
                                {p.is_offline && <span className="text-[10px] text-green-500 bg-green-50 px-1.5 py-0.5 rounded">Offline</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 hidden md:table-cell">
                            <p className="text-xs text-green-600">{p.sku || '—'}</p>
                            <p className="text-[10px] text-green-400">{p.barcode || ''}</p>
                          </td>
                          <td className="px-3 py-3 hidden lg:table-cell text-xs text-green-600">{p.categories?.name || '—'}</td>
                          <td className="px-3 py-3 text-right font-medium text-green-900">{p.stock} <span className="text-[10px] text-green-400">{p.uom}</span></td>
                          <td className="px-3 py-3 text-right text-green-500 hidden sm:table-cell text-xs">{p.min_stock || 0}</td>
                          <td className="px-3 py-3 text-right text-green-600 hidden md:table-cell">&#8377;{fmt(p.cost_price || 0)}</td>
                          <td className="px-3 py-3 text-right text-green-700 hidden lg:table-cell">&#8377;{fmt0(p.stock * (p.cost_price || 0))}</td>
                          <td className="px-3 py-3 text-center">
                            {isOut ? <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">Out</span>
                             : isLow ? <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">Low</span>
                             : <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">OK</span>}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1.5 justify-end">
                              <button onClick={() => openAdjustment(p)} title="Adjust Stock" className="p-1.5 text-green-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                <ArrowUpCircle className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => openEdit(p)} title="Edit" className="p-1.5 text-green-400 hover:text-green-700 hover:bg-green-100 rounded-lg transition-colors">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDelete(p)} title="Delete" className="p-1.5 text-green-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className={cardCls}>
          {movements.length === 0 ? (
            <div className="text-center py-16">
              <History className="w-10 h-10 text-green-300 mx-auto mb-3" />
              <p className="text-green-600">No stock movements recorded yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-green-50">
              {movements.map(m => {
                const isPositive = m.quantity > 0;
                return (
                  <div key={m.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
                        {isPositive ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-800">{m.products?.name || 'Unknown product'}</p>
                        <p className="text-xs text-green-500">
                          <span className={`font-medium ${movementColor[m.movement_type] || 'text-green-500'}`}>{m.movement_type}</span>
                          {' · '}{new Date(m.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>{isPositive ? '+' : ''}{m.quantity}</p>
                      {m.notes && <p className="text-xs text-green-400 max-w-[200px] truncate">{m.notes}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[94vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-green-100 shrink-0">
              <h3 className="font-display text-xl font-bold text-green-900">{editingProduct ? 'Edit Inventory Item' : 'Add Inventory Item'}</h3>
              <button onClick={() => { setShowProductModal(false); resetProductForm(); }} className="p-1.5 hover:bg-green-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-green-500" />
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Product Name *</label>
                  <input value={pName} onChange={(e) => { setPName(e.target.value); if (!editingProduct) setPSlug(slugify(e.target.value)); }} className={inputCls} placeholder="Product name" />
                </div>
                <div>
                  <label className={labelCls}>Slug</label>
                  <input value={pSlug} onChange={(e) => setPSlug(e.target.value)} className={inputCls + ' font-mono'} placeholder="auto-generated" />
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select value={pCategory} onChange={(e) => setPCategory(e.target.value)} className={inputCls}>
                    <option value="">No category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Unit of Measure</label>
                  <select value={pUom} onChange={(e) => setPUom(e.target.value)} className={inputCls}>
                    <option value="NOS">NOS (Numbers)</option>
                    <option value="KG">KG (Kilogram)</option>
                    <option value="GM">GM (Gram)</option>
                    <option value="MTR">MTR (Meter)</option>
                    <option value="PCS">PCS (Pieces)</option>
                    <option value="BOX">BOX (Box)</option>
                    <option value="SET">SET (Set)</option>
                    <option value="LTR">LTR (Liter)</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Selling Price (&#8377;) *</label>
                  <input type="number" min="0" step="0.01" value={pPrice} onChange={(e) => setPPrice(e.target.value)} className={inputCls} placeholder="0.00" />
                </div>
                <div>
                  <label className={labelCls}>Cost Price (&#8377;)</label>
                  <input type="number" min="0" step="0.01" value={pCostPrice} onChange={(e) => setPCostPrice(e.target.value)} className={inputCls} placeholder="0.00" />
                </div>
                <div>
                  <label className={labelCls}>GST (%)</label>
                  <input type="number" min="0" max="100" step="0.5" value={pGst} onChange={(e) => setPGst(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Current Stock</label>
                  <input type="number" min="0" value={pStock} onChange={(e) => setPStock(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Min Stock (Reorder Level)</label>
                  <input type="number" min="0" value={pMinStock} onChange={(e) => setPMinStock(e.target.value)} className={inputCls} placeholder="Alert when stock falls to this level" />
                </div>
                <div>
                  <label className={labelCls}>Barcode</label>
                  <input value={pBarcode} onChange={(e) => setPBarcode(e.target.value)} className={inputCls} placeholder="Scan or enter barcode" />
                </div>
                <div>
                  <label className={labelCls}>SKU (Internal Code)</label>
                  <input value={pSku} onChange={(e) => setPSku(e.target.value)} className={inputCls} placeholder="e.g. PROD-001" />
                </div>
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <textarea value={pDesc} onChange={(e) => setPDesc(e.target.value)} rows={2} className={inputCls + ' resize-none'} placeholder="Product description (optional)" />
              </div>

              <label className="flex items-center gap-2 text-sm text-green-700 cursor-pointer">
                <input type="checkbox" checked={pIsOffline} onChange={(e) => setPIsOffline(e.target.checked)} className="w-4 h-4 rounded border-green-300 text-green-600 focus:ring-green-400" />
                Mark as offline/physical store product
              </label>
            </div>
            <div className="px-6 py-4 border-t border-green-100 flex gap-3 shrink-0">
              <button onClick={() => { setShowProductModal(false); resetProductForm(); }} className="px-5 py-2.5 border border-green-200 text-green-700 rounded-xl text-sm font-medium hover:bg-green-50 transition-colors">Cancel</button>
              <button onClick={handleSaveProduct} disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-green-800 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingProduct ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjModal && adjProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-green-100">
              <h3 className="font-display text-lg font-bold text-green-900">Adjust Stock</h3>
              <button onClick={() => setShowAdjModal(false)} className="p-1.5 hover:bg-green-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-green-500" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-sm font-medium text-green-900">{adjProduct.name}</p>
                <p className="text-xs text-green-500">Current stock: {adjProduct.stock} {adjProduct.uom || 'NOS'}</p>
                {adjProduct.barcode && <p className="text-xs text-green-400">Barcode: {adjProduct.barcode}</p>}
              </div>

              <div>
                <label className={labelCls}>Adjustment Type</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {(Object.keys(adjConfig) as AdjType[]).map(t => {
                    const cfg = adjConfig[t];
                    const Icon = cfg.icon;
                    return (
                      <button key={t} onClick={() => setAdjType(t)} className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-colors ${adjType === t ? 'border-green-400 bg-green-50' : 'border-green-100 hover:bg-green-50/50'}`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                        <span className="text-[10px] font-medium text-green-700">{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className={labelCls}>Quantity</label>
                <input type="number" min="1" value={adjQty} onChange={(e) => setAdjQty(parseInt(e.target.value) || 0)} className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Note (optional)</label>
                <textarea value={adjNote} onChange={(e) => setAdjNote(e.target.value)} rows={2} className={inputCls + ' resize-none'} placeholder="Reason for adjustment..." />
              </div>

              <div className="bg-green-50 rounded-xl p-3 text-sm">
                <div className="flex justify-between text-green-600">
                  <span>Current Stock</span><span>{adjProduct.stock} {adjProduct.uom || 'NOS'}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Adjustment</span>
                  <span className={adjConfig[adjType].sign > 0 ? 'text-green-600' : 'text-red-600'}>
                    {adjConfig[adjType].sign > 0 ? '+' : '-'}{adjQty} {adjProduct.uom || 'NOS'}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-green-900 border-t border-green-200 mt-1 pt-1">
                  <span>New Stock</span>
                  <span>{Math.max(0, adjProduct.stock + adjConfig[adjType].sign * adjQty)} {adjProduct.uom || 'NOS'}</span>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-green-100 flex gap-3">
              <button onClick={() => setShowAdjModal(false)} className="flex-1 px-4 py-2.5 border border-green-200 text-green-700 rounded-xl text-sm font-medium hover:bg-green-50 transition-colors">Cancel</button>
              <button onClick={handleAdjustment} disabled={adjSaving || adjQty <= 0} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-800 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50">
                {adjSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Apply Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
