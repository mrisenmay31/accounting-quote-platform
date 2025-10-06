import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TenantConfig } from '../utils/tenantService';
import { resolveTenant } from '../utils/tenantResolver';
import { applyTheme } from '../utils/themeApplier';
import { getFirmInfo } from '../utils/firmInfoService';

interface TenantContextValue {
  tenant: TenantConfig | null;
  isLoading: boolean;
  error: string | null;
  refetchTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export const useTenant = (): TenantContextValue => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTenant = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await resolveTenant();

      if (result.error || !result.tenant) {
        setError(result.error || 'Failed to load tenant configuration');
        setTenant(null);
        setIsLoading(false);
        return;
      }

      let tenantConfig = result.tenant;

      console.log('[TenantContext] Base tenant config loaded from Supabase', {
        subdomain: tenantConfig.subdomain,
        firmName: tenantConfig.firmName,
        primaryColor: tenantConfig.primaryColor,
        secondaryColor: tenantConfig.secondaryColor
      });

      // Fetch dynamic branding from Airtable Firm Info table
      if (tenantConfig.airtable.servicesBaseId && tenantConfig.airtable.servicesApiKey) {
        console.log('[TenantContext] Fetching Firm Info from Airtable...');

        const firmInfo = await getFirmInfo(
          tenantConfig.airtable.servicesBaseId,
          tenantConfig.airtable.servicesApiKey
        );

        if (firmInfo) {
          console.log('[TenantContext] Merging Airtable Firm Info with Supabase config', {
            airtableFirmName: firmInfo.firmName,
            airtablePrimaryColor: firmInfo.primaryBrandColor,
            airtableSecondaryColor: firmInfo.secondaryBrandColor
          });

          // Merge Airtable branding over Supabase defaults
          tenantConfig = {
            ...tenantConfig,
            firmName: firmInfo.firmName || tenantConfig.firmName,
            primaryColor: (firmInfo.primaryBrandColor || tenantConfig.primaryColor).replace('#', ''),
            secondaryColor: (firmInfo.secondaryBrandColor || tenantConfig.secondaryColor).replace('#', ''),
          };

          console.log('[TenantContext] Final merged tenant config', {
            firmName: tenantConfig.firmName,
            primaryColor: tenantConfig.primaryColor,
            secondaryColor: tenantConfig.secondaryColor
          });
        } else {
          console.log('[TenantContext] Firm Info fetch failed or returned null - using Supabase defaults');
        }
      } else {
        console.log('[TenantContext] No Airtable credentials - using Supabase config only');
      }

      setTenant(tenantConfig);
      applyTheme(tenantConfig);

      if (tenantConfig.firmName) {
        document.title = `${tenantConfig.firmName} - Quote Calculator`;
      }
    } catch (err) {
      console.error('[TenantContext] Error loading tenant:', err);
      setError('An unexpected error occurred while loading the application');
      setTenant(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTenant();
  }, []);

  const refetchTenant = async () => {
    await loadTenant();
  };

  const value: TenantContextValue = {
    tenant,
    isLoading,
    error,
    refetchTenant,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};
