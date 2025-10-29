import { FormData, PricingConfig } from '../types/quote';

/**
 * FormulaEvaluator - Evaluates formula-based pricing expressions
 *
 * Supports:
 * - Variable substitution from form data: {{fieldName}}
 * - References to calculated pricing rules: {{pricingRule.rule-id}}
 * - Special calculated values: {{monthlyBookkeepingRate}}
 * - Mathematical expressions with operators: +, -, *, /, (), ternary operators
 * - Min/max constraints
 */
export class FormulaEvaluator {
  private formData: FormData;
  private calculatedPrices: Map<string, number>;

  constructor(formData: FormData, calculatedPrices: Map<string, number>) {
    this.formData = formData;
    this.calculatedPrices = calculatedPrices;
  }

  /**
   * Evaluate a formula expression and return the calculated value
   */
  evaluateFormula(rule: PricingConfig): number {
    console.log('===========================================');
    console.log('🔍 FORMULA EVALUATION START');
    console.log('===========================================');
    console.log('Rule ID:', rule.pricingRuleId);
    console.log('Formula:', rule.formulaExpression);
    console.log('Minimum Value:', rule.minimumValue);
    console.log('Maximum Value:', rule.maximumValue);

    if (!rule.formulaExpression) {
      console.warn(`Rule ${rule.pricingRuleId} has no formula expression`);
      return 0;
    }

    try {

      // Step 1: Parse the formula expression
      let expression = rule.formulaExpression;

      // Step 2: Extract and resolve all {{variable}} placeholders
      const variables = this.extractVariables(expression);
      console.log('📋 Variables to resolve:', variables);

      for (const variable of variables) {
        const value = this.resolveVariable(variable);
        console.log(`  Variable: {{${variable}}} = ${value}`);
        expression = expression.replace(
          new RegExp(`\\{\\{${this.escapeRegex(variable)}\\}\\}`, 'g'),
          String(value)
        );
      }

      console.log('✏️  Expression after substitution:', expression);

      // Step 3: Safely evaluate the expression
      const result = this.safeEval(expression);
      console.log('🧮 Calculated result:', result);

      // Step 4: Apply min/max constraints
      let finalValue = result;
      if (rule.minimumValue !== undefined && finalValue < rule.minimumValue) {
        finalValue = rule.minimumValue;
        console.log(`⬆️  Applied minimum: Math.max(${result}, ${rule.minimumValue}) = ${finalValue}`);
      }
      if (rule.maximumValue !== undefined && finalValue > rule.maximumValue) {
        finalValue = rule.maximumValue;
        console.log(`⬇️  Applied maximum: Math.min(${result}, ${rule.maximumValue}) = ${finalValue}`);
      }

      console.log('✅ Final result:', finalValue);
      console.log('===========================================');
      console.log('');

      return Math.round(finalValue * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error(`Formula evaluation error for rule ${rule.pricingRuleId}:`, error);
      console.error('Formula expression:', rule.formulaExpression);
      return 0;
    }
  }

  /**
   * Extract all {{variable}} placeholders from the formula expression
   */
  private extractVariables(expression: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(expression)) !== null) {
      matches.push(match[1].trim());
    }
    // Remove duplicates
    return [...new Set(matches)];
  }

  /**
   * Resolve a variable to its numeric value
   * Supports:
   * - Direct form fields: {{fieldName}}
   * - Nested form fields: {{bookkeeping.monthsBehind}}
   * - Pricing rule references: {{pricingRule.rule-id}}
   * - Special calculated values: {{monthlyBookkeepingRate}}
   */
  private resolveVariable(variable: string): number {
    // Check if it's a reference to another pricing rule
    // Format: "pricingRule.rule-id"
    if (variable.startsWith('pricingRule.')) {
      const ruleId = variable.split('.')[1];
      const calculatedPrice = this.calculatedPrices.get(ruleId);

      if (calculatedPrice !== undefined) {
        console.log(`    ✓ Resolved from calculatedPrices: {{${variable}}} = ${calculatedPrice}`);
        return calculatedPrice;
      } else {
        console.warn(`  → Pricing rule "${ruleId}" not found in calculated prices`);
        return 0;
      }
    }

    // Special calculated values
    if (variable === 'monthlyBookkeepingRate') {
      console.log('    📞 Calling getMonthlyBookkeepingRate()...');
      const rate = this.getMonthlyBookkeepingRate();
      return rate;
    }

    // Check for nested form field values (e.g., "bookkeeping.monthsBehind")
    if (variable.includes('.')) {
      const value = this.getNestedValue(this.formData, variable);
      if (value !== undefined && value !== null) {
        const numValue = Number(value) || 0;
        console.log(`    ✓ Resolved from formData: {{${variable}}} = ${numValue}`);
        return numValue;
      }
    }

    // Check if it's a direct form field at the root level
    const directValue = (this.formData as any)[variable];
    if (directValue !== undefined && directValue !== null) {
      const numValue = Number(directValue) || 0;
      console.log(`    ✓ Resolved from formData: {{${variable}}} = ${numValue}`);
      return numValue;
    }

    console.warn(`    ⚠️  Variable "{{${variable}}}" not found, defaulting to 0`);
    console.warn(`Variable "${variable}" not found in form data or calculated prices, defaulting to 0`);
    return 0;
  }

  /**
   * Get nested object value using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    if (!path) return undefined;

    return path.split('.').reduce((current, key) => {
      if (current === null || current === undefined) {
        return undefined;
      }
      return current[key];
    }, obj);
  }

  /**
   * Calculate the monthly bookkeeping rate from triggered pricing rules
   * This looks for active bookkeeping tier rules and returns the matched rate
   */
  private getMonthlyBookkeepingRate(): number {
    console.log('-------------------------------------------');
    console.log('🔍 Searching for monthly bookkeeping rate...');
    console.log('📊 calculatedPrices Map contents:');
    Array.from(this.calculatedPrices.entries()).forEach(([id, price]) => {
      console.log(`    ${id}: $${price}`);
    });

    // Find the triggered monthly bookkeeping tier rate from calculatedPrices
    // Look for bookkeeping rules that contain "transactions" or "tier" in the ID
    const bookkeepingRules = Array.from(this.calculatedPrices.entries())
      .filter(([id, price]) => {
        const match = id.includes('bookkeeping') &&
                      (id.includes('transactions') || id.includes('tier')) &&
                      price > 0;
        console.log(`  Checking ${id}: ${match ? '✅ MATCH' : '❌ no match'} (price: $${price})`);
        return match;
      });

    if (bookkeepingRules.length > 0) {
      // Return the first matched rate (highest priority)
      console.log(`✅ Found monthly rate: $${bookkeepingRules[0][1]}`);
      console.log('-------------------------------------------');
      return bookkeepingRules[0][1];
    }

    // Default to lowest tier if nothing found (fallback)
    console.warn('⚠️  No monthly bookkeeping rate found! Using default: $105');
    console.log('-------------------------------------------');
    return 105;
  }

  /**
   * Safely evaluate a mathematical expression
   * Uses Function constructor with strict whitelist for security
   */
  private safeEval(expression: string): number {
    try {
      // Security: Whitelist only mathematical operations and ternary operators
      // Allow: numbers, operators (+, -, *, /, %), parentheses, ternary (?:), comparison (>, <, >=, <=, ==, !=)
      const allowedPattern = /^[0-9+\-*\/\.\(\)\[\]\s?:><=&|!%]+$/;

      if (!allowedPattern.test(expression)) {
        throw new Error(`Invalid characters in expression: ${expression}`);
      }

      // Use Function constructor (safer than eval)
      // Allow Math object for functions like Math.max, Math.min, Math.floor, Math.ceil, Math.round
      const result = new Function(
        'Math',
        `"use strict"; return (${expression})`
      )(Math);

      // Ensure result is a valid number
      if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
        throw new Error(`Expression did not evaluate to a valid number: ${result}`);
      }

      return result;
    } catch (error) {
      console.error('Formula evaluation error:', error);
      console.error('Expression:', expression);
      throw error;
    }
  }

  /**
   * Escape special regex characters in a string
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
