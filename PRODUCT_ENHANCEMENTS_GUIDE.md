# Product Schema Enhancements Guide

## Overview
This document details the enhanced product schema with marketing flags, eyeglasses-specific fields, and SEO optimization for your e-commerce admin panel.

---

## Database Migration

### Migration File
**File:** `supabase-migrations/05_enhance_products_schema.sql`

### Running the Migration

**Option 1: Supabase Dashboard**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run: `supabase-migrations/05_enhance_products_schema.sql`
4. Verify changes in Table Editor

**Option 2: Command Line**
```bash
psql -h your-db-host -U postgres -d your-database -f supabase-migrations/05_enhance_products_schema.sql
```

---

## What's New

### 1. Fields Removed
- ❌ `care_instructions` - Replaced with more specific fields

### 2. Marketing Flags Added
| Field | Type | Purpose | UI Element |
|-------|------|---------|------------|
| `is_hot_item` | BOOLEAN | Trending/Popular badge | 🔥 Hot Item checkbox |
| `is_new_arrival` | BOOLEAN | New product badge | ✨ New Arrival checkbox |
| `is_best_seller` | BOOLEAN | Best selling badge | ⭐ Best Seller checkbox |
| `is_featured` | BOOLEAN | Featured on homepage | 💎 Featured checkbox |
| `is_on_sale` | BOOLEAN | Sale badge | 🏷️ On Sale checkbox |

### 3. Inventory Enhancements
| Field | Type | Purpose |
|-------|------|---------|
| `sku` | VARCHAR(100) | Unique product code |
| `low_stock_threshold` | INTEGER | Alert level (default: 10) |

### 4. Eyeglasses-Specific Fields
| Field | Type | Options |
|-------|------|---------|
| `frame_type` | VARCHAR(50) | Full-Rim, Semi-Rimless, Rimless, Browline, Aviator, Wayfarer, Cat-Eye, Round, Square, Rectangle |
| `lens_type` | VARCHAR(50) | Single Vision, Bifocal, Progressive, Reading, Sunglasses, Blue Light, Photochromic, Polarized |
| `gender` | VARCHAR(20) | Men, Women, Unisex, Kids |
| `color` | VARCHAR(100) | Free text (e.g., Black, Tortoise, Gold) |

### 5. SEO Fields
| Field | Type | Max Length | Purpose |
|-------|------|-----------|---------|
| `meta_title` | VARCHAR(255) | 60 chars | Search engine title |
| `meta_description` | TEXT | 160 chars | Search engine description |

### 6. Product Variants Enhancement
| Field | Type | Purpose |
|-------|------|---------|
| `sku` | VARCHAR(100) | Variant-specific SKU |
| `stock_quantity` | INTEGER | Stock per variant |
| `color` | VARCHAR(100) | Variant color |
| `is_active` | BOOLEAN | Availability status |

---

## Updated Product Form

### Tab Structure

**Tab 1: Basic Info & Variants**
- Product Image Upload
- Product Name
- Description
- Base Price, Discount, Tax
- Product Variants

**Tab 2: Product Details** (Enhanced!)
1. **Inventory & Stock**
   - SKU
   - Stock Quantity
   - Low Stock Alert Threshold

2. **Marketing Badges** 🎯
   - 🔥 Hot Item
   - ✨ New Arrival
   - ⭐ Best Seller
   - 💎 Featured
   - 🏷️ On Sale

3. **Eyeglasses Specifications** 👓
   - Frame Type (dropdown)
   - Lens Type (dropdown)
   - Gender (dropdown)
   - Color (text input)

4. **Product Information**
   - Brand
   - Material

5. **Physical Specifications**
   - Weight
   - Dimensions

6. **SEO Optimization** 🔍
   - Meta Title (60 char limit with counter)
   - Meta Description (160 char limit with counter)

---

## UI Features

### Marketing Badges Section
- **Visual Design:** Gradient background (indigo to purple)
- **Interactive:** Checkboxes with colored borders when selected
- **User-Friendly:** Emoji indicators for each badge type
- **Responsive:** 2 columns on mobile, 3 on desktop

### Dropdowns
- **Pre-populated Options:** All eyeglasses-specific fields have curated options
- **Searchable:** Standard HTML select dropdowns
- **Clear Labels:** Descriptive option text

### Character Counters
- **Real-time Feedback:** Shows remaining characters for SEO fields
- **Visual Indicators:** Character count displayed below inputs
- **Max Length Enforcement:** Fields truncate at limit

