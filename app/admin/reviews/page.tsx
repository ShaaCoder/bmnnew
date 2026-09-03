'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, type ProductReview, type Product } from '@/lib/supabase';
import { Star, MessageSquare, Eye, Trash2, Loader as Loader2, X, Check, Ban, Pencil, Reply, Search } from 'lucide-react';

type ReviewWithProduct = ProductReview & { products?: { name: string; slug: string } | null };

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const statusOptions = ['pending', 'approved', 'rejected'] as const;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<ReviewWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState<ReviewWithProduct | null>(null);
  const [replying, setReplying] = useState<ReviewWithProduct | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('product_reviews')
      .select('*, products(name, slug)')
      .order('created_at', { ascending: false });
    setReviews((data as ReviewWithProduct[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id: string, status: string) => {
    await supabase.from('product_reviews').update({ status }).eq('id', id);
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status: status as ProductReview['status'] } : r));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review? This cannot be undone.')) return;
    setDeletingId(id);
    await supabase.from('product_reviews').delete().eq('id', id);
    setDeletingId(null);
    setReviews(prev => prev.filter(r => r.id !== id));
  };

  const filtered = reviews.filter((r) => {
    const matchesFilter = filter === 'all' || r.status === filter;
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      r.reviewer_name.toLowerCase().includes(q) ||
      (r.title || '').toLowerCase().includes(q) ||
      (r.body || '').toLowerCase().includes(q) ||
      (r.products?.name || '').toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const pendingCount = reviews.filter(r => r.status === 'pending').length;

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-green-900">Reviews &amp; Ratings</h1>
          <p className="text-green-600 text-sm mt-1">
            Moderate customer reviews{pendingCount > 0 && <span className="text-amber-600 font-medium"> · {pendingCount} pending</span>}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-green-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by reviewer, product, or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-green-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2.5 text-sm border border-green-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          <option value="all">All Status</option>
          {statusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-green-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-green-100">
          <MessageSquare className="w-10 h-10 text-green-300 mx-auto mb-3" />
          <p className="text-green-600">No reviews found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl border border-green-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                    {review.reviewer_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-green-900 text-sm">{review.reviewer_name}</p>
                    <p className="text-xs text-green-400">{formatDate(review.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StarRow rating={review.rating} />
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[review.status]}`}>
                    {review.status}
                  </span>
                </div>
              </div>

              {review.products && (
                <p className="text-xs text-green-500 mb-2">Product: <span className="font-medium text-green-700">{review.products.name}</span></p>
              )}

              {review.title && <p className="font-medium text-green-800 text-sm mb-1">{review.title}</p>}
              {review.body && <p className="text-sm text-green-600/80 leading-relaxed mb-3">{review.body}</p>}

              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {review.images.map((img, i) => (
                    <div key={i} className="w-14 h-14 rounded-lg overflow-hidden border border-green-100 shrink-0">
                      <img src={img} alt={`Review photo ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {review.admin_reply && (
                <div className="mt-3 bg-green-50 rounded-xl p-3 border border-green-100">
                  <p className="text-xs font-medium text-green-700 mb-1">Admin Reply</p>
                  <p className="text-sm text-green-600">{review.admin_reply}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-green-50">
                {review.status !== 'approved' && (
                  <button
                    onClick={() => handleStatusChange(review.id, 'approved')}
                    className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                )}
                {review.status !== 'rejected' && (
                  <button
                    onClick={() => handleStatusChange(review.id, 'rejected')}
                    className="flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Ban className="w-3.5 h-3.5" /> Reject
                  </button>
                )}
                <button
                  onClick={() => setEditing(review)}
                  className="flex items-center gap-1.5 text-xs font-medium text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => setReplying(review)}
                  className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Reply className="w-3.5 h-3.5" /> Reply
                </button>
                <button
                  onClick={() => handleDelete(review.id)}
                  disabled={deletingId === review.id}
                  className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors ml-auto disabled:opacity-50"
                >
                  {deletingId === review.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <EditReviewModal review={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}

      {/* Reply modal */}
      {replying && (
        <ReplyModal review={replying} onClose={() => setReplying(null)} onSaved={() => { setReplying(null); load(); }} />
      )}
    </div>
  );
}

function EditReviewModal({ review, onClose, onSaved }: { review: ReviewWithProduct; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(review.reviewer_name);
  const [rating, setRating] = useState(review.rating);
  const [title, setTitle] = useState(review.title || '');
  const [body, setBody] = useState(review.body || '');
  const [status, setStatus] = useState(review.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const { error: updateError } = await supabase.from('product_reviews').update({
      reviewer_name: name.trim(),
      rating,
      title: title.trim() || null,
      body: body.trim() || null,
      status,
    }).eq('id', review.id);
    setSaving(false);
    if (updateError) { setError(updateError.message); return; }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-green-100">
          <h3 className="font-display text-xl font-bold text-green-900">Edit Review</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-green-100 rounded-lg"><X className="w-5 h-5 text-green-500" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-green-700 mb-1.5">Reviewer Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-green-700 mb-2">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" onClick={() => setRating(s)}>
                  <Star className={`w-6 h-6 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-green-700 mb-1.5">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-green-700 mb-1.5">Body</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-green-700 mb-1.5">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50">
              {statusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-green-100 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-green-200 text-green-700 rounded-xl text-sm font-medium hover:bg-green-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 bg-green-800 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function ReplyModal({ review, onClose, onSaved }: { review: ReviewWithProduct; onClose: () => void; onSaved: () => void }) {
  const [reply, setReply] = useState(review.admin_reply || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const { error: updateError } = await supabase.from('product_reviews').update({
      admin_reply: reply.trim() || null,
    }).eq('id', review.id);
    setSaving(false);
    if (updateError) { setError(updateError.message); return; }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-green-100">
          <h3 className="font-display text-xl font-bold text-green-900">Reply to Review</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-green-100 rounded-lg"><X className="w-5 h-5 text-green-500" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <StarRow rating={review.rating} />
              <span className="text-xs text-green-500">{review.reviewer_name}</span>
            </div>
            {review.title && <p className="font-medium text-green-800 text-sm mb-1">{review.title}</p>}
            {review.body && <p className="text-sm text-green-600/80">{review.body}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-green-700 mb-1.5">Your Reply</label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={4}
              className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50 resize-none"
              placeholder="Thank the customer, address concerns, etc."
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-green-100 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-green-200 text-green-700 rounded-xl text-sm font-medium hover:bg-green-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 bg-green-800 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Reply className="w-4 h-4" />} Save Reply
          </button>
        </div>
      </div>
    </div>
  );
}
