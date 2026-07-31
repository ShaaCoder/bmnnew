'use client';

import { useEffect, useState } from 'react';
import { supabase, type GalleryItem } from '@/lib/supabase';
import { Plus, Trash2, Loader as Loader2, X, Image as ImageIcon, Pencil } from 'lucide-react';
import ImageUploader from '@/components/admin/ImageUploader';

type Form = { title: string; description: string; display_order: string };
const emptyForm: Form = { title: '', description: '', display_order: '0' };

export default function AdminGallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [imageUrl, setImageUrl] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from('gallery').select('*').order('display_order');
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ ...emptyForm, display_order: String(items.length + 1) }); setImageUrl([]); setEditing(null); setModal('add'); setError(''); };
  const openEdit = (item: GalleryItem) => {
    setEditing(item);
    setForm({ title: item.title, description: item.description || '', display_order: String(item.display_order) });
    setImageUrl(item.image_url ? [item.image_url] : []);
    setModal('edit'); setError('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) { setError('Title is required.'); return; }
    if (imageUrl.length === 0) { setError('Please upload an image.'); return; }
    setSaving(true);
    const payload = { title: form.title.trim(), image_url: imageUrl[0], description: form.description.trim() || null, display_order: parseInt(form.display_order) || 0 };
    const { error: e2 } = editing ? await supabase.from('gallery').update(payload).eq('id', editing.id) : await supabase.from('gallery').insert(payload);
    setSaving(false);
    if (e2) { setError(e2.message); return; }
    setModal(null); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this gallery item?')) return;
    setDeletingId(id);
    await supabase.from('gallery').delete().eq('id', id);
    setDeletingId(null); load();
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-green-900">Gallery</h1>
          <p className="text-green-600 text-sm mt-1">Manage your visual gallery</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-green-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">
          <Plus className="w-4 h-4" /> Add Image
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="aspect-square bg-green-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-green-100">
          <ImageIcon className="w-10 h-10 text-green-300 mx-auto mb-3" />
          <p className="text-green-600">Gallery is empty. Add your first image.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="group relative overflow-hidden rounded-2xl bg-green-100 aspect-square">
              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-green-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-sm font-medium line-clamp-1">{item.title}</p>
                  <p className="text-green-300 text-xs mt-0.5">Order: {item.display_order}</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => openEdit(item)} className="flex-1 py-1.5 bg-white/20 backdrop-blur text-white text-xs rounded-lg hover:bg-white/30 transition-colors flex items-center justify-center gap-1"><Pencil className="w-3 h-3" /> Edit</button>
                    <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id} className="flex-1 py-1.5 bg-red-500/70 backdrop-blur text-white text-xs rounded-lg hover:bg-red-500 transition-colors flex items-center justify-center gap-1 disabled:opacity-50">
                      {deletingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Delete
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
              <h3 className="font-display text-xl font-bold text-green-900">{modal === 'add' ? 'Add Gallery Image' : 'Edit Gallery Image'}</h3>
              <button onClick={() => setModal(null)} className="p-1 hover:bg-green-100 rounded-lg"><X className="w-5 h-5 text-green-500" /></button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[72vh] overflow-y-auto">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
              <ImageUploader value={imageUrl} onChange={setImageUrl} folder="gallery" max={1} label="Gallery Image *" />
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1.5">Title *</label>
                <input name="title" value={form.title} onChange={handleChange} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1.5">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={2} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1.5">Display Order</label>
                <input name="display_order" type="number" value={form.display_order} onChange={handleChange} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-green-100 flex gap-3">
              <button type="button" onClick={() => setModal(null)} className="flex-1 px-4 py-2.5 border border-green-200 text-green-700 rounded-xl text-sm font-medium hover:bg-green-50 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 bg-green-800 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? 'Saving...' : 'Save Image'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
