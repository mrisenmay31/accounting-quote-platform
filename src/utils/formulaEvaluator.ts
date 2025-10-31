import { FormData, PricingConfig, ServiceConfig } from '../types/quote';

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
// Interface to store pricing rule metadata alongside calculated prices
interface CalculatedPriceMetadata {
  price: number;
  serviceId: string;
  pricingType: string;
  billingFrequency: string;
}

export class FormulaEvaluator {
  private formData: FormData;
  private calculatedPrices: Map<string, number>;
  private serviceConfigs: ServiceConfig[];
  private priceMetadata: Map<string, CalculatedPriceMetadata>;

  constructor(
    formData: FormData,
    calculatedPrices: Map<string, number>,
    serviceConfigs: ServiceConfig[] = [],
    priceMetadata: Map<string, CalculatedPriceMetadata> = new Map()
  ) {
    this.formData = formData;
    this.calculatedPrices = calculatedPrices || new Map<string, number>();
    this.serviceConfigs = serviceConfigs || [];
    this.priceMetadata = priceMetadata;
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

    // Check if it's a service-level total variable (SINGLE-ROW-PER-ENDPOINT)
    // Each ServiceConfig row represents ONE pricing endpoint
    for (const service of this.serviceConfigs) {
      if (service.totalVariableName === variable) {
        console.log(`    🎯 Matched service total variable: {{${variable}}}`);
        console.log(`       Service: ${service.title} (${service.serviceId})`);
        console.log(`       Billing Frequency: ${service.billingFrequency || 'N/A'}`);
        console.log(`       Display Name: ${service.displayNameQuote || service.title}`);

        const total = this.calculateServiceTotal(service);
        console.log(`    ✓ Resolved service total: {{${variable}}} = ${total}`);
        return total;
      }
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

    // Sum ALL bookkeeping service monthly fees
    let totalMonthlyRate = 0;

    Array.from(this.calculatedPrices.entries()).forEach(([id, price]) => {
      // Include ANY bookkeeping-related monthly fee (not just transactions)
      if (id.includes('bookkeeping') && price > 0) {
        console.log(`  ✅ Including ${id}: $${price}`);
        totalMonthlyRate += price;
      }
    });

    if (totalMonthlyRate > 0) {
      console.log(`✅ Total monthly bookkeeping rate: $${totalMonthlyRate}`);
      console.log('-------------------------------------------');
      return totalMonthlyRate;
    }

    console.warn('⚠️ No monthly bookkeeping charges found! Using default: $105');
    console.log('-------------------------------------------');
    return 105;
  }

  /**
   * Calculate service total using simplified single-row-per-endpoint approach
   *
   * Each ServiceConfig row represents ONE pricing endpoint.
   * This method sums all pricing rules where:
   * - serviceId matches the ServiceConfig.serviceId
   * - billingFrequency matches the ServiceConfig.billingFrequency (if specified)
   *
   * @param service - The service configuration (one row = one endpoint)
   * @returns Calculated total for this specific service + billing frequency combination
   */
  private calculateServiceTotal(service: ServiceConfig): number {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔢 CALCULATING SERVICE TOTAL (SINGLE-ROW-PER-ENDPOINT)');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Service ID:', service.serviceId);
    console.log('Billing Frequency Filter:', service.billingFrequency || 'ALL');
    console.log('Total Variable Name:', service.totalVariableName);

    let total = 0;
    let matchedRules = 0;

    console.log('\n📋 Evaluating calculatedPrices entries:');

    // Use priceMetadata if available for accurate filtering
    if (this.priceMetadata.size > 0) {
      Array.from(this.priceMetadata.entries()).forEach(([ruleId, metadata]) => {
        // Match by serviceId
        const serviceIdMatch = metadata.serviceId === service.serviceId;

        // Match by billingFrequency (if specified in service config)
        const billingFrequencyMatch = !service.billingFrequency || metadata.billingFrequency === service.billingFrequency;

        if (serviceIdMatch && billingFrequencyMatch) {
          console.log(`  Rule: ${ruleId}`);
          console.log(`    Service ID: ${metadata.serviceId}`);
          console.log(`    Pricing Type: ${metadata.pricingType}`);
          console.log(`    Billing Frequency: ${metadata.billingFrequency}`);
          console.log(`    Price: $${metadata.price}`);
          console.log(`    ✅ Included`);

          total += metadata.price;
          matchedRules++;
        }
      });
    } else {
      // Fallback: If no metadata available, use simple serviceId prefix matching
      console.log('⚠️  No metadata available, falling back to simple serviceId matching');
      Array.from(this.calculatedPrices.entries()).forEach(([ruleId, price]) => {
        if (ruleId.startsWith(service.serviceId)) {
          console.log(`  Rule: ${ruleId}, Price: $${price}`);
          console.log(`    ✅ Included (fallback mode - no billing frequency filtering)`);
          total += price;
          matchedRules++;
        }
      });
    }

    console.log(`\n📊 Total from ${matchedRules} matched rules: $${total}`);
    console.log(`✅ Final Service Total for ${service.totalVariableName}: $${total}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    return total;
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
