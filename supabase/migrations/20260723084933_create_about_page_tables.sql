/*
# About Page Content Tables

1. New Tables
  - `team_members` — stores founder/team info (name, role, bio, photo, display order)
  - `certificates` — stores company certificates/awards (title, image, issuer, year, display order)
  - `about_content` — single-row key/value store for the About Us page narrative content

2. Security
  - RLS enabled on all tables with anon+authenticated read/write (admin-managed, public-facing site with no separate auth for about content)
*/

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  bio text,
  photo_url text,
  linkedin_url text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_team_members" ON team_members;
CREATE POLICY "anon_select_team_members" ON team_members FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_team_members" ON team_members;
CREATE POLICY "anon_insert_team_members" ON team_members FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_team_members" ON team_members;
CREATE POLICY "anon_update_team_members" ON team_members FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_team_members" ON team_members;
CREATE POLICY "anon_delete_team_members" ON team_members FOR DELETE TO anon, authenticated USING (true);

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  issuer text,
  issued_year text,
  image_url text,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_certificates" ON certificates;
CREATE POLICY "anon_select_certificates" ON certificates FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_certificates" ON certificates;
CREATE POLICY "anon_insert_certificates" ON certificates FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_certificates" ON certificates;
CREATE POLICY "anon_update_certificates" ON certificates FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_certificates" ON certificates;
CREATE POLICY "anon_delete_certificates" ON certificates FOR DELETE TO anon, authenticated USING (true);

-- About content key-value store (single row, upsert by key)
CREATE TABLE IF NOT EXISTS about_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE about_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_about_content" ON about_content;
CREATE POLICY "anon_select_about_content" ON about_content FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_about_content" ON about_content;
CREATE POLICY "anon_insert_about_content" ON about_content FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_about_content" ON about_content;
CREATE POLICY "anon_update_about_content" ON about_content FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_about_content" ON about_content;
CREATE POLICY "anon_delete_about_content" ON about_content FOR DELETE TO anon, authenticated USING (true);

-- Seed default about content
INSERT INTO about_content (key, value) VALUES
  ('mission', 'At Bharat Advance, our mission is to deliver premium quality products that improve everyday lives — combining traditional Indian craftsmanship with modern standards of excellence.'),
  ('vision', 'To be India''s most trusted multi-category enterprise, known for integrity, quality, and a customer-first approach that touches every household.'),
  ('story', 'Founded in the heart of Delhi, Bharat Advance began as a small venture with a big dream — to make quality accessible to every Indian. Over the years we have grown into a trusted brand serving thousands of customers across the country, always staying true to our roots and values.')
ON CONFLICT (key) DO NOTHING;

-- Seed founder
INSERT INTO team_members (name, role, bio, display_order) VALUES
  ('BMN Enterprises', 'Founder & CEO', 'Visionary entrepreneur and founder of Bharat Advance, driving the company''s mission to deliver quality products across India with an unwavering commitment to customer satisfaction and ethical business practices.', 0)
ON CONFLICT DO NOTHING;
