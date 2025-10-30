/**
 * Form Fields Service
 * Fetches dynamic form field configurations from Airtable
 * Enables per-tenant customization of form fields without code changes
 */

export interface FormField {
  serviceId: string;
  fieldName: string;
  /**
   * Field Type - Defines data structure and behavior
   * - text: Single line text input
   * - number: Numeric input with validation
   * - dropdown: Single selection from list (one value)
   * - checkbox: Single boolean checkbox (true/false)
   * - textarea: Multi-line text input
   * - radio: Single selection with radio buttons (one value)
   * - multi-select: Multiple selections (array of values)
   */
  fieldType: 'text' | 'number' | 'dropdown' | 'checkbox' | 'textarea' | 'radio' | 'multi-select';
  fieldLabel: string;
  placeholder?: string;
  options?: string; // JSON string containing field-specific options
  required: boolean;
  active: boolean;
  displayOrder: number;
  conditionalLogic?: string; // JSON string for show/hide logic
  validationRules?: string; // JSON string containing validation rules
  helpText?: string;
  // Layout metadata
  fieldWidth?: 'full' | 'half';
  sectionHeader?: string;
  sectionIcon?: string;
  /**
   * Layout Type - Defines visual presentation
   * - standard: Default rendering based on field type
   * - checkbox-grid: Grid layout with clickable cards (requires multi-select field type)
   * - radio-group: Large clickable cards (requires radio field type)
   * - textarea: Multi-line text area layout (requires textarea field type)
   */
  layoutType?: 'standard' | 'checkbox-grid' | 'radio-group' | 'textarea';
  columns?: number; // Number of columns for checkbox grids
  rowGroup?: number; // Group number for half-width fields on same row
}

export interface AirtableFormFieldConfig {
  baseId: string;
  apiKey: string;
}

interface AirtableRecord {
  id: string;
  fields: {
    'Service ID'?: string;
    'Field Name'?: string;
    'Field Type'?: string;
    'Field Label'?: string;
    'Placeholder'?: string;
    'Field Options'?: string;
    'Required'?: boolean;
    'Active'?: boolean;
    'Display Order'?: number;
    'Conditional Logic'?: string;
    'Validation Rules'?: string;
    'Help Text'?: string;
    'Field Width'?: string;
    'Section Header'?: string;
    'Section Icon'?: string;
    'Layout Type'?: string;
    'Columns'?: number;
    'Row Group'?: number;
  };
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

/**
 * Fetches form fields from Airtable for a specific service
 * @param config - Airtable configuration (base ID and API key)
 * @param serviceId - Service identifier (e.g., 'individual-tax', 'business-tax')
 * @returns Array of FormField objects sorted by display order
 */
export const fetchFormFields = async (
  config: AirtableFormFieldConfig,
  serviceId: string
): Promise<FormField[]> => {
  try {
    // Validate configuration
    if (!config.baseId) {
      throw new Error('Airtable Base ID is missing from configuration');
    }
    if (!config.apiKey) {
      throw new Error('Airtable API Key is missing from configuration');
    }

    // Build Airtable API URL with filters
    // Filter by Service ID and Active = TRUE
    const filterFormula = `AND({Service ID}='${serviceId}', {Active}=TRUE())`;
    const encodedFormula = encodeURIComponent(filterFormula);

    // Sort by Display Order ascending
    const sortParams = 'sort%5B0%5D%5Bfield%5D=Display%20Order&sort%5B0%5D%5Bdirection%5D=asc';

    const url = `https://api.airtable.com/v0/${config.baseId}/Form%20Fields?filterByFormula=${encodedFormula}&${sortParams}`;

    console.log(`[FormFieldsService] Fetching form fields for service: ${serviceId}`);
    console.log(`[FormFieldsService] Using Base ID: ${config.baseId}`);
    console.log(`[FormFieldsService] API URL: ${url.replace(config.apiKey, 'REDACTED')}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[FormFieldsService] Airtable API error:', {
        status: response.status,
        statusText: response.statusText,
        baseId: config.baseId,
        serviceId: serviceId,
        errorText: errorText
      });
      throw new Error(`Failed to fetch form fields (${response.status}): ${response.statusText}`);
    }

    const data: AirtableResponse = await response.json();

    console.log(`[FormFieldsService] Received ${data.records?.length || 0} records from Airtable`);

    // Transform Airtable records to FormField objects
    const formFields: FormField[] = data.records.map(record => ({
      serviceId: record.fields['Service ID'] || serviceId,
      fieldName: record.fields['Field Name'] || '',
      fieldType: (record.fields['Field Type'] as FormField['fieldType']) || 'text',
      fieldLabel: record.fields['Field Label'] || '',
      placeholder: record.fields['Placeholder'],
      options: record.fields['Field Options'],
      required: record.fields['Required'] || false,
      active: record.fields['Active'] !== false,
      displayOrder: record.fields['Display Order'] || 999,
      conditionalLogic: record.fields['Conditional Logic'],
      validationRules: record.fields['Validation Rules'],
      helpText: record.fields['Help Text'],
      fieldWidth: (record.fields['Field Width'] as 'full' | 'half') || 'full',
      sectionHeader: record.fields['Section Header'],
      sectionIcon: record.fields['Section Icon'],
      layoutType: (record.fields['Layout Type'] as FormField['layoutType']) || 'standard',
      columns: record.fields['Columns'] || 1,
      rowGroup: record.fields['Row Group'],
    }));

    console.log(`[FormFieldsService] Successfully fetched ${formFields.length} active fields for service: ${serviceId}`);
    if (formFields.length > 0) {
      console.log(`[FormFieldsService] First field:`, formFields[0]);
    }

    return formFields;
  } catch (error) {
    console.error(`[FormFieldsService] Error fetching form fields for ${serviceId}:`, error);
    console.error(`[FormFieldsService] Base ID used: ${config.baseId}`);
    throw error;
  }
};

/**
 * Parse options from JSON string
 * Handles various option formats (arrays, objects with min/max/step, etc.)
 */
export const parseFieldOptions = (optionsString?: string): any => {
  if (!optionsString) return null;

  try {
    return JSON.parse(optionsString);
  } catch (error) {
    console.error('[FormFieldsService] Failed to parse options JSON:', optionsString, error);
    return null;
  }
};

/**
 * Cache for form fields to reduce API calls
 */
const formFieldsCache: Map<string, { data: FormField[]; timestamp: number }> = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches form fields with caching
 * @param config - Airtable configuration
 * @param serviceId - Service identifier
 * @returns Cached or fresh FormField array
 */
export const getCachedFormFields = async (
  config: AirtableFormFieldConfig,
  serviceId: string
): Promise<FormField[]> => {
  const cacheKey = `${config.baseId}-${serviceId}`;
  const cached = formFieldsCache.get(cacheKey);

  // Return cached data if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[FormFieldsService] Using cached form fields for ${serviceId}`);
    return cached.data;
  }

  // Fetch fresh data
  const formFields = await fetchFormFields(config, serviceId);

  // Update cache
  formFieldsCache.set(cacheKey, {
    data: formFields,
    timestamp: Date.now(),
  });

  return formFields;
};
