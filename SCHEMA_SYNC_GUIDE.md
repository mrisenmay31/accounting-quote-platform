# Automatic Schema Synchronization Guide

## Overview

The Schema Synchronization feature automatically creates columns in your Airtable "Client Quotes" table based on the fields defined in your "Form Fields" table. This ensures your database schema always matches your form configuration without manual setup.

## How It Works

### Architecture

```
Form Fields Table (Source of Truth)
         ↓
Schema Sync Service
         ↓
Client Quotes Table (Auto-Generated Schema)
```

1. **Form Fields Table** - Defines all questionnaire fields with their types and configuration
2. **Schema Sync Service** - Reads Form Fields and creates corresponding columns
3. **Client Quotes Table** - Receives submitted quote data with auto-matched columns

### Automatic Synchronization

Schema sync runs automatically when the application loads:

- Fetches all active form fields from all services
- Checks which fields already exist in Client Quotes table
- Creates any missing columns using Airtable Metadata API
- Logs results to browser console
- **Non-blocking** - App loads normally even if sync fails

## Configuration

### Required Airtable Columns

Add this new **optional** column to your Form Fields table:

| Column Name | Type | Description | Example |
|-------------|------|-------------|---------|
| **Airtable Column Name** | Single Line Text | Explicit name for Client Quotes column | `Individual Tax - Filing Status` |

**If left empty**, the system will auto-generate the column name from the Field Name.

### Auto-Generated Column Names

The system transforms camelCase field names into Title Case with service prefix:

| Field Name | Service ID | Auto-Generated Column Name |
|------------|-----------|---------------------------|
| `filingStatus` | `individual-tax` | `Individual Tax - Filing Status` |
| `annualRevenue` | `business-tax` | `Business Tax - Annual Revenue` |
| `k1Count` | `individual-tax` | `Individual Tax - K1 Count` |
| `monthlyTransactions` | `bookkeeping` | `Bookkeeping - Monthly Transactions` |

### Explicit Column Names

For custom column names, set the "Airtable Column Name" field:

```
Field Name: filingStatus
Service ID: individual-tax
Airtable Column Name: Tax Filing Status 2024
                      ↓
Client Quotes Column: Tax Filing Status 2024
```

## Field Type Mapping

Schema sync automatically converts form field types to Airtable field types:

| Form Field Type | Airtable Field Type | Notes |
|-----------------|---------------------|-------|
| `text` | `singleLineText` | Single-line text input |
| `textarea` | `multilineText` | Multi-line text area |
| `number` | `number` | Numeric value with decimals |
| `dropdown` | `singleSelect` | Single choice from options |
| `multi-select` | `multipleSelects` | Multiple choices from options |
| `checkbox` | `checkbox` | Boolean true/false |
| `radio` | `singleLineText` | Stores selected value as text |
| `date` | `date` | Date field |
| `email` | `email` | Email validation |
| `phone` | `phoneNumber` | Phone number formatting |
| `url` | `url` | URL validation |

### Select Field Options

For dropdown and multi-select fields, the system automatically:

1. Parses the JSON options from "Field Options" column
2. Creates Airtable choices from the array
3. Adds choices to the select field definition

**Example:**

```json
Form Fields Table:
  Field Type: dropdown
  Field Options: ["Single", "Married Filing Jointly", "Head of Household"]

Client Quotes Table:
  Field Type: Single select
  Choices: Single, Married Filing Jointly, Head of Household
```

## API Permissions

### Required Scopes

Your Airtable Personal Access Token must have:

- ✅ `data.records:read` - Read form fields
- ✅ `schema.bases:read` - Read existing table schema
- ✅ **`schema.bases:write`** - Create new fields

### Creating a Personal Access Token

1. Go to https://airtable.com/create/tokens
2. Click "Create new token"
3. Name it: "Quote Calculator - Schema Sync"
4. Add scopes:
   - `data.records:read`
   - `data.records:write`
   - `schema.bases:read`
   - `schema.bases:write`
5. Add access to your base
6. Click "Create token"
7. Copy and save the token securely
8. Update your `.env` file or Supabase tenant configuration

## Manual Sync Interface

### Accessing the Admin Panel

The manual schema sync interface is available through the AdminSchemaSync component:

