-- =====================================================
-- E-Commerce Product Schema Migration
-- This removes ingredients and adds comprehensive e-commerce attributes
-- =====================================================

-- 1. DROP old ingredient-related tables
DROP TABLE IF EXISTS public.product_variant_ingredients CASCADE;

-- 2. UPDATE products table - Remove ingredients column and add e-commerce fields
ALTER TABLE public.products
  DROP COLUMN IF EXISTS ingredients CASCADE;

-- Add inventory management fields
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku VARCHAR(100) UNIQUE,
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_stock_alert INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS manage_stock BOOLEAN DEFAULT true;

-- Add physical properties
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS weight NUMERIC(10, 3),
  ADD COLUMN IF NOT EXISTS weight_unit VARCHAR(10) DEFAULT 'kg',
  ADD COLUMN IF NOT EXISTS length NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS width NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS height NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS dimension_unit VARCHAR(10) DEFAULT 'cm';

-- Add product classification
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS brand VARCHAR(100),
  ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(100),
  ADD COLUMN IF NOT EXISTS condition VARCHAR(50) DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Add SEO fields
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- Add shipping information
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS shipping_class VARCHAR(50),
  ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS shipping_days_min INTEGER,
  ADD COLUMN IF NOT EXISTS shipping_days_max INTEGER;

-- Add product status flags
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_sale BOOLEAN DEFAULT false;

-- Add additional details
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS warranty_info TEXT,
  ADD COLUMN IF NOT EXISTS return_policy TEXT,
  ADD COLUMN IF NOT EXISTS care_instructions TEXT;

-- Add video URL for product
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 3. CREATE product_images table for multiple images per product
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT product_images_pkey PRIMARY KEY (id),
  CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id)
    REFERENCES products (id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_product_images_product_id
  ON public.product_images USING btree (product_id) TABLESPACE pg_default;

-- 4. CREATE product_attributes table for dynamic attributes (color, size, material, etc.)
CREATE TABLE IF NOT EXISTS public.product_attributes (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  attribute_name VARCHAR(100) NOT NULL,
  attribute_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT product_attributes_pkey PRIMARY KEY (id),
  CONSTRAINT product_attributes_product_id_fkey FOREIGN KEY (product_id)
    REFERENCES products (id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_product_attributes_product_id
  ON public.product_attributes USING btree (product_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_product_attributes_name
  ON public.product_attributes USING btree (attribute_name) TABLESPACE pg_default;

-- 5. CREATE product_specifications table for detailed specs
CREATE TABLE IF NOT EXISTS public.product_specifications (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  spec_name VARCHAR(100) NOT NULL,
  spec_value TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT product_specifications_pkey PRIMARY KEY (id),
  CONSTRAINT product_specifications_product_id_fkey FOREIGN KEY (product_id)
    REFERENCES products (id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_product_specifications_product_id
  ON public.product_specifications USING btree (product_id) TABLESPACE pg_default;

-- 6. UPDATE product_variants table to support e-commerce variants
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS sku VARCHAR(100) UNIQUE,
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS weight NUMERIC(10, 3),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 7. CREATE indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_sku
  ON public.products USING btree (sku) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_products_slug
  ON public.products USING btree (slug) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_products_brand
  ON public.products USING btree (brand) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_products_featured
  ON public.products USING btree (is_featured)
  WHERE is_featured = true TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_products_tags
  ON public.products USING gin (tags) TABLESPACE pg_default;

-- 8. Add check constraints
ALTER TABLE public.products
  ADD CONSTRAINT check_stock_quantity_positive
    CHECK (stock_quantity >= 0),
  ADD CONSTRAINT check_condition_valid
    CHECK (condition IN ('new', 'used', 'refurbished'));

-- 9. Add trigger to auto-generate slug from name
CREATE OR REPLACE FUNCTION generate_slug_from_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
    NEW.slug := regexp_replace(NEW.slug, '^-+|-+$', '', 'g');

    -- Handle duplicates by appending UUID
    IF EXISTS (SELECT 1 FROM products WHERE slug = NEW.slug AND id != NEW.id) THEN
      NEW.slug := NEW.slug || '-' || substring(gen_random_uuid()::text, 1, 8);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_slug
  BEFORE INSERT OR UPDATE OF name, slug ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION generate_slug_from_name();

-- 10. Add comments for documentation
COMMENT ON TABLE public.products IS 'E-commerce products with comprehensive attributes';
COMMENT ON TABLE public.product_images IS 'Multiple images per product with sort order';
COMMENT ON TABLE public.product_attributes IS 'Dynamic product attributes (color, size, material, etc.)';
COMMENT ON TABLE public.product_specifications IS 'Detailed product specifications with custom fields';
COMMENT ON COLUMN public.products.sku IS 'Stock Keeping Unit - unique identifier';
COMMENT ON COLUMN public.products.slug IS 'URL-friendly product identifier, auto-generated from name';
COMMENT ON COLUMN public.products.tags IS 'Array of product tags for categorization and search';
COMMENT ON COLUMN public.products.condition IS 'Product condition: new, used, or refurbished';
