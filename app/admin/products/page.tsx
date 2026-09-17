
'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Loader as Loader2,
  X,
  Star,
  Package,
} from 'lucide-react';

import {
  supabase,
  type Product,
  type Category,
} from '@/lib/supabase';

import ImageUploader from '@/components/admin/ImageUploader';

type Form = {
  name: string;
  slug: string;
  category_id: string;
  description: string;
  price: string;
  gst_percentage: string;
  stock: string;
  hsn_code: string;
  featured: boolean;
};

type ProductWithCategory = Product & {
  categories?: Category | null;
};

const emptyForm: Form = {
  name: '',
  slug: '',
  category_id: '',
  description: '',
  price: '',
  gst_percentage: '18',
  stock: '0',
  hsn_code: '',
  featured: false,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function AdminProducts() {
  // ============================================================
  // STATE
  // ============================================================

  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);

  const [form, setForm] = useState<Form>({
    ...emptyForm,
  });

  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ============================================================
  // LOAD DATA
  // ============================================================

  const load = async () => {
    try {
      setLoading(true);
      setError('');

      const [productsResult, categoriesResult] =
        await Promise.all([
          supabase
            .from('products')
            .select('*, categories(*)')
            .order('created_at', {
              ascending: false,
            }),

          supabase
            .from('categories')
            .select('*')
            .order('name', {
              ascending: true,
            }),
        ]);

      // ----------------------------------------------------------
      // PRODUCTS
      // ----------------------------------------------------------

      if (productsResult.error) {
        console.error(
          'Products load error:',
          productsResult.error
        );

        setError(
          productsResult.error.message ||
            'Failed to load products.'
        );

        setProducts([]);
      } else {
        setProducts(
          (productsResult.data as ProductWithCategory[]) || []
        );
      }

      // ----------------------------------------------------------
      // CATEGORIES
      // ----------------------------------------------------------

      if (categoriesResult.error) {
        console.error(
          'Categories load error:',
          categoriesResult.error
        );

        if (!productsResult.error) {
          setError(
            categoriesResult.error.message ||
              'Failed to load categories.'
          );
        }

        setCategories([]);
      } else {
        setCategories(
          (categoriesResult.data as Category[]) || []
        );
      }
    } catch (err) {
      console.error('Load error:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load products.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    load();
  }, []);

  // ============================================================
  // OPEN ADD
  // ============================================================

  const openAdd = () => {
    if (saving || deletingId) return;

    setEditing(null);

    setForm({
      ...emptyForm,
    });

    setImageUrls([]);
    setError('');
    setModal('add');
  };

  // ============================================================
  // OPEN EDIT
  // ============================================================

  const openEdit = (product: Product) => {
    if (saving || deletingId) return;

    console.log(
      '[Products] Edit clicked:',
      product.id,
      product.name
    );

    setEditing(product);

    setForm({
      name: product.name || '',
      slug: product.slug || '',
      category_id: product.category_id || '',
      description: product.description || '',
      price: String(product.price ?? ''),
      gst_percentage: String(
        product.gst_percentage ?? 18
      ),
      stock: String(product.stock ?? 0),

      // NEW: existing product HSN
      hsn_code: product.hsn_code || '',

      featured: Boolean(product.featured),
    });

    setImageUrls(
      Array.isArray(product.images)
        ? [...product.images]
        : []
    );

    setError('');
    setModal('edit');
  };

  // ============================================================
  // CLOSE MODAL
  // ============================================================

  const closeModal = () => {
    if (saving) return;

    setModal(null);
    setEditing(null);

    setForm({
      ...emptyForm,
    });

    setImageUrls([]);
    setError('');
  };

  // ============================================================
  // FORM CHANGE
  // ============================================================

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement |
        HTMLTextAreaElement |
        HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    const checked =
      type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : false;

    // ==========================================================
    // CATEGORY CHANGE
    // ==========================================================

    if (name === 'category_id') {
      const selectedCategory = categories.find(
        (category) => category.id === value
      );

      setForm((current) => ({
        ...current,
        category_id: value,

        // Automatically use category HSN only when
        // product currently doesn't have an HSN.
        hsn_code:
          current.hsn_code.trim() ||
          selectedCategory?.hsn_code ||
          '',
      }));

      return;
    }

    // ==========================================================
    // NORMAL FORM CHANGE
    // ==========================================================

    setForm((current) => ({
      ...current,

      [name]:
        type === 'checkbox'
          ? checked
          : value,

      // Automatically generate slug while adding.
      ...(name === 'name' && modal === 'add'
        ? {
            slug: slugify(value),
          }
        : {}),
    }));
  };

  // ============================================================
  // SAVE
  // ============================================================

  const handleSave = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (saving) return;

    setError('');

    const name = form.name.trim();
    const slug = form.slug.trim();
    const hsn = form.hsn_code.trim();

    const price = Number.parseFloat(form.price);

    const gst = Number.parseFloat(
      form.gst_percentage
    );

    const stock = Number.parseInt(
      form.stock,
      10
    );

    // ==========================================================
    // VALIDATION
    // ==========================================================

    if (!name) {
      setError('Product name is required.');
      return;
    }

    if (!slug) {
      setError('Product slug is required.');
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setError('Please enter a valid price.');
      return;
    }

    if (!Number.isFinite(gst) || gst < 0 || gst > 100) {
      setError(
        'Please enter a valid GST percentage.'
      );
      return;
    }

    if (!Number.isFinite(stock) || stock < 0) {
      setError(
        'Please enter a valid stock quantity.'
      );
      return;
    }

    // ==========================================================
    // HSN VALIDATION
    // ==========================================================

    if (
      hsn &&
      !/^[0-9]{4}([0-9]{2})?([0-9]{2})?$/.test(hsn)
    ) {
      setError(
        'HSN/SAC code must contain 4, 6, or 8 digits.'
      );
      return;
    }

    // ==========================================================
    // PAYLOAD
    // ==========================================================

    const payload = {
      name,
      slug,

      category_id:
        form.category_id || null,

      description:
        form.description.trim() || null,

      price,

      gst_percentage: gst,

      stock,

      // NEW: save product HSN
      hsn_code: hsn || null,

      featured: form.featured,

      images: imageUrls,
    };

    try {
      setSaving(true);

      // ========================================================
      // UPDATE
      // ========================================================

      if (editing) {
        console.log(
          '[Products] Updating:',
          editing.id
        );

        const { error: updateError } =
          await supabase
            .from('products')
            .update(payload)
            .eq('id', editing.id);

        if (updateError) {
          console.error(
            '[Products] Update error:',
            updateError
          );

          setError(
            updateError.message ||
              'Failed to update product.'
          );

          return;
        }
      }

      // ========================================================
      // INSERT
      // ========================================================

      else {
        console.log(
          '[Products] Creating product'
        );

        const { error: insertError } =
          await supabase
            .from('products')
            .insert(payload);

        if (insertError) {
          console.error(
            '[Products] Insert error:',
            insertError
          );

          setError(
            insertError.message ||
              'Failed to create product.'
          );

          return;
        }
      }

      // ========================================================
      // SUCCESS
      // ========================================================

      setModal(null);
      setEditing(null);

      setForm({
        ...emptyForm,
      });

      setImageUrls([]);
      setError('');

      await load();
    } catch (err) {
      console.error(
        '[Products] Save error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while saving.'
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETE
  // ============================================================

  const handleDelete = async (id: string) => {
    if (deletingId || saving) return;

    const product = products.find(
      (item) => item.id === id
    );

    const productName =
      product?.name || 'this product';

    const confirmed = window.confirm(
      `Are you sure you want to delete "${productName}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError('');

      console.log(
        '[Products] Delete clicked:',
        id,
        productName
      );

      const { error: deleteError } =
        await supabase
          .from('products')
          .delete()
          .eq('id', id);

      if (deleteError) {
        console.error(
          '[Products] Delete error:',
          deleteError
        );

        setError(
          deleteError.message ||
            'Failed to delete product.'
        );

        return;
      }

      // Remove immediately.
      setProducts((current) =>
        current.filter(
          (item) => item.id !== id
        )
      );

      await load();
    } catch (err) {
      console.error(
        '[Products] Delete exception:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete product.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      className="
        relative
        min-h-screen
        p-6
        md:p-8
        bg-green-50
      "
    >
      {/* ========================================================
          HEADER
      ======================================================== */}

      <div
        className="
          relative
          z-10
          flex
          items-center
          justify-between
          mb-8
        "
      >
        <div>
          <h1 className="font-display text-3xl font-bold text-green-900">
            Products
          </h1>

          <p className="text-green-600 text-sm mt-1">
            Manage your product catalog
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          disabled={
            Boolean(deletingId) || saving
          }
          className="
            relative
            z-20
            flex
            items-center
            gap-2
            bg-green-800
            text-white
            px-4
            py-2.5
            rounded-xl
            text-sm
            font-medium
            hover:bg-green-600
            active:bg-green-900
            transition-colors
            cursor-pointer
            disabled:opacity-50
            disabled:cursor-not-allowed
          "
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* ========================================================
          ERROR
      ======================================================== */}

      {error && !modal && (
        <div
          className="
            relative
            z-10
            mb-5
            bg-red-50
            border
            border-red-200
            text-red-700
            text-sm
            px-4
            py-3
            rounded-xl
          "
        >
          {error}
        </div>
      )}

      {/* ========================================================
          LOADING
      ======================================================== */}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(
            (item) => (
              <div
                key={item}
                className="
                  h-48
                  bg-green-100
                  rounded-2xl
                  animate-pulse
                "
              />
            )
          )}
        </div>
      ) : products.length === 0 ? (
        /* ======================================================
           EMPTY
        ====================================================== */

        <div
          className="
            relative
            z-10
            text-center
            py-20
            bg-white
            rounded-2xl
            border
            border-green-100
          "
        >
          <Package className="w-10 h-10 text-green-300 mx-auto mb-3" />

          <p className="text-green-600">
            No products yet. Add your first
            product.
          </p>
        </div>
      ) : (
        /* ======================================================
           TABLE
        ====================================================== */

        <div
          className="
            relative
            z-10
            isolate
            w-full
            bg-white
            rounded-2xl
            border
            border-green-100
            overflow-x-auto
            overflow-y-visible
          "
        >
          <table
            className="
              w-full
              min-w-[1000px]
              text-sm
              border-separate
              border-spacing-0
            "
          >
            {/* ==================================================
                HEADER
            ================================================== */}

            <thead>
              <tr
                className="
                  bg-green-50
                  border-b
                  border-green-100
                "
              >
                <th
                  className="
                    text-left
                    px-6
                    py-4
                    text-xs
                    font-medium
                    text-green-600
                    uppercase
                    tracking-wide
                  "
                >
                  Product
                </th>

                <th
                  className="
                    text-left
                    px-4
                    py-4
                    text-xs
                    font-medium
                    text-green-600
                    uppercase
                    tracking-wide
                    hidden
                    md:table-cell
                  "
                >
                  Category
                </th>

                {/* HSN */}
                <th
                  className="
                    text-left
                    px-4
                    py-4
                    text-xs
                    font-medium
                    text-green-600
                    uppercase
                    tracking-wide
                    hidden
                    lg:table-cell
                  "
                >
                  HSN / SAC
                </th>

                <th
                  className="
                    text-left
                    px-4
                    py-4
                    text-xs
                    font-medium
                    text-green-600
                    uppercase
                    tracking-wide
                  "
                >
                  Price
                </th>

                <th
                  className="
                    text-left
                    px-4
                    py-4
                    text-xs
                    font-medium
                    text-green-600
                    uppercase
                    tracking-wide
                    hidden
                    lg:table-cell
                  "
                >
                  GST (%)
                </th>

                <th
                  className="
                    text-left
                    px-4
                    py-4
                    text-xs
                    font-medium
                    text-green-600
                    uppercase
                    tracking-wide
                    hidden
                    md:table-cell
                  "
                >
                  Final Price
                </th>

                <th
                  className="
                    text-left
                    px-4
                    py-4
                    text-xs
                    font-medium
                    text-green-600
                    uppercase
                    tracking-wide
                    hidden
                    sm:table-cell
                  "
                >
                  Stock
                </th>

                <th
                  className="
                    sticky
                    right-0
                    z-[100]
                    w-[110px]
                    min-w-[110px]
                    px-4
                    py-4
                    text-right
                    bg-green-50
                    border-l
                    border-green-100
                  "
                >
                  Actions
                </th>
              </tr>
            </thead>

            {/* ==================================================
                BODY
            ================================================== */}

            <tbody
              className="
                divide-y
                divide-green-50
              "
            >
              {products.map((p) => {
                const price =
                  Number(p.price) || 0;

                const gst =
                  Number(
                    p.gst_percentage ?? 18
                  );

                const finalPrice =
                  price *
                  (1 + gst / 100);

                const isDeleting =
                  deletingId === p.id;

                return (
                  <tr
                    key={p.id}
                    className="
                      group
                      hover:bg-green-50/60
                      transition-colors
                    "
                  >
                    {/* ==================================================
                        PRODUCT
                    ================================================== */}

                    <td className="px-6 py-4">
                      <div
                        className="
                          flex
                          items-center
                          gap-3
                          min-w-0
                        "
                      >
                        <div
                          className="
                            w-10
                            h-10
                            rounded-lg
                            overflow-hidden
                            bg-green-100
                            shrink-0
                            flex
                            items-center
                            justify-center
                          "
                        >
                          {p.images?.[0] ? (
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="
                                w-full
                                h-full
                                object-cover
                              "
                            />
                          ) : (
                            <Package
                              className="
                                w-5
                                h-5
                                text-green-300
                              "
                            />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p
                            className="
                              font-medium
                              text-green-800
                              flex
                              items-center
                              gap-1.5
                            "
                          >
                            <span
                              className="
                                truncate
                                max-w-[420px]
                              "
                            >
                              {p.name}
                            </span>

                            {p.featured && (
                              <Star
                                className="
                                  w-3
                                  h-3
                                  shrink-0
                                  text-green-500
                                  fill-green-500
                                "
                              />
                            )}
                          </p>

                          <p
                            className="
                              text-xs
                              text-green-400
                              truncate
                              max-w-[420px]
                            "
                          >
                            {p.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* ==================================================
                        CATEGORY
                    ================================================== */}

                    <td
                      className="
                        px-4
                        py-4
                        hidden
                        md:table-cell
                      "
                    >
                      <span className="text-green-600 text-xs">
                        {p.categories?.name || '—'}
                      </span>
                    </td>

                    {/* ==================================================
                        HSN
                    ================================================== */}

                    <td
                      className="
                        px-4
                        py-4
                        hidden
                        lg:table-cell
                      "
                    >
                      {p.hsn_code ? (
                        <span
                          className="
                            inline-flex
                            items-center
                            px-2
                            py-1
                            rounded-md
                            bg-green-50
                            text-green-700
                            text-xs
                            font-mono
                          "
                        >
                          {p.hsn_code}
                        </span>
                      ) : (
                        <span className="text-xs text-green-300">
                          —
                        </span>
                      )}
                    </td>

                    {/* ==================================================
                        PRICE
                    ================================================== */}

                    <td
                      className="
                        px-4
                        py-4
                        font-medium
                        text-green-800
                        whitespace-nowrap
                      "
                    >
                      ₹
                      {price.toLocaleString(
                        'en-IN'
                      )}
                    </td>

                    {/* ==================================================
                        GST
                    ================================================== */}

                    <td
                      className="
                        px-4
                        py-4
                        hidden
                        lg:table-cell
                        text-green-600
                        whitespace-nowrap
                      "
                    >
                      {gst}%
                    </td>

                    {/* ==================================================
                        FINAL PRICE
                    ================================================== */}

                    <td
                      className="
                        px-4
                        py-4
                        hidden
                        md:table-cell
                        font-medium
                        text-green-900
                        whitespace-nowrap
                      "
                    >
                      ₹
                      {finalPrice.toLocaleString(
                        'en-IN',
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </td>

                    {/* ==================================================
                        STOCK
                    ================================================== */}

                    <td
                      className="
                        px-4
                        py-4
                        hidden
                        sm:table-cell
                      "
                    >
                      <span
                        className={`
                          inline-flex
                          items-center
                          justify-center
                          min-w-[32px]
                          text-xs
                          px-2
                          py-1
                          rounded-full
                          ${
                            Number(p.stock) > 0
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }
                        `}
                      >
                        {p.stock}
                      </span>
                    </td>

                    {/* ==================================================
                        ACTIONS
                    ================================================== */}

                    <td
                      className="
                        sticky
                        right-0
                        z-[100]
                        w-[110px]
                        min-w-[110px]
                        px-4
                        py-4
                        bg-white
                        group-hover:bg-green-50
                        border-l
                        border-green-50
                        whitespace-nowrap
                      "
                    >
                      <div
                        className="
                          flex
                          items-center
                          justify-end
                          gap-1
                        "
                      >
                        {/* EDIT */}

                        <button
                          type="button"
                          title="Edit product"
                          aria-label={`Edit ${p.name}`}
                          disabled={
                            Boolean(deletingId) ||
                            saving
                          }
                          onClick={() => {
                            openEdit(p);
                          }}
                          className="
                            flex
                            items-center
                            justify-center
                            w-9
                            h-9
                            rounded-lg
                            text-green-500
                            hover:text-green-800
                            hover:bg-green-100
                            active:bg-green-200
                            transition-colors
                            cursor-pointer
                            pointer-events-auto
                            disabled:opacity-40
                            disabled:cursor-not-allowed
                          "
                        >
                          <Pencil
                            className="
                              w-4
                              h-4
                              pointer-events-none
                            "
                          />
                        </button>

                        {/* DELETE */}

                        <button
                          type="button"
                          title="Delete product"
                          aria-label={`Delete ${p.name}`}
                          disabled={
                            Boolean(deletingId) ||
                            saving
                          }
                          onClick={() => {
                            handleDelete(p.id);
                          }}
                          className="
                            flex
                            items-center
                            justify-center
                            w-9
                            h-9
                            rounded-lg
                            text-green-500
                            hover:text-red-600
                            hover:bg-red-50
                            active:bg-red-100
                            transition-colors
                            cursor-pointer
                            pointer-events-auto
                            disabled:opacity-40
                            disabled:cursor-not-allowed
                          "
                        >
                          {isDeleting ? (
                            <Loader2
                              className="
                                w-4
                                h-4
                                animate-spin
                                pointer-events-none
                              "
                            />
                          ) : (
                            <Trash2
                              className="
                                w-4
                                h-4
                                pointer-events-none
                              "
                            />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================
          MODAL
      ======================================================== */}

      {modal && (
        <div
          className="
            fixed
            inset-0
            z-[1000]
            flex
            items-center
            justify-center
            p-4
            bg-black/50
            backdrop-blur-sm
          "
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div
            className="
              relative
              z-[1001]
              bg-white
              rounded-2xl
              w-full
              max-w-lg
              shadow-2xl
              overflow-hidden
            "
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            {/* ==================================================
                MODAL HEADER
            ================================================== */}

            <div
              className="
                flex
                items-center
                justify-between
                px-6
                py-5
                border-b
                border-green-100
              "
            >
              <h3
                className="
                  font-display
                  text-xl
                  font-bold
                  text-green-900
                "
              >
                {modal === 'add'
                  ? 'Add Product'
                  : 'Edit Product'}
              </h3>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close"
                className="
                  flex
                  items-center
                  justify-center
                  w-9
                  h-9
                  rounded-lg
                  hover:bg-green-100
                  text-green-500
                  cursor-pointer
                  disabled:opacity-50
                "
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ==================================================
                FORM
            ================================================== */}

            <form onSubmit={handleSave}>
              <div
                className="
                  px-6
                  py-5
                  space-y-4
                  max-h-[72vh]
                  overflow-y-auto
                "
              >
                {/* ERROR */}

                {error && (
                  <div
                    className="
                      bg-red-50
                      border
                      border-red-200
                      text-red-700
                      text-sm
                      px-4
                      py-3
                      rounded-xl
                    "
                  >
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {/* ==================================================
                      NAME
                  ================================================== */}

                  <div className="col-span-2">
                    <label
                      className="
                        block
                        text-xs
                        font-medium
                        text-green-700
                        mb-1.5
                      "
                    >
                      Name *
                    </label>

                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className="
                        w-full
                        px-3.5
                        py-2.5
                        text-sm
                        border
                        border-green-200
                        rounded-xl
                        focus:outline-none
                        focus:ring-2
                        focus:ring-green-400
                        bg-green-50
                      "
                    />
                  </div>

                  {/* ==================================================
                      SLUG
                  ================================================== */}

                  <div>
                    <label
                      className="
                        block
                        text-xs
                        font-medium
                        text-green-700
                        mb-1.5
                      "
                    >
                      Slug *
                    </label>

                    <input
                      name="slug"
                      value={form.slug}
                      onChange={handleChange}
                      required
                      className="
                        w-full
                        px-3.5
                        py-2.5
                        text-sm
                        border
                        border-green-200
                        rounded-xl
                        focus:outline-none
                        focus:ring-2
                        focus:ring-green-400
                        bg-green-50
                        font-mono
                      "
                    />
                  </div>

                  {/* ==================================================
                      CATEGORY
                  ================================================== */}

                  <div>
                    <label
                      className="
                        block
                        text-xs
                        font-medium
                        text-green-700
                        mb-1.5
                      "
                    >
                      Category
                    </label>

                    <select
                      name="category_id"
                      value={form.category_id}
                      onChange={handleChange}
                      className="
                        w-full
                        px-3.5
                        py-2.5
                        text-sm
                        border
                        border-green-200
                        rounded-xl
                        focus:outline-none
                        focus:ring-2
                        focus:ring-green-400
                        bg-green-50
                      "
                    >
                      <option value="">
                        None
                      </option>

                      {categories.map(
                        (category) => (
                          <option
                            key={category.id}
                            value={category.id}
                          >
                            {category.name}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {/* ==================================================
                      PRICE
                  ================================================== */}

                  <div>
                    <label
                      className="
                        block
                        text-xs
                        font-medium
                        text-green-700
                        mb-1.5
                      "
                    >
                      Price (₹) *
                    </label>

                    <input
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={handleChange}
                      required
                      className="
                        w-full
                        px-3.5
                        py-2.5
                        text-sm
                        border
                        border-green-200
                        rounded-xl
                        focus:outline-none
                        focus:ring-2
                        focus:ring-green-400
                        bg-green-50
                      "
                    />
                  </div>

                  {/* ==================================================
                      GST
                  ================================================== */}

                  <div>
                    <label
                      className="
                        block
                        text-xs
                        font-medium
                        text-green-700
                        mb-1.5
                      "
                    >
                      GST (%)
                    </label>

                    <input
                      name="gst_percentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={
                        form.gst_percentage
                      }
                      onChange={handleChange}
                      className="
                        w-full
                        px-3.5
                        py-2.5
                        text-sm
                        border
                        border-green-200
                        rounded-xl
                        focus:outline-none
                        focus:ring-2
                        focus:ring-green-400
                        bg-green-50
                      "
                    />
                  </div>

                  {/* ==================================================
                      HSN / SAC
                  ================================================== */}

                  <div>
                    <label
                      className="
                        block
                        text-xs
                        font-medium
                        text-green-700
                        mb-1.5
                      "
                    >
                      HSN / SAC Code
                    </label>

                    <input
                      name="hsn_code"
                      type="text"
                      inputMode="numeric"
                      maxLength={8}
                      value={form.hsn_code}
                      onChange={handleChange}
                      placeholder="e.g. 3402"
                      className="
                        w-full
                        px-3.5
                        py-2.5
                        text-sm
                        border
                        border-green-200
                        rounded-xl
                        focus:outline-none
                        focus:ring-2
                        focus:ring-green-400
                        bg-green-50
                        font-mono
                      "
                    />

                    {form.category_id && (
                      <p
                        className="
                          mt-1.5
                          text-[11px]
                          text-green-500
                        "
                      >
                        Category default HSN:{' '}
                        <span className="font-mono font-medium">
                          {categories.find(
                            (category) =>
                              category.id ===
                              form.category_id
                          )?.hsn_code ||
                            'Not assigned'}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* ==================================================
                      STOCK
                  ================================================== */}

                  <div>
                    <label
                      className="
                        block
                        text-xs
                        font-medium
                        text-green-700
                        mb-1.5
                      "
                    >
                      Stock
                    </label>

                    <input
                      name="stock"
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={handleChange}
                      className="
                        w-full
                        px-3.5
                        py-2.5
                        text-sm
                        border
                        border-green-200
                        rounded-xl
                        focus:outline-none
                        focus:ring-2
                        focus:ring-green-400
                        bg-green-50
                      "
                    />
                  </div>

                  {/* ==================================================
                      DESCRIPTION
                  ================================================== */}

                  <div className="col-span-2">
                    <label
                      className="
                        block
                        text-xs
                        font-medium
                        text-green-700
                        mb-1.5
                      "
                    >
                      Description
                    </label>

                    <textarea
                      name="description"
                      value={
                        form.description
                      }
                      onChange={handleChange}
                      rows={3}
                      className="
                        w-full
                        px-3.5
                        py-2.5
                        text-sm
                        border
                        border-green-200
                        rounded-xl
                        focus:outline-none
                        focus:ring-2
                        focus:ring-green-400
                        bg-green-50
                        resize-none
                      "
                    />
                  </div>

                  {/* ==================================================
                      IMAGES
                  ================================================== */}

                  <div className="col-span-2">
                    <ImageUploader
                      value={imageUrls}
                      onChange={setImageUrls}
                      folder="products"
                      label="Product Images"
                    />
                  </div>

                  {/* ==================================================
                      FEATURED
                  ================================================== */}

                  <div
                    className="
                      col-span-2
                      flex
                      items-center
                      gap-2
                    "
                  >
                    <input
                      name="featured"
                      type="checkbox"
                      checked={
                        form.featured
                      }
                      onChange={handleChange}
                      id="featured"
                      className="
                        w-4
                        h-4
                        accent-green-600
                      "
                    />

                    <label
                      htmlFor="featured"
                      className="
                        text-sm
                        text-green-700
                        cursor-pointer
                      "
                    >
                      Mark as Featured
                    </label>
                  </div>
                </div>
              </div>

              {/* ==================================================
                  MODAL FOOTER
              ================================================== */}

              <div
                className="
                  px-6
                  py-4
                  border-t
                  border-green-100
                  flex
                  gap-3
                  bg-white
                "
              >
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="
                    flex-1
                    px-4
                    py-2.5
                    border
                    border-green-200
                    text-green-700
                    rounded-xl
                    text-sm
                    font-medium
                    hover:bg-green-50
                    transition-colors
                    cursor-pointer
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                  "
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="
                    flex-1
                    px-4
                    py-2.5
                    bg-green-800
                    text-white
                    rounded-xl
                    text-sm
                    font-medium
                    hover:bg-green-600
                    transition-colors
                    flex
                    items-center
                    justify-center
                    gap-2
                    cursor-pointer
                    disabled:opacity-70
                    disabled:cursor-not-allowed
                  "
                >
                  {saving && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}

                  {saving
                    ? 'Saving...'
                    : modal === 'add'
                      ? 'Add Product'
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
