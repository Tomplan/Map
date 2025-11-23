-- Migration 007: Create categories system for exhibitors
-- This enables multi-category assignment to companies with full localization support

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table (core category definitions)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  icon TEXT, -- Material Design icon name (e.g., 'mdiCarOutline')
  color TEXT, -- Hex color for UI theming (e.g., '#1976d2')
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Category translations (localized names and descriptions)
CREATE TABLE IF NOT EXISTS category_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('nl', 'en', 'de')),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, language)
);

-- Company-Category junction table (many-to-many)
CREATE TABLE IF NOT EXISTS company_categories (
  company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (company_id, category_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_category_translations_category_id ON category_translations(category_id);
CREATE INDEX IF NOT EXISTS idx_category_translations_language ON category_translations(language);
CREATE INDEX IF NOT EXISTS idx_company_categories_company_id ON company_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_company_categories_category_id ON company_categories(category_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for categories updated_at
DROP TRIGGER IF EXISTS categories_updated_at_trigger ON categories;
CREATE TRIGGER categories_updated_at_trigger
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_updated_at();

-- Insert initial categories with translations
DO $$
DECLARE
  cat_vehicles UUID;
  cat_camping UUID;
  cat_trailers UUID;
  cat_parts UUID;
  cat_travel UUID;
  cat_accommodations UUID;
  cat_clubs UUID;
  cat_offroad UUID;
  cat_electronics UUID;
  cat_other UUID;
BEGIN
  -- 1. Voertuigen & Dealers
  INSERT INTO categories (slug, icon, color, sort_order) 
  VALUES ('vehicles-dealers', 'mdiCarOutline', '#1976d2', 1)
  RETURNING id INTO cat_vehicles;
  
  INSERT INTO category_translations (category_id, language, name, description) VALUES
  (cat_vehicles, 'nl', 'Voertuigen & Dealers', 'Autodealers, importeurs en gespecialiseerde 4x4 merken'),
  (cat_vehicles, 'en', 'Vehicles & Dealers', 'Car dealers, importers and specialized 4x4 brands'),
  (cat_vehicles, 'de', 'Fahrzeuge & Händler', 'Autohändler, Importeure und spezialisierte 4x4-Marken');

  -- 2. Kampeermiddelen & Trailers
  INSERT INTO categories (slug, icon, color, sort_order) 
  VALUES ('camping-trailers', 'mdiTent', '#2e7d32', 2)
  RETURNING id INTO cat_camping;
  
  INSERT INTO category_translations (category_id, language, name, description) VALUES
  (cat_camping, 'nl', 'Kampeermiddelen & Trailers', 'Caravans, tenttrailers, daktenten en kampeeruitrusting'),
  (cat_camping, 'en', 'Camping Equipment & Trailers', 'Caravans, tent trailers, roof tents and camping gear'),
  (cat_camping, 'de', 'Campingausrüstung & Anhänger', 'Wohnwagen, Zeltanhänger, Dachzelte und Campingausrüstung');

  -- 3. Aanhangwagens & Uitrusting
  INSERT INTO categories (slug, icon, color, sort_order) 
  VALUES ('trailers-towing', 'mdiTrailer', '#f57c00', 3)
  RETURNING id INTO cat_trailers;
  
  INSERT INTO category_translations (category_id, language, name, description) VALUES
  (cat_trailers, 'nl', 'Aanhangwagens & Uitrusting', 'Aanhangwagenfabrikanten en trekhaak accessoires'),
  (cat_trailers, 'en', 'Trailers & Towing Equipment', 'Trailer manufacturers and towing accessories'),
  (cat_trailers, 'de', 'Anhänger & Anhängerzubehör', 'Anhängerhersteller und Anhängerzubehör');

  -- 4. Onderdelen & Accessoires
  INSERT INTO categories (slug, icon, color, sort_order) 
  VALUES ('parts-accessories', 'mdiCog', '#5e35b1', 4)
  RETURNING id INTO cat_parts;
  
  INSERT INTO category_translations (category_id, language, name, description) VALUES
  (cat_parts, 'nl', 'Onderdelen & Accessoires', 'Voertuigonderdelen, modificaties en technische accessoires'),
  (cat_parts, 'en', 'Parts & Accessories', 'Vehicle parts, modifications and technical accessories'),
  (cat_parts, 'de', 'Teile & Zubehör', 'Fahrzeugteile, Modifikationen und technisches Zubehör');

  -- 5. Reisorganisaties & Tours
  INSERT INTO categories (slug, icon, color, sort_order) 
  VALUES ('travel-tours', 'mdiEarth', '#00897b', 5)
  RETURNING id INTO cat_travel;
  
  INSERT INTO category_translations (category_id, language, name, description) VALUES
  (cat_travel, 'nl', 'Reisorganisaties & Tours', 'Touroperators en reisbureaus gespecialiseerd in 4x4 avonturen'),
  (cat_travel, 'en', 'Travel Organizations & Tours', 'Tour operators and travel agencies specializing in 4x4 adventures'),
  (cat_travel, 'de', 'Reiseveranstalter & Touren', 'Reiseveranstalter und Reisebüros spezialisiert auf 4x4-Abenteuer');

  -- 6. Accommodaties
  INSERT INTO categories (slug, icon, color, sort_order) 
  VALUES ('accommodations', 'mdiHomeOutline', '#c62828', 6)
  RETURNING id INTO cat_accommodations;
  
  INSERT INTO category_translations (category_id, language, name, description) VALUES
  (cat_accommodations, 'nl', 'Accommodaties', 'Campings en avontuurlijke verblijven'),
  (cat_accommodations, 'en', 'Accommodations', 'Campsites and adventure lodges'),
  (cat_accommodations, 'de', 'Unterkünfte', 'Campingplätze und Abenteuerunterkünfte');

  -- 7. Clubs & Gemeenschappen
  INSERT INTO categories (slug, icon, color, sort_order) 
  VALUES ('clubs-communities', 'mdiAccountGroup', '#6d4c41', 7)
  RETURNING id INTO cat_clubs;
  
  INSERT INTO category_translations (category_id, language, name, description) VALUES
  (cat_clubs, 'nl', 'Clubs & Gemeenschappen', 'Liefhebbersclubs en eigenaargroepen'),
  (cat_clubs, 'en', 'Clubs & Communities', 'Enthusiast clubs and owner groups'),
  (cat_clubs, 'de', 'Clubs & Gemeinschaften', 'Enthusiasten-Clubs und Besitzergruppen');

  -- 8. Terrein & Offroad Ervaringen
  INSERT INTO categories (slug, icon, color, sort_order) 
  VALUES ('offroad-experiences', 'mdiMountain', '#d84315', 8)
  RETURNING id INTO cat_offroad;
  
  INSERT INTO category_translations (category_id, language, name, description) VALUES
  (cat_offroad, 'nl', 'Terrein & Offroad Ervaringen', 'Offroad rijervaring en training'),
  (cat_offroad, 'en', 'Terrain & Offroad Experiences', 'Offroad driving experiences and training'),
  (cat_offroad, 'de', 'Gelände & Offroad-Erlebnisse', 'Offroad-Fahrerlebnisse und Training');

  -- 9. Elektronica & Communicatie
  INSERT INTO categories (slug, icon, color, sort_order) 
  VALUES ('electronics-communication', 'mdiCellphone', '#455a64', 9)
  RETURNING id INTO cat_electronics;
  
  INSERT INTO category_translations (category_id, language, name, description) VALUES
  (cat_electronics, 'nl', 'Elektronica & Communicatie', 'Navigatie, communicatieapparatuur en technologie'),
  (cat_electronics, 'en', 'Electronics & Communication', 'Navigation, communication devices and technology'),
  (cat_electronics, 'de', 'Elektronik & Kommunikation', 'Navigation, Kommunikationsgeräte und Technologie');

  -- 10. Overig
  INSERT INTO categories (slug, icon, color, sort_order) 
  VALUES ('other', 'mdiDotsHorizontal', '#757575', 10)
  RETURNING id INTO cat_other;
  
  INSERT INTO category_translations (category_id, language, name, description) VALUES
  (cat_other, 'nl', 'Overig', 'Unieke exposanten en andere diensten'),
  (cat_other, 'en', 'Other', 'Unique exhibitors and other services'),
  (cat_other, 'de', 'Sonstiges', 'Einzigartige Aussteller und andere Dienstleistungen');

END $$;

-- RLS Policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_categories ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);
CREATE POLICY "Category translations are viewable by everyone" ON category_translations FOR SELECT USING (true);
CREATE POLICY "Company categories are viewable by everyone" ON company_categories FOR SELECT USING (true);

-- Admin write access
CREATE POLICY "Admins can insert categories" ON categories FOR INSERT 
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can update categories" ON categories FOR UPDATE 
  USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can delete categories" ON categories FOR DELETE 
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can insert category translations" ON category_translations FOR INSERT 
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can update category translations" ON category_translations FOR UPDATE 
  USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can delete category translations" ON category_translations FOR DELETE 
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can insert company categories" ON company_categories FOR INSERT 
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can delete company categories" ON company_categories FOR DELETE 
  USING (auth.jwt() ->> 'role' = 'admin');

COMMENT ON TABLE categories IS 'Core category definitions for organizing exhibitors';
COMMENT ON TABLE category_translations IS 'Localized category names and descriptions';
COMMENT ON TABLE company_categories IS 'Many-to-many relationship between companies and categories';
