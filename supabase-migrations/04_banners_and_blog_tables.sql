-- Migration: Create Banners and Blog Tables
-- Date: 2025-01-07
-- Description: Tables for banner management and blog/news section

-- =====================================================
-- BANNERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NULL,
  title VARCHAR(255) NOT NULL,
  subtitle TEXT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT NULL,
  link_text VARCHAR(100) NULL,
  banner_type VARCHAR(50) NOT NULL DEFAULT 'slider',
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE NULL,
  end_date TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT banners_pkey PRIMARY KEY (id),
  CONSTRAINT banners_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT check_banner_type CHECK (banner_type IN ('slider', 'promotional', 'hero', 'sidebar'))
);

-- Indexes for banners
CREATE INDEX IF NOT EXISTS idx_banners_user_id ON public.banners(user_id);
CREATE INDEX IF NOT EXISTS idx_banners_active ON public.banners(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_banners_type ON public.banners(banner_type);
CREATE INDEX IF NOT EXISTS idx_banners_position ON public.banners(position);

-- Comments for banners
COMMENT ON TABLE public.banners IS 'Homepage sliders and promotional banners';
COMMENT ON COLUMN public.banners.banner_type IS 'Type: slider, promotional, hero, or sidebar';
COMMENT ON COLUMN public.banners.position IS 'Display order (lower numbers appear first)';
COMMENT ON COLUMN public.banners.start_date IS 'Optional: When to start showing banner';
COMMENT ON COLUMN public.banners.end_date IS 'Optional: When to stop showing banner';

-- =====================================================
-- BLOG CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT blog_categories_pkey PRIMARY KEY (id)
);

-- Index for blog categories
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON public.blog_categories(slug);

-- Insert default blog categories
INSERT INTO public.blog_categories (name, slug, description) VALUES
  ('Eyewear Care', 'eyewear-care', 'Tips and guides for maintaining your eyeglasses'),
  ('Fashion Trends', 'fashion-trends', 'Latest trends in eyewear fashion'),
  ('Eye Health', 'eye-health', 'Information about eye health and vision care'),
  ('Product Updates', 'product-updates', 'New arrivals and product announcements'),
  ('Style Guide', 'style-guide', 'How to choose the perfect eyewear for your face shape')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- BLOG POSTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NULL,
  category_id UUID NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  excerpt TEXT NULL,
  content TEXT NOT NULL,
  featured_image_url TEXT NULL,
  author_name VARCHAR(100) NULL,
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT blog_posts_pkey PRIMARY KEY (id),
  CONSTRAINT blog_posts_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT blog_posts_category_id_fkey FOREIGN KEY (category_id)
    REFERENCES blog_categories (id) ON DELETE SET NULL
);

-- Indexes for blog posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_user_id ON public.blog_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON public.blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON public.blog_posts(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON public.blog_posts USING gin(tags);

-- Comments for blog posts
COMMENT ON TABLE public.blog_posts IS 'Blog posts for news, updates, and articles';
COMMENT ON COLUMN public.blog_posts.slug IS 'URL-friendly identifier for the post';
COMMENT ON COLUMN public.blog_posts.excerpt IS 'Short summary for post listings';
COMMENT ON COLUMN public.blog_posts.content IS 'Full post content (supports HTML/Markdown)';
COMMENT ON COLUMN public.blog_posts.tags IS 'Array of tags for categorization';
COMMENT ON COLUMN public.blog_posts.is_published IS 'Whether the post is visible to public';
COMMENT ON COLUMN public.blog_posts.is_featured IS 'Featured posts appear prominently';

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for banners
CREATE TRIGGER trigger_banners_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for blog posts
CREATE TRIGGER trigger_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION TO AUTO-GENERATE SLUG FOR BLOG POSTS
-- =====================================================

CREATE OR REPLACE FUNCTION generate_blog_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9]+', '-', 'g'));
    NEW.slug := regexp_replace(NEW.slug, '^-+|-+$', '', 'g');

    -- Handle duplicates by appending number
    IF EXISTS (SELECT 1 FROM blog_posts WHERE slug = NEW.slug AND id != NEW.id) THEN
      NEW.slug := NEW.slug || '-' || substring(gen_random_uuid()::text, 1, 8);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_blog_slug
  BEFORE INSERT OR UPDATE OF title, slug ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION generate_blog_slug();

-- =====================================================
-- ROW LEVEL SECURITY (Optional - Uncomment if needed)
-- =====================================================

-- Enable RLS
-- ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Policies (allow authenticated users to manage, public can read)
-- CREATE POLICY "Public can view active banners" ON public.banners FOR SELECT USING (is_active = true);
-- CREATE POLICY "Authenticated users can manage banners" ON public.banners FOR ALL USING (auth.role() = 'authenticated');

-- CREATE POLICY "Public can view blog categories" ON public.blog_categories FOR SELECT USING (true);
-- CREATE POLICY "Authenticated users can manage blog categories" ON public.blog_categories FOR ALL USING (auth.role() = 'authenticated');

-- CREATE POLICY "Public can view published posts" ON public.blog_posts FOR SELECT USING (is_published = true);
-- CREATE POLICY "Authenticated users can manage blog posts" ON public.blog_posts FOR ALL USING (auth.role() = 'authenticated');
