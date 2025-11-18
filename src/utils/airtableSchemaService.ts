/**
 * Airtable Schema Service
 * Automatically synchronizes Form Fields table schema to Client Quotes table
 * Uses Airtable Metadata API to create missing fields dynamically
 */

import { TenantConfig } from './tenantService';
import { FormField } from './formFieldsService';

export interface AirtableFieldSchema {
  id: string;
  name: string;
  type: string;
  options?: any;
}

export interface SchemaSyncResult {
  fieldsChecked: number;
  fieldsCreated: number;
  fieldsAlreadyExist: number;
  errors: string[];
  createdFields: string[];
  skippedFields: string[];
}

/**
 * Maps Form Fields table field types to Airtable Metadata API field types
 */
function mapFieldTypeToAirtableType(formFieldType: string): string {
  const typeMap: Record<string, string> = {
    'text': 'singleLineText',
    'textarea': 'multilineText',
    'number': 'number',
    'dropdown': 'singleSelect',
    'multi-select': 'multipleSelects',
    'checkbox': 'checkbox',
    'radio': 'singleLineText',
    'date': 'date',
    'email': 'email',
    'phone': 'phoneNumber',
    'url': 'url'
  };

  return typeMap[formFieldType] || 'singleLineText';
}

/**
 * Transform camelCase field name to Title Case column name
 * Examples:
 *   filingStatus -> Filing Status
 *   annualIncome -> Annual Income
 *   k1Count -> K1 Count
 */
function transformFieldNameToColumnName(fieldName: string, serviceId?: string): string {
  // First, handle camelCase to space-separated words
  let transformed = fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();

  // Handle numbers followed by letters (e.g., "k1Count" -> "K1 Count")
  transformed = transformed.replace(/(\d+)([A-Z])/g, '$1 $2');

  // Add service prefix if provided
  if (serviceId) {
    const servicePrefix = serviceId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return `${servicePrefix} - ${transformed}`;
  }

  return transformed;
}

/**
 * Fetch existing fields schema from Client Quotes table
 */
