# Enhanced Dynamic Forms Guide

## Overview

The Individual Tax form now supports complex layouts matching the original hardcoded form design. All form fields, layouts, section headers, icons, and groupings are dynamically loaded from Airtable, enabling complete customization without code changes.

## New Features

### 1. Layout Types

The system supports multiple layout types for richer form experiences:

- **standard**: Default layout (text, number, dropdown fields)
- **checkbox-grid**: Multi-select checkboxes displayed in a grid
- **radio-group**: Radio buttons displayed as clickable button cards
- **textarea**: Multi-line text input areas

### 2. Section Headers with Icons

Forms can be organized into logical sections with headers and icons:

- Add section headers to group related fields
- Include icons from Lucide Icons library
- Automatic section rendering based on field order

### 3. Two-Column Layouts

Support for half-width fields displayed side-by-side:

- Set `Field Width` to "half"
- Use `Row Group` number to pair fields
- Responsive: stacks vertically on mobile, side-by-side on desktop

### 4. Dynamic Icons

Icons are dynamically rendered based on Airtable configuration:

- 50+ icon options from Lucide Icons
- Consistent styling and sizing
- Fallback to default icon if not found

## Airtable Configuration

### Updated Table Schema

**Table Name:** `Form Fields - Individual Tax`

| Column Name | Type | Description | Example Values |
|-------------|------|-------------|----------------|
| Field ID | Text | Unique identifier | `field_filing_status` |
| Service ID | Text | Always `individual-tax` | `individual-tax` |
| Field Name | Text | FormData property name | `filingStatus` |
| Field Type | Select | Input field type | `dropdown`, `text`, `number`, `checkbox` |
| Field Label | Text | Label shown to user | `Filing Status` |
| Placeholder | Text | Placeholder text | `Select your filing status` |
| Options | Long Text | JSON for options | `["Single","Married"]` |
| Required | Checkbox | Is field required? | ✓ |
| Active | Checkbox | Show field? | ✓ |
| Display Order | Number | Sort order | `1`, `2`, `3` |
| Help Text | Long Text | Optional help text | `Choose your status...` |
| **Field Width** | Select | `full` or `half` | `half` |
| **Section Header** | Text | Section heading | `Basic Information` |
| **Section Icon** | Text | Icon name | `users`, `dollar-sign` |
| **Layout Type** | Select | Layout variant | `checkbox-grid`, `radio-group` |
| **Columns** | Number | Grid columns (1-3) | `2` |
| **Row Group** | Number | Group ID for pairing | `1`, `2`, `3` |

### Layout Type Details

#### Standard Layout

Default layout for basic field types. No special configuration needed.

```
Field Type: dropdown, text, number
Layout Type: standard (or leave blank)
Field Width: full
```

#### Checkbox Grid

Multi-select checkboxes displayed in a grid with custom column count.

```
Field Type: multi-select
Layout Type: checkbox-grid
Columns: 2
Options: ["Option 1", "Option 2", "Option 3", "Option 4"]
```

Renders as:
```
┌─────────────┬─────────────┐
│ ☐ Option 1  │ ☐ Option 2  │
├─────────────┼─────────────┤
│ ☐ Option 3  │ ☐ Option 4  │
└─────────────┴─────────────┘
```

#### Radio Group

Radio buttons displayed as large, clickable button cards.

```
Field Type: radio
Layout Type: radio-group
Options: ["Option A", "Option B", "Option C"]
```

Renders as:
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Option A   │  │   Option B   │  │   Option C   │
└──────────────┘  └──────────────┘  └──────────────┘
```

#### Textarea

Multi-line text input for longer responses.

```
Field Type: textarea
Layout Type: textarea
Options: {"rows": 4}
```

### Two-Column Layout Configuration

To create side-by-side fields:

1. Set both fields to `Field Width: half`
2. Assign the same `Row Group` number to both
3. Fields will render side-by-side on desktop

**Example:**

| Field Name | Field Width | Row Group | Display Order |
|------------|-------------|-----------|---------------|
| filingStatus | half | 1 | 1 |
| annualIncome | half | 1 | 2 |
| taxYear | half | 2 | 3 |
| timeline | half | 2 | 4 |

Renders as:
```
Desktop:
┌──────────────────┬──────────────────┐
│ Filing Status    │ Annual Income    │
├──────────────────┼──────────────────┤
│ Tax Year         │ Timeline         │
└──────────────────┴──────────────────┘

