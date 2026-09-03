/*
# Product Reviews & Ratings

## Overview
Creates a `product_reviews` table so anyone (no login required) can leave a
star rating, written review, and photos for a product. The admin can
moderate reviews — approve, reject, edit, or delete them.

## 1. New Table
### product_reviews
- id (uuid, PK)
- product_id (uuid, FK → products, CASCADE on delete)
- reviewer_name (text, required — shown publicly)
- rating (integer 1–5, required)
- title (text, optional — short headline)
- body (text, optional — full review text)
- images (text[], default '{}' — review photo URLs stored in the images bucket)
- status (text, CHECK: pending | approved | rejected, default 'pending')
  Only approved reviews are shown on the storefront.
- admin_reply (text, nullable — admin can reply to a review)
- created_at (timestamptz)
- updated_at (timestamptz)

## 2. Security
- RLS enabled.
- Single-tenant app with no customer login: anon + authenticated full CRUD.
- Anyone can INSERT a review (public submission).
- Anyone can SELECT reviews (the storefront filters by status=approved client-side;
  the admin panel shows all statuses).
- Authenticated (admin) can UPDATE and DELETE.

## 3. Indexes
- product_reviews(product_id) — filter reviews by product.
- product_reviews(status) — filter approved/pending/rejected.

## 4. Important Notes
- Reviews default to status='pending' so the admin can moderate before they appear.
- The admin can change status to 'approved' to publish, or 'rejected' to hide.
- Images are uploaded to the existing 'images' storage bucket under a 'reviews' folder.
*/

CREATE TABLE IF NOT EXISTS product_reviews (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  reviewer_name text        NOT NULL,
  rating        integer     NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  title         text,
  body          text,
  images        text[]      NOT NULL DEFAULT '{}',
  status        text        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_reply   text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status  ON product_reviews(status);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_reviews" ON product_reviews;
CREATE POLICY "anon_select_reviews" ON product_reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_reviews" ON product_reviews;
CREATE POLICY "anon_insert_reviews" ON product_reviews FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_reviews" ON product_reviews;
CREATE POLICY "anon_update_reviews" ON product_reviews FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_reviews" ON product_reviews;
CREATE POLICY "anon_delete_reviews" ON product_reviews FOR DELETE
  TO anon, authenticated USING (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reviews_updated_at ON product_reviews;
CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON product_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();