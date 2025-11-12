-- Migration: Update Products Pricing Fields
-- Date: 2025-01-07
-- Description: Change discount from percentage to rupees amount and remove tax_rate

-- =====================================================
-- ADD NEW DISCOUNT_AMOUNT COLUMN
-- =====================================================

-- Add discount_amount column (rupees)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

COMMENT ON COLUMN public.products.discount_amount IS 'Discount amount in rupees';

-- =====================================================
-- MIGRATE EXISTING DATA (OPTIONAL)
-- =====================================================

-- Convert existing discount_percentage to discount_amount
-- This assumes discount_percentage was a percentage of base_price
-- You can uncomment this if you want to migrate existing data
/*
UPDATE public.products
SET discount_amount = ROUND((base_price * discount_percentage / 100)::numeric, 2)
WHERE discount_percentage > 0;
*/

-- =====================================================
-- DROP OLD COLUMNS
-- =====================================================

-- Drop discount_percentage column (if it exists)
ALTER TABLE public.products
  DROP COLUMN IF EXISTS discount_percentage;

-- Drop tax_rate column (if it exists)
ALTER TABLE public.products
  DROP COLUMN IF EXISTS tax_rate;

-- =====================================================
-- CREATE INDEX FOR DISCOUNTED PRODUCTS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_products_discount_amount
  ON public.products(discount_amount)
  WHERE discount_amount > 0;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check new column exists
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'products'
-- AND column_name = 'discount_amount';

-- Verify old columns are dropped
-- SELECT column_name
-- FROM information_schema.columns
-- WHERE table_name = 'products'
-- AND column_name IN ('discount_percentage', 'tax_rate');
