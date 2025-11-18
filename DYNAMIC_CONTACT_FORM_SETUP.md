# Dynamic Contact Form Setup Guide

## Overview

The Contact Information page has been converted to a fully dynamic form powered by Airtable. This allows complete tenant customization of contact fields without any code changes.

## Architecture

The dynamic contact form uses the same architecture as other service detail forms (Individual Tax, Business Tax, etc.):

- **Data Source**: Airtable Form Fields table with Service ID: `contact-info`
- **Component**: `ContactFormDynamic.tsx`
- **Field Rendering**: `DynamicFormField.tsx` (supports email and phone field types)
- **Data Storage**: `formData.contactInfo` object (dynamic key-value pairs)
- **Airtable Write**: Automatic mapping to Client Quotes table columns
- **Schema Sync**: Automatic column creation for new contact fields

## Required Airtable Configuration

### Step 1: Create Contact Info Fields in Form Fields Table

Add these records to your Form Fields table with Service ID: `contact-info`

#### Core Fields (Minimum Required)

| Field Name | Field Label | Field Type | Required | Display Order | Field Width | Row Group | Airtable Column Name | Active | Placeholder |
|------------|-------------|------------|----------|---------------|-------------|-----------|---------------------|--------|-------------|
| email | Email Address | email | TRUE | 1 | full | - | Email | TRUE | your@email.com |
| firstName | First Name | text | TRUE | 2 | half | 1 | First Name | TRUE | John |
| lastName | Last Name | text | TRUE | 3 | half | 1 | Last Name | TRUE | Doe |
| phone | Phone Number | phone | FALSE | 4 | half | 2 | Phone | TRUE | (555) 123-4567 |
| businessName | Business Name | text | FALSE | 5 | half | 2 | Business Name | TRUE | Your Business LLC |

#### Field Configuration Details

**Email Field**
- Field Type: `email` (for proper validation)
- Required: `TRUE`
- Field Width: `full` (takes entire row)
- Airtable Column Name: `Email`

**First Name & Last Name**
- Field Type: `text`
- Required: `TRUE`
- Field Width: `half` (side-by-side layout)
- Row Group: `1` (groups them together)
- Airtable Column Names: `First Name`, `Last Name`

**Phone Number**
- Field Type: `phone`
- Required: `FALSE` (optional)
- Field Width: `half`
- Row Group: `2`
- Airtable Column Name: `Phone`

**Business Name**
- Field Type: `text`
- Required: `FALSE`
- Field Width: `half`
- Row Group: `2`
- Conditional Logic: `{"showIf":{"services":{"operator":"includesAny","value":["business-tax","bookkeeping","advisory"]}}}`
- Airtable Column Name: `Business Name`

### Step 2: Optional - Add Section Headers

You can organize fields into sections by adding a Section Header:

| Field Name | Field Label | Section Header | Section Icon | Display Order |
|------------|-------------|----------------|--------------|---------------|
| email | Email Address | Contact Information | mail | 1 |
| firstName | First Name | - | user | 2 |
| lastName | Last Name | - | user | 3 |

### Step 3: Optional - Add Custom Fields

Add any additional contact fields you need:

**Example: Referral Source**
```
Field Name: referralSource
Field Label: How did you hear about us?
Field Type: dropdown
Field Options: ["Google Search", "Referral", "Social Media", "Other"]
Required: FALSE
Display Order: 6
Field Width: full
Airtable Column Name: Referral Source
Active: TRUE
```

**Example: Preferred Contact Method**
```
Field Name: preferredContactMethod
Field Label: Preferred Contact Method
Field Type: radio
Field Options: ["Email", "Phone", "Text Message"]
Layout Type: radio-group
Required: FALSE
Display Order: 7
Field Width: full
Airtable Column Name: Preferred Contact Method
Active: TRUE
```

**Example: Best Time to Call**
```
Field Name: bestTimeToCall
Field Label: Best Time to Call
Field Type: dropdown
Field Options: ["Morning (9am-12pm)", "Afternoon (12pm-5pm)", "Evening (5pm-8pm)"]
Required: FALSE
Display Order: 8
Field Width: half
Row Group: 3
Airtable Column Name: Best Time To Call
Active: TRUE
```

## Conditional Logic Examples

### Show Field Only for Business Services

```json
{
  "showIf": {
    "services": {
      "operator": "includesAny",
      "value": ["business-tax", "bookkeeping", "advisory"]
    }
  }
}
```

### Show Field Based on Another Contact Field

```json
{
  "showIf": {
    "preferredContactMethod": {
      "operator": "equals",
      "value": "Phone"
    }
  }
}
```

## Field Layout Options

### Side-by-Side Layout

Set `Field Width: half` and assign the same `Row Group` number:

```
firstName - Field Width: half, Row Group: 1
lastName - Field Width: half, Row Group: 1
```

Result: First Name and Last Name appear side-by-side.

### Full-Width Layout

Set `Field Width: full` and leave `Row Group` empty:

```
email - Field Width: full
```

Result: Email field takes the entire row width.

## Supported Field Types

All standard field types are supported in contact form:

- **text** - Single line text input
- **email** - Email input with validation
- **phone** - Phone number input (tel type)
- **number** - Numeric input
- **dropdown** - Single selection dropdown
- **radio** - Radio button selection
- **multi-select** - Multiple checkbox selections
- **textarea** - Multi-line text input
- **checkbox** - Single boolean checkbox

