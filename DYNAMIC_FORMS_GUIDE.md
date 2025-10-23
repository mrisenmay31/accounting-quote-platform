# Dynamic Form Fields Guide

## Overview

The Individual Tax step now supports dynamic form rendering using Airtable as the data source. This enables per-tenant customization of form fields without code changes.

## Architecture

### Components

1. **formFieldsService.ts** - Service for fetching form fields from Airtable
2. **DynamicFormField.tsx** - Component that renders different field types
3. **IndividualTaxDynamic.tsx** - Dynamic form wrapper for Individual Tax step
4. **QuoteCalculator.tsx** - Updated to support both static and dynamic forms

### Data Flow

```
Airtable "Form Fields - Individual Tax" Table
    ↓
formFieldsService.getCachedFormFields()
    ↓
IndividualTaxDynamic component
    ↓
DynamicFormField components (one per field)
    ↓
FormData state update
```

## Airtable Setup

### Table: Form Fields - Individual Tax

**Required Columns:**

| Column Name | Type | Description | Example |
|-------------|------|-------------|---------|
| Field ID | Single Line Text | Unique identifier | `field_filing_status` |
| Service ID | Single Line Text | Service identifier | `individual-tax` |
| Field Name | Single Line Text | FormData property name | `filingStatus` |
| Field Type | Single Select | Type of input field | `dropdown` |
| Field Label | Single Line Text | Label shown to user | `Filing Status` |
| Placeholder | Single Line Text | Placeholder text | `Select your filing status` |
| Options | Long Text | JSON array or object | `["Single","Married Filing Jointly"]` |
| Required | Checkbox | Is field required? | ✓ |
| Active | Checkbox | Show field to users? | ✓ |
| Display Order | Number | Sort order (ascending) | `1` |
| Help Text | Long Text | Optional help text | `Choose the status...` |
| Conditional Logic | Long Text | JSON for conditions (Phase 2) | `{"showIf": {...}}` |

### Field Types Supported

| Field Type | Description | Options Format |
|------------|-------------|----------------|
| `text` | Single-line text input | N/A |
| `number` | Numeric input | `{"min": 0, "max": 100, "step": 1}` |
| `dropdown` | Select dropdown | `["Option 1", "Option 2", "Option 3"]` |
| `checkbox` | Single checkbox | N/A |
| `textarea` | Multi-line text | `{"rows": 4}` |
| `radio` | Radio button group | `["Option 1", "Option 2"]` |
| `multi-select` | Multiple checkboxes | `["Option 1", "Option 2", "Option 3"]` |

### Example Records

#### Example 1: Dropdown Field

```
Field ID: field_filing_status
Service ID: individual-tax
Field Name: filingStatus
Field Type: dropdown
Field Label: Filing Status
Placeholder: Select your filing status
Options: ["Single","Married Filing Jointly","Married Filing Separately","Head of Household"]
Required: ✓
Active: ✓
Display Order: 1
```

#### Example 2: Number Field with Constraints

```
Field ID: field_rental_count
Service ID: individual-tax
Field Name: rentalPropertyCount
Field Type: number
Field Label: Number of Rental Properties
Placeholder: Enter number
Options: {"min": 0, "max": 50, "step": 1}
Required: false
Active: ✓
Display Order: 5
```

#### Example 3: Multi-Select Field

```
Field ID: field_income_types
Service ID: individual-tax
Field Name: incomeTypes
Field Type: multi-select
Field Label: Income Types
Options: ["W-2 wages","1099 income","Social Security","Investment income"]
Required: ✓
Active: ✓
Display Order: 3
```

## Enabling Dynamic Forms

### Step 1: Set Feature Flag

In `src/components/QuoteCalculator.tsx`, change:

```typescript
const USE_DYNAMIC_INDIVIDUAL_TAX = false;
```

To:

```typescript
const USE_DYNAMIC_INDIVIDUAL_TAX = true;
```

### Step 2: Configure Airtable

Ensure your tenant configuration includes Airtable credentials in Supabase `tenants` table.

### Step 3: Create Form Fields

Add records to the "Form Fields - Individual Tax" table in Airtable with:
- Service ID = `individual-tax`
- Active = TRUE
- Proper display order
- Valid field names matching FormData structure

## Field Name Mapping

Field names in Airtable must match the property names in `formData.individualTax`:

| Airtable Field Name | FormData Path | Type |
|---------------------|---------------|------|
| `filingStatus` | `formData.individualTax.filingStatus` | string |
| `annualIncome` | `formData.individualTax.annualIncome` | string |
| `incomeTypes` | `formData.individualTax.incomeTypes` | string[] |
| `k1Count` | `formData.individualTax.k1Count` | number |
| `hasOtherIncome` | `formData.individualTax.hasOtherIncome` | string |

## Testing

### Test Case 1: Verify All Fields Render

1. Navigate to Individual Tax step
2. Verify all active fields from Airtable appear
3. Check display order is correct
4. Verify labels, placeholders, and help text display

### Test Case 2: Form Validation

1. Submit form without required fields
2. Verify validation errors appear
3. Fill required fields and submit
4. Verify data saves to formData state

### Test Case 3: Dynamic Updates

1. In Airtable, set a field to Active = FALSE
2. Reload the application
3. Verify the field no longer appears
4. Set Active = TRUE again
5. Verify field reappears

### Test Case 4: Field Types

Test each field type:
- Text: Enter and save text
- Number: Enter number with min/max constraints
- Dropdown: Select from options
- Checkbox: Toggle on/off
- Textarea: Enter multi-line text
- Radio: Select one option
- Multi-select: Select multiple options

## Error Handling

The system handles errors gracefully:

1. **Airtable API Failure**: Shows error message with reload button
2. **No Fields Found**: Shows warning to contact support
3. **Invalid Options JSON**: Logs error, uses empty array
4. **Missing Credentials**: Falls back to default error state

## Caching

Form fields are cached for 5 minutes to reduce API calls:
- First load: Fetches from Airtable
- Subsequent loads: Uses cached data
- After 5 minutes: Refreshes from Airtable

## Future Enhancements

### Phase 2: Conditional Logic

Implement conditional field visibility:

```json
{
  "conditionalLogic": {
    "showIf": {
      "field": "hasRentalProperty",
      "equals": true
    }
  }
}
```

### Phase 3: Field Validation Rules

Add custom validation:

```json
{
  "validation": {
    "pattern": "^[0-9]{5}$",
    "message": "Enter a valid 5-digit ZIP code"
  }
}
```

### Phase 4: Multi-Step Conditional Forms

Chain conditional logic across multiple fields for complex flows.

## Troubleshooting

### Fields Not Appearing

- Verify Service ID = `individual-tax` (exact match)
- Check Active = TRUE
- Confirm Airtable credentials in tenant config
- Check browser console for errors

### Options Not Rendering

- Verify Options column contains valid JSON
- Check for syntax errors in JSON
- Use array format for dropdown/multi-select
- Use object format for number constraints

### Data Not Saving

- Verify Field Name matches FormData property exactly
- Check field type matches data type in FormData
- Ensure updateFormData callback is working
- Review browser console for errors

## Support

For questions or issues, contact the development team or refer to the source code comments in:
- `/src/utils/formFieldsService.ts`
- `/src/components/DynamicFormField.tsx`
- `/src/components/IndividualTaxDynamic.tsx`
