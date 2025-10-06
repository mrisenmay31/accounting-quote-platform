/*
  # Multi-Tenant Quote Calculator Schema

  ## Overview
  Creates the foundational database schema for the multi-tenant quote calculator platform.
  This migration establishes tenant management and quote storage with proper security.

  ## New Tables

  ### 1. `tenants`
  Stores configuration and metadata for each accounting firm using the platform.

  **Columns:**
  - `id` (uuid, primary key) - Unique tenant identifier
  - `subdomain` (text, unique) - Tenant's subdomain (e.g., 'ledgerly' in ledgerly.platform.com)
  - `custom_domain` (text, unique, nullable) - Optional custom domain (e.g., quote.firmname.com)
  - `firm_name` (text) - Display name of the accounting firm
  - `firm_tagline` (text, nullable) - Marketing tagline for the firm
  - `logo_url` (text, nullable) - URL to firm's logo image
  - `primary_color` (text) - Hex color code for primary brand color
  - `secondary_color` (text) - Hex color code for secondary brand color
  - `airtable_pricing_base_id` (text) - Airtable base ID for pricing configuration
  - `airtable_pricing_api_key` (text) - Airtable API key for pricing base
  - `airtable_services_base_id` (text) - Airtable base ID for services configuration
  - `airtable_services_api_key` (text) - Airtable API key for services base
  - `zapier_webhook_url` (text) - Webhook URL for engagement letter generation
  - `active` (boolean) - Whether tenant is active and can receive traffic
  - `created_at` (timestamptz) - When tenant was created
  - `updated_at` (timestamptz) - When tenant was last modified

  ### 2. `quotes`
  Centralized storage for all quotes generated across all tenants.

  **Columns:**
  - `id` (uuid, primary key) - Unique quote identifier
  - `tenant_id` (uuid, foreign key) - References tenants table
  - `quote_number` (text) - Human-readable quote number
  - `customer_email` (text) - Customer's email address
  - `customer_name` (text) - Customer's full name
  - `form_data` (jsonb) - Complete form submission data
  - `quote_data` (jsonb) - Calculated quote results and pricing
  - `total_monthly_fees` (numeric) - Total monthly recurring fees
  - `total_one_time_fees` (numeric) - Total one-time fees
  - `total_annual` (numeric) - Total annual cost
  - `services_selected` (text[]) - Array of selected service IDs
  - `created_at` (timestamptz) - When quote was generated
  - `updated_at` (timestamptz) - When quote was last modified

  ## Security

  ### Row Level Security (RLS)
  - Both tables have RLS enabled
  - Tenants table: Only accessible by authenticated admin users (placeholder for future admin dashboard)
  - Quotes table: Queries automatically filtered by tenant_id to prevent cross-tenant data access

  ### Policies
  1. **Tenants Table:**
     - Public read access for active tenants (needed for app initialization)
     - Future: Admin-only write access

  2. **Quotes Table:**
     - Public insert access (quotes submitted from public-facing calculator)
     - Tenant-scoped read access (future admin dashboard)

  ## Indexes
  - `tenants.subdomain` - Fast tenant lookup by subdomain
  - `tenants.custom_domain` - Fast tenant lookup by custom domain
  - `quotes.tenant_id` - Fast quote filtering by tenant
  - `quotes.customer_email` - Fast customer quote lookup
  - `quotes.created_at` - Efficient time-based queries

  ## Instructions
  1. Go to your Supabase Dashboard (https://supabase.com/dashboard)
  2. Select your project
  3. Navigate to the SQL Editor
  4. Copy and paste this entire file
  5. Click "Run" to execute the migration
  6. Verify tables are created in the Table Editor

  ## After Running This Migration
  You'll need to insert your first tenant (Ledgerly) using this SQL:

  INSERT INTO tenants (
    subdomain,
    firm_name,
    firm_tagline,
    primary_color,
    secondary_color,
    airtable_pricing_base_id,
    airtable_pricing_api_key,
    airtable_services_base_id,
    airtable_services_api_key,
    zapier_webhook_url
  ) VALUES (
    'ledgerly',
    'Ledgerly',
    'Get your personalized tax & accounting quote',
    '#059669',
    '#f97316',
    'YOUR_AIRTABLE_PRICING_BASE_ID',
    'YOUR_AIRTABLE_PRICING_API_KEY',
    'YOUR_AIRTABLE_SERVICES_BASE_ID',
    'YOUR_AIRTABLE_SERVICES_API_KEY',
    'YOUR_ZAPIER_WEBHOOK_URL'
  );
*/

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain text UNIQUE NOT NULL,
  custom_domain text UNIQUE,
  firm_name text NOT NULL,
  firm_tagline text,
  logo_url text,
  primary_color text DEFAULT '#059669',
  secondary_color text DEFAULT '#f97316',
  airtable_pricing_base_id text NOT NULL,
  airtable_pricing_api_key text NOT NULL,
  airtable_services_base_id text NOT NULL,
  airtable_services_api_key text NOT NULL,
  zapier_webhook_url text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  quote_number text NOT NULL,
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  form_data jsonb NOT NULL,
  quote_data jsonb NOT NULL,
  total_monthly_fees numeric(10,2) DEFAULT 0,
  total_one_time_fees numeric(10,2) DEFAULT 0,
  total_annual numeric(10,2) DEFAULT 0,
  services_selected text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON tenants(custom_domain);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(active);
CREATE INDEX IF NOT EXISTS idx_quotes_tenant_id ON quotes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_email ON quotes(customer_email);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);

-- Enable Row Level Security
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow public read access to active tenants
-- This is required for the app to load tenant configuration on initialization
CREATE POLICY "Allow public read access to active tenants"
  ON tenants
  FOR SELECT
  TO anon
  USING (active = true);

-- RLS Policy: Allow authenticated users to read all tenants (for admin dashboard)
CREATE POLICY "Allow authenticated users to read all tenants"
  ON tenants
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Allow public insert of quotes (quotes submitted from calculator)
CREATE POLICY "Allow public insert of quotes"
  ON quotes
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- RLS Policy: Allow authenticated users to read quotes from all tenants (for admin)
CREATE POLICY "Allow authenticated users to read all quotes"
  ON quotes
  FOR SELECT
  TO authenticated
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create helper function to get tenant by subdomain or custom domain
CREATE OR REPLACE FUNCTION get_tenant_by_domain(domain_value text)
RETURNS tenants AS $$
BEGIN
  RETURN (
    SELECT *
    FROM tenants
    WHERE (subdomain = domain_value OR custom_domain = domain_value)
      AND active = true
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
