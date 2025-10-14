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

  return 'elevated-tax';
};

export const resolveTenant = async (): Promise<TenantResolutionResult> => {
  try {
    const hostname = window.location.hostname;
    const isDevelopment = import.meta.env.DEV ||
                         hostname.includes('localhost') ||
                         hostname.includes('webcontainer') ||
                         hostname.includes('bolt.new');

    let resolvedTenant: string;

    if (isDevelopment) {
      resolvedTenant = getDefaultTenantForDevelopment();
      console.log('[TenantResolver] Development mode: Resolved tenant from query param or default:', resolvedTenant);
    } else {
      const subdomain = extractSubdomain(hostname);

      if (subdomain) {
        resolvedTenant = subdomain;
        console.log('[TenantResolver] Production mode: Resolved tenant from subdomain:', resolvedTenant);
      } else {
        resolvedTenant = 'elevated-tax';
        console.log('[TenantResolver] Production mode: No subdomain found, using default tenant:', resolvedTenant);
      }
    }

    try {
      const tenant = await fetchTenantByDomain(resolvedTenant);
      console.log('[TenantResolver] Successfully loaded tenant configuration:', {
        subdomain: tenant.subdomain,
        firmName: tenant.firmName,
        customDomain: tenant.customDomain
      });
      return { tenant, error: null };
    } catch (error) {
      console.error('[TenantResolver] Failed to fetch tenant:', resolvedTenant, error);
      return {
        tenant: null,
        error: `Tenant not found: ${resolvedTenant}`,
      };
    }
  } catch (error) {
    console.error('[TenantResolver] Unexpected error during tenant resolution:', error);
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