async function getExistingFieldsSchema(
  baseId: string,
  apiKey: string,
  tableName: string = 'Client Quotes'
): Promise<AirtableFieldSchema[]> {
  const url = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`;

  console.log(`[SchemaSync] Fetching table metadata from base ${baseId}`);

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[SchemaSync] Failed to fetch table metadata:', errorText);
    throw new Error(`Failed to fetch table metadata: ${response.statusText}`);
  }

  const data = await response.json();

  // Find the Client Quotes table
  const clientQuotesTable = data.tables.find(
    (table: any) => table.name === tableName
  );

  if (!clientQuotesTable) {
    throw new Error(`Table "${tableName}" not found in base ${baseId}`);
  }

  console.log(`[SchemaSync] Found table "${tableName}" with ${clientQuotesTable.fields.length} existing fields`);

  return clientQuotesTable.fields.map((field: any) => ({
    id: field.id,
    name: field.name,
    type: field.type,
    options: field.options
  }));
}

/**
 * Create a new field in the Client Quotes table
 */
async function createField(
  baseId: string,
  apiKey: string,
  tableId: string,
  fieldName: string,
  fieldType: string,
  options?: any
): Promise<{ success: boolean; fieldId?: string; error?: string }> {
  const url = `https://api.airtable.com/v0/meta/bases/${baseId}/tables/${tableId}/fields`;

  const payload: any = {
    name: fieldName,
    type: fieldType
  };

  // Add options if provided (for select fields, etc.)
  if (options) {
    payload.options = options;
  }

  console.log(`[SchemaSync] Creating field "${fieldName}" (${fieldType})`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`[SchemaSync] ❌ Field creation failed for "${fieldName}":`, error);

      // Check if field already exists (this shouldn't happen but handle gracefully)
      if (error.error?.type === 'INVALID_REQUEST_BODY' &&
          error.error?.message?.includes('already exists')) {
        return { success: true, error: 'Field already exists' };
      }

      return {
        success: false,
        error: error.error?.message || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const result = await response.json();
    console.log(`[SchemaSync] ✅ Field "${fieldName}" created successfully (ID: ${result.id})`);

    return {
      success: true,
      fieldId: result.id
    };
  } catch (error) {
    console.error(`[SchemaSync] ❌ Exception creating field "${fieldName}":`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get table ID for Client Quotes table
 */
async function getTableId(
  baseId: string,
  apiKey: string,
  tableName: string = 'Client Quotes'
): Promise<string | null> {
  const url = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const table = data.tables.find((t: any) => t.name === tableName);

  return table ? table.id : null;
}

/**
 * Prepare field options for select/multi-select fields
 */
function prepareFieldOptions(
  formField: FormField,
  airtableFieldType: string
): any | undefined {
  // Only select fields need options
  if (airtableFieldType !== 'singleSelect' && airtableFieldType !== 'multipleSelects') {
    return undefined;
  }

  // Parse options from Form Fields table
  let options: string[] = [];

  try {
    if (formField.options) {
      // Options might be JSON string or array
      if (typeof formField.options === 'string') {
        const parsed = JSON.parse(formField.options);
        options = Array.isArray(parsed) ? parsed : [];
      } else if (Array.isArray(formField.options)) {
        options = formField.options;
      }
    }
  } catch (error) {
    console.warn(`[SchemaSync] Could not parse options for field ${formField.fieldName}:`, error);
    return undefined;
  }

  if (options.length === 0) {
    console.warn(`[SchemaSync] No options found for select field ${formField.fieldName}`);
    return undefined;
  }

  // Format for Airtable API
  return {
    choices: options.map(option => ({ name: option }))
  };
}

/**
 * Sleep utility for rate limiting
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Main sync function - syncs Form Fields schema to Client Quotes table
 *
 * @param tenantConfig - Tenant configuration with Airtable credentials
 * @param formFields - Array of form fields to sync
 * @param tableName - Optional table name (defaults to 'Client Quotes')
 * @returns SchemaSyncResult with detailed sync information
 */
export async function syncFormFieldsToClientQuotes(
  tenantConfig: TenantConfig,
  formFields: FormField[],
  tableName: string = 'Client Quotes'
): Promise<SchemaSyncResult> {
  const result: SchemaSyncResult = {
    fieldsChecked: 0,
    fieldsCreated: 0,
    fieldsAlreadyExist: 0,
    errors: [],
    createdFields: [],
    skippedFields: []
  };

  try {
    console.log('\n🔄 [SchemaSync] Starting schema synchronization...');
    console.log(`[SchemaSync] Target table: "${tableName}"`);
    console.log(`[SchemaSync] Form fields to check: ${formFields.length}`);

    // Get base ID and API key (prefer quotes config, fallback to services)
    const baseId = tenantConfig.airtable.quotesBaseId || tenantConfig.airtable.servicesBaseId;
    const apiKey = tenantConfig.airtable.quotesApiKey || tenantConfig.airtable.servicesApiKey;

    if (!baseId || !apiKey) {
      const error = 'Airtable configuration missing: baseId or apiKey not configured';
      console.error(`[SchemaSync] ❌ ${error}`);
      result.errors.push(error);
      return result;
    }

    console.log(`[SchemaSync] Using base ID: ${baseId}`);

    // 1. Get table ID
    const tableId = await getTableId(baseId, apiKey, tableName);
    if (!tableId) {
      const error = `Could not find table ID for "${tableName}"`;
      console.error(`[SchemaSync] ❌ ${error}`);
      result.errors.push(error);
      return result;
    }

    console.log(`[SchemaSync] Table ID: ${tableId}`);

    // 2. Get existing fields in Client Quotes table
    const existingFields = await getExistingFieldsSchema(baseId, apiKey, tableName);
    const existingFieldNames = new Set(
      existingFields.map(f => f.name.toLowerCase())
    );

    console.log(`[SchemaSync] 📊 Client Quotes has ${existingFields.length} existing fields`);

    // 3. Check each form field
    for (const formField of formFields) {
      result.fieldsChecked++;

      // Skip inactive fields
      if (!formField.active) {
        console.log(`[SchemaSync] ⏭️  Skipping inactive field: ${formField.fieldName}`);
        result.skippedFields.push(formField.fieldName);
        continue;
      }

      // Determine Airtable column name
      const columnName = formField.airtableColumnName && formField.airtableColumnName.trim()
        ? formField.airtableColumnName
        : transformFieldNameToColumnName(formField.fieldName, formField.serviceId);

      // Check if field already exists (case-insensitive)
      if (existingFieldNames.has(columnName.toLowerCase())) {
        result.fieldsAlreadyExist++;
        console.log(`[SchemaSync] ✓ Field "${columnName}" already exists`);
        continue;
      }

      // 4. Create missing field
      const airtableFieldType = mapFieldTypeToAirtableType(formField.fieldType);
      const fieldOptions = prepareFieldOptions(formField, airtableFieldType);

      console.log(`[SchemaSync] ➕ Creating field "${columnName}" (${airtableFieldType})...`);

      const createResult = await createField(
        baseId,
        apiKey,
        tableId,
        columnName,
        airtableFieldType,
        fieldOptions
      );

      if (createResult.success) {
        result.fieldsCreated++;
        result.createdFields.push(columnName);
        console.log(`[SchemaSync] ✅ Successfully created "${columnName}"`);
      } else {
        result.errors.push(`Failed to create "${columnName}": ${createResult.error}`);
        console.error(`[SchemaSync] ❌ Failed to create "${columnName}":`, createResult.error);
      }

      // Rate limiting: wait 250ms between requests (4 requests/second, well under 5/second limit)
      await sleep(250);
    }

    // 5. Summary
    console.log('\n📋 [SchemaSync] Schema Sync Summary:');
    console.log(`   ✓ Checked: ${result.fieldsChecked} fields`);
    console.log(`   ✓ Already exist: ${result.fieldsAlreadyExist} fields`);
    console.log(`   ✓ Created: ${result.fieldsCreated} fields`);
    console.log(`   ⏭️  Skipped: ${result.skippedFields.length} inactive fields`);
    console.log(`   ✗ Errors: ${result.errors.length} errors`);

    if (result.createdFields.length > 0) {
      console.log('\n   📝 Created fields:', result.createdFields.join(', '));
    }

    if (result.errors.length > 0) {
      console.log('\n   ⚠️  Errors:', result.errors);
    }

    console.log('\n✅ [SchemaSync] Schema synchronization completed\n');

  } catch (error) {
    console.error('[SchemaSync] ❌ Schema sync failed with exception:', error);
    result.errors.push(`Schema sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Helper function to get Airtable column name for a form field
 * Used by airtableWriteService to map form data to Airtable columns
 */
export function getAirtableColumnName(formField: FormField): string {
  return formField.airtableColumnName && formField.airtableColumnName.trim()
    ? formField.airtableColumnName
    : transformFieldNameToColumnName(formField.fieldName, formField.serviceId);
}
