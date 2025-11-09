-- Migration: Time Deals (Flash Sales/Limited Time Offers)
-- Date: 2025-01-07
-- Description: Create time_deals table for limited time product offers with countdown timers

-- =====================================================
-- CREATE TIME_DEALS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.time_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,

  -- Deal Information
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Pricing
  original_price DECIMAL(10, 2) NOT NULL,
  deal_price DECIMAL(10, 2) NOT NULL,
  discount_percentage INTEGER GENERATED ALWAYS AS (
    ROUND(((original_price - deal_price) / original_price * 100)::numeric, 0)::integer
  ) STORED,

  -- Timing
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,

  -- Inventory
  total_quantity INTEGER DEFAULT 0,
  sold_quantity INTEGER DEFAULT 0,
  remaining_quantity INTEGER GENERATED ALWAYS AS (total_quantity - sold_quantity) STORED,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,

  -- Display
  badge_text VARCHAR(50) DEFAULT 'LIMITED TIME',
  badge_color VARCHAR(20) DEFAULT 'red',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ADD INDEXES
-- =====================================================

-- Index for active deals
CREATE INDEX IF NOT EXISTS idx_time_deals_active
  ON public.time_deals(is_active)
  WHERE is_active = true;

-- Index for featured deals
CREATE INDEX IF NOT EXISTS idx_time_deals_featured
  ON public.time_deals(is_featured)
  WHERE is_featured = true;

-- Index for time range queries (get active deals)
CREATE INDEX IF NOT EXISTS idx_time_deals_time_range
  ON public.time_deals(start_time, end_time)
  WHERE is_active = true;

-- Index for user deals
CREATE INDEX IF NOT EXISTS idx_time_deals_user
  ON public.time_deals(user_id);

-- Index for product deals
CREATE INDEX IF NOT EXISTS idx_time_deals_product
  ON public.time_deals(product_id);

-- =====================================================
-- ADD CONSTRAINTS
-- =====================================================

-- Ensure deal price is less than original price
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_deal_price_valid'
  ) THEN
    ALTER TABLE public.time_deals
      ADD CONSTRAINT check_deal_price_valid
        CHECK (deal_price < original_price AND deal_price > 0);
  END IF;
END $$;

-- Ensure end_time is after start_time
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_time_range_valid'
  ) THEN
    ALTER TABLE public.time_deals
      ADD CONSTRAINT check_time_range_valid
        CHECK (end_time > start_time);
  END IF;
END $$;

-- Ensure quantities are non-negative
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_quantities_valid'
  ) THEN
    ALTER TABLE public.time_deals
      ADD CONSTRAINT check_quantities_valid
        CHECK (total_quantity >= 0 AND sold_quantity >= 0 AND sold_quantity <= total_quantity);
  END IF;
END $$;

-- =====================================================
-- ADD COMMENTS
-- =====================================================

COMMENT ON TABLE public.time_deals IS 'Limited time product deals with countdown timers';
COMMENT ON COLUMN public.time_deals.title IS 'Deal title/name';
COMMENT ON COLUMN public.time_deals.description IS 'Deal description';
COMMENT ON COLUMN public.time_deals.original_price IS 'Original product price';
COMMENT ON COLUMN public.time_deals.deal_price IS 'Discounted price during deal';
COMMENT ON COLUMN public.time_deals.discount_percentage IS 'Auto-calculated discount percentage';
COMMENT ON COLUMN public.time_deals.start_time IS 'When the deal becomes active';
COMMENT ON COLUMN public.time_deals.end_time IS 'When the deal expires';
COMMENT ON COLUMN public.time_deals.total_quantity IS 'Total items available for this deal';
COMMENT ON COLUMN public.time_deals.sold_quantity IS 'Number of items sold';
COMMENT ON COLUMN public.time_deals.remaining_quantity IS 'Auto-calculated remaining items';
COMMENT ON COLUMN public.time_deals.is_active IS 'Whether deal is active';
COMMENT ON COLUMN public.time_deals.is_featured IS 'Show in featured deals section';
COMMENT ON COLUMN public.time_deals.badge_text IS 'Custom badge text (e.g., FLASH SALE, 24HR DEAL)';
COMMENT ON COLUMN public.time_deals.badge_color IS 'Badge color: red, orange, blue, green, purple';

-- =====================================================
-- CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to check if deal is currently running
CREATE OR REPLACE FUNCTION is_deal_running(deal_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  deal_record RECORD;
BEGIN
  SELECT start_time, end_time, is_active
  INTO deal_record
  FROM time_deals
  WHERE id = deal_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  RETURN deal_record.is_active
    AND NOW() >= deal_record.start_time
    AND NOW() <= deal_record.end_time;
END;
$$ LANGUAGE plpgsql;

-- Function to get all active deals (running right now)
CREATE OR REPLACE FUNCTION get_active_deals()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  product_id UUID,
  title VARCHAR(255),
  description TEXT,
  original_price DECIMAL(10, 2),
  deal_price DECIMAL(10, 2),
  discount_percentage INTEGER,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  total_quantity INTEGER,
  sold_quantity INTEGER,
  remaining_quantity INTEGER,
  is_featured BOOLEAN,
  badge_text VARCHAR(50),
  badge_color VARCHAR(20),
  time_remaining INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    td.id,
    td.user_id,
    td.product_id,
    td.title,
    td.description,
    td.original_price,
    td.deal_price,
    td.discount_percentage,
    td.start_time,
    td.end_time,
    td.total_quantity,
    td.sold_quantity,
    td.remaining_quantity,
    td.is_featured,
    td.badge_text,
    td.badge_color,
    (td.end_time - NOW()) AS time_remaining
  FROM time_deals td
  WHERE td.is_active = true
    AND NOW() >= td.start_time
    AND NOW() <= td.end_time
    AND td.remaining_quantity > 0
  ORDER BY td.is_featured DESC, td.end_time ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-deactivate expired deals
CREATE OR REPLACE FUNCTION deactivate_expired_deals()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE time_deals
  SET is_active = false
  WHERE is_active = true
    AND end_time < NOW();

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE TRIGGER FOR AUTO-UPDATE TIMESTAMP
-- =====================================================

CREATE OR REPLACE FUNCTION update_time_deals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_time_deals_updated_at ON public.time_deals;

CREATE TRIGGER trigger_time_deals_updated_at
  BEFORE UPDATE ON public.time_deals
  FOR EACH ROW
  EXECUTE FUNCTION update_time_deals_updated_at();

-- =====================================================
-- VERIFICATION QUERIES (Run these to verify)
-- =====================================================

-- Check table exists
-- SELECT * FROM information_schema.tables WHERE table_name = 'time_deals';

-- Check columns
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'time_deals'
-- ORDER BY ordinal_position;

-- Check indexes
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'time_deals'
-- ORDER BY indexname;

-- Test helper functions
-- SELECT * FROM get_active_deals();
-- SELECT deactivate_expired_deals();
