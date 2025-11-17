import { FormData, QuoteData } from '../types/quote';

export interface AirtableWriteConfig {
  baseId: string;
  apiKey: string;
  tableName?: string;
}

export interface AirtableQuoteRecord {
  id?: string;
  fields: {
    'Quote ID': string;
    'Date': string;
    'Email': string;
    'First Name': string;
    'Last Name': string;
    'Full Name': string;
    'Phone'?: string;
    'Quote Status': string;
    'Services Requested': string;
    'Monthly Fees': number;
    'One-Time Fees': number;
    'Total Monthly Fees': number;
    'Annual Total': number;
    'Tenant ID'?: string;
    [key: string]: any;
  };
}

export interface AirtableWriteResult {
  success: boolean;
  recordId?: string;
  quoteId?: string;
  error?: string;
  operation?: 'create' | 'update';
}

export interface AirtableSearchResult {
  found: boolean;
  recordId?: string;
  records?: any[];
}

const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;
const RATE_LIMIT_PER_SECOND = 5;

let lastRequestTime = 0;
let requestCount = 0;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const enforceRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < 1000) {
    if (requestCount >= RATE_LIMIT_PER_SECOND) {
      const waitTime = 1000 - timeSinceLastRequest;
      console.log(`[Airtable Rate Limit] Waiting ${waitTime}ms before next request`);
      await sleep(waitTime);
      requestCount = 0;
    }
  } else {
    requestCount = 0;
  }

  lastRequestTime = Date.now();
  requestCount++;
};

export const generateQuoteId = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `QUOTE-${year}${month}${day}-${random}`;
};

