import React, { useState } from 'react';
import { useMemo, useEffect } from 'react';
import { Calculator, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import StepIndicator from './StepIndicator';
import ContactForm from './ContactForm';
import ServiceSelection from './ServiceSelection';
import AdvisorySalesPage from './AdvisorySalesPage';
import IndividualTaxDetails from './IndividualTaxDetails';
import BusinessTaxDetails from './BusinessTaxDetails';
import BookkeepingDetails from './BookkeepingDetails';
import AdditionalServicesDetails from './AdditionalServicesDetails';
import QuoteResults from './QuoteResults';
import TenantLogo from './TenantLogo';
import { FormData, QuoteData } from '../types/quote';
import { calculateQuote } from '../utils/quoteCalculator';
import { getCachedPricingConfig, PricingConfig } from '../utils/pricingService';
import { getCachedServiceConfig, ServiceConfig } from '../utils/serviceConfigService';
import { sendQuoteToZapierWebhook } from '../utils/zapierIntegration';
import { useTenant } from '../contexts/TenantContext';
import { saveQuote } from '../utils/quoteStorage';

const QuoteCalculator: React.FC = () => {
  const { tenant, firmInfo } = useTenant();
  const [currentStep, setCurrentStep] = useState(1);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig[]>([]);
  const [serviceConfig, setServiceConfig] = useState<ServiceConfig[]>([]);
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [isSubmittingInitialQuote, setIsSubmittingInitialQuote] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    // Contact Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    
    // Service Selection
    services: [],
    
    // Individual Tax Details
    individualTax: {
      filingStatus: '',
      annualIncome: '',
      incomeTypes: [],
      deductionType: '',
      taxSituations: [],
      hasRentalProperty: false,
      hasInvestments: false,
      hasBusinessIncome: false,
      hasMultipleStates: false,
      needsTaxPlanning: false,
      taxYear: '',
      timeline: '',
      previousPreparer: '',
      specialCircumstances: ''
    },
    
    // Business Tax Details
    businessTax: {
      businessName: '',
      businessType: '',
      annualRevenue: '',
      numberOfEmployees: '',
      taxYear: '',
      complexity: '',
      taxSituations: [],
      needsQuarterlyFilings: false,
      hasSalesTax: false,
      timeline: '',
      previousPreparer: '',
      specialCircumstances: ''
    },
    
    // Additional Services Details
    additionalServices: {
      selectedAdditionalServices: []
    },
    bookkeeping: {
      businessName: '',
      businessType: '',
      businessIndustry: '',
      annualRevenue: '',
      numberOfEmployees: '',
      currentBookkeepingMethod: '',
      transactionVolume: '',
      servicesNeeded: [],
      frequency: '',
      needsCleanup: false,
      hasInventory: false,
      needsPayrollIntegration: false,
      startTimeline: '',
      challenges: ''
    }
  });

  // Build dynamic step sequence based on selected services
  const steps = useMemo(() => {
    const stepSequence = [];
    
    // Always start with contact and services
    stepSequence.push('contact', 'services');
    
    // Add service-specific detail pages in priority order
    const hasAdvisory = formData.services.includes('advisory');
    const hasIndividualTax = formData.services.includes('individual-tax');
    const hasBusinessTax = formData.services.includes('business-tax');
    const hasBookkeeping = formData.services.includes('bookkeeping');
    const hasAdditionalServices = formData.services.includes('additional-services');
    
    if (hasAdvisory) stepSequence.push('advisory-sales');
    if (hasIndividualTax) stepSequence.push('individual-tax');
    if (hasBusinessTax) stepSequence.push('business-tax');
    if (hasBookkeeping) stepSequence.push('bookkeeping');
    if (hasAdditionalServices) stepSequence.push('additional-services');
    
    // Always end with quote
    stepSequence.push('quote');
    
    return stepSequence;
  }, [formData.services]);

  const totalSteps = steps.length;
  const currentStepType = steps[currentStep - 1];

  // Define static conceptual steps that are always shown in the progress bar
  const conceptualSteps = [
    { number: 1, title: 'Contact Info', description: 'Your details' },
    { number: 2, title: 'Services', description: 'What you need' },
    { number: 3, title: 'Tax Details', description: 'Your tax situation' },
    { number: 4, title: 'Business Info', description: 'Business details' },
    { number: 5, title: 'Your Quote', description: 'Customized pricing' }
  ];

  // Calculate which conceptual step should be highlighted based on the current component sequence
  const currentConceptualStepNumber = useMemo(() => {
    // Map component types to conceptual step numbers
    const componentToConceptualStep = (componentType: string): number => {
      switch (componentType) {
        case 'contact': return 1;
        case 'services': return 2;
        case 'advisory-sales':
        case 'individual-tax':
        case 'business-tax': return 3;
        case 'bookkeeping':
        case 'additional-services': return 4;
        case 'quote': return 5;
        default: return 1;
      }
    };

    // Find the maximum conceptual step reached in the current sequence up to the current step
    let maxConceptualStep = 1;
    for (let i = 0; i < currentStep; i++) {
      if (i < steps.length) {
        const conceptualStepForComponent = componentToConceptualStep(steps[i]);
        maxConceptualStep = Math.max(maxConceptualStep, conceptualStepForComponent);
      }
    }
    
    return maxConceptualStep;
  }, [currentStep, steps]);

  // Load pricing configuration on component mount
  useEffect(() => {
    const loadConfigurations = async () => {
      if (!tenant) return;

      try {
        setIsLoadingPricing(true);
        setIsLoadingServices(true);

        const airtableConfig = {
          baseId: tenant.airtable.pricingBaseId,
          apiKey: tenant.airtable.pricingApiKey,
        };

        const servicesConfig = {
          baseId: tenant.airtable.servicesBaseId,
          apiKey: tenant.airtable.servicesApiKey,
        };

        // Load pricing and service configurations in parallel
        const [pricingData, serviceData] = await Promise.all([
          getCachedPricingConfig(airtableConfig),
          getCachedServiceConfig(servicesConfig)
        ]);

        setPricingConfig(pricingData);
        setServiceConfig(serviceData);
      } catch (error) {
        console.error('Failed to load configurations:', error);
        // Components will use default configurations
      } finally {
        setIsLoadingPricing(false);
        setIsLoadingServices(false);
      }
    };

    loadConfigurations();
  }, [tenant]);

  const updateFormData = (updates: Partial<FormData>) => {
    const newFormData = { ...formData, ...updates };
    setFormData(newFormData);
    
    // Calculate quote in real-time if we have enough data
    if (newFormData.services.length > 0 && !isLoadingPricing) {
      const calculatedQuote = calculateQuote(newFormData, pricingConfig, serviceConfig);
      setQuote(calculatedQuote);
    }
  };

  // Recalculate quote when pricing config is loaded
  useEffect(() => {
    if (formData.services.length > 0 && !isLoadingPricing && pricingConfig.length > 0) {
      const calculatedQuote = calculateQuote(formData, pricingConfig, serviceConfig);
      setQuote(calculatedQuote);
    }
  }, [pricingConfig, serviceConfig, isLoadingPricing, formData]);

  const handleGetQuoteAndSubmit = async () => {
    setIsSubmittingInitialQuote(true);

    try {
      if (!quote || !tenant) {
        console.warn('Quote data or tenant is not available for submission');
        return;
      }

      // Save quote to database
      await saveQuote({
        tenantId: tenant.id,
        formData,
        quoteData: quote,
        tenant: tenant,
      });

      // Send quote data to tenant's Zapier webhook
      const webhookResult = await sendQuoteToZapierWebhook(formData, quote, tenant.zapierWebhookUrl);

      // Capture and store the Record ID if returned
      if (webhookResult.recordId) {
        localStorage.setItem('currentQuoteRecordId', webhookResult.recordId);
        console.log('✅ Quote Record ID saved to localStorage:', webhookResult.recordId);
      } else {
        console.warn('⚠️ Warning: No Record ID returned from Zapier webhook');
      }

      // Advance to quote results page regardless of webhook success/failure
      nextStep();
    } catch (error) {
      console.error('Error during quote submission:', error);
      // Still advance to quote results page
      nextStep();
    } finally {
      setIsSubmittingInitialQuote(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetQuote = () => {
    // Reset all form data to initial state
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      services: [],
      individualTax: {
        filingStatus: '',
        annualIncome: '',
        incomeTypes: [],
        deductionType: '',
        taxSituations: [],
        otherIncomeTypes: [],
        additionalConsiderations: [],
        interestDividendAmount: '',
        selfEmploymentBusinessCount: 0,
        k1Count: 0,
        rentalPropertyCount: 0,
        additionalStateCount: 0,
        hasPrimaryHomeSale: false,
        hasInvestmentPropertySale: false,
        hasAdoptedChild: false,
        hasDivorce: false,
        hasMarriage: false,
        hasMultipleStates: false,
        taxYear: '',
        timeline: '',
        previousPreparer: '',
        specialCircumstances: '',
        otherIncomeDescription: '',
        hasOtherIncome: ''
      },
      businessTax: {
        businessName: '',
        businessType: '',
        annualRevenue: '',
        numberOfEmployees: '',
        entityType: '',
        businessIndustry: '',
        numberOfOwners: 0,
        otherSituations: [],
        additionalConsiderations: [],
        additionalStateCount: 0,
        fixedAssetAcquisitionCount: 0,
        taxYear: '',
        complexity: '',
        taxSituations: [],
        isFirstYearEntity: false,
        hasOwnershipChanges: false,
        hasFixedAssetAcquisitions: false,
        timeline: '',
        previousPreparer: '',
        specialCircumstances: ''
      },
      bookkeeping: {
        businessName: '',
        businessType: '',
        businessIndustry: '',
        annualRevenue: '',
        numberOfEmployees: '',
        currentBookkeepingMethod: '',
        currentStatus: '',
        monthsBehind: '',
        bankAccounts: 0,
        creditCards: 0,
        bankLoans: 0,
        transactionVolume: 0,
        monthlyTransactions: 0,
        servicesNeeded: [],
        frequency: '',
        servicefrequency: '',
        additionalConsiderations: [],
        needsCleanup: false,
        hasThirdPartyIntegration: false,
        hasFixedAssets: false,
        fixedAssetsCount: 0,
        fixedassets: 0,
        cleanuphours: 0,
        hasInventory: false,
        startTimeline: '',
        challenges: ''
      },
      additionalServices: {
        selectedAdditionalServices: []
      }
    });

    // Clear quote data
    setQuote(null);

    // Clear localStorage
    localStorage.removeItem('quoteData');
    localStorage.removeItem('currentQuote');
    localStorage.removeItem('currentQuoteRecordId');

    // Clear sessionStorage
    sessionStorage.removeItem('quoteData');
    sessionStorage.removeItem('currentQuote');

    // Reset to step 1
    setCurrentStep(1);

    // Scroll to top
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [currentStep]);

  const canProceed = () => {
    return true;
  };

  // Check if current step is the last detail step before quote
  const isLastDetailStep = currentStep === totalSteps - 1 && currentStepType !== 'quote';


  const renderStep = () => {
    switch (currentStepType) {
      case 'contact':
        return (
          <ContactForm 
            formData={formData} 
            updateFormData={updateFormData} 
          />
        );
      case 'services':
        return (
          <ServiceSelection 
            formData={formData} 
            updateFormData={updateFormData}
            services={serviceConfig}
            isLoading={isLoadingServices}
          />
        );
      case 'advisory-sales':
        return (
          <AdvisorySalesPage 
            formData={formData} 
            updateFormData={updateFormData} 
          />
        );
      case 'individual-tax':
        return (
          <IndividualTaxDetails
            formData={formData}
            updateFormData={updateFormData}
            serviceConfig={serviceConfig}
          />
        );
      case 'business-tax':
        return (
          <BusinessTaxDetails
            formData={formData}
            updateFormData={updateFormData}
            serviceConfig={serviceConfig}
          />
        );
      case 'bookkeeping':
        return (
          <BookkeepingDetails
            formData={formData}
            updateFormData={updateFormData}
            serviceConfig={serviceConfig}
          />
        );
      case 'additional-services':
        return (
          <AdditionalServicesDetails 
            formData={formData} 
            updateFormData={updateFormData}
            pricingConfig={pricingConfig}
            serviceConfig={serviceConfig}
            isLoading={isLoadingPricing}
          />
        );
      case 'quote':
        return (
          <QuoteResults
            formData={formData}
            quote={quote}
            onRecalculate={resetQuote}
          />
        );
      default:
        return (
          <ContactForm 
            formData={formData} 
            updateFormData={updateFormData} 
          />
        );
    }
  };

  if (!tenant) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b" style={{ borderColor: 'var(--tenant-primary-100, #e5e7eb)' }}>
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center space-x-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--primary-color, #10b981)' }}
            >
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {tenant.firmName} {firmInfo?.toolName || 'Quote Calculator'}
              </h1>
              <p className="font-medium" style={{ color: 'var(--tenant-primary-600, #10b981)' }}>
                {firmInfo?.toolTagline || tenant.firmTagline || 'Get your personalized tax & accounting quote'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-xl border overflow-hidden" style={{ borderColor: 'var(--tenant-primary-100, #e5e7eb)' }}>
          {/* Step Indicator */}
          <div className="px-8 py-6" style={{ background: `linear-gradient(to right, var(--tenant-primary-600, #10b981), var(--tenant-primary-700, #059669))` }}>
            <StepIndicator 
              steps={conceptualSteps}
              currentStep={currentConceptualStepNumber} 
              totalSteps={conceptualSteps.length} 
            />
          </div>

          {/* Form Content */}
          <div className="p-8">
            {renderStep()}
          </div>

          {/* Navigation */}
          {currentStep < totalSteps && currentStepType !== 'quote' && (
            <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center space-x-4">
                  {isLastDetailStep ? (
                    <button
                      onClick={handleGetQuoteAndSubmit}
                      disabled={!canProceed() || isSubmittingInitialQuote}
                      className="flex items-center space-x-2 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                      style={{
                        backgroundColor: 'var(--tenant-primary-600, #10b981)',
                      }}
                      onMouseEnter={(e) => !isSubmittingInitialQuote && (e.currentTarget.style.backgroundColor = 'var(--tenant-primary-700, #059669)')}
                      onMouseLeave={(e) => !isSubmittingInitialQuote && (e.currentTarget.style.backgroundColor = 'var(--tenant-primary-600, #10b981)')}
                    >
                      {isSubmittingInitialQuote ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <span>Get Quote</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={nextStep}
                      disabled={!canProceed()}
                      className="flex items-center space-x-2 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                      style={{
                        backgroundColor: 'var(--tenant-primary-600, #10b981)',
                      }}
                      onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'var(--tenant-primary-700, #059669)')}
                      onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'var(--tenant-primary-600, #10b981)')}
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" style={{ color: 'var(--tenant-primary-600, #10b981)' }} />
              <span>Secure & Confidential</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" style={{ color: 'var(--tenant-primary-600, #10b981)' }} />
              <span>No Obligation</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" style={{ color: 'var(--tenant-primary-600, #10b981)' }} />
              <span>Instant Quote</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteCalculator;