import { FormData, QuoteData, ServiceQuote, PricingConfig } from '../types/quote';

// Zapier webhook configuration (fallback to env var for development)
const ZAPIER_WEBHOOK_URL = import.meta.env.VITE_ZAPIER_WEBHOOK_URL || '';

// Helper function to map pricing rule IDs to Airtable Multiple Select option names
const mapPricingRuleToAirtableOption = (pricingRuleId: string): string | null => {
  const mappings: Record<string, string> = {
    'additional-services-accounts-receivable': 'Accounts Receivable Management',
    'additional-services-ar': 'Accounts Receivable Management',
    'accounts-receivable': 'Accounts Receivable Management',
    'additional-services-accounts-payable': 'Accounts Payable Management',
    'additional-services-ap': 'Accounts Payable Management',
    'accounts-payable': 'Accounts Payable Management',
    'additional-services-1099': '1099 Filing',
    '1099-processing': '1099 Filing',
    '1099-filing': '1099 Filing',
    'additional-services-sales-tax': 'Sales Tax Filing',
    'sales-tax-filing': 'Sales Tax Filing',
    'additional-services-scorp-election': 'S-Corp Election (Form 2553)',
    'scorp-election': 'S-Corp Election (Form 2553)',
    'additional-services-schedule-c': 'Schedule C Financial Statement Prep',
    'schedule-c-financial-statement': 'Schedule C Financial Statement Prep',
    'additional-services-tax-planning': 'Tax Planning Consultation',
    'tax-planning-consultation': 'Tax Planning Consultation',
    'tax-planning': 'Tax Planning Consultation'
  };

  return mappings[pricingRuleId.toLowerCase()] || null;
};

// Helper function to convert pricing rule IDs to Airtable-compatible service names
const convertPricingRulesToServiceNames = (pricingRuleIds: string[]): string[] => {
  const serviceNames: string[] = [];

  for (const ruleId of pricingRuleIds) {
    const serviceName = mapPricingRuleToAirtableOption(ruleId);
    if (serviceName && !serviceNames.includes(serviceName)) {
      serviceNames.push(serviceName);
    }
  }

  return serviceNames;
};

