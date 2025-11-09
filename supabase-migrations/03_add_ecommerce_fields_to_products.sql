-- Migration: Simple E-commerce fields for products table
-- Date: 2025-01-07
-- Description: Adds basic e-commerce fields for eyeglasses store
-- NOTE: This is a simplified version. If you need more advanced features,
--       use 01_updated_products_schema.sql instead.

-- Add basic e-commerce fields to products table if they don't exist
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku VARCHAR(100),
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS brand VARCHAR(255),
  ADD COLUMN IF NOT EXISTS weight VARCHAR(50),
  ADD COLUMN IF NOT EXISTS dimensions VARCHAR(100),
  ADD COLUMN IF NOT EXISTS material VARCHAR(255);

-- Drop the ingredients column if it exists (not needed for e-commerce)
ALTER TABLE public.products
  DROP COLUMN IF EXISTS ingredients;

-- Drop product_variant_ingredients table if it exists
DROP TABLE IF EXISTS public.product_variant_ingredients CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock_quantity);

-- Add check constraint for stock quantity
ALTER TABLE public.products
  ADD CONSTRAINT IF NOT EXISTS check_stock_positive
    CHECK (stock_quantity >= 0);

-- Add comments to the table and columns
COMMENT ON TABLE public.products IS 'E-commerce products table for eyeglasses store';
COMMENT ON COLUMN public.products.sku IS 'Stock Keeping Unit - unique product identifier';
COMMENT ON COLUMN public.products.stock_quantity IS 'Available stock quantity';
COMMENT ON COLUMN public.products.brand IS 'Product brand name (e.g., Ray-Ban, Oakley)';
COMMENT ON COLUMN public.products.weight IS 'Product weight with unit (e.g., 25g, 30g)';
COMMENT ON COLUMN public.products.dimensions IS 'Frame dimensions for eyeglasses (e.g., 140-20-145 mm: width-bridge-temple)';
COMMENT ON COLUMN public.products.material IS 'Frame material (e.g., Acetate, Metal, Plastic, Titanium)';