const buildQuoteFields = (
  formData: FormData,
  quoteData: QuoteData,
  quoteId: string,
  tenantId?: string
): Record<string, any> => {
  const fields: Record<string, any> = {
    'Quote ID': quoteId,
    'Date': new Date().toISOString(),
    'Email': formData.email,
    'First Name': formData.firstName,
    'Last Name': formData.lastName,
    'Full Name': `${formData.firstName} ${formData.lastName}`.trim(),
    'Quote Status': 'New Quote',
    'Services Requested': formData.services.join(', '),
    'Monthly Fees': quoteData.totalMonthlyFees || 0,
    'One-Time Fees': quoteData.totalOneTimeFees || 0,
    'Total Monthly Fees': quoteData.totalMonthlyFees || 0,
    'Annual Total': quoteData.totalAnnual || 0,
  };

  if (formData.phone) {
    fields['Phone'] = formData.phone;
  }

  if (tenantId) {
    fields['Tenant ID'] = tenantId;
  }

  if (formData.services.includes('individual-tax') && formData.individualTax) {
    const itax = formData.individualTax;

    if (itax.filingStatus) fields['Individual Tax - Filing Status'] = itax.filingStatus;
    if (itax.annualIncome) fields['Individual Tax - Annual Income'] = itax.annualIncome;
    if (itax.taxYear) fields['Individual Tax - Tax Year'] = itax.taxYear;
    if (itax.timeline) fields['Individual Tax - Timeline'] = itax.timeline;

    if (itax.incomeTypes && itax.incomeTypes.length > 0) {
      fields['Individual Tax - Income Types'] = itax.incomeTypes.join(', ');
    }

    if (itax.deductionType) fields['Individual Tax - Deduction Type'] = itax.deductionType;

    if (itax.k1Count !== undefined && itax.k1Count !== null) {
      fields['Individual Tax - K1 Count'] = Number(itax.k1Count);
    }

    if (itax.interestDividendAmount) {
      fields['Individual Tax - Interest/Dividend Amount'] = itax.interestDividendAmount;
    }

    if (itax.rentalPropertyCount !== undefined && itax.rentalPropertyCount !== null) {
      fields['Individual Tax - Rental Property Count'] = Number(itax.rentalPropertyCount);
    }

    if (itax.otherIncomeTypes && itax.otherIncomeTypes.length > 0) {
      fields['Individual Tax - Other Types of Income'] = itax.otherIncomeTypes.join(', ');
    }

    if (itax.selfEmploymentBusinessCount !== undefined && itax.selfEmploymentBusinessCount !== null) {
      fields['Individual Tax - Self-Employment Business Count'] = Number(itax.selfEmploymentBusinessCount);
    }

    if (itax.additionalConsiderations && itax.additionalConsiderations.length > 0) {
      fields['Individual Tax - Additional Considerations'] = itax.additionalConsiderations.join(', ');
    }

    if (itax.additionalStateCount !== undefined && itax.additionalStateCount !== null) {
      fields['Individual Tax - Additional State Count'] = Number(itax.additionalStateCount);
    }

    if (itax.hasOtherIncome) {
      fields['Individual Tax - Has Other Income'] = itax.hasOtherIncome;
    }

    if (itax.otherIncomeDescription) {
      fields['Individual Tax - Other Income'] = itax.otherIncomeDescription;
    }

    if (itax.previousPreparer) {
      fields['Individual Tax - Previous Preparer'] = itax.previousPreparer;
    }

    if (itax.specialCircumstances) {
      fields['Individual Tax - Special Circumstances'] = itax.specialCircumstances;
    }
  }

  if (formData.services.includes('business-tax') && formData.businessTax) {
    const btax = formData.businessTax;

    if (btax.businessName) fields['Business Tax - Business Name'] = btax.businessName;
    if (btax.annualRevenue) fields['Business Tax - Annual Revenue'] = btax.annualRevenue;
    if (btax.entityType) fields['Business Tax - Entity Type'] = btax.entityType;
    if (btax.businessIndustry) fields['Business Tax - Business Industry'] = btax.businessIndustry;
    if (btax.taxYear) fields['Business Tax - Tax Year'] = btax.taxYear;
    if (btax.timeline) fields['Business Tax - Timeline'] = btax.timeline;

    if (btax.numberOfOwners !== undefined && btax.numberOfOwners !== null) {
      fields['Business Tax - Number of Owners'] = Number(btax.numberOfOwners);
    }

    if (btax.numberOfEmployees) {
      fields['Business Tax - Number of Employees'] = btax.numberOfEmployees;
    }

    if (btax.otherSituations && btax.otherSituations.length > 0) {
      fields['Business Tax - Other Tax Situations'] = btax.otherSituations.join(', ');
    }

    if (btax.additionalConsiderations && btax.additionalConsiderations.length > 0) {
      fields['Business Tax - Additional Considerations'] = btax.additionalConsiderations.join(', ');
    }

    if (btax.additionalStateCount !== undefined && btax.additionalStateCount !== null) {
      fields['Business Tax - Additional State Count'] = Number(btax.additionalStateCount);
    }

    if (btax.fixedAssetAcquisitionCount !== undefined && btax.fixedAssetAcquisitionCount !== null) {
      fields['Business Tax - Fixed Asset Acquisition Count'] = Number(btax.fixedAssetAcquisitionCount);
    }

    if (btax.previousPreparer) {
      fields['Business Tax - Previous Preparer'] = btax.previousPreparer;
    }

    if (btax.specialCircumstances) {
      fields['Business Tax - Special Circumstances'] = btax.specialCircumstances;
    }
  }

  if (formData.services.includes('bookkeeping') && formData.bookkeeping) {
    const bk = formData.bookkeeping;

    if (bk.businessName) fields['Bookkeeping - Business Name'] = bk.businessName;
    if (bk.annualRevenue) fields['Bookkeeping - Annual Revenue'] = bk.annualRevenue;
    if (bk.businessType) fields['Bookkeeping - Business Type'] = bk.businessType;
    if (bk.businessIndustry) fields['Bookkeeping - Business Industry'] = bk.businessIndustry;
    if (bk.currentStatus) fields['Bookkeeping - Current Status'] = bk.currentStatus;
    if (bk.currentBookkeepingMethod) fields['Bookkeeping - Current Bookkeeping Method'] = bk.currentBookkeepingMethod;

    if (bk.bankAccounts !== undefined && bk.bankAccounts !== null) {
      fields['Bookkeeping - Bank Accounts'] = Number(bk.bankAccounts);
    }

    if (bk.creditCards !== undefined && bk.creditCards !== null) {
      fields['Bookkeeping - Credit Cards'] = Number(bk.creditCards);
    }

    if (bk.bankLoans !== undefined && bk.bankLoans !== null) {
      fields['Bookkeeping - Bank Loans'] = Number(bk.bankLoans);
    }

    if (bk.monthlyTransactions !== undefined && bk.monthlyTransactions !== null) {
      fields['Bookkeeping - Monthly Transactions'] = Number(bk.monthlyTransactions);
    }

    if (bk.servicefrequency) {
      fields['Bookkeeping - Service Frequency'] = bk.servicefrequency;
    }

    if (bk.additionalConsiderations && bk.additionalConsiderations.length > 0) {
      fields['Bookkeeping - Additional Considerations'] = bk.additionalConsiderations.join(', ');
    }

    if (bk.cleanuphours !== undefined && bk.cleanuphours !== null) {
      fields['Bookkeeping - Cleanup Hours'] = Number(bk.cleanuphours);
    }

    if (bk.startTimeline) {
      fields['Bookkeeping - Start Timeline'] = bk.startTimeline;
    }

    if (bk.challenges) {
      fields['Bookkeeping - Challenges'] = bk.challenges;
    }
  }

  if (formData.services.includes('additional-services') && formData.additionalServices) {
    if (formData.additionalServices.selectedAdditionalServices &&
        formData.additionalServices.selectedAdditionalServices.length > 0) {
      fields['Additional Services - Selected'] =
        formData.additionalServices.selectedAdditionalServices.join(', ');
    }

    if (formData.additionalServices.specializedFilings &&
        formData.additionalServices.specializedFilings.length > 0) {
      fields['Specialized Filings'] =
        formData.additionalServices.specializedFilings.join(',');
    }

    if (formData.additionalServices.accountsReceivableInvoicesPerMonth !== undefined) {
      fields['AR - Invoices Per Month'] = formData.additionalServices.accountsReceivableInvoicesPerMonth;
    }

    if (formData.additionalServices.accountsReceivableRecurring) {
      fields['AR - Recurring Invoices'] = formData.additionalServices.accountsReceivableRecurring;
    }

    if (formData.additionalServices.accountsPayableBillsPerMonth !== undefined) {
      fields['AP - Bills Per Month'] = formData.additionalServices.accountsPayableBillsPerMonth;
    }

    if (formData.additionalServices.accountsPayableBillRunFrequency) {
      fields['AP - Bill Run Frequency'] = formData.additionalServices.accountsPayableBillRunFrequency;
    }

    if (formData.additionalServices.form1099Count !== undefined) {
      fields['1099 Forms Count'] = formData.additionalServices.form1099Count;
    }

    if (formData.additionalServices.taxPlanningConsultation !== undefined) {
      fields['Tax Planning Consultation'] = formData.additionalServices.taxPlanningConsultation;
    }
  }

  const individualTaxService = quoteData.services
    .find(s => s.name.toLowerCase().includes('individual tax'));
  if (individualTaxService) {
    fields['Individual Tax Prep Fees'] = individualTaxService.oneTimeFee || 0;
  }

  const businessTaxService = quoteData.services
    .find(s => s.name.toLowerCase().includes('business tax'));
  if (businessTaxService) {
    fields['Business Tax Prep Fees'] = businessTaxService.oneTimeFee || 0;
  }

  const bookkeepingService = quoteData.services
    .find(s => s.name.toLowerCase().includes('bookkeeping'));
  if (bookkeepingService) {
    if (bookkeepingService.monthlyFee > 0) {
      fields['Monthly Bookkeeping Fees'] = bookkeepingService.monthlyFee;
    }
    if (bookkeepingService.oneTimeFee > 0) {
      fields['Catchup Bookkeeping Fees'] = bookkeepingService.oneTimeFee;
    }
  }

  console.log('[Airtable Write] Built quote fields:', {
    quoteId,
    email: fields['Email'],
    services: fields['Services Requested'],
    monthlyFees: fields['Monthly Fees'],
    oneTimeFees: fields['One-Time Fees'],
    fieldCount: Object.keys(fields).length
  });

  return fields;
};

