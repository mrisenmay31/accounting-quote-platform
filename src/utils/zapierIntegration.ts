import { FormData, QuoteData, ServiceQuote } from '../types/quote';
import { generateQuoteId } from './quoteIdGenerator';

// Zapier webhook configuration (fallback to env var for development)
const ZAPIER_WEBHOOK_URL = import.meta.env.VITE_ZAPIER_WEBHOOK_URL || '';

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

    // Additional Services
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

export const sendQuoteToZapierWebhook = async (formData: FormData, quote: QuoteData, webhookUrl?: string): Promise<{ success: boolean; recordId?: string; quoteId?: string }> => {
  const url = webhookUrl || ZAPIER_WEBHOOK_URL;
  console.log('Using Zapier webhook URL:', url);

  if (!url) {
    console.error('Zapier webhook URL not configured');
    return { success: true }; // Return success for demo purposes when webhook is not configured
  }

  // Generate Quote ID
  const quoteId = generateQuoteId();
  console.log('📋 Generated Quote ID:', quoteId);

  // Extract individual service fees
  const individualFees = extractIndividualServiceFees(quote.services, formData, quote);

  // Log extracted individual fees for debugging
  console.log('=== EXTRACTED INDIVIDUAL SERVICE FEES ===');
  console.log('Advisory Services Monthly Fee:', individualFees.advisoryServicesMonthlyFee);
  console.log('Individual Tax Fee:', individualFees.individualTaxFee);
  console.log('Business Tax Fee:', individualFees.businessTaxFee);
  console.log('Monthly Bookkeeping Fee:', individualFees.monthlyBookkeepingFee);
  console.log('Bookkeeping Cleanup Fee:', individualFees.bookkeepingCleanupFee);
  console.log('Additional Services Monthly Fee:', individualFees.additionalServicesMonthlyFee);
  console.log('=========================================');

  const payload = {
    // Quote ID (Frontend Generated)
    quoteId: quoteId,

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

    // Individual Service Fees - Additional Services
    additionalServicesMonthlyFee: individualFees.additionalServicesMonthlyFee,
    additionalServicesOneTimeFee: individualFees.additionalServicesOneTimeFee,
    additionalServicesAnnualFee: individualFees.additionalServicesAnnualFee,
    
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
    
    // Additional Services - Always send all fields
    additionalServicesSelected: formData.additionalServices?.selectedAdditionalServices?.join(', ') || '',
    
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

    const responseText = await response.text();
    console.log('=== ZAPIER WEBHOOK RESPONSE ===');
    console.log('Raw response text:', responseText);

    // Try to parse the response as JSON to extract the Record ID
    let recordId: string | undefined;
    try {
      const responseData = JSON.parse(responseText);
      console.log('Parsed response object:', responseData);
      console.log('Response ID field:', responseData.id);

      // Zapier returns the Airtable Record ID in the "id" field
      if (responseData.id) {
        recordId = responseData.id;

        // Validate that this is an Airtable Record ID (starts with "rec")
        if (recordId.startsWith('rec')) {
          console.log('✅ Valid Airtable Record ID captured:', recordId);
        } else {
          console.error('❌ ERROR: Invalid Airtable Record ID format:', recordId);
          console.error('Expected ID starting with "rec", got:', recordId);
          console.error('Full response:', responseData);
          // Clear the recordId if it's not a valid Airtable ID
          recordId = undefined;
        }
      } else {
        console.warn('⚠️ Warning: No Record ID found in response');
        console.warn('Response structure:', Object.keys(responseData));
      }
    } catch (parseError) {
      console.log('Response is not JSON, continuing without Record ID');
      console.log('Parse error:', parseError);
    }
    console.log('================================');

    console.log('Successfully sent quote data to Zapier webhook');
    return { success: true, recordId, quoteId };
  } catch (error) {
    console.error('Error sending quote data to Zapier webhook:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return { success: false, quoteId };
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