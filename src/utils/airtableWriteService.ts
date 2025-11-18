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

const buildQuoteFields = async (
  formData: FormData,
  quoteData: QuoteData,
  quoteId: string,
  tenantId?: string,
  tenantConfig?: any
): Promise<Record<string, any>> => {
  console.log('[Airtable Write] ========== BUILD QUOTE FIELDS START ==========');
  console.log('[Airtable Write] tenantConfig present?', !!tenantConfig);
  console.log('[Airtable Write] tenantConfig.airtable?', tenantConfig?.airtable);
  console.log('[Airtable Write] Selected services:', formData.services);
  console.log('[Airtable Write] contactInfo keys:', Object.keys(formData.contactInfo || {}));
  console.log('[Airtable Write] contactInfo values:', formData.contactInfo);

  const fields: Record<string, any> = {
    'Quote ID': quoteId,
    'Date': formatAsAirtableDate(new Date()),
    'Quote Status': 'New Quote',
    'Services Requested': formData.services.join(', '),
    'Monthly Fees': quoteData.totalMonthlyFees || 0,
    'One-Time Fees': quoteData.totalOneTimeFees || 0,
    'Total Monthly Fees': quoteData.totalMonthlyFees || 0,
    'Annual Total': quoteData.totalAnnual || 0,
  };

  // Handle dynamic contact fields from contactInfo object
  console.log('[Airtable Write] Checking contactInfo condition...');
  console.log('[Airtable Write] - formData.contactInfo exists?', !!formData.contactInfo);
  console.log('[Airtable Write] - contactInfo keys length:', Object.keys(formData.contactInfo || {}).length);

  if (formData.contactInfo && Object.keys(formData.contactInfo).length > 0) {
    console.log('[Airtable Write] ✓ ContactInfo has data, processing dynamic fields...');
    try {
      // Import formFieldsService dynamically to avoid circular dependencies
      const formFieldsService = await import('./formFieldsService');

      console.log('[Airtable Write] Checking tenantConfig...');
      if (tenantConfig) {
        console.log('[Airtable Write] ✓ TenantConfig available');
        const airtableConfig = {
          baseId: tenantConfig.airtable?.servicesBaseId || tenantConfig.airtable?.pricingBaseId,
          apiKey: tenantConfig.airtable?.servicesApiKey || tenantConfig.airtable?.pricingApiKey,
        };
        console.log('[Airtable Write] Airtable config:', { baseId: airtableConfig.baseId?.substring(0, 8) + '...', hasApiKey: !!airtableConfig.apiKey });

        // Fetch contact-info fields to get proper Airtable column mappings
        console.log('[Airtable Write] Fetching contact-info form fields from Airtable...');
        const contactFields = await formFieldsService.getCachedFormFields(
          airtableConfig,
          'contact-info'
        );
        console.log('[Airtable Write] Retrieved', contactFields.length, 'contact-info field definitions');

        // Map dynamic contact fields using Airtable column names
        let mappedFieldCount = 0;
        for (const formField of contactFields) {
          const fieldValue = formData.contactInfo[formField.fieldName];
          console.log(`[Airtable Write] Processing field: ${formField.fieldName}, value:`, fieldValue);

          // Skip if no value
          if (fieldValue === null || fieldValue === undefined || fieldValue === '') {
            console.log(`[Airtable Write] - Skipping ${formField.fieldName} (empty value)`);
            continue;
          }

          // Resolve Airtable column name (explicit or auto-transform)
          const airtableColumnName = formField.airtableColumnName && formField.airtableColumnName.trim()
            ? formField.airtableColumnName
            : transformFieldNameToColumnName(formField.fieldName);

          // Transform value based on field type
          const transformedValue = transformValueByFieldType(
            fieldValue,
            formField.fieldType
          );

          fields[airtableColumnName] = transformedValue;
          mappedFieldCount++;
          console.log(`[Airtable Write] - ✓ Mapped ${formField.fieldName} → "${airtableColumnName}" = ${transformedValue}`);
        }

        console.log(`[Airtable Write] ✓ Successfully mapped ${mappedFieldCount} contact fields to Airtable columns`);
      } else {
        console.warn('[Airtable Write] ✗ TenantConfig is missing - cannot fetch form field definitions');
      }
    } catch (error) {
      console.error('[Airtable Write] ✗ Error loading contact-info fields:', error);
      console.warn('[Airtable Write] Falling back to legacy field mapping');
    }
  } else {
    console.log('[Airtable Write] ✗ ContactInfo is empty, skipping dynamic field processing');
  }

  // Legacy field mapping (for backward compatibility)
  if (formData.email) {
    fields['Email'] = formData.email;
  }
  if (formData.firstName) {
    fields['First Name'] = formData.firstName;
  }
  if (formData.lastName) {
    fields['Last Name'] = formData.lastName;
  }
  if (formData.firstName && formData.lastName) {
    fields['Full Name'] = `${formData.firstName} ${formData.lastName}`.trim();
  }
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

  // ========== DYNAMIC SERVICE FIELDS PROCESSING ==========
  // Process dynamic fields for ALL selected services (not just contact-info)
  // This handles fields from the Form Fields table for services like individual-tax, business-tax, bookkeeping, etc.
  console.log('[Airtable Write] Processing dynamic fields for selected services...');

  if (tenantConfig && formData.services && formData.services.length > 0) {
    try {
      const formFieldsService = await import('./formFieldsService');

      const airtableConfig = {
        baseId: tenantConfig.airtable?.servicesBaseId || tenantConfig.airtable?.pricingBaseId,
        apiKey: tenantConfig.airtable?.servicesApiKey || tenantConfig.airtable?.pricingApiKey,
      };

      // Process each selected service
      for (const serviceId of formData.services) {
        // Skip contact-info as it's already processed above
        if (serviceId === 'contact-info') continue;

        console.log(`[Airtable Write] Fetching form fields for service: ${serviceId}`);

        try {
          const serviceFields = await formFieldsService.getCachedFormFields(
            airtableConfig,
            serviceId
          );

          if (serviceFields.length === 0) {
            console.log(`[Airtable Write] No form fields configured for ${serviceId}, using legacy structure`);
            continue;
          }

          console.log(`[Airtable Write] Retrieved ${serviceFields.length} field definitions for ${serviceId}`);

          // Map dynamic fields from flat formData structure
          let serviceMappedCount = 0;
          for (const formField of serviceFields) {
            // Look for field value at root level of formData (DynamicServiceDetailStep stores fields flat)
            const fieldValue = (formData as any)[formField.fieldName];

            if (fieldValue === null || fieldValue === undefined || fieldValue === '') {
              continue;
            }

            // Resolve Airtable column name
            const airtableColumnName = formField.airtableColumnName && formField.airtableColumnName.trim()
              ? formField.airtableColumnName
              : transformFieldNameToColumnName(formField.fieldName);

            // Transform value based on field type
            const transformedValue = transformValueByFieldType(
              fieldValue,
              formField.fieldType
            );

            fields[airtableColumnName] = transformedValue;
            serviceMappedCount++;
            console.log(`[Airtable Write] - ✓ Mapped ${serviceId}.${formField.fieldName} → "${airtableColumnName}" = ${transformedValue}`);
          }

          if (serviceMappedCount > 0) {
            console.log(`[Airtable Write] ✓ Successfully mapped ${serviceMappedCount} fields for ${serviceId}`);
          }
        } catch (serviceError) {
          console.warn(`[Airtable Write] Could not load form fields for ${serviceId}:`, serviceError);
        }
      }
    } catch (error) {
      console.error('[Airtable Write] Error processing dynamic service fields:', error);
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

  console.log('[Airtable Write] ========== BUILD QUOTE FIELDS END ==========');
  console.log('[Airtable Write] Final field count:', Object.keys(fields).length);
  console.log('[Airtable Write] Final fields:', {
    quoteId: fields['Quote ID'],
    email: fields['Email'],
    services: fields['Services Requested'],
    monthlyFees: fields['Monthly Fees'],
    oneTimeFees: fields['One-Time Fees'],
    allFieldNames: Object.keys(fields)
  });

  return fields;
};

/**
 * Transform field name to Airtable column name
 * Converts camelCase to Title Case
 * Example: firstName -> First Name
 */
function transformFieldNameToColumnName(fieldName: string): string {
  // Split by capital letters and join with spaces
  const words = fieldName.replace(/([A-Z])/g, ' $1').trim();
  // Capitalize first letter of each word
  return words
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format a value as a valid Airtable date string
 * Airtable date fields expect YYYY-MM-DD format
 */
function formatAsAirtableDate(value: any): string | null {
  if (!value) return null;

  try {
    // If already a Date object
    if (value instanceof Date) {
      if (isNaN(value.getTime())) return null;
      return value.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    // If string that can be parsed
    if (typeof value === 'string') {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0]; // YYYY-MM-DD
      }
    }

    // If numeric timestamp
    if (typeof value === 'number') {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0]; // YYYY-MM-DD
      }
    }

    console.warn('[Airtable Write] Could not format value as date:', value);
    return null;
  } catch (error) {
    console.error('[Airtable Write] Date formatting error:', error);
    return null;
  }
}

