# Formula Pricing - Quick Reference Card

## Variable Syntax

| Syntax | Example | Resolves To |
|--------|---------|-------------|
| `{{fieldName}}` | `{{quantity}}` | `formData.quantity` |
| `{{service.field}}` | `{{bookkeeping.monthsBehind}}` | `formData.bookkeeping.monthsBehind` |
| `{{pricingRule.rule-id}}` | `{{pricingRule.monthly-base}}` | Calculated price from another rule |
| Service Totals | `{{individualTaxTotal}}` | Dynamic service-level total with filters |
| Special | `{{monthlyBookkeepingRate}}` | Sum of monthly bookkeeping rules (legacy) |

## Operators

| Type | Operators | Example |
|------|-----------|---------|
| **Arithmetic** | `+` `-` `*` `/` `%` | `{{price}} * {{quantity}}` |
| **Comparison** | `>` `<` `>=` `<=` `==` `!=` | `{{quantity}} > 100` |
| **Logical** | `&&` `||` `!` | `{{qty}} > 10 && {{type}} == "bulk"` |
| **Ternary** | `? :` | `{{qty}} > 100 ? 8 : 10` |

## Math Functions

| Function | Purpose | Example |
|----------|---------|---------|
| `Math.max(a, b, ...)` | Maximum value | `Math.max({{price}}, 1000)` |
| `Math.min(a, b, ...)` | Minimum value | `Math.min({{price}}, 5000)` |
| `Math.round(x)` | Round to integer | `Math.round({{price}})` |
| `Math.floor(x)` | Round down | `Math.floor({{price}})` |
| `Math.ceil(x)` | Round up | `Math.ceil({{price}})` |
| `Math.abs(x)` | Absolute value | `Math.abs({{difference}})` |
| `Math.pow(base, exp)` | Power | `Math.pow({{base}}, 2)` |
| `Math.sqrt(x)` | Square root | `Math.sqrt({{value}})` |

## Service-Level Total Variables

Service-level total variables are dynamically calculated from all pricing rules for each service, based on configuration in the Services table. These variables update in real-time as pricing rules are calculated.

### Two Configuration Approaches

**APPROACH 1: Individual Fields (Simple Services)**
Use for services with ONE total variable. Cleanest Airtable UI.

**APPROACH 2: Total Variables Array (Complex Services)**
Use for services with MULTIPLE total variables (e.g., monthly + one-time totals).

**Resolution Priority:**
1. System checks `Total Variables` array first
2. Falls back to individual fields (`Total Variable Name`, etc.)
3. Returns 0 if neither is configured

**Important:** Don't mix both approaches on the same service. Use one or the other.

---

### How They Work

1. Configured in Services table (via individual fields OR array)
2. Filtered by `Aggregation Rules` (pricingType and billingFrequency)
3. Calculated on-demand during formula evaluation
4. Can enforce service-level minimum fees independently
5. Must have `Can Reference in Formulas` = true (individual fields approach)

---

### APPROACH 1: Individual Fields Configuration

Use this for simple services with **one total variable**.

**Airtable Fields:**

| Field Name | Type | Example Value |
|------------|------|---------------|
| `Total Variable Name` | Text | `individualTaxTotal` |
| `Aggregation Rules` | Long Text (JSON) | `{"includeBillingFrequencies": ["One-Time Fee"]}` |
| `Display Name (Quote)` | Text | `Total Individual Tax Fee` |
| `Can Reference in Formulas` | Checkbox | ✓ true |

**Example Configuration:**

```json
Total Variable Name: individualTaxTotal
Aggregation Rules: {
  "includeTypes": ["Base Service", "Add-on"],
  "excludeTypes": ["Discount"],
  "includeBillingFrequencies": ["One-Time Fee"],
  "minimumFee": 0
}
Can Reference in Formulas: true
```

**Usage in Formulas:**
```javascript
{{individualTaxTotal}} * 0.15
```

---