Mobile:
┌──────────────────────────────────┐
│ Filing Status                    │
├──────────────────────────────────┤
│ Annual Income                    │
├──────────────────────────────────┤
│ Tax Year                         │
├──────────────────────────────────┤
│ Timeline                         │
└──────────────────────────────────┘
```

### Section Headers Configuration

To add section headers:

1. Set `Section Header` to your heading text
2. Optionally set `Section Icon` to an icon name
3. All consecutive fields with the same section header are grouped

**Example:**

| Field Name | Section Header | Section Icon | Display Order |
|------------|----------------|--------------|---------------|
| filingStatus | Basic Information | users | 1 |
| annualIncome | Basic Information | users | 2 |
| incomeTypes | Income Details | briefcase | 3 |
| taxSituations | Income Details | briefcase | 4 |

Renders with two sections, each with their respective icons and headings.

## Available Icons

Icons are from the Lucide Icons library. Common icons include:

### Common Form Icons

- `users` - People/filing status
- `dollar-sign` - Money/income
- `calendar` - Dates/timelines
- `home` - Property/residence
- `briefcase` - Business/employment
- `trending-up` - Investments/growth
- `file-text` - Documents
- `check-circle` - Confirmations
- `info` - Information

### Additional Icons

See `/src/utils/iconMapper.tsx` for the complete list of 50+ available icons including:

- Financial: `credit-card`, `wallet`, `banknote`, `receipt`
- Business: `building`, `package`, `shopping-cart`, `truck`
- Analytics: `bar-chart`, `pie-chart`, `activity`
- Communication: `mail`, `phone`, `globe`
- UI Elements: `settings`, `help-circle`, `alert-circle`, `star`

## Example Configurations

### Example 1: Two-Column Dropdown Fields

```
Field 1:
- Field ID: field_filing_status
- Field Name: filingStatus
- Field Type: dropdown
- Field Label: Filing Status
- Options: ["Single","Married Filing Jointly","Married Filing Separately","Head of Household"]
- Field Width: half
- Row Group: 1
- Display Order: 1

Field 2:
- Field ID: field_annual_income
- Field Name: annualIncome
- Field Type: dropdown
- Field Label: Annual Income Range
- Options: ["Under $25,000","$25,000 - $50,000","$50,000 - $75,000"]
- Field Width: half
- Row Group: 1
- Display Order: 2
```

### Example 2: Checkbox Grid with Section

```
Section Field:
- Field ID: field_income_types
- Field Name: incomeTypes
- Field Type: multi-select
- Field Label: Types of Income (Select all that apply)
- Layout Type: checkbox-grid
- Columns: 2
- Options: ["W-2 wages","1099 income","Social Security","Unemployment","Investment income","Retirement distributions"]
- Section Header: Income Details
- Section Icon: briefcase
- Display Order: 5
```

### Example 3: Radio Group for Deduction Type

```
Field:
- Field ID: field_deduction_type
- Field Name: deductionType
- Field Type: radio
- Field Label: Deduction Preference
- Layout Type: radio-group
- Options: ["Standard deduction","Itemized deductions","Not sure - need guidance"]
- Help Text: You will most likely itemize if your qualified expenses exceed...
- Display Order: 10
```

### Example 4: Conditional Number Field

```
Field:
- Field ID: field_k1_count
- Field Name: k1Count
- Field Type: number
- Field Label: Number of K-1s
- Options: {"min": 0, "max": 50, "step": 1}
- Placeholder: Enter number of K-1s
- Display Order: 15
```

### Example 5: Textarea for Special Circumstances

```
Field:
- Field ID: field_special_circumstances
- Field Name: specialCircumstances
- Field Type: textarea
- Field Label: Special Circumstances or Questions
- Layout Type: textarea
- Options: {"rows": 4}
- Placeholder: Tell us about any special circumstances...
- Required: false
- Display Order: 99
```

## Implementation Details

### Component Architecture

```
IndividualTaxDynamic.tsx
├── Fetches fields from Airtable
├── Groups fields by section headers
├── Groups half-width fields by rowGroup
├── Renders section headers with icons
└── Passes fields to DynamicFormField

DynamicFormField.tsx
├── Renders field based on layoutType
├── Supports checkbox-grid layout
├── Supports radio-group layout
├── Supports textarea layout
└── Handles value changes

iconMapper.tsx
├── Maps icon names to Lucide components
├── Provides DynamicIcon component
└── Includes 50+ icons
```

### Data Flow

```
Airtable
  ↓
formFieldsService.getCachedFormFields()
  ↓
IndividualTaxDynamic
  ↓ (renders sections and groups)
DynamicFormField
  ↓ (renders individual fields)
Form State Update
  ↓
