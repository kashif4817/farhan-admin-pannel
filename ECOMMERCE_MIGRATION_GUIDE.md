# E-commerce Migration Guide

## Overview
This guide documents the migration from an ingredient-based product system to a clean e-commerce product system suitable for an eyeglasses store.

## Changes Made

### 1. ProductForm Component Updates
**File:** `components/forms/ProductForm.js`

#### Removed Features:
- ✅ All ingredient integration (inventory items, units, ingredient management)
- ✅ Variant-based ingredient tracking
- ✅ Unit compatibility checking
- ✅ Ingredient editing and deletion

#### Added E-commerce Fields:
The second tab has been renamed from "Ingredients" to "Product Details" and now includes:

**Inventory & Stock:**
- SKU (Stock Keeping Unit) - Product identifier
- Stock Quantity - Available units in inventory

**Product Information:**
- Brand - Product brand name (e.g., Ray-Ban, Oakley)
- Material - Frame material (e.g., Acetate, Metal, Plastic)

**Physical Specifications:**
- Weight - Product weight with unit (e.g., 25g)
- Dimensions - Frame dimensions (e.g., 140-20-145 mm for Width-Bridge-Temple)

### 2. Database Schema Updates

#### Migration File
**File:** `supabase-migrations/03_add_ecommerce_fields_to_products.sql`

#### Database Changes:
**Added Columns to `products` table:**
```sql
- sku (VARCHAR 100) - Stock Keeping Unit
- stock_quantity (INTEGER) - Inventory count
- brand (VARCHAR 255) - Brand name
- weight (VARCHAR 50) - Product weight with unit
- dimensions (VARCHAR 100) - Product dimensions
- material (VARCHAR 255) - Product material
```

**Removed:**
```sql
- ingredients (TEXT) - No longer needed
- product_variant_ingredients table - Dropped completely
```

**Indexes Created:**
- `idx_products_sku` - For SKU lookups
- `idx_products_brand` - For brand filtering
- `idx_products_stock` - For inventory management

**Constraints Added:**
- `check_stock_positive` - Ensures stock_quantity >= 0

## How to Apply the Migration

### Option 1: Using Supabase Dashboard
1. Log in to your Supabase project dashboard
2. Go to SQL Editor
3. Open and run `supabase-migrations/03_add_ecommerce_fields_to_products.sql`
4. Verify the changes in the Table Editor

### Option 2: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push

# Or apply the specific migration
psql -h your-db-host -U postgres -d your-database -f supabase-migrations/03_add_ecommerce_fields_to_products.sql
```

### Option 3: Manual Update
If you prefer manual updates, execute these SQL commands in order:
1. Add new columns
2. Drop old columns and tables
3. Create indexes
4. Add constraints

## Updated Product Form Structure

### Tab 1: Basic Info & Variants
- Product Image Upload (Cloudinary)
- Product Name *
- Description
- Base Price *
- Discount Percentage
- Tax Rate
- Product Variants (Name and Price)

### Tab 2: Product Details
**Inventory & Stock**
- SKU - Unique product code
- Stock Quantity - How many units available

**Product Information**
- Brand - Manufacturer/brand name
- Material - What the product is made of

**Physical Specifications**
- Weight - Product weight (include unit)
- Dimensions - Product size (for eyeglasses: Width-Bridge-Temple in mm)

## Example Product Entry

### Eyeglasses Product Example:
```
Basic Info:
- Name: Classic Aviator Sunglasses
- Description: Timeless aviator style with UV protection
- Base Price: 4500 PKR
- Discount: 10%
- Tax Rate: 17%

Variants:
- Gold Frame - 4500 PKR
- Silver Frame - 4500 PKR
- Black Frame - 4200 PKR

Product Details:
- SKU: EYGL-AV-001
- Stock Quantity: 25
- Brand: Ray-Ban
- Material: Metal
- Weight: 30g
- Dimensions: 140-20-145 mm
```

## Breaking Changes

### API/Backend Changes Needed:
If you have backend API endpoints that handle product creation/updates, you need to:

1. **Remove ingredient handling** - Delete code that processes:
   - `ingredients` array
   - `deletedIngredientIds`
   - `variantKeyMap`
   - `product_variant_ingredients` table operations

2. **Add e-commerce field handling** - Add code to save:
   - `sku`
   - `stock_quantity`
   - `brand`
   - `weight`
   - `dimensions`
   - `material`

### Example Backend Update:
```javascript
// OLD - Remove this
const { ingredients, deletedIngredientIds, variantKeyMap, ...productData } = payload;

// NEW - Use this
const {
  sku,
  stock_quantity,
  brand,
  weight,
  dimensions,
  material,
  ...basicProductData
} = payload;

// Insert/Update with new fields
const { data, error } = await supabase
  .from('products')
  .upsert({
    ...basicProductData,
    sku,
    stock_quantity,
    brand,
    weight,
    dimensions,
    material
  });
```

## Testing Checklist

- [ ] ProductForm renders both tabs correctly
- [ ] All new fields appear in "Product Details" tab
- [ ] Form validation works for required fields
- [ ] Product creation saves all new fields
- [ ] Product editing loads all new fields correctly
- [ ] No errors related to missing ingredient functionality
- [ ] Database migration completed successfully
- [ ] New indexes are created
- [ ] Old ingredient tables are dropped

## Rollback Plan

If you need to rollback these changes:

1. **Database Rollback:**
   - Restore from backup before migration
   - Or manually drop new columns and recreate ingredient tables

2. **Code Rollback:**
   - Revert `components/forms/ProductForm.js` to previous commit
   - Restore backend ingredient handling logic

## Support

For issues or questions:
1. Check the migration logs for SQL errors
2. Verify all environment variables are set correctly
3. Review the ProductForm component for any missing dependencies
4. Check browser console for JavaScript errors

## Advanced Features

If you need more advanced e-commerce features, consider using the comprehensive migration file:
- **File:** `supabase-migrations/01_updated_products_schema.sql`
- **Includes:**
  - Multiple product images
  - Product attributes (dynamic)
  - Product specifications
  - SEO fields (slug, meta tags)
  - Shipping information
  - Product status flags (featured, new arrival, bestseller)
  - And much more...
