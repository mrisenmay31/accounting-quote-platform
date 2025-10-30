/**
 * Field Validation Utility
 * Provides comprehensive validation for dynamic form fields
 * Supports pattern matching, length constraints, range validation, and custom rules
 */

export interface ValidationRules {
  pattern?: string;
  message?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  email?: boolean;
  phone?: boolean;
  zipCode?: boolean;
  url?: boolean;
  custom?: (value: any) => boolean;
  customMessage?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Parse validation rules from JSON string
 * @param rulesString - JSON string containing validation rules
 * @returns Parsed ValidationRules object or null if invalid
 */
export const parseValidationRules = (rulesString?: string): ValidationRules | null => {
  if (!rulesString) return null;

  try {
    return JSON.parse(rulesString);
  } catch (error) {
    console.error('[FieldValidation] Failed to parse validation rules:', rulesString, error);
    return null;
  }
};

/**
 * Validate email format
 */
const isValidEmail = (value: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

/**
 * Validate phone format (US format)
 * Accepts: (123) 456-7890, 123-456-7890, 1234567890, +1 (123) 456-7890
 */
const isValidPhone = (value: string): boolean => {
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return phoneRegex.test(value);
};

/**
 * Validate ZIP code format (US 5-digit or 9-digit)
 * Accepts: 12345 or 12345-6789
 */
const isValidZipCode = (value: string): boolean => {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(value);
};

/**
 * Validate URL format
 */
const isValidUrl = (value: string): boolean => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate a field value against validation rules
 * @param value - The field value to validate
 * @param rules - Validation rules to apply
 * @param fieldType - Type of the field (text, number, etc.)
 * @param fieldLabel - Label of the field for error messages
 * @returns ValidationResult with isValid flag and error message
 */
export const validateField = (
  value: any,
  rules: ValidationRules | null,
  fieldType: string,
  fieldLabel: string
): ValidationResult => {
  // No rules = always valid
  if (!rules) {
    return { isValid: true };
  }

  // Handle empty values - validation only runs on non-empty values
  // (Required validation is handled by HTML5 required attribute)
  const isEmpty = value === null || value === undefined || value === '' ||
                  (Array.isArray(value) && value.length === 0);

  if (isEmpty) {
    return { isValid: true };
  }

  // String conversion for text-based validations
  const stringValue = String(value);

  // Pattern validation (regex)
  if (rules.pattern) {
    try {
      const regex = new RegExp(rules.pattern);
      if (!regex.test(stringValue)) {
        return {
          isValid: false,
          error: rules.message || `${fieldLabel} format is invalid`
        };
      }
    } catch (error) {
      console.error('[FieldValidation] Invalid regex pattern:', rules.pattern, error);
      return {
        isValid: false,
        error: 'Invalid validation pattern configured'
      };
    }
  }

  // Email validation
  if (rules.email && !isValidEmail(stringValue)) {
    return {
      isValid: false,
      error: rules.message || `${fieldLabel} must be a valid email address`
    };
  }

  // Phone validation
  if (rules.phone && !isValidPhone(stringValue)) {
    return {
      isValid: false,
      error: rules.message || `${fieldLabel} must be a valid phone number`
    };
  }

  // ZIP code validation
  if (rules.zipCode && !isValidZipCode(stringValue)) {
    return {
      isValid: false,
      error: rules.message || `${fieldLabel} must be a valid ZIP code (e.g., 12345 or 12345-6789)`
    };
  }

  // URL validation
  if (rules.url && !isValidUrl(stringValue)) {
    return {
      isValid: false,
      error: rules.message || `${fieldLabel} must be a valid URL`
    };
  }

  // Min length validation (for text)
  if (rules.minLength !== undefined && stringValue.length < rules.minLength) {
    return {
      isValid: false,
      error: rules.message || `${fieldLabel} must be at least ${rules.minLength} characters`
    };
  }

  // Max length validation (for text)
  if (rules.maxLength !== undefined && stringValue.length > rules.maxLength) {
    return {
      isValid: false,
      error: rules.message || `${fieldLabel} must be no more than ${rules.maxLength} characters`
    };
  }

  // Min value validation (for numbers)
  if (rules.min !== undefined && fieldType === 'number') {
    const numValue = Number(value);
    if (!isNaN(numValue) && numValue < rules.min) {
      return {
        isValid: false,
        error: rules.message || `${fieldLabel} must be at least ${rules.min}`
      };
    }
  }

  // Max value validation (for numbers)
  if (rules.max !== undefined && fieldType === 'number') {
    const numValue = Number(value);
    if (!isNaN(numValue) && numValue > rules.max) {
      return {
        isValid: false,
        error: rules.message || `${fieldLabel} must be no more than ${rules.max}`
      };
    }
  }

  // Custom validation function
  if (rules.custom && typeof rules.custom === 'function') {
    try {
      if (!rules.custom(value)) {
        return {
          isValid: false,
          error: rules.customMessage || rules.message || `${fieldLabel} is invalid`
        };
      }
    } catch (error) {
      console.error('[FieldValidation] Custom validation function error:', error);
      return {
        isValid: false,
        error: 'Validation error occurred'
      };
    }
  }

  // All validations passed
  return { isValid: true };
};

/**
 * Validate multiple fields at once
 * @param fields - Array of field configurations with values and rules
 * @returns Object mapping field names to validation results
 */
export const validateFields = (
  fields: Array<{
    fieldName: string;
    value: any;
    rules: ValidationRules | null;
    fieldType: string;
    fieldLabel: string;
  }>
): Record<string, ValidationResult> => {
  const results: Record<string, ValidationResult> = {};

  fields.forEach(({ fieldName, value, rules, fieldType, fieldLabel }) => {
    results[fieldName] = validateField(value, rules, fieldType, fieldLabel);
  });

  return results;
};

/**
 * Check if all validation results are valid
 * @param results - Validation results object
 * @returns True if all fields are valid
 */
export const areAllFieldsValid = (results: Record<string, ValidationResult>): boolean => {
  return Object.values(results).every(result => result.isValid);
};

/**
 * Get error messages from validation results
 * @param results - Validation results object
 * @returns Array of error messages
 */
export const getErrorMessages = (results: Record<string, ValidationResult>): string[] => {
  return Object.values(results)
    .filter(result => !result.isValid && result.error)
    .map(result => result.error!);
};
