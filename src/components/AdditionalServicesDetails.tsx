import React, { useEffect } from 'react';
import { FileText, CheckCircle } from 'lucide-react';
import { FormData, PricingConfig } from '../types/quote';

interface AdditionalServicesDetailsProps {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  pricingConfig: PricingConfig[];
  serviceConfig: any[];
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

  /**
   * Get display information for a service based on pricing type
   * Hourly services show rate per unit, others show base price
   */
  const getServiceDisplayInfo = (rule: PricingConfig) => {
    // Check if this is an hourly/per-unit pricing service
    if (rule.perUnitPricing && rule.unitPrice && rule.unitName) {
      console.log(`Service "${rule.serviceName}" is hourly: $${rule.unitPrice}/${rule.unitName}`);
      return {
        displayPrice: `$${rule.unitPrice}/${rule.unitName}`,
        type: 'Hourly Rate',
        isHourly: true
      };
    }

    // Fixed price service (one-time or monthly)
    console.log(`Service "${rule.serviceName}" is fixed price: $${rule.basePrice}`);
    return {
      displayPrice: `$${rule.basePrice}`,
      type: rule.billingFrequency,
      isHourly: false
    };
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
          Select any additional professional services you need. Hourly services will be billed based on actual time worked.
        </p>
      </div>

      {/* Specialized Filings - Multi-Select Checkboxes */}
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
            const displayInfo = getServiceDisplayInfo(service);

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
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    {/* Checkbox Icon and Service Name */}
                    <div className="flex items-center space-x-2 mb-1">
                      {isSelected ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded flex-shrink-0" />
                      )}
                      <h4 className="text-base font-semibold text-gray-900">{service.serviceName}</h4>
                    </div>

                    {/* Service Description */}
                    {service.description && (
                      <p className="text-sm text-gray-600 ml-7 mb-2">{service.description}</p>
                    )}

                    {/*
                      HOURLY RATE DISPLAY
                      This is where hourly rates are shown for AR Management, AP Management,
                      1099 Filing, and Schedule C Prep
                    */}
                    <div className="flex items-center space-x-3 ml-7">
                      <span className="text-lg font-bold text-emerald-700">
                        {displayInfo.displayPrice}
                      </span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        displayInfo.isHourly
                          ? 'bg-blue-100 text-blue-700'
                          : displayInfo.type === 'One-Time Fee'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {displayInfo.isHourly ? 'Hourly Billing' : displayInfo.type}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Services Summary - Shows what user has selected */}
      {(formData.additionalServices?.specializedFilings?.length || 0) > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
          <h3 className="font-semibold text-emerald-800 mb-3 flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>Selected Specialized Services:</span>
          </h3>
          <div className="space-y-2">
            {(formData.additionalServices?.specializedFilings || []).map((serviceName) => {
              // Find the pricing rule for this selected service
              const service = additionalServiceRules.find(s => s.serviceName === serviceName);
              if (!service) {
                console.warn(`Service not found in pricing rules: ${serviceName}`);
                return null;
              }

              const displayInfo = getServiceDisplayInfo(service);

              return (
                <div key={serviceName} className="flex justify-between items-center bg-white rounded-lg px-4 py-2">
                  <span className="text-emerald-700 font-medium">{serviceName}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-700 font-bold">{displayInfo.displayPrice}</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      displayInfo.isHourly
                        ? 'bg-blue-100 text-blue-700'
                        : displayInfo.type === 'One-Time Fee'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {displayInfo.isHourly ? 'Hourly' : displayInfo.type}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Information Box - Explains how services work */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">How Additional Services Work</h3>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• <strong>One-Time Fees:</strong> Fixed price services added to your quote</li>
              <li>• <strong>Monthly Services:</strong> Recurring services billed each month</li>
              <li>• <strong>Hourly Services:</strong> Billed based on actual hours worked - rates shown for transparency</li>
              <li>• <strong>No conditional fields needed:</strong> Simply select services to see hourly rates</li>
              <li>• All services can be bundled with your regular package or purchased separately</li>
              <li>• Advisory service clients receive 50% discount on eligible services</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Debug Information - Remove in production */}
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
