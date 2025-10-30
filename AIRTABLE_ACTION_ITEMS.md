# Airtable Action Items - Validation Rules Field

## What You Need To Do

The "Validation Rules" field in your Airtable "Form Fields" table is currently **not implemented** in the application. To prevent confusion, please take one of the following actions:

## Option 1: Rename the Field (Recommended)

1. Open your Airtable base
2. Go to the "Form Fields" table
3. Click the field header for "Validation Rules"
4. Select "Customize field type"
5. Change the field name to:
   ```
   Validation Rules (INACTIVE - Phase 3)
   ```
6. Click "Save"

This makes it immediately clear that the field is not active.

## Option 2: Hide the Field from Views

1. Open your Airtable base
2. Go to the "Form Fields" table
3. Click "Hide fields" in the toolbar
4. Check "Validation Rules" to hide it
5. Click "Save"

This removes the field from your view while preserving any data for future use.

## Option 3: Add a Field Description

1. Open your Airtable base
2. Go to the "Form Fields" table
3. Click the field header for "Validation Rules"
4. Select "Customize field type"
5. Add this description:
   ```
   ⚠️ NOT IMPLEMENTED - Placeholder for Phase 3 development.
   Do not configure. Values are not read by the application.
   Current validation uses: Required checkbox, Field Type, and Field Options.
   ```
6. Click "Save"

## Why This Matters

Without taking action, users will:
- Waste time configuring validation rules that don't work
- Wonder why their validation rules aren't being applied
- Create support tickets asking about validation issues
- Assume the application is broken

## What Works Today

Current form validation includes:

### ✅ Active Validation Features
1. **Required Fields** - Use the "Required" checkbox
2. **Field Types** - Use "Field Type" (number, text, dropdown, etc.)
3. **Dropdown Options** - Use "Field Options" JSON array
4. **Number Constraints** - Use "Field Options" with min/max/step
5. **Conditional Logic** - Use "Conditional Logic" JSON

### ❌ Not Yet Implemented
1. **Custom Regex Patterns** - Validation Rules field (Phase 3)
2. **Custom Error Messages** - Validation Rules field (Phase 3)
3. **Complex Validation Logic** - Validation Rules field (Phase 3)

## Example of Current Working Validation

Here's how to set up validation that DOES work today:

### Required Field
```
Required: ✓ (checked)
```

### Number with Range
```
Field Type: number
Field Options: {"min": 0, "max": 100, "step": 1}
```

### Dropdown with Specific Options
```
Field Type: dropdown
Field Options: ["Single", "Married Filing Jointly", "Married Filing Separately", "Head of Household"]
```

### Conditional Field (Show/Hide)
```
Conditional Logic: {"showIf": {"field": "filingStatus", "equals": "Married Filing Jointly"}}
```

## Questions?

See `VALIDATION_RULES_STATUS.md` for full technical details about the validation rules field status.

## When Will Custom Validation Be Available?

Custom validation rules are planned for **Phase 3** implementation. The timeline has not been set yet. This field was added to the schema early to make future implementation easier.

---

**Priority:** Medium
**Estimated Time:** 5 minutes
**Impact:** Reduces user confusion and support burden
