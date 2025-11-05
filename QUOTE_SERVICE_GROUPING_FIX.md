# Quote Page Service Grouping Fix

## Issue Summary

The Quote page was displaying duplicate service cards for services that had multiple rows in the Services table with the same Service ID. For example, "Bookkeeping & Accounting" appeared twice because the Services table contained two rows:
1. Row 1: serviceId="bookkeeping", billingFrequency="Monthly" (Comprehensive Bookkeeping)
2. Row 2: serviceId="bookkeeping", billingFrequency="One-Time Fee" (Books Cleanup/Catch-up)

Both cards showed identical total pricing ($405 Monthly + $2,430 One-time) because the pricing calculation was already correctly aggregating all pricing rules by serviceId, but the display logic was creating separate cards for each Services table row.

## Root Cause

The Services table in Airtable follows a **single-row-per-endpoint** pattern where multiple rows with the same `serviceId` represent different billing frequencies or pricing endpoints for the same logical service. However, the quote display logic in `quoteCalculator.ts` was iterating through all ServiceConfig entries (one per Services table row) rather than grouping by unique serviceId first.

### Previous Logic (Lines 520-587)
```typescript
// Iterated through serviceConfig array directly
for (const serviceConfigItem of serviceConfig) {
  const serviceId = serviceConfigItem.serviceId;
  const group = serviceGroups[serviceId];
  // Created one card per serviceConfig entry
  services.push(serviceQuote);
}
```

This meant:
- **serviceId="bookkeeping"** with 2 ServiceConfig rows → 2 cards created
- Both cards used the same `serviceGroups["bookkeeping"]` data
- Both cards displayed the same aggregated totals

## Solution Implemented

### 1. Group ServiceConfig by Service ID
```typescript
const serviceConfigByServiceId = new Map<string, ServiceConfig[]>();

for (const configItem of serviceConfig) {
  if (!serviceConfigByServiceId.has(configItem.serviceId)) {
    serviceConfigByServiceId.set(configItem.serviceId, []);
  }
  serviceConfigByServiceId.get(configItem.serviceId)!.push(configItem);
}
```

This creates a mapping:
```
{
  "bookkeeping": [
    { serviceId: "bookkeeping", billingFrequency: "Monthly", title: "Bookkeeping Services", ... },
    { serviceId: "bookkeeping", billingFrequency: "One-Time Fee", title: "Books Cleanup", ... }
  ],
  "individual-tax": [
    { serviceId: "individual-tax", billingFrequency: "One-Time Fee", title: "Individual Tax", ... }
  ],
  ...
}
```

### 2. Sort by Unique Service IDs
```typescript
const uniqueServiceIds = Array.from(serviceConfigByServiceId.keys()).sort((a, b) => {
  const configsA = serviceConfigByServiceId.get(a)!;
  const configsB = serviceConfigByServiceId.get(b)!;
  const minOrderA = Math.min(...configsA.map(c => c.serviceOrder || 999));
  const minOrderB = Math.min(...configsB.map(c => c.serviceOrder || 999));
  return minOrderA - minOrderB;
});
```

Ensures services are displayed in the correct order based on the minimum `serviceOrder` value among all rows for that serviceId.

### 3. Select Primary Config Row for Display
```typescript
const configRows = serviceConfigByServiceId.get(serviceId)!;
const primaryConfig = configRows.find(c => c.billingFrequency === 'Monthly') ||
                      configRows.sort((a, b) => (a.serviceOrder || 999) - (b.serviceOrder || 999))[0];
```

**Priority Logic:**
1. Prefer rows with `billingFrequency="Monthly"` (most common billing type)
2. Fall back to row with lowest `serviceOrder`
3. Use first occurrence as final fallback

For bookkeeping, this selects the "Monthly" row (Comprehensive Bookkeeping) as the primary display row.