```typescript
import AdminSchemaSync from './components/AdminSchemaSync';

// Add to your app routing or admin panel
<Route path="/admin/schema-sync" element={<AdminSchemaSync />} />
```

### Using the Manual Sync

1. Navigate to the admin schema sync page
2. Click "Sync Schema Now"
3. Wait for sync to complete (shows progress)
4. Review results:
   - Fields checked
   - Fields created
   - Fields already existing
   - Any errors

### When to Use Manual Sync

- Testing new field configurations
- After bulk field changes
- Troubleshooting sync issues
- Verifying permissions
- Force sync after schema changes

## Monitoring and Debugging

### Console Logs

Schema sync logs detailed information to the browser console:

```
🔄 [SchemaSync] Starting schema synchronization...
[SchemaSync] Target table: "Client Quotes"
[SchemaSync] Form fields to check: 45
[SchemaSync] Using base ID: appXXXXXXXXXX
[SchemaSync] Table ID: tblYYYYYYYYYY
[SchemaSync] 📊 Client Quotes has 50 existing fields
[SchemaSync] ✓ Field "Individual Tax - Filing Status" already exists
[SchemaSync] ➕ Creating field "Individual Tax - K1 Count" (number)...
[SchemaSync] ✅ Field "Individual Tax - K1 Count" created successfully
📋 [SchemaSync] Schema Sync Summary:
   ✓ Checked: 45 fields
   ✓ Already exist: 40 fields
   ✓ Created: 5 fields
   ⏭️  Skipped: 0 inactive fields
   ✗ Errors: 0 errors
```

### Common Sync Results

**All fields exist:**
```
✓ Checked: 45 fields
✓ Already exist: 45 fields
✓ Created: 0 fields
```

**New fields created:**
```
✓ Checked: 45 fields
✓ Already exist: 40 fields
✓ Created: 5 fields
📝 Created fields: Individual Tax - K1 Count, Individual Tax - Rental Property Count, ...
```

**Errors occurred:**
```
✓ Checked: 45 fields
✓ Already exist: 44 fields
✓ Created: 0 fields
✗ Errors: 1 errors
⚠️  Errors: Failed to create "Field Name": Invalid permissions
```

## Error Handling

### Permission Errors

**Error:** `INVALID_PERMISSIONS` or 403 Forbidden

**Solution:**
1. Check API key has `schema.bases:write` scope
2. Generate new Personal Access Token with correct scopes
3. Update token in environment variables or Supabase

### Table Not Found

**Error:** `Table "Client Quotes" not found in base`

**Solution:**
1. Verify table name is exactly "Client Quotes" (case-sensitive)
2. Check you're using the correct Airtable base ID
3. Ensure table exists in the specified base

### Field Already Exists

**Status:** Treated as success (not an error)

**Note:** Schema sync is idempotent - running multiple times is safe

### Rate Limiting

**Error:** 429 Too Many Requests

**Handling:**
- Automatic 250ms delay between requests (4 req/sec, under 5/sec limit)
- Exponential backoff if rate limit hit
- Logs wait time in console

### Invalid Field Type

**Warning:** Logs warning and skips field

**Solution:**
1. Check "Field Type" in Form Fields table matches supported types
2. Verify field type spelling (case-sensitive)
3. Review FIELD_TYPE_MAPPING in airtableSchemaService.ts

## Best Practices

### Field Naming Conventions

**✅ Good Field Names (camelCase):**
- `filingStatus`
- `annualIncome`
- `k1Count`
- `rentalPropertyCount`

