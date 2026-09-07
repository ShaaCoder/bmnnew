'use client';

import { useEffect, useState } from 'react';
import { supabase, type Supplier } from '@/lib/supabase';
import { Plus, Pencil, Trash2, Loader as Loader2, X, Truck, Search } from 'lucide-react';

type Form = {
  name: string; contact_person: string; phone: string; email: string;
  address: string; gstin: string; pan: string; payment_terms: string; notes: string;
};

const emptyForm: Form = { name: '', contact_person: '', phone: '', email: '', address: '', gstin: '', pan: '', payment_terms: '', notes: '' };

export default function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false });
    setSuppliers((data as Supplier[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditing(null); setModal('add'); setError(''); };
  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({ name: s.name, contact_person: s.contact_person || '', phone: s.phone || '', email: s.email || '', address: s.address || '', gstin: s.gstin || '', pan: s.pan || '', payment_terms: s.payment_terms || '', notes: s.notes || '' });
    setModal('edit'); setError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { setError('Name is required.'); return; }
    setSaving(true);
    const payload = { name: form.name.trim(), contact_person: form.contact_person.trim() || null, phone: form.phone.trim() || null, email: form.email.trim() || null, address: form.address.trim() || null, gstin: form.gstin.trim() || null, pan: form.pan.trim() || null, payment_terms: form.payment_terms.trim() || null, notes: form.notes.trim() || null };
    const { error: e2 } = editing ? await supabase.from('suppliers').update(payload).eq('id', editing.id) : await supabase.from('suppliers').insert(payload);
    setSaving(false);
    if (e2) { setError(e2.message); return; }
    setModal(null); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this supplier?')) return;
    setDeletingId(id);
    await supabase.from('suppliers').delete().eq('id', id);
    setDeletingId(null); load();
  };

  const filtered = suppliers.filter(s => {
    const q = search.toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || (s.phone || '').includes(q) || (s.gstin || '').toLowerCase().includes(q);
  });

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-green-900">Suppliers</h1>
          <p className="text-green-600 text-sm mt-1">Manage your supplier network</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-green-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="w-4 h-4 text-green-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input type="text" placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm border border-green-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-400" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 bg-green-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-green-100">
          <Truck className="w-10 h-10 text-green-300 mx-auto mb-3" />
          <p className="text-green-600">No suppliers found. Add your first supplier.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => (
            <div key={s.id} className="bg-white rounded-2xl border border-green-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-900 text-sm">{s.name}</p>
                    {s.contact_person && <p className="text-xs text-green-500">{s.contact_person}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(s)} className="p-1.5 text-green-400 hover:text-green-700 hover:bg-green-100 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(s.id)} disabled={deletingId === s.id} className="p-1.5 text-green-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                    {deletingId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-xs text-green-600">
                {s.phone && <p>Phone: {s.phone}</p>}
                {s.email && <p>Email: {s.email}</p>}
                {s.gstin && <p>GSTIN: {s.gstin}</p>}
                {s.payment_terms && <p>Terms: {s.payment_terms}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-green-100">
              <h3 className="font-display text-xl font-bold text-green-900">{modal === 'add' ? 'Add Supplier' : 'Edit Supplier'}</h3>
              <button onClick={() => setModal(null)} className="p-1 hover:bg-green-100 rounded-lg"><X className="w-5 h-5 text-green-500" /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="px-6 py-5 space-y-4 max-h-[72vh] overflow-y-auto">
                {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-green-700 mb-1.5">Name *</label>
                    <input name="name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1.5">Contact Person</label>
                    <input value={form.contact_person} onChange={(e) => setForm(f => ({ ...f, contact_person: e.target.value }))} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1.5">Phone</label>
                    <input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1.5">Email</label>
                    <input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1.5">GSTIN</label>
                    <input value={form.gstin} onChange={(e) => setForm(f => ({ ...f, gstin: e.target.value }))} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-green-700 mb-1.5">Address</label>
                    <textarea value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} rows={2} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50 resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1.5">PAN</label>
                    <input value={form.pan} onChange={(e) => setForm(f => ({ ...f, pan: e.target.value }))} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1.5">Payment Terms</label>
                    <input value={form.payment_terms} onChange={(e) => setForm(f => ({ ...f, payment_terms: e.target.value }))} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50" />
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
                  {saving ? 'Saving...' : modal === 'add' ? 'Add Supplier' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
