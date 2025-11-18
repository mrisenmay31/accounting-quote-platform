import { FormData, QuoteData } from '../types/quote';

export interface AirtableQuoteConfig {
  baseId: string;
  apiKey: string;
}

export interface AirtableQuoteResult {
  success: boolean;
  recordId?: string;
  quoteNumber?: string;
  error?: string;
}

const generateQuoteNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `Q-${year}${month}${day}-${random}`;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const saveQuoteToAirtable = async (
  formData: FormData,
  quoteData: QuoteData,
  config: AirtableQuoteConfig
): Promise<AirtableQuoteResult> => {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const quoteNumber = generateQuoteNumber();
      const airtableFields: Record<string, any> = {};

      airtableFields['Date'] = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      airtableFields['First Name'] = formData.firstName;
      airtableFields['Last Name'] = formData.lastName;
      airtableFields['Full Name'] = `${formData.firstName} ${formData.lastName}`.trim();
      airtableFields['Email'] = formData.email;

      if (formData.phone) {
        airtableFields['Phone'] = formData.phone;
      }

      airtableFields['Quote Status'] = 'New Quote';
      airtableFields['Services Requested'] = formData.services.join(', ');

      if (formData.services.includes('individual-tax') && formData.individualTax) {
        const itax = formData.individualTax;

        if (itax.filingStatus) airtableFields['Individual Tax - Filing Status'] = itax.filingStatus;
        if (itax.annualIncome) airtableFields['Individual Tax - Annual Income'] = itax.annualIncome;
        if (itax.taxYear) airtableFields['Individual Tax - Tax Year'] = itax.taxYear;
        if (itax.timeline) airtableFields['Individual Tax - Timeline'] = itax.timeline;

        if (itax.incomeTypes && itax.incomeTypes.length > 0) {
          airtableFields['Individual Tax - Income Types'] = itax.incomeTypes.join(', ');
        }

        if (itax.deductionType) airtableFields['Individual Tax - Deduction Type'] = itax.deductionType;

        if (itax.k1Count !== undefined && itax.k1Count !== null) {
          airtableFields['Individual Tax - K1 Count'] = Number(itax.k1Count);
        }

        if (itax.interestDividendAmount) {
          airtableFields['Individual Tax - Interest/Dividend Amount'] = itax.interestDividendAmount;
        }

        if (itax.rentalPropertyCount !== undefined && itax.rentalPropertyCount !== null) {
          airtableFields['Individual Tax - Rental Property Count'] = Number(itax.rentalPropertyCount);
        }

        if (itax.otherIncomeTypes && itax.otherIncomeTypes.length > 0) {
          airtableFields['Individual Tax - Other Types of Income'] = itax.otherIncomeTypes.join(', ');
        }

        if (itax.selfEmploymentBusinessCount !== undefined && itax.selfEmploymentBusinessCount !== null) {
          airtableFields['Individual Tax - Self-Employment Business Count'] = Number(itax.selfEmploymentBusinessCount);
        }

        if (itax.additionalConsiderations && itax.additionalConsiderations.length > 0) {
          airtableFields['Individual Tax - Additional Considerations'] = itax.additionalConsiderations.join(', ');
        }

        if (itax.additionalStateCount !== undefined && itax.additionalStateCount !== null) {
          airtableFields['Individual Tax - Additional State Count'] = Number(itax.additionalStateCount);
        }

        if (itax.hasOtherIncome) {
          airtableFields['Individual Tax - Has Other Income'] = itax.hasOtherIncome;
        }

        if (itax.otherIncomeDescription) {
          airtableFields['Individual Tax - Other Income'] = itax.otherIncomeDescription;
        }

        if (itax.previousPreparer) {
          airtableFields['Individual Tax - Previous Preparer'] = itax.previousPreparer;
        }

        if (itax.specialCircumstances) {
          airtableFields['Individual Tax - Special Circumstances'] = itax.specialCircumstances;
        }
      }

      if (formData.services.includes('business-tax') && formData.businessTax) {
        const btax = formData.businessTax;

        if (btax.businessName) airtableFields['Business Tax - Business Name'] = btax.businessName;
        if (btax.annualRevenue) airtableFields['Business Tax - Annual Revenue'] = btax.annualRevenue;
        if (btax.entityType) airtableFields['Business Tax - Entity Type'] = btax.entityType;
        if (btax.businessIndustry) airtableFields['Business Tax - Business Industry'] = btax.businessIndustry;
        if (btax.taxYear) airtableFields['Business Tax - Tax Year'] = btax.taxYear;
        if (btax.timeline) airtableFields['Business Tax - Timeline'] = btax.timeline;

        if (btax.numberOfOwners !== undefined && btax.numberOfOwners !== null) {
          airtableFields['Business Tax - Number of Owners'] = Number(btax.numberOfOwners);
        }

        if (btax.numberOfEmployees) {
          airtableFields['Business Tax - Number of Employees'] = btax.numberOfEmployees;
        }

        if (btax.otherSituations && btax.otherSituations.length > 0) {
          airtableFields['Business Tax - Other Tax Situations'] = btax.otherSituations.join(', ');
        }

        if (btax.additionalConsiderations && btax.additionalConsiderations.length > 0) {
          airtableFields['Business Tax - Additional Considerations'] = btax.additionalConsiderations.join(', ');
        }

        if (btax.additionalStateCount !== undefined && btax.additionalStateCount !== null) {
          airtableFields['Business Tax - Additional State Count'] = Number(btax.additionalStateCount);
        }

        if (btax.fixedAssetAcquisitionCount !== undefined && btax.fixedAssetAcquisitionCount !== null) {
          airtableFields['Business Tax - Fixed Asset Acquisition Count'] = Number(btax.fixedAssetAcquisitionCount);
        }

        if (btax.previousPreparer) {
          airtableFields['Business Tax - Previous Preparer'] = btax.previousPreparer;
        }

        if (btax.specialCircumstances) {
          airtableFields['Business Tax - Special Circumstances'] = btax.specialCircumstances;
        }
      }

      if (formData.services.includes('bookkeeping') && formData.bookkeeping) {
        const bk = formData.bookkeeping;

        if (bk.businessName) airtableFields['Bookkeeping - Business Name'] = bk.businessName;
        if (bk.annualRevenue) airtableFields['Bookkeeping - Annual Revenue'] = bk.annualRevenue;
        if (bk.businessType) airtableFields['Bookkeeping - Business Type'] = bk.businessType;
        if (bk.businessIndustry) airtableFields['Bookkeeping - Business Industry'] = bk.businessIndustry;
        if (bk.currentStatus) airtableFields['Bookkeeping - Current Status'] = bk.currentStatus;
        if (bk.currentBookkeepingMethod) airtableFields['Bookkeeping - Current Bookkeeping Method'] = bk.currentBookkeepingMethod;

        if (bk.bankAccounts !== undefined && bk.bankAccounts !== null) {
          airtableFields['Bookkeeping - Bank Accounts'] = Number(bk.bankAccounts);
        }

        if (bk.creditCards !== undefined && bk.creditCards !== null) {
          airtableFields['Bookkeeping - Credit Cards'] = Number(bk.creditCards);
        }

        if (bk.bankLoans !== undefined && bk.bankLoans !== null) {
          airtableFields['Bookkeeping - Bank Loans'] = Number(bk.bankLoans);
        }

        if (bk.monthlyTransactions !== undefined && bk.monthlyTransactions !== null) {
          airtableFields['Bookkeeping - Monthly Transactions'] = Number(bk.monthlyTransactions);
        }

        if (bk.servicefrequency) {
          airtableFields['Bookkeeping - Service Frequency'] = bk.servicefrequency;
        }

        if (bk.additionalConsiderations && bk.additionalConsiderations.length > 0) {
          airtableFields['Bookkeeping - Additional Considerations'] = bk.additionalConsiderations.join(', ');
        }

        if (bk.cleanuphours !== undefined && bk.cleanuphours !== null) {
          airtableFields['Bookkeeping - Cleanup Hours'] = Number(bk.cleanuphours);
        }

        if (bk.startTimeline) {
          airtableFields['Bookkeeping - Start Timeline'] = bk.startTimeline;
        }

        if (bk.challenges) {
          airtableFields['Bookkeeping - Challenges'] = bk.challenges;
        }
      }

      if (formData.services.includes('additional-services') && formData.additionalServices) {
        if (formData.additionalServices.selectedAdditionalServices &&
            formData.additionalServices.selectedAdditionalServices.length > 0) {
          airtableFields['Additional Services - Selected'] =
            formData.additionalServices.selectedAdditionalServices.join(', ');
        }

        if (formData.additionalServices.specializedFilings &&
            formData.additionalServices.specializedFilings.length > 0) {
          airtableFields['Specialized Filings'] =
            formData.additionalServices.specializedFilings.join(',');
        }

        if (formData.additionalServices.accountsReceivableInvoicesPerMonth !== undefined) {
          airtableFields['AR - Invoices Per Month'] = formData.additionalServices.accountsReceivableInvoicesPerMonth;
        }

        if (formData.additionalServices.accountsReceivableRecurring) {
          airtableFields['AR - Recurring Invoices'] = formData.additionalServices.accountsReceivableRecurring;
        }

        if (formData.additionalServices.accountsPayableBillsPerMonth !== undefined) {
          airtableFields['AP - Bills Per Month'] = formData.additionalServices.accountsPayableBillsPerMonth;
        }

        if (formData.additionalServices.accountsPayableBillRunFrequency) {
          airtableFields['AP - Bill Run Frequency'] = formData.additionalServices.accountsPayableBillRunFrequency;
        }

        if (formData.additionalServices.form1099Count !== undefined) {
          airtableFields['1099 Forms Count'] = formData.additionalServices.form1099Count;
        }

        if (formData.additionalServices.taxPlanningConsultation !== undefined) {
          airtableFields['Tax Planning Consultation'] = formData.additionalServices.taxPlanningConsultation;
        }
      }

      const individualTaxFees = quoteData.services
        .find(s => s.name.toLowerCase().includes('individual tax'))?.oneTimeFee || 0;

      const businessTaxFees = quoteData.services
        .find(s => s.name.toLowerCase().includes('business tax'))?.oneTimeFee || 0;

      const bookkeepingService = quoteData.services
        .find(s => s.name.toLowerCase().includes('bookkeeping'));

      const bookkeepingMonthlyFees = bookkeepingService?.monthlyFee || 0;
      const bookkeepingCleanupFees = bookkeepingService?.oneTimeFee || 0;

      if (individualTaxFees > 0) {
        airtableFields['Individual Tax Prep Fees'] = individualTaxFees;
      }

      if (businessTaxFees > 0) {
        airtableFields['Business Tax Prep Fees'] = businessTaxFees;
      }

      if (bookkeepingMonthlyFees > 0) {
        airtableFields['Monthly Bookkeeping Fees'] = bookkeepingMonthlyFees;
      }

      if (bookkeepingCleanupFees > 0) {
        airtableFields['Catchup Bookkeeping Fees'] = bookkeepingCleanupFees;
      }

      if (quoteData.totalMonthlyFees > 0) {
        airtableFields['Monthly Fees'] = quoteData.totalMonthlyFees;
      }

      if (quoteData.totalOneTimeFees > 0) {
        airtableFields['One-Time Fees'] = quoteData.totalOneTimeFees;
      }

      if (quoteData.totalMonthlyFees > 0) {
        airtableFields['Total Monthly Fees'] = quoteData.totalMonthlyFees;
      }

      const url = `https://api.airtable.com/v0/${config.baseId}/Client%20Quotes`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: airtableFields,
        }),
      });

      if (response.status === 429) {
        attempt++;
        if (attempt < maxRetries) {
          const backoffDelay = Math.pow(2, attempt) * 1000;
          console.log(`Rate limited. Retrying in ${backoffDelay}ms (attempt ${attempt}/${maxRetries})...`);
          await sleep(backoffDelay);
          continue;
        }
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
        };
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Airtable API error:', response.status, errorText);
        return {
          success: false,
          error: `Failed to save quote: ${response.statusText}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        recordId: data.id,
        quoteNumber: quoteNumber,
      };

    } catch (error) {
      console.error('Error saving quote to Airtable:', error);

      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          error: 'Network error. Please check your connection and try again.',
        };
      }

      return {
        success: false,
        error: 'An unexpected error occurred while saving your quote.',
      };
    }
  }

  return {
    success: false,
    error: 'Failed to save quote after multiple attempts.',
  };
};