export const findRecordByEmail = async (
  config: AirtableWriteConfig,
  email: string,
  withinHours: number = 24
): Promise<AirtableSearchResult> => {
  const tableName = config.tableName || 'Client Quotes';

  try {
    await enforceRateLimit();

    const cutoffDate = new Date(Date.now() - withinHours * 60 * 60 * 1000);
    const filterFormula = `AND({Email}='${email}', IS_AFTER({Date}, '${cutoffDate.toISOString()}'))`;

    const url = `${AIRTABLE_API_BASE}/${config.baseId}/${encodeURIComponent(tableName)}?filterByFormula=${encodeURIComponent(filterFormula)}`;

    console.log('[Airtable Search] Searching for email:', email);
    console.log('[Airtable Search] Filter formula:', filterFormula);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[Airtable Search] Error:', response.status, response.statusText);
      return { found: false };
    }

    const data = await response.json();

    if (data.records && data.records.length > 0) {
      console.log('[Airtable Search] Found', data.records.length, 'existing records for email:', email);
      return {
        found: true,
        recordId: data.records[0].id,
        records: data.records,
      };
    }

    console.log('[Airtable Search] No existing records found for email:', email);
    return { found: false };
  } catch (error) {
    console.error('[Airtable Search] Error:', error);
    return { found: false };
  }
};

