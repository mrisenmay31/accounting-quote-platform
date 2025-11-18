import { supabase, Tenant } from './supabaseClient';

export interface TenantConfig {
  id: string;
  subdomain: string;
  customDomain: string | null;
  firmName: string;
  firmTagline: string | null;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  airtable: {
    pricingBaseId: string;
    pricingApiKey: string;
    servicesBaseId: string;
    servicesApiKey: string;
    quotesBaseId?: string;
    quotesApiKey?: string;
    quotesTableName?: string;
  };
  zapierWebhookUrl: string;
  active: boolean;
}

export class TenantNotFoundError extends Error {
  constructor(domain: string) {
    super(`Tenant not found for domain: ${domain}`);
    this.name = 'TenantNotFoundError';
  }
}

export class TenantInactiveError extends Error {
  constructor(domain: string) {
    super(`Tenant is inactive for domain: ${domain}`);
    this.name = 'TenantInactiveError';
  }
}

const convertTenantToConfig = (tenant: Tenant): TenantConfig => {
  return {
    id: tenant.id,
    subdomain: tenant.subdomain,
    customDomain: tenant.custom_domain,
    firmName: tenant.firm_name,
    firmTagline: tenant.firm_tagline,
    logoUrl: tenant.logo_url,
    primaryColor: tenant.primary_color,
    secondaryColor: tenant.secondary_color,
    airtable: {
      pricingBaseId: tenant.airtable_pricing_base_id,
      pricingApiKey: tenant.airtable_pricing_api_key,
      servicesBaseId: tenant.airtable_services_base_id,
      servicesApiKey: tenant.airtable_services_api_key,
    },
    zapierWebhookUrl: tenant.zapier_webhook_url,
    active: tenant.active,
  };
};

export const fetchTenantBySubdomain = async (subdomain: string): Promise<TenantConfig> => {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('subdomain', subdomain)
      .maybeSingle();

    if (error) {
      console.error('Error fetching tenant by subdomain:', error);
      throw new Error(`Failed to fetch tenant: ${error.message}`);
    }

    if (!data) {
      throw new TenantNotFoundError(subdomain);
    }

    if (!data.active) {
      throw new TenantInactiveError(subdomain);
    }

    return convertTenantToConfig(data);
  } catch (error) {
    if (error instanceof TenantNotFoundError || error instanceof TenantInactiveError) {
      throw error;
    }
    console.error('Unexpected error fetching tenant:', error);
    throw new Error('Failed to load tenant configuration');
  }
};

export const fetchTenantByCustomDomain = async (customDomain: string): Promise<TenantConfig> => {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('custom_domain', customDomain)
      .maybeSingle();

    if (error) {
      console.error('Error fetching tenant by custom domain:', error);
      throw new Error(`Failed to fetch tenant: ${error.message}`);
    }

    if (!data) {
      throw new TenantNotFoundError(customDomain);
    }

    if (!data.active) {
      throw new TenantInactiveError(customDomain);
    }

    return convertTenantToConfig(data);
  } catch (error) {
    if (error instanceof TenantNotFoundError || error instanceof TenantInactiveError) {
      throw error;
    }
    console.error('Unexpected error fetching tenant:', error);
    throw new Error('Failed to load tenant configuration');
  }
};

export const fetchTenantByDomain = async (domain: string): Promise<TenantConfig> => {
  try {
    const subdomainResult = await fetchTenantBySubdomain(domain);
    return subdomainResult;
  } catch (subdomainError) {
    if (subdomainError instanceof TenantNotFoundError) {
      try {
        const customDomainResult = await fetchTenantByCustomDomain(domain);
        return customDomainResult;
      } catch (customDomainError) {
        throw subdomainError;
      }
    }
    throw subdomainError;
  }
};

export const getAllActiveTenants = async (): Promise<TenantConfig[]> => {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('active', true)
      .order('firm_name', { ascending: true });

    if (error) {
      console.error('Error fetching all tenants:', error);
      throw new Error(`Failed to fetch tenants: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(convertTenantToConfig);
  } catch (error) {
    console.error('Unexpected error fetching tenants:', error);
    throw new Error('Failed to load tenants');
  }
};
