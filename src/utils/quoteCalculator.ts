import { FormData, QuoteData, ServiceQuote, HourlyService } from '../types/quote';
import { PricingConfig, getServicePricing } from './pricingService';
import { ServiceConfig, getServiceConfig } from './serviceConfigService';
import { FormulaEvaluator } from './formulaEvaluator';

// Helper function to safely get nested object values using dot notation
const getNestedValue = (obj: any, path: string): any => {
  if (!path) return undefined;
  
  const result = path.split('.').reduce((current, key) => {
    if (current === null || current === undefined) {
      return undefined;
    }
    return current[key];
  }, obj);

  return result;
};

/**
 * Evaluates conditional logic for pricing rules
 *
 * @param formData - Complete form data object
 * @param triggerField - Field name to check (supports dot notation for nested fields)
 * @param requiredValue - Value to compare against (empty string for isEmpty/isNotEmpty)
 * @param comparisonLogic - Comparison operator
 *
 * Supported Operators:
 *
 * TEXT OPERATORS:
 * - equals: Exact match (case-insensitive, trimmed)
 * - notEquals: Not equal (case-insensitive, trimmed)
 * - contains: Field contains value (case-insensitive)
 * - notContains: Field does not contain value (case-insensitive)
 *
 * NUMERIC OPERATORS:
 * - lessThan: Field < value (strips currency formatting)
 * - lessThanOrEqual: Field <= value
 * - greaterThan: Field > value
 * - greaterThanOrEqual: Field >= value
 *
 * EXISTENCE OPERATORS:
 * - isEmpty: Field is undefined, null, empty string, or empty array
 * - isNotEmpty: Field has a value
 *
 * @returns true if condition is met, false otherwise
 */
const evaluateCondition = (
  formData: FormData,
  triggerField: string,
  requiredValue: string,
  comparisonLogic: string
): boolean => {
  const fieldValue = getNestedValue(formData, triggerField);

  // Handle isEmpty check first (before value comparisons)
  if (comparisonLogic === 'isEmpty') {
    return fieldValue === undefined ||
           fieldValue === null ||
           fieldValue === '' ||
           (Array.isArray(fieldValue) && fieldValue.length === 0);
  }

  if (comparisonLogic === 'isNotEmpty') {
    return fieldValue !== undefined &&
           fieldValue !== null &&
           fieldValue !== '' &&
           !(Array.isArray(fieldValue) && fieldValue.length === 0);
  }

  // If field value is empty and not checking for empty, return false
  if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
    return false;
  }

  // Detect if we're working with numbers
  const isNumericComparison = ['lessThan', 'lessThanOrEqual', 'greaterThan', 'greaterThanOrEqual'].includes(comparisonLogic);

  let result = false;

  switch (comparisonLogic) {
    // TEXT OPERATORS (work on strings)
    case 'equals':
      result = String(fieldValue).toLowerCase().trim() === String(requiredValue).toLowerCase().trim();
      break;

    case 'notEquals':
      result = String(fieldValue).toLowerCase().trim() !== String(requiredValue).toLowerCase().trim();
      break;

    case 'contains':
      result = String(fieldValue).toLowerCase().includes(String(requiredValue).toLowerCase());
      break;

    case 'notContains':
      result = !String(fieldValue).toLowerCase().includes(String(requiredValue).toLowerCase());
      break;

    // NUMERIC OPERATORS (work on numbers)
    case 'lessThan':
      const ltValue = parseFloat(String(fieldValue).replace(/[^0-9.-]/g, ''));
      const ltRequired = parseFloat(String(requiredValue).replace(/[^0-9.-]/g, ''));
      result = !isNaN(ltValue) && !isNaN(ltRequired) && ltValue < ltRequired;
      break;

    case 'lessThanOrEqual':
      const lteValue = parseFloat(String(fieldValue).replace(/[^0-9.-]/g, ''));
      const lteRequired = parseFloat(String(requiredValue).replace(/[^0-9.-]/g, ''));
      result = !isNaN(lteValue) && !isNaN(lteRequired) && lteValue <= lteRequired;
      break;

    case 'greaterThan':
      const gtValue = parseFloat(String(fieldValue).replace(/[^0-9.-]/g, ''));
      const gtRequired = parseFloat(String(requiredValue).replace(/[^0-9.-]/g, ''));
      result = !isNaN(gtValue) && !isNaN(gtRequired) && gtValue > gtRequired;
      break;

    case 'greaterThanOrEqual':
      const gteValue = parseFloat(String(fieldValue).replace(/[^0-9.-]/g, ''));
      const gteRequired = parseFloat(String(requiredValue).replace(/[^0-9.-]/g, ''));
      result = !isNaN(gteValue) && !isNaN(gteRequired) && gteValue >= gteRequired;
      break;

    // LEGACY: includes (alias for contains - backward compatibility)
    case 'includes':
      result = String(fieldValue).toLowerCase().includes(String(requiredValue).toLowerCase());
      break;

    default:
      console.warn(`Unknown comparison logic: ${comparisonLogic}`);
      result = false;
  }

  return result;
};