---

## Client-Side Integration

### Fetching Products with Marketing Flags

**Get Hot Items:**
```javascript
const { data: hotItems } = await supabase
  .from('products')
  .select('*')
  .eq('is_hot_item', true)
  .eq('is_active', true)
  .order('created_at', { ascending: false });
```

**Get New Arrivals:**
```javascript
const { data: newArrivals } = await supabase
  .from('products')
  .select('*')
  .eq('is_new_arrival', true)
  .eq('is_active', true)
  .order('created_at', { ascending: false })
  .limit(8);
```

**Get Best Sellers:**
```javascript
const { data: bestSellers } = await supabase
  .from('products')
  .select('*')
  .eq('is_best_seller', true)
  .eq('is_active', true)
  .limit(10);
```

**Get Featured Products:**
```javascript
const { data: featured } = await supabase
  .from('products')
  .select('*')
  .eq('is_featured', true)
  .eq('is_active', true)
  .limit(6);
```

**Get Products On Sale:**
```javascript
const { data: onSale } = await supabase
  .from('products')
  .select('*')
  .eq('is_on_sale', true)
  .eq('is_active', true)
  .order('discount_percentage', { ascending: false });
```

### Filtering by Eyeglasses Specifications

**Filter by Frame Type:**
```javascript
const { data: aviators } = await supabase
  .from('products')
  .select('*')
  .eq('frame_type', 'Aviator')
  .eq('is_active', true);
```

**Filter by Lens Type:**
```javascript
const { data: sunglasses } = await supabase
  .from('products')
  .select('*')
  .eq('lens_type', 'Sunglasses')
  .eq('is_active', true);
```

**Filter by Gender:**
```javascript
const { data: mensGlasses } = await supabase
  .from('products')
  .select('*')
  .eq('gender', 'Men')
  .eq('is_active', true);
```

**Multi-Filter Example:**
```javascript
// Men's Aviator Sunglasses
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('gender', 'Men')
  .eq('frame_type', 'Aviator')
  .eq('lens_type', 'Sunglasses')
  .eq('is_active', true);
```

### Displaying Product Badges

**Example React Component:**
```jsx
function ProductBadges({ product }) {
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {product.is_hot_item && (
        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
          🔥 HOT
        </span>
      )}
      {product.is_new_arrival && (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
          ✨ NEW
        </span>
      )}
      {product.is_best_seller && (
        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded">
          ⭐ BEST SELLER
        </span>
      )}
      {product.is_featured && (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
          💎 FEATURED
        </span>
      )}
      {product.is_on_sale && (
        <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded">
          🏷️ SALE {product.discount_percentage}% OFF
        </span>
      )}
    </div>
  );
}
```

### Low Stock Alert

**Check Low Stock:**
```javascript
// Using the helper function from migration
const { data } = await supabase
  .rpc('is_low_stock', { product_id: 'your-product-id' });

if (data) {
  alert('This product is running low on stock!');
}
```

**Alternative Query:**
```javascript
const { data: lowStockProducts } = await supabase
  .from('products')
  .select('*')
  .lte('stock_quantity', 'low_stock_threshold');
```

---

## Database Helper Functions

### 1. Check Low Stock
```sql
SELECT is_low_stock('product-uuid-here');
-- Returns: true or false
```

### 2. Get Total Variant Stock
```sql
SELECT get_total_variant_stock('product-uuid-here');
-- Returns: total stock across all active variants
```

---

## Use Cases

### 1. Homepage Sections

**Hero Section:**
- Featured products (`is_featured = true`)

**Hot Items Section:**
- Hot items (`is_hot_item = true`)

**New Arrivals Section:**
- Recent products (`is_new_arrival = true`)
- Order by `created_at DESC`

**Best Sellers Section:**
- Best sellers (`is_best_seller = true`)

**Sale Section:**
- On sale products (`is_on_sale = true`)
- Order by `discount_percentage DESC`

### 2. Product Filtering

**Shop By Gender:**
- Men's eyeglasses
- Women's eyeglasses
- Unisex eyeglasses
- Kids' eyeglasses

**Shop By Frame Style:**
- Aviator
- Wayfarer
- Cat-Eye
- Round
- Square
- etc.

**Shop By Lens Type:**
- Sunglasses
- Blue Light
- Reading
- Prescription
- etc.

### 3. SEO Optimization

**Dynamic Meta Tags:**
```jsx
<Head>
  <title>{product.meta_title || product.name}</title>
  <meta
    name="description"
    content={product.meta_description || product.description}
  />
</Head>
```