// Helper function to extract individual Additional Service pricing from pricingConfig
const extractAdditionalServicePricing = (
  formData: FormData,
  pricingConfig: PricingConfig[],
  hasAdvisory: boolean
): {
  arManagementFee: number;
  arManagementBillingType: string;
  apManagementFee: number;
  apManagementBillingType: string;
  form1099FilingFee: number;
  form1099FilingBillingType: string;
  salesTaxFilingFee: number;
  salesTaxFilingBillingType: string;
  sCorpElectionFee: number;
  sCorpElectionBillingType: string;
  scheduleCFinancialStatementFee: number;
  scheduleCFinancialStatementBillingType: string;
  taxPlanningConsultationFee: number;
  taxPlanningConsultationBillingType: string;
} => {
  const selectedServices = formData.additionalServices?.specializedFilings || [];

  // Initialize all fees and billing types
  const additionalServiceFees = {
    arManagementFee: 0,
    arManagementBillingType: '',
    apManagementFee: 0,
    apManagementBillingType: '',
    form1099FilingFee: 0,
    form1099FilingBillingType: '',
    salesTaxFilingFee: 0,
    salesTaxFilingBillingType: '',
    sCorpElectionFee: 0,
    sCorpElectionBillingType: '',
    scheduleCFinancialStatementFee: 0,
    scheduleCFinancialStatementBillingType: '',
    taxPlanningConsultationFee: 0,
    taxPlanningConsultationBillingType: ''
  };

  console.log('=== ADDITIONAL SERVICE PRICING EXTRACTION ===');
  console.log('Selected Services:', selectedServices);
  console.log('Has Advisory:', hasAdvisory);

  // Filter pricing rules for additional services
  const additionalServiceRules = pricingConfig.filter(rule =>
    rule.serviceId === 'additional-services' &&
    rule.active &&
    selectedServices.includes(rule.serviceName)
  );

  console.log('Matching Pricing Rules:', additionalServiceRules.length);

  // Extract pricing for each selected Additional Service
  additionalServiceRules.forEach(rule => {
    let price = 0;
    let billingType = '';

    // Determine price based on pricing structure
    if (rule.perUnitPricing && rule.unitPrice) {
      // Hourly service - use unit price (hourly rate)
      price = rule.unitPrice;
      billingType = `Hourly (per ${rule.unitName || 'hour'})`;
    } else if (rule.billingFrequency === 'One-Time Fee') {
      // One-time fee service
      price = rule.basePrice;
      billingType = 'One-Time Fee';
    } else if (rule.billingFrequency === 'Monthly') {
      // Monthly service
      price = rule.basePrice;
      billingType = 'Monthly';
    } else if (rule.billingFrequency === 'Annual') {
      // Annual service
      price = rule.basePrice;
      billingType = 'Annual';
    }

    // Apply advisory discount if applicable
    if (hasAdvisory && rule.advisoryDiscountEligible && rule.advisoryDiscountPercentage > 0) {
      price = price * (1 - rule.advisoryDiscountPercentage);
      console.log(`Advisory discount applied to ${rule.serviceName}: ${rule.advisoryDiscountPercentage * 100}%`);
    }

    // Map to specific fee fields based on service name
    const serviceName = rule.serviceName;

    if (serviceName === 'Accounts Receivable Management') {
      additionalServiceFees.arManagementFee = price;
      additionalServiceFees.arManagementBillingType = billingType;
      console.log(`AR Management: $${price} - ${billingType}`);
    } else if (serviceName === 'Accounts Payable Management') {
      additionalServiceFees.apManagementFee = price;
      additionalServiceFees.apManagementBillingType = billingType;
      console.log(`AP Management: $${price} - ${billingType}`);
    } else if (serviceName === '1099 Filing') {
      additionalServiceFees.form1099FilingFee = price;
      additionalServiceFees.form1099FilingBillingType = billingType;
      console.log(`1099 Filing: $${price} - ${billingType}`);
    } else if (serviceName === 'Sales Tax Filing') {
      additionalServiceFees.salesTaxFilingFee = price;
      additionalServiceFees.salesTaxFilingBillingType = billingType;
      console.log(`Sales Tax Filing: $${price} - ${billingType}`);
    } else if (serviceName === 'S-Corp Election (Form 2553)') {
      additionalServiceFees.sCorpElectionFee = price;
      additionalServiceFees.sCorpElectionBillingType = billingType;
      console.log(`S-Corp Election: $${price} - ${billingType}`);
    } else if (serviceName === 'Schedule C Financial Statement Prep') {
      additionalServiceFees.scheduleCFinancialStatementFee = price;
      additionalServiceFees.scheduleCFinancialStatementBillingType = billingType;
      console.log(`Schedule C Financial Statement: $${price} - ${billingType}`);
    } else if (serviceName === 'Tax Planning Consultation') {
      additionalServiceFees.taxPlanningConsultationFee = price;
      additionalServiceFees.taxPlanningConsultationBillingType = billingType;
      console.log(`Tax Planning Consultation: $${price} - ${billingType}`);
    }
  });

  console.log('==============================================');

  return additionalServiceFees;
};

