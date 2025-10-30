# Airtable Quick Setup Guide

## ⚠️ Important: Inactive Fields

**"Validation Rules"** field is NOT implemented yet. Do not configure it - values are ignored by the application. See `VALIDATION_RULES_STATUS.md` for details.

## Required Columns for "Form Fields - Individual Tax" Table

### Core Fields (Existing)

| Column Name | Type | Required | Example |
|-------------|------|----------|---------|
| Field ID | Single Line Text | ✅ | `field_filing_status` |
| Service ID | Single Line Text | ✅ | `individual-tax` |
| Field Name | Single Line Text | ✅ | `filingStatus` |
| Field Type | Single Select | ✅ | `dropdown` |
| Field Label | Single Line Text | ✅ | `Filing Status` |
| Active | Checkbox | ✅ | ✓ |
| Display Order | Number | ✅ | `1` |

### Optional Fields (Existing)

| Column Name | Type | Example |
|-------------|------|---------|
| Placeholder | Single Line Text | `Select your filing status` |
| Options | Long Text | `["Single","Married"]` |
| Required | Checkbox | ✓ |
| Help Text | Long Text | `Choose the status that applies...` |

### New Layout Fields

| Column Name | Type | Options | Example |
|-------------|------|---------|---------|
| Field Width | Single Select | `full`, `half` | `half` |
| Section Header | Single Line Text | - | `Basic Information` |
| Section Icon | Single Line Text | - | `users` |
| Layout Type | Single Select | `standard`, `checkbox-grid`, `radio-group`, `textarea` | `checkbox-grid` |
| Columns | Number | - | `2` |
| Row Group | Number | - | `1` |

## Field Type Options

| Field Type | Description | Options Format |
|------------|-------------|----------------|
| `text` | Single-line text | Not required |
| `number` | Numeric input | `{"min": 0, "max": 100, "step": 1}` |
| `dropdown` | Select dropdown | `["Option 1", "Option 2"]` |
| `checkbox` | Single checkbox | Not required |
| `textarea` | Multi-line text | `{"rows": 4}` |
| `radio` | Radio buttons | `["Option 1", "Option 2"]` |
| `multi-select` | Multiple checkboxes | `["Option 1", "Option 2"]` |

## Layout Type Guide

### Standard Layout
Use for basic fields (dropdowns, text inputs, number inputs)

```
Field Type: dropdown, text, or number
Layout Type: standard (or leave blank)
```

### Checkbox Grid
Multi-select checkboxes in a grid

```
Field Type: multi-select
Layout Type: checkbox-grid
Columns: 2
Options: ["W-2 wages","1099 income","Social Security"]
```

### Radio Group
Radio buttons as large clickable cards

```
Field Type: radio
Layout Type: radio-group
Options: ["Standard deduction","Itemized deductions"]
```

### Textarea
Multi-line text input

```
Field Type: textarea
Layout Type: textarea
Options: {"rows": 4}
```

## Common Icon Names

| Icon Name | Use Case |
|-----------|----------|
| `users` | Filing status, family info |
| `dollar-sign` | Income, money |
| `calendar` | Dates, timelines |
| `home` | Property, residence |
| `briefcase` | Business, employment |
| `trending-up` | Investments, growth |
| `file-text` | Documents |
| `check-circle` | Confirmations |
| `info` | Information, help |

See `/src/utils/iconMapper.tsx` for complete list of 50+ icons.

## Two-Column Layout Setup

To place two fields side-by-side:

**Field 1:**
- Field Width: `half`
- Row Group: `1`
- Display Order: `1`

**Field 2:**
- Field Width: `half`
- Row Group: `1`
- Display Order: `2`

Both fields will render side-by-side on desktop, stacked on mobile.

## Section Header Setup

To add a section header:

**Any field in the section:**
- Section Header: `Basic Information`
- Section Icon: `users`

The header will appear once before the first field with that section header.

## Example Configurations

