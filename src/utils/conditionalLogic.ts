/**
 * Conditional Logic Utility
 * Evaluates show/hide rules for dynamic form fields based on Airtable configuration
 * Supports multiple operators: includes, equals, not_equals, greater_than, less_than
 */

import { FormField } from './formFieldsService';

export interface ConditionalRule {
  showIf: {
    field: string;
    operator: 'includes' | 'equals' | 'not_equals' | 'greater_than' | 'less_than';
    value: any;
  };
}

/**
 * Evaluates whether a field should be shown based on conditional logic
 * @param field - The form field with optional conditional logic
 * @param formData - Current form data values
 * @returns boolean - true if field should be displayed, false if hidden
 */
export function shouldShowField(field: FormField, formData: any): boolean {
  // Always show if no conditional logic is defined
  if (!field.conditionalLogic) {
    return true;
  }

  try {
    const condition: ConditionalRule = JSON.parse(field.conditionalLogic);

    // Validate condition structure
    if (!condition.showIf || !condition.showIf.field || !condition.showIf.operator) {
      console.warn(`[ConditionalLogic] Invalid condition structure for field ${field.fieldId}`);
      return true;
    }

    const { field: dependentField, operator, value } = condition.showIf;
    const fieldValue = formData[dependentField];

    // If dependent field has no value, hide this field
    if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
      return false;
    }

    switch (operator) {
      case 'includes':
        // For checkbox arrays and multi-select fields
        if (!Array.isArray(fieldValue)) {
          console.warn(`[ConditionalLogic] Field ${dependentField} is not an array, cannot use 'includes' operator`);
          return false;
        }
        return fieldValue.includes(value);

      case 'equals':
        // For dropdowns, radio buttons, and single values
        return fieldValue === value;

      case 'not_equals':
        // For showing when specific value NOT selected
        return fieldValue !== value;

      case 'greater_than':
        // For number comparisons
        const numValue = Number(fieldValue);
        const numThreshold = Number(value);
        if (isNaN(numValue) || isNaN(numThreshold)) {
          console.warn(`[ConditionalLogic] Cannot compare non-numeric values with 'greater_than'`);
          return false;
        }
        return numValue > numThreshold;

      case 'less_than':
        // For number comparisons
        const numVal = Number(fieldValue);
        const numThresh = Number(value);
        if (isNaN(numVal) || isNaN(numThresh)) {
          console.warn(`[ConditionalLogic] Cannot compare non-numeric values with 'less_than'`);
          return false;
        }
        return numVal < numThresh;

      default:
        console.warn(`[ConditionalLogic] Unknown operator: ${operator}`);
        return true;
    }
  } catch (error) {
    console.error(`[ConditionalLogic] Error parsing conditional logic for field ${field.fieldId}:`, error);
    // Show field if condition parsing fails (fail-safe)
    return true;
  }
}

/**
 * Gets all fields that depend on a specific field
 * Used to clear values when parent field changes
 * @param fields - All form fields
 * @param fieldName - The field name to check dependencies for
 * @returns Array of fields that depend on the specified field
 */
export function getFieldsDependingOn(fields: FormField[], fieldName: string): FormField[] {
  return fields.filter(field => {
    if (!field.conditionalLogic) {
      return false;
    }

    try {
      const condition: ConditionalRule = JSON.parse(field.conditionalLogic);
      return condition.showIf?.field === fieldName;
    } catch (error) {
      return false;
    }
  });
}

/**
 * Gets field names that should be cleared when a parent field changes
 * @param fields - All form fields
 * @param changedFieldName - The field that changed
 * @param formData - Current form data
 * @returns Array of field names that should be cleared
 */
export function getFieldsToClear(
  fields: FormField[],
  changedFieldName: string,
  formData: any
): string[] {
  const dependentFields = getFieldsDependingOn(fields, changedFieldName);

  return dependentFields
    .filter(field => !shouldShowField(field, formData))
    .map(field => field.fieldName);
}

/**
 * Validates conditional logic JSON structure
 * @param conditionalLogic - JSON string or parsed object
 * @returns boolean - true if valid, false otherwise
 */
export function isValidConditionalLogic(conditionalLogic: string | null | undefined): boolean {
  if (!conditionalLogic) {
    return true; // No condition is valid
  }

  try {
    const condition: ConditionalRule = JSON.parse(conditionalLogic);

    if (!condition.showIf) {
      return false;
    }

    const { field, operator, value } = condition.showIf;

    if (!field || !operator) {
      return false;
    }

    const validOperators = ['includes', 'equals', 'not_equals', 'greater_than', 'less_than'];
    if (!validOperators.includes(operator)) {
      return false;
    }

    if (value === undefined) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Gets a human-readable description of a conditional rule
 * @param conditionalLogic - JSON string
 * @returns string description
 */
export function getConditionalDescription(conditionalLogic: string | null | undefined): string {
  if (!conditionalLogic) {
    return 'Always visible';
  }

  try {
    const condition: ConditionalRule = JSON.parse(conditionalLogic);
    const { field, operator, value } = condition.showIf;

    switch (operator) {
      case 'includes':
        return `Shown when "${field}" includes "${value}"`;
      case 'equals':
        return `Shown when "${field}" equals "${value}"`;
      case 'not_equals':
        return `Shown when "${field}" does not equal "${value}"`;
      case 'greater_than':
        return `Shown when "${field}" is greater than ${value}`;
      case 'less_than':
        return `Shown when "${field}" is less than ${value}`;
      default:
        return 'Conditional visibility';
    }
  } catch (error) {
    return 'Invalid condition';
  }
}