### APPROACH 2: Total Variables Array Configuration

Use this for complex services with **multiple total variables** (e.g., Bookkeeping with separate monthly and one-time totals).

**Airtable Field:**

| Field Name | Type | Example Value |
|------------|------|---------------|
| `Total Variables` | Long Text (JSON array) | See below |

**Example Configuration (Bookkeeping Service):**

```json
[
  {
    "variableName": "monthlyBookkeepingTotal",
    "displayName": "Monthly Bookkeeping Total",
    "aggregationRules": {
      "includeTypes": ["Base Service", "Add-on"],
      "excludeTypes": ["Discount"],
      "includeBillingFrequencies": ["Monthly"],
      "excludeBillingFrequencies": ["One-Time Fee"],
      "minimumFee": 150
    }
  },
  {
    "variableName": "catchupBookkeepingTotal",
    "displayName": "Catch-Up Bookkeeping Total",
    "aggregationRules": {
      "includeTypes": ["Base Service", "Add-on"],
      "excludeTypes": ["Discount"],
      "includeBillingFrequencies": ["One-Time Fee"],
      "excludeBillingFrequencies": ["Monthly"],
      "minimumFee": 0
    }
  }
]
```

**Usage in Formulas:**
```javascript
// Reference monthly total
{{monthlyBookkeepingTotal}} * 12

// Reference one-time catch-up (which itself uses monthly total)
{{monthlyBookkeepingTotal}} * {{bookkeeping.monthsBehind}} * 1.25

// Cross-reference between totals
{{monthlyBookkeepingTotal}} + {{catchupBookkeepingTotal}}
```

---

### Configuration Examples by Use Case

#### Simple Service (Individual Tax)
**Scenario:** One total for all one-time tax fees

**Use:** Individual Fields (APPROACH 1)

```
Total Variable Name: individualTaxTotal
Aggregation Rules: {
  "includeBillingFrequencies": ["One-Time Fee"]
}
Can Reference in Formulas: true
```

#### Complex Service (Bookkeeping)
**Scenario:** Separate totals for monthly fees vs. catch-up fees

**Use:** Total Variables Array (APPROACH 2)

```json
[
  {
    "variableName": "monthlyBookkeepingTotal",
    "displayName": "Monthly Bookkeeping",
    "aggregationRules": {
      "includeBillingFrequencies": ["Monthly"],
      "minimumFee": 150
    }
  },
  {
    "variableName": "catchupBookkeepingTotal",
    "displayName": "Catch-Up Bookkeeping",
    "aggregationRules": {
      "includeBillingFrequencies": ["One-Time Fee"]
    }
  }
]
```

### Available Service Total Variables

Variables are defined in your Services table. Common examples:

| Variable | Service | Approach | Billing Frequency | Description |
|----------|---------|----------|-------------------|-------------|
| `{{individualTaxTotal}}` | Individual Tax | Individual Fields | One-Time Fee | Total of all individual tax fees |
| `{{businessTaxTotal}}` | Business Tax | Individual Fields | One-Time Fee | Total of all business tax fees |
| `{{monthlyBookkeepingTotal}}` | Bookkeeping | Array | Monthly | Monthly bookkeeping fees only ($150 min) |
| `{{catchupBookkeepingTotal}}` | Bookkeeping | Array | One-Time Fee | Catch-up bookkeeping fees only |
| `{{additionalServicesTotal}}` | Additional Services | Individual Fields | One-Time Fee | Total additional services fees |

**Note:** Actual variable names depend on your Services table configuration.

### Usage Examples

**Catch-up bookkeeping based on monthly rate (cross-reference between totals):**
```javascript
{{monthlyBookkeepingTotal}} * {{bookkeeping.monthsBehind}} * 1.25
```

**Annual tax package discount:**
```javascript
({{individualTaxTotal}} + {{businessTaxTotal}}) * 0.90
```