// Helper function to extract individual service fees from quote data
const extractIndividualServiceFees = (services: ServiceQuote[], formData: FormData, quote: QuoteData) => {
  // Initialize all fees to 0
  const fees = {
    // Advisory Services
    advisoryServicesMonthlyFee: 0,
    advisoryServicesOneTimeFee: 0,
    advisoryServicesAnnualFee: 0,

    // Individual Tax Preparation
    individualTaxFee: 0,
    individualTaxMonthlyFee: 0,
    individualTaxAnnualFee: 0,

    // Business Tax Services
    businessTaxFee: 0,
    businessTaxMonthlyFee: 0,
    businessTaxAnnualFee: 0,

    // Bookkeeping Services
    monthlyBookkeepingFee: 0,
    bookkeepingOneTimeFee: 0,
    bookkeepingAnnualFee: 0,
    bookkeepingCleanupFee: 0,

    // Additional Services (aggregated totals)
    additionalServicesMonthlyFee: 0,
    additionalServicesOneTimeFee: 0,
    additionalServicesAnnualFee: 0
  };

  // Extract fees from each service in the quote
  services.forEach(service => {
    const serviceName = service.name.toLowerCase();

    // Advisory Services
    if (serviceName.includes('advisory')) {
      fees.advisoryServicesMonthlyFee = service.monthlyFee || 0;
      fees.advisoryServicesOneTimeFee = service.oneTimeFee || 0;
      fees.advisoryServicesAnnualFee = service.annualPrice || 0;
    }

    // Individual Tax Preparation
    if (serviceName.includes('individual tax')) {
      fees.individualTaxFee = service.oneTimeFee || 0;
      fees.individualTaxMonthlyFee = service.monthlyFee || 0;
      fees.individualTaxAnnualFee = service.annualPrice || 0;
    }

    // Business Tax Services
    if (serviceName.includes('business tax')) {
      fees.businessTaxFee = service.oneTimeFee || 0;
      fees.businessTaxMonthlyFee = service.monthlyFee || 0;
      fees.businessTaxAnnualFee = service.annualPrice || 0;
    }

    // Bookkeeping Services
    if (serviceName.includes('bookkeeping')) {
      fees.monthlyBookkeepingFee = service.monthlyFee || 0;
      fees.bookkeepingOneTimeFee = service.oneTimeFee || 0;
      fees.bookkeepingAnnualFee = service.annualPrice || 0;
    }

    // Additional Services
    if (serviceName.includes('additional service')) {
      fees.additionalServicesMonthlyFee = service.monthlyFee || 0;
      fees.additionalServicesOneTimeFee = service.oneTimeFee || 0;
      fees.additionalServicesAnnualFee = service.annualPrice || 0;
    }
  });

  // Calculate bookkeeping cleanup fee from form data and pricing rules
  // This should match what was calculated in the quote
  if (formData.bookkeeping?.currentStatus === 'Books need to be caught up' && formData.bookkeeping?.monthsBehind) {
    const monthsBehindNum = parseInt(formData.bookkeeping.monthsBehind) || 0;

    // Get the unit price from Airtable (should be $300 per month)
    // Apply advisory discount if advisory services are selected
    let unitPrice = 300; // Default unit price from Airtable

    // Check if advisory services are selected to apply discount
    const hasAdvisory = formData.services.includes('advisory');
    if (hasAdvisory) {
      // Apply 50% advisory discount (from Airtable configuration)
      unitPrice = unitPrice * 0.5; // 50% discount = multiply by 0.5
    }

    fees.bookkeepingCleanupFee = monthsBehindNum * unitPrice;

    console.log('=== ZAPIER CLEANUP FEE EXTRACTION ===');
    console.log('Months Behind:', monthsBehindNum);
    console.log('Unit Price:', unitPrice);
    console.log('Has Advisory:', hasAdvisory);
    console.log('Cleanup Fee:', fees.bookkeepingCleanupFee);
    console.log('====================================');
  }

  return fees;
};

// Helper function to generate unique quote ID
const generateQuoteId = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `QUOTE-${year}${month}${day}-${random}`;
};

