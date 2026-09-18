'use client';

import { useState, useEffect, useRef } from 'react';

import {
  supabase,
  type Invoice,
  type InvoiceItem,
  type HsnCode,
  type Supplier,
} from '@/lib/supabase';

import {
  X,
  Plus,
  Trash2,
  Loader as Loader2,
  Save,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  Search,
  Package,
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

type Props = {
  invoice?: Invoice;
  items?: InvoiceItem[];
  onClose: () => void;
  onSaved: () => void;
};

type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'paid'
  | 'pending'
  | 'cancelled';

type BillingProduct = {
  id: string;
  name: string;
  price: number | null;
  gst_percentage: number | null;
  stock: number | null;
  hsn_code: string | null;
  category_id: string | null;
  is_offline: boolean | null;
};

type BillingCategory = {
  id: string;
  name: string;
  hsn_code: string | null;
};

type DraftItem = {
  id?: string;
  product_id?: string;
  is_custom: boolean;

  description: string;
  hsn_sac_code: string;
  unit: string;
  quantity: number;
  unit_price: number;
  gst_percentage: number;
};

type HsnInputProps = {
  value: string;
  codes: HsnCode[];
  onChange: (value: string) => void;
  onSelect: (hsn: HsnCode) => void;
  onSave: (value: string) => void;
};

/* =========================================================
   HELPERS
========================================================= */

const fmt = (value: number) =>
  Number.isFinite(value)
    ? value.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : '0.00';

const safeNumber = (
  value: unknown,
  fallback = 0
): number => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

/*
 * Valid HSN:
 * 4 digits
 * 6 digits
 * 8 digits
 */
const isValidHsnSac = (
  value: string
): boolean => {
  const code = value.trim();

  if (!code) {
    return true;
  }

  return /^[0-9]{4}(?:[0-9]{2})?(?:[0-9]{2})?$/.test(
    code
  );
};

const createEmptyItem = (): DraftItem => ({
  is_custom: false,
  description: '',
  hsn_sac_code: '',
  unit: 'PCS',
  quantity: 1,
  unit_price: 0,
  gst_percentage: 18,
});

/* =========================================================
   COMPONENT
========================================================= */

export default function InvoiceFormModal({
  invoice,
  items,
  onClose,
  onSaved,
}: Props) {
  const isEdit = Boolean(invoice);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  /* =======================================================
     CUSTOMER
  ======================================================= */

  const [customerName, setCustomerName] =
    useState(
      invoice?.customer_name || ''
    );

  const [customerEmail, setCustomerEmail] =
    useState(
      invoice?.customer_email || ''
    );

  const [customerPhone, setCustomerPhone] =
    useState(
      invoice?.customer_phone || ''
    );

  const [customerAddress, setCustomerAddress] =
    useState(
      invoice?.customer_address || ''
    );

  const [customerGst, setCustomerGst] =
    useState(
      invoice?.customer_gst || ''
    );

  const [customerPan, setCustomerPan] =
    useState(
      invoice?.customer_pan || ''
    );

  const [placeOfSupply, setPlaceOfSupply] =
    useState(
      invoice?.place_of_supply || ''
    );

  const [invoiceDate, setInvoiceDate] =
    useState(
      invoice?.invoice_date ||
        new Date()
          .toISOString()
          .slice(0, 10)
    );

  const [dueDate, setDueDate] =
    useState(
      invoice?.due_date || ''
    );

  const [notes, setNotes] =
    useState(
      invoice?.notes || ''
    );

  const [invoiceStatus, setInvoiceStatus] =
    useState<InvoiceStatus>(
      (invoice?.status as InvoiceStatus) ||
        'draft'
    );

  /* =======================================================
     GST VERIFICATION
  ======================================================= */

  const [gstVerification, setGstVerification] =
    useState<{
      status: 'verified' | 'error';
      message: string;
    } | null>(null);

  const [verifyingGst, setVerifyingGst] =
    useState(false);

  /* =======================================================
     SUPPLIERS
  ======================================================= */

  const [suppliers, setSuppliers] =
    useState<Supplier[]>([]);

  const [supplierSearch, setSupplierSearch] =
    useState('');

  const [showSupplierDropdown, setShowSupplierDropdown] =
    useState(false);

  const [selectedSupplier, setSelectedSupplier] =
    useState<Supplier | null>(null);

  /* =======================================================
     PRODUCTS
  ======================================================= */

  const [products, setProducts] =
    useState<BillingProduct[]>([]);

  const [categories, setCategories] =
    useState<BillingCategory[]>([]);

  const [productsLoading, setProductsLoading] =
    useState(false);

  const [productSearch, setProductSearch] =
    useState('');

  const [activeProductIndex, setActiveProductIndex] =
    useState<number | null>(null);

  const productSearchRef =
    useRef<HTMLDivElement | null>(null);

  /* =======================================================
     HSN MASTER
  ======================================================= */

  const [hsnCodes, setHsnCodes] =
    useState<HsnCode[]>([]);

  const [hsnLoading, setHsnLoading] =
    useState(false);

  /* =======================================================
     ORDERS
  ======================================================= */

  const [orders, setOrders] =
    useState<
      {
        id: string;
        customer_name: string;
        product_name: string;
      }[]
    >([]);

  const [linkedOrderId, setLinkedOrderId] =
    useState(
      invoice?.order_id || ''
    );

  /* =======================================================
     ITEMS
  ======================================================= */

  const [draftItems, setDraftItems] =
    useState<DraftItem[]>(
      items && items.length > 0
        ? items.map((item) => ({
            id: item.id,
            /*
             * Keep the original inventory product link when
             * editing an existing invoice.
             *
             * Custom invoice items have product_id = null.
             */
            product_id:
              (item as InvoiceItem & {
                product_id?: string | null;
              }).product_id || undefined,
            is_custom: !(
              (item as InvoiceItem & {
                product_id?: string | null;
              }).product_id
            ),
            description:
              item.description || '',
            hsn_sac_code:
              item.hsn_sac_code || '',
            unit:
              item.unit || 'PCS',
            quantity: Math.max(
              0.01,
              safeNumber(
                item.quantity,
                1
              )
            ),
            unit_price: Math.max(
              0,
              safeNumber(
                item.unit_price
              )
            ),
            gst_percentage:
              Math.min(
                100,
                Math.max(
                  0,
                  safeNumber(
                    item.gst_percentage,
                    18
                  )
                )
              ),
          }))
        : [createEmptyItem()]
    );

  /* =========================================================
     LOAD BILLING DATA
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadBillingData =
      async () => {
        setProductsLoading(true);
        setHsnLoading(true);

        try {
          const [
            ordersResult,
            suppliersResult,
            productsResult,
            categoriesResult,
            hsnResult,
          ] = await Promise.all([
            /* ORDERS */

            supabase
              .from('orders')
              .select(
                'id, customer_name, product_name'
              )
              .order('created_at', {
                ascending: false,
              })
              .limit(50),

            /* SUPPLIERS */

            supabase
              .from('suppliers')
              .select('*')
              .order('name', {
                ascending: true,
              }),

            /* PRODUCTS */

            supabase
              .from('products')
              .select(
                'id, name, price, gst_percentage, stock, hsn_code, category_id, is_offline'
              )
              /*
               * Invoice products come from INVENTORY.
               *
               * Products with no available stock are not
               * offered as new invoice selections.
               */
              .gt('stock', 0)
              .order('name', {
                ascending: true,
              }),

            /* CATEGORIES */

            supabase
              .from('categories')
              .select(
                'id, name, hsn_code'
              )
              .order('name', {
                ascending: true,
              }),

            /* HSN MASTER */

            supabase
              .from('hsn_codes')
              .select(
                'id, code, description, created_at'
              )
              .order('code', {
                ascending: true,
              }),
          ]);

          if (cancelled) {
            return;
          }

          /* ORDERS */

          if (ordersResult.error) {
            console.error(
              'Orders loading error:',
              ordersResult.error
            );
          }

          setOrders(
            (ordersResult.data || []) as {
              id: string;
              customer_name: string;
              product_name: string;
            }[]
          );

          /* SUPPLIERS */

          if (suppliersResult.error) {
            console.error(
              'Suppliers loading error:',
              suppliersResult.error
            );
          }

          const supplierData =
            (suppliersResult.data ||
              []) as Supplier[];

          setSuppliers(
            supplierData
          );

          /* PRODUCTS */

          if (productsResult.error) {
            console.error(
              'Products loading error:',
              productsResult.error
            );

            setProducts([]);
          } else {
            setProducts(
              (productsResult.data ||
                []) as BillingProduct[]
            );
          }

          /* CATEGORIES */

          if (categoriesResult.error) {
            console.error(
              'Categories loading error:',
              categoriesResult.error
            );

            setCategories([]);
          } else {
            setCategories(
              (categoriesResult.data ||
                []) as BillingCategory[]
            );
          }

          /* HSN MASTER */

          if (hsnResult.error) {
            console.error(
              'HSN master loading error:',
              hsnResult.error
            );

            setHsnCodes([]);
          } else {
            setHsnCodes(
              (hsnResult.data ||
                []) as HsnCode[]
            );
          }

          /* RESTORE SUPPLIER */

          const existingSupplierId =
            (
              invoice as
                | (Invoice & {
                    supplier_id?:
                      | string
                      | null;
                  })
                | undefined
            )?.supplier_id;

          if (
            existingSupplierId
          ) {
            const existingSupplier =
              supplierData.find(
                (supplier) =>
                  supplier.id ===
                  existingSupplierId
              );

            if (
              existingSupplier
            ) {
              setSelectedSupplier(
                existingSupplier
              );

              setSupplierSearch(
                existingSupplier.name
              );
            }
          }
        } catch (err) {
          console.error(
            'Billing data loading error:',
            err
          );
        } finally {
          if (!cancelled) {
            setProductsLoading(
              false
            );

            setHsnLoading(
              false
            );
          }
        }
      };

    loadBillingData();

    return () => {
      cancelled = true;
    };
  }, [invoice]);

  /* =========================================================
     CLOSE PRODUCT DROPDOWN
  ========================================================= */

  useEffect(() => {
    const handleOutsideClick = (
      event: MouseEvent
    ) => {
      if (
        productSearchRef.current &&
        !productSearchRef.current.contains(
          event.target as Node
        )
      ) {
        setActiveProductIndex(
          null
        );
      }
    };

    document.addEventListener(
      'mousedown',
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      );
    };
  }, []);

  /* =========================================================
     SUPPLIER FILTER
  ========================================================= */

  const filteredSuppliers =
    suppliers.filter(
      (supplier) => {
        const query =
          supplierSearch
            .trim()
            .toLowerCase();

        if (!query) {
          return true;
        }

        return (
          supplier.name
            .toLowerCase()
            .includes(query) ||
          (supplier.gstin || '')
            .toLowerCase()
            .includes(query) ||
          (supplier.contact_person ||
            '')
            .toLowerCase()
            .includes(query)
        );
      }
    );

  /* =========================================================
     SELECT SUPPLIER
  ========================================================= */

  const handleSelectSupplier = (
    supplier: Supplier
  ) => {
    setSelectedSupplier(
      supplier
    );

    setSupplierSearch(
      supplier.name
    );

    setShowSupplierDropdown(
      false
    );

    setCustomerName(
      supplier.name
    );

    setCustomerEmail(
      supplier.email || ''
    );

    setCustomerPhone(
      supplier.phone || ''
    );

    setCustomerGst(
      supplier.gstin || ''
    );

    setCustomerPan(
      supplier.pan || ''
    );

    const address = [
      supplier.address,
      supplier.address_line_2,
      supplier.landmark,
      supplier.city,
      supplier.state,
      supplier.country,
      supplier.pincode,
    ]
      .filter(Boolean)
      .join(', ');

    setCustomerAddress(
      address
    );

    setPlaceOfSupply(
      supplier.state || ''
    );

    setGstVerification(
      null
    );
  };

  /* =========================================================
     LINK ORDER
  ========================================================= */

  const handleLinkOrder = (
    orderId: string
  ) => {
    setLinkedOrderId(
      orderId
    );

    if (!orderId) {
      return;
    }

    const order = orders.find(
      (item) =>
        item.id === orderId
    );

    if (order && !customerName.trim()) {
      setCustomerName(
        order.customer_name
      );
    }
  };

  /* =========================================================
     GSTIN VERIFY
  ========================================================= */

  const verifyCustomerGstin =
    async () => {
      const gstin =
        customerGst
          .toUpperCase()
          .trim();

      setCustomerGst(gstin);
      setGstVerification(
        null
      );

      const gstinRegex =
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

      if (!gstinRegex.test(gstin)) {
        setGstVerification({
          status: 'error',
          message:
            'Enter a valid 15-character GSTIN.',
        });

        return;
      }

      setVerifyingGst(true);

      try {
        const {
          data,
          error: invokeError,
        } =
          await supabase.functions.invoke(
            'verify-gstin',
            {
              body: {
                gstin,
                include_profile:
                  true,
              },
            }
          );

        if (
          invokeError ||
          !data?.success
        ) {
          setGstVerification({
            status: 'error',
            message:
              data?.error ||
              invokeError?.message ||
              'GSTIN verification failed.',
          });

          return;
        }

        const profile =
          data.data || {};

        const tradeName =
          profile.trade_name ||
          profile.business_name ||
          profile.tradeName ||
          '';

        const legalName =
          profile.legal_name ||
          '';

        setGstVerification({
          status: 'verified',
          message: `${
            tradeName ||
            legalName ||
            'GSTIN'
          } verified successfully.`,
        });

        if (
          tradeName &&
          !customerName.trim()
        ) {
          setCustomerName(
            tradeName
          );
        }

        if (
          profile.address &&
          !customerAddress.trim()
        ) {
          setCustomerAddress(
            profile.address
          );
        }

        if (
          profile.state_code &&
          !placeOfSupply.trim()
        ) {
          setPlaceOfSupply(
            `${profile.state_code} - ${
              profile
                .address_details
                ?.state ||
              profile.city ||
              'Registered State'
            }`
          );
        }
      } catch (err: any) {
        console.error(
          'GST verification error:',
          err
        );

        setGstVerification({
          status: 'error',
          message:
            err?.message ||
            'GSTIN verification failed.',
        });
      } finally {
        setVerifyingGst(
          false
        );
      }
    };

  /* =========================================================
     ITEMS
  ========================================================= */

  const addItem = () => {
    setDraftItems(
      (previous) => [
        ...previous,
        createEmptyItem(),
      ]
    );

    setProductSearch('');
    setActiveProductIndex(
      null
    );
  };

  const removeItem = (
    index: number
  ) => {
    setDraftItems(
      (previous) => {
        const next =
          previous.filter(
            (_, i) =>
              i !== index
          );

        return next.length > 0
          ? next
          : [
              createEmptyItem(),
            ];
      }
    );

    setProductSearch('');
    setActiveProductIndex(
      null
    );
  };

  /* =========================================================
     UPDATE ITEM
  ========================================================= */

  const updateItem = (
    index: number,
    field: keyof DraftItem,
    value: string | number
  ) => {
    setDraftItems(
      (previous) =>
        previous.map(
          (item, i) => {
            if (
              i !== index
            ) {
              return item;
            }

            if (
              field ===
                'description' ||
              field ===
                'hsn_sac_code' ||
              field === 'unit'
            ) {
              return {
                ...item,
                [field]:
                  String(
                    value
                  ),
              };
            }

            const numeric =
              safeNumber(
                value
              );

            return {
              ...item,
              [field]:
                Math.max(
                  0,
                  numeric
                ),
            };
          }
        )
    );
  };

  /* =========================================================
     PRODUCT HSN
     
     PRODUCT HSN
        ↓
     CATEGORY HSN
        ↓
     EMPTY
  ========================================================= */

  const getProductHsn = (
    product: BillingProduct
  ): string => {
    const productHsn =
      product.hsn_code?.trim();

    if (productHsn) {
      return productHsn;
    }

    if (
      product.category_id
    ) {
      const category =
        categories.find(
          (item) =>
            item.id ===
            product.category_id
        );

      const categoryHsn =
        category?.hsn_code?.trim();

      if (categoryHsn) {
        return categoryHsn;
      }
    }

    return '';
  };

  /* =========================================================
     CATEGORY NAME
  ========================================================= */

  const getProductCategoryName = (
    product: BillingProduct
  ): string => {
    if (
      !product.category_id
    ) {
      return '';
    }

    return (
      categories.find(
        (category) =>
          category.id ===
          product.category_id
      )?.name || ''
    );
  };

  /* =========================================================
     PRODUCT SEARCH
  ========================================================= */

  const filteredProducts =
    products.filter(
      (product) => {
        const query =
          productSearch
            .trim()
            .toLowerCase();

        if (!query) {
          return true;
        }

        const categoryName =
          getProductCategoryName(
            product
          ).toLowerCase();

        return (
          product.name
            .toLowerCase()
            .includes(query) ||
          categoryName.includes(
            query
          ) ||
          (
            product.hsn_code ||
            ''
          )
            .toLowerCase()
            .includes(query)
        );
      }
    );

  /* =========================================================
     ADD CUSTOM PRODUCT / SERVICE

     Custom items are invoice-only. They are NOT inserted
     into public.products. The invoice_items table already
     stores description, HSN/SAC, quantity, rate and GST,
     so no product-table row is required.
  ========================================================= */

  const handleAddCustomProduct = (
    index: number
  ) => {
    setDraftItems((previous) =>
      previous.map((item, i) => {
        if (i !== index) {
          return item;
        }

        return {
          ...item,
          product_id: undefined,
          is_custom: true,
          description: '',
          hsn_sac_code: '',
          unit: item.unit || 'PCS',
          quantity: 1,
          unit_price: 0,
          gst_percentage: 18,
        };
      })
    );

    setProductSearch('');
    setActiveProductIndex(null);
  };

  /* =========================================================
     SELECT PRODUCT
  ========================================================= */

  const handleSelectProduct = (
    product: BillingProduct,
    index: number
  ) => {
    const hsn =
      getProductHsn(
        product
      );

    const price =
      Math.max(
        0,
        safeNumber(
          product.price
        )
      );

    const gst =
      Math.min(
        100,
        Math.max(
          0,
          safeNumber(
            product.gst_percentage,
            18
          )
        )
      );

    setDraftItems(
      (previous) =>
        previous.map(
          (item, i) => {
            if (
              i !== index
            ) {
              return item;
            }

            return {
              ...item,
              product_id:
                product.id,
              is_custom: false,
              description:
                product.name,
              hsn_sac_code:
                hsn,
              unit:
                item.unit ||
                'PCS',
              quantity:
                item.quantity >
                0
                  ? item.quantity
                  : 1,
              unit_price:
                price,
              gst_percentage:
                gst,
            };
          }
        )
    );

    setProductSearch('');
    setActiveProductIndex(
      null
    );
  };

  /* =========================================================
     SAVE HSN TO MASTER
     
     This is intentionally separate from
     invoice creation.

     If user types:
       6109

     it can be saved into:
       public.hsn_codes
  ========================================================= */

  const saveHsnCodeIfNew =
    async (
      code: string
    ) => {
      const cleaned =
        code
          .trim()
          .replace(
            /\D/g,
            ''
          )
          .slice(0, 8);

      if (!cleaned) {
        return;
      }

      if (
        !isValidHsnSac(
          cleaned
        )
      ) {
        return;
      }

      const exists =
        hsnCodes.some(
          (item) =>
            item.code ===
            cleaned
        );

      if (exists) {
        return;
      }

      try {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              'hsn_codes'
            )
            .insert({
              code: cleaned,
              description:
                null,
            })
            .select(
              'id, code, description, created_at'
            )
            .single();

        /*
         * Duplicate can happen because
         * another request may have inserted
         * the same code.
         */

        if (
          error
        ) {
          if (
            error.code ===
            '23505'
          ) {
            const {
              data: existing,
            } =
              await supabase
                .from(
                  'hsn_codes'
                )
                .select(
                  'id, code, description, created_at'
                )
                .eq(
                  'code',
                  cleaned
                )
                .maybeSingle();

            if (
              existing
            ) {
              setHsnCodes(
                (previous) => {
                  const exists =
                    previous.some(
                      (item) =>
                        item.id ===
                        existing.id
                    );

                  if (
                    exists
                  ) {
                    return previous;
                  }

                  return [
                    ...previous,
                    existing as HsnCode,
                  ].sort(
                    (a, b) =>
                      a.code.localeCompare(
                        b.code
                      )
                  );
                }
              );
            }

            return;
          }

          /*
           * Do not stop invoice creation
           * because HSN master insert failed.
           */

          console.warn(
            'Could not save HSN to master:',
            error.message
          );

          return;
        }

        if (data) {
          setHsnCodes(
            (previous) =>
              [
                ...previous,
                data as HsnCode,
              ].sort(
                (a, b) =>
                  a.code.localeCompare(
                    b.code
                  )
              )
          );
        }
      } catch (err) {
        console.warn(
          'HSN master save skipped:',
          err
        );
      }
    };

  /* =========================================================
     CALCULATION
  ========================================================= */

  const calcItem = (
    item: DraftItem
  ) => {
    const quantity =
      Math.max(
        0,
        safeNumber(
          item.quantity
        )
      );

    const unitPrice =
      Math.max(
        0,
        safeNumber(
          item.unit_price
        )
      );

    const gstPercentage =
      Math.min(
        100,
        Math.max(
          0,
          safeNumber(
            item.gst_percentage,
            18
          )
        )
      );

    const base =
      quantity *
      unitPrice;

    const gst =
      (base *
        gstPercentage) /
      100;

    const total =
      base + gst;

    return {
      base,
      gst,
      total,
    };
  };

  /* =========================================================
     TOTALS
  ========================================================= */

  const subtotal =
    draftItems.reduce(
      (sum, item) =>
        sum +
        calcItem(item).base,
      0
    );

  const gstTotal =
    draftItems.reduce(
      (sum, item) =>
        sum +
        calcItem(item).gst,
      0
    );

  const grandTotal =
    Math.round(
      (subtotal +
        gstTotal) *
        100
    ) / 100;

  /* =========================================================
     INVOICE PAYLOAD
  ========================================================= */

  const buildInvoicePayload =
    () => ({
      order_id:
        linkedOrderId ||
        null,

      customer_name:
        customerName.trim(),

      customer_email:
        customerEmail.trim() ||
        null,

      customer_phone:
        customerPhone.trim() ||
        null,

      customer_address:
        customerAddress.trim() ||
        null,

      customer_gst:
        customerGst.trim() ||
        null,

      customer_pan:
        customerPan.trim() ||
        null,

      place_of_supply:
        placeOfSupply.trim() ||
        null,

      invoice_date:
        invoiceDate,

      due_date:
        dueDate || null,

      subtotal:
        Math.round(
          subtotal * 100
        ) / 100,

      gst_total:
        Math.round(
          gstTotal * 100
        ) / 100,

      grand_total:
        grandTotal,

      notes:
        notes.trim() ||
        null,

      status:
        invoiceStatus,
    });

  /* =========================================================
     ITEM PAYLOAD
  ========================================================= */

  const buildItemRows = (
    invoiceId: string,
    validItems: DraftItem[]
  ) => {
    return validItems.map(
      (item) => {
        const calculation =
          calcItem(item);

        return {
          invoice_id:
            invoiceId,

          /*
           * Link catalog/inventory products to the invoice.
           *
           * Custom invoice-only items intentionally keep
           * product_id = null.
           */
          product_id:
            item.is_custom
              ? null
              : item.product_id || null,

          description:
            item.description.trim(),

          quantity:
            Math.max(
              0.01,
              safeNumber(
                item.quantity,
                1
              )
            ),

          unit:
            item.unit.trim() ||
            'PCS',

          unit_price:
            Math.max(
              0,
              safeNumber(
                item.unit_price
              )
            ),

          /*
           * THIS IS THE IMPORTANT
           * DATABASE FIELD
           */
          hsn_sac_code:
            item.hsn_sac_code.trim() ||
            null,

          gst_percentage:
            Math.min(
              100,
              Math.max(
                0,
                safeNumber(
                  item.gst_percentage,
                  18
                )
              )
            ),

          base_amount:
            Math.round(
              calculation.base *
                100
            ) / 100,

          gst_amount:
            Math.round(
              calculation.gst *
                100
            ) / 100,

          total:
            Math.round(
              calculation.total *
                100
            ) / 100,
        };
      }
    );
  };

  /* =========================================================
     GENERATE INVOICE NUMBER
     
     Uses RPC if available.
     Falls back to timestamp if RPC
     is unavailable.
  ========================================================= */

  const generateInvoiceNumber =
    async () => {
      try {
        const {
          data,
          error,
        } =
          await supabase.rpc(
            'next_invoice_number'
          );

        if (
          !error &&
          data !== null &&
          data !== undefined
        ) {
          const sequence =
            Math.max(
              1,
              safeNumber(
                data,
                1
              )
            );

          const year =
            new Date().getFullYear();

          return `INV-${year}-${String(
            sequence
          ).padStart(4, '0')}`;
        }
      } catch {
        /*
         * RPC unavailable.
         * Use fallback below.
         */
      }

      /*
       * Fallback invoice number.
       *
       * This prevents invoice creation from
       * completely failing if the RPC isn't
       * installed.
       */

      const now =
        new Date();

      const year =
        now.getFullYear();

      const month =
        String(
          now.getMonth() + 1
        ).padStart(2, '0');

      const day =
        String(
          now.getDate()
        ).padStart(2, '0');

      const time =
        String(
          now.getTime()
        ).slice(-6);

      return `INV-${year}${month}${day}-${time}`;
    };

  /* =========================================================
     VERIFY INVENTORY BEFORE SAVE

     The modal can stay open while another admin/user changes
     stock. Therefore we re-read the selected inventory products
     immediately before creating/updating the invoice.

     This also catches products that were deleted after the
     modal was opened.
  ========================================================= */

  const verifyInventoryBeforeSave = async (
    validItems: DraftItem[]
  ) => {
    const requested = new Map<string, number>();

    for (const item of validItems) {
      if (
        item.is_custom ||
        !item.product_id
      ) {
        continue;
      }

      requested.set(
        item.product_id,
        (requested.get(item.product_id) || 0) +
          Math.max(
            0.01,
            safeNumber(item.quantity, 1)
          )
      );
    }

    const productIds = Array.from(
      requested.keys()
    );

    if (productIds.length === 0) {
      return;
    }

    const {
      data,
      error: inventoryError,
    } = await supabase
      .from('products')
      .select(
        'id, name, stock, is_offline'
      )
      .in('id', productIds);

    if (inventoryError) {
      throw new Error(
        `Inventory verification failed: ${inventoryError.message}`
      );
    }

    const latestProducts =
      data || [];

    for (const [
      productId,
      requestedQty,
    ] of requested.entries()) {
      const product =
        latestProducts.find(
          (p) => p.id === productId
        );

      if (!product) {
        throw new Error(
          'A selected inventory product was deleted. Please refresh the invoice and select it again.'
        );
      }

      const available =
        safeNumber(
          product.stock
        );

      if (available <= 0) {
        throw new Error(
          `${product.name} is currently out of stock.`
        );
      }

      if (
        requestedQty >
        available
      ) {
        throw new Error(
          `${product.name} has only ${fmt(available)} in inventory, but the invoice requests ${fmt(requestedQty)}.`
        );
      }
    }
  };

  /* =========================================================
     SAVE INVOICE
  ========================================================= */

  const handleSave =
    async () => {
      setError('');

      /* CUSTOMER */

      if (
        !customerName.trim()
      ) {
        setError(
          'Customer name is required.'
        );
        return;
      }

      if (
        !customerEmail.trim()
      ) {
        setError(
          'Customer email is required.'
        );
        return;
      }

      /* ITEMS */

      const validItems =
        draftItems.filter(
          (item) =>
            item.description.trim() &&
            safeNumber(
              item.quantity
            ) > 0
        );

      if (
        validItems.length === 0
      ) {
        setError(
          'Add at least one product.'
        );
        return;
      }

      /* HSN VALIDATION */

      const invalidHsn =
        validItems.find(
          (item) =>
            !isValidHsnSac(
              item.hsn_sac_code
            )
        );

      if (
        invalidHsn
      ) {
        setError(
          `Invalid HSN/SAC code "${invalidHsn.hsn_sac_code}". Use 4, 6 or 8 digits.`
        );

        return;
      }

      setSaving(true);

      try {
        /*
         * Re-check the current inventory before saving.
         * Custom items are ignored by this check.
         */
        await verifyInventoryBeforeSave(
          validItems
        );

        /*
         * Save manually entered HSN codes
         * into master table.
         *
         * This is non-blocking.
         */

        await Promise.all(
          validItems.map(
            (item) =>
              saveHsnCodeIfNew(
                item.hsn_sac_code
              )
          )
        );

        /* ===================================================
           EDIT
        =================================================== */

        if (
          isEdit &&
          invoice
        ) {
          const {
            error:
              updateError,
          } =
            await supabase
              .from('invoices')
              .update(
                buildInvoicePayload()
              )
              .eq(
                'id',
                invoice.id
              );

          if (
            updateError
          ) {
            throw updateError;
          }

          /*
           * Remove old items.
           */

          const {
            error:
              deleteError,
          } =
            await supabase
              .from(
                'invoice_items'
              )
              .delete()
              .eq(
                'invoice_id',
                invoice.id
              );

          if (
            deleteError
          ) {
            throw deleteError;
          }

          /*
           * Insert new items.
           */

          const itemRows =
            buildItemRows(
              invoice.id,
              validItems
            );

          const {
            error:
              insertError,
          } =
            await supabase
              .from(
                'invoice_items'
              )
              .insert(
                itemRows
              );

          if (
            insertError
          ) {
            throw insertError;
          }
        }

        /* ===================================================
           CREATE
        =================================================== */

        else {
          const invoiceNumber =
            await generateInvoiceNumber();

          const {
            data:
              createdInvoice,
            error:
              invoiceError,
          } =
            await supabase
              .from('invoices')
              .insert({
                ...buildInvoicePayload(),

                invoice_number:
                  invoiceNumber,

                status:
                  invoiceStatus,
              })
              .select('id')
              .single();

          if (
            invoiceError
          ) {
            throw invoiceError;
          }

          if (
            !createdInvoice?.id
          ) {
            throw new Error(
              'Invoice was created but no invoice ID was returned.'
            );
          }

          /*
           * Insert items.
           */

          const itemRows =
            buildItemRows(
              createdInvoice.id,
              validItems
            );

          const {
            error:
              itemsError,
          } =
            await supabase
              .from(
                'invoice_items'
              )
              .insert(
                itemRows
              );

          if (
            itemsError
          ) {
            /*
             * Cleanup invoice if item
             * insertion fails.
             */

            await supabase
              .from('invoices')
              .delete()
              .eq(
                'id',
                createdInvoice.id
              );

            throw itemsError;
          }
        }

        onSaved();
      } catch (err: any) {
        console.error(
          'Invoice save error:',
          err
        );

        setError(
          err?.message ||
            'Failed to save invoice.'
        );
      } finally {
        setSaving(false);
      }
    };

  /* =========================================================
     STYLES
  ========================================================= */

  const inputCls =
    'w-full mt-1.5 px-3 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-white';

  const labelCls =
    'text-xs font-medium text-green-600 uppercase tracking-wide';

  const cardCls =
    'bg-green-50/40 rounded-2xl p-4 border border-green-100 space-y-4';

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">

      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl max-h-[94vh] flex flex-col">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex items-center justify-between px-6 py-4 border-b border-green-100 shrink-0">

          <div>
            <h3 className="font-display text-xl font-bold text-green-900">
              {isEdit
                ? `Edit ${
                    invoice?.invoice_number ||
                    'Invoice'
                  }`
                : 'Create Invoice'}
            </h3>

            <p className="text-xs text-green-500 mt-0.5">
              Products, HSN and GST are loaded
              automatically.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-1.5 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-green-500" />
          </button>

        </div>

        {/* =================================================
            BODY
        ================================================= */}

        <div className="overflow-y-auto px-6 py-5 space-y-5">

          {/* ERROR */}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* =================================================
              CUSTOMER
          ================================================= */}

          <div className={cardCls}>

            <h4 className="text-sm font-bold text-green-800">
              Customer Details
            </h4>

            {/* SAVED CUSTOMER */}

            <div className="relative">

              <label className={labelCls}>
                Saved Customer / Supplier
              </label>

              <Search className="w-4 h-4 text-green-400 absolute left-3 top-[39px] pointer-events-none" />

              <input
                type="text"
                value={
                  supplierSearch
                }
                onChange={(e) => {
                  setSupplierSearch(
                    e.target.value
                  );

                  setShowSupplierDropdown(
                    true
                  );
                }}
                onFocus={() =>
                  setShowSupplierDropdown(
                    true
                  )
                }
                onBlur={() =>
                  setTimeout(
                    () =>
                      setShowSupplierDropdown(
                        false
                      ),
                    200
                  )
                }
                className="w-full pl-10 pr-10 py-2.5 mt-1.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50"
                placeholder="Search saved customer / supplier..."
                autoComplete="off"
              />

              {selectedSupplier && (
                <CheckCircle2 className="w-4 h-4 text-green-600 absolute right-3 top-[40px]" />
              )}

              {showSupplierDropdown &&
                filteredSuppliers.length >
                  0 && (
                  <div className="absolute z-40 mt-1 w-full bg-white border border-green-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">

                    {filteredSuppliers.map(
                      (supplier) => (
                        <button
                          key={
                            supplier.id
                          }
                          type="button"
                          onMouseDown={(
                            e
                          ) =>
                            e.preventDefault()
                          }
                          onClick={() =>
                            handleSelectSupplier(
                              supplier
                            )
                          }
                          className="w-full text-left px-4 py-3 hover:bg-green-50 border-b border-green-50 last:border-0"
                        >

                          <p className="text-sm font-medium text-green-900">
                            {
                              supplier.name
                            }
                          </p>

                          <p className="text-xs text-green-500 mt-0.5">
                            {supplier.gstin ||
                              'No GSTIN'}

                            {supplier.city
                              ? ` · ${supplier.city}`
                              : ''}
                          </p>

                        </button>
                      )
                    )}

                  </div>
                )}

            </div>

            {/* CUSTOMER FIELDS */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>
                <label className={labelCls}>
                  Customer Name *
                </label>

                <input
                  type="text"
                  value={
                    customerName
                  }
                  onChange={(e) =>
                    setCustomerName(
                      e.target.value
                    )
                  }
                  className={inputCls}
                  placeholder="Company / Person name"
                />
              </div>

              <div>
                <label className={labelCls}>
                  Email *
                </label>

                <input
                  type="email"
                  value={
                    customerEmail
                  }
                  onChange={(e) =>
                    setCustomerEmail(
                      e.target.value
                    )
                  }
                  className={inputCls}
                  placeholder="customer@example.com"
                />
              </div>

              <div>
                <label className={labelCls}>
                  Phone
                </label>

                <input
                  type="text"
                  value={
                    customerPhone
                  }
                  onChange={(e) =>
                    setCustomerPhone(
                      e.target.value
                    )
                  }
                  className={inputCls}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className={labelCls}>
                  PAN
                </label>

                <input
                  type="text"
                  value={
                    customerPan
                  }
                  onChange={(e) =>
                    setCustomerPan(
                      e.target.value
                        .toUpperCase()
                    )
                  }
                  className={
                    inputCls +
                    ' uppercase'
                  }
                  placeholder="ABCDE1234F"
                  maxLength={10}
                />
              </div>

              {/* GST */}

              <div>

                <label className={labelCls}>
                  GSTIN
                </label>

                <div className="flex gap-2 mt-1.5">

                  <input
                    type="text"
                    value={
                      customerGst
                    }
                    onChange={(e) => {
                      setCustomerGst(
                        e.target.value
                          .toUpperCase()
                      );

                      setGstVerification(
                        null
                      );
                    }}
                    className="min-w-0 flex-1 px-3 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 uppercase"
                    placeholder="27ABCDE1234F1Z5"
                    maxLength={15}
                  />

                  <button
                    type="button"
                    onClick={
                      verifyCustomerGstin
                    }
                    disabled={
                      verifyingGst ||
                      !customerGst.trim()
                    }
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-green-700 border border-green-200 rounded-xl hover:bg-green-50 disabled:opacity-50"
                  >

                    {verifyingGst ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}

                    {verifyingGst
                      ? 'Checking'
                      : 'Verify'}

                  </button>

                </div>

                {gstVerification && (
                  <div
                    className={`flex items-start gap-1.5 mt-2 text-xs ${
                      gstVerification.status ===
                      'verified'
                        ? 'text-green-700'
                        : 'text-red-600'
                    }`}
                  >

                    {gstVerification.status ===
                      'verified' && (
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    )}

                    <span>
                      {
                        gstVerification.message
                      }
                    </span>

                  </div>
                )}

              </div>

              <div>

                <label className={labelCls}>
                  Place of Supply
                </label>

                <input
                  type="text"
                  value={
                    placeOfSupply
                  }
                  onChange={(e) =>
                    setPlaceOfSupply(
                      e.target.value
                    )
                  }
                  className={inputCls}
                  placeholder="07 - Delhi"
                />

              </div>

            </div>

            {/* ADDRESS */}

            <div>

              <label className={labelCls}>
                Billing Address
              </label>

              <textarea
                value={
                  customerAddress
                }
                onChange={(e) =>
                  setCustomerAddress(
                    e.target.value
                  )
                }
                rows={3}
                className={
                  inputCls +
                  ' resize-none'
                }
                placeholder="Complete billing address"
              />

            </div>

          </div>

          {/* =================================================
              INVOICE DETAILS
          ================================================= */}

          <div className={cardCls}>

            <h4 className="text-sm font-bold text-green-800">
              Invoice Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              <div>

                <label className={labelCls}>
                  Invoice Number
                </label>

                <input
                  type="text"
                  value={
                    invoice?.invoice_number ||
                    'Auto generated'
                  }
                  disabled
                  className={
                    inputCls +
                    ' bg-green-50 text-green-600'
                  }
                />

              </div>

              <div>

                <label className={labelCls}>
                  Invoice Date
                </label>

                <input
                  type="date"
                  value={
                    invoiceDate
                  }
                  onChange={(e) =>
                    setInvoiceDate(
                      e.target.value
                    )
                  }
                  className={inputCls}
                />

              </div>

              <div>

                <label className={labelCls}>
                  Due Date
                </label>

                <input
                  type="date"
                  value={
                    dueDate
                  }
                  onChange={(e) =>
                    setDueDate(
                      e.target.value
                    )
                  }
                  className={inputCls}
                />

              </div>

              <div>

                <label className={labelCls}>
                  Status
                </label>

                <select
                  value={
                    invoiceStatus
                  }
                  onChange={(e) =>
                    setInvoiceStatus(
                      e.target
                        .value as InvoiceStatus
                    )
                  }
                  className={inputCls}
                >

                  <option value="draft">
                    Draft
                  </option>

                  <option value="pending">
                    Pending
                  </option>

                  <option value="sent">
                    Sent
                  </option>

                  <option value="paid">
                    Paid
                  </option>

                  <option value="cancelled">
                    Cancelled
                  </option>

                </select>

              </div>

            </div>

          </div>

          {/* =================================================
              PRODUCTS
          ================================================= */}

          <div className={cardCls}>

            <div className="flex items-center justify-between">

              <div>

                <h4 className="text-sm font-bold text-green-800">
                  Products / Line Items
                </h4>

                <p className="text-[11px] text-green-500 mt-0.5">
                  Select a product to automatically
                  fill price, GST and HSN.
                </p>

              </div>

              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-900"
              >

                <Plus className="w-3.5 h-3.5" />

                Add Item

              </button>

            </div>

            <div className="space-y-3">

              {draftItems.map(
                (
                  item,
                  index
                ) => {

                  const calculation =
                    calcItem(
                      item
                    );

                  return (
                    <div
                      key={
                        item.id ||
                        `draft-${index}`
                      }
                      className="bg-white rounded-xl p-3 border border-green-100"
                    >

                      {/* PRODUCT SEARCH */}

                      <div
                        className="relative"
                        ref={
                          activeProductIndex ===
                          index
                            ? productSearchRef
                            : null
                        }
                      >

                        <div className="flex gap-2">

                          <div className="relative flex-1">

                            <Package className="w-4 h-4 text-green-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />

                            <input
                              type="text"
                              value={
                                activeProductIndex ===
                                index
                                  ? productSearch
                                  : item.description
                              }
                              onFocus={() => {
                                setActiveProductIndex(
                                  index
                                );

                                setProductSearch(
                                  ''
                                );
                              }}
                              onChange={(e) => {
                                setActiveProductIndex(
                                  index
                                );

                                setProductSearch(
                                  e.target.value
                                );
                              }}
                              placeholder={
                                item.is_custom
                                  ? 'Enter custom product / service name...'
                                  : 'Search product by name, category or HSN...'
                              }
                              className="w-full pl-10 pr-9 py-2.5 text-sm border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                              autoComplete="off"
                            />

                            <ChevronDown className="w-3.5 h-3.5 text-green-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeItem(
                                index
                              )
                            }
                            className="p-2 text-green-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                        </div>

                        {/* PRODUCT DROPDOWN */}

                        {activeProductIndex ===
                          index && (
                          <div className="absolute z-40 left-0 right-10 mt-1 bg-white border border-green-200 rounded-xl shadow-xl overflow-hidden">

                            <div className="px-3 py-2 bg-green-50 border-b border-green-100">

                              <p className="text-[11px] font-medium text-green-700">
                                Select a catalog product or create an invoice-only item
                              </p>

                            </div>

                            {/* CUSTOM PRODUCT / SERVICE */}

                            <button
                              type="button"
                              onMouseDown={(e) =>
                                e.preventDefault()
                              }
                              onClick={() =>
                                handleAddCustomProduct(
                                  index
                                )
                              }
                              className="w-full text-left px-3 py-3 bg-white hover:bg-green-50 border-b border-green-200"
                            >
                              <div className="flex items-center gap-3">

                                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                                  <Plus className="w-4 h-4 text-green-700" />
                                </div>

                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-green-800">
                                    Add Custom Product / Service
                                  </p>
                                  <p className="text-[10px] text-green-500 mt-0.5">
                                    Invoice-only item — it will not be added to your product catalog
                                  </p>
                                </div>

                              </div>
                            </button>

                            <div className="max-h-64 overflow-y-auto">

                              {productsLoading ? (

                                <div className="flex items-center justify-center gap-2 py-8 text-xs text-green-600">

                                  <Loader2 className="w-4 h-4 animate-spin" />

                                  Loading products...

                                </div>

                              ) : filteredProducts.length ===
                                0 ? (

                                <div className="py-8 text-center">

                                  <Package className="w-7 h-7 text-green-200 mx-auto mb-2" />

                                  <p className="text-xs text-green-500">
                                    No matching catalog product found.
                                  </p>

                                  <p className="text-[10px] text-green-400 mt-1">
                                    Use the custom option above for a one-time item.
                                  </p>

                                </div>

                              ) : (

                                filteredProducts
                                  .slice(
                                    0,
                                    30
                                  )
                                  .map(
                                    (
                                      product
                                    ) => {

                                      const hsn =
                                        getProductHsn(
                                          product
                                        );

                                      const category =
                                        getProductCategoryName(
                                          product
                                        );

                                      return (
                                        <button
                                          key={
                                            product.id
                                          }
                                          type="button"
                                          onMouseDown={(
                                            e
                                          ) =>
                                            e.preventDefault()
                                          }
                                          onClick={() =>
                                            handleSelectProduct(
                                              product,
                                              index
                                            )
                                          }
                                          className="w-full text-left px-3 py-3 hover:bg-green-50 border-b border-green-50 last:border-0"
                                        >

                                          <div className="flex items-center justify-between gap-3">

                                            <div className="min-w-0">

                                              <p className="text-sm font-medium text-green-900 truncate">
                                                {
                                                  product.name
                                                }
                                              </p>

                                              <div className="flex items-center gap-2 mt-1">

                                                {category && (
                                                  <span className="text-[10px] text-green-500">
                                                    {
                                                      category
                                                    }
                                                  </span>
                                                )}

                                                {hsn && (
                                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-mono">
                                                    HSN{' '}
                                                    {
                                                      hsn
                                                    }
                                                  </span>
                                                )}

                                                <span className="text-[10px] text-green-500">
                                                  GST{' '}
                                                  {
                                                    safeNumber(
                                                      product.gst_percentage,
                                                      18
                                                    )
                                                  }
                                                  %
                                                </span>

                                              </div>

                                            </div>

                                            <div className="shrink-0 text-right">

                                              <p className="text-sm font-semibold text-green-900">
                                                ₹
                                                {fmt(
                                                  safeNumber(
                                                    product.price
                                                  )
                                                )}
                                              </p>

                                              <p className="text-[10px] text-green-500 mt-0.5">
                                                Stock: {safeNumber(product.stock)}
                                                {product.is_offline
                                                  ? ' · Offline'
                                                  : ''}
                                              </p>

                                            </div>

                                          </div>

                                        </button>
                                      );
                                    }
                                  )

                              )}

                            </div>

                          </div>
                        )}

                      </div>

                      {/* ITEM TYPE */}

                      {(item.product_id || item.is_custom) && (
                        <div className="flex flex-wrap items-center gap-2 mt-2">

                          <span
                            className={`text-[10px] px-2 py-1 rounded-md border ${
                              item.is_custom
                                ? 'bg-amber-50 border-amber-200 text-amber-700'
                                : 'bg-green-50 border-green-100 text-green-600'
                            }`}
                          >
                            {item.is_custom
                              ? 'Custom invoice item'
                              : 'Catalog product selected'}
                          </span>

                          {item.is_custom && (
                            <span className="text-[10px] text-amber-600">
                              Not saved to product catalog
                            </span>
                          )}

                          {item.hsn_sac_code && (
                            <span className="text-[10px] px-2 py-1 rounded-md bg-green-100 border border-green-200 text-green-700 font-mono font-medium">
                              HSN/SAC:{' '}
                              {
                                item.hsn_sac_code
                              }
                            </span>
                          )}

                          <span className="text-[10px] text-green-500">
                            GST{' '}
                            {
                              item.gst_percentage
                            }
                            %
                          </span>

                        </div>
                      )}

                      {/* CUSTOM ITEM DETAILS */}

                      {item.is_custom && (
                        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                          <p className="text-[11px] font-medium text-amber-800">
                            Custom Product / Service
                          </p>
                          <p className="text-[10px] text-amber-700 mt-0.5">
                            Enter the description, HSN/SAC, quantity, rate and GST manually.
                            This line is stored only on this invoice.
                          </p>
                        </div>
                      )}

                      {/* ITEM CONTROLS */}

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">

                        {/* HSN */}

                        <div className="relative">

                          <label className="text-[10px] text-green-500">
                            HSN / SAC
                          </label>

                          <HsnCodeInput
                            value={
                              item.hsn_sac_code
                            }
                            codes={
                              hsnCodes
                            }
                            loading={
                              hsnLoading
                            }
                            onChange={(
                              value
                            ) =>
                              updateItem(
                                index,
                                'hsn_sac_code',
                                value
                              )
                            }
                            onSelect={(
                              hsn
                            ) => {
                              updateItem(
                                index,
                                'hsn_sac_code',
                                hsn.code
                              );
                            }}
                            onSave={(
                              value
                            ) =>
                              saveHsnCodeIfNew(
                                value
                              )
                            }
                          />

                        </div>

                        {/* UNIT */}

                        <div>

                          <label className="text-[10px] text-green-500">
                            Unit
                          </label>

                          <select
                            value={
                              item.unit
                            }
                            onChange={(
                              e
                            ) =>
                              updateItem(
                                index,
                                'unit',
                                e.target
                                  .value
                              )
                            }
                            className="w-full mt-1 px-2 py-2 text-sm border border-green-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
                          >

                            <option value="PCS">
                              PCS
                            </option>

                            <option value="NOS">
                              NOS
                            </option>

                            <option value="KG">
                              KG
                            </option>

                            <option value="GM">
                              GM
                            </option>

                            <option value="LTR">
                              LTR
                            </option>

                            <option value="MTR">
                              MTR
                            </option>

                            <option value="BOX">
                              BOX
                            </option>

                            <option value="SET">
                              SET
                            </option>

                          </select>

                        </div>

                        {/* QTY */}

                        <div>

                          <label className="text-[10px] text-green-500">
                            Quantity
                          </label>

                          <input
                            type="number"
                            value={
                              item.quantity
                            }
                            min={0.01}
                            step="0.01"
                            onChange={(
                              e
                            ) =>
                              updateItem(
                                index,
                                'quantity',
                                e.target
                                  .value
                              )
                            }
                            className="w-full mt-1 px-2 py-2 text-sm border border-green-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-green-400"
                          />

                        </div>

                        {/* RATE */}

                        <div>

                          <label className="text-[10px] text-green-500">
                            Rate
                          </label>

                          <input
                            type="number"
                            value={
                              item.unit_price
                            }
                            min={0}
                            step="0.01"
                            onChange={(
                              e
                            ) =>
                              updateItem(
                                index,
                                'unit_price',
                                e.target
                                  .value
                              )
                            }
                            className="w-full mt-1 px-2 py-2 text-sm border border-green-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-green-400"
                          />

                        </div>

                        {/* GST */}

                        <div>

                          <label className="text-[10px] text-green-500">
                            GST %
                          </label>

                          <input
                            type="number"
                            value={
                              item.gst_percentage
                            }
                            min={0}
                            max={100}
                            step="0.01"
                            onChange={(
                              e
                            ) =>
                              updateItem(
                                index,
                                'gst_percentage',
                                e.target
                                  .value
                              )
                            }
                            className="w-full mt-1 px-2 py-2 text-sm border border-green-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-green-400"
                          />

                        </div>

                      </div>

                      {/* ITEM TOTAL */}

                      <div className="flex justify-end mt-2 pt-2 border-t border-green-50">

                        <div className="text-right">

                          <span className="text-[10px] text-green-500">

                            Taxable ₹
                            {fmt(
                              calculation.base
                            )}

                            {' · '}

                            GST ₹
                            {fmt(
                              calculation.gst
                            )}

                          </span>

                          <p className="text-sm font-bold text-green-900">

                            Total ₹
                            {fmt(
                              calculation.total
                            )}

                          </p>

                        </div>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          </div>

          {/* =================================================
              TOTALS
          ================================================= */}

          <div className={cardCls}>

            <h4 className="text-sm font-bold text-green-800">
              Invoice Totals
            </h4>

            <div className="bg-white rounded-xl p-4 border border-green-100">

              <div className="ml-auto max-w-sm space-y-2">

                <div className="flex justify-between text-sm text-green-700">

                  <span>
                    Subtotal
                  </span>

                  <span>
                    ₹
                    {fmt(
                      subtotal
                    )}
                  </span>

                </div>

                <div className="flex justify-between text-sm text-green-600">

                  <span>
                    GST Total
                  </span>

                  <span>
                    ₹
                    {fmt(
                      gstTotal
                    )}
                  </span>

                </div>

                <div className="flex justify-between font-bold text-green-900 pt-2 border-t border-green-200 text-lg">

                  <span>
                    Grand Total
                  </span>

                  <span>
                    ₹
                    {fmt(
                      grandTotal
                    )}
                  </span>

                </div>

              </div>

            </div>

          </div>

          {/* =================================================
              NOTES
          ================================================= */}

          <div className={cardCls}>

            <h4 className="text-sm font-bold text-green-800">
              Notes
            </h4>

            <textarea
              value={notes}
              onChange={(e) =>
                setNotes(
                  e.target.value
                )
              }
              rows={3}
              className={
                inputCls +
                ' resize-none'
              }
              placeholder="Additional information..."
            />

          </div>

          {/* =================================================
              LINK ORDER
          ================================================= */}

          {orders.length > 0 && (
            <div className={cardCls}>

              <h4 className="text-sm font-bold text-green-800">
                Link Order
              </h4>

              <select
                value={
                  linkedOrderId
                }
                onChange={(e) =>
                  handleLinkOrder(
                    e.target.value
                  )
                }
                className={inputCls}
              >

                <option value="">
                  No linked order
                </option>

                {orders.map(
                  (order) => (
                    <option
                      key={
                        order.id
                      }
                      value={
                        order.id
                      }
                    >
                      {
                        order.customer_name
                      }{' '}
                      -{' '}
                      {
                        order.product_name
                      }
                    </option>
                  )
                )}

              </select>

            </div>
          )}

        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="px-6 py-4 border-t border-green-100 flex gap-3 shrink-0">

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2.5 border border-green-200 text-green-700 rounded-xl text-sm font-medium hover:bg-green-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-green-800 text-white rounded-xl text-sm font-medium hover:bg-green-600 disabled:opacity-50"
          >

            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}

            {isEdit
              ? 'Update Invoice'
              : 'Create Invoice'}

          </button>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   HSN CODE INPUT
========================================================= */

function HsnCodeInput({
  value,
  codes,
  loading,
  onChange,
  onSelect,
  onSave,
}: HsnInputProps & {
  loading: boolean;
}) {
  const [open, setOpen] =
    useState(false);

  const wrapperRef =
    useRef<HTMLDivElement | null>(
      null
    );

  /* =======================================================
     CLOSE DROPDOWN
  ======================================================= */

  useEffect(() => {
    const handleClickOutside =
      (event: MouseEvent) => {
        if (
          wrapperRef.current &&
          !wrapperRef.current.contains(
            event.target as Node
          )
        ) {
          setOpen(false);
        }
      };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  /* =======================================================
     FILTER HSN
  ======================================================= */

  const query =
    value
      .trim()
      .toLowerCase();

  const filtered =
    codes.filter(
      (hsn) =>
        hsn.code
          .toLowerCase()
          .includes(query) ||
        (
          hsn.description ||
          ''
        )
          .toLowerCase()
          .includes(query)
    );

  /* =======================================================
     CHANGE
  ======================================================= */

  const handleChange = (
    inputValue: string
  ) => {
    const cleaned =
      inputValue
        .replace(
          /\D/g,
          ''
        )
        .slice(0, 8);

    onChange(cleaned);

    setOpen(true);
  };

  /* =======================================================
     BLUR / SAVE
  ======================================================= */

  const handleBlurSave =
    () => {
      const cleaned =
        value
          .replace(
            /\D/g,
            ''
          )
          .slice(0, 8);

      if (
        cleaned &&
        isValidHsnSac(
          cleaned
        )
      ) {
        onSave(cleaned);
      }
    };

  return (
    <div
      ref={wrapperRef}
      className="relative mt-1"
    >

      <div className="relative">

        <input
          type="text"
          value={value}
          onChange={(e) =>
            handleChange(
              e.target.value
            )
          }
          onFocus={() =>
            setOpen(true)
          }
          onBlur={() => {
            /*
             * Delay so clicking an option
             * still works.
             */
            setTimeout(
              handleBlurSave,
              150
            );
          }}
          placeholder="Search HSN"
          inputMode="numeric"
          maxLength={8}
          className="w-full px-2 py-2 pr-7 text-sm border border-green-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-green-400"
          autoComplete="off"
        />

        <ChevronDown
          className={`w-3 h-3 text-green-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none transition-transform ${
            open
              ? 'rotate-180'
              : ''
          }`}
        />

      </div>

      {/* DROPDOWN */}

      {open && (
        <div className="absolute z-[70] left-0 right-0 mt-1 bg-white border border-green-200 rounded-xl shadow-xl overflow-hidden min-w-[240px]">

          {/* HEADER */}

          <div className="px-3 py-2 bg-green-50 border-b border-green-100">

            <p className="text-[10px] font-semibold text-green-700 uppercase tracking-wide">
              Saved HSN Codes
            </p>

          </div>

          {/* LOADING */}

          {loading ? (

            <div className="flex items-center justify-center gap-2 py-6 text-xs text-green-600">

              <Loader2 className="w-4 h-4 animate-spin" />

              Loading HSN codes...

            </div>

          ) : filtered.length > 0 ? (

            <div className="max-h-52 overflow-y-auto">

              {filtered.map(
                (hsn) => (
                  <button
                    key={
                      hsn.id
                    }
                    type="button"
                    onMouseDown={(
                      e
                    ) =>
                      e.preventDefault()
                    }
                    onClick={() => {
                      onSelect(
                        hsn
                      );

                      setOpen(
                        false
                      );
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-green-50 border-b border-green-50 last:border-0"
                  >

                    <div className="flex items-center justify-between gap-2">

                      <span className="font-mono font-semibold text-green-900 text-xs">
                        {
                          hsn.code
                        }
                      </span>

                      {hsn.description && (
                        <span className="text-[10px] text-green-500 truncate">
                          {
                            hsn.description
                          }
                        </span>
                      )}

                    </div>

                  </button>
                )
              )}

            </div>

          ) : (

            <div className="py-5 px-3 text-center">

              <p className="text-xs text-green-500">
                No saved HSN found.
              </p>

              {value && (
                <p className="text-[10px] text-green-400 mt-1">
                  Valid code will be saved when
                  you leave this field.
                </p>
              )}

            </div>

          )}

        </div>
      )}

    </div>
  );
}