**Quarterly advisory add-on based on tax complexity:**
```javascript
({{individualTaxTotal}} + {{businessTaxTotal}}) * 0.15
```

**Service bundle with minimum:**
```javascript
Math.max({{monthlyBookkeepingTotal}} * 12 + {{businessTaxTotal}}, 10000)
```

**Annual bookkeeping contract (reference monthly total):**
```javascript
{{monthlyBookkeepingTotal}} * 12 * 0.85
```

### Filtering Behavior

**By Pricing Type:**
- `includeTypes`: Only include these pricing types (default: `["Base Service", "Add-on"]`)
- `excludeTypes`: Exclude these pricing types (default: `[]`)

**By Billing Frequency:**
- `includeBillingFrequencies`: Only include these frequencies (default: all)
- `excludeBillingFrequencies`: Exclude these frequencies (default: `[]`)

**Minimum Fee:**
- Applied after all filtering and summing
- Returns `Math.max(calculatedTotal, minimumFee)`

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Variable returns $0 | Check that service has active pricing rules matching the filters |
| Variable not found (Individual) | Verify `Total Variable Name` is set and `Can Reference in Formulas` = true |
| Variable not found (Array) | Check `Total Variables` JSON array has matching `variableName` |
| Wrong approach used | Console shows which path was used: "(FROM ARRAY)" or "(FROM INDIVIDUAL FIELDS)" |
| Unexpected total | Review `Aggregation Rules` JSON - check includeTypes and billing frequencies |
| Missing some fees | Ensure pricing rules have correct `pricingType` and `billingFrequency` |
| Minimum not applied | Check `minimumFee` in aggregation rules (not at pricing rule level) |
| Multiple totals not working | Use array approach, not individual fields |

### Migration Guide

**From Individual Fields to Array:**

If you need to add a second total variable to a service currently using individual fields:

1. Copy existing configuration to array format
2. Add new total variable to the array
3. Clear individual fields (or leave for backward compatibility)
4. Test both variables in formulas

**Example Migration (Bookkeeping):**

**Before (Individual Fields):**
```
Total Variable Name: bookkeepingMonthly
Aggregation Rules: {"includeBillingFrequencies": ["Monthly"], "minimumFee": 150}
Can Reference in Formulas: true
```

**After (Array - adds catch-up total):**
```json
Total Variables: [
  {
    "variableName": "monthlyBookkeepingTotal",
    "displayName": "Monthly Bookkeeping",
    "aggregationRules": {
      "includeBillingFrequencies": ["Monthly"],
      "minimumFee": 150
    }
  },
  {
    "variableName": "catchupBookkeepingTotal",
    "displayName": "Catch-Up Bookkeeping",
    "aggregationRules": {
      "includeBillingFrequencies": ["One-Time Fee"]
    }
  }
]
```

Clear individual fields after migration, or leave them for backward compatibility (array takes priority).

## Common Formula Patterns

### Simple Multiplication
```javascript
{{monthlyRate}} * {{months}}
```

### Volume Discount (Ternary)
```javascript
{{quantity}} > 100 ? {{bulkPrice}} : {{regularPrice}}
```

### Tiered Pricing (Nested Ternary)
```javascript
{{revenue}} < 100000 ? 1000 : {{revenue}} < 500000 ? 2500 : 5000
```

### Minimum Enforcement
```javascript
Math.max({{calculatedPrice}}, 1260)
```

### Percentage Calculation
```javascript
{{baseAmount}} * 0.15
```

### Multi-Factor
```javascript
({{basePrice}} + ({{units}} * {{perUnit}})) * {{multiplier}}
```

### Conditional Multiplier
```javascript
{{basePrice}} * ({{isComplex}} == "Yes" ? 1.5 : 1)
```

### Rule Reference
```javascript
{{pricingRule.monthly-fee}} * 12
```

### Combined Min/Max
```javascript
Math.min(Math.max({{price}}, 500), 5000)
```