**❌ Avoid:**
- `filing_status` (snake_case - won't transform nicely)
- `Filing Status` (spaces - use camelCase)
- `filing-status` (kebab-case)

### Explicit Column Names

Use "Airtable Column Name" when:
- You need specific naming for reporting
- Field name doesn't transform well
- Matching existing column names
- Creating calculated field references

### Active Field Management

- Set `Active: false` for deprecated fields
- Schema sync skips inactive fields
- Old columns remain in Airtable (not deleted)
- Manual cleanup of unused columns if needed

### Testing New Fields

1. Add field to Form Fields table with `Active: false`
2. Run manual schema sync (field skipped)
3. Set `Active: true` when ready
4. Schema sync will create column on next run
5. Test form submission with new field

## Troubleshooting

### Sync Not Running

**Check:**
- Tenant configuration loaded (`tenant` not null)
- Form Fields table has active fields
- Browser console for errors
- Network tab for API calls

### Fields Not Appearing in Quotes Table

**Verify:**
1. Field has `Active: true` in Form Fields table
2. Schema sync ran successfully (check console)
3. Wait 5 minutes for cache to refresh
4. Check Airtable Column Name is correct
5. Verify field was created (check Airtable directly)

### Wrong Column Names

**Fix:**
1. Add "Airtable Column Name" column to Form Fields
2. Set explicit column names
3. Re-run schema sync
4. Note: Existing columns won't be renamed (manual cleanup needed)

### Data Not Saving to New Columns

**After adding columns:**
1. Verify schema sync created column
2. Check airtableWriteService.ts includes field in mapping
3. Test form submission
4. Check Client Quotes table in Airtable
5. Review browser console for write errors

## Performance

### Sync Duration

- **Small setup** (10-20 fields): ~5 seconds
- **Medium setup** (30-50 fields): ~15 seconds
- **Large setup** (100+ fields): ~30 seconds

### Rate Limiting

- 250ms delay between field creations
- ~4 requests per second
- Well under Airtable's 5 req/sec limit
- No performance impact on app loading

### Caching

- Form fields cached for 5 minutes
- Sync result not cached (runs fresh each time)
- Recommendation: Run sync once on app load

## Backward Compatibility

### Existing Hardcoded Mappings

The schema sync feature is **additive only**:

- Existing hardcoded field mappings still work
- Old fields continue to save to Airtable
- New fields auto-sync
- No breaking changes to existing functionality

### Migration Path

1. **Phase 1:** Schema sync runs, creates new field columns
2. **Phase 2:** Forms use both old and new fields
3. **Phase 3:** Gradually migrate to new field definitions
4. **Phase 4:** Remove old hardcoded mappings (optional)

## Advanced Configuration

### Custom Table Name

Override the default "Client Quotes" table name:

```typescript
const syncResult = await syncFormFieldsToClientQuotes(
  tenantConfig,
  formFields,
  'Custom Quotes Table Name'
);
```

### Service-Specific Sync

Sync only specific services:

```typescript
const servicesConfig = {
  baseId: tenant.airtable.servicesBaseId,
  apiKey: tenant.airtable.servicesApiKey,
};

const fields = await getCachedFormFields(servicesConfig, 'individual-tax');
const syncResult = await syncFormFieldsToClientQuotes(tenant, fields);
```

### Conditional Sync

Enable/disable sync with environment variable:

```typescript
const ENABLE_SCHEMA_SYNC = import.meta.env.VITE_ENABLE_SCHEMA_SYNC === 'true';

if (ENABLE_SCHEMA_SYNC && tenant) {
  await initializeSchemaSync();
}
```

## Security Considerations

### API Key Protection

- Never commit API keys to version control
- Use environment variables or Supabase config
- Rotate keys periodically
- Use minimum required scopes

### Schema Modification Safety

- Sync only creates fields (never deletes)
- Existing data preserved
- Safe to run multiple times
- No risk of data loss

### Permission Boundaries

- Users can't trigger sync directly (admin only)
- API keys stored server-side or in environment
- Browser console logs don't expose sensitive data

## Support and Maintenance

### Monitoring

Check schema sync health:
1. Review browser console logs on app load
2. Monitor Airtable API usage
3. Track sync success/failure rates
4. Alert on permission errors

### Regular Maintenance

- **Monthly:** Review unused columns in Client Quotes
- **Quarterly:** Audit API key permissions
- **As needed:** Clean up deprecated fields
- **After updates:** Verify sync still works

### Getting Help

If schema sync isn't working:

1. Check browser console for detailed errors
2. Verify API permissions (schema.bases:write)
3. Test with manual sync interface
4. Review this guide's troubleshooting section
5. Check Airtable API status

## Summary

The automatic schema synchronization feature:

- ✅ Eliminates manual column creation in Airtable
- ✅ Keeps database schema in sync with forms
- ✅ Supports all field types with automatic conversion
- ✅ Runs automatically on app load (non-blocking)
- ✅ Provides manual sync interface for testing
- ✅ Safe to run multiple times (idempotent)
- ✅ Comprehensive error handling and logging
- ✅ Backward compatible with existing code

**Result:** A single source of truth (Form Fields table) that automatically configures both the user interface and database schema.
