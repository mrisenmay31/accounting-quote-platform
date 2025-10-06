# Multi-Tenant Quote Calculator - Setup Guide

## Phase 1 Implementation - Complete! ✅

This document provides step-by-step instructions for setting up and using the multi-tenant quote calculator platform.

## What Was Built

Your quote calculator is now a fully multi-tenant platform where multiple accounting firms can each have their own:
- Branded calculator with custom colors, logo, and firm name
- Separate Airtable base for pricing configuration
- Unique subdomain or custom domain
- Individual Zapier webhook for engagement letters
- Isolated quote storage in Supabase

All running on a single codebase with 95% of the original Ledgerly code unchanged.

---

## Step 1: Set Up Supabase Database

### 1.1 Run the Database Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Open the file `supabase-migration.sql` in this project directory
5. Copy and paste the entire contents into the SQL Editor
6. Click **Run** to execute the migration

This will create:
- `tenants` table - stores firm configuration, branding, and Airtable credentials
- `quotes` table - centralized quote storage across all tenants
- Proper indexes for fast lookups
- Row Level Security policies for data isolation
- Helper functions for tenant resolution

### 1.2 Verify Tables Were Created

1. Go to **Table Editor** in Supabase Dashboard
2. Confirm you see `tenants` and `quotes` tables
3. Both should be empty at this point

---

## Step 2: Set Up Your First Tenant (Ledgerly)

### 2.1 Gather Required Information

Before adding a tenant, collect:
- Subdomain (e.g., "ledgerly" for ledgerly.platform.com)
- Firm name (e.g., "Ledgerly")
- Firm tagline (optional, e.g., "Get your personalized tax & accounting quote")
- Logo URL (optional - leave as NULL to use default icon)
- Primary brand color (hex code, e.g., "#059669" for emerald)
- Secondary brand color (hex code, e.g., "#f97316" for orange)
- Airtable Pricing base ID (from your existing Airtable base)
- Airtable Pricing API key
- Airtable Services base ID (from your existing Airtable base)
- Airtable Services API key
- Zapier webhook URL

### 2.2 Insert Ledgerly Tenant

1. Go to Supabase Dashboard → **SQL Editor**
2. Run this SQL (replace the placeholder values with your actual data):

```sql
INSERT INTO tenants (
  subdomain,
  firm_name,
  firm_tagline,
  logo_url,
  primary_color,
  secondary_color,
  airtable_pricing_base_id,
  airtable_pricing_api_key,
  airtable_services_base_id,
  airtable_services_api_key,
  zapier_webhook_url,
  active
) VALUES (
  'ledgerly',
  'Ledgerly',
  'Get your personalized tax & accounting quote',
  NULL,
  '#059669',
  '#f97316',
  'YOUR_AIRTABLE_PRICING_BASE_ID',
  'YOUR_AIRTABLE_PRICING_API_KEY',
  'YOUR_AIRTABLE_SERVICES_BASE_ID',
  'YOUR_AIRTABLE_SERVICES_API_KEY',
  'YOUR_ZAPIER_WEBHOOK_URL',
  true
);
```

3. Click **Run**
4. Verify the tenant was created in **Table Editor** → `tenants`

---

## Step 3: Local Development Testing

### 3.1 Test with Query Parameter

Since you're running locally, the app uses a query parameter to simulate subdomains:

1. Start your dev server: `npm run dev`
2. Open your browser to: `http://localhost:5173/?tenant=ledgerly`
3. The calculator should load with Ledgerly branding

### 3.2 What to Verify

Check that:
- ✅ The firm name appears in the header ("Ledgerly Quote Calculator")
- ✅ The tagline appears below the firm name
- ✅ The colors match your brand colors
- ✅ Services load from your Airtable Services base
- ✅ Pricing loads from your Airtable Pricing base
- ✅ Quotes are saved to Supabase when submitted
- ✅ Zapier webhook receives the quote data

### 3.3 Check Browser Console

