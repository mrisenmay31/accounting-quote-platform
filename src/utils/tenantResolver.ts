import { TenantConfig, fetchTenantByDomain } from './tenantService';

export interface TenantResolutionResult {
  tenant: TenantConfig | null;
  error: string | null;
}

const extractSubdomain = (hostname: string): string | null => {
  const parts = hostname.split('.');

  if (parts.length >= 3) {
    return parts[0];
  }

  return null;
};

const getDefaultTenantForDevelopment = (): string => {
  const urlParams = new URLSearchParams(window.location.search);
  const tenantParam = urlParams.get('tenant');

  if (tenantParam) {
    return tenantParam;
  }

  return 'ledgerly';
};

const isLocalDevelopment = (): boolean => {
  const hostname = window.location.hostname;
  return hostname === 'localhost' ||
         hostname.includes('bolt.new') ||
         hostname.includes('127.0.0.1') ||
         hostname.includes('stackblitz.io');
};

const createFallbackTenant = (): TenantConfig => {
  const subdomain = 'elevatedtax';

  return {
    id: 'local-dev-fallback',
    subdomain: subdomain,
    customDomain: null,
    firmName: import.meta.env.VITE_FIRM_NAME || 'Elevated Tax & Accounting',
    firmTagline: import.meta.env.VITE_FIRM_TAGLINE || null,
    logoUrl: import.meta.env.VITE_LOGO_URL || null,
    primaryColor: import.meta.env.VITE_PRIMARY_COLOR || '2563eb',
    secondaryColor: import.meta.env.VITE_SECONDARY_COLOR || '10b981',
    airtable: {
      pricingBaseId: import.meta.env.VITE_AIRTABLE_PRICING_BASE_ID || '',
      pricingApiKey: import.meta.env.VITE_AIRTABLE_PRICING_API_KEY || '',
      servicesBaseId: import.meta.env.VITE_AIRTABLE_SERVICES_BASE_ID || '',
      servicesApiKey: import.meta.env.VITE_AIRTABLE_SERVICES_API_KEY || '',
    },
    zapierWebhookUrl: import.meta.env.VITE_ZAPIER_WEBHOOK_URL || '',
    active: true,
  };
};

export const resolveTenant = async (): Promise<TenantResolutionResult> => {
  try {
    const hostname = window.location.hostname;
    const isLocal = isLocalDevelopment();

    console.log('=== TENANT RESOLUTION DEBUG ===');
    console.log('Hostname:', hostname);
    console.log('Is Local Dev:', isLocal);

    // CHECK IF IN LOCAL DEVELOPMENT
    if (isLocal) {
      console.log('🔧 Local development detected - using fallback tenant config');
      const fallbackTenant = createFallbackTenant();

      console.log('Fallback Tenant Config:', {
        id: fallbackTenant.id,
        subdomain: fallbackTenant.subdomain,
        firmName: fallbackTenant.firmName,
        primaryColor: fallbackTenant.primaryColor,
        hasAirtableConfig: !!(fallbackTenant.airtable.servicesBaseId && fallbackTenant.airtable.servicesApiKey)
      });
      console.log('================================');

      return { tenant: fallbackTenant, error: null };
    }

    // PRODUCTION: FETCH FROM DATABASE
    console.log('📡 Production mode - fetching tenant from database');
    const hardcodedTenant = 'elevatedtax';
    console.log(`Fetching tenant: ${hardcodedTenant}`);
    console.log('================================');

    try {
      const tenant = await fetchTenantByDomain(hardcodedTenant);
      return { tenant, error: null };
    } catch (error) {
      return {
        tenant: null,
        error: `Tenant not found: ${hardcodedTenant}`,
      };
    }
  } catch (error) {
    console.error('Unexpected error during tenant resolution:', error);
    return {
      tenant: null,
      error: 'An unexpected error occurred while loading the application. Please try again later.',
    };
  }
};

export const getTenantDomain = (tenant: TenantConfig, platformDomain: string = 'platform.com'): string => {
  if (tenant.customDomain) {
    return tenant.customDomain;
  }

  return `${tenant.subdomain}.${platformDomain}`;
};
