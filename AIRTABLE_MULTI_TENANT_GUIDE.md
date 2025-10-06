# Airtable Multi-Tenant Setup Guide

## Overview

In the multi-tenant architecture, each accounting firm (tenant) has their own Airtable base with identical schema but unique pricing values. This allows each firm to control their own pricing without touching code.

---

## Why Separate Airtable Bases?

**Benefits:**
- ✅ Each tenant controls their own pricing independently
- ✅ No risk of one tenant accidentally modifying another's pricing
- ✅ Easier to manage tenant-specific pricing rules
- ✅ Simpler onboarding (just clone a base)
- ✅ Tenants can use their own Airtable accounts if desired

**Alternative (Not Recommended):**
Using a single shared Airtable base with a "Tenant ID" column would create:
- ❌ Complex filtering logic in queries
- ❌ Risk of data leakage between tenants
- ❌ Difficult permission management
- ❌ Rate limit issues as tenant count grows

---

## Airtable Base Structure

Each tenant needs TWO Airtable bases:

### 1. Pricing Variables Base
**Purpose:** Stores all pricing rules, fees, and calculations

**Required Tables:**
- `Pricing Variables` - Contains pricing rules and formulas

**Key Fields in Pricing Variables Table:**
- Service ID (text)
- Pricing Rule ID (text)
- Rule Name (text)
- Description (text)
- Pricing Type (single select: Base Service, Add-on, Discount)
- Base Price (currency)
- Billing Frequency (single select: Monthly, One-Time Fee, Annual)
- Active (checkbox)
- Trigger Form Field (text)
- Required Form Field (text)
- Comparison Logic (single select: equals, includes, notEquals, etc.)
- Per-Unit Pricing (checkbox)
- Unit Price (currency)
- Unit Name (text)
- Quantity Source Field (text)
- Advisory Discount Eligible (checkbox)
- Advisory Discount Percentage (percent or number)

### 2. Services Configuration Base
**Purpose:** Defines which services appear in the calculator

**Required Tables:**
- `Services` - Lists available services

**Key Fields in Services Table:**
- Service ID (text)
- Title (text)
- Description (text)
- Icon Name (text)
- Color (text)
- Featured (checkbox)
- Benefits (long text, JSON array)
- Quote Included Features (long text, JSON array)
- Active (checkbox)
- Service Order (number)

---

## Step-by-Step: Creating a New Tenant's Airtable Bases

### Step 1: Locate Your Master Bases

1. Go to Airtable.com and log in
2. Find your original Ledgerly Pricing Variables base
3. Find your original Ledgerly Services base
4. These will serve as templates for all new tenants

### Step 2: Duplicate Bases for New Tenant

**For Pricing Variables:**
1. Open the Ledgerly Pricing Variables base
2. Click the dropdown arrow next to the base name (top left)
3. Select **"Duplicate base"**
4. Rename to: `[Tenant Name] - Pricing Variables`
   - Example: `Smith & Co - Pricing Variables`
5. The base opens automatically after duplication

**For Services Configuration:**
1. Open the Ledgerly Services base
2. Click the dropdown arrow next to the base name
3. Select **"Duplicate base"**
4. Rename to: `[Tenant Name] - Services`
   - Example: `Smith & Co - Services`

### Step 3: Customize Pricing for New Tenant

1. Open the duplicated Pricing Variables base
2. Navigate to the `Pricing Variables` table
3. Modify pricing values as needed:
   - Update `Base Price` values
   - Adjust `Unit Price` for per-unit pricing rules
   - Modify `Advisory Discount Percentage` if different
   - Change minimum fee rules if needed
4. **Do NOT modify:**
   - Service IDs
   - Pricing Rule IDs
   - Field names or structure
   - Comparison Logic options

### Step 4: Customize Services (Optional)

Most tenants will use the same services, but you can:

1. Open the duplicated Services base
2. Modify service descriptions to match tenant's language
3. Update benefits list if needed
4. Enable/disable services by unchecking `Active`
5. **Do NOT modify:**
   - Service IDs (these must match across all tenants)
   - Icon Names (unless you know the valid Lucide icon names)