---

## Best Practices

### 1. Marketing Badges
- **Don't overuse:** Limit to 1-2 badges per product
- **Be strategic:** Featured + Hot or New + Sale combinations work well
- **Update regularly:** Review and update badges monthly
- **Track performance:** Monitor which badges drive more sales

### 2. Stock Management
- **Set appropriate thresholds:** Typically 10-20 units based on sales velocity
- **Monitor alerts:** Check low stock products daily
- **Update regularly:** Keep stock counts accurate

### 3. SEO Fields
- **Meta Title:**
  - Include brand name
  - Include key features (e.g., "Men's Aviator Sunglasses")
  - Keep under 60 characters
  - Example: "Ray-Ban Aviator Sunglasses - UV Protection | YourStore"

- **Meta Description:**
  - Include key product features
  - Mention benefits
  - Include call-to-action
  - Keep under 160 characters
  - Example: "Shop premium Ray-Ban Aviator Sunglasses with 100% UV protection. Free shipping on orders over $50. Browse our collection today!"

### 4. Product Specifications
- **Be consistent:** Use same format across all products
- **Be accurate:** Verify dimensions and weights
- **Be detailed:** More information helps customers make decisions

---

## Example Product Entry

```javascript
const productData = {
  // Basic Info
  name: "Classic Aviator Sunglasses",
  description: "Timeless aviator style with premium UV protection",
  base_price: 5999,
  discount_percentage: 15,
  tax_rate: 17,

  // Inventory
  sku: "RAY-AV-001-BLK",
  stock_quantity: 45,
  low_stock_threshold: 10,

  // Marketing
  is_hot_item: true,
  is_new_arrival: false,
  is_best_seller: true,
  is_featured: true,
  is_on_sale: true,

  // Eyeglasses Specs
  frame_type: "Aviator",
  lens_type: "Sunglasses",
  gender: "Unisex",
  color: "Black",

  // Product Info
  brand: "Ray-Ban",
  material: "Metal",
  weight: "30g",
  dimensions: "140-20-145 mm",

  // SEO
  meta_title: "Ray-Ban Classic Aviator Sunglasses - UV Protection",
  meta_description: "Shop authentic Ray-Ban Aviator Sunglasses with 100% UV protection. Classic design, premium quality. Free shipping!"
};
```

---

## Indexes Created

The migration creates these indexes for optimal performance:
- `idx_products_hot_item` (partial)
- `idx_products_new_arrival` (partial)
- `idx_products_best_seller` (partial)
- `idx_products_featured` (partial)
- `idx_products_on_sale` (partial)
- `idx_products_sku`
- `idx_products_frame_type`
- `idx_products_lens_type`
- `idx_products_gender`
- `idx_products_color`

---

## Testing Checklist

- [ ] Run database migration successfully
- [ ] Create test product with all new fields
- [ ] Verify marketing badges display correctly
- [ ] Test dropdown options
- [ ] Verify character counters work
- [ ] Test product filtering by new fields
- [ ] Verify low stock alerts
- [ ] Test SEO fields in product pages
- [ ] Verify product variants with new fields
- [ ] Test form validation

---

## Troubleshooting

### Issue: Migration Fails
**Solution:** Ensure you have the correct table structure first. Run migrations in order:
1. `04_banners_and_blog_tables.sql`
2. `05_enhance_products_schema.sql`

### Issue: Checkboxes Not Saving
**Solution:** Ensure your backend is handling boolean values correctly:
```javascript
is_hot_item: formData.is_hot_item === true
```

### Issue: Dropdowns Empty
**Solution:** Verify the constraint checks are created:
```sql
SELECT conname FROM pg_constraint
WHERE conname LIKE 'check_%';
```

---

## Future Enhancements

Potential additions:
- [ ] Product reviews and ratings
- [ ] Size guide integration
- [ ] Virtual try-on features
- [ ] Wishlist functionality
- [ ] Related products suggestions
- [ ] Recently viewed tracking

---

## Summary

✅ **Added:** 16 new database fields
✅ **Removed:** 1 unused field
✅ **Enhanced:** Product form with intuitive UI
✅ **Created:** 10+ new indexes for performance
✅ **Added:** Marketing badges system
✅ **Included:** SEO optimization fields
✅ **Implemented:** Eyeglasses-specific filtering
✅ **Ready:** For client-side integration

Your product management system is now fully equipped for a professional eyeglasses e-commerce store! 🎉
