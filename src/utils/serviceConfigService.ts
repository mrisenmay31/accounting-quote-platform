import { ServiceConfig } from '../types/quote';

// Airtable configuration for services (fallback to env vars for development)
const AIRTABLE_SERVICES_BASE_ID = import.meta.env.VITE_AIRTABLE_SERVICES_BASE_ID || '';
const AIRTABLE_SERVICES_API_KEY = import.meta.env.VITE_AIRTABLE_SERVICES_API_KEY || '';
const AIRTABLE_SERVICES_TABLE_NAME = 'Services';

export interface AirtableConfig {
  baseId: string;
  apiKey: string;
}

export interface AirtableServiceRecord {
  id: string;
  fields: {
    'Service ID': string;
    'Title': string;
    'Description': string;
    'Icon Name': string;
    'Color': string;
    'Featured': boolean;
    'Benefits': string;
    'Active': boolean;
    'Service Order': number;
    'Has Detail Form'?: boolean;
    'Included Features Card Title'?: string;
    'Included Features Card List'?: string;
    // Service-level pricing total fields
    'Total Variable Name'?: string;
    'Default Billing Frequency'?: string;
    'Aggregation Rules'?: string;         // JSON string
    'Display Name (Quote)'?: string;
    'Can Reference in Formulas'?: boolean;
  };
}

// Default service configuration (fallback if Airtable is unavailable)
const defaultServiceConfig: ServiceConfig[] = [
  {
    serviceId: 'advisory',
    title: 'Advisory Services',
    description: 'Strategic financial guidance and individual/business consulting',
    iconName: 'TrendingUp',
    color: 'emerald',
    featured: true,
    benefits: ['Year-Round Partnership', 'Complete Tax Services', 'VIP Access', '50% Discount on all additional services'],
    active: true
  },
  {
    serviceId: 'individual-tax',
    title: 'Individual Tax Preparation',
    description: 'Personal tax returns and planning',
    iconName: 'FileText',
    color: 'blue',
    featured: false,
    benefits: ['Tax return preparation', 'Tax planning', 'Audit support', 'Quarterly estimates'],
    active: true
  },
  {
    serviceId: 'business-tax',
    title: 'Business Tax Services',
    description: 'Corporate tax preparation and compliance',
    iconName: 'Calculator',
    color: 'purple',
    featured: false,
    benefits: ['Business tax returns', 'Tax compliance', 'Entity selection', 'Tax optimization'],
    active: true
  },
  {
    serviceId: 'bookkeeping',
    title: 'Bookkeeping Services',
    description: 'Monthly financial record keeping',
    iconName: 'BookOpen',
    color: 'orange',
    featured: false,
    benefits: ['Monthly reconciliation', 'Financial statements', 'Transaction categorization', 'QuickBooks setup'],
    active: true
  },
  {
    serviceId: 'additional-services',
    title: 'Additional Services',
    description: 'Professional consultations, specialized filings, and strategic planning services',
    iconName: 'FileText',
    color: 'gray',
    featured: false,
    benefits: ['Tax planning', 'Specialized filings & elections', 'Custom consulting solutions', 'Project-based bookkeeping'],
    active: true,
    includedFeaturesCardTitle: 'How Additional Services Work',
    includedFeaturesCardList: [
      'One-time fees are charged once upon service completion',
      'Monthly services are billed on a recurring monthly basis',
      'Hourly services are billed based on actual time worked',
      'All services can be bundled with your regular package or purchased separately',
      'Advisory service clients receive 50% discount on eligible services',
      'Complete pricing breakdown will be shown in your quote summary'
    ]
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

// Convert Airtable record to ServiceConfig
const convertAirtableServiceRecord = (record: AirtableServiceRecord): ServiceConfig => {
  const fields = record.fields;

  return {
    serviceId: fields['Service ID'],
    title: fields['Title'],
    description: fields['Description'],
    iconName: fields['Icon Name'],
    color: fields['Color'],
    featured: fields['Featured'] || false,
    benefits: parseJsonField(fields['Benefits']),
    active: fields['Active'] || false,
    serviceOrder: fields['Service Order'] || 999,
    hasDetailForm: fields['Has Detail Form'] || false,
    includedFeaturesCardTitle: fields['Included Features Card Title'] || '',
    includedFeaturesCardList: parseJsonField(fields['Included Features Card List']),
    // Service-level pricing total fields
    totalVariableName: fields['Total Variable Name'] || undefined,
    defaultBillingFrequency: fields['Default Billing Frequency'] || undefined,
    aggregationRules: parseJsonField(fields['Aggregation Rules']) || undefined,
    displayNameQuote: fields['Display Name (Quote)'] || undefined,
    canReferenceInFormulas: fields['Can Reference in Formulas'] || false
  };
};

// Fetch service configuration from Airtable
export const fetchServiceConfig = async (airtableConfig?: AirtableConfig): Promise<ServiceConfig[]> => {
  // Use tenant-specific config or fall back to environment variables
  const baseId = airtableConfig?.baseId || AIRTABLE_SERVICES_BASE_ID;
  const apiKey = airtableConfig?.apiKey || AIRTABLE_SERVICES_API_KEY;

  // Return default config if Airtable is not configured
  if (!baseId || !apiKey) {
    console.warn('Airtable services configuration not found. Using default services.');
    return defaultServiceConfig;
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/${AIRTABLE_SERVICES_TABLE_NAME}?filterByFormula={Active}=TRUE()`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.records || data.records.length === 0) {
      console.warn('No active service records found in Airtable. Using default services.');
      return defaultServiceConfig;
    }

    const serviceConfig = data.records.map((record: AirtableServiceRecord) => 
      convertAirtableServiceRecord(record)
    ).sort((a, b) => a.serviceOrder - b.serviceOrder);

    console.log('Successfully fetched service configuration from Airtable:', serviceConfig);
    return serviceConfig;

  } catch (error) {
    console.error('Error fetching service configuration from Airtable:', error);
    console.log('Falling back to default service configuration');
    // Always return default config on any error to ensure app continues working
    return [...defaultServiceConfig];
  }
};

// Get service configuration for a specific service
export const getServiceConfig = (
  serviceConfigs: ServiceConfig[], 
  serviceId: string
): ServiceConfig | null => {
  return serviceConfigs.find(config => config.serviceId === serviceId) || null;
};

// Cache service configuration to avoid repeated API calls (tenant-scoped)
const serviceCache = new Map<string, { config: ServiceConfig[]; timestamp: number }>();
const SERVICE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCachedServiceConfig = async (airtableConfig?: AirtableConfig): Promise<ServiceConfig[]> => {
  const cacheKey = airtableConfig ? `${airtableConfig.baseId}:${airtableConfig.apiKey}` : 'default';
  const now = Date.now();

  const cached = serviceCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < SERVICE_CACHE_DURATION) {
    return cached.config;
  }

  const config = await fetchServiceConfig(airtableConfig);
  serviceCache.set(cacheKey, { config, timestamp: now });

  return config;
};

// Clear service cache (useful for testing or manual refresh)
export const clearServiceCache = (airtableConfig?: AirtableConfig): void => {
  if (airtableConfig) {
    const cacheKey = `${airtableConfig.baseId}:${airtableConfig.apiKey}`;
    serviceCache.delete(cacheKey);
  } else {
    serviceCache.clear();
  }
};