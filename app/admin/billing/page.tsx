'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, type Invoice } from '@/lib/supabase';
import {
  FileText,
  Plus,
  Eye,
  Trash2,
  Loader as Loader2,
  Search,
  Hash,
} from 'lucide-react';

import InvoiceFormModal from '@/components/admin/InvoiceFormModal';
import InvoiceViewModal from '@/components/admin/InvoiceViewModal';
import HsnCodeManagerModal from '@/components/admin/HsnCodeManagerModal';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const statusOptions = ['draft', 'sent', 'paid', 'cancelled'] as const;

const fmt = (n: number) =>
  n.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function AdminBilling() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [viewing, setViewing] = useState<Invoice | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // HSN Master modal
  const [showHsnManager, setShowHsnManager] = useState(false);

  // =========================================================
  // LOAD INVOICES
  // =========================================================

  const load = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load invoices:', error);
      setInvoices([]);
    } else {
      setInvoices((data as Invoice[]) || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // =========================================================
  // DELETE INVOICE
  // =========================================================

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this invoice? This cannot be undone.')) {
      return;
    }

    setDeletingId(id);

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete invoice:', error);
      alert(`Failed to delete invoice: ${error.message}`);
      setDeletingId(null);
      return;
    }

    setDeletingId(null);

    setInvoices((prev) =>
      prev.filter((invoice) => invoice.id !== id)
    );
  };

  // =========================================================
  // STATUS CHANGE
  // =========================================================

  const handleStatusChange = async (
    id: string,
    status: string
  ) => {
    const { error } = await supabase
      .from('invoices')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Failed to update invoice status:', error);
      alert(`Failed to update status: ${error.message}`);
      return;
    }

    setInvoices((prev) =>
      prev.map((invoice) =>
        invoice.id === id
          ? {
              ...invoice,
              status: status as Invoice['status'],
            }
          : invoice
      )
    );
  };

  // =========================================================
  // FILTER INVOICES
  // =========================================================

  const filtered = invoices.filter((inv) => {
    const matchesFilter =
      filter === 'all' || inv.status === filter;

    const q = search.trim().toLowerCase();

    const matchesSearch =
      !q ||
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.customer_name?.toLowerCase().includes(q) ||
      inv.customer_email?.toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  // =========================================================
  // SUMMARY
  // =========================================================

  const totalSubtotal = filtered.reduce(
    (sum, invoice) => sum + Number(invoice.subtotal || 0),
    0
  );

  const totalGst = filtered.reduce(
    (sum, invoice) => sum + Number(invoice.gst_total || 0),
    0
  );

  const totalGrand = filtered.reduce(
    (sum, invoice) => sum + Number(invoice.grand_total || 0),
    0
  );

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="p-6 md:p-8">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">

        <div>
          <h1 className="font-display text-3xl font-bold text-green-900">
            Billing & Invoices
          </h1>

          <p className="text-green-600 text-sm mt-1">
            Manage GST bills, invoices and HSN codes
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">

          {/* HSN MASTER BUTTON */}
          <button
            type="button"
            onClick={() => setShowHsnManager(true)}
            className="flex items-center justify-center gap-2 bg-white text-green-800 border border-green-200 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-green-50 transition-colors shadow-sm"
          >
            <Hash className="w-4 h-4" />
            HSN Codes
          </button>

          {/* CREATE INVOICE */}
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex items-center justify-center gap-2 bg-green-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>

        </div>
      </div>

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

        {/* BASE */}
        <div className="bg-white rounded-2xl border border-green-100 p-5">
          <p className="text-xs text-green-600 font-medium uppercase tracking-wide">
            Base Total
          </p>

          <p className="text-2xl font-bold text-green-900 mt-1">
            &#8377;{fmt(totalSubtotal)}
          </p>
        </div>

        {/* GST */}
        <div className="bg-white rounded-2xl border border-green-100 p-5">
          <p className="text-xs text-green-600 font-medium uppercase tracking-wide">
            GST Collected
          </p>

          <p className="text-2xl font-bold text-green-700 mt-1">
            &#8377;{fmt(totalGst)}
          </p>
        </div>

        {/* GRAND TOTAL */}
        <div className="bg-white rounded-2xl border border-green-100 p-5">
          <p className="text-xs text-green-600 font-medium uppercase tracking-wide">
            Grand Total
          </p>

          <p className="text-2xl font-bold text-green-900 mt-1">
            &#8377;{fmt(totalGrand)}
          </p>
        </div>

      </div>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">

        {/* SEARCH */}
        <div className="relative flex-1">

          <Search className="w-4 h-4 text-green-400 absolute left-3 top-1/2 -translate-y-1/2" />

          <input
            type="text"
            placeholder="Search by invoice number, customer name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-green-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
          />

        </div>

        {/* STATUS FILTER */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2.5 text-sm border border-green-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          <option value="all">
            All Status
          </option>

          {statusOptions.map((status) => (
            <option
              key={status}
              value={status}
            >
              {status.charAt(0).toUpperCase() +
                status.slice(1)}
            </option>
          ))}
        </select>

      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      {loading ? (

        <div className="space-y-3">

          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 bg-green-100 rounded-2xl animate-pulse"
            />
          ))}

        </div>

      ) : filtered.length === 0 ? (

        <div className="text-center py-20 bg-white rounded-2xl border border-green-100">

          <FileText className="w-10 h-10 text-green-300 mx-auto mb-3" />

          <p className="text-green-600">
            No invoices found. Create one to get started.
          </p>

        </div>

      ) : (

        <div className="bg-white rounded-2xl border border-green-100 overflow-hidden overflow-x-auto">

          <table className="w-full text-sm min-w-[800px]">

            <thead>

              <tr className="bg-green-50 border-b border-green-100">

                <th className="text-left px-6 py-4 text-xs font-medium text-green-600 uppercase tracking-wide">
                  Invoice #
                </th>

                <th className="text-left px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide">
                  Customer
                </th>

                <th className="text-left px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide hidden md:table-cell">
                  Date
                </th>

                <th className="text-right px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide">
                  Base
                </th>

                <th className="text-right px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide hidden lg:table-cell">
                  GST
                </th>

                <th className="text-right px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide">
                  Total
                </th>

                <th className="text-left px-4 py-4 text-xs font-medium text-green-600 uppercase tracking-wide">
                  Status
                </th>

                <th className="px-4 py-4" />

              </tr>

            </thead>

            <tbody className="divide-y divide-green-50">

              {filtered.map((inv) => (

                <tr
                  key={inv.id}
                  className="hover:bg-green-50/50 transition-colors"
                >

                  {/* INVOICE NUMBER */}
                  <td className="px-6 py-4">

                    <p className="font-medium text-green-900">
                      {inv.invoice_number}
                    </p>

                    {inv.invoice_items && (
                      <p className="text-xs text-green-400">
                        {inv.invoice_items.length}{' '}
                        item
                        {inv.invoice_items.length !== 1
                          ? 's'
                          : ''}
                      </p>
                    )}

                  </td>

                  {/* CUSTOMER */}
                  <td className="px-4 py-4">

                    <p className="font-medium text-green-800">
                      {inv.customer_name}
                    </p>

                    <p className="text-xs text-green-400">
                      {inv.customer_email || '—'}
                    </p>

                  </td>

                  {/* DATE */}
                  <td className="px-4 py-4 text-xs text-green-500 hidden md:table-cell">

                    {new Date(
                      inv.invoice_date
                    ).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}

                  </td>

                  {/* BASE */}
                  <td className="px-4 py-4 text-right text-green-700">
                    &#8377;
                    {fmt(Number(inv.subtotal || 0))}
                  </td>

                  {/* GST */}
                  <td className="px-4 py-4 text-right text-green-600 hidden lg:table-cell">
                    &#8377;
                    {fmt(Number(inv.gst_total || 0))}
                  </td>

                  {/* TOTAL */}
                  <td className="px-4 py-4 text-right font-bold text-green-900">
                    &#8377;
                    {fmt(Number(inv.grand_total || 0))}
                  </td>

                  {/* STATUS */}
                  <td className="px-4 py-4">

                    <select
                      value={inv.status}
                      onChange={(e) =>
                        handleStatusChange(
                          inv.id,
                          e.target.value
                        )
                      }
                      className={`text-xs font-medium px-2.5 py-1.5 rounded-full appearance-none cursor-pointer border-0 focus:outline-none focus:ring-2 focus:ring-green-400 ${
                        statusColors[inv.status] ||
                        statusColors.draft
                      }`}
                    >

                      {statusOptions.map((status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {status.charAt(0).toUpperCase() +
                            status.slice(1)}
                        </option>
                      ))}

                    </select>

                  </td>

                  {/* ACTIONS */}
                  <td className="px-4 py-4">

                    <div className="flex items-center gap-1 justify-end">

                      {/* VIEW */}
                      <button
                        type="button"
                        onClick={() => setViewing(inv)}
                        title="View Invoice"
                        className="p-1.5 text-green-400 hover:text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* EDIT */}
                      <button
                        type="button"
                        onClick={() => setEditing(inv)}
                        title="Edit Invoice"
                        className="p-1.5 text-green-400 hover:text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>

                      {/* DELETE */}
                      <button
                        type="button"
                        onClick={() => handleDelete(inv.id)}
                        title="Delete Invoice"
                        disabled={deletingId === inv.id}
                        className="p-1.5 text-green-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >

                        {deletingId === inv.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* =====================================================
          CREATE INVOICE MODAL
      ===================================================== */}

      {creating && (
        <InvoiceFormModal
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            load();
          }}
        />
      )}

      {/* =====================================================
          EDIT INVOICE MODAL
      ===================================================== */}

      {editing && (
        <InvoiceFormModal
          invoice={editing}
          items={editing.invoice_items || []}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}

      {/* =====================================================
          VIEW INVOICE MODAL
      ===================================================== */}

      {viewing && (
        <InvoiceViewModal
          invoice={viewing}
          items={viewing.invoice_items || []}
          onClose={() => setViewing(null)}
        />
      )}

      {/* =====================================================
          HSN CODE MASTER MODAL
      ===================================================== */}

      {showHsnManager && (
        <HsnCodeManagerModal
          onClose={() => setShowHsnManager(false)}
        />
      )}

    </div>
  );
}