export const createQuoteRecord = async (
  config: AirtableWriteConfig,
  formData: FormData,
  quoteData: QuoteData,
  tenantId?: string,
  quoteId?: string
): Promise<AirtableWriteResult> => {
  const tableName = config.tableName || 'Client Quotes';
  const generatedQuoteId = quoteId || generateQuoteId();
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      await enforceRateLimit();

      const fields = buildQuoteFields(formData, quoteData, generatedQuoteId, tenantId);
      const url = `${AIRTABLE_API_BASE}/${config.baseId}/${encodeURIComponent(tableName)}`;

      console.log(`[Airtable Create] Attempt ${attempt + 1}/${MAX_RETRIES}`);
      console.log('[Airtable Create] URL:', url);
      console.log('[Airtable Create] Quote ID:', generatedQuoteId);
      console.log('[Airtable Create] Timestamp:', new Date().toISOString());

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      });

      if (response.status === 429) {
        attempt++;
        if (attempt < MAX_RETRIES) {
          const backoffDelay = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
          console.log(`[Airtable Create] Rate limited. Retrying in ${backoffDelay}ms (attempt ${attempt}/${MAX_RETRIES})`);
          await sleep(backoffDelay);
          continue;
        }
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
        };
      }

      if (response.status === 401) {
        console.error('[Airtable Create] 401 Unauthorized - Invalid API key');
        return {
          success: false,
          error: 'Authentication failed. Please check Airtable API credentials.',
        };
      }

      if (response.status === 403) {
        console.error('[Airtable Create] 403 Forbidden - Insufficient permissions');
        return {
          success: false,
          error: 'Insufficient permissions to write to Airtable.',
        };
      }

      if (response.status === 404) {
        console.error('[Airtable Create] 404 Not Found - Base or table does not exist');
        return {
          success: false,
          error: 'Airtable base or table not found.',
        };
      }

      if (response.status === 422) {
        const errorData = await response.json();
        console.error('[Airtable Create] 422 Unprocessable - Validation error:', errorData);
        return {
          success: false,
          error: `Validation error: ${JSON.stringify(errorData.error)}`,
        };
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Airtable Create] Error:', response.status, errorText);

        attempt++;
        if (attempt < MAX_RETRIES) {
          const backoffDelay = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
          console.log(`[Airtable Create] Network error. Retrying in ${backoffDelay}ms (attempt ${attempt}/${MAX_RETRIES})`);
          await sleep(backoffDelay);
          continue;
        }

        return {
          success: false,
          error: `Failed to create record: ${response.statusText}`,
        };
      }

      const data = await response.json();
      console.log('[Airtable Create] Success! Record ID:', data.id);
      console.log('[Airtable Create] Quote ID:', generatedQuoteId);

      return {
        success: true,
        recordId: data.id,
        quoteId: generatedQuoteId,
        operation: 'create',
      };

    } catch (error) {
      console.error('[Airtable Create] Exception:', error);

      attempt++;
      if (attempt < MAX_RETRIES) {
        const backoffDelay = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
        console.log(`[Airtable Create] Exception occurred. Retrying in ${backoffDelay}ms (attempt ${attempt}/${MAX_RETRIES})`);
        await sleep(backoffDelay);
        continue;
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          error: 'Network error. Please check your connection and try again.',
        };
      }

      return {
        success: false,
        error: 'An unexpected error occurred while creating the quote record.',
      };
    }
  }

  return {
    success: false,
    error: 'Failed to create quote record after multiple attempts.',
  };
};

