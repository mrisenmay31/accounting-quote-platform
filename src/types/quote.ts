export interface FormData {
  // Contact Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Service Selection
  services: string[];
  
  // Individual Tax Details
  individualTax?: {
    filingStatus: string;
    annualIncome: string;
    incomeTypes: string[];
    deductionType: string;
    taxSituations: string[];
    otherIncomeTypes: string[];
    additionalConsiderations: string[];
    interestDividendAmount: string;
    selfEmploymentBusinessCount: number;
    k1Count: number;
    rentalPropertyCount: number;
    additionalStateCount: number;
   hasPrimaryHomeSale: boolean;
   hasInvestmentPropertySale: boolean;
   hasAdoptedChild: boolean;
   hasDivorce: boolean;
   hasMarriage: boolean;
    hasMultipleStates: boolean;
    taxYear: string;
    timeline: string;
    previousPreparer: string;
    specialCircumstances: string;
    otherIncomeDescription: string;
    hasOtherIncome: string;
  };
  
  // Business Tax Details
  businessTax?: {
    businessName?: string;
    businessType?: string;
    annualRevenue?: string;
    numberOfEmployees?: string;
    entityType: string;
    businessIndustry: string;
    numberOfOwners: number;
    otherSituations: string[];
    additionalConsiderations: string[];
    additionalStateCount: number;
    fixedAssetAcquisitionCount: number;
    taxYear: string;
    complexity: string;
    taxSituations: string[];
   isFirstYearEntity: boolean;
   hasOwnershipChanges: boolean;
   hasFixedAssetAcquisitions: boolean;
    timeline: string;
    previousPreparer: string;
    specialCircumstances: string;
  };
  
  // Bookkeeping Details
  bookkeeping?: {
    businessName?: string;
    businessType?: string;
    businessIndustry?: string;
    annualRevenue?: string;
    numberOfEmployees?: string;
    currentBookkeepingMethod?: string;
    currentStatus: string;
    monthsBehind: string;
    bankAccounts: number;
    creditCards: number;
    bankLoans: number;
    transactionVolume: number;
    monthlyTransactions: number | string;
    servicesNeeded: string[];
    frequency: string;
    servicefrequency: string;
    additionalConsiderations: string[];
    needsCleanup: boolean;
    hasThirdPartyIntegration: boolean;
    hasFixedAssets: boolean;
    fixedAssetsCount: number;
    fixedassets: number;
    cleanuphours: number;
    hasInventory: boolean;
    startTimeline: string;
    challenges: string;
  };
  
  // Additional Services Details
  additionalServices?: {
    selectedAdditionalServices: string[];
    specializedFilings?: string[]; // Multi-select for specialized services
    // Accounts Receivable conditionals
    accountsReceivableInvoicesPerMonth?: number;
    accountsReceivableRecurring?: string;
    // Accounts Payable conditionals
    accountsPayableBillsPerMonth?: number;
    accountsPayableBillRunFrequency?: string;
    // 1099 Processing conditionals
    form1099Count?: number;
    // Tax Planning Consultation
    taxPlanningConsultation?: boolean;
  };
}

export interface HourlyService {
  name: string;
  rate: number;
  unitName: string;
  billingFrequency: string;
}

export interface ServiceQuote {
  name: string;
  description: string;
  monthlyFee: number;
  oneTimeFee: number;
  annualPrice: number;
  included: string[];
  addOns?: string[];
  pricingFactors?: string[];
}

export interface QuoteData {
  services: ServiceQuote[];
  hourlyServices: HourlyService[];
  totalMonthlyFees: number;
  totalOneTimeFees: number;
  totalAnnual: number;
  potentialSavings: number;
  recommendations: string[];
  complexity: 'low' | 'medium' | 'high' | 'very-high';
}

export type ComparisonOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'lessThan'
  | 'lessThanOrEqual'
  | 'greaterThan'
  | 'greaterThanOrEqual'
  | 'includes';  // Legacy support

export interface PricingConfig {
  serviceId: string;
  pricingRuleId: string;
  serviceName: string;
  description: string;
  pricingType: 'Base Service' | 'Add-on' | 'Discount';
  basePrice: number;
  billingFrequency: 'Monthly' | 'One-Time Fee' | 'Annual';
  active: boolean;
  triggerFormField?: string;
  requiredFormValue?: string;
  comparisonLogic?: ComparisonOperator;
  perUnitPricing: boolean;
  unitPrice?: number;
  unitName?: string;
  quantitySourceField?: string;
  advisoryDiscountEligible: boolean;
  advisoryDiscountPercentage: number;
  minimumMonthlyFee?: number;
  minimumMonthlyFeeWithAdvisory?: number;
  applyMinimumFee?: boolean;
  includedFeatures: string[];
  addOns: Array<{
    name: string;
    price: number;
  }>;

  // Formula-based pricing fields
  calculationMethod?: 'simple' | 'formula' | 'per-unit';
  formulaExpression?: string;
  formulaInputFields?: string[];
  minimumValue?: number;
  maximumValue?: number;
}

export interface AggregationRules {
  includeTypes?: string[];              // e.g., ["Base Service", "Add-on"]
  excludeTypes?: string[];              // e.g., ["Discount"]
  includeBillingFrequencies?: string[]; // e.g., ["Monthly", "One-Time Fee"]
  excludeBillingFrequencies?: string[]; // e.g., ["Annual"]
  minimumFee?: number;                  // Service-level minimum
}

export interface ServiceConfig {
  serviceId: string;
  title: string;
  description: string;
  iconName: string;
  color: string;
  featured: boolean;
  benefits: string[];
  active: boolean;
  serviceOrder?: number;
  hasDetailForm?: boolean;
  includedFeaturesCardTitle?: string;
  includedFeaturesCardList?: string[];

  // Service-level pricing configuration
  totalVariableName?: string;           // e.g., "individualTaxTotal"
  defaultBillingFrequency?: string;     // "Monthly", "One-Time Fee", etc.
  aggregationRules?: AggregationRules;  // Rules for calculating service totals
  displayNameQuote?: string;            // "Total Individual Tax Fee"
  canReferenceInFormulas?: boolean;     // Allow formula references (default: false)
}

// Dynamic Form Field Types
export interface FormField {
  serviceId: string;
  fieldName: string;
  fieldType: 'text' | 'number' | 'dropdown' | 'checkbox' | 'textarea' | 'radio' | 'multi-select';
  fieldLabel: string;
  placeholder?: string;
  options?: string; // JSON string containing field-specific options
  required: boolean;
  active: boolean;
  displayOrder: number;
  conditionalLogic?: string; // JSON string for future conditional logic implementation
  helpText?: string;
  // Layout metadata
  fieldWidth?: 'full' | 'half';
  sectionHeader?: string;
  sectionIcon?: string;
  layoutType?: 'standard' | 'checkbox-grid' | 'radio-group' | 'textarea';
  columns?: number; // Number of columns for checkbox grids
  rowGroup?: number; // Group number for half-width fields on same row
}

export interface AirtableFormFieldConfig {
  baseId: string;
  apiKey: string;
}