Open Developer Tools (F12) → Console and look for:
```
Development mode: Using tenant "ledgerly"
Resolving tenant by subdomain: ledgerly
Successfully fetched pricing configuration from Airtable: [...]
Successfully fetched service configuration from Airtable: [...]
```

---

## Step 4: Add a Second Tenant

### 4.1 Clone Your Airtable Base

1. Go to Airtable.com and open your Ledgerly base
2. Click the dropdown next to the base name → **Duplicate base**
3. Rename it to match the new tenant (e.g., "Smith & Co Tax - Pricing")
4. Update the pricing values in the "Pricing Variables" table for the new tenant
5. Update service descriptions in the "Services" table if needed
6. Copy the new base ID from the URL: `https://airtable.com/YOUR_NEW_BASE_ID/...`
7. Generate or use an existing API key from Airtable account settings

### 4.2 Insert New Tenant

Run this SQL in Supabase (update with new tenant's information):

```sql
INSERT INTO tenants (
  subdomain,
  firm_name,
  firm_tagline,
  logo_url,
  primary_color,
  secondary_color,
  airtable_pricing_base_id,
  airtable_pricing_api_key,
  airtable_services_base_id,
  airtable_services_api_key,
  zapier_webhook_url,
  active
) VALUES (
  'smithtax',
  'Smith & Co Tax Services',
  'Expert tax solutions for individuals and businesses',
  'https://example.com/logo.png',
  '#3b82f6',
  '#8b5cf6',
  'NEW_TENANT_PRICING_BASE_ID',
  'NEW_TENANT_PRICING_API_KEY',
  'NEW_TENANT_SERVICES_BASE_ID',
  'NEW_TENANT_SERVICES_API_KEY',
  'NEW_TENANT_ZAPIER_WEBHOOK_URL',
  true
);
```

### 4.3 Test New Tenant

1. Open: `http://localhost:5173/?tenant=smithtax`
2. Verify the new branding appears
3. Verify pricing loads from the new tenant's Airtable base
4. Submit a test quote and verify it's saved with the correct `tenant_id` in Supabase

---

## Step 5: Deploy to Production (Vercel)

### 5.1 Configure Wildcard DNS

For subdomain routing (e.g., ledgerly.yourplatform.com, smithtax.yourplatform.com):

1. Go to your domain registrar or DNS provider
2. Add a wildcard CNAME record:
   - **Type:** CNAME
   - **Name:** `*.yourplatform` (or `*` if using root domain)
   - **Value:** `cname.vercel-dns.com`
   - **TTL:** 3600 (or default)

### 5.2 Deploy to Vercel

1. Push your code to GitHub
2. Go to Vercel Dashboard
3. Import your GitHub repository
4. In **Environment Variables**, add:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
5. Click **Deploy**

### 5.3 Configure Custom Domains in Vercel

1. In Vercel Project Settings → **Domains**
2. Add your main domain: `yourplatform.com`
3. Add wildcard domain: `*.yourplatform.com`
4. Vercel will automatically handle SSL certificates

### 5.4 Test Production

1. Visit: `https://ledgerly.yourplatform.com`
2. Verify Ledgerly calculator loads with correct branding
3. Visit: `https://smithtax.yourplatform.com`
4. Verify Smith & Co calculator loads with correct branding

---

## Step 6: Enable Custom Domains (Optional)

If a tenant wants to use their own domain (e.g., quote.smithtax.com):

### 6.1 Update Tenant Record

```sql
UPDATE tenants
SET custom_domain = 'quote.smithtax.com'
WHERE subdomain = 'smithtax';
```

### 6.2 Configure DNS at Tenant's Domain

Have the tenant add a CNAME record:
- **Type:** CNAME
- **Name:** `quote` (or their desired subdomain)
- **Value:** `cname.vercel-dns.com`

### 6.3 Add Domain in Vercel

1. Go to Vercel Project Settings → **Domains**
2. Add: `quote.smithtax.com`
3. Vercel will provision an SSL certificate
4. Test the custom domain

---

## Understanding the Architecture

### Tenant Resolution Flow

1. User visits `ledgerly.yourplatform.com`
2. `tenantResolver.ts` extracts subdomain "ledgerly"
3. `tenantService.ts` queries Supabase for tenant with subdomain = "ledgerly"
4. `TenantContext` loads tenant configuration
5. `themeApplier.ts` applies tenant's brand colors
6. `QuoteCalculator` loads pricing from tenant's Airtable base
7. User submits quote → saved to Supabase with `tenant_id`
8. Zapier webhook sends to tenant's specific webhook URL

### Data Isolation

- Each tenant has a separate Airtable base for pricing (tenant controls pricing)
- All quotes stored in single Supabase table with `tenant_id` foreign key
- Row Level Security ensures quotes are filtered by tenant
- Cache is tenant-scoped to prevent data leakage between tenants

### Key Files Created

**Supabase Integration:**
- `src/utils/supabaseClient.ts` - Database connection
- `src/utils/tenantService.ts` - Fetch tenant configuration
- `src/utils/quoteStorage.ts` - Save quotes to database

**Multi-Tenant Infrastructure:**
- `src/utils/tenantResolver.ts` - Extract subdomain/domain from URL
- `src/contexts/TenantContext.tsx` - React context for tenant data
- `src/utils/themeApplier.ts` - Apply tenant branding
- `src/components/TenantLogo.tsx` - Display tenant logo

**Modified Files:**
- `src/App.tsx` - Wrapped with TenantProvider, added loading/error states
- `src/components/QuoteCalculator.tsx` - Uses tenant context for branding and Airtable config
- `src/utils/pricingService.ts` - Accepts tenant-specific Airtable config
- `src/utils/serviceConfigService.ts` - Accepts tenant-specific Airtable config
- `src/utils/zapierIntegration.ts` - Accepts tenant-specific webhook URL

---

## Troubleshooting

### Tenant Not Loading

**Problem:** "Configuration Error" or "Tenant not found"

**Solutions:**
1. Check Supabase connection in browser console
2. Verify tenant exists in Supabase `tenants` table with `active = true`
3. Verify subdomain matches exactly (case-sensitive)
4. In local dev, use `?tenant=subdomain` query parameter

### Pricing Not Loading

**Problem:** Default pricing appears instead of tenant-specific pricing

**Solutions:**
1. Verify Airtable base IDs are correct in tenant record
2. Check Airtable API key has access to the base
3. Verify "Pricing Variables" table exists in Airtable base
4. Check browser console for Airtable API errors
5. Ensure pricing records have `Active` field checked

### Quotes Not Saving

**Problem:** Quotes not appearing in Supabase

**Solutions:**
1. Check browser console for errors
2. Verify Supabase RLS policies allow anonymous inserts on `quotes` table
3. Test Supabase connection using: `supabase.from('quotes').select('count')`
4. Ensure tenant_id is being passed correctly

### Zapier Webhook Not Working

**Problem:** Engagement letters not generating

**Solutions:**
1. Verify webhook URL is correct in tenant record
2. Test webhook URL manually with Postman
3. Check Zapier dashboard for webhook activity
4. Review browser console for webhook errors (logged but doesn't block quote display)

---

## Next Steps

Now that Phase 1 is complete, you can:

1. **Onboard More Tenants** - Clone Airtable bases and insert tenant records
2. **Build Admin Dashboard** (Phase 4) - Self-service portal for tenant management
3. **Customize Per-Tenant Services** - Allow tenants to enable/disable specific services
4. **Add Analytics** - Track quote conversions per tenant
5. **Implement Authentication** - For tenant admin access to their quotes

---

## Support

If you run into issues:

1. Check the browser console for errors
2. Review the Supabase dashboard for data issues
3. Verify Airtable base structure matches original
4. Test each tenant in isolation
5. Check Row Level Security policies in Supabase

**Remember:** The original Ledgerly calculator code is 95% unchanged. Most issues will be related to configuration (tenant records, Airtable credentials, DNS) rather than code bugs.
