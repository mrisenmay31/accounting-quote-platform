# Zapier Dynamic Fields Fix

## Problem

Dynamic form fields from the Individual Tax page (and other dynamic service forms) were not being included in the Zapier webhook payload. Only hardcoded fields were being sent.

## Root Cause

The issue was caused by an incorrect parameter being passed to `fetchFormFields()` in `QuoteCalculator.tsx`:

```typescript
// BEFORE (INCORRECT)
fetchFormFields(tenant, serviceId)  // ❌ Wrong - passing entire tenant object
```

The `fetchFormFields()` function expects an `AirtableFormFieldConfig` object with `baseId` and `apiKey` properties, not the entire tenant object. This caused the form field definitions to fail loading, which meant the `buildDynamicFormFields()` function had no field definitions to work with when building the Zapier payload.

## Changes Made

### 1. Fixed Form Fields Fetching in QuoteCalculator.tsx

**Location:** `/src/components/QuoteCalculator.tsx` (lines 264-277)

**Before:**
```typescript
const formFieldsPromises = formData.services.map(serviceId =>
  fetchFormFields(tenant, serviceId)  // ❌ Incorrect
);
```

**After:**
```typescript
const airtableConfig = {
  baseId: tenant.airtable.servicesBaseId || tenant.airtable.pricingBaseId,
  apiKey: tenant.airtable.servicesApiKey || tenant.airtable.pricingApiKey,
};

const formFieldsPromises = formData.services.map(serviceId =>
  fetchFormFields(airtableConfig, serviceId)  // ✅ Correct
);
```

### 2. Enhanced buildDynamicFormFields Function

**Location:** `/src/utils/zapierIntegration.ts` (lines 326-365)

**Improvements:**
- Added comprehensive logging to track which fields are found and which are missing
- Improved the value lookup logic to prioritize nested service data (e.g., `formData.individualTax`)
- Added better handling for numeric values (including 0)
- Added field count summary in console logs
- Fixed the order of priority: nested service data first, then root level

**Key Logic:**
```typescript
// PRIORITY 1: Try to get value from service-specific nested data first
if (field.serviceId) {
  const serviceData = formData[field.serviceId as keyof FormData];
  if (serviceData && typeof serviceData === 'object') {
    value = (serviceData as any)[fieldName];
    if (value !== undefined && value !== null && value !== '') {
      valueSource = `nested (${field.serviceId})`;
      fieldsFound++;
    }
  }
}

// PRIORITY 2: Try root level if not found in nested data
if ((value === undefined || value === null || value === '') && !field.serviceId) {
  value = formData[fieldName as keyof FormData];
  // ...
}
```

### 3. Enhanced Logging

**Location:** `/src/utils/zapierIntegration.ts`

Added detailed logging at three stages:

1. **Building Dynamic Fields** - Shows which fields are found/missing
   ```
   === BUILDING DYNAMIC FORM FIELDS FOR ZAPIER ===
   ✓ Field found: "Filing Status" (filingStatus) = "married-joint" [nested (individual-tax)]
   ⚠ Field not found: "Field Name" (fieldName) - Service: individual-tax
   ```

2. **Dynamic Fields Summary** - Shows field counts
   ```
   Dynamic Fields Summary:
     Fields with values: 15
     Fields without values: 3
     Total dynamic fields in payload: 18
   ```

3. **Zapier Webhook Payload** - Shows complete payload being sent
   ```
   === SENDING ZAPIER WEBHOOK ===
   Payload Keys: 65
   Full Payload: { ... }
   ```

## How It Works

1. **Form Data Collection:**
   - User fills out Individual Tax form
   - Data is stored in `formData.individualTax` object
   - Example: `formData.individualTax.filingStatus = "married-joint"`

2. **Form Field Definitions Fetch:**
   - When user clicks "Get Quote", fetch form field definitions from Airtable
   - Definitions include: fieldName, fieldLabel, serviceId, fieldType, etc.
   - Uses correct Airtable config object with baseId and apiKey

3. **Dynamic Payload Building:**
   - `buildDynamicFormFields()` iterates through each field definition
   - Looks up the value in the appropriate location (nested service data first)
   - Creates human-readable keys: `"Individual Tax Filing Status"`
   - Formats values appropriately (arrays as comma-separated, booleans as true/false, etc.)

4. **Zapier Webhook:**
   - Complete payload with dynamic fields sent to Zapier
   - Each dynamic field appears with its service prefix and label
   - Example: `"Individual Tax Filing Status": "married-joint"`

## Testing the Fix

To verify the fix is working:

1. Open the browser console (F12)
2. Fill out the Individual Tax form with various fields
3. Click "Get Quote"
4. Look for these console logs:

```
[QuoteCalculator] Fetched X form field definitions for Zapier payload
=== BUILDING DYNAMIC FORM FIELDS FOR ZAPIER ===
  ✓ Field found: "Filing Status" (filingStatus) = "married-joint" [nested (individual-tax)]
  ✓ Field found: "Annual Income" (annualIncome) = "$50,000 - $100,000" [nested (individual-tax)]
  ...
Dynamic Fields Summary:
  Fields with values: 15
  Fields without values: 3
=== DYNAMIC FORM FIELDS IN ZAPIER PAYLOAD ===
Total dynamic fields: 18
```

5. Check the webhook payload to ensure all fields you filled out are included

## What's Fixed

✅ Dynamic fields from Individual Tax form are now included in Zapier payload
✅ Dynamic fields from all other dynamic service forms (Business Tax, Bookkeeping, etc.) are included
✅ Comprehensive logging makes it easy to debug field mapping issues
✅ Proper handling of all data types (strings, numbers, booleans, arrays)
✅ Human-readable field names in Zapier (e.g., "Individual Tax Filing Status")

## Impact

- **Before:** Only ~20 hardcoded fields sent to Zapier
- **After:** ~20 hardcoded fields + all dynamic fields (potentially 50+ total fields depending on services selected)

## Build Status

✅ Build successful
- Build time: 5.75s
- Bundle size: 1,121 KB (236 KB gzipped)
- No errors or warnings related to this fix
