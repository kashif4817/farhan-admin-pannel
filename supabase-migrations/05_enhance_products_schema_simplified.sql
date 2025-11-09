-- Migration: Simplified Products Schema Enhancement for E-commerce
-- Date: 2025-01-07
-- Description: Add marketing flags and eyeglasses-specific fields (without SKU, dimensions, low_stock_threshold, SEO fields)

-- =====================================================
-- STEP 1: ADD MARKETING FLAGS
-- =====================================================

-- Add marketing badges (separate ALTER statements)
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

-- =====================================================
-- STEP 2: ADD EYEGLASSES-SPECIFIC FIELDS
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
-- STEP 3: CREATE INDEXES FOR NEW FIELDS
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

-- Indexes for filtering eyeglasses products
CREATE INDEX IF NOT EXISTS idx_products_frame_type
  ON public.products(frame_type);

CREATE INDEX IF NOT EXISTS idx_products_lens_type
  ON public.products(lens_type);

CREATE INDEX IF NOT EXISTS idx_products_gender
  ON public.products(gender);

CREATE INDEX IF NOT EXISTS idx_products_color
  ON public.products(color);

-- =====================================================
-- STEP 4: ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

-- Comments for products table
COMMENT ON COLUMN public.products.is_hot_item IS 'Trending/popular product badge';
COMMENT ON COLUMN public.products.is_new_arrival IS 'Newly added product badge';
COMMENT ON COLUMN public.products.is_best_seller IS 'Best selling product badge';
COMMENT ON COLUMN public.products.is_featured IS 'Featured on homepage';
COMMENT ON COLUMN public.products.is_on_sale IS 'Currently on sale';
COMMENT ON COLUMN public.products.frame_type IS 'Type of frame style (eyeglasses only)';
COMMENT ON COLUMN public.products.lens_type IS 'Type of lens (eyeglasses only)';
COMMENT ON COLUMN public.products.gender IS 'Target gender: Men, Women, Unisex, Kids';
COMMENT ON COLUMN public.products.color IS 'Primary frame/product color';

-- =====================================================
-- STEP 5: UPDATE EXISTING DATA (OPTIONAL)
-- =====================================================

-- Set default values for existing products
UPDATE public.products
SET
  is_hot_item = false,
  is_new_arrival = false,
  is_best_seller = false,
  is_featured = false,
  is_on_sale = false
WHERE
  is_hot_item IS NULL
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
