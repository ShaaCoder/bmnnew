'use client';

import { useEffect, useState } from 'react';
import {
  supabase,
  type PurchaseOrder,
  type Supplier,
  type Product,
  type HsnCode,
} from '@/lib/supabase';

import {
  Plus,
  Trash2,
  Loader as Loader2,
  X,
  Package,
  ChevronDown,
  ChevronRight,
  Search,
  Save,
  Pencil,
  Eye,
  CheckCircle2,
} from 'lucide-react';

type ItemRow = {
  product_id: string;
  description: string;
  barcode_no: string;
  quantity: number;
  uom: string;
  unit_price: number;
  gst_percentage: number;
  hsn_sac_code: string;
  discount_value: number;
  discount_type: 'amount' | 'percentage';
  item_note: string;
};

const emptyItem: ItemRow = {
  product_id: '',
  description: '',
  barcode_no: '',
  quantity: 1,
  uom: 'NOS',
  unit_price: 0,
  gst_percentage: 0,
  hsn_sac_code: '',
  discount_value: 0,
  discount_type: 'amount',
  item_note: '',
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  received: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const fmt = (n: number) =>
  Number(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const today = () => new Date().toISOString().slice(0, 10);

export default function AdminPurchases() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [hsnCodes, setHsnCodes] = useState<HsnCode[]>([]);

  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [saving, setSaving] = useState(false);
  const [receiving, setReceiving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [pageError, setPageError] = useState('');

  // ============================================================
  // MODALS
  // ============================================================

  const [showForm, setShowForm] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);

  // ============================================================
  // FORM
  // ============================================================

  const [supplierId, setSupplierId] = useState('');
  const [invoiceType, setInvoiceType] = useState('Regular');

  const [orderDate, setOrderDate] = useState(today());
  const [expectedDate, setExpectedDate] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ItemRow[]>([{ ...emptyItem }]);

  // Vendor
  const [vendorAddress, setVendorAddress] = useState('');
  const [vendorContactPerson, setVendorContactPerson] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorGstinPan, setVendorGstinPan] = useState('');
  const [placeOfSupply, setPlaceOfSupply] = useState('');
  const [reverseCharge, setReverseCharge] = useState('No');
  const [shipTo, setShipTo] = useState('');

  // Purchase invoice
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [challanNo, setChallanNo] = useState('');
  const [challanDate, setChallanDate] = useState('');
  const [lrNo, setLrNo] = useState('');
  const [ewayNo, setEwayNo] = useState('');
  const [deliveryMode, setDeliveryMode] = useState('');

  // Commercial
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState('amount');

  const [tcsValue, setTcsValue] = useState(0);
  const [tcsType, setTcsType] = useState('percentage');

  const [roundOff, setRoundOff] = useState(0);
  const [paymentType, setPaymentType] = useState('Credit');

  const [termsTitle, setTermsTitle] = useState('');
  const [termsDetail, setTermsDetail] = useState('');
  const [documentNotes, setDocumentNotes] = useState('');

  const [updateProductPrice, setUpdateProductPrice] = useState(false);

  // ============================================================
  // LOAD DATA
  // ============================================================

  const load = async () => {
    setLoading(true);
    setPageError('');

    try {
      const [
        { data: po, error: poError },
        { data: sup, error: supplierError },
        { data: prod, error: productError },
        { data: hsn, error: hsnError },
      ] = await Promise.all([
        supabase
          .from('purchase_orders')
          .select(
            `
              *,
              suppliers(*),
              purchase_order_items(*)
            `
          )
          .order('created_at', { ascending: false }),

        supabase
          .from('suppliers')
          .select('*')
          .order('name', { ascending: true }),

        supabase
          .from('products')
          .select('*')
          .order('name', { ascending: true }),

        supabase
          .from('hsn_codes')
          .select('*')
          .order('code', { ascending: true }),
      ]);

      if (poError) {
        throw new Error(
          poError.message ||
            'Could not load purchase orders. Make sure purchase_orders exists in Supabase.'
        );
      }

      if (supplierError) {
        throw new Error(supplierError.message);
      }

      if (productError) {
        throw new Error(productError.message);
      }

      if (hsnError) {
        // HSN table should not stop the whole purchase page.
        console.warn('HSN codes could not be loaded:', hsnError.message);
      }

      setOrders((po as PurchaseOrder[]) || []);
      setSuppliers((sup as Supplier[]) || []);
      setProducts((prod as Product[]) || []);
      setHsnCodes((hsn as HsnCode[]) || []);
    } catch (err: any) {
      console.error('Purchase order load error:', err);

      setPageError(
        err?.message ||
          'Failed to load purchase orders. Please check your Supabase tables.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ============================================================
  // CALCULATIONS
  // ============================================================

  const calcItem = (item: ItemRow) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unit_price) || 0;
    const discountValue = Number(item.discount_value) || 0;
    const gstPercentage = Number(item.gst_percentage) || 0;

    const gross = quantity * unitPrice;

    const itemDiscount =
      item.discount_type === 'percentage'
        ? (gross * discountValue) / 100
        : discountValue;

    const base = Math.max(0, gross - itemDiscount);

    const gst = (base * gstPercentage) / 100;

    const total = base + gst;

    return {
      gross,
      discount: itemDiscount,
      base,
      gst,
      total,
    };
  };

  const subtotal = items.reduce(
    (sum, item) => sum + calcItem(item).base,
    0
  );

  const gstTotal = items.reduce(
    (sum, item) => sum + calcItem(item).gst,
    0
  );

  const invoiceDiscount =
    discountType === 'percentage'
      ? (subtotal * Number(discountValue || 0)) / 100
      : Number(discountValue || 0);

  const taxableAfterDiscount = Math.max(
    0,
    subtotal - invoiceDiscount
  );

  const tcsAmount =
    tcsType === 'percentage'
      ? (taxableAfterDiscount * Number(tcsValue || 0)) / 100
      : Number(tcsValue || 0);

  const grandTotal =
    Math.round(
      (
        taxableAfterDiscount +
        gstTotal +
        tcsAmount +
        Number(roundOff || 0)
      ) * 100
    ) / 100;

  // ============================================================
  // ITEM UPDATE
  // ============================================================

  const updateItem = (
    idx: number,
    field: keyof ItemRow,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;

        const updated: ItemRow = {
          ...item,
          [field]: value,
        };

        // ======================================================
        // PRODUCT SELECTED
        // Automatically fill:
        // Product Name
        // Price
        // GST
        // HSN
        // UOM
        // Barcode
        // ======================================================

        if (field === 'product_id' && typeof value === 'string') {
          const product = products.find((p) => p.id === value);

          if (product) {
            updated.description = product.name || '';

            updated.unit_price =
              Number(product.price) || 0;

            updated.gst_percentage =
              Number(product.gst_percentage) || 0;

            // ==================================================
            // AUTOMATIC HSN
            // ==================================================
            // Product HSN is stored in products.hsn_code.
            // Convert it to String so numeric HSN values also work.
            updated.hsn_sac_code =
              product.hsn_code !== null &&
              product.hsn_code !== undefined
                ? String(product.hsn_code)
                : '';

            // ==================================================
            // AUTOMATIC UOM
            // ==================================================
            updated.uom =
              product.uom || 'NOS';

            // ==================================================
            // AUTOMATIC BARCODE
            // ==================================================
            updated.barcode_no =
              product.barcode !== null &&
              product.barcode !== undefined
                ? String(product.barcode)
                : '';
          } else {
            // Custom item
            updated.description = '';
            updated.unit_price = 0;
            updated.gst_percentage = 0;
            updated.hsn_sac_code = '';
            updated.uom = 'NOS';
            updated.barcode_no = '';
          }
        }

        return updated;
      })
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        ...emptyItem,
      },
    ]);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => {
      const next = prev.filter((_, i) => i !== idx);

      return next.length > 0
        ? next
        : [{ ...emptyItem }];
    });
  };

  // ============================================================
  // SUPPLIER
  // ============================================================

  const fillVendorFromSupplier = (id: string) => {
    setSupplierId(id);

    const supplier = suppliers.find(
      (s) => s.id === id
    );

    if (!supplier) {
      setVendorAddress('');
      setVendorContactPerson('');
      setVendorPhone('');
      setVendorGstinPan('');
      setPlaceOfSupply('');
      return;
    }

    const fullAddress = [
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

    setVendorAddress(fullAddress || '');

    setVendorContactPerson(
      supplier.contact_person || ''
    );

    setVendorPhone(
      supplier.phone || ''
    );

    setVendorGstinPan(
      [supplier.gstin, supplier.pan]
        .filter(Boolean)
        .join(' / ') || ''
    );

    setPlaceOfSupply(
      supplier.state || ''
    );
  };

  // ============================================================
  // RESET FORM
  // ============================================================

  const resetForm = () => {
    setEditingPO(null);

    setSupplierId('');
    setInvoiceType('Regular');

    setOrderDate(today());
    setExpectedDate('');
    setDueDate('');

    setNotes('');
    setItems([{ ...emptyItem }]);

    setVendorAddress('');
    setVendorContactPerson('');
    setVendorPhone('');
    setVendorGstinPan('');
    setPlaceOfSupply('');
    setReverseCharge('No');
    setShipTo('');

    setInvoiceNo('');
    setInvoiceDate('');
    setChallanNo('');
    setChallanDate('');
    setLrNo('');
    setEwayNo('');
    setDeliveryMode('');

    setDiscountValue(0);
    setDiscountType('amount');

    setTcsValue(0);
    setTcsType('percentage');

    setRoundOff(0);
    setPaymentType('Credit');

    setTermsTitle('');
    setTermsDetail('');
    setDocumentNotes('');

    setUpdateProductPrice(false);

    setError('');
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  // ============================================================
  // EDIT
  // ============================================================

  const openEdit = (po: PurchaseOrder) => {
    setEditingPO(po);

    setSupplierId(
      po.supplier_id || ''
    );

    setInvoiceType(
      po.invoice_type || 'Regular'
    );

    setOrderDate(
      po.order_date || today()
    );

    setExpectedDate(
      po.expected_date || ''
    );

    setDueDate(
      po.due_date || ''
    );

    setNotes(
      po.notes || ''
    );

    setVendorAddress(
      po.vendor_address || ''
    );

    setVendorContactPerson(
      po.vendor_contact_person || ''
    );

    setVendorPhone(
      po.vendor_phone || ''
    );

    setVendorGstinPan(
      po.vendor_gstin_pan || ''
    );

    setPlaceOfSupply(
      po.place_of_supply || ''
    );

    setReverseCharge(
      po.reverse_charge || 'No'
    );

    setShipTo(
      po.ship_to || ''
    );

    setInvoiceNo(
      po.invoice_no || ''
    );

    setInvoiceDate(
      po.invoice_date || ''
    );

    setChallanNo(
      po.challan_no || ''
    );

    setChallanDate(
      po.challan_date || ''
    );

    setLrNo(
      po.lr_no || ''
    );

    setEwayNo(
      po.eway_no || ''
    );

    setDeliveryMode(
      po.delivery_mode || ''
    );

    setDiscountValue(
      Number(po.discount_value) || 0
    );

    setDiscountType(
      po.discount_type || 'amount'
    );

    setTcsValue(
      Number(po.tcs_value) || 0
    );

    setTcsType(
      po.tcs_type || 'percentage'
    );

    setRoundOff(
      Number(po.round_off) || 0
    );

    setPaymentType(
      po.payment_type || 'Credit'
    );

    setTermsTitle(
      po.terms_title || ''
    );

    setTermsDetail(
      po.terms_detail || ''
    );

    setDocumentNotes(
      po.document_notes || ''
    );

    setUpdateProductPrice(
      Boolean(po.update_product_price)
    );

    // IMPORTANT:
    // Do not use `items.length` immediately after setItems().
    // React state updates are asynchronous.
    const existingItems: ItemRow[] = (
  po.purchase_order_items || []
).map((item): ItemRow => ({
  product_id: item.product_id || '',
  description: item.description || '',
  barcode_no: item.barcode_no || '',
  quantity: Number(item.quantity) || 1,
  uom: item.uom || 'NOS',
  unit_price: Number(item.unit_price) || 0,
  gst_percentage: Number(item.gst_percentage) || 0,
  hsn_sac_code: item.hsn_sac_code || '',
  discount_value: Number(item.discount_value) || 0,

  // IMPORTANT:
  // Explicitly return the required union type
  discount_type:
    item.discount_type === 'percentage'
      ? 'percentage'
      : 'amount',

  item_note: item.item_note || '',
}));

setItems(
  existingItems.length > 0
    ? existingItems
    : [{ ...emptyItem }]
);

    setError('');
    setShowForm(true);
  };

  // ============================================================
  // PAYLOAD
  // ============================================================

  const buildPayload = () => ({
    supplier_id:
      supplierId || null,

    invoice_type:
      invoiceType,

    order_date:
      orderDate,

    expected_date:
      expectedDate || null,

    due_date:
      dueDate || null,

    vendor_address:
      vendorAddress || null,

    vendor_contact_person:
      vendorContactPerson || null,

    vendor_phone:
      vendorPhone || null,

    vendor_gstin_pan:
      vendorGstinPan || null,

    reverse_charge:
      reverseCharge,

    ship_to:
      shipTo || null,

    place_of_supply:
      placeOfSupply || null,

    invoice_no:
      invoiceNo || null,

    invoice_date:
      invoiceDate || null,

    challan_no:
      challanNo || null,

    challan_date:
      challanDate || null,

    lr_no:
      lrNo || null,

    eway_no:
      ewayNo || null,

    delivery_mode:
      deliveryMode || null,

    terms_title:
      termsTitle || null,

    terms_detail:
      termsDetail || null,

    document_notes:
      documentNotes || null,

    tcs_value:
      Number(tcsValue || 0),

    tcs_type:
      tcsType,

    discount_value:
      Number(discountValue || 0),

    discount_type:
      discountType,

    round_off:
      Number(roundOff || 0),

    payment_type:
      paymentType,

    update_product_price:
      updateProductPrice,

    subtotal:
      Number(subtotal.toFixed(2)),

    gst_total:
      Number(gstTotal.toFixed(2)),

    grand_total:
      Number(grandTotal.toFixed(2)),

    notes:
      notes.trim() || null,
  });

  // ============================================================
  // CREATE / UPDATE PO
  // ============================================================

  const handleSave = async () => {
    const validItems = items.filter(
      (item) =>
        item.description.trim() &&
        Number(item.quantity) > 0
    );

    if (validItems.length === 0) {
      setError(
        'Add at least one item with a description.'
      );
      return;
    }

    setSaving(true);
    setError('');

    let createdPOId: string | null = null;

    try {
      // ========================================================
      // PREPARE ITEMS
      // ========================================================

      const poItems = validItems.map((item) => {
        const calculation =
          calcItem(item);

        return {
          purchase_order_id:
            editingPO?.id || '',

          product_id:
            item.product_id || null,

          description:
            item.description.trim(),

          barcode_no:
            item.barcode_no || null,

          quantity:
            Number(item.quantity) || 1,

          uom:
            item.uom || 'NOS',

          unit_price:
            Number(item.unit_price) || 0,

          gst_percentage:
            Number(item.gst_percentage) || 0,

          // ⭐ HSN SAVED HERE
          hsn_sac_code:
            item.hsn_sac_code || null,

          item_note:
            item.item_note || null,

          discount_value:
            Number(item.discount_value) || 0,

          discount_type:
            item.discount_type,

          base_amount:
            Number(calculation.base.toFixed(2)),

          gst_amount:
            Number(calculation.gst.toFixed(2)),

          total:
            Number(calculation.total.toFixed(2)),
        };
      });

      // ========================================================
      // UPDATE EXISTING PO
      // ========================================================

      if (editingPO) {
        const { error: poError } =
          await supabase
            .from('purchase_orders')
            .update(buildPayload())
            .eq('id', editingPO.id);

        if (poError) {
          throw poError;
        }

        const {
          error: deleteError,
        } = await supabase
          .from('purchase_order_items')
          .delete()
          .eq(
            'purchase_order_id',
            editingPO.id
          );

        if (deleteError) {
          throw deleteError;
        }

        const itemsForInsert =
          poItems.map((item) => ({
            ...item,
            purchase_order_id:
              editingPO.id,
          }));

        const {
          error: itemsError,
        } = await supabase
          .from('purchase_order_items')
          .insert(itemsForInsert);

        if (itemsError) {
          throw itemsError;
        }

        // Update product prices if enabled
        if (updateProductPrice) {
          for (const item of validItems) {
            if (!item.product_id) continue;

            const {
              error: priceError,
            } = await supabase
              .from('products')
              .update({
                price:
                  Number(item.unit_price) || 0,
              })
              .eq(
                'id',
                item.product_id
              );

            if (priceError) {
              console.error(
                'Product price update error:',
                priceError
              );
            }
          }
        }
      }

      // ========================================================
      // CREATE NEW PO
      // ========================================================

      else {
        let poNumber = '';

        // First try RPC
        const {
          data: generatedNumber,
          error: rpcError,
        } = await supabase.rpc(
          'get_next_po_number'
        );

        if (!rpcError && generatedNumber) {
          poNumber =
            String(generatedNumber);
        }

        // Fallback PO number
        if (!poNumber) {
          const lastPO =
            orders.length > 0
              ? orders[0]
              : null;

          let nextNumber = 1;

          if (
            lastPO?.po_number
          ) {
            const match =
              lastPO.po_number.match(
                /(\d+)$/
              );

            if (match) {
              nextNumber =
                Number(match[1]) + 1;
            }
          }

          poNumber =
            `PO-${String(nextNumber).padStart(
              6,
              '0'
            )}`;
        }

        // Create PO
        const {
          data: newPO,
          error: poError,
        } = await supabase
          .from('purchase_orders')
          .insert({
            ...buildPayload(),

            po_number:
              poNumber,

            status:
              'draft',
          })
          .select()
          .single();

        if (poError) {
          throw poError;
        }

        if (!newPO?.id) {
          throw new Error(
            'Purchase order was created but no ID was returned.'
          );
        }

        createdPOId =
          newPO.id;

        // Create PO items
        const itemsForInsert =
          poItems.map((item) => ({
            ...item,

            purchase_order_id:
              newPO.id,
          }));

        const {
          error: itemsError,
        } = await supabase
          .from('purchase_order_items')
          .insert(itemsForInsert);

        if (itemsError) {
          // Cleanup orphan PO if items fail
          await supabase
            .from('purchase_orders')
            .delete()
            .eq(
              'id',
              newPO.id
            );

          throw itemsError;
        }

        // Update product prices
        if (updateProductPrice) {
          for (const item of validItems) {
            if (!item.product_id)
              continue;

            const {
              error: priceError,
            } = await supabase
              .from('products')
              .update({
                price:
                  Number(item.unit_price) ||
                  0,
              })
              .eq(
                'id',
                item.product_id
              );

            if (priceError) {
              console.error(
                'Product price update error:',
                priceError
              );
            }
          }
        }
      }

      setSaving(false);
      setShowForm(false);

      resetForm();

      await load();
    } catch (err: any) {
      console.error(
        'Purchase order save error:',
        err
      );

      setSaving(false);

      setError(
        err?.message ||
          'Failed to save purchase order.'
      );
    }
  };

  // ============================================================
  // RECEIVE STOCK
  // ============================================================

  const handleReceive = async (
    po: PurchaseOrder
  ) => {
    if (po.status !== 'draft') {
      return;
    }

    const confirmed = confirm(
      `Receive PO ${po.po_number}? This will add stock for all products in this purchase order.`
    );

    if (!confirmed) return;

    setReceiving(po.id);

    try {
      const {
        data: poItems,
        error: itemsError,
      } = await supabase
        .from('purchase_order_items')
        .select(
          `
            *,
            products(*)
          `
        )
        .eq(
          'purchase_order_id',
          po.id
        );

      if (itemsError) {
        throw itemsError;
      }

      if (!poItems || poItems.length === 0) {
        throw new Error(
          'This purchase order has no items.'
        );
      }

      for (const item of poItems) {
        if (!item.product_id) {
          continue;
        }

        const product =
          (item as any).products;

        if (!product) {
          console.warn(
            `Product ${item.product_id} not found.`
          );
          continue;
        }

        const currentStock =
          Number(
            product.stock || 0
          );

        const quantity =
          Number(
            item.quantity || 0
          );

        const newStock =
          currentStock +
          quantity;

        // Update product stock
        const {
          error: stockError,
        } = await supabase
          .from('products')
          .update({
            stock:
              Math.round(
                newStock
              ),
          })
          .eq(
            'id',
            item.product_id
          );

        if (stockError) {
          throw stockError;
        }

        // Create stock movement
        const {
          error: movementError,
        } = await supabase
          .from('stock_movements')
          .insert({
            product_id:
              item.product_id,

            movement_type:
              'purchase',

            quantity:
              quantity,

            reference_type:
              'purchase_order',

            reference_id:
              po.id,

            notes:
              `PO ${po.po_number}`,
          });

        if (movementError) {
          throw movementError;
        }
      }

      // Mark PO received
      const {
        error: receiveError,
      } = await supabase
        .from('purchase_orders')
        .update({
          status:
            'received',
        })
        .eq(
          'id',
          po.id
        );

      if (receiveError) {
        throw receiveError;
      }

      await load();
    } catch (err: any) {
      console.error(
        'Receive stock error:',
        err
      );

      alert(
        err?.message ||
          'Failed to receive stock.'
      );
    } finally {
      setReceiving(null);
    }
  };

  // ============================================================
  // CANCEL
  // ============================================================

  const handleCancel = async (
    po: PurchaseOrder
  ) => {
    if (po.status !== 'draft') {
      return;
    }

    if (
      !confirm(
        `Cancel PO ${po.po_number}?`
      )
    ) {
      return;
    }

    try {
      const {
        error: cancelError,
      } = await supabase
        .from('purchase_orders')
        .update({
          status:
            'cancelled',
        })
        .eq(
          'id',
          po.id
        );

      if (cancelError) {
        throw cancelError;
      }

      await load();
    } catch (err: any) {
      alert(
        err?.message ||
          'Failed to cancel purchase order.'
      );
    }
  };

  // ============================================================
  // DELETE
  // ============================================================

  const handleDelete = async (
    po: PurchaseOrder
  ) => {
    if (
      !confirm(
        `Delete PO ${po.po_number}? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      // Items are ON DELETE CASCADE,
      // but deleting explicitly is also safe.
      const {
        error: itemError,
      } = await supabase
        .from('purchase_order_items')
        .delete()
        .eq(
          'purchase_order_id',
          po.id
        );

      if (itemError) {
        throw itemError;
      }

      const {
        error: poError,
      } = await supabase
        .from('purchase_orders')
        .delete()
        .eq(
          'id',
          po.id
        );

      if (poError) {
        throw poError;
      }

      if (
        expanded === po.id
      ) {
        setExpanded(null);
      }

      await load();
    } catch (err: any) {
      alert(
        err?.message ||
          'Failed to delete purchase order.'
      );
    }
  };

  // ============================================================
  // SEARCH
  // ============================================================

  const filtered =
    orders.filter((order) => {
      const q =
        search
          .trim()
          .toLowerCase();

      if (!q) return true;

      return (
        order.po_number
          .toLowerCase()
          .includes(q) ||
        (
          order.suppliers?.name ||
          ''
        )
          .toLowerCase()
          .includes(q) ||
        (
          order.invoice_no ||
          ''
        )
          .toLowerCase()
          .includes(q)
      );
    });

  // ============================================================
  // STYLES
  // ============================================================

  const inputCls =
    'w-full px-3 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50/30';

  const labelCls =
    'text-xs font-medium text-green-600 uppercase tracking-wide';

  const cardCls =
    'bg-green-50/40 rounded-2xl p-4 border border-green-100 space-y-4';

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="p-6 md:p-8">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-green-900">
            Purchase Orders
          </h1>

          <p className="text-green-600 text-sm mt-1">
            Manage purchases from suppliers
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-green-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Purchase Order
        </button>
      </div>

      {/* ======================================================
          SEARCH
      ====================================================== */}

      <div className="relative mb-4 max-w-sm">
        <Search className="w-4 h-4 text-green-400 absolute left-3 top-1/2 -translate-y-1/2" />

        <input
          type="text"
          placeholder="Search by PO number, invoice, or supplier..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-green-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      {/* ======================================================
          PAGE ERROR
      ====================================================== */}

      {pageError && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <div className="font-semibold mb-1">
            Purchase Orders could not be loaded
          </div>

          <div>
            {pageError}
          </div>

          {pageError.includes(
            'purchase_orders'
          ) && (
            <div className="mt-3 text-xs bg-red-100 rounded-lg p-3">
              Make sure the
              <strong>
                {' '}
                purchase_orders
              </strong>{' '}
              and
              <strong>
                {' '}
                purchase_order_items
              </strong>{' '}
              tables have been created in Supabase.
            </div>
          )}

          <button
            onClick={load}
            className="mt-3 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* ======================================================
          LOADING
      ====================================================== */}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(
            (i) => (
              <div
                key={i}
                className="h-20 bg-green-100 rounded-2xl animate-pulse"
              />
            )
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-green-100">
          <Package className="w-10 h-10 text-green-300 mx-auto mb-3" />

          <p className="text-green-600">
            No purchase orders yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">

          {/* ==================================================
              PO LIST
          ================================================== */}

          {filtered.map(
            (po) => (
              <div
                key={po.id}
                className="bg-white rounded-2xl border border-green-100 overflow-hidden"
              >

                {/* PO HEADER */}
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-green-50/50 transition-colors"
                  onClick={() =>
                    setExpanded(
                      expanded === po.id
                        ? null
                        : po.id
                    )
                  }
                >
                  <div className="flex items-center gap-3">

                    {expanded ===
                    po.id ? (
                      <ChevronDown className="w-4 h-4 text-green-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-green-500" />
                    )}

                    <div>
                      <p className="font-medium text-green-900 text-sm">
                        {po.po_number}

                        {po.invoice_no
                          ? ` · Inv: ${po.invoice_no}`
                          : ''}
                      </p>

                      <p className="text-xs text-green-500">
                        {po.suppliers?.name ||
                          'No supplier'}{' '}
                        ·{' '}
                        {new Date(
                          po.order_date
                        ).toLocaleDateString(
                          'en-IN'
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-green-900">
                      ₹
                      {fmt(
                        Number(
                          po.grand_total
                        )
                      )}
                    </span>

                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        statusColors[
                          po.status
                        ] ||
                        'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {po.status}
                    </span>
                  </div>
                </div>

                {/* ==================================================
                    EXPANDED PO
                ================================================== */}

                {expanded ===
                  po.id && (
                    <div className="border-t border-green-50 p-5 bg-green-50/30">

                      {/* INFO */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-xs">

                        {po.invoice_type && (
                          <div>
                            <span className="text-green-400">
                              Type:
                            </span>{' '}
                            <span className="font-medium text-green-800">
                              {po.invoice_type}
                            </span>
                          </div>
                        )}

                        {po.vendor_contact_person && (
                          <div>
                            <span className="text-green-400">
                              Contact:
                            </span>{' '}
                            <span className="font-medium text-green-800">
                              {po.vendor_contact_person}
                            </span>
                          </div>
                        )}

                        {po.vendor_phone && (
                          <div>
                            <span className="text-green-400">
                              Phone:
                            </span>{' '}
                            <span className="font-medium text-green-800">
                              {po.vendor_phone}
                            </span>
                          </div>
                        )}

                        {po.vendor_gstin_pan && (
                          <div>
                            <span className="text-green-400">
                              GSTIN/PAN:
                            </span>{' '}
                            <span className="font-medium text-green-800">
                              {po.vendor_gstin_pan}
                            </span>
                          </div>
                        )}

                        {po.place_of_supply && (
                          <div>
                            <span className="text-green-400">
                              Supply:
                            </span>{' '}
                            <span className="font-medium text-green-800">
                              {po.place_of_supply}
                            </span>
                          </div>
                        )}

                        {po.delivery_mode && (
                          <div>
                            <span className="text-green-400">
                              Delivery:
                            </span>{' '}
                            <span className="font-medium text-green-800">
                              {po.delivery_mode}
                            </span>
                          </div>
                        )}

                        {po.challan_no && (
                          <div>
                            <span className="text-green-400">
                              Challan:
                            </span>{' '}
                            <span className="font-medium text-green-800">
                              {po.challan_no}
                            </span>
                          </div>
                        )}

                        {po.lr_no && (
                          <div>
                            <span className="text-green-400">
                              LR:
                            </span>{' '}
                            <span className="font-medium text-green-800">
                              {po.lr_no}
                            </span>
                          </div>
                        )}

                        {po.eway_no && (
                          <div>
                            <span className="text-green-400">
                              E-Way:
                            </span>{' '}
                            <span className="font-medium text-green-800">
                              {po.eway_no}
                            </span>
                          </div>
                        )}

                        {po.payment_type && (
                          <div>
                            <span className="text-green-400">
                              Payment:
                            </span>{' '}
                            <span className="font-medium text-green-800">
                              {po.payment_type}
                            </span>
                          </div>
                        )}

                        {po.reverse_charge !==
                          'No' && (
                          <div>
                            <span className="text-green-400">
                              Reverse Charge:
                            </span>{' '}
                            <span className="font-medium text-green-800">
                              {po.reverse_charge}
                            </span>
                          </div>
                        )}
                      </div>

                      {po.vendor_address && (
                        <p className="text-xs text-green-500 mb-3">
                          Vendor Address:{' '}
                          {po.vendor_address}
                        </p>
                      )}

                      {po.ship_to && (
                        <p className="text-xs text-green-500 mb-3">
                          Ship To:{' '}
                          {po.ship_to}
                        </p>
                      )}

                      {/* ITEMS TABLE */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-green-500 border-b border-green-100">
                              <th className="text-left py-2">
                                #
                              </th>

                              <th className="text-left py-2">
                                Description
                              </th>

                              <th className="text-left py-2">
                                HSN
                              </th>

                              <th className="text-right py-2">
                                Qty
                              </th>

                              <th className="text-right py-2">
                                Rate
                              </th>

                              <th className="text-right py-2">
                                GST%
                              </th>

                              <th className="text-right py-2">
                                Total
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {(
                              po.purchase_order_items ||
                              []
                            ).map(
                              (
                                item,
                                idx
                              ) => (
                                <tr
                                  key={
                                    item.id
                                  }
                                  className="border-b border-green-50"
                                >
                                  <td className="py-2 text-green-400">
                                    {idx +
                                      1}
                                  </td>

                                  <td className="py-2 text-green-800">
                                    {
                                      item.description
                                    }

                                    {item.item_note && (
                                      <div className="text-[10px] text-gray-400">
                                        {
                                          item.item_note
                                        }
                                      </div>
                                    )}
                                  </td>

                                  <td className="py-2 text-green-600">
                                    {item.hsn_sac_code ||
                                      '—'}
                                  </td>

                                  <td className="py-2 text-right text-green-600">
                                    {
                                      item.quantity
                                    }{' '}
                                    {
                                      item.uom
                                    }
                                  </td>

                                  <td className="py-2 text-right text-green-600">
                                    ₹
                                    {fmt(
                                      Number(
                                        item.unit_price
                                      )
                                    )}
                                  </td>

                                  <td className="py-2 text-right text-green-600">
                                    {
                                      item.gst_percentage
                                    }
                                    %
                                  </td>

                                  <td className="py-2 text-right font-medium text-green-900">
                                    ₹
                                    {fmt(
                                      Number(
                                        item.total
                                      )
                                    )}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* TOTALS */}
                      <div className="flex justify-end mt-3">
                        <div className="text-xs space-y-0.5">

                          <div className="flex justify-between gap-8 text-green-600">
                            <span>
                              Subtotal
                            </span>

                            <span>
                              ₹
                              {fmt(
                                Number(
                                  po.subtotal
                                )
                              )}
                            </span>
                          </div>

                          {Number(
                            po.discount_value
                          ) >
                            0 && (
                            <div className="flex justify-between gap-8 text-green-600">
                              <span>
                                Discount
                              </span>

                              <span>
                                - ₹
                                {fmt(
                                  Number(
                                    po.discount_value
                                  )
                                )}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between gap-8 text-green-600">
                            <span>
                              GST
                            </span>

                            <span>
                              ₹
                              {fmt(
                                Number(
                                  po.gst_total
                                )
                              )}
                            </span>
                          </div>

                          {Number(
                            po.tcs_value
                          ) >
                            0 && (
                            <div className="flex justify-between gap-8 text-green-600">
                              <span>
                                TCS
                              </span>

                              <span>
                                ₹
                                {fmt(
                                  Number(
                                    po.tcs_value
                                  )
                                )}
                              </span>
                            </div>
                          )}

                          {Number(
                            po.round_off
                          ) !==
                            0 && (
                            <div className="flex justify-between gap-8 text-green-600">
                              <span>
                                Round Off
                              </span>

                              <span>
                                ₹
                                {fmt(
                                  Number(
                                    po.round_off
                                  )
                                )}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between gap-8 font-bold text-green-900 border-t border-green-200 pt-1">
                            <span>
                              Grand Total
                            </span>

                            <span>
                              ₹
                              {fmt(
                                Number(
                                  po.grand_total
                                )
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ACTIONS */}
                      <div className="flex items-center gap-2 mt-4 flex-wrap">

                        {po.status ===
                          'draft' && (
                          <button
                            onClick={() =>
                              handleReceive(
                                po
                              )
                            }
                            disabled={
                              receiving ===
                              po.id
                            }
                            className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {receiving ===
                            po.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Package className="w-3.5 h-3.5" />
                            )}

                            {receiving ===
                            po.id
                              ? 'Receiving...'
                              : 'Receive Stock'}
                          </button>
                        )}

                        {po.status ===
                          'draft' && (
                          <button
                            onClick={() =>
                              openEdit(
                                po
                              )
                            }
                            className="flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                        )}

                        {po.status ===
                          'draft' && (
                          <button
                            onClick={() =>
                              handleCancel(
                                po
                              )
                            }
                            className="flex items-center gap-1.5 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            Cancel
                          </button>
                        )}

                        <button
                          onClick={() =>
                            setViewingPO(
                              po
                            )
                          }
                          className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>

                        {po.status !==
                          'received' && (
                          <button
                            onClick={() =>
                              handleDelete(
                                po
                              )
                            }
                            className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors ml-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        )}
                      </div>

                      {po.notes && (
                        <p className="text-xs text-green-500 mt-3">
                          Notes:{' '}
                          {po.notes}
                        </p>
                      )}

                      {po.terms_title && (
                        <p className="text-xs text-green-500 mt-1">
                          {
                            po.terms_title
                          }
                          :{' '}
                          {
                            po.terms_detail
                          }
                        </p>
                      )}

                      {po.document_notes && (
                        <p className="text-xs text-green-400 mt-1">
                          Internal:{' '}
                          {
                            po.document_notes
                          }
                        </p>
                      )}
                    </div>
                  )}
              </div>
            )
          )}
        </div>
      )}

      {/* ======================================================
          CREATE / EDIT MODAL
      ====================================================== */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">

          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl max-h-[94vh] flex flex-col">

            {/* HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-green-100 shrink-0">

              <h3 className="font-display text-xl font-bold text-green-900">
                {editingPO
                  ? `Edit ${editingPO.po_number}`
                  : 'New Purchase Order'}
              </h3>

              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="p-1.5 hover:bg-green-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-green-500" />
              </button>
            </div>

            {/* BODY */}
            <div className="overflow-y-auto px-6 py-5 space-y-5">

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              {/* ==================================================
                  PURCHASE INVOICE DETAILS
              ================================================== */}

              <div className={cardCls}>

                <h4 className="text-sm font-bold text-green-800">
                  Purchase Invoice Details
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

                  <div>
                    <label className={labelCls}>
                      Invoice Type
                    </label>

                    <select
                      value={invoiceType}
                      onChange={(e) =>
                        setInvoiceType(
                          e.target.value
                        )
                      }
                      className={inputCls}
                    >
                      <option value="Regular">
                        Regular
                      </option>

                      <option value="Reverse Charge">
                        Reverse Charge
                      </option>

                      <option value="Import">
                        Import
                      </option>

                      <option value="Debit Note">
                        Debit Note
                      </option>

                      <option value="Credit Note">
                        Credit Note
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className={labelCls}>
                      Invoice No.
                    </label>

                    <input
                      type="text"
                      value={invoiceNo}
                      onChange={(e) =>
                        setInvoiceNo(
                          e.target.value
                        )
                      }
                      className={inputCls}
                      placeholder="Vendor invoice no."
                    />
                  </div>

                  <div>
                    <label className={labelCls}>
                      Invoice Date
                    </label>

                    <input
                      type="date"
                      value={invoiceDate}
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
                      PO Date
                    </label>

                    <input
                      type="date"
                      value={orderDate}
                      onChange={(e) =>
                        setOrderDate(
                          e.target.value
                        )
                      }
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>
                      Expected Date
                    </label>

                    <input
                      type="date"
                      value={expectedDate}
                      onChange={(e) =>
                        setExpectedDate(
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
                      value={dueDate}
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
                      Challan No.
                    </label>

                    <input
                      type="text"
                      value={challanNo}
                      onChange={(e) =>
                        setChallanNo(
                          e.target.value
                        )
                      }
                      className={inputCls}
                      placeholder="DC-001"
                    />
                  </div>

                  <div>
                    <label className={labelCls}>
                      Challan Date
                    </label>

                    <input
                      type="date"
                      value={challanDate}
                      onChange={(e) =>
                        setChallanDate(
                          e.target.value
                        )
                      }
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>
                      LR / Transport No.
                    </label>

                    <input
                      type="text"
                      value={lrNo}
                      onChange={(e) =>
                        setLrNo(
                          e.target.value
                        )
                      }
                      className={inputCls}
                      placeholder="LR-001"
                    />
                  </div>

                  <div>
                    <label className={labelCls}>
                      E-Way Bill No.
                    </label>

                    <input
                      type="text"
                      value={ewayNo}
                      onChange={(e) =>
                        setEwayNo(
                          e.target.value
                        )
                      }
                      className={inputCls}
                      placeholder="EW-001"
                    />
                  </div>

                  <div>
                    <label className={labelCls}>
                      Delivery Mode
                    </label>

                    <input
                      type="text"
                      value={deliveryMode}
                      onChange={(e) =>
                        setDeliveryMode(
                          e.target.value
                        )
                      }
                      className={inputCls}
                      placeholder="By Road / Transport"
                    />
                  </div>

                  <div>
                    <label className={labelCls}>
                      Payment Type
                    </label>

                    <select
                      value={paymentType}
                      onChange={(e) =>
                        setPaymentType(
                          e.target.value
                        )
                      }
                      className={inputCls}
                    >
                      <option value="Credit">
                        Credit
                      </option>

                      <option value="Cash">
                        Cash
                      </option>

                      <option value="UPI">
                        UPI
                      </option>

                      <option value="Bank Transfer">
                        Bank Transfer
                      </option>

                      <option value="Cheque">
                        Cheque
                      </option>

                      <option value="Card">
                        Card
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className={labelCls}>
                      Reverse Charge
                    </label>

                    <select
                      value={reverseCharge}
                      onChange={(e) =>
                        setReverseCharge(
                          e.target.value
                        )
                      }
                      className={inputCls}
                    >
                      <option value="No">
                        No
                      </option>

                      <option value="Yes">
                        Yes
                      </option>
                    </select>
                  </div>

                </div>
              </div>

              {/* ==================================================
                  VENDOR
              ================================================== */}

              <div className={cardCls}>

                <h4 className="text-sm font-bold text-green-800">
                  Vendor (Supplier) Details
                </h4>

                <div>
                  <label className={labelCls}>
                    Select Supplier
                  </label>

                  <select
                    value={supplierId}
                    onChange={(e) =>
                      fillVendorFromSupplier(
                        e.target.value
                      )
                    }
                    className={inputCls}
                  >
                    <option value="">
                      — Select saved supplier —
                    </option>

                    {suppliers.map(
                      (supplier) => (
                        <option
                          key={
                            supplier.id
                          }
                          value={
                            supplier.id
                          }
                        >
                          {
                            supplier.name
                          }

                          {supplier.gstin
                            ? ` (${supplier.gstin})`
                            : ''}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div>
                    <label className={labelCls}>
                      Vendor Address
                    </label>

                    <textarea
                      value={vendorAddress}
                      onChange={(e) =>
                        setVendorAddress(
                          e.target.value
                        )
                      }
                      rows={2}
                      className={
                        inputCls +
                        ' resize-none'
                      }
                      placeholder="Vendor address"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">

                    <div>
                      <label className={labelCls}>
                        Contact Person
                      </label>

                      <input
                        type="text"
                        value={
                          vendorContactPerson
                        }
                        onChange={(e) =>
                          setVendorContactPerson(
                            e.target.value
                          )
                        }
                        className={inputCls}
                        placeholder="Contact name"
                      />
                    </div>

                    <div>
                      <label className={labelCls}>
                        Phone
                      </label>

                      <input
                        type="text"
                        value={
                          vendorPhone
                        }
                        onChange={(e) =>
                          setVendorPhone(
                            e.target.value
                          )
                        }
                        className={inputCls}
                        placeholder="+91 98765 43210"
                      />
                    </div>

                    <div>
                      <label className={labelCls}>
                        GSTIN / PAN
                      </label>

                      <input
                        type="text"
                        value={
                          vendorGstinPan
                        }
                        onChange={(e) =>
                          setVendorGstinPan(
                            e.target.value.toUpperCase()
                          )
                        }
                        className={
                          inputCls +
                          ' uppercase'
                        }
                        placeholder="GSTIN / PAN"
                      />
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
                        placeholder="27-Maharashtra"
                      />
                    </div>

                  </div>
                </div>

                <div>
                  <label className={labelCls}>
                    Ship To (Delivery Address)
                  </label>

                  <textarea
                    value={shipTo}
                    onChange={(e) =>
                      setShipTo(
                        e.target.value
                      )
                    }
                    rows={2}
                    className={
                      inputCls +
                      ' resize-none'
                    }
                    placeholder="Delivery address if different"
                  />
                </div>

              </div>

              {/* ==================================================
                  PRODUCTS
              ================================================== */}

              <div className={cardCls}>

                <div className="flex items-center justify-between">

                  <h4 className="text-sm font-bold text-green-800">
                    Products / Line Items
                  </h4>

                  <button
                    onClick={addItem}
                    className="flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Item
                  </button>

                </div>

                <div className="space-y-2">

                  {items.map(
                    (item, idx) => {
                      const calculation =
                        calcItem(item);

                      return (
                        <div
                          key={idx}
                          className="flex flex-col gap-2 bg-white rounded-xl p-3 border border-green-100"
                        >

                          {/* PRODUCT + DESCRIPTION */}

                          <div className="flex items-start gap-2">

                            <select
                              value={item.product_id}
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  'product_id',
                                  e.target.value
                                )
                              }
                              className="text-xs px-2 py-2 border border-green-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-400 min-w-[180px]"
                            >
                              <option value="">
                                Custom item
                              </option>

                              {products.map(
                                (product) => (
                                  <option
                                    key={
                                      product.id
                                    }
                                    value={
                                      product.id
                                    }
                                  >
                                    {
                                      product.name
                                    }

                                    {product.hsn_code
                                      ? ` — HSN ${product.hsn_code}`
                                      : ''}
                                  </option>
                                )
                              )}
                            </select>

                            <input
                              placeholder="Description"
                              value={
                                item.description
                              }
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  'description',
                                  e.target.value
                                )
                              }
                              className="flex-1 text-xs px-2 py-2 border border-green-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-400"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                removeItem(
                                  idx
                                )
                              }
                              className="p-1.5 text-green-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                          </div>

                          {/* AUTO DATA */}

                          <div className="flex flex-wrap gap-2 items-center">

                            {/* BARCODE */}

                            <input
                              placeholder="Barcode"
                              value={
                                item.barcode_no
                              }
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  'barcode_no',
                                  e.target.value
                                )
                              }
                              className="text-xs px-2 py-2 border border-green-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-400 w-28"
                            />

                            {/* HSN */}

                            <div className="relative">

                              <input
                                list="purchase-hsn-codes"
                                placeholder="HSN"
                                value={
                                  item.hsn_sac_code
                                }
                                onChange={(e) =>
                                  updateItem(
                                    idx,
                                    'hsn_sac_code',
                                    e.target.value
                                      .replace(
                                        /\D/g,
                                        ''
                                      )
                                      .slice(
                                        0,
                                        8
                                      )
                                  )
                                }
                                className="text-xs px-2 py-2 border border-green-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-400 w-24"
                              />

                              {item.product_id &&
                                item.hsn_sac_code && (
                                  <span className="absolute -top-2 right-1 bg-green-100 text-green-700 text-[8px] px-1 rounded">
                                    AUTO
                                  </span>
                                )}
                            </div>

                            {/* HSN DATALIST */}

                            <datalist id="purchase-hsn-codes">
                              {hsnCodes.map(
                                (hsn) => (
                                  <option
                                    key={
                                      hsn.id
                                    }
                                    value={
                                      hsn.code
                                    }
                                  >
                                    {
                                      hsn.description
                                    }
                                  </option>
                                )
                              )}
                            </datalist>

                            {/* UOM */}

                            <select
                              value={
                                item.uom
                              }
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  'uom',
                                  e.target.value
                                )
                              }
                              className="text-xs px-1.5 py-2 border border-green-200 rounded-lg bg-white"
                            >
                              <option value="NOS">
                                NOS
                              </option>

                              <option value="KG">
                                KG
                              </option>

                              <option value="GM">
                                GM
                              </option>

                              <option value="MTR">
                                MTR
                              </option>

                              <option value="PCS">
                                PCS
                              </option>

                              <option value="BOX">
                                BOX
                              </option>

                              <option value="SET">
                                SET
                              </option>

                              <option value="LTR">
                                LTR
                              </option>
                            </select>

                            {/* QUANTITY */}

                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              placeholder="Qty"
                              value={
                                item.quantity
                              }
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  'quantity',
                                  Number(
                                    e.target.value
                                  )
                                )
                              }
                              className="text-xs px-2 py-2 border border-green-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-400 w-20 text-center"
                            />

                            {/* PRICE */}

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Price"
                              value={
                                item.unit_price
                              }
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  'unit_price',
                                  Number(
                                    e.target.value
                                  )
                                )
                              }
                              className="text-xs px-2 py-2 border border-green-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-400 w-24 text-right"
                            />

                            {/* DISCOUNT */}

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Disc"
                              value={
                                item.discount_value
                              }
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  'discount_value',
                                  Number(
                                    e.target.value
                                  )
                                )
                              }
                              className="text-xs px-2 py-2 border border-green-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-400 w-16 text-center"
                            />

                            <select
                              value={
                                item.discount_type
                              }
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  'discount_type',
                                  e.target.value === 'percentage'
                                    ? 'percentage'
                                    : 'amount'
                                )
                              }
                              className="text-xs px-1 py-2 border border-green-200 rounded-lg bg-white"
                            >
                              <option value="amount">
                                ₹
                              </option>

                              <option value="percentage">
                                %
                              </option>
                            </select>

                            {/* GST */}

                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              placeholder="GST%"
                              value={
                                item.gst_percentage
                              }
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  'gst_percentage',
                                  Number(
                                    e.target.value
                                  )
                                )
                              }
                              className="text-xs px-2 py-2 border border-green-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-400 w-16 text-center"
                            />

                            {/* TOTAL */}

                            <span className="text-xs font-medium text-green-800 w-24 text-right">
                              ₹
                              {fmt(
                                calculation.total
                              )}
                            </span>

                          </div>

                          {/* NOTE */}

                          <input
                            placeholder="Item note (optional)"
                            value={
                              item.item_note
                            }
                            onChange={(e) =>
                              updateItem(
                                idx,
                                'item_note',
                                e.target.value
                              )
                            }
                            className="w-full text-xs px-3 py-1.5 border border-green-100 rounded-lg bg-green-50/30 focus:outline-none focus:ring-1 focus:ring-green-300"
                          />

                        </div>
                      );
                    }
                  )}

                </div>
              </div>

              {/* ==================================================
                  DISCOUNT / TCS / TOTALS
              ================================================== */}

              <div className={cardCls}>

                <h4 className="text-sm font-bold text-green-800">
                  Discount, TCS & Totals
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">

                  <div>
                    <label className={labelCls}>
                      Invoice Discount
                    </label>

                    <div className="flex gap-2 mt-1.5">

                      <input
                        type="number"
                        value={
                          discountValue
                        }
                        onChange={(e) =>
                          setDiscountValue(
                            Number(
                              e.target.value
                            )
                          )
                        }
                        min={0}
                        step="0.01"
                        className="min-w-0 flex-1 px-3 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
                      />

                      <select
                        value={
                          discountType
                        }
                        onChange={(e) =>
                          setDiscountType(
                            e.target.value === 'percentage'
                              ? 'percentage'
                              : 'amount'
                          )
                        }
                        className="px-2 py-2.5 text-xs border border-green-200 rounded-xl bg-white"
                      >
                        <option value="amount">
                          ₹
                        </option>

                        <option value="percentage">
                          %
                        </option>
                      </select>

                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>
                      TCS
                    </label>

                    <div className="flex gap-2 mt-1.5">

                      <input
                        type="number"
                        value={
                          tcsValue
                        }
                        onChange={(e) =>
                          setTcsValue(
                            Number(
                              e.target.value
                            )
                          )
                        }
                        min={0}
                        step="0.01"
                        className="min-w-0 flex-1 px-3 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
                      />

                      <select
                        value={
                          tcsType
                        }
                        onChange={(e) =>
                          setTcsType(
                            e.target.value === 'percentage'
                              ? 'percentage'
                              : 'amount'
                          )
                        }
                        className="px-2 py-2.5 text-xs border border-green-200 rounded-xl bg-white"
                      >
                        <option value="percentage">
                          %
                        </option>

                        <option value="amount">
                          ₹
                        </option>
                      </select>

                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>
                      Round Off (₹)
                    </label>

                    <input
                      type="number"
                      value={
                        roundOff
                      }
                      onChange={(e) =>
                        setRoundOff(
                          Number(
                            e.target.value
                          )
                        )
                      }
                      step="0.01"
                      className={inputCls}
                    />
                  </div>

                </div>

                {/* TOTAL BOX */}

                <div className="bg-white rounded-xl p-4 border border-green-100">

                  <div className="ml-auto max-w-xs space-y-2">

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

                    {invoiceDiscount >
                      0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>
                          Discount
                        </span>

                        <span>
                          - ₹
                          {fmt(
                            invoiceDiscount
                          )}
                        </span>
                      </div>
                    )}

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

                    {tcsAmount >
                      0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>
                          TCS
                        </span>

                        <span>
                          ₹
                          {fmt(
                            tcsAmount
                          )}
                        </span>
                      </div>
                    )}

                    {roundOff !==
                      0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>
                          Round Off
                        </span>

                        <span>
                          ₹
                          {fmt(
                            roundOff
                          )}
                        </span>
                      </div>
                    )}

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

                {/* PRICE UPDATE */}

                <label className="flex items-center gap-2 text-xs text-green-700 cursor-pointer">

                  <input
                    type="checkbox"
                    checked={
                      updateProductPrice
                    }
                    onChange={(e) =>
                      setUpdateProductPrice(
                        e.target.checked
                      )
                    }
                    className="w-4 h-4 rounded border-green-300 text-green-600 focus:ring-green-400"
                  />

                  Update product prices from this purchase order

                </label>

              </div>

              {/* ==================================================
                  TERMS
              ================================================== */}

              <div className={cardCls}>

                <h4 className="text-sm font-bold text-green-800">
                  Terms & Notes
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div>

                    <label className={labelCls}>
                      Terms Title
                    </label>

                    <input
                      type="text"
                      value={
                        termsTitle
                      }
                      onChange={(e) =>
                        setTermsTitle(
                          e.target.value
                        )
                      }
                      className={inputCls}
                      placeholder="Terms & Conditions"
                    />

                    <label className={labelCls + ' mt-3 block'}>
                      Terms Detail
                    </label>

                    <textarea
                      value={
                        termsDetail
                      }
                      onChange={(e) =>
                        setTermsDetail(
                          e.target.value
                        )
                      }
                      rows={2}
                      className={
                        inputCls +
                        ' resize-none'
                      }
                      placeholder="Payment due within 15 days..."
                    />

                  </div>

                  <div>

                    <label className={labelCls}>
                      Notes
                    </label>

                    <textarea
                      value={
                        notes
                      }
                      onChange={(e) =>
                        setNotes(
                          e.target.value
                        )
                      }
                      rows={2}
                      className={
                        inputCls +
                        ' resize-none'
                      }
                      placeholder="Additional notes..."
                    />

                    <label className={labelCls + ' mt-3 block'}>
                      Document Notes (internal)
                    </label>

                    <textarea
                      value={
                        documentNotes
                      }
                      onChange={(e) =>
                        setDocumentNotes(
                          e.target.value
                        )
                      }
                      rows={2}
                      className={
                        inputCls +
                        ' resize-none'
                      }
                      placeholder="Internal notes..."
                    />

                  </div>

                </div>

              </div>

            </div>

            {/* ====================================================
                FOOTER
            ==================================================== */}

            <div className="px-6 py-4 border-t border-green-100 flex gap-3 shrink-0">

              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-5 py-2.5 border border-green-200 text-green-700 rounded-xl text-sm font-medium hover:bg-green-50 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-green-800 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}

                {editingPO
                  ? 'Update Purchase Order'
                  : 'Create Purchase Order'}
              </button>

            </div>

          </div>
        </div>
      )}

      {/* ======================================================
          VIEW MODAL
      ====================================================== */}

      {viewingPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">

          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[94vh] flex flex-col">

            {/* HEADER */}

            <div className="flex items-center justify-between px-6 py-4 border-b border-green-100 shrink-0">

              <h3 className="font-display text-xl font-bold text-green-900">
                Purchase Order{' '}
                {viewingPO.po_number}
              </h3>

              <div className="flex items-center gap-2">

                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    statusColors[
                      viewingPO.status
                    ] ||
                    'bg-gray-100 text-gray-700'
                  }`}
                >
                  {
                    viewingPO.status
                  }
                </span>

                <button
                  onClick={() =>
                    setViewingPO(
                      null
                    )
                  }
                  className="p-1.5 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-green-500" />
                </button>

              </div>
            </div>

            {/* BODY */}

            <div className="overflow-y-auto p-6 space-y-4">

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">

                <div>
                  <span className="text-xs text-green-400 block">
                    Supplier
                  </span>

                  <span className="font-medium text-green-900">
                    {
                      viewingPO.suppliers
                        ?.name ||
                      '—'
                    }
                  </span>
                </div>

                <div>
                  <span className="text-xs text-green-400 block">
                    Invoice Type
                  </span>

                  <span className="font-medium text-green-900">
                    {
                      viewingPO.invoice_type
                    }
                  </span>
                </div>

                <div>
                  <span className="text-xs text-green-400 block">
                    Invoice No.
                  </span>

                  <span className="font-medium text-green-900">
                    {
                      viewingPO.invoice_no ||
                      '—'
                    }
                  </span>
                </div>

                <div>
                  <span className="text-xs text-green-400 block">
                    PO Date
                  </span>

                  <span className="font-medium text-green-900">
                    {new Date(
                      viewingPO.order_date
                    ).toLocaleDateString(
                      'en-IN'
                    )}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-green-400 block">
                    Invoice Date
                  </span>

                  <span className="font-medium text-green-900">
                    {viewingPO.invoice_date
                      ? new Date(
                          viewingPO.invoice_date
                        ).toLocaleDateString(
                          'en-IN'
                        )
                      : '—'}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-green-400 block">
                    Due Date
                  </span>

                  <span className="font-medium text-green-900">
                    {viewingPO.due_date
                      ? new Date(
                          viewingPO.due_date
                        ).toLocaleDateString(
                          'en-IN'
                        )
                      : '—'}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-green-400 block">
                    Contact
                  </span>

                  <span className="font-medium text-green-900">
                    {
                      viewingPO.vendor_contact_person ||
                      '—'
                    }
                  </span>
                </div>

                <div>
                  <span className="text-xs text-green-400 block">
                    Phone
                  </span>

                  <span className="font-medium text-green-900">
                    {
                      viewingPO.vendor_phone ||
                      '—'
                    }
                  </span>
                </div>

                <div>
                  <span className="text-xs text-green-400 block">
                    GSTIN/PAN
                  </span>

                  <span className="font-medium text-green-900">
                    {
                      viewingPO.vendor_gstin_pan ||
                      '—'
                    }
                  </span>
                </div>

                <div>
                  <span className="text-xs text-green-400 block">
                    Place of Supply
                  </span>

                  <span className="font-medium text-green-900">
                    {
                      viewingPO.place_of_supply ||
                      '—'
                    }
                  </span>
                </div>

                <div>
                  <span className="text-xs text-green-400 block">
                    Delivery Mode
                  </span>

                  <span className="font-medium text-green-900">
                    {
                      viewingPO.delivery_mode ||
                      '—'
                    }
                  </span>
                </div>

                <div>
                  <span className="text-xs text-green-400 block">
                    Payment Type
                  </span>

                  <span className="font-medium text-green-900">
                    {
                      viewingPO.payment_type
                    }
                  </span>
                </div>

                <div>
                  <span className="text-xs text-green-400 block">
                    Challan No.
                  </span>

                  <span className="font-medium text-green-900">
                    {
                      viewingPO.challan_no ||
                      '—'
                    }
                  </span>
                </div>

                <div>
                  <span className="text-xs text-green-400 block">
                    LR No.
                  </span>

                  <span className="font-medium text-green-900">
                    {
                      viewingPO.lr_no ||
                      '—'
                    }
                  </span>
                </div>

                <div>
                  <span className="text-xs text-green-400 block">
                    E-Way No.
                  </span>

                  <span className="font-medium text-green-900">
                    {
                      viewingPO.eway_no ||
                      '—'
                    }
                  </span>
                </div>

              </div>

              {viewingPO.vendor_address && (
                <p className="text-sm text-green-600">
                  <span className="text-xs text-green-400">
                    Vendor Address:{' '}
                  </span>

                  {
                    viewingPO.vendor_address
                  }
                </p>
              )}

              {viewingPO.ship_to && (
                <p className="text-sm text-green-600">
                  <span className="text-xs text-green-400">
                    Ship To:{' '}
                  </span>

                  {
                    viewingPO.ship_to
                  }
                </p>
              )}

              {/* ITEMS */}

              <div className="overflow-x-auto">

                <table className="w-full text-sm">

                  <thead>
                    <tr className="text-xs text-green-500 border-b border-green-100">

                      <th className="text-left py-2">
                        #
                      </th>

                      <th className="text-left py-2">
                        Description
                      </th>

                      <th className="text-left py-2">
                        HSN
                      </th>

                      <th className="text-right py-2">
                        Qty
                      </th>

                      <th className="text-right py-2">
                        Rate
                      </th>

                      <th className="text-right py-2">
                        GST%
                      </th>

                      <th className="text-right py-2">
                        Total
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {(
                      viewingPO.purchase_order_items ||
                      []
                    ).map(
                      (
                        item,
                        idx
                      ) => (
                        <tr
                          key={
                            item.id
                          }
                          className="border-b border-green-50"
                        >

                          <td className="py-2 text-green-400">
                            {idx +
                              1}
                          </td>

                          <td className="py-2 text-green-800">

                            {
                              item.description
                            }

                            {item.item_note && (
                              <div className="text-[10px] text-gray-400">
                                {
                                  item.item_note
                                }
                              </div>
                            )}

                          </td>

                          <td className="py-2 text-green-600">
                            {
                              item.hsn_sac_code ||
                              '—'
                            }
                          </td>

                          <td className="py-2 text-right text-green-600">
                            {
                              item.quantity
                            }{' '}
                            {
                              item.uom
                            }
                          </td>

                          <td className="py-2 text-right text-green-600">
                            ₹
                            {fmt(
                              Number(
                                item.unit_price
                              )
                            )}
                          </td>

                          <td className="py-2 text-right text-green-600">
                            {
                              item.gst_percentage
                            }
                            %
                          </td>

                          <td className="py-2 text-right font-medium text-green-900">
                            ₹
                            {fmt(
                              Number(
                                item.total
                              )
                            )}
                          </td>

                        </tr>
                      )
                    )}

                  </tbody>
                </table>

              </div>

              {/* TOTALS */}

              <div className="flex justify-end">

                <div className="text-sm space-y-1">

                  <div className="flex justify-between gap-8 text-green-600">
                    <span>
                      Subtotal
                    </span>

                    <span>
                      ₹
                      {fmt(
                        Number(
                          viewingPO.subtotal
                        )
                      )}
                    </span>
                  </div>

                  {Number(
                    viewingPO.discount_value
                  ) >
                    0 && (
                    <div className="flex justify-between gap-8 text-green-600">
                      <span>
                        Discount
                      </span>

                      <span>
                        - ₹
                        {fmt(
                          Number(
                            viewingPO.discount_value
                          )
                        )}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between gap-8 text-green-600">
                    <span>
                      GST
                    </span>

                    <span>
                      ₹
                      {fmt(
                        Number(
                          viewingPO.gst_total
                        )
                      )}
                    </span>
                  </div>

                  {Number(
                    viewingPO.tcs_value
                  ) >
                    0 && (
                    <div className="flex justify-between gap-8 text-green-600">
                      <span>
                        TCS
                      </span>

                      <span>
                        ₹
                        {fmt(
                          Number(
                            viewingPO.tcs_value
                          )
                        )}
                      </span>
                    </div>
                  )}

                  {Number(
                    viewingPO.round_off
                  ) !==
                    0 && (
                    <div className="flex justify-between gap-8 text-green-600">
                      <span>
                        Round Off
                      </span>

                      <span>
                        ₹
                        {fmt(
                          Number(
                            viewingPO.round_off
                          )
                        )}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between gap-8 font-bold text-green-900 border-t border-green-200 pt-1">
                    <span>
                      Grand Total
                    </span>

                    <span>
                      ₹
                      {fmt(
                        Number(
                          viewingPO.grand_total
                        )
                      )}
                    </span>
                  </div>

                </div>

              </div>

              {viewingPO.notes && (
                <p className="text-sm text-green-600">
                  <span className="text-xs text-green-400">
                    Notes:{' '}
                  </span>

                  {
                    viewingPO.notes
                  }
                </p>
              )}

              {viewingPO.terms_title && (
                <p className="text-sm text-green-600">
                  <span className="text-xs text-green-400">
                    {
                      viewingPO.terms_title
                    }
                    :{' '}
                  </span>

                  {
                    viewingPO.terms_detail
                  }
                </p>
              )}

              {viewingPO.document_notes && (
                <p className="text-sm text-green-400">
                  <span className="text-xs">
                    Internal:{' '}
                  </span>

                  {
                    viewingPO.document_notes
                  }
                </p>
              )}

            </div>

            {/* FOOTER */}

            <div className="px-6 py-4 border-t border-green-100 flex gap-3 shrink-0">

              <button
                onClick={() =>
                  setViewingPO(
                    null
                  )
                }
                className="flex-1 px-5 py-2.5 border border-green-200 text-green-700 rounded-xl text-sm font-medium hover:bg-green-50 transition-colors"
              >
                Close
              </button>

              {viewingPO.status ===
                'draft' && (
                <button
                  onClick={() => {
                    setViewingPO(
                      null
                    );
                    openEdit(
                      viewingPO
                    );
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-green-800 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}