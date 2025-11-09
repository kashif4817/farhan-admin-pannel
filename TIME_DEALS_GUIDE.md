# Time Deals (Flash Sales) - Complete Guide

## Overview
The Time Deals feature allows you to create limited-time offers with countdown timers that automatically expire. Perfect for flash sales, 24-hour deals, weekend specials, and other time-sensitive promotions.

---

## Features

### ✅ Core Features
- **Countdown Timers** - Automatic time tracking with days, hours, minutes display
- **Auto-Expiration** - Deals automatically become inactive when time runs out
- **Stock Management** - Track total quantity, sold items, and remaining stock
- **Dynamic Pricing** - Set original and deal prices with auto-calculated discounts
- **Status Tracking** - Active, Upcoming, Expired, and Sold Out statuses
- **Featured Deals** - Highlight special deals on your storefront
- **Custom Badges** - Customizable badge text and colors
- **Product Integration** - Link deals directly to existing products

---

## Database Setup

### 1. Run the Migration

**File:** `supabase-migrations/06_time_deals_table.sql`

**Option 1: Supabase Dashboard**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the migration file content
4. Click "Run"

**Option 2: Command Line**
```bash
psql -h your-db-host -U postgres -d your-database -f supabase-migrations/06_time_deals_table.sql
```

### 2. Table Schema

**Table:** `time_deals`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Admin who created the deal |
| `product_id` | UUID | Linked product |
| `title` | VARCHAR(255) | Deal title |
| `description` | TEXT | Deal description |
| `original_price` | DECIMAL | Original product price |
| `deal_price` | DECIMAL | Discounted price |
| `discount_percentage` | INTEGER | Auto-calculated (stored) |
| `start_time` | TIMESTAMPTZ | When deal becomes active |
| `end_time` | TIMESTAMPTZ | When deal expires |
| `total_quantity` | INTEGER | Items available |
| `sold_quantity` | INTEGER | Items sold |
| `remaining_quantity` | INTEGER | Auto-calculated (stored) |
| `is_active` | BOOLEAN | Deal active status |
| `is_featured` | BOOLEAN | Show in featured section |
| `badge_text` | VARCHAR(50) | Custom badge text |
| `badge_color` | VARCHAR(20) | Badge color theme |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

---

## Admin Panel Usage

### Creating a Time Deal

1. **Navigate to Time Deals**
   - Click "Time Deals" in the sidebar (⚡ icon)

2. **Click "Create Deal"**

3. **Fill in Deal Information:**

   **Product Selection:**
   - Choose a product from the dropdown
   - Original price auto-fills from product base price

   **Deal Details:**
   - **Title**: e.g., "Flash Sale: Premium Aviator Sunglasses"
   - **Description**: Optional brief description

   **Pricing:**
   - **Original Price**: Regular product price
   - **Deal Price**: Discounted price
   - **Discount Preview**: Auto-calculated percentage shows in green

   **Timing:**
   - **Start Time**: When the deal becomes active
   - **End Time**: When the deal automatically expires

   **Inventory:**
   - **Total Quantity**: How many items available at this price

   **Badge Settings:**
   - **Badge Text**: e.g., "FLASH SALE", "24HR DEAL", "LIMITED TIME"
   - **Badge Color**: Choose from Red, Orange, Yellow, Green, Blue, Purple

   **Status:**
   - **Active**: Toggle to activate/deactivate deal
   - **Featured**: Show in featured deals section

4. **Click "Create Deal"**

---

## Deal Status Types

### 🟢 Active
- Deal is currently running
- Within start and end time
- Stock available
- **Status Color:** Green

### 🔵 Upcoming
- Deal hasn't started yet
- Current time is before start_time
- **Status Color:** Blue

### 🔴 Expired
- Deal time has passed
- Current time is after end_time
- **Status Color:** Red

### 🟠 Sold Out
- All stock has been sold
- remaining_quantity = 0
- **Status Color:** Orange

### ⚪ Inactive
- Manually deactivated by admin
- is_active = false
- **Status Color:** Gray

