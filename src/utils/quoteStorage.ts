import { supabase, Quote } from './supabaseClient';
import { FormData, QuoteData } from '../types/quote';

export interface SaveQuoteParams {
  tenantId: string;
  formData: FormData;
  quoteData: QuoteData;
}

const generateQuoteNumber = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `Q-${timestamp}-${random}`;
};

export const saveQuote = async (params: SaveQuoteParams): Promise<Quote | null> => {
  const { tenantId, formData, quoteData } = params;

  try {
    const quoteNumber = generateQuoteNumber();
    const customerName = `${formData.firstName} ${formData.lastName}`.trim();
    const customerEmail = formData.email;

    const quoteRecord = {
      tenant_id: tenantId,
      quote_number: quoteNumber,
      customer_email: customerEmail,
      customer_name: customerName,
      form_data: formData,
      quote_data: quoteData,
      total_monthly_fees: quoteData.totalMonthlyFees,
      total_one_time_fees: quoteData.totalOneTimeFees,
      total_annual: quoteData.totalAnnual,
      services_selected: formData.services,
    };

    const { data, error } = await supabase
      .from('quotes')
      .insert(quoteRecord)
      .select()
      .single();

    if (error) {
      console.error('Error saving quote to database:', error);
      return null;
    }

    console.log('Quote saved successfully:', data);
    return data;
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
