export interface FirmInfo {
  firmName: string;
  primaryBrandColor: string;
  secondaryBrandColor: string;
  servicesOffered: string;

  // Tool Branding
  toolName?: string;
  toolTagline?: string;

  // Quote Page Content
  quoteHeaderTitle?: string;
  quoteHeaderSubtitle?: string;
  quoteLockDays?: number;

  // Value Propositions
  valueProp1Title?: string;
  valueProp1Icon?: string;
  valueProp2Title?: string;
  valueProp2Icon?: string;
  valueProp3Title?: string;
  valueProp3Icon?: string;

  // Trust Badges
  trustBadge1?: string;
  trustBadge2?: string;
  trustBadge3?: string;
  trustBadge4?: string;
  trustBadge5?: string;
  trustBadge6?: string;

  // Promise/Guarantee
  promiseCalloutText?: string;

  // Testimonials
  testimonial1ClientName?: string;
  testimonial1Text?: string;
  testimonial2ClientName?: string;
  testimonial2Text?: string;

  // Form field type overrides
  annualRevenueFieldType?: 'text' | 'number' | 'dropdown';
  annualRevenueOptions?: string[];
  monthlyTransactionsFieldType?: 'text' | 'number' | 'dropdown';
  monthlyTransactionsOptions?: string[];
}

interface FirmInfoCache {
  data: FirmInfo;
  timestamp: number;
}

const firmInfoCache = new Map<string, FirmInfoCache>();
const CACHE_DURATION = 3600000; // 1 hour

export const getFirmInfo = async (
  baseId: string,
  apiKey: string
): Promise<FirmInfo | null> => {
  const cacheKey = `${baseId}:firminfo`;

  const cached = firmInfoCache.get(cacheKey);
  if (cached) {
    const age = Date.now() - cached.timestamp;
    if (age < CACHE_DURATION) {
      console.log('[FirmInfoService] Cache hit - using cached Firm Info');
      return cached.data;
    }
    firmInfoCache.delete(cacheKey);
  }

  console.log('[FirmInfoService] Fetching from Airtable', { baseId });

  try {
    const url = `https://api.airtable.com/v0/${baseId}/Firm%20Info`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[FirmInfoService] Airtable API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data.records || data.records.length === 0) {
      console.warn('[FirmInfoService] No records found');
      return null;
    }

    const record = data.records[0];
    const fields = record.fields;

    const firmInfo: FirmInfo = {
      firmName: fields['Firm Name'] || '',
      primaryBrandColor: fields['Primary Brand Color'] || '',
      secondaryBrandColor: fields['Secondary Brand Color'] || '',
      servicesOffered: fields['Services Offered'] || '',

      // Tool Branding
      toolName: fields['Tool Name'] || 'Quote Calculator',
      toolTagline: fields['Tool Tagline'] || '',

      // Quote Page Content
      quoteHeaderTitle: fields['Quote Header Title'] || 'Your Customized Quote',
      quoteHeaderSubtitle: fields['Quote Header Subtitle'] || '',
      quoteLockDays: fields['Quote Lock Days'] || 14,

      // Value Propositions
      valueProp1Title: fields['Value Prop 1 Title'] || '',
      valueProp1Icon: fields['Value Prop 1 Icon'] || '',
      valueProp2Title: fields['Value Prop 2 Title'] || '',
      valueProp2Icon: fields['Value Prop 2 Icon'] || '',
      valueProp3Title: fields['Value Prop 3 Title'] || '',
      valueProp3Icon: fields['Value Prop 3 Icon'] || '',

      // Trust Badges
      trustBadge1: fields['Trust Badge 1'] || '',
      trustBadge2: fields['Trust Badge 2'] || '',
      trustBadge3: fields['Trust Badge 3'] || '',
      trustBadge4: fields['Trust Badge 4'] || '',
      trustBadge5: fields['Trust Badge 5'] || '',
      trustBadge6: fields['Trust Badge 6'] || '',

      // Promise
      promiseCalloutText: fields['Promise Callout Text'] || '',

      // Testimonials
      testimonial1ClientName: fields['Client Testimonial 1 - Client Name'] || '',
      testimonial1Text: fields['Client Testimonial 1 - Testimonial Text'] || '',
      testimonial2ClientName: fields['Client Testimonial 2 - Client Name'] || '',
      testimonial2Text: fields['Client Testimonial 2 - Testimonial Text'] || '',

      // Form field type overrides
      annualRevenueFieldType: fields['Annual Revenue Field Type'] || 'dropdown',
      annualRevenueOptions: (() => {
        try {
          return fields['Annual Revenue Options']
            ? JSON.parse(fields['Annual Revenue Options'])
            : [];
        } catch (error) {
          console.warn('[FirmInfoService] Failed to parse Annual Revenue Options:', error);
          return [];
        }
      })(),
      monthlyTransactionsFieldType: fields['Monthly Transactions Field Type'] || 'number',
      monthlyTransactionsOptions: (() => {
        try {
          return fields['Monthly Transactions Options']
            ? JSON.parse(fields['Monthly Transactions Options'])
            : [];
        } catch (error) {
          console.warn('[FirmInfoService] Failed to parse Monthly Transactions Options:', error);
          return [];
        }
      })(),
    };

    console.log('[FirmInfoService] Successfully fetched', {
      firmName: firmInfo.firmName,
      quoteHeaderTitle: firmInfo.quoteHeaderTitle,
      valueProp1Title: firmInfo.valueProp1Title,
      trustBadge1: firmInfo.trustBadge1,
      testimonial1ClientName: firmInfo.testimonial1ClientName,
    });

    firmInfoCache.set(cacheKey, {
      data: firmInfo,
      timestamp: Date.now(),
    });

    return firmInfo;

  } catch (error) {
    console.error('[FirmInfoService] Error:', error);
    return null;
  }
};