/**
 * Transform value based on field type for Airtable
 */
function transformValueByFieldType(value: any, fieldType: string): any {
  if (value === null || value === undefined) {
    return value;
  }

  switch (fieldType) {
    case 'number':
      return typeof value === 'number' ? value : parseInt(value) || 0;

    case 'checkbox':
      return Boolean(value);

    case 'date':
      return formatAsAirtableDate(value);

    case 'multi-select':
      // Airtable expects comma-separated string for multi-select
      return Array.isArray(value) ? value.join(', ') : value;

    case 'email':
    case 'phone':
    case 'text':
    case 'textarea':
    case 'dropdown':
    case 'radio':
    default:
      return String(value);
  }
}

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
  quoteId?: string,
  tenantConfig?: any
): Promise<AirtableWriteResult> => {
  const tableName = config.tableName || 'Client Quotes';
  const generatedQuoteId = quoteId || generateQuoteId();
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      await enforceRateLimit();

      const fields = await buildQuoteFields(formData, quoteData, generatedQuoteId, tenantId, tenantConfig);
      const url = `${AIRTABLE_API_BASE}/${config.baseId}/${encodeURIComponent(tableName)}`;

      console.log(`[Airtable Create] Attempt ${attempt + 1}/${MAX_RETRIES}`);
      console.log('[Airtable Create] URL:', url);
      console.log('[Airtable Create] Quote ID:', generatedQuoteId);
      console.log('[Airtable Create] Timestamp:', new Date().toISOString());

      // Debug: Inspect Date field and all date-related fields
      console.log('📋 [Airtable Create] Payload Inspection:');
      console.log('   Total fields:', Object.keys(fields).length);

      if (fields['Date']) {
        console.log('   ⚠️  "Date" field found:', fields['Date']);
        console.log('   ⚠️  "Date" field type:', typeof fields['Date']);
      }

      // Log all fields that might be dates
      Object.entries(fields).forEach(([key, value]) => {
        const keyLower = key.toLowerCase();
        if (keyLower.includes('date') || keyLower.includes('year') || keyLower.includes('timeline')) {
          console.log(`   📅 Potential date field: "${key}" = ${JSON.stringify(value)}`);
        }
      });

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
