import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TenantConfig } from '../utils/tenantService';
import { resolveTenant } from '../utils/tenantResolver';
import { applyTheme } from '../utils/themeApplier';
import { getFirmInfo, FirmInfo } from '../utils/firmInfoService';

interface TenantContextValue {
  tenant: TenantConfig | null;
  firmInfo: FirmInfo | null;
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
  const [firmInfo, setFirmInfo] = useState<FirmInfo | null>(null);
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
        setFirmInfo(null);
        setIsLoading(false);
        return;
      }

      let tenantConfig = result.tenant;
      let loadedFirmInfo: FirmInfo | null = null;

      console.log('[TenantContext] Base tenant config loaded from Supabase', {
        subdomain: tenantConfig.subdomain,
        firmName: tenantConfig.firmName,
        primaryColor: tenantConfig.primaryColor,
        secondaryColor: tenantConfig.secondaryColor
      });

      // Fetch dynamic branding from Airtable Firm Info table
      if (tenantConfig.airtable.servicesBaseId && tenantConfig.airtable.servicesApiKey) {
        console.log('[TenantContext] Fetching Firm Info from Airtable...');

        loadedFirmInfo = await getFirmInfo(
          tenantConfig.airtable.servicesBaseId,
          tenantConfig.airtable.servicesApiKey
        );

        if (loadedFirmInfo) {
          console.log('[TenantContext] Merging Airtable Firm Info with Supabase config', {
            airtableFirmName: loadedFirmInfo.firmName,
            airtablePrimaryColor: loadedFirmInfo.primaryBrandColor,
            airtableSecondaryColor: loadedFirmInfo.secondaryBrandColor
          });

          // Merge Airtable branding over Supabase defaults
          tenantConfig = {
            ...tenantConfig,
            firmName: loadedFirmInfo.firmName || tenantConfig.firmName,
            primaryColor: (loadedFirmInfo.primaryBrandColor || tenantConfig.primaryColor).replace('#', ''),
            secondaryColor: (loadedFirmInfo.secondaryBrandColor || tenantConfig.secondaryColor).replace('#', ''),
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
      setFirmInfo(loadedFirmInfo);
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
    firmInfo,
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