### Boolean to Number
```javascript
{{basePrice}} + ({{hasPremium}} == "Yes" ? 500 : 0)
```

## Airtable Setup (5 Fields)

| Field Name | Type | Required | Example |
|------------|------|----------|---------|
| **Calculation Method** | Single Select | For formulas | `formula` |
| **Formula Expression** | Long Text | For formulas | `{{rate}} * {{months}}` |
| **Formula Input Fields** | Long Text (JSON) | Optional | `["rate", "months"]` |
| **Minimum Value** | Currency | Optional | `1260` |
| **Maximum Value** | Currency | Optional | `10000` |

### Calculation Method Options
- `simple` - Fixed price
- `per-unit` - Price × quantity
- `formula` - Expression-based

## Constraints

Applied automatically after formula evaluation:

```javascript
// Step 1: Evaluate formula
calculatedPrice = evaluate(formulaExpression)

// Step 2: Apply minimum
if (minimumValue) {
  calculatedPrice = Math.max(calculatedPrice, minimumValue)
}

// Step 3: Apply maximum
if (maximumValue) {
  calculatedPrice = Math.min(calculatedPrice, maximumValue)
}
```

## Debugging

### Console Logs

Look for these in browser console (F12):

**Successful:**
```
🧮 FORMULA EVALUATION
Expression: {{rate}} * {{months}}
After Substitution: 105 * 8
Final Price: $1,260.00
```

**Warning:**
```
⚠️ Variable 'fieldName' not found in form data, using 0
```

**Error:**
```
❌ Formula evaluation failed: SyntaxError
```

### Quick Debug Checklist

- [ ] Calculation Method = `formula`
- [ ] Formula Expression has value
- [ ] Variable names match form fields exactly
- [ ] No syntax errors (matching parentheses, etc.)
- [ ] Form data populated (user filled fields)
- [ ] Trigger conditions met
- [ ] Check console for warnings/errors

## Common Issues

| Issue | Solution |
|-------|----------|
| Price = $0 | Check trigger conditions, verify formula expression exists |
| Variable not found | Check spelling (case-sensitive), verify form data populated |
| Syntax error | Check parentheses matching, ternary format: `? :` |
| Wrong result | Verify variable values in console log, check logic |
| Rule reference = 0 | Ensure referenced rule exists and is active |

## Example: Catch-Up Bookkeeping

**Goal:** Monthly rate × months behind, minimum $1,260

**Airtable Configuration:**
```
Pricing Rule ID: bookkeeping-catchup
Service ID: bookkeeping
Calculation Method: formula
Formula Expression: {{monthlyBookkeepingRate}} * {{bookkeeping.monthsBehind}}
Minimum Value: 1260
Trigger Form Field: bookkeeping.currentStatus
Required Form Value: Books need to be caught up
Billing Frequency: One-time
```

**Results:**
- Low volume (105/mo) × 8 months = 840 → **$1,260** (minimum)
- High volume (305/mo) × 12 months = 3,660 → **$3,660** (above min)

## Testing Scenarios

### Test 1: Basic Math
```
Formula: {{a}} + {{b}}
Data: a = 100, b = 50
Expected: 150
```

### Test 2: Ternary
```
Formula: {{x}} > 10 ? 100 : 50
Data: x = 15
Expected: 100
```

### Test 3: With Minimum
```
Formula: {{price}} * {{qty}}
Data: price = 10, qty = 3
Minimum: 100
Expected: 100
```

### Test 4: Math Function
```
Formula: Math.max({{a}}, {{b}}, {{c}})
Data: a = 50, b = 100, c = 75
Expected: 100
```

### Test 5: Nested Ternary
```
Formula: {{x}} < 50 ? 10 : {{x}} < 100 ? 20 : 30
Data: x = 75
Expected: 20
```

## Best Practices

### DO
✅ Start with simple formulas
✅ Test with multiple scenarios
✅ Use console logs for debugging
✅ Set realistic min/max constraints
✅ Document complex formulas in Input Fields
✅ Use descriptive variable names

