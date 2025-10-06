import { createClient } from '@supabase/supabase-js';

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client singleton
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for database schema
export interface Tenant {
  id: string;
  subdomain: string;
  custom_domain: string | null;
  firm_name: string;
  firm_tagline: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  airtable_pricing_base_id: string;
  airtable_pricing_api_key: string;
  airtable_services_base_id: string;
  airtable_services_api_key: string;
  zapier_webhook_url: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  tenant_id: string;
  quote_number: string;
  customer_email: string;
  customer_name: string;
  form_data: Record<string, any>;
  quote_data: Record<string, any>;
  total_monthly_fees: number;
  total_one_time_fees: number;
  total_annual: number;
  services_selected: string[];
  created_at: string;
  updated_at: string;
}
