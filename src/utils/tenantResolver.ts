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

export const resolveTenant = async (): Promise<TenantResolutionResult> => {
  try {
    const hostname = window.location.hostname;
    const urlParams = new URLSearchParams(window.location.search);
    const tenantParam = urlParams.get('tenant');

    // PRIORITY 1: Check for ?tenant= query parameter (works in all environments)
    if (tenantParam) {
      console.log(`Resolving tenant by query parameter: ${tenantParam}`);

      try {
        const tenant = await fetchTenantByDomain(tenantParam);
        return { tenant, error: null };
      } catch (error) {
        return {
          tenant: null,
          error: `Tenant not found for query parameter: ${tenantParam}`,
        };
      }
    }

    // PRIORITY 2: Development mode default
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const defaultTenant = 'ledgerly';
      console.log(`Development mode: Using default tenant "${defaultTenant}"`);

      try {
        const tenant = await fetchTenantByDomain(defaultTenant);
        return { tenant, error: null };
      } catch (error) {
        return {
          tenant: null,
          error: `Development mode: Tenant "${defaultTenant}" not found. Use ?tenant=subdomain to specify a different tenant.`,
        };
      }
    }

    // PRIORITY 3: Extract subdomain from hostname
    const subdomain = extractSubdomain(hostname);

    if (subdomain) {
      console.log(`Resolving tenant by subdomain: ${subdomain}`);

      try {
        const tenant = await fetchTenantByDomain(subdomain);
        return { tenant, error: null };
      } catch (error) {
        return {
          tenant: null,
          error: `Tenant not found for subdomain: ${subdomain}`,
        };
      }
    }

    // PRIORITY 4: Try custom domain
    console.log(`Resolving tenant by custom domain: ${hostname}`);

    try {
      const tenant = await fetchTenantByDomain(hostname);
      return { tenant, error: null };
    } catch (error) {
      return {
        tenant: null,
        error: `No tenant configured for domain: ${hostname}`,
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
