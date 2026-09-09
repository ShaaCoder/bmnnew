import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
};

export type Product = {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  gst_percentage: number;
  images: string[];
  stock: number;
  featured: boolean;
  created_at: string;
  categories?: Category;
};

export type GalleryItem = {
  id: string;
  title: string;
  image_url: string;
  description: string | null;
  display_order: number;
  created_at: string;
};

export type Order = {
  id: string;
  product_id: string | null;
  product_name: string;
  product_price: number;
  gst_percentage: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  quantity: number;
  notes: string | null;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
};

export type ContactQuery = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: 'new' | 'read' | 'replied';
  created_at: string;
};

export type CompanySettings = {
  id: string;

  company_name: string;
  tagline: string | null;

  address: string | null;

  phone: string | null;

  email: string | null;

  gstin: string | null;

  pan: string | null;

  bank_name: string | null;

  account_number: string | null;

  ifsc_code: string | null;

  branch: string | null;

  upi_id: string | null;

  logo_url: string | null;

  signature_url: string | null;

  qr_code_url: string | null;

  created_at: string;

  updated_at: string;
};

export type Invoice = {
  id: string;
  invoice_number: string;
  order_id: string | null;
  supplier_id: string | null;
  invoice_type: string;
  invoice_prefix: string | null;
  challan_no: string | null;
  challan_date: string | null;
  po_no: string | null;
  po_date: string | null;
  lr_no: string | null;
  eway_no: string | null;
  delivery_mode: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_address: string | null;
  contact_person: string | null;
  customer_gst: string | null;
  customer_pan: string | null;
  place_of_supply: string | null;
  invoice_date: string;
  due_date: string | null;
  reverse_charge: string;
  ship_to: string | null;
  bank_details: string | null;
  terms_title: string | null;
  terms_detail: string | null;
  document_notes: string | null;
  tcs_value: number;
  tcs_type: string;
  discount_value: number;
  discount_type: string;
  round_off: number;
  payment_type: string;
  subtotal: number;
  gst_total: number;
  grand_total: number;
  notes: string | null;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  created_at: string;
  invoice_items?: InvoiceItem[];
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
  display_order: number;
  created_at: string;
};

export type Certificate = {
  id: string;
  title: string;
  issuer: string | null;
  issued_year: string | null;
  image_url: string | null;
  description: string | null;
  display_order: number;
  created_at: string;
};

export type AboutContent = {
  id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
};

export type ProductReview = {
  id: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  title: string | null;
  body: string | null;
  images: string[];
  status: 'pending' | 'approved' | 'rejected';
  admin_reply: string | null;
  created_at: string;
  updated_at: string;
};

export type HsnCode = {
  id: string;
  code: string;
  description: string | null;
  created_at: string;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  gst_percentage: number;
  hsn_sac_code: string | null;
  unit: string | null;
  item_note: string | null;
  discount_value: number;
  discount_type: string;
  stock_quantity: number | null;
  base_amount: number;
  gst_amount: number;
  total: number;
  created_at: string;
};

// ============================================================
// Business Management System Types
// ============================================================

export type Supplier = {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstin: string | null;
  pan: string | null;
  payment_terms: string | null;
  notes: string | null;
  company_type: 'customer' | 'vendor' | 'customer_vendor';
  registration_type: 'regular' | 'composition' | 'unregistered' | 'consumer';
  address_line_2: string | null;
  landmark: string | null;
  city: string | null;
  state: string | null;
  country: string;
  pincode: string | null;
  opening_balance: number;
  balance_type: 'credit' | 'debit';
  license_no: string | null;
  custom_field_1: string | null;
  custom_field_2: string | null;
  fax_no: string | null;
  website: string | null;
  credit_limit: number;
  due_days: number;
  visible_on_documents: boolean;
  created_at: string;
};

export type PurchaseOrder = {
  id: string;
  po_number: string;
  supplier_id: string | null;
  invoice_type: string;
  order_date: string;
  expected_date: string | null;
  due_date: string | null;
  status: 'draft' | 'received' | 'cancelled';
  vendor_address: string | null;
  vendor_contact_person: string | null;
  vendor_phone: string | null;
  vendor_gstin_pan: string | null;
  reverse_charge: string;
  ship_to: string | null;
  place_of_supply: string | null;
  invoice_no: string | null;
  invoice_date: string | null;
  challan_no: string | null;
  challan_date: string | null;
  lr_no: string | null;
  eway_no: string | null;
  delivery_mode: string | null;
  terms_title: string | null;
  terms_detail: string | null;
  document_notes: string | null;
  tcs_value: number;
  tcs_type: string;
  discount_value: number;
  discount_type: string;
  round_off: number;
  payment_type: string;
  update_product_price: boolean;
  subtotal: number;
  gst_total: number;
  grand_total: number;
  notes: string | null;
  created_at: string;
  suppliers?: Supplier | null;
  purchase_order_items?: PurchaseOrderItem[];
};

export type PurchaseOrderItem = {
  id: string;
  purchase_order_id: string;
  product_id: string | null;
  description: string;
  barcode_no: string | null;
  quantity: number;
  uom: string;
  unit_price: number;
  gst_percentage: number;
  hsn_sac_code: string | null;
  item_note: string | null;
  discount_value: number;
  discount_type: string;
  stock_quantity: number | null;
  base_amount: number;
  gst_amount: number;
  total: number;
  created_at: string;
  products?: Product | null;
};

export type StockMovement = {
  id: string;
  product_id: string;
  movement_type: 'purchase' | 'sale' | 'adjustment' | 'return' | 'transfer';
  quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_at: string;
  products?: Product;
};

export type OfflineSale = {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  customer_gst: string | null;
  subtotal: number;
  gst_total: number;
  grand_total: number;
  payment_status: 'unpaid' | 'partial' | 'paid';
  amount_paid: number;
  sale_date: string;
  notes: string | null;
  created_at: string;
  offline_sale_items?: OfflineSaleItem[];
};

export type OfflineSaleItem = {
  id: string;
  offline_sale_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  gst_percentage: number;
  base_amount: number;
  gst_amount: number;
  total: number;
  created_at: string;
  products?: Product | null;
};

export type Expense = {
  id: string;
  category: 'rent' | 'salaries' | 'utilities' | 'marketing' | 'purchasing' | 'logistics' | 'maintenance' | 'other';
  description: string;
  amount: number;
  gst_amount: number;
  total_amount: number;
  payment_mode: 'cash' | 'upi' | 'bank' | 'cheque' | 'card';
  paid_to: string | null;
  expense_date: string;
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
};

export type Payment = {
  id: string;
  payment_type: 'receivable' | 'payable';
  party_name: string;
  reference_type: string | null;
  reference_id: string | null;
  amount: number;
  payment_mode: 'cash' | 'upi' | 'bank' | 'cheque' | 'card';
  payment_date: string;
  transaction_id: string | null;
  notes: string | null;
  created_at: string;
};
