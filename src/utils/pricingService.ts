import { PricingConfig } from '../types/quote';

// Airtable configuration for pricing (fallback to env vars for development)
const AIRTABLE_PRICING_BASE_ID = import.meta.env.VITE_AIRTABLE_PRICING_BASE_ID || '';
const AIRTABLE_PRICING_API_KEY = import.meta.env.VITE_AIRTABLE_PRICING_API_KEY || '';
const AIRTABLE_PRICING_TABLE_NAME = 'Pricing Variables';

export interface AirtableConfig {
  baseId: string;
  apiKey: string;
}

export interface AirtablePricingRecord {
  id: string;
  fields: {
    'Service ID': string;
    'Pricing Rule ID': string;
    'Rule Name': string;
    'Description': string;
    'Pricing Type': string;
    'Base Price': string;
    'Billing Frequency': string;
    'Active': string;
    'Trigger Form Field': string;
    'Required Form Field': string;
    'Comparison Logic': string;
    'Per-Unit Pricing': string;
    'Unit Price': string;
    'Unit Name': string;
    'Quantity Source Field': string;
    'Advisory Discount Eligible': string;
    'Advisory Discount Percentage': string;
  };
}

// Default pricing configuration (fallback if Airtable is unavailable)
const defaultPricingConfig: PricingConfig[] = [
  {
    serviceId: 'advisory',
    serviceName: 'Advisory Services',
    basePrice: 2500,
    complexityMultipliers: {
      low: 1.0,
      medium: 1.2,
      high: 1.5,
      veryHigh: 2.0
    },
    includedFeatures: [
      'Monthly financial review and analysis',
      'Strategic planning sessions',
      'Cash flow forecasting',
      'KPI dashboard and reporting',
      'Quarterly business reviews',
      'Tax planning and optimization',
      'Direct access to senior advisors'
    ],
    addOns: [
      { name: 'Weekly check-ins', price: 500 },
      { name: 'Custom financial modeling', price: 750 },
      { name: 'Board presentation support', price: 300 },
      { name: 'M&A advisory', price: 1500 }
    ]
  },
  {
    serviceId: 'individual-tax',
    serviceName: 'Individual Tax Preparation',
    basePrice: 150,
    complexityMultipliers: {
      low: 1.0,
      medium: 1.67,
      high: 2.33,
      veryHigh: 3.33
    },
    includedFeatures: [
      'Federal and state tax return preparation',
      'Tax planning consultation',
      'Quarterly estimated tax calculations',
      'Audit support and representation',
      'Prior year amendments if needed',
      'Tax document organization'
    ],
    addOns: [
      { name: 'Multi-state returns', price: 150 },
      { name: 'Rental property schedules', price: 200 },
      { name: 'Business schedule preparation', price: 300 },
      { name: 'Investment portfolio analysis', price: 250 }
    ]
  },
  {
    serviceId: 'business-tax',
    serviceName: 'Business Tax Services',
    basePrice: 800,
    complexityMultipliers: {
      low: 1.0,
      medium: 1.2,
      high: 1.5,
      veryHigh: 2.0
    },
    includedFeatures: [
      'Business tax return preparation',
      'Quarterly tax compliance',
      'Sales tax filing (if applicable)',
      'Payroll tax compliance',
      'Tax planning and strategy',
      'Entity structure optimization'
    ],
    addOns: [
      { name: 'Multi-state tax filings', price: 300 },
      { name: 'International tax compliance', price: 1200 },
      { name: 'R&D credit analysis', price: 800 },
      { name: 'Cost segregation studies', price: 2500 }
    ]
  },
  {
    serviceId: 'bookkeeping',
    serviceName: 'Bookkeeping Services',
    basePrice: 400,
    complexityMultipliers: {
      low: 1.0,
      medium: 1.2,
      high: 1.5,
      veryHigh: 2.0
    },
    includedFeatures: [
      'Monthly bank reconciliation',
      'Transaction categorization',
      'Financial statement preparation',
      'Accounts payable/receivable management',
      'Monthly financial reports',
      'QuickBooks maintenance'
    ],
    addOns: [
      { name: 'Weekly bookkeeping', price: 200 },
      { name: 'Inventory management', price: 200 },
      { name: 'Multi-entity consolidation', price: 300 },
      { name: 'Custom reporting', price: 150 }
    ],
    revenueAdjustments: [
      { revenueRange: 'Under $50,000', multiplier: 0.8 },
      { revenueRange: '$50,000 - $100,000', multiplier: 1.0 },
      { revenueRange: '$100,000 - $250,000', multiplier: 1.2 },
      { revenueRange: '$250,000 - $500,000', multiplier: 1.4 },
      { revenueRange: '$500,000 - $1,000,000', multiplier: 1.6 },
      { revenueRange: '$1,000,000 - $5,000,000', multiplier: 2.0 },
      { revenueRange: 'Over $5,000,000', multiplier: 3.0 }
    ]
  },
  {
    serviceId: 'additional-services',
    serviceName: 'Additional Services',
    basePrice: 0, // Variable pricing based on selected services
    complexityMultipliers: {
      low: 1.0,
      medium: 1.0,
      high: 1.0,
      veryHigh: 1.0
    },
    includedFeatures: [
      'Professional consultations',
      'Specialized filings',
      'Strategic planning services',
      'Project-based solutions'
    ],
    addOns: [
      { name: '2-Hour Comprehensive Consultation', price: 500 },
      { name: '1-Hour Tax Planning Consultation', price: 250 },
      { name: '1-Hour Bookkeeping Consultation', price: 200 },
      { name: '2-Hour Year-End Tax Strategy', price: 400 },
      { name: '1099 Preparation & Filing', price: 150 },
      { name: 'S-Corp Election (Form 2553)', price: 300 }
    ]
  },
  {
    serviceId: 'bookkeeping',
    pricingRuleId: 'bookkeeping-base',
    serviceName: 'Bookkeeping Services - Base',
    description: 'Monthly bookkeeping base service',
    pricingType: 'Base Service',
    basePrice: 0,
    billingFrequency: 'Monthly',
    active: true,
    perUnitPricing: false,
    advisoryDiscountEligible: false,
    advisoryDiscountPercentage: 0,
    includedFeatures: [],
    addOns: []
  },
  {
    serviceId: 'bookkeeping',
    pricingRuleId: 'bookkeeping-minimum-fee',
    serviceName: 'Bookkeeping Minimum Fee',
    description: 'Minimum monthly fee for bookkeeping services',
    pricingType: 'Base Service',
    basePrice: 500,
    billingFrequency: 'Monthly',
    active: true,
    perUnitPricing: false,
    advisoryDiscountEligible: true,
    advisoryDiscountPercentage: 0.5,
    includedFeatures: [],
    addOns: []
  },
  {
    serviceId: 'bookkeeping',
    pricingRuleId: 'bookkeeping-catchup',
    serviceName: 'Bookkeeping Catchup/Cleanup',
    description: 'Catchup bookkeeping services based on months behind (2 hours per month at $150/hour)',
    pricingType: 'Add-on',
    basePrice: 0,
    billingFrequency: 'One-Time Fee',
    active: true,
    triggerFormField: 'bookkeeping.currentStatus',
    requiredFormValue: 'Books need to be caught up',
    comparisonLogic: 'equals',
    perUnitPricing: true,
    unitPrice: 300,
    unitName: 'month',
    quantitySourceField: 'bookkeeping.monthsBehind',
    advisoryDiscountEligible: true,
    advisoryDiscountPercentage: 0.5,
    includedFeatures: [],
    addOns: []
  }
];

