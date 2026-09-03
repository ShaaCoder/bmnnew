/*
# BMN Enterprises — Complete Database Schema

## Overview
Creates the entire database schema for the BMN Enterprises e-commerce platform in a single migration.
This includes product catalog, gallery, orders, contact queries, GST invoices with line items,
company settings for invoice branding, about page content, a storage bucket for images,
and an RPC function for sequential invoice numbers.

## 1. New Tables

### categories
Product categories shown on the storefront.
- id (uuid, PK)
- name (text, required)
- slug (text, unique — used in URLs)
- description (text, optional)
- image_url (text, optional)
- created_at (timestamptz)

### products
Individual products linked to a category.
- id (uuid, PK)
- category_id (uuid, FK → categories, SET NULL on delete)
- name (text, required)
- slug (text, unique — used in URLs)
- description (text, optional)
- price (numeric 10,2, required)
- gst_percentage (numeric, default 18 — Indian GST rate)
- images (text[], array of image URLs)
- stock (integer, default 0)
- featured (boolean, default false — shown on homepage)
- created_at (timestamptz)

### gallery
Visual gallery items shown on the public gallery page.
- id (uuid, PK)
- title (text, required)
- image_url (text, required)
- description (text, optional)
- display_order (integer — controls sort order)
- created_at (timestamptz)

### orders
Customer purchase requests submitted via the Buy modal.
- id (uuid, PK)
- product_id (uuid, FK → products, SET NULL on delete)
- product_name (text — snapshot at order time)
- product_price (numeric 10,2 — snapshot at order time)
- gst_percentage (numeric, default 18 — snapshot at order time)
- customer_name / email / phone / address (text, required)
- quantity (integer, default 1)
- notes (text, optional)
- status (text, CHECK: pending | confirmed | shipped | delivered | cancelled)
- created_at (timestamptz)

### contact_queries
Messages submitted via the public contact form.
- id (uuid, PK)
- name, email (text, required)
- phone, subject (text, optional)
- message (text, required)
- status (text, CHECK: new | read | replied)
- created_at (timestamptz)

### invoices
GST invoices / bills for the billing system.
- id (uuid, PK)
- invoice_number (text, unique — like INV-2026-0001)
- order_id (uuid, nullable FK → orders)
- customer_name, customer_email (text, required)
- customer_phone, customer_address, customer_gst, customer_pan (text, nullable)
- place_of_supply (text, nullable — GST code)
- invoice_date (date, default today)
- due_date (date, nullable)
- subtotal, gst_total, grand_total (numeric 12,2)
- notes (text, nullable)
- status (text, CHECK: draft | sent | paid | cancelled)
- created_at (timestamptz)

### invoice_items
Line items for each invoice.
- id (uuid, PK)
- invoice_id (uuid, FK → invoices, cascade delete)
- description (text, required)
- quantity (integer, default 1)
- unit_price (numeric 12,2)
- gst_percentage (numeric 5,2, default 18)
- hsn_sac_code (text, nullable — HSN/SAC classification)
- unit (text, nullable, default 'NOS' — unit of measurement)
- base_amount, gst_amount, total (numeric 12,2)
- created_at (timestamptz)

### company_settings
Singleton table (id=1) storing company/business details for invoice headers.
- id (int, PK, default 1, CHECK id=1)
- company_name (text, required)
- tagline, address, phone, email (text, nullable)
- gstin, pan (text, nullable — company tax IDs)
- bank_name, account_number, ifsc_code, branch, upi_id (text, nullable — bank details)
- logo_url, signature_url, qr_code_url (text, nullable — branding images)
- created_at, updated_at (timestamptz)

### team_members
Founder/team info for the About Us page.
- id (uuid, PK)
- name (text, required)
- role (text, required)
- bio (text, nullable)
- photo_url, linkedin_url (text, nullable)
- display_order (integer)
- created_at (timestamptz)

### certificates
Company certificates/awards for the About Us page.
- id (uuid, PK)
- title (text, required)
- issuer, issued_year, image_url, description (text, nullable)
- display_order (integer)
- created_at (timestamptz)

### about_content
Key/value store for the About Us page narrative content.
- id (uuid, PK)
- key (text, unique)
- value (text, required)
- created_at, updated_at (timestamptz)

## 2. Storage Bucket
- `images` bucket: public, 5MB file size limit, JPEG/PNG/WebP/GIF allowed.
- Public read (anon + authenticated).
- Authenticated-only write (upload, update, delete).

## 3. RPC Function
- `next_invoice_number()` — returns next value from invoice_number_seq.
- SECURITY DEFINER, callable by anon + authenticated.

## 4. Security (RLS)
All tables enable RLS. This is a single-tenant store where the public storefront
reads via anon key and the admin panel writes through the same client.
All policies use TO anon, authenticated with USING (true) / WITH CHECK (true) —
the data is intentionally shared. company_settings also has an anon SELECT policy
so the public site can display company info.

## 5. Seed Data
- 4 categories, 6 sample products, 6 gallery items
- 1 company_settings row (Bharat Advance)
- 3 about_content entries (mission, vision, story)
- 1 team_member (founder)
All inserts use ON CONFLICT DO NOTHING for idempotency.

## 6. Indexes
- products(category_id), products(featured)
- orders(status), orders(product_id)
- contact_queries(status)
- invoices(status), invoices(invoice_date), invoices(order_id)
- invoice_items(invoice_id)
*/

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  slug        text        NOT NULL UNIQUE,
  description text,
  image_url   text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_categories" ON categories;
