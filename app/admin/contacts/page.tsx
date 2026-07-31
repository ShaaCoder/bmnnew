'use client';

import { useEffect, useState } from 'react';
import { supabase, type ContactQuery } from '@/lib/supabase';
import { MessageSquare, Eye, X, Trash2, Loader as Loader2, ChevronDown } from 'lucide-react';

const statusColors: Record<string, string> = {
  new: 'bg-yellow-100 text-yellow-700',
  read: 'bg-blue-100 text-blue-700',
  replied: 'bg-green-100 text-green-700',
};

const statusOptions = ['new', 'read', 'replied'];

export default function AdminContacts() {
  const [queries, setQueries] = useState<ContactQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<ContactQuery | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    const { data } = await supabase.from('contact_queries').select('*').order('created_at', { ascending: false });
    setQueries(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    await supabase.from('contact_queries').update({ status }).eq('id', id);
    setUpdatingId(null);
    setQueries((prev) => prev.map((q) => q.id === id ? { ...q, status: status as ContactQuery['status'] } : q));
    if (viewing?.id === id) setViewing((v) => v ? { ...v, status: status as ContactQuery['status'] } : v);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this query?')) return;
    setDeletingId(id);
    await supabase.from('contact_queries').delete().eq('id', id);
    setDeletingId(null);
    setQueries((prev) => prev.filter((q) => q.id !== id));
    if (viewing?.id === id) setViewing(null);
  };

  const handleView = (q: ContactQuery) => {
    setViewing(q);
    if (q.status === 'new') updateStatus(q.id, 'read');
  };

  const filtered = filter === 'all' ? queries : queries.filter((q) => q.status === filter);

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-green-900">Contact Queries</h1>
          <p className="text-green-600 text-sm mt-1">Manage customer messages and enquiries</p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 text-sm border border-green-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-400">
          <option value="all">All Queries</option>
          {statusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-green-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-green-100">
          <MessageSquare className="w-10 h-10 text-green-300 mx-auto mb-3" />
          <p className="text-green-600">No queries {filter !== 'all' ? `with status "${filter}"` : 'yet'}.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-green-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-green-50 border-b border-green-100">
                <th className="text-left px-6 py-4 text-xs font-medium text-green-600 uppercase tracking-wide">From</th>
                <th className="text-left px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide hidden md:table-cell">Subject</th>
                <th className="text-left px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide hidden sm:table-cell">Date</th>
                <th className="px-4 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-green-50">
              {filtered.map((query) => (
                <tr key={query.id} className={`hover:bg-green-50/50 transition-colors ${query.status === 'new' ? 'bg-green-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    <p className="font-medium text-green-800 flex items-center gap-1.5">
                      {query.status === 'new' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full shrink-0" />}
                      {query.name}
                    </p>
                    <p className="text-xs text-green-400">{query.email}</p>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <p className="text-green-700 text-sm line-clamp-1">{query.subject || '(No subject)'}</p>
                    <p className="text-xs text-green-400 line-clamp-1 mt-0.5">{query.message}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="relative">
                      <select value={query.status} onChange={(e) => updateStatus(query.id, e.target.value)} disabled={updatingId === query.id} className={`text-xs font-medium px-2.5 py-1.5 rounded-full appearance-none pr-6 cursor-pointer border-0 focus:outline-none focus:ring-2 focus:ring-green-400 ${statusColors[query.status]}`}>
                        {statusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                      {updatingId === query.id ? <Loader2 className="w-3 h-3 animate-spin absolute right-2 top-1/2 -translate-y-1/2" /> : <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs text-green-500 hidden sm:table-cell">
                    {new Date(query.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => handleView(query)} className="p-1.5 text-green-400 hover:text-green-700 hover:bg-green-100 rounded-lg transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(query.id)} disabled={deletingId === query.id} className="p-1.5 text-green-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                        {deletingId === query.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-green-100">
              <h3 className="font-display text-xl font-bold text-green-900">Query Details</h3>
              <button onClick={() => setViewing(null)} className="p-1 hover:bg-green-100 rounded-lg"><X className="w-5 h-5 text-green-500" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {[
                { label: 'Name', value: viewing.name },
                { label: 'Email', value: viewing.email },
                { label: 'Phone', value: viewing.phone || '—' },
                { label: 'Subject', value: viewing.subject || '—' },
                { label: 'Date', value: new Date(viewing.created_at).toLocaleString('en-IN') },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-3">
                  <span className="text-xs font-medium text-green-500 w-16 shrink-0 mt-0.5">{label}</span>
                  <span className="text-sm text-green-800 flex-1">{value}</span>
                </div>
              ))}
              <div>
                <p className="text-xs font-medium text-green-500 mb-2">Message</p>
                <div className="bg-green-50 rounded-xl p-4 text-sm text-green-700 leading-relaxed border border-green-100">{viewing.message}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-green-500 w-16 shrink-0">Status</span>
                <select value={viewing.status} onChange={(e) => updateStatus(viewing.id, e.target.value)} className="text-sm border border-green-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50">
                  {statusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-green-100 flex gap-3">
              <button onClick={() => handleDelete(viewing.id)} className="px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete</button>
              <button onClick={() => setViewing(null)} className="flex-1 px-4 py-2.5 bg-green-800 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
