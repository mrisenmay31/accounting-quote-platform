import React from 'react';
import { Calculator } from 'lucide-react';

interface TenantLogoProps {
  logoUrl: string | null;
  firmName: string;
  className?: string;
}

const TenantLogo: React.FC<TenantLogoProps> = ({ logoUrl, firmName, className = '' }) => {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${firmName} logo`}
        className={`object-contain ${className}`}
        onError={(e) => {
          console.warn('Failed to load tenant logo, falling back to icon');
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  return (
    <div className={`bg-emerald-600 rounded-lg flex items-center justify-center ${className}`}>
      <Calculator className="w-6 h-6 text-white" />
    </div>
  );
};

export default TenantLogo;