CREATE POLICY "anon_select_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
CREATE POLICY "anon_insert_categories" ON categories FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_categories" ON categories;
CREATE POLICY "anon_update_categories" ON categories FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_categories" ON categories;
CREATE POLICY "anon_delete_categories" ON categories FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id              uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     uuid           REFERENCES categories(id) ON DELETE SET NULL,
  name            text           NOT NULL,
  slug            text           NOT NULL UNIQUE,
  description     text,
  price           numeric(10,2)  NOT NULL DEFAULT 0,
  gst_percentage  numeric        NOT NULL DEFAULT 18,
  images          text[]         DEFAULT '{}',
  stock           integer        NOT NULL DEFAULT 0,
  featured        boolean        NOT NULL DEFAULT false,
  created_at      timestamptz    DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured  ON products(featured);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- GALLERY
-- ============================================================
CREATE TABLE IF NOT EXISTS gallery (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text        NOT NULL,
  image_url     text        NOT NULL,
  description   text,
  display_order integer     NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_gallery" ON gallery;
CREATE POLICY "anon_select_gallery" ON gallery FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_gallery" ON gallery;
CREATE POLICY "anon_insert_gallery" ON gallery FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_gallery" ON gallery;
CREATE POLICY "anon_update_gallery" ON gallery FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_gallery" ON gallery;
CREATE POLICY "anon_delete_gallery" ON gallery FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       uuid          REFERENCES products(id) ON DELETE SET NULL,
  product_name     text          NOT NULL,
  product_price    numeric(10,2) NOT NULL,
  gst_percentage   numeric        NOT NULL DEFAULT 18,
  customer_name    text          NOT NULL,
  customer_email   text          NOT NULL,
  customer_phone   text          NOT NULL,
  customer_address text          NOT NULL,
  quantity         integer       NOT NULL DEFAULT 1,
  notes            text,
  status           text          NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  created_at       timestamptz   DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_status  ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_product ON orders(product_id);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_orders" ON orders;
CREATE POLICY "anon_delete_orders" ON orders FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- CONTACT QUERIES
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_queries (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  email      text        NOT NULL,
  phone      text,
  subject    text,
  message    text        NOT NULL,
  status     text        NOT NULL DEFAULT 'new'
             CHECK (status IN ('new','read','replied')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_queries(status);

ALTER TABLE contact_queries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_contact" ON contact_queries;
CREATE POLICY "anon_select_contact" ON contact_queries FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_contact" ON contact_queries;
CREATE POLICY "anon_insert_contact" ON contact_queries FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_contact" ON contact_queries;
CREATE POLICY "anon_update_contact" ON contact_queries FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_contact" ON contact_queries;
CREATE POLICY "anon_delete_contact" ON contact_queries FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- INVOICES + INVOICE ITEMS
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

CREATE TABLE IF NOT EXISTS invoices (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number   text          NOT NULL UNIQUE,
  order_id         uuid          REFERENCES orders(id) ON DELETE SET NULL,
  customer_name    text          NOT NULL,
  customer_email   text          NOT NULL,
  customer_phone   text,
  customer_address text,
  customer_gst     text,
  customer_pan     text,
  place_of_supply  text,
  invoice_date     date          NOT NULL DEFAULT CURRENT_DATE,
  due_date         date,
  subtotal         numeric(12,2) NOT NULL DEFAULT 0,
  gst_total        numeric(12,2) NOT NULL DEFAULT 0,
  grand_total      numeric(12,2) NOT NULL DEFAULT 0,
  notes            text,
  status           text          NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','sent','paid','cancelled')),
  created_at       timestamptz   DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date   ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_order  ON invoices(order_id);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_invoices" ON invoices;
CREATE POLICY "anon_select_invoices" ON invoices FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_invoices" ON invoices;
CREATE POLICY "anon_insert_invoices" ON invoices FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_invoices" ON invoices;
CREATE POLICY "anon_update_invoices" ON invoices FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_invoices" ON invoices;
CREATE POLICY "anon_delete_invoices" ON invoices FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS invoice_items (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      uuid          NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description     text          NOT NULL,
  quantity        integer       NOT NULL DEFAULT 1,
  unit_price      numeric(12,2) NOT NULL DEFAULT 0,
  gst_percentage  numeric(5,2)  NOT NULL DEFAULT 18,
  hsn_sac_code    text,
  unit            text          DEFAULT 'NOS',
  base_amount     numeric(12,2) NOT NULL DEFAULT 0,
  gst_amount      numeric(12,2) NOT NULL DEFAULT 0,
  total           numeric(12,2) NOT NULL DEFAULT 0,
  created_at      timestamptz   DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_invoice_items" ON invoice_items;
CREATE POLICY "anon_select_invoice_items" ON invoice_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_invoice_items" ON invoice_items;
CREATE POLICY "anon_insert_invoice_items" ON invoice_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_invoice_items" ON invoice_items;
CREATE POLICY "anon_update_invoice_items" ON invoice_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_invoice_items" ON invoice_items;
CREATE POLICY "anon_delete_invoice_items" ON invoice_items FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- COMPANY SETTINGS (singleton, id=1)
-- ============================================================
CREATE TABLE IF NOT EXISTS company_settings (
  id              int          PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  company_name    text         NOT NULL DEFAULT 'Bharat Advance',
  tagline         text,
  address         text,
  phone           text,
  email           text,
  gstin           text,
  pan             text,
  bank_name       text,
  account_number  text,
  ifsc_code       text,
  branch          text,
  upi_id          text,
  logo_url        text,
  signature_url   text,
  qr_code_url     text,
  created_at      timestamptz  DEFAULT now(),
  updated_at      timestamptz  DEFAULT now()
);

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_company_settings" ON company_settings;
CREATE POLICY "select_company_settings" ON company_settings FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Public can view company settings" ON company_settings;
CREATE POLICY "Public can view company settings" ON company_settings
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "insert_company_settings" ON company_settings;
CREATE POLICY "insert_company_settings" ON company_settings
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_company_settings" ON company_settings;
CREATE POLICY "update_company_settings" ON company_settings
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_company_settings" ON company_settings;
CREATE POLICY "delete_company_settings" ON company_settings
  FOR DELETE TO authenticated USING (true);

INSERT INTO company_settings (id, company_name, tagline, address, phone, email)
VALUES (1, 'Bharat Advance', 'GST Invoice', '123 Business Avenue, Commercial District, City - 400001', '+91 98765 43210', 'info@bharatadvance.com')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TEAM MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS team_members (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  role          text        NOT NULL,
  bio           text,
  photo_url     text,
  linkedin_url  text,
  display_order integer     NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_team_members" ON team_members;
CREATE POLICY "anon_select_team_members" ON team_members FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_team_members" ON team_members;
CREATE POLICY "anon_insert_team_members" ON team_members FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_team_members" ON team_members;
CREATE POLICY "anon_update_team_members" ON team_members FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_team_members" ON team_members;
CREATE POLICY "anon_delete_team_members" ON team_members FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- CERTIFICATES
-- ============================================================
CREATE TABLE IF NOT EXISTS certificates (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text        NOT NULL,
  issuer        text,
  issued_year   text,
  image_url     text,
  description   text,
  display_order integer     NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_certificates" ON certificates;
CREATE POLICY "anon_select_certificates" ON certificates FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_certificates" ON certificates;
CREATE POLICY "anon_insert_certificates" ON certificates FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_certificates" ON certificates;
CREATE POLICY "anon_update_certificates" ON certificates FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_certificates" ON certificates;
CREATE POLICY "anon_delete_certificates" ON certificates FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- ABOUT CONTENT (key/value store)
-- ============================================================
CREATE TABLE IF NOT EXISTS about_content (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text        UNIQUE NOT NULL,
  value      text        NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE about_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_about_content" ON about_content;
CREATE POLICY "anon_select_about_content" ON about_content FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_about_content" ON about_content;
CREATE POLICY "anon_insert_about_content" ON about_content FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_about_content" ON about_content;
CREATE POLICY "anon_update_about_content" ON about_content FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_about_content" ON about_content;
CREATE POLICY "anon_delete_about_content" ON about_content FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- RPC: next_invoice_number()
-- ============================================================
CREATE OR REPLACE FUNCTION next_invoice_number()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT nextval('invoice_number_seq');
$$;

GRANT EXECUTE ON FUNCTION next_invoice_number() TO anon, authenticated;

-- ============================================================
-- STORAGE BUCKET: images
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "images_public_select" ON storage.objects;
CREATE POLICY "images_public_select"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'images');

DROP POLICY IF EXISTS "images_auth_insert" ON storage.objects;
CREATE POLICY "images_auth_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

DROP POLICY IF EXISTS "images_auth_update" ON storage.objects;
CREATE POLICY "images_auth_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images');

DROP POLICY IF EXISTS "images_auth_delete" ON storage.objects;
CREATE POLICY "images_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images');

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO categories (name, slug, description, image_url) VALUES
  ('Electronics',      'electronics',     'Latest gadgets and electronic devices',      'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg'),
  ('Home & Living',    'home-living',      'Beautiful home decor and essentials',        'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'),
  ('Fashion',          'fashion',          'Trendy clothing and accessories',             'https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg'),
  ('Sports & Outdoors','sports-outdoors',  'Sports equipment and outdoor gear',          'https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (category_id, name, slug, description, price, images, stock, featured) VALUES
  (
    (SELECT id FROM categories WHERE slug='electronics'),
    'Wireless Headphones Pro', 'wireless-headphones-pro',
    'Premium wireless headphones with noise cancellation and 30-hour battery life.',
    4999, ARRAY['https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg','https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg'],
    25, true
  ),
  (
    (SELECT id FROM categories WHERE slug='electronics'),
    'Smart Watch Series X', 'smart-watch-series-x',
    'Feature-packed smartwatch with health monitoring and GPS.',
    8999, ARRAY['https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg'],
    15, true
  ),
  (
    (SELECT id FROM categories WHERE slug='home-living'),
    'Ceramic Vase Set', 'ceramic-vase-set',
    'Handcrafted ceramic vases in three sizes. Perfect for modern interiors.',
    1299, ARRAY['https://images.pexels.com/photos/1109197/pexels-photo-1109197.jpeg'],
    40, false
  ),
  (
    (SELECT id FROM categories WHERE slug='home-living'),
    'Luxury Bed Linen Set', 'luxury-bed-linen-set',
    '100% Egyptian cotton bed linen set. Ultra-soft and breathable.',
    2499, ARRAY['https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg'],
    30, true
  ),
  (
    (SELECT id FROM categories WHERE slug='fashion'),
    'Leather Crossbody Bag', 'leather-crossbody-bag',
    'Genuine leather crossbody bag with multiple compartments.',
    3499, ARRAY['https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg'],
    20, true
  ),
  (
    (SELECT id FROM categories WHERE slug='sports-outdoors'),
    'Yoga Mat Premium', 'yoga-mat-premium',
    'Non-slip yoga mat with alignment lines. 6mm thick for superior cushioning.',
    999, ARRAY['https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg'],
    50, false
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO gallery (title, image_url, description, display_order) VALUES
  ('Our Showroom',      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg', 'Our beautifully designed showroom', 1),
  ('Product Collection','https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg',   'Curated product collection',        2),
  ('Fashion Line',      'https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg',   'Latest fashion arrivals',           3),
  ('Sports Range',      'https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg',   'Sports and outdoor collection',     4),
  ('Home Decor',        'https://images.pexels.com/photos/1109197/pexels-photo-1109197.jpeg', 'Home decoration pieces',            5),
  ('Accessories',       'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg', 'Premium accessories',               6)
ON CONFLICT DO NOTHING;

INSERT INTO about_content (key, value) VALUES
  ('mission', 'At Bharat Advance, our mission is to deliver premium quality products that improve everyday lives — combining traditional Indian craftsmanship with modern standards of excellence.'),
  ('vision', 'To be India''s most trusted multi-category enterprise, known for integrity, quality, and a customer-first approach that touches every household.'),
  ('story', 'Founded in the heart of Delhi, Bharat Advance began as a small venture with a big dream — to make quality accessible to every Indian. Over the years we have grown into a trusted brand serving thousands of customers across the country, always staying true to our roots and values.')
ON CONFLICT (key) DO NOTHING;

INSERT INTO team_members (name, role, bio, display_order) VALUES
  ('BMN Enterprises', 'Founder & CEO', 'Visionary entrepreneur and founder of Bharat Advance, driving the company''s mission to deliver quality products across India with an unwavering commitment to customer satisfaction and ethical business practices.', 0)
ON CONFLICT DO NOTHING;