### DON'T
❌ Create circular rule references
❌ Use deeply nested ternaries (max 2-3 levels)
❌ Reference form fields that may not exist
❌ Forget to test edge cases (zero, large numbers)
❌ Use formulas for simple fixed prices
❌ Skip testing after changes

## Variable Type Conversions

| Input Type | Converted To | Example |
|------------|--------------|---------|
| Number | Number | `105` → `105` |
| String (numeric) | Number | `"105"` → `105` |
| String (non-numeric) | 0 | `"abc"` → `0` |
| Boolean | Number | `true` → `1`, `false` → `0` |
| Undefined/null | 0 | `undefined` → `0` |
| Array | 0 | `[1,2,3]` → `0` (warning) |
| Object | 0 | `{a:1}` → `0` (warning) |

## Security Notes

### Allowed
✅ Math operators: `+ - * / %`
✅ Comparisons: `> < >= <= == !=`
✅ Ternary: `? :`
✅ Math functions: `Math.*`
✅ Numbers and identifiers

### Blocked
❌ Variable declarations: `var`, `let`, `const`
❌ Function definitions: `function`, `=>`
❌ Code execution: `eval()`, `Function()`
❌ External references: `window`, `document`
❌ Loops: `for`, `while`
❌ Assignments: `=`, `+=`

## Formula Examples by Use Case

### Revenue-Based
```javascript
{{annualRevenue}} * 0.02
```

### Volume Discount
```javascript
{{quantity}} > 100 ? {{quantity}} * 8 : {{quantity}} * 10
```

### Complexity Multiplier
```javascript
{{basePrice}} * ({{isMultiState}} == "Yes" ? 1.25 : 1)
```

### Annual from Monthly
```javascript
{{pricingRule.monthly-base}} * 12 * 0.9
```

### Progressive Tier
```javascript
{{value}} < 1000 ? {{value}} * 0.1 : {{value}} < 5000 ? {{value}} * 0.08 : {{value}} * 0.05
```

### Combined Factors
```javascript
({{base}} + ({{units}} * {{perUnit}})) * {{complexity}}
```

### Rounded Hundred
```javascript
Math.round({{price}} / 100) * 100
```

### Percentage with Min
```javascript
Math.max({{revenue}} * 0.015, 1000)
```

### Multi-State Premium
```javascript
{{basePrice}} + ({{stateCount}} - 1) * {{additionalStatePrice}}
```

### Employee Tiers
```javascript
{{employees}} <= 10 ? 500 : {{employees}} <= 50 ? 1000 : 2000
```

## Rule Evaluation Order

1. **Simple rules** (fixed price)
2. **Per-unit rules** (price × quantity)
3. **Formula rules** (expressions evaluated)

**Why:** Formula rules may reference other rules via `{{pricingRule.xxx}}`

**Important:** Ensure base prices calculated before formula rules that reference them

## Quick Start Checklist

For your first formula:

1. [ ] Add 5 new fields to "Pricing Variables" table
2. [ ] Create or edit a pricing rule
3. [ ] Set `Calculation Method = formula`
4. [ ] Write formula in `Formula Expression`
5. [ ] Set `Minimum Value` if needed
6. [ ] Configure trigger conditions
7. [ ] Set billing frequency
8. [ ] Save and test in browser
9. [ ] Open console (F12) to see logs
10. [ ] Verify calculation with test data
11. [ ] Check multiple scenarios
12. [ ] Deploy when verified

## Support

**Full Documentation:** See `FORMULA_PRICING_GUIDE.md`

**Console Debugging:** Press F12 → Console tab

**Test Formula:** Fill form and watch console logs

**Common Patterns:** See "Formula Examples by Use Case" above

**Questions:** Check browser console for specific error messages

---

**Quick Tip:** Start with `{{fieldName}} * {{otherField}}` and add complexity once basics work!
