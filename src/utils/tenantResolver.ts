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

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const defaultTenant = getDefaultTenantForDevelopment();
      console.log(`Development mode: Using tenant "${defaultTenant}"`);

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