### Step 5: Get Base IDs and API Key

**Get Base IDs:**
1. Open the Pricing Variables base
2. Look at the URL: `https://airtable.com/appXXXXXXXXXXXXXX/...`
3. Copy the part starting with `app...` (e.g., `appAbc123Xyz789`)
4. This is your **Pricing Base ID**
5. Repeat for Services base to get **Services Base ID**

**Get API Key:**
1. Go to https://airtable.com/account
2. Click **"Generate API key"** if you don't have one
3. Copy your API key (starts with `key...`)
4. **Security Note:** You can use the same API key for all bases in your account, OR create a separate Airtable account for each tenant for complete isolation

### Step 6: Add to Supabase

Insert the tenant record with the new base IDs:

```sql
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
  zapier_webhook_url,
  active
) VALUES (
  'smithtax',
  'Smith & Co Tax Services',
  'Expert tax solutions',
  '#3b82f6',
  '#8b5cf6',
  'appXXXPricingBaseID',  -- From Step 5
  'keyYourAirtableKey',     -- From Step 5
  'appXXXServicesBaseID',   -- From Step 5
  'keyYourAirtableKey',     -- From Step 5 (can be same key)
  'https://hooks.zapier.com/...',
  true
);
```

---

## Schema Consistency is Critical

### What Must Stay Consistent Across All Tenant Bases:

**Pricing Variables Table:**
- Table name: `Pricing Variables`
- Service IDs must match (e.g., "bookkeeping", "individual-tax", "business-tax")
- Pricing Rule IDs must exist for core pricing rules
- Field names must be identical
- Active field must be checkbox type

**Services Table:**
- Table name: `Services`
- Service IDs must match
- Icon names should use valid Lucide React icon names
- Active field must be checkbox type

### What Can Vary Per Tenant:

- Pricing values (Base Price, Unit Price, etc.)
- Discount percentages
- Service descriptions and benefits
- Which services are active
- Service order

### What Happens if Schema Diverges:

- ❌ App will fail to load pricing correctly
- ❌ Services may not appear
- ❌ Quotes may calculate incorrectly
- ❌ Form fields may break

**Best Practice:** Lock down the base structure and only allow editing of:
- Price values
- Description text
- Benefits and features lists
- Active/inactive toggles

---

## Managing Schema Updates

### When You Need to Add a New Pricing Rule

**Problem:** You want to add a new pricing rule that affects all tenants.

**Solution:**
1. Add the new pricing rule to your master Ledgerly base first
2. Test thoroughly
3. Export the new pricing rule as a CSV
4. For each tenant base:
   - Import the CSV to add the new rule
   - Have tenant review and adjust prices if needed
5. Alternatively: Write a script using Airtable API to bulk-add the rule

### When You Need to Add a New Service

**Problem:** You want to offer a new service across all tenants.

**Solution:**
1. Add the new service to master Services base
2. Add corresponding pricing rules to master Pricing Variables base
3. For each tenant:
   - Manually add the service record
   - Manually add pricing rules
   - Set Active = true if they want to offer it
4. Consider building an admin tool to push new services to all tenants

---

## Airtable API Rate Limits

### Rate Limits Per Base:
- 5 requests per second per base
- 100,000 requests per 24 hours per base

### How This Works with Multi-Tenant:
- ✅ Each tenant base has its own rate limit
- ✅ 10 tenants = 10 separate rate limits
- ✅ No contention between tenants
- ✅ As you scale, rate limits scale proportionally

### Caching Strategy:
The app caches Airtable data for 5 minutes per tenant, so:
- First user to a tenant's calculator: Hits Airtable (1 request)
- Next users within 5 minutes: Served from cache (0 requests)
- After 5 minutes: Cache expires, next user triggers fetch

**Typical usage:**
- 100 quotes per day per tenant
- ~20 unique calculator loads (many users use cached data)
- Well below rate limits

---

## Alternative: Shared API Key vs Separate Accounts

### Option A: Single Airtable Account (Recommended for Small Scale)

**How it works:**
- All tenant bases are in your Airtable account
- All tenants use the same API key
- You manage all bases