## Data Flow

### 1. Form Submission
When user fills out contact form:
```javascript
formData.contactInfo = {
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  phone: "(555) 123-4567",
  businessName: "Acme Corp"
}
```

### 2. Backward Compatibility
Legacy fields are also populated:
```javascript
formData.email = "user@example.com"
formData.firstName = "John"
formData.lastName = "Doe"
formData.phone = "(555) 123-4567"
```

### 3. Airtable Write
Fields are mapped to Client Quotes table:
```
Email -> "user@example.com"
First Name -> "John"
Last Name -> "Doe"
Phone -> "(555) 123-4567"
Business Name -> "Acme Corp"
```

### 4. Schema Sync
If a field doesn't exist in Client Quotes table, it's automatically created with the proper column type.

## Client Quotes Table Columns

The following columns will be created/used in your Client Quotes table:

### Core Columns
- **Email** (Email field type)
- **First Name** (Single line text)
- **Last Name** (Single line text)
- **Full Name** (Formula: `{First Name} & " " & {Last Name}`)
- **Phone** (Phone number field type)

### Optional Business Fields
- **Business Name** (Single line text)

### Custom Fields
Any custom fields you add will be auto-created in the Client Quotes table using the `Airtable Column Name` specified in Form Fields table.

## Migration Notes

### For Existing Tenants

1. **Before Deployment**: Create the 5 core contact-info fields in Form Fields table
2. **Field Names Must Match**: Use exact field names (email, firstName, lastName, phone, businessName) for backward compatibility
3. **No Data Migration Needed**: Existing formData structure is preserved
4. **Schema Sync Runs Automatically**: Columns will be created on first app load

### For New Tenants

1. Clone the Form Fields table with contact-info records included
2. Customize fields as needed (add/remove/reorder)
3. Schema sync handles Client Quotes table setup automatically

## Validation Rules

### Built-in Validation

- **Required Fields**: Checks all fields marked as Required
- **Email Format**: Validates email syntax using regex
- **Field Visibility**: Only validates visible fields (conditional logic respected)

### Custom Validation

To add custom validation, edit the `handleNext()` function in `ContactFormDynamic.tsx`:

```typescript
// Example: Phone number format validation
const phoneField = fields.find(f => f.fieldName === 'phone');
if (phoneField && isFieldVisible(phoneField)) {
  const phoneValue = formData.contactInfo[phoneField.fieldName];
  const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;

  if (phoneValue && !phoneRegex.test(phoneValue)) {
    alert('Please enter a valid phone number: (555) 123-4567');
    return;
  }
}
```

## Troubleshooting

### Fields Not Appearing

1. Check Service ID is exactly `contact-info`
2. Verify Active field is set to `TRUE`
3. Check Display Order is set (fields without order may not render)
4. Clear browser cache and reload

### Conditional Logic Not Working

1. Verify JSON syntax is valid
2. Check field names match exactly (case-sensitive)
3. Test with services selected
4. Check browser console for errors

### Data Not Writing to Airtable

1. Verify Airtable Column Name is set correctly
2. Check field has a value (empty fields are skipped)
3. Verify Client Quotes table has the column
4. Run schema sync manually via AdminSchemaSync component
5. Check Airtable API logs in browser console

### Schema Sync Errors

1. Verify Airtable API key has schema write permissions
2. Check field type mappings are valid
3. Look for column name conflicts (duplicate names)
4. Check Airtable rate limits (wait and retry)

## Best Practices

### Field Naming

- Use camelCase for Field Name: `referralSource`
- Use Title Case for Field Label: `Referral Source`
- Use Title Case for Airtable Column Name: `Referral Source`

### Display Order

- Use increments of 1: 1, 2, 3, 4, 5...
- Leave gaps for future insertions: 10, 20, 30, 40...
- Group related fields with similar numbers

### Conditional Logic

- Keep conditions simple (1-2 criteria)
- Test all condition paths
- Document complex conditions in Help Text
- Use includesAny for multiple services

### Help Text

- Explain why field is needed
- Provide examples of valid input
- Keep under 100 characters
- Use friendly, conversational tone

## Example Configurations

### Minimal Contact Form (3 fields)
- Email (required)
- First Name (required)
- Last Name (required)

### Standard Contact Form (5 fields)
- Email (required)
- First Name (required)
- Last Name (required)
- Phone (optional)
- Business Name (conditional on business services)

### Extended Contact Form (10+ fields)
- All standard fields
- Referral Source (dropdown)
- Preferred Contact Method (radio)
- Best Time to Call (dropdown)
- Company Size (dropdown)
- Industry (dropdown)
- Current Accounting Software (dropdown)
- Additional Notes (textarea)

## Support

For issues or questions about dynamic contact form:
1. Check browser console for error messages
2. Verify Airtable configuration matches this guide
3. Test with USE_DYNAMIC_CONTACT_FORM feature flag
4. Review ContactFormDynamic.tsx component code

## Feature Flag

The dynamic contact form can be toggled on/off in QuoteCalculator.tsx:

```typescript
const USE_DYNAMIC_CONTACT_FORM = true;  // Set to false to revert to static form
```

This allows safe rollback if issues occur during deployment.
