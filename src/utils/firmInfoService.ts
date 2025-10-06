export interface FirmInfo {
  firmName: string;
  primaryBrandColor: string;
  secondaryBrandColor: string;
  servicesOffered: string;
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
    };

    console.log('[FirmInfoService] Successfully fetched', firmInfo);

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