---

## Helper Functions

The migration includes several PostgreSQL functions:

### 1. Check if Deal is Running
```sql
SELECT is_deal_running('deal-uuid-here');
-- Returns: true or false
```

### 2. Get All Active Deals
```sql
SELECT * FROM get_active_deals();
-- Returns: All currently running deals with time_remaining
```

### 3. Deactivate Expired Deals
```sql
SELECT deactivate_expired_deals();
-- Returns: Number of deals deactivated
```

---

## Client-Side Integration

### Fetch Active Deals

**Get All Active Deals:**
```javascript
const { data: activeDeals } = await supabase
  .from('time_deals')
  .select(`
    *,
    products (
      id,
      name,
      image_url,
      description
    )
  `)
  .eq('is_active', true)
  .lte('start_time', new Date().toISOString())
  .gte('end_time', new Date().toISOString())
  .gt('remaining_quantity', 0)
  .order('is_featured', { ascending: false })
  .order('end_time', { ascending: true });
```

**Get Featured Deals:**
```javascript
const { data: featuredDeals } = await supabase
  .from('time_deals')
  .select(`
    *,
    products (*)
  `)
  .eq('is_active', true)
  .eq('is_featured', true)
  .lte('start_time', new Date().toISOString())
  .gte('end_time', new Date().toISOString())
  .gt('remaining_quantity', 0)
  .limit(6);
```

**Get Upcoming Deals:**
```javascript
const { data: upcomingDeals } = await supabase
  .from('time_deals')
  .select('*')
  .eq('is_active', true)
  .gt('start_time', new Date().toISOString())
  .order('start_time', { ascending: true })
  .limit(10);
```

---

## Countdown Timer Component (React)

```javascript
import { useState, useEffect } from 'react';

function CountdownTimer({ endTime }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = new Date(endTime) - new Date();

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      expired: false
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  if (timeLeft.expired) {
    return <span className="text-red-500">EXPIRED</span>;
  }

  return (
    <div className="flex gap-2">
      {timeLeft.days > 0 && (
        <div className="text-center">
          <div className="text-2xl font-bold">{timeLeft.days}</div>
          <div className="text-xs text-gray-500">Days</div>
        </div>
      )}
      <div className="text-center">
        <div className="text-2xl font-bold">{timeLeft.hours}</div>
        <div className="text-xs text-gray-500">Hours</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">{timeLeft.minutes}</div>
        <div className="text-xs text-gray-500">Mins</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">{timeLeft.seconds}</div>
        <div className="text-xs text-gray-500">Secs</div>
      </div>
    </div>
  );
}

export default CountdownTimer;
```

---

## Display Deal Card (React)

```javascript
import CountdownTimer from './CountdownTimer';

function DealCard({ deal }) {
  const badgeColors = {
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Badge */}
      <div className={`${badgeColors[deal.badge_color]} text-white text-xs font-bold px-3 py-1 text-center`}>
        {deal.badge_text}
      </div>

      {/* Product Image */}
      <img
        src={deal.products.image_url}
        alt={deal.products.name}
        className="w-full h-48 object-cover"
      />

      {/* Deal Info */}
      <div className="p-4">
        <h3 className="text-lg font-bold mb-2">{deal.title}</h3>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-3xl font-bold text-green-600">
            ${deal.deal_price}
          </span>
          <span className="text-lg text-gray-500 line-through">
            ${deal.original_price}
          </span>
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded font-bold">
            {deal.discount_percentage}% OFF
          </span>
        </div>

        {/* Countdown */}
        <div className="mb-3">
          <p className="text-sm text-gray-500 mb-1">Deal ends in:</p>
          <CountdownTimer endTime={deal.end_time} />
        </div>

        {/* Stock Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Stock: {deal.remaining_quantity} left</span>
            <span>{Math.round((deal.sold_quantity / deal.total_quantity) * 100)}% sold</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full"
              style={{ width: `${(deal.sold_quantity / deal.total_quantity) * 100}%` }}
            />
          </div>
        </div>

        {/* CTA Button */}
        <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg">
          Grab This Deal
        </button>
      </div>
    </div>
  );
}

export default DealCard;
```

