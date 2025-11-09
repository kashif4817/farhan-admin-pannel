-- Migration: Enhance Products Schema for E-commerce
-- Date: 2025-01-07
-- Description: Add marketing flags, remove unused fields, and enhance product schema

-- =====================================================
-- STEP 1: DROP UNUSED/REDUNDANT FIELDS
-- =====================================================

-- Remove care_instructions (not commonly used for eyeglasses)
ALTER TABLE public.products
  DROP COLUMN IF EXISTS care_instructions;

-- =====================================================
-- STEP 2: ADD E-COMMERCE MARKETING FIELDS
-- =====================================================

-- Add product status and marketing flags (separate ALTER statements)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku VARCHAR(100);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS dimensions VARCHAR(100);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_hot_item BOOLEAN DEFAULT false;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN DEFAULT false;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT false;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN DEFAULT false;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- Add unique constraint for SKU (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_sku_key'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_sku_key UNIQUE (sku);
  END IF;
END $$;

-- =====================================================
-- STEP 3: ADD EYEGLASSES-SPECIFIC FIELDS
-- =====================================================

-- Add fields specific to eyeglasses products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS frame_type VARCHAR(50);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS lens_type VARCHAR(50);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS gender VARCHAR(20);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS color VARCHAR(100);

-- Add constraint for frame_type (drop first if exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_frame_type'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT check_frame_type
        CHECK (frame_type IS NULL OR frame_type IN (
          'Full-Rim',
          'Semi-Rimless',
          'Rimless',
          'Browline',
          'Aviator',
          'Wayfarer',
          'Cat-Eye',
          'Round',
          'Square',
          'Rectangle'
        ));
  END IF;
END $$;

-- Add constraint for lens_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_lens_type'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT check_lens_type
        CHECK (lens_type IS NULL OR lens_type IN (
          'Single Vision',
          'Bifocal',
          'Progressive',
          'Reading',
          'Sunglasses',
          'Blue Light',
          'Photochromic',
          'Polarized'
        ));
  END IF;
END $$;

-- Add constraint for gender
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_gender'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT check_gender
        CHECK (gender IS NULL OR gender IN ('Men', 'Women', 'Unisex', 'Kids'));
  END IF;
END $$;

-- =====================================================
-- STEP 4: CREATE INDEXES FOR NEW FIELDS
-- =====================================================

-- Indexes for marketing flags (partial indexes for better performance)
CREATE INDEX IF NOT EXISTS idx_products_hot_item
  ON public.products(is_hot_item)
  WHERE is_hot_item = true;

CREATE INDEX IF NOT EXISTS idx_products_new_arrival
  ON public.products(is_new_arrival)
  WHERE is_new_arrival = true;

CREATE INDEX IF NOT EXISTS idx_products_best_seller
  ON public.products(is_best_seller)
  WHERE is_best_seller = true;

CREATE INDEX IF NOT EXISTS idx_products_featured
  ON public.products(is_featured)
  WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_products_on_sale
  ON public.products(is_on_sale)
  WHERE is_on_sale = true;

-- Indexes for filtering
CREATE INDEX IF NOT EXISTS idx_products_sku
  ON public.products(sku);

CREATE INDEX IF NOT EXISTS idx_products_frame_type
  ON public.products(frame_type);

CREATE INDEX IF NOT EXISTS idx_products_lens_type
  ON public.products(lens_type);

CREATE INDEX IF NOT EXISTS idx_products_gender
  ON public.products(gender);

CREATE INDEX IF NOT EXISTS idx_products_color
  ON public.products(color);

-- =====================================================
-- STEP 5: ADD ENHANCED PRODUCT_VARIANTS FIELDS
-- =====================================================

-- Add variant-specific fields (separate statements for each column)
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS sku VARCHAR(100);

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS color VARCHAR(100);

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add unique constraint for variant SKU (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'product_variants_sku_key'
  ) THEN
    ALTER TABLE public.product_variants
      ADD CONSTRAINT product_variants_sku_key UNIQUE (sku);
  END IF;
END $$;

-- Index for variant SKU
CREATE INDEX IF NOT EXISTS idx_product_variants_sku
  ON public.product_variants(sku);

-- Index for active variants
CREATE INDEX IF NOT EXISTS idx_product_variants_active
  ON public.product_variants(is_active)
  WHERE is_active = true;

-- =====================================================
-- STEP 6: ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

-- Comments for products table
COMMENT ON COLUMN public.products.sku IS 'Stock Keeping Unit - unique product identifier';
COMMENT ON COLUMN public.products.dimensions IS 'Frame dimensions (e.g., 140-20-145 mm: width-bridge-temple)';
COMMENT ON COLUMN public.products.is_hot_item IS 'Trending/popular product badge';
COMMENT ON COLUMN public.products.is_new_arrival IS 'Newly added product badge';
COMMENT ON COLUMN public.products.is_best_seller IS 'Best selling product badge';
COMMENT ON COLUMN public.products.is_featured IS 'Featured on homepage';
COMMENT ON COLUMN public.products.is_on_sale IS 'Currently on sale';
COMMENT ON COLUMN public.products.low_stock_threshold IS 'Alert when stock falls below this number';
COMMENT ON COLUMN public.products.meta_title IS 'SEO meta title';
COMMENT ON COLUMN public.products.meta_description IS 'SEO meta description';
COMMENT ON COLUMN public.products.frame_type IS 'Type of frame style';
COMMENT ON COLUMN public.products.lens_type IS 'Type of lens';
COMMENT ON COLUMN public.products.gender IS 'Target gender: Men, Women, Unisex, Kids';
COMMENT ON COLUMN public.products.color IS 'Primary frame color';

-- Comments for product_variants table
COMMENT ON COLUMN public.product_variants.sku IS 'Variant-specific SKU';
COMMENT ON COLUMN public.product_variants.stock_quantity IS 'Stock for this specific variant';
COMMENT ON COLUMN public.product_variants.color IS 'Variant color (if different from main product)';
COMMENT ON COLUMN public.product_variants.is_active IS 'Whether this variant is available';

-- =====================================================
-- STEP 7: ADD CHECK CONSTRAINTS
-- =====================================================

-- Ensure stock quantities are non-negative
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_stock_non_negative'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT check_stock_non_negative
        CHECK (stock_quantity >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_variant_stock_non_negative'
  ) THEN
    ALTER TABLE public.product_variants
      ADD CONSTRAINT check_variant_stock_non_negative
        CHECK (stock_quantity >= 0);
  END IF;
END $$;

-- Ensure low stock threshold is positive
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_low_stock_positive'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT check_low_stock_positive
        CHECK (low_stock_threshold > 0);
  END IF;
END $$;

-- Ensure at least one marketing flag is properly set
-- (Optional - can help with data quality)
COMMENT ON TABLE public.products IS 'E-commerce products for eyeglasses store with enhanced marketing fields';

-- =====================================================
-- STEP 8: CREATE HELPER FUNCTIONS (OPTIONAL)
-- =====================================================

-- Function to check if product is low on stock
CREATE OR REPLACE FUNCTION is_low_stock(product_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_stock INTEGER;
  threshold INTEGER;
BEGIN
  SELECT stock_quantity, low_stock_threshold
  INTO current_stock, threshold
  FROM products
  WHERE id = product_id;

  RETURN current_stock <= threshold;
END;
$$ LANGUAGE plpgsql;

-- Function to get total variant stock
CREATE OR REPLACE FUNCTION get_total_variant_stock(product_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total INTEGER;
BEGIN
  SELECT COALESCE(SUM(stock_quantity), 0)
  INTO total
  FROM product_variants
  WHERE product_variants.product_id = $1 AND is_active = true;

  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 9: UPDATE EXISTING DATA (OPTIONAL)
-- =====================================================

-- Set default values for existing products
UPDATE public.products
SET
  low_stock_threshold = 10,
  is_hot_item = false,
  is_new_arrival = false,
  is_best_seller = false,
  is_featured = false,
  is_on_sale = false
WHERE
  low_stock_threshold IS NULL
  OR is_hot_item IS NULL
  OR is_new_arrival IS NULL
  OR is_best_seller IS NULL
  OR is_featured IS NULL
  OR is_on_sale IS NULL;

-- =====================================================
-- VERIFICATION QUERIES (Run these to verify)
-- =====================================================

-- Check new columns exist
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'products'
-- AND column_name IN ('is_hot_item', 'is_new_arrival', 'is_best_seller', 'is_featured', 'is_on_sale', 'frame_type', 'lens_type', 'gender', 'color')
-- ORDER BY column_name;

-- Check indexes created
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'products'
-- AND indexname LIKE 'idx_products_%'
-- ORDER BY indexname;
