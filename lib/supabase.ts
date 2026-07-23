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
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_address: string | null;
  customer_gst: string | null;
  customer_pan: string | null;
  place_of_supply: string | null;
  invoice_date: string;
  due_date: string | null;
  subtotal: number;
  gst_total: number;
  grand_total: number;
  notes: string | null;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  created_at: string;
  invoice_items?: InvoiceItem[];
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
  base_amount: number;
  gst_amount: number;
  total: number;
  created_at: string;
};
