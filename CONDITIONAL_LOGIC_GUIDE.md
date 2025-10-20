# Conditional Logic Guide

## Overview

Dynamic forms now support conditional field visibility using Airtable's **Conditional Logic** column. This enables follow-up questions that only appear when specific options are selected, creating a more intelligent and streamlined user experience.

## How It Works

Fields with conditional logic rules are automatically shown or hidden based on the values of other fields. When a parent field changes:

1. The form evaluates all conditional rules
2. Fields that don't meet their conditions are hidden
3. Hidden field values are automatically cleared
4. Transitions are smooth with fade-in animations

## JSON Rule Format

Conditional logic is defined in Airtable using JSON in the **Conditional Logic** column:

```json
{
  "showIf": {
    "field": "fieldName",
    "operator": "includes",
    "value": "Specific Value"
  }
}
```

### Properties

| Property | Type | Description | Required |
|----------|------|-------------|----------|
| `showIf` | Object | The condition container | ✅ Yes |
| `showIf.field` | String | Name of the field to check | ✅ Yes |
| `showIf.operator` | String | Comparison operator | ✅ Yes |
| `showIf.value` | Any | Value to compare against | ✅ Yes |

## Supported Operators

### 1. `includes` - For Multi-Select Fields

**Use Case:** Show field when a specific option is selected in a checkbox group

**Field Types:** `multi-select`, checkbox grids

**Example:**
```json
{
  "showIf": {
    "field": "otherIncomeTypes",
    "operator": "includes",
    "value": "Rental Property Income"
  }
}
```

**Behavior:**
- Checks if the array of selected values includes the specified value
- Parent field must be an array (multi-select or checkbox grid)
- Case-sensitive match

### 2. `equals` - For Single-Select Fields

**Use Case:** Show field when a specific option is selected in dropdown or radio button

**Field Types:** `dropdown`, `radio`, `text`, `number`

**Example:**
```json
{
  "showIf": {
    "field": "filingStatus",
    "operator": "equals",
    "value": "Married Filing Jointly"
  }
}
```

**Behavior:**
- Exact match comparison
- Works with strings, numbers, and booleans
- Case-sensitive

### 3. `not_equals` - For Negative Conditions

**Use Case:** Show field when a specific option is NOT selected

**Field Types:** Any single-value field

**Example:**
```json
{
  "showIf": {
    "field": "previousPreparer",
    "operator": "not_equals",
    "value": "First time filing"
  }
}
```

**Behavior:**
- Shows field when value does NOT match
- Useful for "skip this if..." scenarios

### 4. `greater_than` - For Number Comparisons

**Use Case:** Show field when number exceeds threshold

**Field Types:** `number`

**Example:**
```json
{
  "showIf": {
    "field": "annualIncome",
    "operator": "greater_than",
    "value": 100000
  }
}
```

**Behavior:**
- Numeric comparison only
- Converts values to numbers automatically
- Shows warning if non-numeric values provided

### 5. `less_than` - For Number Comparisons

**Use Case:** Show field when number is below threshold

**Field Types:** `number`

**Example:**
```json
{
  "showIf": {
    "field": "employeeCount",
    "operator": "less_than",
    "value": 10
  }
}
```

**Behavior:**
- Numeric comparison only
- Useful for "small business" conditional fields

## Real-World Examples

### Example 1: Rental Property Follow-Up

**Parent Field:**
- Field Name: `otherIncomeTypes`
- Field Type: `multi-select`
- Layout Type: `checkbox-grid`
- Options: `["S-Corp/Partnership Income", "Rental Property Income", "Farm Income"]`

**Conditional Field:**
- Field Name: `rentalPropertyCount`
- Field Type: `number`
- Field Label: "How many rental properties do you own?"
- Conditional Logic:
```json
{
  "showIf": {
    "field": "otherIncomeTypes",
    "operator": "includes",
    "value": "Rental Property Income"
  }
}
```

**User Experience:**
1. User sees checkbox grid with income types
2. User checks "Rental Property Income"
3. Number input field fades in: "How many rental properties do you own?"
4. User unchecks "Rental Property Income"
5. Number input field fades out and value is cleared

### Example 2: K-1 Count for Partnership Income

**Parent Field:**
- Field Name: `otherIncomeTypes`
- Field Type: `multi-select`

**Conditional Field:**
- Field Name: `k1Count`
- Field Type: `number`
- Field Label: "Number of K-1s"
- Conditional Logic:
```json
{
  "showIf": {
    "field": "otherIncomeTypes",
    "operator": "includes",
    "value": "S-Corp/Partnership Income"
  }
}
```

### Example 3: Filing Status Dependent Field

