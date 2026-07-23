
/*
# BMN Enterprises E-Commerce Schema

## Overview
Creates the full schema for BMN Enterprises mini e-commerce platform.

## Tables

### categories
Stores product categories with name, slug, description and optional image.

### products
Stores products linked to categories. Includes name, slug, description, price, images (array), stock, featured flag.

### gallery
Stores gallery images with title, image URL, description, and display order.

### orders
Stores purchase requests from customers. Links to a product, captures customer info (name, email, phone, address), quantity, notes, and status.

### contact_queries
Stores messages from the contact form. Captures name, email, phone, message, and status (new/read/replied).

## Security
All tables use RLS with anon + authenticated access (no auth required for public operations).
Admin writes go through the same anon key (single-tenant app).
*/

-- CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_categories" ON categories;
CREATE POLICY "anon_select_categories" ON categories FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
CREATE POLICY "anon_insert_categories" ON categories FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_categories" ON categories;
CREATE POLICY "anon_update_categories" ON categories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_categories" ON categories;
CREATE POLICY "anon_delete_categories" ON categories FOR DELETE TO anon, authenticated USING (true);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  images text[] DEFAULT '{}',
  stock integer NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products FOR DELETE TO anon, authenticated USING (true);

-- GALLERY
CREATE TABLE IF NOT EXISTS gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text NOT NULL,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_gallery" ON gallery;
CREATE POLICY "anon_select_gallery" ON gallery FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_gallery" ON gallery;
CREATE POLICY "anon_insert_gallery" ON gallery FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_gallery" ON gallery;
CREATE POLICY "anon_update_gallery" ON gallery FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_gallery" ON gallery;
CREATE POLICY "anon_delete_gallery" ON gallery FOR DELETE TO anon, authenticated USING (true);

-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_price numeric(10,2) NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  customer_address text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_product ON orders(product_id);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_orders" ON orders;
CREATE POLICY "anon_delete_orders" ON orders FOR DELETE TO anon, authenticated USING (true);

-- CONTACT QUERIES
CREATE TABLE IF NOT EXISTS contact_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','read','replied')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_queries(status);

ALTER TABLE contact_queries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_contact" ON contact_queries;
CREATE POLICY "anon_select_contact" ON contact_queries FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_contact" ON contact_queries;
CREATE POLICY "anon_insert_contact" ON contact_queries FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_contact" ON contact_queries;
CREATE POLICY "anon_update_contact" ON contact_queries FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_contact" ON contact_queries;
CREATE POLICY "anon_delete_contact" ON contact_queries FOR DELETE TO anon, authenticated USING (true);

-- SEED DATA
INSERT INTO categories (name, slug, description, image_url) VALUES
  ('Electronics', 'electronics', 'Latest gadgets and electronic devices', 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg'),
  ('Home & Living', 'home-living', 'Beautiful home decor and essentials', 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'),
  ('Fashion', 'fashion', 'Trendy clothing and accessories', 'https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg'),
  ('Sports & Outdoors', 'sports-outdoors', 'Sports equipment and outdoor gear', 'https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (category_id, name, slug, description, price, images, stock, featured) VALUES
  ((SELECT id FROM categories WHERE slug='electronics'), 'Wireless Headphones Pro', 'wireless-headphones-pro', 'Premium wireless headphones with noise cancellation and 30-hour battery life.', 4999, ARRAY['https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg','https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg'], 25, true),
  ((SELECT id FROM categories WHERE slug='electronics'), 'Smart Watch Series X', 'smart-watch-series-x', 'Feature-packed smartwatch with health monitoring and GPS.', 8999, ARRAY['https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg'], 15, true),
  ((SELECT id FROM categories WHERE slug='home-living'), 'Ceramic Vase Set', 'ceramic-vase-set', 'Handcrafted ceramic vases in three sizes. Perfect for modern interiors.', 1299, ARRAY['https://images.pexels.com/photos/1109197/pexels-photo-1109197.jpeg'], 40, false),
  ((SELECT id FROM categories WHERE slug='home-living'), 'Luxury Bed Linen Set', 'luxury-bed-linen-set', '100% Egyptian cotton bed linen set. Ultra-soft and breathable.', 2499, ARRAY['https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg'], 30, true),
  ((SELECT id FROM categories WHERE slug='fashion'), 'Leather Crossbody Bag', 'leather-crossbody-bag', 'Genuine leather crossbody bag with multiple compartments.', 3499, ARRAY['https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg'], 20, true),
  ((SELECT id FROM categories WHERE slug='sports-outdoors'), 'Yoga Mat Premium', 'yoga-mat-premium', 'Non-slip yoga mat with alignment lines. 6mm thick for superior cushioning.', 999, ARRAY['https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg'], 50, false)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO gallery (title, image_url, description, display_order) VALUES
  ('Our Showroom', 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg', 'Our beautifully designed showroom', 1),
  ('Product Collection', 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg', 'Curated product collection', 2),
  ('Fashion Line', 'https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg', 'Latest fashion arrivals', 3),
  ('Sports Range', 'https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg', 'Sports and outdoor collection', 4),
  ('Home Decor', 'https://images.pexels.com/photos/1109197/pexels-photo-1109197.jpeg', 'Home decoration pieces', 5),
  ('Accessories', 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg', 'Premium accessories', 6)
ON CONFLICT DO NOTHING;