export const sendQuoteToZapierWebhook = async (
  formData: FormData,
  quote: QuoteData,
  pricingConfig: PricingConfig[] = [],
  tenantId?: string,
  webhookUrl?: string
): Promise<boolean> => {
  const url = webhookUrl || ZAPIER_WEBHOOK_URL;
  console.log('Using Zapier webhook URL:', url);

  if (!url) {
    console.error('Zapier webhook URL not configured');
    return true; // Return true for demo purposes when webhook is not configured
  }

  // Generate unique quote ID
  const quoteId = generateQuoteId();

  // Check if advisory service is selected
  const hasAdvisory = formData.services.includes('advisory');

  // Extract individual service fees
  const individualFees = extractIndividualServiceFees(quote.services, formData, quote);

  // Extract individual Additional Service pricing
  const additionalServicePricing = extractAdditionalServicePricing(formData, pricingConfig, hasAdvisory);

  // Log extracted individual fees for debugging
  console.log('=== EXTRACTED INDIVIDUAL SERVICE FEES ===');
  console.log('Advisory Services Monthly Fee:', individualFees.advisoryServicesMonthlyFee);
  console.log('Individual Tax Fee:', individualFees.individualTaxFee);
  console.log('Business Tax Fee:', individualFees.businessTaxFee);
  console.log('Monthly Bookkeeping Fee:', individualFees.monthlyBookkeepingFee);
  console.log('Bookkeeping Cleanup Fee:', individualFees.bookkeepingCleanupFee);
  console.log('Additional Services Monthly Fee (Aggregated):', individualFees.additionalServicesMonthlyFee);
  console.log('Additional Services One-Time Fee (Aggregated):', individualFees.additionalServicesOneTimeFee);
  console.log('=========================================');

  console.log('=== EXTRACTED INDIVIDUAL ADDITIONAL SERVICE PRICING ===');
  console.log('AR Management Fee:', additionalServicePricing.arManagementFee, additionalServicePricing.arManagementBillingType);
  console.log('AP Management Fee:', additionalServicePricing.apManagementFee, additionalServicePricing.apManagementBillingType);
  console.log('1099 Filing Fee:', additionalServicePricing.form1099FilingFee, additionalServicePricing.form1099FilingBillingType);
  console.log('Sales Tax Filing Fee:', additionalServicePricing.salesTaxFilingFee, additionalServicePricing.salesTaxFilingBillingType);
  console.log('S-Corp Election Fee:', additionalServicePricing.sCorpElectionFee, additionalServicePricing.sCorpElectionBillingType);
  console.log('Schedule C Financial Statement Fee:', additionalServicePricing.scheduleCFinancialStatementFee, additionalServicePricing.scheduleCFinancialStatementBillingType);
  console.log('Tax Planning Consultation Fee:', additionalServicePricing.taxPlanningConsultationFee, additionalServicePricing.taxPlanningConsultationBillingType);
  console.log('========================================================');

  const payload = {
    // Quote Metadata
    quoteId: quoteId,
    tenantId: tenantId || '',

    // Contact Information
    firstName: formData.firstName || '',
    lastName: formData.lastName || '',
    email: formData.email || '',
    phone: formData.phone || '',

    // Services Requested
    servicesRequested: formData.services.join(', '),

    // Advisory Pricing Flag
    applyAdvisoryPricing: formData.services.includes('advisory'),

    // Quote Summary - Total Fees
    quoteMonthlyFees: quote.totalMonthlyFees || 0,
    quoteOneTimeFees: quote.totalOneTimeFees || 0,
    quoteTotalAnnual: quote.totalAnnual || 0,
    quoteComplexity: quote.complexity || 'low',
    potentialSavings: quote.potentialSavings || 0,
    recommendations: quote.recommendations.join('; '),

    // Individual Service Fees - Advisory Services
    advisoryServicesMonthlyFee: individualFees.advisoryServicesMonthlyFee,
    advisoryServicesOneTimeFee: individualFees.advisoryServicesOneTimeFee,
    advisoryServicesAnnualFee: individualFees.advisoryServicesAnnualFee,

    // Individual Service Fees - Individual Tax Preparation
    individualTaxFee: individualFees.individualTaxFee,
    individualTaxMonthlyFee: individualFees.individualTaxMonthlyFee,
    individualTaxAnnualFee: individualFees.individualTaxAnnualFee,

    // Individual Service Fees - Business Tax Services
    businessTaxFee: individualFees.businessTaxFee,
    businessTaxMonthlyFee: individualFees.businessTaxMonthlyFee,
    businessTaxAnnualFee: individualFees.businessTaxAnnualFee,

    // Individual Service Fees - Bookkeeping Services
    monthlyBookkeepingFee: individualFees.monthlyBookkeepingFee,
    bookkeepingOneTimeFee: individualFees.bookkeepingOneTimeFee,
    bookkeepingAnnualFee: individualFees.bookkeepingAnnualFee,
    bookkeepingCleanupFee: individualFees.bookkeepingCleanupFee,

    // Individual Service Fees - Additional Services (Aggregated Totals)
    additionalServicesMonthlyFee: individualFees.additionalServicesMonthlyFee,
    additionalServicesOneTimeFee: individualFees.additionalServicesOneTimeFee,
    additionalServicesAnnualFee: individualFees.additionalServicesAnnualFee,

    // Individual Additional Service Pricing - AR Management
    arManagementFee: additionalServicePricing.arManagementFee,
    arManagementBillingType: additionalServicePricing.arManagementBillingType,

    // Individual Additional Service Pricing - AP Management
    apManagementFee: additionalServicePricing.apManagementFee,
    apManagementBillingType: additionalServicePricing.apManagementBillingType,

    // Individual Additional Service Pricing - 1099 Filing
    form1099FilingFee: additionalServicePricing.form1099FilingFee,
    form1099FilingBillingType: additionalServicePricing.form1099FilingBillingType,

    // Individual Additional Service Pricing - Sales Tax Filing
    salesTaxFilingFee: additionalServicePricing.salesTaxFilingFee,
    salesTaxFilingBillingType: additionalServicePricing.salesTaxFilingBillingType,

    // Individual Additional Service Pricing - S-Corp Election
    sCorpElectionFee: additionalServicePricing.sCorpElectionFee,
    sCorpElectionBillingType: additionalServicePricing.sCorpElectionBillingType,

    // Individual Additional Service Pricing - Schedule C Financial Statement
    scheduleCFinancialStatementFee: additionalServicePricing.scheduleCFinancialStatementFee,
    scheduleCFinancialStatementBillingType: additionalServicePricing.scheduleCFinancialStatementBillingType,

    // Individual Additional Service Pricing - Tax Planning Consultation
    taxPlanningConsultationFee: additionalServicePricing.taxPlanningConsultationFee,
    taxPlanningConsultationBillingType: additionalServicePricing.taxPlanningConsultationBillingType,

    // Service Details
    serviceBreakdown: quote.services.map(service => ({
      name: service.name,
      description: service.description,
      monthlyFee: service.monthlyFee,
      oneTimeFee: service.oneTimeFee,
      annualPrice: service.annualPrice,
      included: service.included.join('; '),
      addOns: service.addOns?.join('; ') || ''
    })),
    
    // Individual Tax Details - Always send all fields
    individualTaxFilingStatus: formData.individualTax?.filingStatus || '',
    individualTaxAnnualIncome: formData.individualTax?.annualIncome || '',
    individualTaxIncomeTypes: formData.individualTax?.incomeTypes?.join(', ') || '',
    individualTaxDeductionType: formData.individualTax?.deductionType || '',
    individualTaxSituations: formData.individualTax?.taxSituations?.join(', ') || '',
    individualTaxSelfEmploymentBusinessCount: formData.individualTax?.selfEmploymentBusinessCount || 0,
    individualTaxK1Count: formData.individualTax?.k1Count || 0,
    individualTaxRentalPropertyCount: formData.individualTax?.rentalPropertyCount || 0,
    individualTaxInterestDividendAmount: formData.individualTax?.interestDividendAmount || '',
    individualTaxOtherIncomeTypes: formData.individualTax?.otherIncomeTypes?.join(', ') || '',
    individualTaxAdditionalConsiderations: formData.individualTax?.additionalConsiderations?.join(', ') || '',
    individualTaxHasOtherIncome: formData.individualTax?.hasOtherIncome || '',
    individualTaxOtherIncomeDescription: formData.individualTax?.otherIncomeDescription || '',
    individualTaxAdditionalStateCount: formData.individualTax?.additionalStateCount || 0,
    individualTaxYear: formData.individualTax?.taxYear || '',
    individualTaxTimeline: formData.individualTax?.timeline || '',
    individualTaxPreviousPreparer: formData.individualTax?.previousPreparer || '',
    individualTaxSpecialCircumstances: formData.individualTax?.specialCircumstances || '',
    individualTaxHasPrimaryHomeSale: formData.individualTax?.hasPrimaryHomeSale || false,
    individualTaxHasInvestmentPropertySale: formData.individualTax?.hasInvestmentPropertySale || false,
    individualTaxHasAdoptedChild: formData.individualTax?.hasAdoptedChild || false,
    individualTaxHasDivorce: formData.individualTax?.hasDivorce || false,
    individualTaxHasMarriage: formData.individualTax?.hasMarriage || false,
    individualTaxHasMultipleStates: formData.individualTax?.hasMultipleStates || false,
    
    // Business Tax Details - Always send all fields
    businessTaxBusinessName: formData.businessTax?.businessName || '',
    businessTaxEntityType: formData.businessTax?.entityType || '',
    businessTaxBusinessIndustry: formData.businessTax?.businessIndustry || '',
    businessTaxAnnualRevenue: formData.businessTax?.annualRevenue || '',
    businessTaxNumberOfEmployees: formData.businessTax?.numberOfEmployees || '',
    businessTaxNumberOfOwners: formData.businessTax?.numberOfOwners || 0,
    businessTaxOtherSituations: formData.businessTax?.otherSituations?.join(', ') || '',
    businessTaxAdditionalStateCount: formData.businessTax?.additionalStateCount || 0,
    businessTaxFixedAssetAcquisitionCount: formData.businessTax?.fixedAssetAcquisitionCount || 0,
    businessTaxAdditionalConsiderations: formData.businessTax?.additionalConsiderations?.join(', ') || '',
    businessTaxYear: formData.businessTax?.taxYear || '',
    businessTaxTimeline: formData.businessTax?.timeline || '',
    businessTaxPreviousPreparer: formData.businessTax?.previousPreparer || '',
    businessTaxSpecialCircumstances: formData.businessTax?.specialCircumstances || '',
    businessTaxComplexity: formData.businessTax?.complexity || '',
    businessTaxSituations: formData.businessTax?.taxSituations?.join(', ') || '',
    businessTaxIsFirstYearEntity: formData.businessTax?.isFirstYearEntity || false,
    businessTaxHasOwnershipChanges: formData.businessTax?.hasOwnershipChanges || false,
    businessTaxHasFixedAssetAcquisitions: formData.businessTax?.hasFixedAssetAcquisitions || false,
    
    // Bookkeeping Details - Always send all fields
    bookkeepingBusinessName: formData.bookkeeping?.businessName || '',
    bookkeepingBusinessType: formData.bookkeeping?.businessType || '',
    bookkeepingBusinessIndustry: formData.bookkeeping?.businessIndustry || '',
    bookkeepingAnnualRevenue: formData.bookkeeping?.annualRevenue || '',
    bookkeepingNumberOfEmployees: formData.bookkeeping?.numberOfEmployees || '',
    bookkeepingCurrentStatus: formData.bookkeeping?.currentStatus || '',
    bookkeepingCurrentBookkeepingMethod: formData.bookkeeping?.currentBookkeepingMethod || '',
    bookkeepingMonthsBehind: formData.bookkeeping?.monthsBehind || '',
    bookkeepingBankAccounts: formData.bookkeeping?.bankAccounts || 0,
    bookkeepingCreditCards: formData.bookkeeping?.creditCards || 0,
    bookkeepingBankLoans: formData.bookkeeping?.bankLoans || 0,
    bookkeepingTransactionVolume: formData.bookkeeping?.transactionVolume || 0,
    bookkeepingMonthlyTransactions: formData.bookkeeping?.monthlyTransactions || 0,
    bookkeepingServiceFrequency: formData.bookkeeping?.servicefrequency || '',
    bookkeepingServicesNeeded: formData.bookkeeping?.servicesNeeded?.join(', ') || '',
    bookkeepingFrequency: formData.bookkeeping?.frequency || '',
    bookkeepingAdditionalConsiderations: formData.bookkeeping?.additionalConsiderations?.join(', ') || '',
    bookkeepingCleanupHours: formData.bookkeeping?.cleanuphours || 0,
    bookkeepingFixedAssets: formData.bookkeeping?.fixedassets || 0,
    bookkeepingFixedAssetsCount: formData.bookkeeping?.fixedAssetsCount || 0,
    bookkeepingNeedsCleanup: formData.bookkeeping?.needsCleanup || false,
    bookkeepingHasThirdPartyIntegration: formData.bookkeeping?.hasThirdPartyIntegration || false,
    bookkeepingHasFixedAssets: formData.bookkeeping?.hasFixedAssets || false,
    bookkeepingHasInventory: formData.bookkeeping?.hasInventory || false,
    bookkeepingStartTimeline: formData.bookkeeping?.startTimeline || '',
    bookkeepingChallenges: formData.bookkeeping?.challenges || '',
    
    // Additional Services - Convert pricing rule IDs to Airtable option names
    additionalServicesSelected: formData.additionalServices?.selectedAdditionalServices
      ? convertPricingRulesToServiceNames(formData.additionalServices.selectedAdditionalServices).join(',')
      : '',

    // Specialized Filings - Multi-select comma-separated
    specializedFilings: formData.additionalServices?.specializedFilings?.join(',') || '',

    // Hourly Services Rates (extracted from quote data)
    hourlyServices: quote.hourlyServices.reduce((acc, service) => {
      if (service.name.includes('Accounts Receivable') || service.name.includes('AR Management')) {
        acc.arRate = service.rate;
      } else if (service.name.includes('Accounts Payable') || service.name.includes('AP Management')) {
        acc.apRate = service.rate;
      } else if (service.name.includes('1099')) {
        acc.ninetyNineRate = service.rate;
      } else if (service.name.includes('Schedule C')) {
        acc.scheduleCRate = service.rate;
      }
      return acc;
    }, {} as { arRate?: number; apRate?: number; ninetyNineRate?: number; scheduleCRate?: number }),

    // Additional Services - Conditional Fields (only populate if parent service is selected)
    accountsReceivableInvoicesPerMonth: formData.additionalServices?.accountsReceivableInvoicesPerMonth ?? null,
    accountsReceivableRecurring: formData.additionalServices?.accountsReceivableRecurring || null,
    accountsPayableBillsPerMonth: formData.additionalServices?.accountsPayableBillsPerMonth ?? null,
    accountsPayableBillRunFrequency: formData.additionalServices?.accountsPayableBillRunFrequency || null,
    form1099Count: formData.additionalServices?.form1099Count ?? null,
    taxPlanningConsultation: formData.additionalServices?.taxPlanningConsultation ?? false,
    
    // Metadata
    leadSource: 'Quote Calculator',
    leadStatus: 'New Lead',
    createdDate: new Date().toISOString(),
    timestamp: Date.now()
  };

  try {
    console.log('Sending request to Zapier webhook:', url);
    console.log('Payload:', payload);

    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Zapier webhook response error:', errorText);
      throw new Error(`Zapier webhook error: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.text();
    console.log('Zapier webhook response:', responseData);
    console.log('Successfully sent quote data to Zapier webhook');
    return true;
  } catch (error) {
    console.error('Error sending quote data to Zapier webhook:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return false;
  }
};

// Helper function to format data for email notifications (if needed)
export const formatQuoteForEmail = (formData: FormData, quote: QuoteData): string => {
  return `
New Quote Request from ${formData.firstName} ${formData.lastName}

Contact Information:
- Name: ${formData.firstName} ${formData.lastName}
- Email: ${formData.email}
- Phone: ${formData.phone}

Services Requested: ${formData.services.join(', ')}

Quote Summary:
- Monthly Fees: $${quote.totalMonthlyFees.toLocaleString()}
- One-Time Fees: $${quote.totalOneTimeFees.toLocaleString()}
- Annual Total: $${quote.totalAnnual.toLocaleString()}
- Complexity: ${quote.complexity}
- Potential Savings: $${quote.potentialSavings.toLocaleString()}

Recommendations:
${quote.recommendations.map(rec => `- ${rec}`).join('\n')}

  `.trim();
};