import { supabase, Quote } from './supabaseClient';
import { FormData, QuoteData } from '../types/quote';
import { saveQuoteToAirtable } from './airtableQuoteStorage';
import { TenantConfig } from './tenantService';

export interface SaveQuoteParams {
  tenantId: string;
  formData: FormData;
  quoteData: QuoteData;
  tenant: TenantConfig;
  quoteId?: string;
}

const generateQuoteNumber = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `Q-${timestamp}-${random}`;
};

export const saveQuote = async (params: SaveQuoteParams): Promise<any> => {
  const { tenantId, formData, quoteData, tenant, quoteId } = params;

  try {
    const airtableResult = await saveQuoteToAirtable(
      formData,
      quoteData,
      {
        baseId: tenant.airtable.servicesBaseId,
        apiKey: tenant.airtable.servicesApiKey,
      }
    );

    if (!airtableResult.success) {
      console.error('Failed to save quote to Airtable:', airtableResult.error);
      return null;
    }

    console.log('Quote saved to Airtable successfully:', airtableResult.recordId);

    // Store the quote ID if provided for future reference
    if (quoteId) {
      console.log('Quote ID stored with Airtable record:', quoteId);
    }

    return {
      id: airtableResult.recordId,
      quote_number: airtableResult.quoteNumber,
      quote_id: quoteId || airtableResult.quoteNumber,
      airtable_record_id: airtableResult.recordId,
    };
  } catch (error) {
    console.error('Unexpected error saving quote:', error);
    return null;
  }
};

export const getQuotesByTenant = async (tenantId: string, limit: number = 50): Promise<Quote[]> => {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching quotes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching quotes:', error);
    return [];
  }
};

export const getQuotesByEmail = async (
  tenantId: string,
  email: string,
  limit: number = 10
): Promise<Quote[]> => {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('customer_email', email)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching quotes by email:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching quotes by email:', error);
    return [];
  }
};

export const getQuoteById = async (quoteId: string): Promise<Quote | null> => {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching quote by ID:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error fetching quote by ID:', error);
    return null;
  }
};