**Pros:**
- ✅ Simple to set up and manage
- ✅ Single billing account
- ✅ Easy to make bulk changes

**Cons:**
- ❌ Tenants can't access their own Airtable bases
- ❌ All bases count toward your workspace limits
- ❌ Security: API key gives access to all bases

**Best for:** 5-20 tenants, managed service model

### Option B: Separate Airtable Accounts Per Tenant

**How it works:**
- Each tenant has their own Airtable account
- Each tenant uses their own API key
- Tenant owns and manages their base

**Pros:**
- ✅ Complete data isolation
- ✅ Tenant controls their own data
- ✅ Tenant pays their own Airtable bill
- ✅ Better security

**Cons:**
- ❌ More complex onboarding
- ❌ Harder to provide support
- ❌ Can't make bulk changes easily

**Best for:** Enterprise tenants, white-label SaaS

---

## Troubleshooting Airtable Issues

### Pricing Not Loading

**Error:** "Using default pricing"

**Causes:**
1. Base ID is incorrect
2. API key doesn't have access to base
3. Table name is not "Pricing Variables"
4. Active field is not properly set

**Fix:**
1. Verify base ID in Supabase matches Airtable URL
2. Test API key with Airtable API: `curl -H "Authorization: Bearer YOUR_KEY" https://api.airtable.com/v0/BASE_ID/Pricing%20Variables`
3. Check table name exactly (case-sensitive, space is correct)
4. Ensure pricing rules have Active checkbox checked

### Services Not Appearing

**Error:** Services show but with wrong data

**Causes:**
1. Services base ID is incorrect
2. Service IDs don't match expected values
3. Table name is not "Services"

**Fix:**
1. Verify Services base ID
2. Check Service ID values: must be "individual-tax", "business-tax", "bookkeeping", "advisory", "additional-services"
3. Ensure table name is exactly "Services"

### Quote Calculation Wrong

**Error:** Prices seem off or not applying correctly

**Causes:**
1. Pricing rules missing or inactive
2. Comparison logic doesn't match form fields
3. Per-unit pricing misconfigured

**Fix:**
1. Review all pricing rules in Airtable
2. Verify Trigger Form Field values match FormData structure
3. Check browser console for calculation logs
4. Compare to working tenant (Ledgerly)

---

## Best Practices

### For Platform Operators:

1. **Maintain a Template Base:** Keep Ledgerly as your master template
2. **Document Schema:** Keep a schema reference document
3. **Version Control:** Note when you make schema changes
4. **Test Before Deploy:** Test new pricing rules in staging tenant first
5. **Backup Regularly:** Export tenant bases periodically

### For Tenant Onboarding:

1. **Use a Checklist:** Document every step
2. **Provide Training:** Show tenant how to modify pricing
3. **Lock Structure:** Use Airtable permissions to prevent schema changes
4. **Test Thoroughly:** Submit test quotes before going live
5. **Document Pricing Logic:** Help tenant understand how rules work

### For Ongoing Management:

1. **Monitor Airtable Usage:** Track API calls and stay under limits
2. **Cache Aggressively:** 5-minute cache keeps API calls low
3. **Plan Schema Updates:** Coordinate changes across all tenants
4. **Version Pricing Rules:** Add dates to rule names when updating
5. **Support Tenant Experiments:** Let them test pricing changes safely

---

## Future Enhancements

Consider building:

1. **Airtable Base Cloning Tool:** Automate tenant base creation
2. **Schema Validator:** Check if tenant base matches required schema
3. **Pricing Comparison Tool:** Compare pricing across tenants
4. **Bulk Update Tool:** Push schema changes to all tenant bases
5. **Admin Dashboard:** Allow tenants to modify pricing via UI instead of Airtable

For now, manual base duplication and management works well for up to 20-30 tenants.

---

## Summary

Multi-tenant Airtable architecture gives you:
- ✅ Scalable pricing management
- ✅ Tenant isolation and security
- ✅ Independent rate limits
- ✅ Flexible per-tenant customization
- ✅ Non-technical pricing updates

Follow this guide to create and manage Airtable bases for each new tenant, ensuring schema consistency while allowing pricing flexibility.