// Helper function to calculate price for a pricing rule
const calculateRulePrice = (
  rule: PricingConfig,
  formData: FormData,
  hasAdvisoryService: boolean,
  calculatedPrices: Map<string, number>,
  serviceConfig: ServiceConfig[] = [],
  priceMetadata: Map<string, { price: number; serviceId: string; pricingType: string; billingFrequency: string }> = new Map()
): number => {
  let price = 0;

  // Determine calculation method (default to 'simple' for backward compatibility)
  const method = rule.calculationMethod || (rule.perUnitPricing ? 'per-unit' : 'simple');

  console.log(`Calculating price for ${rule.pricingRuleId} using method: ${method}`);

  switch (method) {
    case 'formula':
      // Use FormulaEvaluator for formula-based pricing
      const evaluator = new FormulaEvaluator(formData, calculatedPrices, serviceConfig, priceMetadata);
      price = evaluator.evaluateFormula(rule);
      break;

    case 'per-unit':
      // Per-unit pricing (quantity × unit price)
      if (rule.quantitySourceField && rule.unitPrice) {
        const quantity = getNestedValue(formData, rule.quantitySourceField);
        let adjustedQuantity = Number(quantity) || 0;

        // Special handling for additional owners fee - entity-type-specific thresholds
        if (rule.pricingRuleId?.startsWith('business-tax-additional-owners') &&
            rule.quantitySourceField === 'businessTax.numberOfOwners') {

          // Determine threshold based on entity type
          let threshold = 0;

          if (rule.pricingRuleId === 'business-tax-additional-owners-partnership' ||
              rule.pricingRuleId === 'business-tax-additional-owners-llc') {
            threshold = 2; // Partnership and LLC: charge for owners beyond 2
          } else if (rule.pricingRuleId === 'business-tax-additional-owners-scorp' ||
                     rule.pricingRuleId === 'business-tax-additional-owners-ccorp') {
            threshold = 1; // S-Corp and C-Corp: charge for owners beyond 1
          } else if (rule.pricingRuleId === 'business-tax-additional-owners') {
            // Legacy rule (if still active) - use threshold of 2
            threshold = 2;
          }

          adjustedQuantity = Math.max(0, adjustedQuantity - threshold);
        }

        price = adjustedQuantity * rule.unitPrice;
      } else {
        // Fallback to base price if per-unit fields are missing
        price = rule.basePrice;
      }
      break;

    case 'simple':
    default:
      // Simple base price
      price = rule.basePrice;
      break;
  }

  // Diagnostic logging for Advisory Services discount
  if (hasAdvisoryService) {
    console.log('=== ADVISORY DISCOUNT DEBUG ===');
    console.log('Rule ID:', rule.pricingRuleId);
    console.log('Service Name:', rule.serviceName);
    console.log('Original Price:', price);
    console.log('Advisory Discount Eligible:', rule.advisoryDiscountEligible);
    console.log('Advisory Discount Percentage:', rule.advisoryDiscountPercentage);
  }

  // Apply advisory discount if applicable (ONLY for non-formula methods)
  // Formula methods should handle discounts within their expressions
  if (method !== 'formula' && hasAdvisoryService && rule.advisoryDiscountEligible && rule.advisoryDiscountPercentage > 0) {
    price = price * (1 - rule.advisoryDiscountPercentage);
    console.log('Discounted Price:', price);
  }

  if (hasAdvisoryService) {
    console.log('Final Price:', price);
    console.log('================================');
  }

  return Math.round(price * 100) / 100; // Round to 2 decimal places
};

