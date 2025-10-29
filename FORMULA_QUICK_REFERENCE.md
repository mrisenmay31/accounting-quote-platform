# Formula Pricing - Quick Reference Card

## Variable Syntax

| Syntax | Example | Resolves To |
|--------|---------|-------------|
| `{{fieldName}}` | `{{quantity}}` | `formData.quantity` |
| `{{service.field}}` | `{{bookkeeping.monthsBehind}}` | `formData.bookkeeping.monthsBehind` |
| `{{pricingRule.rule-id}}` | `{{pricingRule.monthly-base}}` | Calculated price from another rule |
| Special | `{{monthlyBookkeepingRate}}` | Sum of monthly bookkeeping rules |

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