**Parent Field:**
- Field Name: `filingStatus`
- Field Type: `dropdown`
- Options: `["Single", "Married Filing Jointly", "Married Filing Separately"]`

**Conditional Field:**
- Field Name: `spouseName`
- Field Type: `text`
- Field Label: "Spouse's Full Name"
- Conditional Logic:
```json
{
  "showIf": {
    "field": "filingStatus",
    "operator": "equals",
    "value": "Married Filing Jointly"
  }
}
```

### Example 4: Multiple States Scenario

**Parent Field:**
- Field Name: `additionalConsiderations`
- Field Type: `multi-select`
- Layout Type: `checkbox-grid`

**Conditional Field:**
- Field Name: `additionalStateCount`
- Field Type: `number`
- Field Label: "Number of Additional States"
- Conditional Logic:
```json
{
  "showIf": {
    "field": "additionalConsiderations",
    "operator": "includes",
    "value": "Income from multiple states"
  }
}
```

### Example 5: Other Income Description

**Parent Field:**
- Field Name: `hasOtherIncome`
- Field Type: `dropdown`
- Options: `["Yes", "No"]`

**Conditional Field:**
- Field Name: `otherIncomeDescription`
- Field Type: `textarea`
- Field Label: "Please describe your other sources of income"
- Conditional Logic:
```json
{
  "showIf": {
    "field": "hasOtherIncome",
    "operator": "equals",
    "value": "Yes"
  }
}
```

### Example 6: High-Income Tax Planning

**Parent Field:**
- Field Name: `annualIncome`
- Field Type: `dropdown`
- Options: `["Under $25,000", "$25,000 - $50,000", "...", "Over $500,000"]`

**Conditional Field:**
- Field Name: `advancedTaxPlanning`
- Field Type: `radio`
- Field Label: "Are you interested in advanced tax planning strategies?"
- Conditional Logic:
```json
{
  "showIf": {
    "field": "annualIncome",
    "operator": "equals",
    "value": "Over $500,000"
  }
}
```

## Configuration in Airtable

### Step-by-Step Setup

1. **Create Parent Field**
   - Add field that will control visibility
   - Configure as dropdown, checkbox grid, etc.
   - Set Field Name (e.g., `otherIncomeTypes`)

2. **Create Conditional Field**
   - Add the field that should show/hide
   - Configure field type and label
   - Set Field Name (e.g., `rentalPropertyCount`)

3. **Add Conditional Logic**
   - In Conditional Logic column, add JSON:
   ```json
   {
     "showIf": {
       "field": "otherIncomeTypes",
       "operator": "includes",
       "value": "Rental Property Income"
     }
   }
   ```

4. **Verify Field Names Match**
   - `showIf.field` must exactly match parent Field Name
   - Case-sensitive
   - No extra spaces

5. **Test in Form**
   - Load form
   - Verify conditional field is hidden initially
   - Select parent option
   - Verify conditional field appears
   - Deselect parent option
   - Verify conditional field disappears and value clears

### Airtable Table Configuration

| Field Name | Field Type | Conditional Logic | Display Order |
|------------|------------|-------------------|---------------|
| otherIncomeTypes | multi-select | *(empty)* | 10 |
| rentalPropertyCount | number | `{"showIf": {"field": "otherIncomeTypes", "operator": "includes", "value": "Rental Property Income"}}` | 11 |
| k1Count | number | `{"showIf": {"field": "otherIncomeTypes", "operator": "includes", "value": "S-Corp/Partnership Income"}}` | 12 |

## Advanced Patterns

### Chained Conditions (Coming Soon)

Currently, only single-level conditions are supported. Future enhancement:

```json
{
  "showIf": {
    "all": [
      {"field": "filingStatus", "operator": "equals", "value": "Married Filing Jointly"},
      {"field": "annualIncome", "operator": "equals", "value": "Over $500,000"}
    ]
  }
}
```

### OR Conditions (Coming Soon)

```json
{
  "showIf": {
    "any": [
      {"field": "incomeTypes", "operator": "includes", "value": "Investment income"},
      {"field": "incomeTypes", "operator": "includes", "value": "Cryptocurrency Sales"}
    ]
  }
}
```

## Technical Implementation

### Components Involved

**Files:**
- `/src/utils/conditionalLogic.ts` - Evaluation logic
- `/src/components/IndividualTaxDynamic.tsx` - Form rendering
- `/src/index.css` - Fade animations

### Evaluation Flow

```
1. User changes field value
   ↓
2. handleFieldChange() called
   ↓
3. Update form data with new value
   ↓
4. getFieldsToClear() identifies dependent fields
   ↓
5. Clear hidden field values
   ↓
6. Update form state
   ↓
7. renderFields() filters visible fields
   ↓
8. shouldShowField() evaluates each condition
   ↓
9. Render only visible fields with animation
```

