'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, type PurchaseOrder, type Supplier, type Product } from '@/lib/supabase';
import { Plus, Trash2, Loader as Loader2, X, Package, ChevronDown, ChevronRight, Search } from 'lucide-react';

type ItemRow = {
  product_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  gst_percentage: number;
  hsn_sac_code: string;
};

const emptyItem: ItemRow = { product_id: '', description: '', quantity: 1, unit_price: 0, gst_percentage: 0, hsn_sac_code: '' };

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  received: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminPurchases() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [supplierId, setSupplierId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ItemRow[]>([{ ...emptyItem }]);

  const load = async () => {
    const [{ data: po }, { data: sup }, { data: prod }] = await Promise.all([
      supabase.from('purchase_orders').select('*, suppliers(*), purchase_order_items(*)').order('created_at', { ascending: false }),
      supabase.from('suppliers').select('*').order('name'),
      supabase.from('products').select('*').order('name'),
    ]);
    setOrders((po as PurchaseOrder[]) || []);
    setSuppliers((sup as Supplier[]) || []);
    setProducts((prod as Product[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const calcItem = (item: ItemRow) => {
    const base = item.quantity * item.unit_price;
    const gst = base * (item.gst_percentage / 100);
    return { base, gst, total: base + gst };
  };

  const totals = items.reduce((acc, item) => {
    const c = calcItem(item);
    return { subtotal: acc.subtotal + c.base, gst: acc.gst + c.gst, grand: acc.grand + c.total };
  }, { subtotal: 0, gst: 0, grand: 0 });

  const updateItem = (idx: number, field: keyof ItemRow, value: string | number) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const updated = { ...it, [field]: value };
      if (field === 'product_id' && typeof value === 'string') {
        const product = products.find(p => p.id === value);
        if (product) {
          updated.description = product.name;
          updated.unit_price = product.price;
          updated.gst_percentage = product.gst_percentage;
        }
      }
      return updated;
    }));
  };

  const addItem = () => setItems(prev => [...prev, { ...emptyItem }]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const resetForm = () => {
    setSupplierId(''); setOrderDate(new Date().toISOString().slice(0, 10)); setExpectedDate(''); setNotes(''); setItems([{ ...emptyItem }]); setError('');
  };

  const handleSave = async () => {
    if (items.length === 0 || !items[0].description) { setError('Add at least one item.'); return; }
    setSaving(true); setError('');

    const { data: poNum } = await supabase.rpc('get_next_po_number');
    const poNumber = poNum as string;

    const { data: po, error: poErr } = await supabase.from('purchase_orders').insert({
      po_number: poNumber, supplier_id: supplierId || null, order_date: orderDate,
      expected_date: expectedDate || null, status: 'draft', subtotal: totals.subtotal,
      gst_total: totals.gst, grand_total: totals.grand, notes: notes.trim() || null,
    }).select().single();

    if (poErr) { setSaving(false); setError(poErr.message); return; }

    const poItems = items.map(it => {
      const c = calcItem(it);
      return { purchase_order_id: po.id, product_id: it.product_id || null, description: it.description, quantity: it.quantity, unit_price: it.unit_price, gst_percentage: it.gst_percentage, hsn_sac_code: it.hsn_sac_code || null, base_amount: c.base, gst_amount: c.gst, total: c.total };
    });

    const { error: itemsErr } = await supabase.from('purchase_order_items').insert(poItems);
    if (itemsErr) { setSaving(false); setError(itemsErr.message); return; }

    setSaving(false); setShowForm(false); resetForm(); load();
  };

  const handleReceive = async (po: PurchaseOrder) => {
    if (!confirm(`Receive PO ${po.po_number}? This will add stock for all items.`)) return;
    const { data: poItems } = await supabase.from('purchase_order_items').select('*, products(*)').eq('purchase_order_id', po.id);
    if (!poItems) return;

    for (const item of poItems) {
      if (item.product_id) {
        const product = (item as any).products;
        if (product) {
          await supabase.from('products').update({ stock: product.stock + item.quantity }).eq('id', item.product_id);
        }
        await supabase.from('stock_movements').insert({
          product_id: item.product_id, movement_type: 'purchase', quantity: item.quantity,
          reference_type: 'purchase_order', reference_id: po.id, notes: `PO ${po.po_number}`,
        });
      }
    }

    await supabase.from('purchase_orders').update({ status: 'received' }).eq('id', po.id);
    load();
  };

  const handleCancel = async (po: PurchaseOrder) => {
    if (!confirm(`Cancel PO ${po.po_number}?`)) return;
    await supabase.from('purchase_orders').update({ status: 'cancelled' }).eq('id', po.id);
    load();
  };

  const handleDelete = async (po: PurchaseOrder) => {
    if (!confirm(`Delete PO ${po.po_number}? This cannot be undone.`)) return;
    await supabase.from('purchase_orders').delete().eq('id', po.id);
    load();
  };

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    return !q || o.po_number.toLowerCase().includes(q) || (o.suppliers?.name || '').toLowerCase().includes(q);
  });

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-green-900">Purchase Orders</h1>
          <p className="text-green-600 text-sm mt-1">Manage purchases from suppliers</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 bg-green-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">
          <Plus className="w-4 h-4" /> New Purchase Order
        </button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="w-4 h-4 text-green-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input type="text" placeholder="Search by PO number or supplier..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm border border-green-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-400" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-green-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-green-100">
          <Package className="w-10 h-10 text-green-300 mx-auto mb-3" />
          <p className="text-green-600">No purchase orders yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(po => (
            <div key={po.id} className="bg-white rounded-2xl border border-green-100 overflow-hidden">
              <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-green-50/50 transition-colors" onClick={() => setExpanded(expanded === po.id ? null : po.id)}>
                <div className="flex items-center gap-3">
                  {expanded === po.id ? <ChevronDown className="w-4 h-4 text-green-500" /> : <ChevronRight className="w-4 h-4 text-green-500" />}
                  <div>
                    <p className="font-medium text-green-900 text-sm">{po.po_number}</p>
                    <p className="text-xs text-green-500">{po.suppliers?.name || 'No supplier'} · {new Date(po.order_date).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-green-900">&#8377;{Number(po.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[po.status]}`}>{po.status}</span>
                </div>
              </div>
              {expanded === po.id && (
                <div className="border-t border-green-50 p-5 bg-green-50/30">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-green-500 border-b border-green-100">
                        <th className="text-left py-2">Description</th>
                        <th className="text-right py-2">Qty</th>
                        <th className="text-right py-2">Unit Price</th>
                        <th className="text-right py-2">GST%</th>
                        <th className="text-right py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(po.purchase_order_items || []).map((item: any) => (
                        <tr key={item.id} className="border-b border-green-50">
                          <td className="py-2 text-green-800">{item.description}</td>
                          <td className="py-2 text-right text-green-600">{item.quantity}</td>
                          <td className="py-2 text-right text-green-600">&#8377;{Number(item.unit_price).toLocaleString('en-IN')}</td>
                          <td className="py-2 text-right text-green-600">{item.gst_percentage}%</td>
                          <td className="py-2 text-right font-medium text-green-900">&#8377;{Number(item.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex items-center gap-2 mt-4">
                    {po.status === 'draft' && (
                      <button onClick={() => handleReceive(po)} className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 px-3 py-1.5 rounded-lg transition-colors">
                        <Package className="w-3.5 h-3.5" /> Receive Stock
                      </button>
                    )}
                    {po.status === 'draft' && (
                      <button onClick={() => handleCancel(po)} className="flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                    )}
                    {po.status !== 'received' && (
                      <button onClick={() => handleDelete(po)} className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors ml-auto">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    )}
                  </div>
                  {po.notes && <p className="text-xs text-green-500 mt-3">Notes: {po.notes}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New PO Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-green-100">
              <h3 className="font-display text-xl font-bold text-green-900">New Purchase Order</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-green-100 rounded-lg"><X className="w-5 h-5 text-green-500" /></button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[72vh] overflow-y-auto">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-green-700 mb-1.5">Supplier</label>
                  <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50">
                    <option value="">No supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-green-700 mb-1.5">Order Date</label>
                  <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-green-700 mb-1.5">Expected Date</label>
                  <input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50" />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-green-700">Items</label>
                  <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800"><Plus className="w-3 h-3" /> Add Item</button>
                </div>
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex flex-wrap gap-2 items-center bg-green-50 rounded-xl p-3">
                      <select value={item.product_id} onChange={(e) => updateItem(idx, 'product_id', e.target.value)} className="text-xs px-2 py-2 border border-green-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-400 min-w-[140px]">
                        <option value="">Custom item</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input placeholder="Description" value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} className="text-xs px-2 py-2 border border-green-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-400 flex-1 min-w-[120px]" />
                      <input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)} className="text-xs px-2 py-2 border border-green-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-400 w-16" />
                      <input type="number" min="0" step="0.01" placeholder="Price" value={item.unit_price} onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)} className="text-xs px-2 py-2 border border-green-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-400 w-20" />
                      <input type="number" min="0" step="0.01" placeholder="GST%" value={item.gst_percentage} onChange={(e) => updateItem(idx, 'gst_percentage', parseFloat(e.target.value) || 0)} className="text-xs px-2 py-2 border border-green-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-400 w-16" />
                      <span className="text-xs font-medium text-green-800 w-20 text-right">&#8377;{calcItem(item).total.toFixed(2)}</span>
                      {items.length > 1 && <button type="button" onClick={() => removeItem(idx)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-green-50 rounded-xl p-4 space-y-1">
                <div className="flex justify-between text-sm text-green-600"><span>Subtotal</span><span>&#8377;{totals.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm text-green-600"><span>GST</span><span>&#8377;{totals.gst.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm font-bold text-green-900 border-t border-green-200 pt-1"><span>Grand Total</span><span>&#8377;{totals.grand.toFixed(2)}</span></div>
              </div>

              <div>
                <label className="block text-xs font-medium text-green-700 mb-1.5">Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-green-100 flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border border-green-200 text-green-700 rounded-xl text-sm font-medium hover:bg-green-50 transition-colors">Cancel</button>
              <button type="button" onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 bg-green-800 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? 'Saving...' : 'Create Purchase Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
