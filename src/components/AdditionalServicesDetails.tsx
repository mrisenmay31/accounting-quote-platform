import React from 'react';
import { FileText, Clock, Users, Calculator, CheckCircle, DollarSign } from 'lucide-react';
import { FormData, PricingConfig, ServiceConfig } from '../types/quote';
import IncludedFeaturesCard from './IncludedFeaturesCard';

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
  const currentService = serviceConfig?.find((s: ServiceConfig) => s.serviceId === 'additional-services');
  // Filter pricing config for additional services add-ons
  const additionalServiceRules = pricingConfig.filter(rule => 
    rule.serviceId === 'additional-services' && 
    rule.pricingType === 'Add-on' && 
    rule.active
  );
  
  // Categorize services based on service name
  const consultationServices = additionalServiceRules.filter(rule => 
    rule.serviceName.toLowerCase().includes('consultation') || 
    rule.serviceName.toLowerCase().includes('planning')
  );
  
  const specializedFilings = additionalServiceRules.filter(rule => 
    !rule.serviceName.toLowerCase().includes('consultation') && 
    !rule.serviceName.toLowerCase().includes('planning')
  );

  const toggleAdditionalService = (pricingRuleId: string) => {
    const current = formData.additionalServices?.selectedAdditionalServices || [];
    const isSelected = current.includes(pricingRuleId);
    
    const updated = isSelected
      ? current.filter(s => s !== pricingRuleId)
      : [...current, pricingRuleId];
    
    updateFormData({ 
      additionalServices: { 
        ...formData.additionalServices, 
        selectedAdditionalServices: updated 
      } 
    });
  };

  // Calculate price for a pricing rule
  const calculateServicePrice = (rule: PricingConfig): number => {
    if (rule.perUnitPricing && rule.unitPrice) {
      // For per-unit pricing, we'll use a default quantity of 1 unless specified
      return rule.unitPrice;
    }
    return rule.basePrice;
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

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Additional Services
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Select any additional professional services you need. These can be added to your package or purchased separately.
        </p>
      </div>

      {/* Consultations & Planning */}
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Users className="w-6 h-6 text-emerald-600" />
          <h3 className="text-2xl font-bold text-gray-900">Consultations & Planning</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {consultationServices.map((service) => {
            const isSelected = (formData.additionalServices?.selectedAdditionalServices || []).includes(service.pricingRuleId);
            const price = calculateServicePrice(service);
            return (
              <button
                key={service.pricingRuleId}
                onClick={() => toggleAdditionalService(service.pricingRuleId)}
                className={`p-6 text-left border-2 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                    : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-25'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{service.serviceName}</h4>
                      <p className="text-sm text-gray-500">${price}</p>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4">{service.description || 'Professional service consultation'}</p>
                
                {isSelected && (
                  <div className="flex items-center space-x-2 text-emerald-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Selected</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Specialized Filings */}
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <FileText className="w-6 h-6 text-emerald-600" />
          <h3 className="text-2xl font-bold text-gray-900">Specialized Filings</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {specializedFilings.map((service) => {
            const isSelected = (formData.additionalServices?.selectedAdditionalServices || []).includes(service.pricingRuleId);
            const price = calculateServicePrice(service);
            return (
              <button
                key={service.pricingRuleId}
                onClick={() => toggleAdditionalService(service.pricingRuleId)}
                className={`p-6 text-left border-2 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                    : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-25'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Calculator className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{service.serviceName}</h4>
                      <p className="text-sm text-gray-500">${price}</p>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4">{service.description || 'Specialized tax filing service'}</p>
                
                {isSelected && (
                  <div className="flex items-center space-x-2 text-emerald-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Selected</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Services Summary */}
      {(formData.additionalServices?.selectedAdditionalServices?.length || 0) > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
          <h3 className="font-semibold text-emerald-800 mb-3">Selected Additional Services:</h3>
          <div className="space-y-2">
            {(formData.additionalServices?.selectedAdditionalServices || []).map((pricingRuleId) => {
              const service = additionalServiceRules.find(s => s.pricingRuleId === pricingRuleId);
              const price = service ? calculateServicePrice(service) : 0;
              return (
                <div key={pricingRuleId} className="flex justify-between items-center">
                  <span className="text-emerald-700">{service?.serviceName}</span>
                  <span className="text-emerald-700 font-medium">${price}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Information Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">How Additional Services Work</h3>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Consultations can be scheduled at your convenience</li>
              <li>• All sessions include detailed follow-up documentation</li>
              <li>• Specialized filings include all necessary forms and IRS correspondence</li>
              <li>• Advisory service clients receive 50% discount on all additional services</li>
              <li>• Services can be bundled with your regular package or purchased separately</li>
            </ul>
          </div>
        </div>
      </div>

      <IncludedFeaturesCard
        title={currentService?.includedFeaturesCardTitle || ''}
        features={currentService?.includedFeaturesCardList || []}
      />
    </div>
  );
};

export default AdditionalServicesDetails;