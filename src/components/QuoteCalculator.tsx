import React, { useState } from 'react';
import { useMemo, useEffect } from 'react';
import { Calculator, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import StepIndicator from './StepIndicator';
import ContactForm from './ContactForm';
import ContactFormDynamic from './ContactFormDynamic';
import ServiceSelection from './ServiceSelection';
import AdvisorySalesPage from './AdvisorySalesPage';
import IndividualTaxDetails from './IndividualTaxDetails';
import IndividualTaxDynamic from './IndividualTaxDynamic';
import AdditionalServicesDetails from './AdditionalServicesDetails';
import DynamicServiceDetailStep from './DynamicServiceDetailStep';
import QuoteResults from './QuoteResults';
import TenantLogo from './TenantLogo';
import { FormData, QuoteData } from '../types/quote';
import { calculateQuote } from '../utils/quoteCalculator';
import { getCachedPricingConfig, PricingConfig } from '../utils/pricingService';
import { getCachedServiceConfig, ServiceConfig } from '../utils/serviceConfigService';
import { sendQuoteToZapierWebhook } from '../utils/zapierIntegration';
import { useTenant } from '../contexts/TenantContext';
import { saveQuote } from '../utils/quoteStorage';
import { fetchFormFields, FormField, getCachedFormFields } from '../utils/formFieldsService';
import { createQuoteRecord } from '../utils/airtableWriteService';
import { syncFormFieldsToClientQuotes } from '../utils/airtableSchemaService';

// Feature flag: Set to true to use dynamic Airtable form fields for Individual Tax
const USE_DYNAMIC_INDIVIDUAL_TAX = true;

// Feature flag: Set to true to use dynamic Airtable form fields for Contact Info
const USE_DYNAMIC_CONTACT_FORM = true;

const QuoteCalculator: React.FC = () => {
  const { tenant, firmInfo } = useTenant();
  const [currentStep, setCurrentStep] = useState(1);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig[]>([]);
  const [serviceConfig, setServiceConfig] = useState<ServiceConfig[]>([]);
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [isSubmittingInitialQuote, setIsSubmittingInitialQuote] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    // Contact Information - Dynamic
    contactInfo: {},

    // Contact Information - Legacy (backward compatibility)
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
      selectedAdditionalServices: [],
      specializedFilings: []
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

    // Add service-specific detail pages dynamically based on hasDetailForm
    if (formData.services.length > 0 && serviceConfig.length > 0) {
      // Get selected services with their config
      const selectedServiceConfigs = formData.services
        .map(serviceId => serviceConfig.find(s => s.serviceId === serviceId))
        .filter(Boolean) as ServiceConfig[];

      // Handle advisory specially (no detail form but has sales page)
      const hasAdvisory = formData.services.includes('advisory');
      if (hasAdvisory) {
        stepSequence.push('advisory-sales');
      }

      // Handle additional-services specially (has custom component)
      const hasAdditionalServices = formData.services.includes('additional-services');

      // Add all services with hasDetailForm = true
      selectedServiceConfigs.forEach(service => {
        if (service.serviceId !== 'advisory' && service.serviceId !== 'additional-services') {
          if (service.hasDetailForm) {
            stepSequence.push(service.serviceId);
          }
        }
      });

      // Add additional-services at the end if selected
      if (hasAdditionalServices) {
        stepSequence.push('additional-services');
      }
    }

    // Always end with quote
    stepSequence.push('quote');

    return stepSequence;
  }, [formData.services, serviceConfig]);

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
        default:
          // For dynamic services, check if they have detail forms
          const dynamicService = serviceConfig.find(s => s.serviceId === componentType);
          if (dynamicService && dynamicService.hasDetailForm) {
            // Tax services go to step 3, other services to step 4
            return componentType.includes('tax') ? 3 : 4;
          }
          return 1;
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
  }, [currentStep, steps, serviceConfig]);

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

  // Automatic schema synchronization - runs once on app initialization
  useEffect(() => {
    const initializeSchemaSync = async () => {
      if (!tenant) return;

      try {
        console.log('[QuoteCalculator] Initiating automatic schema sync...');

        const airtableConfig = {
          baseId: tenant.airtable.servicesBaseId || tenant.airtable.pricingBaseId,
          apiKey: tenant.airtable.servicesApiKey || tenant.airtable.pricingApiKey,
        };

        // Fetch form fields for all services, including contact-info
        const services = ['contact-info', 'individual-tax', 'business-tax', 'bookkeeping', 'additional-services'];
        const allFormFields: FormField[] = [];

        for (const serviceId of services) {
          try {
            const fields = await getCachedFormFields(airtableConfig, serviceId);
            allFormFields.push(...fields);
            console.log(`[QuoteCalculator] Loaded ${fields.length} fields for ${serviceId}`);
          } catch (error) {
            console.warn(`[QuoteCalculator] Could not load fields for ${serviceId}:`, error);
            // Continue with other services even if one fails
          }
        }

        if (allFormFields.length === 0) {
          console.log('[QuoteCalculator] No form fields found, skipping schema sync');
          return;
        }

        console.log(`[QuoteCalculator] Found ${allFormFields.length} total form fields`);

        // Run schema sync in background (non-blocking)
        const syncResult = await syncFormFieldsToClientQuotes(tenant, allFormFields);

        // Log summary
        if (syncResult.fieldsCreated > 0) {
          console.log(`[QuoteCalculator] ✅ Schema sync complete: ${syncResult.fieldsCreated} new fields created in Client Quotes table`);
        } else if (syncResult.errors.length > 0) {
          console.warn(`[QuoteCalculator] ⚠️ Schema sync completed with ${syncResult.errors.length} errors`);
        } else {
          console.log('[QuoteCalculator] ✅ Schema sync complete: All fields already exist');
        }

      } catch (error) {
        // Don't block app loading - schema sync is non-critical
        console.error('[QuoteCalculator] Schema sync failed (non-critical):', error);
      }
    };

    // Only run schema sync once when tenant is loaded
    if (tenant) {
      initializeSchemaSync();
    }
  }, [tenant]); // Run only when tenant changes (once on mount)

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

      console.log('=== QUOTE SUBMISSION STARTED ===');
      console.log('Timestamp:', new Date().toISOString());

      // Step 1: Write directly to Airtable (PRIMARY METHOD)
      console.log('[Quote Submission] Step 1: Writing to Airtable via direct API...');

      const airtableConfig = {
        baseId: tenant.airtable.quotesBaseId || tenant.airtable.servicesBaseId,
        apiKey: tenant.airtable.quotesApiKey || tenant.airtable.servicesApiKey,
        tableName: tenant.airtable.quotesTableName || 'Client Quotes',
      };

      console.log('[Quote Submission] Using Airtable configuration:', {
        baseId: airtableConfig.baseId,
        tableName: airtableConfig.tableName,
        hasCustomQuotesBase: !!tenant.airtable.quotesBaseId,
      });

      const airtableResult = await createQuoteRecord(
        airtableConfig,
        formData,
        quote,
        tenant.id,
        undefined,
        tenant
      );

      let generatedQuoteId = airtableResult.quoteId;

      if (airtableResult.success) {
        console.log('[Quote Submission] ✓ Airtable write successful!');
        console.log('[Quote Submission] Quote ID:', airtableResult.quoteId);
        console.log('[Quote Submission] Record ID:', airtableResult.recordId);

        // Log warnings if any fields were skipped
        if (airtableResult.warnings && airtableResult.warnings.length > 0) {
          console.log('[Quote Submission] ⚠️ Some fields were skipped due to validation issues:');
          airtableResult.warnings.forEach(warning => console.log(`   ${warning}`));
        }

        if (airtableResult.skippedFields && airtableResult.skippedFields.length > 0) {
          console.log('[Quote Submission] 📋 Skipped field names:', airtableResult.skippedFields.join(', '));
        }

        setQuoteId(airtableResult.quoteId);
      } else {
        console.error('[Quote Submission] ✗ Airtable write failed:', airtableResult.error);
        console.log('[Quote Submission] Attempting fallback to Zapier webhook...');

        // Step 2: Fallback to Zapier webhook (LEGACY SUPPORT)
        let allFormFields: FormField[] = [];
        try {
          const formFieldsPromises = formData.services.map(serviceId =>
            fetchFormFields(tenant, serviceId)
          );
          const formFieldsArrays = await Promise.all(formFieldsPromises);
          allFormFields = formFieldsArrays.flat();
          console.log(`[Quote Submission] Fetched ${allFormFields.length} form field definitions for Zapier`);
        } catch (error) {
          console.warn('[Quote Submission] Could not fetch form field definitions:', error);
        }

        const zapierResult = await sendQuoteToZapierWebhook(
          formData,
          quote,
          pricingConfig,
          tenant.id,
          tenant.zapierWebhookUrl,
          allFormFields,
          'new'
        );

        if (zapierResult.success && zapierResult.quoteId) {
          console.log('[Quote Submission] ✓ Zapier webhook fallback successful!');
          console.log('[Quote Submission] Quote ID:', zapierResult.quoteId);
          generatedQuoteId = zapierResult.quoteId;
          setQuoteId(zapierResult.quoteId);
        } else {
          console.error('[Quote Submission] ✗ Zapier webhook fallback also failed');
        }
      }

      // Step 3: Save quote to Supabase database (always attempt)
      if (generatedQuoteId) {
        console.log('[Quote Submission] Step 3: Saving to Supabase database...');
        await saveQuote({
          tenantId: tenant.id,
          formData,
          quoteData: quote,
          tenant: tenant,
          quoteId: generatedQuoteId,
        });
        console.log('[Quote Submission] ✓ Supabase save complete');
      }

      console.log('=== QUOTE SUBMISSION COMPLETED ===');

      // Advance to quote results page regardless of write success/failure
      nextStep();
    } catch (error) {
      console.error('[Quote Submission] Unexpected error during quote submission:', error);
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
      contactInfo: {},
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
        selectedAdditionalServices: [],
        specializedFilings: []
      }
    });

    // Clear quote data
    setQuote(null);

    // Clear quote ID
    setQuoteId(null);

    // Clear localStorage
    localStorage.removeItem('quoteData');
    localStorage.removeItem('currentQuote');

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
    // For additional services with specializedFilings, only validate selections, no conditional fields needed
    return true;
  };

  // Check if current step is the last detail step before quote
  const isLastDetailStep = currentStep === totalSteps - 1 && currentStepType !== 'quote';


  const renderStep = () => {
    switch (currentStepType) {
      case 'contact':
        if (USE_DYNAMIC_CONTACT_FORM) {
          return (
            <ContactFormDynamic
              formData={formData}
              updateFormData={updateFormData}
              onNext={nextStep}
            />
          );
        } else {
          return (
            <ContactForm
              formData={formData}
              updateFormData={updateFormData}
            />
          );
        }
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
      case 'business-tax':
      case 'bookkeeping':
        // Use universal dynamic component for all services with hasDetailForm
        return (
          <DynamicServiceDetailStep
            serviceId={currentStepType}
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
            quoteId={quoteId}
            pricingConfig={pricingConfig}
            serviceConfig={serviceConfig}
            onRecalculate={resetQuote}
          />
        );
      default:
        // Handle any other dynamic service with hasDetailForm
        const dynamicService = serviceConfig.find(s => s.serviceId === currentStepType && s.hasDetailForm);
        if (dynamicService) {
          return (
            <DynamicServiceDetailStep
              serviceId={currentStepType}
              formData={formData}
              updateFormData={updateFormData}
              serviceConfig={serviceConfig}
            />
          );
        }

        // Fallback to contact form
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

          {/* Navigation - Hide for dynamic contact form (it has internal navigation) */}
          {currentStep < totalSteps && currentStepType !== 'quote' && !(USE_DYNAMIC_CONTACT_FORM && currentStepType === 'contact') && (
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