// Parse JSON strings from Airtable fields
const parseJsonField = (field: string | undefined): any => {
  if (!field) return [];
  try {
    return JSON.parse(field);
  } catch (error) {
    console.warn('Failed to parse JSON field:', field, error);
    return [];
  }
};

// Convert Airtable record to PricingConfig
const convertAirtableRecord = (record: AirtablePricingRecord): PricingConfig => {
  const fields = record.fields;
  
  // Helper function to parse currency strings (e.g., "$1,250.00" -> 1250)
  const parseCurrency = (value: string | undefined): number => {
    if (!value) return 0;
    const parsed = parseFloat(String(value).replace(/[$,]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  };
  
  // Helper function to parse percentage strings (e.g., "50%" -> 0.5)
  const parsePercentage = (value: string | undefined): number => {
    if (!value) return 0;
    
    const stringValue = String(value).trim();
    
    // If the value ends with '%', it's a percentage string - remove % and divide by 100
    if (stringValue.endsWith('%')) {
      return parseFloat(stringValue.replace('%', '')) / 100 || 0;
    }
    
    // If no '%' sign, assume it's already a decimal representation (e.g., 1 for 100%, 0.5 for 50%)
    const parsed = parseFloat(stringValue);
    return isNaN(parsed) ? 0 : parsed;
  };
  
  // Helper function to parse checkbox values
  const parseCheckbox = (value: string | undefined): boolean => {
    if (!value) return false;
    const normalizedValue = String(value).trim().toLowerCase();
    return normalizedValue === 'checked' || normalizedValue === 'true' || normalizedValue === '1' || normalizedValue === 'yes';
  };
  
  return {
    serviceId: fields['Service ID'],
    pricingRuleId: fields['Pricing Rule ID'],
    serviceName: fields['Rule Name'],
    description: fields['Description'] || '',
    pricingType: fields['Pricing Type'] as 'Base Service' | 'Add-on' | 'Discount',
    basePrice: parseCurrency(fields['Base Price']),
    billingFrequency: fields['Billing Frequency'] as 'Monthly' | 'One-Time Fee' | 'Annual',
    active: parseCheckbox(fields['Active']),
    triggerFormField: fields['Trigger Form Field']?.trim(),
    requiredFormValue: fields['Required Form Field']?.trim(),
    comparisonLogic: fields['Comparison Logic'] as 'equals' | 'includes' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains',
    perUnitPricing: parseCheckbox(fields['Per-Unit Pricing']),
    unitPrice: parseCurrency(fields['Unit Price']) || 0,
    unitName: fields['Unit Name']?.trim(),
    quantitySourceField: fields['Quantity Source Field']?.trim(),
    advisoryDiscountEligible: parseCheckbox(fields['Advisory Discount Eligible']),
    advisoryDiscountPercentage: parsePercentage(fields['Advisory Discount Percentage']),
    includedFeatures: [],
    addOns: []
  };
};

// Fetch pricing configuration from Airtable
export const fetchPricingConfig = async (airtableConfig?: AirtableConfig): Promise<PricingConfig[]> => {
  // Use tenant-specific config or fall back to environment variables
  const baseId = airtableConfig?.baseId || AIRTABLE_PRICING_BASE_ID;
  const apiKey = airtableConfig?.apiKey || AIRTABLE_PRICING_API_KEY;

  // Return default config if Airtable is not configured
  if (!baseId || !apiKey) {
    console.warn('Airtable pricing configuration not found. Using default pricing.');
    return defaultPricingConfig;
  }

  try {
    const url = `https://api.airtable.com/v0/${baseId}/${AIRTABLE_PRICING_TABLE_NAME}?filterByFormula={Active}=TRUE()`;
    console.log('Fetching pricing config from:', url);

    const response = await fetch(
      url,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error(`Airtable API error: ${response.status} ${response.statusText}`);
      console.log('Falling back to default pricing configuration');
      return defaultPricingConfig;
    }

    const data = await response.json();
    
    if (!data.records || data.records.length === 0) {
      console.warn('No active pricing records found in Airtable. Using default pricing.');
      return defaultPricingConfig;
    }

    const pricingConfig = data.records.map((record: AirtablePricingRecord) => 
      convertAirtableRecord(record)
    );

    console.log('Successfully fetched pricing configuration from Airtable:', pricingConfig);
    return pricingConfig;

  } catch (error) {
    console.error('Network error fetching pricing configuration from Airtable:', error);
    console.log('Falling back to default pricing configuration');
    return defaultPricingConfig;
  }
};

// Get pricing for a specific service
export const getServicePricing = (
  pricingConfig: PricingConfig[], 
  serviceId: string
): PricingConfig | null => {
  return pricingConfig.find(config => config.serviceId === serviceId) || null;
};

// Cache pricing configuration to avoid repeated API calls (tenant-scoped)
const pricingCache = new Map<string, { config: PricingConfig[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCachedPricingConfig = async (airtableConfig?: AirtableConfig): Promise<PricingConfig[]> => {
  const cacheKey = airtableConfig ? `${airtableConfig.baseId}:${airtableConfig.apiKey}` : 'default';
  const now = Date.now();

  const cached = pricingCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.config;
  }

  const config = await fetchPricingConfig(airtableConfig);
  pricingCache.set(cacheKey, { config, timestamp: now });

  return config;
};

// Clear pricing cache (useful for testing or manual refresh)
export const clearPricingCache = (airtableConfig?: AirtableConfig): void => {
  if (airtableConfig) {
    const cacheKey = `${airtableConfig.baseId}:${airtableConfig.apiKey}`;
    pricingCache.delete(cacheKey);
  } else {
    pricingCache.clear();
  }
};