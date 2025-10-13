# Additional Services Pricing Implementation

## Overview
This document describes the implementation of Additional Services pricing calculation and Zapier payload inclusion, following the same pattern as core services (Individual Tax, Business Tax, Bookkeeping, Advisory).

## Changes Made

### 1. **quoteCalculator.ts** - Enhanced Additional Services Pricing Logic

#### Location: Lines 170-220 (approx)

**What Changed:**
- Enhanced the existing Additional Services rule processing to extract and store pricing data
- Added advisory discount application for eligible Additional Services
- Populated the `hourlyServices` array with detailed pricing for each selected Additional Service
- Added comprehensive console logging for debugging

**Key Features:**
- **Rate Extraction**: For per-unit services (hourly), uses `rule.unitPrice`; for fixed-fee services, uses `rule.basePrice`
- **Advisory Discount**: Automatically applies advisory discount if user has selected advisory services and the service is eligible
- **Service Tracking**: Adds each selected Additional Service to `quote.hourlyServices` array with:
  - `name`: Service name (e.g., "1099 Filing", "Tax Planning Consultation")
  - `rate`: Price per unit or fixed fee (with advisory discount applied if eligible)
  - `unitName`: Unit of measurement (e.g., "hour", "service", "filing")
  - `billingFrequency`: How it's billed ("Hourly", "One-Time Fee", "Monthly")

**Example Log Output:**
```
=== ADDITIONAL SERVICE RULE CHECK ===
Rule: additional-services-1099
Service Name: 1099 Filing
Selected Filings: ['1099 Filing', 'Tax Planning Consultation']
Rule Applies: true
Advisory discount applied: 0.5
Discounted rate: 50
Added to hourlyServices: {
  name: '1099 Filing',
  rate: 50,
  unitName: 'filing',
  billingFrequency: 'Hourly'
}
```

### 2. **zapierIntegration.ts** - Enhanced Fee Extraction and Payload

#### Location: Lines 46-145 (extractIndividualServiceFees function)

**What Changed:**
- Extended the `fees` object to include individual Additional Services fields
- Added extraction logic that maps service names to fee field names
- Iterates through `quote.hourlyServices` array to extract rates and frequencies
- Only includes fields for selected services (if not selected, field is `undefined`)

**New Fields Added to Fees Object:**
```typescript
// Additional Services - Individual Service Rates and Fees
accountsReceivableRate?: number;
accountsReceivableFrequency?: string;
accountsPayableRate?: number;
accountsPayableFrequency?: string;
ninetyNineFilingRate?: number;
ninetyNineFilingFrequency?: string;
scheduleCRate?: number;
scheduleCFrequency?: string;
salesTaxFee?: number;
salesTaxFrequency?: string;
taxPlanningFee?: number;
taxPlanningFrequency?: string;
form2553Fee?: number;
form2553Frequency?: string;
```

**Service Name Mapping:**
The code maps Airtable service names to payload field names:
- "Accounts Receivable Management" → `accountsReceivableRate`, `accountsReceivableFrequency`
- "Accounts Payable Management" → `accountsPayableRate`, `accountsPayableFrequency`
- "1099 Filing" → `ninetyNineFilingRate`, `ninetyNineFilingFrequency`
- "Schedule C Financial Statement Prep" → `scheduleCRate`, `scheduleCFrequency`
- "Sales Tax Filing" → `salesTaxFee`, `salesTaxFrequency`
- "Tax Planning Consultation" → `taxPlanningFee`, `taxPlanningFrequency`
- "S-Corp Election (Form 2553)" → `form2553Fee`, `form2553Frequency`

#### Location: Lines 230-250 (Zapier payload construction)

**What Changed:**
- Added new fields to the Zapier webhook payload
- Fields are only included if the service is selected (undefined values are automatically handled by JSON.stringify)

**Example Payload Structure:**
```json
{
  "clientQuotes": {
    "additionalServicesSelected": "1099 Filing,Tax Planning Consultation",

    "ninetyNineFilingRate": 100,
    "ninetyNineFilingFrequency": "Hourly",

    "taxPlanningFee": 150,
    "taxPlanningFrequency": "One-Time Fee",

    // Other selected services...
  }
}
```

### 3. **quote.ts** - Extended TypeScript Types

#### Location: Lines 108-124

**What Changed:**
- Added new optional fields to the `FormData.additionalServices` interface
- Fields store pricing data extracted from Airtable Pricing Variables
- Includes both rate and frequency for each service

**New Type Definition:**
```typescript
additionalServices?: {
  // ... existing fields ...

  // Additional Services - Individual Service Rates and Fees
  accountsReceivableRate?: number;
  accountsReceivableFrequency?: string;
  accountsPayableRate?: number;
  accountsPayableFrequency?: string;
  ninetyNineFilingRate?: number;
  ninetyNineFilingFrequency?: string;
  scheduleCRate?: number;
  scheduleCFrequency?: string;
  salesTaxFee?: number;
  salesTaxFrequency?: string;
  taxPlanningFee?: number;
  taxPlanningFrequency?: string;
  form2553Fee?: number;
  form2553Frequency?: string;
}
```

## How It Works - End-to-End Flow

### 1. **User Selects Additional Services**
- User clicks checkboxes in `AdditionalServicesDetails.tsx`
- Selected services are stored in `formData.additionalServices.specializedFilings` as an array of service names
- Example: `['1099 Filing', 'Tax Planning Consultation', 'Accounts Receivable Management']`

### 2. **Quote Calculation (quoteCalculator.ts)**
- When `calculateQuote()` is called, it iterates through all pricing rules from Airtable
- For rules where `serviceId === 'additional-services'` and `pricingType === 'Add-on'`:
  - Checks if the service name is in `specializedFilings` array
  - If match found, extracts pricing (unit price or base price)
  - Applies advisory discount if user has advisory services selected
  - Adds service to `quote.hourlyServices` array with rate and billing frequency
