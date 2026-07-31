'use client';

import { useEffect, useState } from 'react';
import { supabase, type Category } from '@/lib/supabase';
import { Plus, Pencil, Trash2, Loader as Loader2, X, Grid3x3 as Grid3X3 } from 'lucide-react';

type Form = { name: string; slug: string; description: string; image_url: string };
const emptyForm: Form = { name: '', slug: '', description: '', image_url: '' };

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditing(null); setModal('add'); setError(''); };
  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, description: c.description || '', image_url: c.image_url || '' });
    setModal('edit'); setError('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value, ...(name === 'name' && modal === 'add' ? { slug: slugify(value) } : {}) }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug) { setError('Name and slug are required.'); return; }
    setSaving(true);
    const payload = { name: form.name.trim(), slug: form.slug.trim(), description: form.description.trim() || null, image_url: form.image_url.trim() || null };
    const { error: e2 } = editing ? await supabase.from('categories').update(payload).eq('id', editing.id) : await supabase.from('categories').insert(payload);
    setSaving(false);
    if (e2) { setError(e2.message); return; }
    setModal(null); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? Products in this category will become uncategorized.')) return;
    setDeletingId(id);
    await supabase.from('categories').delete().eq('id', id);
    setDeletingId(null); load();
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-green-900">Categories</h1>
          <p className="text-green-600 text-sm mt-1">Organize your products with categories</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-green-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-green-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-green-100">
          <Grid3X3 className="w-10 h-10 text-green-300 mx-auto mb-3" />
          <p className="text-green-600">No categories yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-2xl border border-green-100 overflow-hidden hover:border-green-300 hover:shadow-md transition-all duration-200">
              {cat.image_url && (
                <div className="h-32 overflow-hidden">
                  <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-green-900">{cat.name}</h3>
                    <p className="text-xs text-green-400 font-mono mt-0.5">{cat.slug}</p>
                    {cat.description && <p className="text-xs text-green-600 mt-1.5 line-clamp-2">{cat.description}</p>}
                  </div>
                  <div className="flex gap-1 ml-2 shrink-0">
                    <button onClick={() => openEdit(cat)} className="p-1.5 text-green-400 hover:text-green-700 hover:bg-green-100 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(cat.id)} disabled={deletingId === cat.id} className="p-1.5 text-green-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                      {deletingId === cat.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-green-100">
              <h3 className="font-display text-xl font-bold text-green-900">{modal === 'add' ? 'Add Category' : 'Edit Category'}</h3>
              <button onClick={() => setModal(null)} className="p-1 hover:bg-green-100 rounded-lg"><X className="w-5 h-5 text-green-500" /></button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1.5">Name *</label>
                <input name="name" value={form.name} onChange={handleChange} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1.5">Slug *</label>
                <input name="slug" value={form.slug} onChange={handleChange} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50 font-mono" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1.5">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={2} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1.5">Image URL</label>
                <input name="image_url" value={form.image_url} onChange={handleChange} placeholder="https://..." className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50" />
              </div>
            </form>
            <div className="px-6 py-4 border-t border-green-100 flex gap-3">
              <button type="button" onClick={() => setModal(null)} className="flex-1 px-4 py-2.5 border border-green-200 text-green-700 rounded-xl text-sm font-medium hover:bg-green-50 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 bg-green-800 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? 'Saving...' : modal === 'add' ? 'Add Category' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