---

## Best Practices

### 1. Deal Timing
- **Flash Sales**: 2-6 hours
- **Daily Deals**: 24 hours
- **Weekend Specials**: 48-72 hours
- **Weekly Deals**: 7 days

### 2. Pricing Strategy
- Minimum 20% discount for flash sales
- 30-50% for major promotions
- Higher discounts for urgent/short-duration deals

### 3. Stock Management
- Set realistic quantities based on inventory
- Don't oversell - monitor stock closely
- Update sold_quantity when orders are placed

### 4. Badge Customization
- **FLASH SALE** - 2-6 hour deals (Red)
- **24HR DEAL** - Daily deals (Orange)
- **WEEKEND SPECIAL** - Weekend sales (Blue)
- **LIMITED TIME** - Generic deals (Red)
- **CLEARANCE** - Inventory clearance (Green)

### 5. Featured Deals
- Maximum 3-5 featured deals at a time
- Rotate featured status for variety
- Feature highest-discount or most-popular items

---

## Automation Ideas

### Auto-Deactivate Expired Deals (Cron Job)
```javascript
// Run every hour
async function deactivateExpiredDeals() {
  const { data, error } = await supabase
    .rpc('deactivate_expired_deals');

  console.log(`Deactivated ${data} expired deals`);
}

// Schedule with node-cron or similar
cron.schedule('0 * * * *', deactivateExpiredDeals);
```

### Send Notifications for Ending Deals
```javascript
async function notifyEndingDeals() {
  const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);

  const { data: endingSoon } = await supabase
    .from('time_deals')
    .select('*')
    .eq('is_active', true)
    .lte('end_time', oneHourFromNow.toISOString())
    .gte('end_time', new Date().toISOString());

  // Send email/push notifications to subscribers
  for (const deal of endingSoon) {
    await sendNotification(deal);
  }
}
```

---

## Statistics Dashboard

```javascript
async function getDealStatistics() {
  const { data: deals } = await supabase
    .from('time_deals')
    .select('*');

  const now = new Date();

  return {
    total: deals.length,
    active: deals.filter(d =>
      d.is_active &&
      new Date(d.start_time) <= now &&
      new Date(d.end_time) >= now &&
      d.remaining_quantity > 0
    ).length,
    upcoming: deals.filter(d =>
      d.is_active &&
      new Date(d.start_time) > now
    ).length,
    expired: deals.filter(d =>
      new Date(d.end_time) < now
    ).length,
    soldOut: deals.filter(d =>
      d.remaining_quantity === 0
    ).length,
    totalRevenue: deals.reduce((sum, d) =>
      sum + (d.sold_quantity * d.deal_price), 0
    ),
    totalDiscount: deals.reduce((sum, d) =>
      sum + (d.sold_quantity * (d.original_price - d.deal_price)), 0
    )
  };
}
```

---

## Troubleshooting

### Deal Not Showing as Active
- Check `is_active` is `true`
- Verify `start_time` is in the past
- Verify `end_time` is in the future
- Check `remaining_quantity` > 0

### Timer Not Counting Down
- Ensure `end_time` is properly formatted as ISO 8601
- Check timezone conversions
- Verify JavaScript Date parsing

### Stock Not Updating
- Manually update `sold_quantity` when orders are placed
- Check database constraints for quantity validation
- Use transactions to prevent overselling

---

## Summary

✅ **Created:** Complete Time Deals system with countdown timers
✅ **Database:** Full schema with constraints and helper functions
✅ **Admin Panel:** Beautiful management interface
✅ **Features:** Auto-expiration, stock tracking, custom badges
✅ **Client-Ready:** Examples for frontend integration
✅ **Navigation:** Added to sidebar with ⚡ icon

Your Time Deals feature is ready to create urgency and boost sales! 🚀
