'use client';

import { useEffect, useState } from 'react';
import { supabase, type Product, type Category } from '@/lib/supabase';
import { Plus, Pencil, Trash2, Loader as Loader2, X, Star, Package } from 'lucide-react';
import ImageUploader from '@/components/admin/ImageUploader';

type Form = {
  name: string; slug: string; category_id: string; description: string;
  price: string; gst_percentage: string; stock: string; featured: boolean;
};

const emptyForm: Form = { name: '', slug: '', category_id: '', description: '', price: '', gst_percentage: '18', stock: '0', featured: false };

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function AdminProducts() {
  const [products, setProducts] = useState<(Product & { categories?: Category })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('products').select('*, categories(*)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
    ]);
    setProducts((p as any) || []);
    setCategories(c || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setImageUrls([]); setEditing(null); setModal('add'); setError(''); };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, slug: p.slug, category_id: p.category_id || '', description: p.description || '', price: String(p.price), gst_percentage: String(p.gst_percentage ?? 18), stock: String(p.stock), featured: p.featured });
    setImageUrls(p.images || []);
    setModal('edit'); setError('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value, ...(name === 'name' && modal === 'add' ? { slug: slugify(value) } : {}) }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug || !form.price) { setError('Name, slug, and price are required.'); return; }
    setSaving(true);
    const payload = { name: form.name.trim(), slug: form.slug.trim(), category_id: form.category_id || null, description: form.description.trim() || null, price: parseFloat(form.price), gst_percentage: parseFloat(form.gst_percentage) || 0, images: imageUrls, stock: parseInt(form.stock) || 0, featured: form.featured };
    const { error: e2 } = editing ? await supabase.from('products').update(payload).eq('id', editing.id) : await supabase.from('products').insert(payload);
    setSaving(false);
    if (e2) { setError(e2.message); return; }
    setModal(null); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    setDeletingId(id);
    await supabase.from('products').delete().eq('id', id);
    setDeletingId(null); load();
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-green-900">Products</h1>
          <p className="text-green-600 text-sm mt-1">Manage your product catalog</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-green-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-green-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-green-100">
          <Package className="w-10 h-10 text-green-300 mx-auto mb-3" />
          <p className="text-green-600">No products yet. Add your first product.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-green-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-green-50 border-b border-green-100">
                <th className="text-left px-6 py-4 text-xs font-medium text-green-600 uppercase tracking-wide">Product</th>
                <th className="text-left px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide">Price</th>
                <th className="text-left px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide hidden lg:table-cell">GST (%)</th>
                <th className="text-left px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide hidden md:table-cell">Final Price</th>
                <th className="text-left px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide hidden sm:table-cell">Stock</th>
                <th className="px-4 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-green-50">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-green-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-green-100 shrink-0">
                        {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-green-300 m-auto mt-2.5" />}
                      </div>
                      <div>
                        <p className="font-medium text-green-800 flex items-center gap-1.5">
                          {p.name}
                          {p.featured && <Star className="w-3 h-3 text-green-500 fill-green-500" />}
                        </p>
                        <p className="text-xs text-green-400">{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="text-green-600 text-xs">{(p as any).categories?.name || '—'}</span>
                  </td>
                  <td className="px-4 py-4 font-medium text-green-800">&#8377;{p.price.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-4 hidden lg:table-cell text-green-600">{p.gst_percentage ?? 18}%</td>
                  <td className="px-4 py-4 hidden md:table-cell font-medium text-green-900">&#8377;{(p.price * (1 + (p.gst_percentage ?? 18) / 100)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <span className={`text-xs px-2 py-1 rounded-full ${p.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-green-400 hover:text-green-700 hover:bg-green-100 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id} className="p-1.5 text-green-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                        {deletingId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-green-100">
              <h3 className="font-display text-xl font-bold text-green-900">{modal === 'add' ? 'Add Product' : 'Edit Product'}</h3>
              <button onClick={() => setModal(null)} className="p-1 hover:bg-green-100 rounded-lg"><X className="w-5 h-5 text-green-500" /></button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[72vh] overflow-y-auto">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-green-700 mb-1.5">Name *</label>
                  <input name="name" value={form.name} onChange={handleChange} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-green-700 mb-1.5">Slug *</label>
                  <input name="slug" value={form.slug} onChange={handleChange} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50 font-mono" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-green-700 mb-1.5">Category</label>
                  <select name="category_id" value={form.category_id} onChange={handleChange} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50">
                    <option value="">None</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-green-700 mb-1.5">Price (&#8377;) *</label>
                  <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-green-700 mb-1.5">GST (%)</label>
                  <input name="gst_percentage" type="number" min="0" max="100" step="0.01" value={form.gst_percentage} onChange={handleChange} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-green-700 mb-1.5">Stock</label>
                  <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-green-700 mb-1.5">Description</label>
                  <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50 resize-none" />
                </div>
                <div className="col-span-2">
                  <ImageUploader value={imageUrls} onChange={setImageUrls} folder="products" label="Product Images" />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input name="featured" type="checkbox" checked={form.featured} onChange={handleChange} id="featured" className="w-4 h-4 accent-green-600" />
                  <label htmlFor="featured" className="text-sm text-green-700">Mark as Featured</label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-green-100 flex gap-3">
              <button type="button" onClick={() => setModal(null)} className="flex-1 px-4 py-2.5 border border-green-200 text-green-700 rounded-xl text-sm font-medium hover:bg-green-50 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 bg-green-800 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? 'Saving...' : modal === 'add' ? 'Add Product' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
