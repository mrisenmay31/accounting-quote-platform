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
    // TEMPORARY HARDCODE FOR TESTING - REVERT BEFORE PRODUCTION
    const hardcodedTenant = 'elevatedtax';
    console.log(`[TESTING] Hardcoded tenant resolution: ${hardcodedTenant}`);

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
