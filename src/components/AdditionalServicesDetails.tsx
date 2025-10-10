import React, { useEffect } from 'react';
import { FileText, CheckCircle } from 'lucide-react';
import { FormData, PricingConfig, ServiceConfig } from '../types/quote';

interface AdditionalServicesDetailsProps {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  pricingConfig: PricingConfig[];
  serviceConfig: ServiceConfig[];
  isLoading?: boolean;
}

const AdditionalServicesDetails: React.FC<AdditionalServicesDetailsProps> = ({
  formData,
  updateFormData,
  pricingConfig,
  serviceConfig,
  isLoading = false
}) => {
  // Filter pricing config for additional services with active status
  const additionalServiceRules = pricingConfig.filter(rule =>
    rule.serviceId === 'additional-services' &&
    rule.active
  );

  // DEBUG: Log pricing rules on mount and when they change
  useEffect(() => {
    console.log('=== ADDITIONAL SERVICES DEBUG ===');
    console.log('Total Pricing Rules:', pricingConfig.length);
    console.log('Additional Service Rules:', additionalServiceRules.length);
    console.log('Additional Service Rules Detail:', additionalServiceRules.map(rule => ({
      pricingRuleId: rule.pricingRuleId,
      serviceName: rule.serviceName,
      pricingType: rule.pricingType,
      basePrice: rule.basePrice,
      perUnitPricing: rule.perUnitPricing,
      unitPrice: rule.unitPrice,
      unitName: rule.unitName,
      billingFrequency: rule.billingFrequency
    })));
    console.log('=================================');
  }, [pricingConfig, additionalServiceRules]);

  // DEBUG: Log form state changes
  useEffect(() => {
    console.log('=== FORM STATE DEBUG ===');
    console.log('Current specializedFilings:', formData.additionalServices?.specializedFilings);
    console.log('Current selectedAdditionalServices:', formData.additionalServices?.selectedAdditionalServices);
    console.log('========================');
  }, [formData.additionalServices]);

  /**
   * Toggle specialized filing selection
   * Updates the specializedFilings array in formData.additionalServices
   */
  const toggleSpecializedFiling = (serviceName: string) => {
    const current = formData.additionalServices?.specializedFilings || [];
    const isSelected = current.includes(serviceName);

    console.log('=== TOGGLE SPECIALIZED FILING ===');
    console.log('Service Name:', serviceName);
    console.log('Current Selection:', current);
    console.log('Is Selected:', isSelected);

    // Add or remove from array based on current selection
    const updated = isSelected
      ? current.filter(s => s !== serviceName)
      : [...current, serviceName];

    console.log('Updated Selection:', updated);
    console.log('=================================');

    // Update form data with new selection
    updateFormData({
      additionalServices: {
        ...formData.additionalServices,
        selectedAdditionalServices: formData.additionalServices?.selectedAdditionalServices || [],
        specializedFilings: updated
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Additional Services
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Loading available services...
          </p>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  // Show message if no services are available
  if (additionalServiceRules.length === 0) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Additional Services
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            No additional services are currently available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Additional Services
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Select any additional professional services you need. Pricing details will be shown in your quote summary.
        </p>
      </div>

      {/*
        SPECIALIZED FILINGS - MULTI-SELECT CHECKBOXES
        PRICING DISPLAYS REMOVED PER REQUIREMENTS
        Only showing: checkbox, service name, and description
      */}
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <FileText className="w-6 h-6 text-emerald-600" />
          <h3 className="text-2xl font-bold text-gray-900">Specialized Filings & Services</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {additionalServiceRules.map((service) => {
            // Check if this service is currently selected
            // IMPORTANT: Uses exact string matching with service.serviceName
            const isSelected = (formData.additionalServices?.specializedFilings || []).includes(service.serviceName);

            return (
              <button
                key={service.pricingRuleId}
                onClick={() => {
                  console.log('Checkbox clicked for:', service.serviceName);
                  toggleSpecializedFiling(service.serviceName);
                }}
                className={`p-5 text-left border-2 rounded-xl transition-all duration-200 ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                    : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Checkbox Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {isSelected ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded" />
                    )}
                  </div>

                  {/* Service Info - NAME AND DESCRIPTION ONLY */}
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-gray-900 mb-1">
                      {service.serviceName}
                    </h4>
                    {service.description && (
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {service.description}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/*
        REMOVED: 'Selected Specialized Services' Summary Box
        This section has been moved to the Quote Summary page
        per requirements
      */}

      {/* Information Box - Dynamically fetched from Airtable Services table */}
      {(() => {
        const additionalServicesConfig = serviceConfig.find(
          config => config.serviceId === 'additional-services'
        );

        const boxTitle = additionalServicesConfig?.includedFeaturesCardTitle ||
          'How Additional Services Work';
        const boxItems = additionalServicesConfig?.includedFeaturesCardList || [
          'One-time fees are charged once upon service completion',
          'Monthly services are billed on a recurring monthly basis',
          'Hourly services are billed based on actual time worked',
          'All services can be bundled with your regular package or purchased separately',
          'Advisory service clients receive 50% discount on eligible services',
          'Complete pricing breakdown will be shown in your quote summary'
        ];

        if (!boxItems || boxItems.length === 0) {
          return null;
        }

        return (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-emerald-800 mb-2">{boxTitle}</h3>
                <ul className="space-y-1 text-sm text-emerald-700">
                  {boxItems.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Debug Information - Shows in development mode only */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-xs">
          <h4 className="font-bold text-yellow-800 mb-2">Debug Information:</h4>
          <div className="space-y-1 text-yellow-700">
            <div>Total Services Available: {additionalServiceRules.length}</div>
            <div>Currently Selected: {formData.additionalServices?.specializedFilings?.length || 0}</div>
            <div>Selected Services: {(formData.additionalServices?.specializedFilings || []).join(', ') || 'None'}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdditionalServicesDetails;