FormData.individualTax
```

## Testing Guide

### Test Case 1: Section Headers

1. Create 3 fields with same section header
2. Navigate to Individual Tax step
3. Verify section header appears once above fields
4. Verify icon displays next to header

### Test Case 2: Two-Column Layout

1. Create 2 fields with same rowGroup and half width
2. View on desktop browser
3. Verify fields appear side-by-side
4. Resize to mobile width
5. Verify fields stack vertically

### Test Case 3: Checkbox Grid

1. Create field with layoutType: checkbox-grid
2. Set columns to 2
3. Add 6 options
4. Verify checkboxes render in 2-column grid
5. Select multiple options
6. Verify selections save correctly

### Test Case 4: Radio Group

1. Create field with layoutType: radio-group
2. Add 3 options
3. Verify options render as large button cards
4. Click to select
5. Verify only one can be selected

### Test Case 5: Dynamic Icons

1. Use various icon names (users, dollar-sign, briefcase)
2. Verify correct icons display
3. Test invalid icon name
4. Verify fallback icon displays

### Test Case 6: Field Ordering

1. Set display order: 1, 3, 2, 4
2. Verify fields render in order: 1, 2, 3, 4
3. Update display order in Airtable
4. Wait 5 minutes for cache refresh
5. Verify new order applies

## Troubleshooting

### Fields Not Rendering

**Problem:** Fields don't appear on the form

**Solutions:**
- Check `Active` is set to TRUE
- Verify `Service ID` = `individual-tax` (exact match)
- Check `Display Order` is set
- Review browser console for errors
- Verify Airtable API credentials in tenant config

### Layout Not Working

**Problem:** Two-column layout shows stacked fields

**Solutions:**
- Verify both fields have `Field Width: half`
- Ensure both have same `Row Group` number
- Check browser width (collapses on mobile)
- Inspect with browser DevTools

### Icons Not Showing

**Problem:** Icons don't display or show default icon

**Solutions:**
- Verify icon name matches available icons (see iconMapper.tsx)
- Use kebab-case format (e.g., `dollar-sign` not `dollarSign`)
- Check Section Icon field is populated
- Review console for icon not found warnings

### Checkbox Grid Not Working

**Problem:** Checkboxes don't display in grid

**Solutions:**
- Set `Layout Type: checkbox-grid`
- Ensure `Field Type` is `multi-select`
- Set `Columns` to desired number (1-3)
- Verify `Options` contains JSON array

### Values Not Saving

**Problem:** Form values don't persist

**Solutions:**
- Verify `Field Name` matches FormData property
- Check field type matches data type (string vs number vs array)
- Review browser console for errors
- Test with simple text field first

## Performance Considerations

### Caching

- Form fields are cached for 5 minutes
- First load fetches from Airtable
- Subsequent loads use cached data
- Changes take up to 5 minutes to appear

### Optimization Tips

1. Keep field count reasonable (< 50 fields)
2. Use appropriate field types (dropdown vs text)
3. Minimize complex layouts where not needed
4. Test with realistic data volumes

## Future Enhancements

### Conditional Logic (Phase 2)

Show/hide fields based on other field values:

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

### Field Validation Rules (Phase 3)

⚠️ **NOT YET IMPLEMENTED** - This is a planned future feature.

The "Validation Rules" field in Airtable should NOT be used yet. Any values entered will be ignored.

Planned custom validation patterns:

```json
{
  "validation": {
    "pattern": "^[0-9]{5}$",
    "message": "Enter a valid 5-digit ZIP code"
  }
}
```

See `VALIDATION_RULES_STATUS.md` for details.

### Multi-Page Forms (Phase 4)

Break long forms into multiple pages with progress tracking.

## Support

For issues or questions:

1. Check browser console for error messages
2. Review this guide for configuration examples
3. Verify Airtable table schema matches requirements
4. Test with minimal configuration first
5. Contact development team with specific error details

## Quick Reference

### Minimal Field Configuration

```
Required Fields:
- Field ID: unique identifier
- Service ID: individual-tax
- Field Name: matches FormData property
- Field Type: text, number, dropdown, etc.
- Field Label: user-facing label
- Active: TRUE
- Display Order: numeric order

Optional Fields:
- Placeholder, Help Text, Options
- Field Width, Row Group (for layout)
- Section Header, Section Icon (for organization)
- Layout Type, Columns (for special layouts)
```

### Common Patterns

**Basic Dropdown:**
```
Field Type: dropdown
Options: ["Option 1", "Option 2"]
```

**Two Fields Side-by-Side:**
```
Both fields:
- Field Width: half
- Row Group: 1
```

**Checkbox Grid:**
```
Field Type: multi-select
Layout Type: checkbox-grid
Columns: 2
```

**Section with Icon:**
```
Section Header: Your Section Name
Section Icon: briefcase
```
