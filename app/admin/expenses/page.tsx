'use client';

import { useEffect, useState } from 'react';
import { supabase, type Expense } from '@/lib/supabase';
import { Plus, Pencil, Trash2, Loader as Loader2, X, Wallet, Search } from 'lucide-react';

type Form = {
  category: string; description: string; amount: string; gst_amount: string;
  payment_mode: string; paid_to: string; expense_date: string; notes: string;
};

const emptyForm: Form = { category: 'other', description: '', amount: '', gst_amount: '0', payment_mode: 'cash', paid_to: '', expense_date: new Date().toISOString().slice(0, 10), notes: '' };

const categoryLabels: Record<string, string> = {
  rent: 'Rent', salaries: 'Salaries', utilities: 'Utilities', marketing: 'Marketing',
  purchasing: 'Purchasing', logistics: 'Logistics', maintenance: 'Maintenance', other: 'Other',
};

const paymentModes: Record<string, string> = {
  cash: 'Cash', upi: 'UPI', bank: 'Bank Transfer', cheque: 'Cheque', card: 'Card',
};

export default function AdminExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false });
    setExpenses((data as Expense[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditing(null); setModal('add'); setError(''); };
  const openEdit = (e: Expense) => {
    setEditing(e);
    setForm({ category: e.category, description: e.description, amount: String(e.amount), gst_amount: String(e.gst_amount), payment_mode: e.payment_mode, paid_to: e.paid_to || '', expense_date: e.expense_date, notes: e.notes || '' });
    setModal('edit'); setError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.amount) { setError('Description and amount are required.'); return; }
    setSaving(true);
    const amt = parseFloat(form.amount) || 0;
    const gst = parseFloat(form.gst_amount) || 0;
    const payload = { category: form.category, description: form.description.trim(), amount: amt, gst_amount: gst, total_amount: amt + gst, payment_mode: form.payment_mode, paid_to: form.paid_to.trim() || null, expense_date: form.expense_date, notes: form.notes.trim() || null };
    const { error: e2 } = editing ? await supabase.from('expenses').update(payload).eq('id', editing.id) : await supabase.from('expenses').insert(payload);
    setSaving(false);
    if (e2) { setError(e2.message); return; }
    setModal(null); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    setDeletingId(id);
    await supabase.from('expenses').delete().eq('id', id);
    setDeletingId(null); load();
  };

  const filtered = expenses.filter(e => {
    const matchesCat = filterCat === 'all' || e.category === filterCat;
    const q = search.toLowerCase();
    const matchesSearch = !q || e.description.toLowerCase().includes(q) || (e.paid_to || '').toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const totalAmount = filtered.reduce((s, e) => s + Number(e.total_amount), 0);

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-green-900">Expenses</h1>
          <p className="text-green-600 text-sm mt-1">Track business expenses across categories</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-green-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-green-100 p-5">
          <p className="text-xs text-green-500 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-green-900">&#8377;{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white rounded-2xl border border-green-100 p-5">
          <p className="text-xs text-green-500 mb-1">Categories</p>
          <p className="text-2xl font-bold text-green-900">{new Set(filtered.map(e => e.category)).size}</p>
        </div>
        <div className="bg-white rounded-2xl border border-green-100 p-5">
          <p className="text-xs text-green-500 mb-1">Entries</p>
          <p className="text-2xl font-bold text-green-900">{filtered.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-green-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm border border-green-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="px-3 py-2.5 text-sm border border-green-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-400">
          <option value="all">All Categories</option>
          {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-green-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-green-100">
          <Wallet className="w-10 h-10 text-green-300 mx-auto mb-3" />
          <p className="text-green-600">No expenses found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-green-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-green-50 border-b border-green-100">
                  <th className="text-left px-6 py-4 text-xs font-medium text-green-600 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide">Description</th>
                  <th className="text-left px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide">Category</th>
                  <th className="text-left px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide">Paid To</th>
                  <th className="text-left px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide">Mode</th>
                  <th className="text-right px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide">Amount</th>
                  <th className="text-right px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide">Total</th>
                  <th className="px-4 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-green-50">
                {filtered.map(e => (
                  <tr key={e.id} className="hover:bg-green-50/50 transition-colors">
                    <td className="px-6 py-4 text-green-600 text-xs">{new Date(e.expense_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="px-4 py-4 font-medium text-green-800">{e.description}</td>
                    <td className="px-4 py-4"><span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">{categoryLabels[e.category]}</span></td>
                    <td className="px-4 py-4 text-green-600 text-xs">{e.paid_to || '—'}</td>
                    <td className="px-4 py-4 text-green-600 text-xs">{paymentModes[e.payment_mode]}</td>
                    <td className="px-4 py-4 text-right text-green-600">&#8377;{Number(e.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-4 text-right font-medium text-green-900">&#8377;{Number(e.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => openEdit(e)} className="p-1.5 text-green-400 hover:text-green-700 hover:bg-green-100 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(e.id)} disabled={deletingId === e.id} className="p-1.5 text-green-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                          {deletingId === e.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-green-100">
              <h3 className="font-display text-xl font-bold text-green-900">{modal === 'add' ? 'Add Expense' : 'Edit Expense'}</h3>
              <button onClick={() => setModal(null)} className="p-1 hover:bg-green-100 rounded-lg"><X className="w-5 h-5 text-green-500" /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="px-6 py-5 space-y-4 max-h-[72vh] overflow-y-auto">
                {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1.5">Category</label>
                    <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50">
                      {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1.5">Date</label>
                    <input type="date" value={form.expense_date} onChange={(e) => setForm(f => ({ ...f, expense_date: e.target.value }))} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-green-700 mb-1.5">Description *</label>
                    <input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1.5">Amount (&#8377;) *</label>
                    <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1.5">GST Amount (&#8377;)</label>
                    <input type="number" min="0" step="0.01" value={form.gst_amount} onChange={(e) => setForm(f => ({ ...f, gst_amount: e.target.value }))} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1.5">Payment Mode</label>
                    <select value={form.payment_mode} onChange={(e) => setForm(f => ({ ...f, payment_mode: e.target.value }))} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50">
                      {Object.entries(paymentModes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1.5">Paid To</label>
                    <input value={form.paid_to} onChange={(e) => setForm(f => ({ ...f, paid_to: e.target.value }))} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-green-700 mb-1.5">Notes</label>
                    <textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50 resize-none" />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-green-100 flex gap-3">
                <button type="button" onClick={() => setModal(null)} className="flex-1 px-4 py-2.5 border border-green-200 text-green-700 rounded-xl text-sm font-medium hover:bg-green-50 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-green-800 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {saving ? 'Saving...' : modal === 'add' ? 'Add Expense' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
