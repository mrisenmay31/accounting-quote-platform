import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TenantConfig } from '../utils/tenantService';
import { resolveTenant } from '../utils/tenantResolver';
import { applyTheme } from '../utils/themeApplier';

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
      } else {
        setTenant(result.tenant);
        applyTheme(result.tenant);

        if (result.tenant.firmName) {
          document.title = `${result.tenant.firmName} - Quote Calculator`;
        }
      }
    } catch (err) {
      console.error('Error loading tenant:', err);
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