// Helper function to sort pricing rules by dependency
// Formula rules should be processed AFTER the rules they reference
const sortRulesByDependency = (rules: PricingConfig[]): PricingConfig[] => {
  const formulaRules = rules.filter(r => r.calculationMethod === 'formula');
  const otherRules = rules.filter(r => r.calculationMethod !== 'formula');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RULE PROCESSING ORDER');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Rules to process FIRST (non-formula):');
  otherRules.forEach((rule, i) => {
    console.log(`  ${i + 1}. ${rule.pricingRuleId} (method: ${rule.calculationMethod || 'simple'})`);
  });
  console.log('');
  console.log('Rules to process LAST (formula):');
  formulaRules.forEach((rule, i) => {
    console.log(`  ${i + 1}. ${rule.pricingRuleId} (method: formula)`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Process non-formula rules first, then formula rules
  // This ensures all base prices are calculated before formulas that reference them
  return [...otherRules, ...formulaRules];
};

export const calculateQuote = (formData: FormData, pricingConfig: PricingConfig[] = [], serviceConfig: ServiceConfig[] = []): QuoteData => {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║         QUOTE CALCULATION STARTED                    ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('Form Data Keys:', Object.keys(formData));
  console.log('Total Pricing Rules:', pricingConfig.length);
  console.log('');

  let totalMonthlyFees = 0;
  let totalOneTimeFees = 0;
  let totalAnnual = 0;
  let complexity: 'low' | 'medium' | 'high' | 'very-high' = 'low';
  const recommendations: string[] = [];

  // Check if advisory service is selected
  const hasAdvisoryService = formData.services.includes('advisory');

  // Create a Map to store calculated prices for formula references
  const calculatedPrices = new Map<string, number>();

  // Create a Map to store pricing rule metadata (for service total calculations)
  const priceMetadata = new Map<string, { price: number; serviceId: string; pricingType: string; billingFrequency: string }>();

  // Debug logging
  console.log('=== QUOTE CALCULATION DEBUG ===');
  console.log('Selected services:', formData.services);
  console.log('Has advisory service:', hasAdvisoryService);
  console.log('Pricing config length:', pricingConfig.length);
  console.log('Pricing config:', pricingConfig);

  // If no pricing config is available, fall back to original logic
  if (pricingConfig.length === 0) {
    console.log('No pricing config available, using defaults');
    return calculateQuoteWithDefaults(formData, serviceConfig);
  }

  // Sort rules to ensure base pricing rules are calculated before formulas that reference them
  const sortedRules = sortRulesByDependency(pricingConfig);
  console.log('Rules sorted by dependency. Formula rules will be processed last.');

  // Group pricing rules by service for better organization
  const serviceGroups: { [key: string]: { rules: PricingConfig[], totalMonthlyFees: number, totalOneTimeFees: number } } = {};
  const hourlyServices: HourlyService[] = [];

  // Process each pricing rule
  for (const rule of sortedRules) {
    console.log(`\n--- Processing rule: ${rule.pricingRuleId} ---`);
    console.log('Rule details:', {
      pricingRuleId: rule.pricingRuleId,
      serviceName: rule.serviceName,
      pricingType: rule.pricingType,
      billingFrequency: rule.billingFrequency,
      basePrice: rule.basePrice,
      active: rule.active
    });

    if (!rule.active) continue;

    // Check if this rule applies based on conditions
    let ruleApplies = false;

    // Special handling for additional services - check specializedFilings
    if (rule.serviceId === 'additional-services' && rule.pricingType === 'Add-on') {
      const specializedFilings = formData.additionalServices?.specializedFilings || [];
      ruleApplies = specializedFilings.includes(rule.serviceName);

      // If this is an hourly service, add to hourlyServices array instead of totals
      if (ruleApplies && rule.perUnitPricing && rule.unitPrice && rule.unitName) {
        hourlyServices.push({
          name: rule.serviceName,
          rate: rule.unitPrice,
          unitName: rule.unitName,
          billingFrequency: rule.billingFrequency
        });
        continue; // Skip normal processing for hourly services
      }
    }
    // For all other rules, check trigger conditions
    else if (rule.triggerFormField && rule.requiredFormValue && rule.comparisonLogic) {
      ruleApplies = evaluateCondition(
        formData,
        rule.triggerFormField,
        rule.requiredFormValue,
        rule.comparisonLogic
      );

      // Enhanced debugging for bookkeeping cleanup rule
      if (rule.pricingRuleId === 'bookkeeping-cleanup') {
        console.log('=== BOOKKEEPING CLEANUP RULE DEBUG ===');
        console.log('Trigger Field:', rule.triggerFormField);
        console.log('Required Value:', rule.requiredFormValue);
        console.log('Comparison Logic:', rule.comparisonLogic);
        console.log('Form Data Value:', getNestedValue(formData, rule.triggerFormField));
        console.log('Rule Applies:', ruleApplies);
        console.log('Per-Unit Pricing:', rule.perUnitPricing);
        console.log('Unit Price:', rule.unitPrice);
        console.log('Quantity Source Field:', rule.quantitySourceField);
        console.log('Months Behind:', getNestedValue(formData, rule.quantitySourceField || ''));
        console.log('======================================');
      }
    }
    // Base service rules without conditions apply by default
    else if (rule.pricingType === 'Base Service') {
      ruleApplies = true;
    }

    if (!ruleApplies) continue;

    // CRITICAL CHECK: Verify the service is actually selected by the user
    // This prevents rules from being applied for services that weren't chosen
    if (!formData.services.includes(rule.serviceId)) {
      console.log(`Skipping rule ${rule.pricingRuleId} - service ${rule.serviceId} not selected`);
      continue;
    }

    // DEFENSIVE CHECK: For entity-specific additional owner rules,
    // verify entity type matches before applying the rule
    if (rule.pricingRuleId?.startsWith('business-tax-additional-owners-')) {
      const currentEntityType = formData.businessTax?.entityType?.trim();
      let shouldApply = false;

      if (rule.pricingRuleId === 'business-tax-additional-owners-partnership') {
        shouldApply = currentEntityType === 'Partnership';
      } else if (rule.pricingRuleId === 'business-tax-additional-owners-llc') {
        shouldApply = currentEntityType === 'LLC';
      } else if (rule.pricingRuleId === 'business-tax-additional-owners-scorp') {
        shouldApply = currentEntityType === 'S-Corporation';
      } else if (rule.pricingRuleId === 'business-tax-additional-owners-ccorp') {
        shouldApply = currentEntityType === 'C-Corporation';
      }

      if (!shouldApply) {
        continue;
      }
    }

    // Calculate price for this rule
    const rulePrice = calculateRulePrice(rule, formData, hasAdvisoryService, calculatedPrices, serviceConfig, priceMetadata);

    // Store calculated price for this rule (formula evaluator needs access to all entries)
    calculatedPrices.set(rule.pricingRuleId, rulePrice);

    // Store metadata for service total calculations
    priceMetadata.set(rule.pricingRuleId, {
      price: rulePrice,
      serviceId: rule.serviceId,
      pricingType: rule.pricingType,
      billingFrequency: rule.billingFrequency
    });

    if (rulePrice > 0) {
      console.log(`💰 ${rule.pricingRuleId}: $${rulePrice} (method: ${rule.calculationMethod || 'simple'})`);
    }

    if (rulePrice <= 0) continue;

    // Initialize service group if it doesn't exist
    if (!serviceGroups[rule.serviceId]) {
      serviceGroups[rule.serviceId] = {
        rules: [],
        totalMonthlyFees: 0,
        totalOneTimeFees: 0
      };
    }

    serviceGroups[rule.serviceId].rules.push(rule);

    // Add to appropriate totals based on billing frequency
    if (rule.billingFrequency === 'Monthly') {
      serviceGroups[rule.serviceId].totalMonthlyFees += rulePrice;
      totalMonthlyFees += rulePrice;
    } else if (rule.billingFrequency === 'One-Time Fee') {
      serviceGroups[rule.serviceId].totalOneTimeFees += rulePrice;
      totalOneTimeFees += rulePrice;

      // Enhanced debugging for bookkeeping cleanup fee
      if (rule.pricingRuleId === 'bookkeeping-cleanup') {
        console.log('=== BOOKKEEPING CLEANUP FEE ADDED ===');
        console.log('Cleanup Fee Amount:', rulePrice);
        console.log('Added to One-Time Fees');
        console.log('Total One-Time Fees Now:', totalOneTimeFees);
        console.log('====================================');
      }
    } else if (rule.billingFrequency === 'Annual') {
      serviceGroups[rule.serviceId].totalOneTimeFees += rulePrice;
      totalOneTimeFees += rulePrice;
    }
  }
  
  // Debug service groups totals
  console.log('\n=== SERVICE GROUPS TOTALS ===');
  for (const [serviceId, group] of Object.entries(serviceGroups)) {
    console.log(`${serviceId}:`, {
      totalMonthlyFees: group.totalMonthlyFees,
      totalOneTimeFees: group.totalOneTimeFees,
      rulesCount: group.rules.length
    });
  }

  // Apply minimum fee enforcement for bookkeeping service
  if (formData.services.includes('bookkeeping') && serviceGroups['bookkeeping']) {
    const bookkeepingGroup = serviceGroups['bookkeeping'];

    // Find the minimum fee rule (from Airtable or defaults)
    const minimumFeeRule = pricingConfig.find(r =>
      r.serviceId === 'bookkeeping' &&
      r.pricingRuleId === 'bookkeeping-minimum-fee' &&
      r.active
    );

    if (minimumFeeRule) {
      // Separate the base fee components from add-ons like service frequency and inventory
      const baseFeeRuleIds = [
        'bookkeeping-transaction-fee',
        'bookkeeping-bank-account',
        'bookkeeping-credit-card',
        'bookkeeping-business-loan',
        'bookkeeping-fixed-assets'
      ];

      // Calculate just the base fee components (the 5 unit-based pricing rules)
      let calculatedBaseFee = 0;
      let addOnFees = 0;

      for (const rule of bookkeepingGroup.rules) {
        const rulePrice = calculateRulePrice(rule, formData, hasAdvisoryService, calculatedPrices, serviceConfig, priceMetadata);

        if (baseFeeRuleIds.includes(rule.pricingRuleId) && rule.billingFrequency === 'Monthly') {
          calculatedBaseFee += rulePrice;
        } else if (rule.billingFrequency === 'Monthly' && rule.pricingRuleId !== 'bookkeeping-minimum-fee') {
          addOnFees += rulePrice;
        }
      }

      // Calculate the minimum fee with advisory discount applied if applicable
      let minimumFee = minimumFeeRule.basePrice;

      if (hasAdvisoryService && minimumFeeRule.advisoryDiscountEligible && minimumFeeRule.advisoryDiscountPercentage > 0) {
        minimumFee = minimumFee * (1 - minimumFeeRule.advisoryDiscountPercentage);
      }

      console.log('\n=== BOOKKEEPING FEE CALCULATION ===');
      console.log('Calculated base fee (5 components):', calculatedBaseFee);
      console.log('Add-on fees (service frequency, inventory, etc.):', addOnFees);
      console.log('Has advisory service:', hasAdvisoryService);
      console.log('Minimum fee base price:', minimumFeeRule.basePrice);
      console.log('Advisory discount applied:', hasAdvisoryService && minimumFeeRule.advisoryDiscountEligible);
      console.log('Minimum fee after discount:', minimumFee);

      // Determine the bookkeeping base monthly fee: use the higher of calculated or minimum
      const finalBaseFee = Math.max(calculatedBaseFee, minimumFee);
      const originalBookkeepingTotal = bookkeepingGroup.totalMonthlyFees;
      const newBookkeepingTotal = finalBaseFee + addOnFees;

      console.log('Final base fee (max of calculated vs minimum):', finalBaseFee);
      console.log('Total monthly bookkeeping fee (base + add-ons):', newBookkeepingTotal);

      // Adjust totalMonthlyFees by the difference
      const adjustmentNeeded = newBookkeepingTotal - originalBookkeepingTotal;
      bookkeepingGroup.totalMonthlyFees = newBookkeepingTotal;
      totalMonthlyFees += adjustmentNeeded;

      console.log('Adjustment to total monthly fees:', adjustmentNeeded);
      console.log('Final bookkeeping monthly fee:', bookkeepingGroup.totalMonthlyFees);
      console.log('=====================================');
    }
  }

  // Convert service groups to ServiceQuote objects in the correct order
  // Use serviceConfig order as the base, then apply conditional reordering
  const services: ServiceQuote[] = [];

  // Process services in serviceConfig order (already sorted by serviceOrder)
  for (const serviceConfigItem of serviceConfig) {
    const serviceId = serviceConfigItem.serviceId;
    const group = serviceGroups[serviceId];

    // SKIP ADDITIONAL SERVICES - they are displayed in a separate section
    // Additional services are not shown as an aggregated card in Service Breakdown
    // Instead, they appear individually in the "Selected Additional Services" section
    if (serviceId === 'additional-services') {
      console.log('Skipping additional-services from service cards - shown in dedicated section');
      continue;
    }

    if (!group || group.rules.length === 0) continue;
    
    // Get the service configuration from Airtable
    const serviceConfigData = serviceConfigItem;
    
    // Get the main service name and description from service config or fallback
    const baseRule = group.rules.find(r => r.pricingType === 'Base Service') || group.rules[0];
    
    // Determine included features from pricing rules
    const includedFeatures: string[] = group.rules
      .filter(r => r.pricingType === 'Base Service' || (r.pricingType === 'Add-on' && calculateRulePrice(r, formData, hasAdvisoryService, calculatedPrices, serviceConfig, priceMetadata) > 0))
      .map(r => r.serviceName);
    
    // Generate pricing factors for individual tax service
    let pricingFactors: string[] = [];
    if (serviceId === 'individual-tax' && formData.individualTax) {
      if (formData.individualTax.filingStatus) {
        pricingFactors.push(formData.individualTax.filingStatus);
      }
      if (formData.individualTax.deductionType) {
        pricingFactors.push(formData.individualTax.deductionType);
      }
      if (formData.individualTax.incomeTypes && formData.individualTax.incomeTypes.length > 0) {
        pricingFactors.push(`${formData.individualTax.incomeTypes.length} Income Sources`);
      }
      if (formData.individualTax.additionalStateCount && formData.individualTax.additionalStateCount > 0) {
        pricingFactors.push(`${formData.individualTax.additionalStateCount} Additional States`);
      }
      if (formData.individualTax.k1Count && formData.individualTax.k1Count > 0) {
        pricingFactors.push(`${formData.individualTax.k1Count} K-1 Forms`);
      }
      if (formData.individualTax.rentalPropertyCount && formData.individualTax.rentalPropertyCount > 0) {
        pricingFactors.push(`${formData.individualTax.rentalPropertyCount} Rental Properties`);
      }
    }
    
    const serviceQuote: ServiceQuote = {
      name: serviceConfigData?.title || getServiceDisplayName(serviceId),
      description: serviceConfigData?.description || baseRule.description || getServiceDescription(serviceId),
      monthlyFee: Math.round(group.totalMonthlyFees),
      oneTimeFee: Math.round(group.totalOneTimeFees),
      annualPrice: Math.round(group.totalMonthlyFees * 12 + group.totalOneTimeFees),
      included: includedFeatures,
      addOns: group.rules
        .filter(r => r.pricingType === 'Add-on' && calculateRulePrice(r, formData, hasAdvisoryService, calculatedPrices, serviceConfig, priceMetadata) === 0)
        .map(r => `${r.serviceName} (+$${r.basePrice || r.unitPrice})`),
      pricingFactors: pricingFactors.length > 0 ? pricingFactors : undefined
    };
    
    services.push(serviceQuote);
  }
  
  // Apply conditional reordering: If Advisory Services is not selected,
  // move Individual Tax Preparation to the front
  if (!hasAdvisoryService) {
    const individualTaxIndex = services.findIndex(service => 
      service.name.toLowerCase().includes('individual tax')
    );
    
    if (individualTaxIndex > 0) {
      // Remove Individual Tax service from its current position
      const individualTaxService = services.splice(individualTaxIndex, 1)[0];
      // Insert it at the beginning
      services.unshift(individualTaxService);
    }
  }
  

  // Determine complexity based on business details
  const getComplexityScore = (): number => {
    let score = 0;
    
    // Revenue impact from business tax or bookkeeping details
    const businessRevenue = formData.businessTax?.annualRevenue || formData.bookkeeping?.annualRevenue || '';
    if (businessRevenue.includes('Over $5,000,000')) score += 4;
    else if (businessRevenue.includes('$1,000,000 - $5,000,000')) score += 3;
    else if (businessRevenue.includes('$500,000 - $1,000,000')) score += 2;
    else if (businessRevenue.includes('$250,000 - $500,000')) score += 1;
    
    // Business type impact from business tax or bookkeeping details
    const businessType = formData.businessTax?.businessType || formData.bookkeeping?.businessType || '';
    if (businessType === 'C-Corporation') score += 2;
    else if (businessType === 'S-Corporation') score += 1;
    else if (businessType === 'Partnership') score += 1;
    
    // Employee count impact from business tax or bookkeeping details
    const numberOfEmployees = formData.businessTax?.numberOfEmployees || formData.bookkeeping?.numberOfEmployees || '';
    if (numberOfEmployees.includes('Over 100')) score += 3;
    else if (numberOfEmployees.includes('51-100')) score += 2;
    else if (numberOfEmployees.includes('26-50')) score += 1;
    
    // Additional complexity factors from service-specific details
    if (formData.businessTax?.otherSituations?.includes('Multi-state operations')) score += 1;
    if (formData.businessTax?.otherSituations?.includes('International transactions')) score += 2;
    if (formData.individualTax?.additionalConsiderations?.includes('Income from multiple states')) score += 1;
    
    return score;
  };

  const complexityScore = getComplexityScore();
  
  if (complexityScore >= 8) complexity = 'very-high';
  else if (complexityScore >= 5) complexity = 'high';
  else if (complexityScore >= 2) complexity = 'medium';
  else complexity = 'low';


  // Generate recommendations based on selections and business profile
  if (!hasAdvisoryService && complexityScore >= 3) {
    recommendations.push('Consider adding Advisory Services for strategic guidance as your business grows');
  }
  
  if (formData.services.includes('bookkeeping') && !formData.services.includes('business-tax')) {
    recommendations.push('Bundle with Business Tax Services for 15% savings on tax preparation');
  }
  
  if (hasAdvisoryService) {
    recommendations.push('Advisory services provide the highest ROI for your business growth');
  }
  
  if (formData.bookkeeping?.additionalConsiderations?.includes('QuickBooks setup or training')) {
    recommendations.push('QuickBooks setup and training included at no additional cost');
  }

  // Calculate potential savings
  const potentialSavings = Math.round((totalMonthlyFees * 12 + totalOneTimeFees) * 0.3); // Estimate 30% savings from tax optimization

  const finalTotalAnnual = totalMonthlyFees * 12 + totalOneTimeFees;

  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║         QUOTE CALCULATION COMPLETE                   ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('Total rules triggered:', calculatedPrices.size);
  console.log('');

  return {
    services,
    hourlyServices,
    totalMonthlyFees: Math.round(totalMonthlyFees),
    totalOneTimeFees: Math.round(totalOneTimeFees),
    totalAnnual: Math.round(finalTotalAnnual),
    potentialSavings,
    recommendations,
    complexity
  };
};

// Helper functions for service display
const getServiceDisplayName = (serviceId: string): string => {
  const names: { [key: string]: string } = {
    'advisory': 'Advisory Services',
    'individual-tax': 'Individual Tax Preparation',
    'business-tax': 'Business Tax Services',
    'bookkeeping': 'Bookkeeping Services',
    'additional-services': 'Additional Services'
  };
  return names[serviceId] || serviceId;
};

const getServiceDescription = (serviceId: string): string => {
  const descriptions: { [key: string]: string } = {
    'advisory': 'Strategic financial guidance and business consulting',
    'individual-tax': 'Comprehensive personal tax preparation and planning',
    'business-tax': 'Complete business tax preparation and compliance',
    'bookkeeping': 'Professional monthly bookkeeping and financial reporting',
    'additional-services': 'Professional consultations and specialized filings'
  };
  return descriptions[serviceId] || '';
};

// Fallback function with original hardcoded logic
const calculateQuoteWithDefaults = (formData: FormData, serviceConfig: ServiceConfig[] = []): QuoteData => {
  const services: ServiceQuote[] = [];
  let totalMonthlyFees = 0;
  let totalOneTimeFees = 0;
  let complexity: 'low' | 'medium' | 'high' | 'very-high' = 'low';
  const recommendations: string[] = [];

  // Determine complexity based on business details
  const getComplexityScore = (): number => {
    let score = 0;
    
    // Revenue impact from business tax or bookkeeping details
    const businessRevenue = formData.businessTax?.annualRevenue || formData.bookkeeping?.annualRevenue || '';
    if (businessRevenue.includes('Over $5,000,000')) score += 4;
    else if (businessRevenue.includes('$1,000,000 - $5,000,000')) score += 3;
    else if (businessRevenue.includes('$500,000 - $1,000,000')) score += 2;
    else if (businessRevenue.includes('$250,000 - $500,000')) score += 1;
    
    // Business type impact from business tax or bookkeeping details
    const businessType = formData.businessTax?.businessType || formData.bookkeeping?.businessType || '';
    if (businessType === 'C-Corporation') score += 2;
    else if (businessType === 'S-Corporation') score += 1;
    else if (businessType === 'Partnership') score += 1;
    
    // Employee count impact from business tax or bookkeeping details
    const numberOfEmployees = formData.businessTax?.numberOfEmployees || formData.bookkeeping?.numberOfEmployees || '';
    if (numberOfEmployees.includes('Over 100')) score += 3;
    else if (numberOfEmployees.includes('51-100')) score += 2;
    else if (numberOfEmployees.includes('26-50')) score += 1;
    
    // Additional complexity factors from service-specific details
    if (formData.businessTax?.otherSituations?.includes('Multi-state operations')) score += 1;
    if (formData.businessTax?.otherSituations?.includes('International transactions')) score += 2;
    if (formData.individualTax?.additionalConsiderations?.includes('Income from multiple states')) score += 1;
    
    return score;
  };

  const complexityScore = getComplexityScore();
  
  if (complexityScore >= 8) complexity = 'very-high';
  else if (complexityScore >= 5) complexity = 'high';
  else if (complexityScore >= 2) complexity = 'medium';
  else complexity = 'low';

  // Calculate pricing multipliers based on complexity
  const getMultiplier = (): number => {
    switch (complexity) {
      case 'very-high': return 2.0;
      case 'high': return 1.5;
      case 'medium': return 1.2;
      default: return 1.0;
    }
  };

  const multiplier = getMultiplier();

  // Advisory Services (prioritized)
  if (formData.services.includes('advisory')) {
    const basePrice = 2500;
    const advisoryPrice = Math.round(basePrice * multiplier);
    
    const advisoryService: ServiceQuote = {
      name: 'Advisory Services',
      description: 'Strategic financial guidance and business consulting',
      monthlyFee: advisoryPrice,
      oneTimeFee: 0,
      annualPrice: advisoryPrice * 12,
      included: [
        'Monthly financial review and analysis',
        'Strategic planning sessions',
        'Cash flow forecasting',
        'KPI dashboard and reporting',
        'Quarterly business reviews',
        'Tax planning and optimization',
        'Direct access to senior advisors'
      ],
      addOns: [
        'Weekly check-ins (+$500/mo)',
        'Custom financial modeling (+$750/mo)',
        'Board presentation support (+$300/mo)',
        'M&A advisory (+$1,500/mo)'
      ]
    };
    
    services.push(advisoryService);
    totalMonthlyFees += advisoryPrice;
    
    recommendations.push('Advisory services will provide the highest ROI for your business growth');
  }

  // Individual Tax Preparation
  if (formData.services.includes('individual-tax')) {
    const basePrice = 150;
    let taxPrice = basePrice;
    
    // Adjust based on complexity
    if (formData.taxComplexity?.includes('Very Complex')) taxPrice = 500;
    else if (formData.taxComplexity?.includes('Complex')) taxPrice = 350;
    else if (formData.taxComplexity?.includes('Moderate')) taxPrice = 250;
    
    const individualTaxService: ServiceQuote = {
      name: 'Individual Tax Preparation',
      description: 'Comprehensive personal tax preparation and planning',
      monthlyFee: 0,
      oneTimeFee: taxPrice,
      annualPrice: taxPrice,
      included: [
        'Federal and state tax return preparation',
        'Tax planning consultation',
        'Quarterly estimated tax calculations',
        'Audit support and representation',
        'Prior year amendments if needed',
        'Tax document organization'
      ],
      addOns: [
        'Multi-state returns (+$150 each)',
        'Rental property schedules (+$200 each)',
        'Business schedule preparation (+$300)',
        'Investment portfolio analysis (+$250)'
      ]
    };
    
    services.push(individualTaxService);
    totalOneTimeFees += taxPrice;
  }

  // Business Tax Services
  if (formData.services.includes('business-tax')) {
    const basePrice = 800;
    const businessTaxPrice = Math.round(basePrice * multiplier);
    
    const businessTaxService: ServiceQuote = {
      name: 'Business Tax Services',
      description: 'Complete business tax preparation and compliance',
      monthlyFee: 0,
      oneTimeFee: businessTaxPrice,
      annualPrice: businessTaxPrice,
      included: [
        'Business tax return preparation',
        'Quarterly tax compliance',
        'Sales tax filing (if applicable)',
        'Payroll tax compliance',
        'Tax planning and strategy',
        'Entity structure optimization'
      ],
      addOns: [
        'Multi-state tax filings (+$300 per state)',
        'International tax compliance (+$1,200)',
        'R&D credit analysis (+$800)',
        'Cost segregation studies (+$2,500)'
      ]
    };
    
    services.push(businessTaxService);
    totalOneTimeFees += businessTaxPrice;
  }

  // Bookkeeping Services
  if (formData.services.includes('bookkeeping')) {
    let basePrice = 400;
    
    // Adjust based on transaction volume (estimated from revenue)
    const businessRevenue = formData.bookkeeping?.annualRevenue || '';
    if (businessRevenue.includes('Over $5,000,000')) basePrice = 1200;
    else if (businessRevenue.includes('$1,000,000 - $5,000,000')) basePrice = 800;
    else if (businessRevenue.includes('$500,000 - $1,000,000')) basePrice = 600;
    
    const bookkeepingPrice = Math.round(basePrice * multiplier);
    
    const bookkeepingService: ServiceQuote = {
      name: 'Bookkeeping Services',
      description: 'Professional monthly bookkeeping and financial reporting',
      monthlyFee: bookkeepingPrice,
      oneTimeFee: 0,
      annualPrice: bookkeepingPrice * 12,
      included: [
        'Monthly bank reconciliation',
        'Transaction categorization',
        'Financial statement preparation',
        'Accounts payable/receivable management',
        'Monthly financial reports',
        'QuickBooks maintenance'
      ],
      addOns: [
        'Weekly bookkeeping (+50% of monthly fee)',
        'Inventory management (+$200/mo)',
        'Multi-entity consolidation (+$300/mo)',
        'Custom reporting (+$150/mo)'
      ]
    };
    
    services.push(bookkeepingService);
    totalMonthlyFees += bookkeepingPrice;
    
    if (formData.bookkeeping?.additionalConsiderations?.includes('QuickBooks setup or training')) {
      recommendations.push('QuickBooks setup and training included at no additional cost');
    }
  }

  // Generate recommendations based on selections and business profile
  if (!formData.services.includes('advisory') && getComplexityScore() >= 3) {
    recommendations.push('Consider adding Advisory Services for strategic guidance as your business grows');
  }
  
  if (formData.services.includes('bookkeeping') && !formData.services.includes('business-tax')) {
    recommendations.push('Bundle with Business Tax Services for 15% savings on tax preparation');
  }

  // Calculate potential savings
  const potentialSavings = Math.round((totalMonthlyFees * 12 + totalOneTimeFees) * 0.3); // Estimate 30% savings from tax optimization

  const totalAnnual = totalMonthlyFees * 12 + totalOneTimeFees;

  return {
    services,
    hourlyServices: [],
    totalMonthlyFees: Math.round(totalMonthlyFees),
    totalOneTimeFees: Math.round(totalOneTimeFees),
    totalAnnual: Math.round(totalAnnual),
    potentialSavings,
    recommendations,
    complexity
  };
};