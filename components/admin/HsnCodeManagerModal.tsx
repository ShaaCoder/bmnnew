'use client';

import { useEffect, useState } from 'react';
import {
  X,
  Plus,
  Search,
  Pencil,
  Trash2,
  Save,
  Loader2,
  Hash,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type HsnCode = {
  id: string;
  code: string;
  description: string | null;
  created_at: string;
};

type Props = {
  onClose: () => void;
};

export default function HsnCodeManagerModal({ onClose }: Props) {
  const [hsnCodes, setHsnCodes] = useState<HsnCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [search, setSearch] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  const [error, setError] = useState('');

  const loadHsnCodes = async () => {
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('hsn_codes')
      .select('*')
      .order('code', { ascending: true });

    if (error) {
      setError(error.message);
      setHsnCodes([]);
    } else {
      setHsnCodes((data as HsnCode[]) || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadHsnCodes();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setCode('');
    setDescription('');
    setError('');
  };

  const validateCode = (value: string) => {
    return /^[0-9]{4}([0-9]{2})?([0-9]{2})?$/.test(value);
  };

  const handleSave = async () => {
    setError('');

    const cleanCode = code.replace(/\D/g, '');

    if (!cleanCode) {
      setError('Please enter an HSN code.');
      return;
    }

    if (!validateCode(cleanCode)) {
      setError('HSN code must contain 4, 6, or 8 digits.');
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from('hsn_codes')
          .update({
            code: cleanCode,
            description: description.trim() || null,
          })
          .eq('id', editingId);

        if (error) {
          if (error.code === '23505') {
            throw new Error('This HSN code already exists.');
          }

          throw new Error(error.message);
        }
      } else {
        const { error } = await supabase
          .from('hsn_codes')
          .insert({
            code: cleanCode,
            description: description.trim() || null,
          });

        if (error) {
          if (error.code === '23505') {
            throw new Error('This HSN code already exists.');
          }

          throw new Error(error.message);
        }
      }

      resetForm();
      await loadHsnCodes();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while saving.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (hsn: HsnCode) => {
    setEditingId(hsn.id);
    setCode(hsn.code);
    setDescription(hsn.description || '');
    setError('');
  };

  const handleDelete = async (id: string) => {
    const hsn = hsnCodes.find((item) => item.id === id);

    if (!hsn) return;

    const confirmed = window.confirm(
      `Delete HSN code ${hsn.code}?\n\nThis will remove it from the HSN master list. Existing invoices will keep their saved HSN/SAC value.`
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError('');

    const { error } = await supabase
      .from('hsn_codes')
      .delete()
      .eq('id', id);

    if (error) {
      setError(error.message);
    } else {
      setHsnCodes((prev) => prev.filter((item) => item.id !== id));

      if (editingId === id) {
        resetForm();
      }
    }

    setDeletingId(null);
  };

  const filtered = hsnCodes.filter((item) => {
    const q = search.toLowerCase().trim();

    if (!q) return true;

    return (
      item.code.toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-green-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center">
              <Hash className="w-5 h-5 text-green-700" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-green-900">
                HSN Code Master
              </h2>

              <p className="text-sm text-green-500">
                Save and manage reusable HSN / SAC codes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-green-500 hover:bg-green-50 hover:text-green-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Add/Edit Form */}
          <div className="bg-green-50 rounded-2xl border border-green-100 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-green-900">
                  {editingId ? 'Edit HSN Code' : 'Add HSN Code'}
                </h3>

                <p className="text-xs text-green-500 mt-1">
                  HSN code can contain 4, 6, or 8 digits.
                </p>
              </div>

              {editingId && (
                <button
                  onClick={resetForm}
                  className="text-xs font-medium text-green-600 hover:text-green-900"
                >
                  Cancel edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_auto] gap-3">
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1.5">
                  HSN / SAC Code *
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  placeholder="e.g. 6109"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, ''))
                  }
                  className="w-full px-3 py-2.5 bg-white border border-green-200 rounded-xl text-sm text-green-900 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-green-700 mb-1.5">
                  Description
                </label>

                <input
                  type="text"
                  placeholder="e.g. T-shirts, garments"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-green-200 rounded-xl text-sm text-green-900 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-green-800 hover:bg-green-700 text-white rounded-xl text-sm font-medium disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingId ? (
                    <Save className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}

                  {editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />

            <input
              type="text"
              placeholder="Search HSN code or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-green-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          {/* Count */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-green-800">
              Saved HSN Codes
            </p>

            <p className="text-xs text-green-500">
              {filtered.length} code{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Table */}
          <div className="border border-green-100 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-10 text-center">
                <Loader2 className="w-6 h-6 text-green-600 animate-spin mx-auto" />
                <p className="text-sm text-green-500 mt-2">
                  Loading HSN codes...
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center">
                <Hash className="w-8 h-8 text-green-200 mx-auto mb-2" />

                <p className="text-sm font-medium text-green-800">
                  {search ? 'No matching HSN codes' : 'No HSN codes saved'}
                </p>

                <p className="text-xs text-green-500 mt-1">
                  Add your first HSN code above.
                </p>
              </div>
            ) : (
              <div className="max-h-[350px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-green-50 border-b border-green-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-green-600 uppercase">
                        HSN / SAC
                      </th>

                      <th className="text-left px-4 py-3 text-xs font-semibold text-green-600 uppercase">
                        Description
                      </th>

                      <th className="text-right px-4 py-3 text-xs font-semibold text-green-600 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-green-50">
                    {filtered.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-green-50/50"
                      >
                        <td className="px-4 py-3">
                          <span className="font-semibold text-green-900">
                            {item.code}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-green-600">
                          {item.description || (
                            <span className="text-green-300">
                              No description
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleEdit(item)}
                              title="Edit"
                              className="p-2 rounded-lg text-green-500 hover:text-green-800 hover:bg-green-100"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={deletingId === item.id}
                              title="Delete"
                              className="p-2 rounded-lg text-green-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              {deletingId === item.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-green-100 bg-green-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-green-200 bg-white text-green-800 text-sm font-medium hover:bg-green-50"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}