- Services are NOT added to aggregate totals (shown separately in UI)

### 3. **Form Submission (QuoteCalculator.tsx)**
- When user clicks "Get Quote", `handleGetQuoteAndSubmit()` is called
- Calls `sendQuoteToZapierWebhook(formData, quote, tenantId, webhookUrl)`

### 4. **Fee Extraction (zapierIntegration.ts)**
- `extractIndividualServiceFees()` function processes the quote data
- Iterates through `quote.hourlyServices` array
- For each service, looks up the field name mapping
- Stores rate and frequency in the fees object
- Only includes fields for services that were actually selected

### 5. **Zapier Payload Construction**
- Fees object is merged into the payload
- Fields with `undefined` values are automatically excluded by `JSON.stringify()`
- Payload is sent to tenant's Zapier webhook URL

### 6. **Zapier Receives Payload**
The Zapier webhook receives a payload like:
```json
{
  "quoteId": "QUOTE-20251013-ABC123",
  "tenantId": "elevated-tax",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",

  "additionalServicesSelected": "1099 Filing,Tax Planning Consultation",

  "ninetyNineFilingRate": 100,
  "ninetyNineFilingFrequency": "Hourly",
  "taxPlanningFee": 150,
  "taxPlanningFrequency": "One-Time Fee",

  // Core service fees...
  "individualTaxFee": 500,
  "businessTaxFee": 1200,
  "monthlyBookkeepingFee": 450
}
```

## Validation & Error Handling

### Pricing Configuration Loading
- Pricing configuration is loaded from Airtable on component mount (`QuoteCalculator.tsx`)
- `isLoadingPricing` state tracks loading status
- If pricing config fails to load, falls back to default pricing logic
- Error messages are logged to console for debugging

### Missing Services
- If a selected service has no matching pricing rule in Airtable:
  - Service is skipped (not added to hourlyServices)
  - Console warning is logged
  - No error thrown (graceful degradation)

### Advisory Discount Application
- Only applied if `advisoryDiscountEligible === true` in Airtable
- Only applied if user has selected advisory services
- Discount percentage comes from `advisoryDiscountPercentage` field
- Applied before adding to hourlyServices array

## Multi-Tenant Support

### Tenant-Specific Configuration
- Each tenant has their own Airtable base IDs and API keys
- Pricing rules are filtered by `tenantId` in Supabase
- Each tenant can have different:
  - Service availability (Active flag)
  - Pricing amounts
  - Advisory discount percentages
  - Billing frequencies

### Zapier Webhook
- Each tenant has their own `zapierWebhookUrl` in the `tenants` table
- Payload includes `tenantId` for routing on Zapier's side

## Testing Checklist

- [ ] Select individual Additional Services and verify pricing appears in payload
- [ ] Select multiple Additional Services and verify all appear in payload
- [ ] Test with advisory services selected (verify discounts applied)
- [ ] Test without advisory services selected (verify no discounts)
- [ ] Verify hourly services (AR, AP, 1099, Schedule C) show correct rates
- [ ] Verify fixed-fee services (Tax Planning, S-Corp Election) show correct fees
- [ ] Verify unselected services don't appear in payload
- [ ] Test payload structure matches Airtable field requirements
- [ ] Verify console logs show correct extraction process
- [ ] Test with Pricing Variables missing from Airtable (graceful degradation)

## Maintenance Notes

### Adding New Additional Services

To add a new Additional Service:

1. **In Airtable Pricing Variables table:**
   - Add new row with `Service ID = 'additional-services'`
   - Set `Pricing Type = 'Add-on'`
   - Set `Service Name` (must match exactly what users see)
   - Set `Base Price` (for fixed fee) or `Unit Price` (for per-unit)
   - Set `Billing Frequency` ('Hourly', 'One-Time Fee', or 'Monthly')
   - Set advisory discount eligibility and percentage

2. **In zapierIntegration.ts:**
   - Add new entry to `serviceNameMapping` object (lines 90-120)
   - Define field names for rate and frequency

3. **In quote.ts:**
   - Add new optional fields to `FormData.additionalServices` interface

4. **In zapierIntegration.ts (payload section):**
   - Add new fields to payload construction (lines 230-250)

### Debugging Tips

1. **Check Console Logs:**
   - Look for "=== ADDITIONAL SERVICE RULE CHECK ===" logs
   - Verify "Rule Applies: true" for selected services
   - Check "Added to hourlyServices" output

2. **Inspect Network Tab:**
   - Check Zapier webhook POST request
   - Verify payload structure in request body
   - Check for undefined fields (should not appear)

3. **Verify Airtable Data:**
   - Confirm pricing rules exist for tenant
   - Check `Active` flag is TRUE
   - Verify `Service Name` matches exactly (case-sensitive)
   - Confirm `tenantId` filter is correct

## Performance Considerations

- Pricing configuration is cached after initial load
- No additional API calls during quote calculation
- Fee extraction runs synchronously (minimal overhead)
- Payload size increase: ~8-14 additional fields (negligible)

## Security Considerations

- Pricing data is read-only for end users
- Webhook URL is stored securely in Supabase
- Advisory discount logic cannot be manipulated by users
- All calculations happen server-side equivalent (in quote calculator)

## Future Enhancements

Potential improvements:
1. Store calculated fees in Supabase `client_quotes` table for audit trail
2. Add validation to ensure pricing rules exist before allowing submission
3. Create admin UI to manage Additional Services pricing without Airtable access
4. Add A/B testing for different pricing structures
5. Implement pricing history tracking for quote comparisons