### Example 1: Basic Dropdown (Full Width)

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
Field Width: full
```

### Example 2: Two Dropdowns Side-by-Side

**Field 1:**
```
Field ID: field_filing_status
Field Name: filingStatus
Field Type: dropdown
Field Label: Filing Status
Options: ["Single","Married Filing Jointly"]
Field Width: half
Row Group: 1
Display Order: 1
Active: ✓
```

**Field 2:**
```
Field ID: field_annual_income
Field Name: annualIncome
Field Type: dropdown
Field Label: Annual Income Range
Options: ["Under $25,000","$25,000 - $50,000"]
Field Width: half
Row Group: 1
Display Order: 2
Active: ✓
```

### Example 3: Section with Checkbox Grid

```
Field ID: field_income_types
Service ID: individual-tax
Field Name: incomeTypes
Field Type: multi-select
Field Label: Types of Income (Select all that apply)
Layout Type: checkbox-grid
Columns: 2
Options: ["W-2 wages","1099 income","Social Security","Investment income","Retirement distributions","Self-Employment Income"]
Section Header: Income Details
Section Icon: briefcase
Active: ✓
Display Order: 5
```

### Example 4: Radio Group with Help Text

```
Field ID: field_deduction_type
Service ID: individual-tax
Field Name: deductionType
Field Type: radio
Field Label: Deduction Preference
Layout Type: radio-group
Options: ["Standard deduction","Itemized deductions","Not sure - need guidance"]
Help Text: You will most likely itemize your deductions if your qualified expenses exceed the standard deduction amount for your filing status.
Active: ✓
Display Order: 10
```

### Example 5: Number Input

```
Field ID: field_k1_count
Service ID: individual-tax
Field Name: k1Count
Field Type: number
Field Label: Number of K-1s
Placeholder: Enter number of K-1s
Options: {"min": 0, "max": 50, "step": 1}
Active: ✓
Display Order: 15
```

### Example 6: Textarea

```
Field ID: field_special_circumstances
Service ID: individual-tax
Field Name: specialCircumstances
Field Type: textarea
Field Label: Special Circumstances or Questions
Layout Type: textarea
Options: {"rows": 4}
Placeholder: Tell us about any special circumstances, life changes, or specific questions...
Required: false
Active: ✓
Display Order: 99
```

## Field Name to FormData Mapping

The `Field Name` must match the property name in `formData.individualTax`:

| Field Name | FormData Path | Type |
|------------|---------------|------|
| `filingStatus` | `formData.individualTax.filingStatus` | string |
| `annualIncome` | `formData.individualTax.annualIncome` | string |
| `incomeTypes` | `formData.individualTax.incomeTypes` | string[] |
| `k1Count` | `formData.individualTax.k1Count` | number |
| `deductionType` | `formData.individualTax.deductionType` | string |
| `taxYear` | `formData.individualTax.taxYear` | string |
| `timeline` | `formData.individualTax.timeline` | string |
| `specialCircumstances` | `formData.individualTax.specialCircumstances` | string |

## Tips for Configuration

### Display Order Best Practices

- Use increments of 5 or 10 (5, 10, 15, 20...)
- Leaves room to insert fields later
- Keep related fields close together

### Options JSON Format

**Dropdown/Multi-select:**
```json
["Option 1", "Option 2", "Option 3"]
```

**Number field constraints:**
```json
{"min": 0, "max": 100, "step": 1}
```

**Textarea rows:**
```json
{"rows": 4}
```

### Row Grouping Rules

- Only works with `Field Width: half`
- Use same number for fields on same row
- Can have multiple row groups (1, 2, 3, etc.)
- Incomplete groups render on their own

### Section Headers

- Set on first field of section
- Will appear once before that field
- Can repeat on multiple fields (displays once)
- Optional icon from available icon list

## Testing Your Configuration

1. Set all fields to `Active: ✓`
2. Set `Service ID: individual-tax` on all fields
3. Set unique `Field ID` for each field
4. Verify `Field Name` matches FormData properties
5. Test form in browser
6. Check browser console for errors
7. Test field validation and saving

## Common Mistakes to Avoid

❌ **Service ID mismatch** - Must be exactly `individual-tax`
❌ **Invalid Field Names** - Must match FormData properties exactly
❌ **Missing Display Order** - Fields won't sort correctly
❌ **Invalid JSON in Options** - Field won't render properly
❌ **Wrong Field Type for Layout** - checkbox-grid needs multi-select
❌ **Row Group without half width** - Won't create two columns

## Cache Timing

- Forms fields are cached for **5 minutes**
- Changes in Airtable take up to 5 minutes to appear
- Force refresh: Wait 5 minutes or restart server
- Test changes: Set up new field with high display order

## Getting Help

1. Check browser console for error messages
2. Verify field configuration against examples
3. Test with minimal configuration first
4. Review ENHANCED_DYNAMIC_FORMS_GUIDE.md for details
5. Contact development team with:
   - Field ID of problematic field
   - Error messages from console
   - Screenshot of Airtable configuration

## Quick Checklist

Before deploying:

- [ ] All required columns exist in Airtable
- [ ] Service ID set to `individual-tax` on all fields
- [ ] Field Names match FormData properties
- [ ] Display Order set on all fields
- [ ] Active checkbox checked
- [ ] Options JSON valid (if used)
- [ ] Icons tested (if used)
- [ ] Two-column layouts have matching Row Group
- [ ] Feature flag enabled: `USE_DYNAMIC_INDIVIDUAL_TAX = true`
- [ ] Tested in browser
- [ ] No console errors

## Success Indicators

✅ Form loads without errors
✅ All fields render in correct order
✅ Section headers display properly
✅ Two-column layouts work on desktop
✅ Checkbox grids display in columns
✅ Radio groups show as button cards
✅ Field values save correctly
✅ Form validation works
✅ Help text displays when clicked
✅ Icons render next to section headers
