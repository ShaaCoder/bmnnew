
'use client';

import { useEffect, useState } from 'react';
import { supabase, type Category } from '@/lib/supabase';
import {
  Plus,
  Pencil,
  Trash2,
  Loader as Loader2,
  X,
  Grid3x3 as Grid3X3,
} from 'lucide-react';

import ImageUploader from '@/components/admin/ImageUploader';

/* =========================================================
   FORM TYPE
========================================================= */

type Form = {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  hsn_code: string;
};

/* =========================================================
   EMPTY FORM
========================================================= */

const emptyForm: Form = {
  name: '',
  slug: '',
  description: '',
  image_url: '',
  hsn_code: '',
};

/* =========================================================
   SLUGIFY
========================================================= */

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/* =========================================================
   ADMIN CATEGORIES
========================================================= */

export default function AdminCategories() {
  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [modal, setModal] =
    useState<'add' | 'edit' | null>(null);

  const [editing, setEditing] =
    useState<Category | null>(null);

  const [form, setForm] =
    useState<Form>(emptyForm);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  /* =======================================================
     LOAD CATEGORIES
  ======================================================= */

  const load = async () => {
    setLoading(true);

    const {
      data,
      error: loadError,
    } = await supabase
      .from('categories')
      .select('*')
      .order('name', {
        ascending: true,
      });

    if (loadError) {
      console.error(
        'Categories load error:',
        loadError
      );

      setError(loadError.message);
    }

    setCategories(data || []);

    setLoading(false);
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    load();
  }, []);

  /* =======================================================
     OPEN ADD MODAL
  ======================================================= */

  const openAdd = () => {
    setForm({
      ...emptyForm,
    });

    setEditing(null);
    setModal('add');
    setError('');
  };

  /* =======================================================
     OPEN EDIT MODAL
  ======================================================= */

  const openEdit = (category: Category) => {
    setEditing(category);

    setForm({
      name: category.name,
      slug: category.slug,
      description:
        category.description || '',
      image_url:
        category.image_url || '',
      hsn_code:
        category.hsn_code || '',
    });

    setModal('edit');
    setError('');
  };

  /* =======================================================
     HANDLE INPUT CHANGE
  ======================================================= */

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const {
      name,
      value,
    } = e.target;

    /* -----------------------------------------------------
       HSN CODE
       Allow numbers only
       Maximum 8 digits
    ----------------------------------------------------- */

    if (name === 'hsn_code') {
      const numericValue =
        value.replace(/\D/g, '').slice(0, 8);

      setForm((current) => ({
        ...current,
        hsn_code: numericValue,
      }));

      return;
    }

    /* -----------------------------------------------------
       NORMAL INPUTS
    ----------------------------------------------------- */

    setForm((current) => ({
      ...current,

      [name]: value,

      /*
       * Automatically create slug while adding.
       */
      ...(name === 'name' &&
      modal === 'add'
        ? {
            slug: slugify(value),
          }
        : {}),
    }));
  };

  /* =======================================================
     HANDLE IMAGE CHANGE
  ======================================================= */

  const handleImageChange = (
    urls: string[]
  ) => {
    setForm((current) => ({
      ...current,

      /*
       * Category supports only ONE image.
       */
      image_url: urls[0] || '',
    }));
  };

  /* =======================================================
     SAVE CATEGORY
  ======================================================= */

  const handleSave = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError('');

    /* -------------------------------------------------------
       VALIDATION - NAME
    ------------------------------------------------------- */

    if (!form.name.trim()) {
      setError(
        'Category name is required.'
      );
      return;
    }

    /* -------------------------------------------------------
       VALIDATION - SLUG
    ------------------------------------------------------- */

    if (!form.slug.trim()) {
      setError(
        'Category slug is required.'
      );
      return;
    }

    /* -------------------------------------------------------
       VALIDATION - HSN/SAC
       
       Allowed:
       4 digits
       6 digits
       8 digits
       
       Examples:
       3402
       340220
       34022010
    ------------------------------------------------------- */

    const hsn = form.hsn_code.trim();

    if (
      hsn &&
      !/^[0-9]{4}([0-9]{2})?([0-9]{2})?$/.test(hsn)
    ) {
      setError(
        'HSN/SAC code must contain 4, 6, or 8 digits.'
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),

        slug: form.slug.trim(),

        description:
          form.description.trim() ||
          null,

        image_url:
          form.image_url.trim() ||
          null,

        /*
         * Save empty HSN as NULL.
         */
        hsn_code:
          hsn || null,
      };

      /* -----------------------------------------------------
         UPDATE
      ----------------------------------------------------- */

      if (editing) {
        const {
          error: updateError,
        } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', editing.id);

        if (updateError) {
          console.error(
            'Category update error:',
            updateError
          );

          setError(
            updateError.message
          );

          return;
        }
      }

      /* -----------------------------------------------------
         CREATE
      ----------------------------------------------------- */

      else {
        const {
          error: insertError,
        } = await supabase
          .from('categories')
          .insert(payload);

        if (insertError) {
          console.error(
            'Category insert error:',
            insertError
          );

          setError(
            insertError.message
          );

          return;
        }
      }

      /* -----------------------------------------------------
         SUCCESS
      ----------------------------------------------------- */

      setModal(null);

      setEditing(null);

      setForm({
        ...emptyForm,
      });

      await load();

    } catch (err) {
      console.error(
        'Category save error:',
        err
      );

      setError(
        'Something went wrong while saving the category.'
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     DELETE CATEGORY
  ======================================================= */

  const handleDelete = async (
    id: string
  ) => {
    const confirmed = window.confirm(
      'Delete this category? Products in this category will become uncategorized.'
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);

    setError('');

    try {
      const {
        error: deleteError,
      } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error(
          'Category delete error:',
          deleteError
        );

        setError(
          deleteError.message
        );

        return;
      }

      await load();

    } catch (err) {
      console.error(
        'Category delete error:',
        err
      );

      setError(
        'Something went wrong while deleting the category.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  const closeModal = () => {
    if (saving) {
      return;
    }

    setModal(null);

    setEditing(null);

    setForm({
      ...emptyForm,
    });

    setError('');
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="p-6 md:p-8">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex items-center justify-between mb-8">

        <div>
          <h1 className="font-display text-3xl font-bold text-green-900">
            Categories
          </h1>

          <p className="text-green-600 text-sm mt-1">
            Organize your products with categories
          </p>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-green-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
        >
          <Plus className="w-4 h-4" />

          Add Category
        </button>

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && !modal && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* =================================================
          LOADING
      ================================================= */}

      {loading ? (

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {[1, 2, 3].map(
            (item) => (
              <div
                key={item}
                className="h-32 bg-green-100 rounded-2xl animate-pulse"
              />
            )
          )}

        </div>

      ) : categories.length === 0 ? (

        /* =================================================
           EMPTY
        ================================================= */

        <div className="text-center py-20 bg-white rounded-2xl border border-green-100">

          <Grid3X3 className="w-10 h-10 text-green-300 mx-auto mb-3" />

          <p className="text-green-600">
            No categories yet.
          </p>

        </div>

      ) : (

        /* =================================================
           CATEGORY GRID
        ================================================= */

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {categories.map(
            (category) => (

              <div
                key={category.id}
                className="bg-white rounded-2xl border border-green-100 overflow-hidden hover:border-green-300 hover:shadow-md transition-all duration-200"
              >

                {/* CATEGORY IMAGE */}

                {category.image_url ? (

                  <div className="h-32 overflow-hidden bg-green-50">

                    <img
                      src={
                        category.image_url
                      }
                      alt={
                        category.name
                      }
                      className="w-full h-full object-cover"
                    />

                  </div>

                ) : (

                  <div className="h-32 bg-green-50 flex items-center justify-center">

                    <Grid3X3 className="w-10 h-10 text-green-200" />

                  </div>

                )}

                {/* CATEGORY CONTENT */}

                <div className="p-4">

                  <div className="flex items-start justify-between">

                    <div className="min-w-0 flex-1">

                      <h3 className="font-display font-semibold text-green-900">
                        {category.name}
                      </h3>

                      <p className="text-xs text-green-400 font-mono mt-0.5 truncate">
                        {category.slug}
                      </p>

                      {/* HSN CODE */}

                      <div className="mt-2">

                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 border border-green-100 text-[11px] font-medium text-green-700">
                          HSN/SAC:{' '}
                          {category.hsn_code ||
                            'Not set'}
                        </span>

                      </div>

                      {category.description && (

                        <p className="text-xs text-green-600 mt-2 line-clamp-2">
                          {
                            category.description
                          }
                        </p>

                      )}

                    </div>

                    {/* ACTIONS */}

                    <div className="flex gap-1 ml-2 shrink-0">

                      <button
                        onClick={() =>
                          openEdit(
                            category
                          )
                        }
                        className="p-1.5 text-green-400 hover:text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                        title="Edit category"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(
                            category.id
                          )
                        }
                        disabled={
                          deletingId ===
                          category.id
                        }
                        className="p-1.5 text-green-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete category"
                      >

                        {deletingId ===
                        category.id ? (

                          <Loader2 className="w-3.5 h-3.5 animate-spin" />

                        ) : (

                          <Trash2 className="w-3.5 h-3.5" />

                        )}

                      </button>

                    </div>

                  </div>

                </div>

              </div>

            )
          )}

        </div>

      )}

      {/* =================================================
          MODAL
      ================================================= */}

      {modal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">

          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="flex items-center justify-between px-6 py-5 border-b border-green-100">

              <h3 className="font-display text-xl font-bold text-green-900">

                {modal === 'add'
                  ? 'Add Category'
                  : 'Edit Category'}

              </h3>

              <button
                onClick={closeModal}
                disabled={saving}
                className="p-1 hover:bg-green-100 rounded-lg disabled:opacity-50"
              >
                <X className="w-5 h-5 text-green-500" />
              </button>

            </div>

            {/* =================================================
                FORM
            ================================================= */}

            <form
              onSubmit={handleSave}
              className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto"
            >

              {/* ERROR */}

              {error && (

                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>

              )}

              {/* NAME */}

              <div>

                <label className="block text-xs font-medium text-green-700 mb-1.5">
                  Name *
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={
                    handleChange
                  }
                  className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50"
                  placeholder="e.g. Floor Cleaners"
                  required
                />

              </div>

              {/* SLUG */}

              <div>

                <label className="block text-xs font-medium text-green-700 mb-1.5">
                  Slug *
                </label>

                <input
                  name="slug"
                  value={form.slug}
                  onChange={
                    handleChange
                  }
                  className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50 font-mono"
                  placeholder="floor-cleaners"
                  required
                />

              </div>

              {/* HSN / SAC CODE */}

              <div>

                <label className="block text-xs font-medium text-green-700 mb-1.5">
                  Default HSN / SAC Code
                </label>

                <input
                  name="hsn_code"
                  value={form.hsn_code}
                  onChange={
                    handleChange
                  }
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50 font-mono"
                  placeholder="e.g. 3402"
                />

                <p className="text-[11px] text-green-500 mt-1.5">
                  Enter 4, 6, or 8 digits. This will be used as the default HSN/SAC for products in this category.
                </p>

              </div>

              {/* DESCRIPTION */}

              <div>

                <label className="block text-xs font-medium text-green-700 mb-1.5">
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={
                    handleChange
                  }
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50 resize-none"
                  placeholder="Describe this category..."
                />

              </div>

              {/* =================================================
                  CATEGORY IMAGE UPLOADER
              ================================================= */}

              <div>

                <ImageUploader
                  value={
                    form.image_url
                      ? [form.image_url]
                      : []
                  }
                  onChange={
                    handleImageChange
                  }
                  folder="categories"
                  max={1}
                  label="Category Image"
                  bucket="images"
                />

              </div>

              {/* =================================================
                  SUBMIT
              ================================================= */}

              <div className="pt-2 flex gap-3">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 border border-green-200 text-green-700 rounded-xl text-sm font-medium hover:bg-green-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-green-800 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >

                  {saving && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}

                  {saving
                    ? 'Saving...'
                    : modal === 'add'
                    ? 'Add Category'
                    : 'Save Changes'}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}