export const updateQuoteRecord = async (
  config: AirtableWriteConfig,
  recordId: string,
  updates: Record<string, any>
): Promise<AirtableWriteResult> => {
  const tableName = config.tableName || 'Client Quotes';
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      await enforceRateLimit();

      const url = `${AIRTABLE_API_BASE}/${config.baseId}/${encodeURIComponent(tableName)}`;

      console.log(`[Airtable Update] Attempt ${attempt + 1}/${MAX_RETRIES}`);
      console.log('[Airtable Update] Record ID:', recordId);
      console.log('[Airtable Update] Timestamp:', new Date().toISOString());
      console.log('[Airtable Update] Fields to update:', Object.keys(updates));

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: [{
            id: recordId,
            fields: updates,
          }],
        }),
      });

      if (response.status === 429) {
        attempt++;
        if (attempt < MAX_RETRIES) {
          const backoffDelay = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
          console.log(`[Airtable Update] Rate limited. Retrying in ${backoffDelay}ms (attempt ${attempt}/${MAX_RETRIES})`);
          await sleep(backoffDelay);
          continue;
        }
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
        };
      }

      if (response.status === 401) {
        console.error('[Airtable Update] 401 Unauthorized - Invalid API key');
        return {
          success: false,
          error: 'Authentication failed. Please check Airtable API credentials.',
        };
      }

      if (response.status === 403) {
        console.error('[Airtable Update] 403 Forbidden - Insufficient permissions');
        return {
          success: false,
          error: 'Insufficient permissions to update Airtable record.',
        };
      }

      if (response.status === 404) {
        console.error('[Airtable Update] 404 Not Found - Record does not exist');
        return {
          success: false,
          error: 'Airtable record not found.',
        };
      }

      if (response.status === 422) {
        const errorData = await response.json();
        console.error('[Airtable Update] 422 Unprocessable - Validation error:', errorData);
        return {
          success: false,
          error: `Validation error: ${JSON.stringify(errorData.error)}`,
        };
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Airtable Update] Error:', response.status, errorText);

        attempt++;
        if (attempt < MAX_RETRIES) {
          const backoffDelay = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
          console.log(`[Airtable Update] Network error. Retrying in ${backoffDelay}ms (attempt ${attempt}/${MAX_RETRIES})`);
          await sleep(backoffDelay);
          continue;
        }

        return {
          success: false,
          error: `Failed to update record: ${response.statusText}`,
        };
      }

      const data = await response.json();
      console.log('[Airtable Update] Success! Record ID:', data.records[0].id);

      return {
        success: true,
        recordId: data.records[0].id,
        operation: 'update',
      };

    } catch (error) {
      console.error('[Airtable Update] Exception:', error);

      attempt++;
      if (attempt < MAX_RETRIES) {
        const backoffDelay = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
        console.log(`[Airtable Update] Exception occurred. Retrying in ${backoffDelay}ms (attempt ${attempt}/${MAX_RETRIES})`);
        await sleep(backoffDelay);
        continue;
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          error: 'Network error. Please check your connection and try again.',
        };
      }

      return {
        success: false,
        error: 'An unexpected error occurred while updating the quote record.',
      };
    }
  }

  return {
    success: false,
    error: 'Failed to update quote record after multiple attempts.',
  };
};