### Value Clearing Logic

When a parent field changes and causes conditional fields to hide:

```typescript
// Automatically executed in handleFieldChange
const fieldsToClear = getFieldsToClear(formFields, fieldName, updatedData);
fieldsToClear.forEach(fieldToClear => {
  updatedData[fieldToClear] = null; // Clear hidden field
});
```

**Benefits:**
- Prevents stale data in hidden fields
- Cleaner form submissions
- Avoids confusion in pricing calculations

### Animation Behavior

Fields use CSS animations for smooth transitions:

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Effect:**
- 300ms duration
- Ease-in-out timing
- Subtle upward slide
- Professional feel

## Error Handling

### Invalid JSON

**Problem:** Malformed JSON in Conditional Logic column

**Behavior:**
- Field is shown (fail-safe)
- Warning logged to console
- Form remains functional

**Solution:** Validate JSON syntax in Airtable

### Missing Parent Field

**Problem:** `showIf.field` references non-existent field

**Behavior:**
- Field is hidden (no parent value to check)
- No error thrown
- Form remains functional

**Solution:** Verify field name matches exactly

### Type Mismatch

**Problem:** Using `includes` on non-array field

**Behavior:**
- Field is hidden
- Warning logged to console
- Form remains functional

**Solution:** Use correct operator for field type

### Invalid Operator

**Problem:** Operator not in supported list

**Behavior:**
- Field is shown (fail-safe)
- Warning logged to console

**Solution:** Use only supported operators

## Testing Checklist

### Basic Functionality

- [ ] Field hidden when condition not met
- [ ] Field shows when condition met
- [ ] Field hides when condition no longer met
- [ ] Hidden field value is cleared

### Operator Testing

- [ ] `includes` works with multi-select
- [ ] `equals` works with dropdown
- [ ] `not_equals` inverts visibility correctly
- [ ] `greater_than` compares numbers
- [ ] `less_than` compares numbers

### Edge Cases

- [ ] Invalid JSON doesn't break form
- [ ] Missing parent field handled gracefully
- [ ] Type mismatches logged but don't error
- [ ] Multiple conditional fields work together
- [ ] Conditional fields in two-column layouts
- [ ] Conditional fields with section headers

### User Experience

- [ ] Smooth fade-in animation
- [ ] Smooth fade-out animation
- [ ] No layout jumping
- [ ] Console logging helpful for debugging
- [ ] Values clear when fields hide

## Troubleshooting

### Field Not Showing

**Checklist:**
1. Verify JSON syntax is valid
2. Check field name matches exactly (case-sensitive)
3. Confirm operator is correct for field type
4. Test parent field has expected value
5. Check browser console for warnings

### Field Always Showing

**Possible Causes:**
- Conditional Logic column is empty
- JSON parsing failed (check console)
- Parent field name doesn't match
- Invalid operator defaulting to "show"

### Value Not Clearing

**Possible Causes:**
- Value clearing only happens on parent field change
- Check console for "Clearing hidden field" message
- Verify field is actually hidden (not just off-screen)

### Animation Issues

**Possible Causes:**
- CSS not loaded correctly
- Check for `animate-fadeIn` class in DOM
- Browser doesn't support CSS animations (unlikely)

## Best Practices

### Design Patterns

1. **Progressive Disclosure**
   - Hide complex fields until needed
   - Reduce initial form overwhelm
   - Ask follow-up questions contextually

2. **Logical Grouping**
   - Keep conditional fields near parent fields
   - Use Display Order wisely
   - Consider section headers for groups

3. **Clear Labels**
   - Make field labels reference parent context
   - Example: "How many rental properties?" vs "Number"
   - Users should understand why field appeared

4. **Default Values**
   - Don't set defaults on conditional fields
   - Let user provide value when visible
   - Cleared values should stay null/empty

### Performance Considerations

- Limit nesting depth (single level for now)
- Avoid circular dependencies
- Keep condition count reasonable (< 20)
- Use Display Order to minimize re-renders

## Future Enhancements

### Phase 2: Complex Conditions

- AND/OR logic
- Multiple conditions per field
- Nested condition groups

### Phase 3: Calculated Values

- Show field based on calculated values
- Example: Show if income > expenses

### Phase 4: Field Dependencies

- Visual indicators of dependencies
- Dependency graph view
- Validation of circular references

## Summary

Conditional logic transforms static forms into intelligent, adaptive experiences. By showing only relevant fields, you:

✅ Reduce form complexity
✅ Improve user experience
✅ Collect accurate, contextual data
✅ Maintain clean, organized forms
✅ Enable sophisticated workflows

All controlled through Airtable configuration—no code required!
