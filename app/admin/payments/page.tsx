'use client';

import { useEffect, useState } from 'react';
import { supabase, type Payment } from '@/lib/supabase';
import { Plus, Trash2, Loader as Loader2, X, CreditCard, Search, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

type Form = {
  payment_type: string; party_name: string; reference_type: string; reference_id: string;
  amount: string; payment_mode: string; payment_date: string; transaction_id: string; notes: string;
};

const emptyForm: Form = { payment_type: 'receivable', party_name: '', reference_type: '', reference_id: '', amount: '', payment_mode: 'cash', payment_date: new Date().toISOString().slice(0, 10), transaction_id: '', notes: '' };

const paymentModes: Record<string, string> = { cash: 'Cash', upi: 'UPI', bank: 'Bank Transfer', cheque: 'Cheque', card: 'Card' };

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from('payments').select('*').order('payment_date', { ascending: false });
    setPayments((data as Payment[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.party_name || !form.amount) { setError('Party name and amount are required.'); return; }
    setSaving(true);
    const payload = {
      payment_type: form.payment_type, party_name: form.party_name.trim(),
      reference_type: form.reference_type || null, reference_id: form.reference_id || null,
      amount: parseFloat(form.amount) || 0, payment_mode: form.payment_mode,
      payment_date: form.payment_date, transaction_id: form.transaction_id.trim() || null,
      notes: form.notes.trim() || null,
    };
    const { error: e2 } = await supabase.from('payments').insert(payload);
    setSaving(false);
    if (e2) { setError(e2.message); return; }
    setModal(false); setForm(emptyForm); setError(''); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this payment record?')) return;
    setDeletingId(id);
    await supabase.from('payments').delete().eq('id', id);
    setDeletingId(null); load();
  };

  const filtered = payments.filter(p => {
    const matchesType = filterType === 'all' || p.payment_type === filterType;
    const q = search.toLowerCase();
    const matchesSearch = !q || p.party_name.toLowerCase().includes(q) || (p.transaction_id || '').toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  const totalReceivable = payments.filter(p => p.payment_type === 'receivable').reduce((s, p) => s + Number(p.amount), 0);
  const totalPayable = payments.filter(p => p.payment_type === 'payable').reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-green-900">Payments</h1>
          <p className="text-green-600 text-sm mt-1">Track receivables and payables</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setModal(true); setError(''); }} className="flex items-center gap-2 bg-green-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">
          <Plus className="w-4 h-4" /> Record Payment
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-green-100 p-5">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownLeft className="w-4 h-4 text-green-500" />
            <p className="text-xs text-green-500">Total Receivables (Money In)</p>
          </div>
          <p className="text-2xl font-bold text-green-700">&#8377;{totalReceivable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white rounded-2xl border border-green-100 p-5">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="w-4 h-4 text-red-500" />
            <p className="text-xs text-red-500">Total Payables (Money Out)</p>
          </div>
          <p className="text-2xl font-bold text-red-700">&#8377;{totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-green-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search by party or transaction ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm border border-green-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2.5 text-sm border border-green-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-400">
          <option value="all">All Payments</option>
          <option value="receivable">Receivables (In)</option>
          <option value="payable">Payables (Out)</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-green-100 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-green-100">
          <CreditCard className="w-10 h-10 text-green-300 mx-auto mb-3" />
          <p className="text-green-600">No payment records found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-green-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-green-50 border-b border-green-100">
                  <th className="text-left px-6 py-4 text-xs font-medium text-green-600 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide">Party</th>
                  <th className="text-left px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide">Mode</th>
                  <th className="text-left px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide hidden md:table-cell">Reference</th>
                  <th className="text-right px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide">Amount</th>
                  <th className="px-4 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-green-50">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-green-50/50 transition-colors">
                    <td className="px-6 py-4 text-green-600 text-xs">{new Date(p.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${p.payment_type === 'receivable' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.payment_type === 'receivable' ? 'Received' : 'Paid'}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-medium text-green-800">{p.party_name}</td>
                    <td className="px-4 py-4 text-green-600 text-xs">{paymentModes[p.payment_mode]}</td>
                    <td className="px-4 py-4 text-green-600 text-xs hidden md:table-cell">{p.reference_type || '—'}</td>
                    <td className="px-4 py-4 text-right font-medium text-green-900">&#8377;{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-4">
                      <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id} className="p-1.5 text-green-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                        {deletingId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
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
              <h3 className="font-display text-xl font-bold text-green-900">Record Payment</h3>
              <button onClick={() => setModal(false)} className="p-1 hover:bg-green-100 rounded-lg"><X className="w-5 h-5 text-green-500" /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="px-6 py-5 space-y-4 max-h-[72vh] overflow-y-auto">
                {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1.5">Type</label>
                    <select value={form.payment_type} onChange={(e) => setForm(f => ({ ...f, payment_type: e.target.value }))} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50">
                      <option value="receivable">Receivable (Money In)</option>
                      <option value="payable">Payable (Money Out)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1.5">Date</label>
                    <input type="date" value={form.payment_date} onChange={(e) => setForm(f => ({ ...f, payment_date: e.target.value }))} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-green-700 mb-1.5">Party Name *</label>
                    <input value={form.party_name} onChange={(e) => setForm(f => ({ ...f, party_name: e.target.value }))} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1.5">Amount (&#8377;) *</label>
                    <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1.5">Payment Mode</label>
                    <select value={form.payment_mode} onChange={(e) => setForm(f => ({ ...f, payment_mode: e.target.value }))} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50">
                      {Object.entries(paymentModes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1.5">Reference Type</label>
                    <input value={form.reference_type} onChange={(e) => setForm(f => ({ ...f, reference_type: e.target.value }))} placeholder="e.g. invoice, po, offline_sale" className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1.5">Reference ID</label>
                    <input value={form.reference_id} onChange={(e) => setForm(f => ({ ...f, reference_id: e.target.value }))} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1.5">Transaction ID</label>
                    <input value={form.transaction_id} onChange={(e) => setForm(f => ({ ...f, transaction_id: e.target.value }))} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-green-700 mb-1.5">Notes</label>
                    <textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50 resize-none" />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-green-100 flex gap-3">
                <button type="button" onClick={() => setModal(false)} className="flex-1 px-4 py-2.5 border border-green-200 text-green-700 rounded-xl text-sm font-medium hover:bg-green-50 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-green-800 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {saving ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