### 4. Create One Card Per Service ID
```typescript
const serviceQuote: ServiceQuote = {
  name: primaryConfig?.title || getServiceDisplayName(serviceId),
  description: primaryConfig?.description || baseRule.description || getServiceDescription(serviceId),
  monthlyFee: Math.round(group.totalMonthlyFees),  // Aggregated from all billing frequencies
  oneTimeFee: Math.round(group.totalOneTimeFees), // Aggregated from all billing frequencies
  annualPrice: Math.round(group.totalMonthlyFees * 12 + group.totalOneTimeFees),
  included: includedFeatures,  // All pricing rules for this serviceId
  addOns: [...],
  pricingFactors: [...]
};
```

## Result

### Before Fix
```
┌─────────────────────────────────────────┐
│ Bookkeeping Services                    │
│ Monthly bookkeeping...                  │
│ Monthly fee ................ $405       │
│ One-time fee ............. $2,430       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Books Cleanup                           │
│ Catch-up services...                    │
│ Monthly fee ................ $405       │
│ One-time fee ............. $2,430       │
└─────────────────────────────────────────┘
```
**Problem**: Two cards, identical totals, confusing user experience

### After Fix
```
┌─────────────────────────────────────────┐
│ Bookkeeping Services                    │
│ Comprehensive bookkeeping services...   │
│                                         │
│ INCLUDED:                               │
│ ✓ Bookkeeping Minimum Fee               │
│ ✓ 151-200 Monthly Transaction Tier     │
│ ✓ Books Cleanup/Catch-up                │
│                                         │
│ Monthly fee ................ $405       │
│ One-time fee ............. $2,430       │
└─────────────────────────────────────────┘
```
**Result**: One card, clear breakdown of both billing frequencies, all features shown

## Technical Details

### Files Modified
- `src/utils/quoteCalculator.ts` (lines 520-628)

### Key Changes
1. Added Map-based grouping of ServiceConfig entries by serviceId
2. Implemented primary config row selection logic with clear priority rules
3. Enhanced console logging for debugging service grouping
4. Maintained backward compatibility with existing pricing aggregation
5. Preserved all existing functionality (conditional reordering, add-ons, pricing factors)

### Edge Cases Handled
- Services with only one ServiceConfig row (work exactly as before)
- Services with multiple billing frequencies (grouped correctly)
- Services with no monthly pricing (one-time only)
- Services with no one-time pricing (monthly only)
- Services with missing serviceOrder values (fallback to 999)
- Additional-services continue to display separately (as designed)

## Testing Checklist

✅ Bookkeeping service displays as ONE card (not two)
✅ Monthly fees ($405) shown correctly
✅ One-time fees ($2,430) shown correctly
✅ All included features visible in single card
✅ Service order preserved
✅ Other services display correctly
✅ Individual tax service still works
✅ Business tax service still works
✅ Advisory services still work
✅ Additional services section unchanged
✅ Build completes without errors

## Console Output Enhancement

Added detailed logging for debugging:
```
=== SERVICE CONFIG GROUPING ===
bookkeeping: 2 config row(s)
  - Bookkeeping Services (Monthly)
  - Books Cleanup (One-Time Fee)
individual-tax: 1 config row(s)
  - Individual Tax Preparation (One-Time Fee)
================================

=== PROCESSING SERVICE: bookkeeping ===
Primary config: Bookkeeping Services
Config rows available: 2
Monthly fees: $405
One-time fees: $2430
Created service quote card: Bookkeeping Services
  Monthly: $405, One-time: $2430
  Included features: 8
=====================================
```

## Architecture Notes

This fix aligns with the documented **single-row-per-endpoint** pattern described in `src/types/quote.ts`:

```typescript
/**
 * ServiceConfig - Configuration for a service in the quote calculator
 *
 * SINGLE-ROW-PER-ENDPOINT CONFIGURATION:
 * Each Services table row represents ONE pricing endpoint.
 * Multiple rows with the same serviceId can exist to define different billing frequencies.
 *
 * Example:
 * Row 1: serviceId="bookkeeping", billingFrequency="Monthly", totalVariableName="monthly_bookkeeping_fee"
 * Row 2: serviceId="bookkeeping", billingFrequency="One-Time Fee", totalVariableName="catchup_bookkeeping_fee"
 */
```

The pricing calculation logic was already following this pattern (grouping by serviceId), but the display logic needed to be updated to match.
