-- =====================================================
-- Suppliers Table Migration
-- Manages supplier/vendor information
-- =====================================================

-- 1. CREATE suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  -- Basic Information
  name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),

  -- Address
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Pakistan',

  -- Business Details
  tax_id VARCHAR(100),
  website VARCHAR(255),
  contact_person VARCHAR(255),

  -- Financial
  payment_terms VARCHAR(100),
  credit_limit NUMERIC(10, 2),

  -- Status
  is_active BOOLEAN DEFAULT true,
  rating INTEGER,

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT suppliers_pkey PRIMARY KEY (id),
  CONSTRAINT suppliers_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT check_rating_valid CHECK (rating >= 1 AND rating <= 5)
) TABLESPACE pg_default;

-- 2. CREATE indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id
  ON public.suppliers USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_suppliers_is_active
  ON public.suppliers USING btree (is_active);

CREATE INDEX IF NOT EXISTS idx_suppliers_name
  ON public.suppliers USING btree (name);

CREATE INDEX IF NOT EXISTS idx_suppliers_email
  ON public.suppliers USING btree (email);

CREATE INDEX IF NOT EXISTS idx_suppliers_rating
  ON public.suppliers USING btree (rating)
  WHERE rating IS NOT NULL;

-- 3. CREATE trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_suppliers_updated_at();

-- 4. Add comments for documentation
COMMENT ON TABLE public.suppliers IS 'Supplier/vendor management with contact and financial information';
COMMENT ON COLUMN public.suppliers.payment_terms IS 'Payment terms like COD, Net 30, Net 60, etc.';
COMMENT ON COLUMN public.suppliers.credit_limit IS 'Maximum credit limit in PKR';
COMMENT ON COLUMN public.suppliers.rating IS 'Supplier rating from 1 to 5 stars';
COMMENT ON COLUMN public.suppliers.is_active IS 'Whether the supplier is currently active';

-- 5. Enable Row Level Security (RLS) if needed
-- Note: Since you're using custom auth with localStorage, RLS might not be needed
-- Uncomment below if you want to enable RLS

-- ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can view their own suppliers" ON public.suppliers
--   FOR SELECT USING (user_id = current_setting('app.current_user_id')::uuid);

-- CREATE POLICY "Users can insert their own suppliers" ON public.suppliers
--   FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id')::uuid);

-- CREATE POLICY "Users can update their own suppliers" ON public.suppliers
--   FOR UPDATE USING (user_id = current_setting('app.current_user_id')::uuid);

-- CREATE POLICY "Users can delete their own suppliers" ON public.suppliers
--   FOR DELETE USING (user_id = current_setting('app.current_user_id')::uuid);
