/**
 * DynamicFormField Component
 * Renders form fields dynamically based on field type and layout from Airtable configuration
 * Supports: text, number, dropdown, checkbox, textarea, radio, multi-select, checkbox-grid, radio-group
 */

import React from 'react';
import { Info, CheckCircle } from 'lucide-react';
import { FormField, parseFieldOptions } from '../utils/formFieldsService';

interface DynamicFormFieldProps {
  field: FormField;
  value: any;
  onChange: (fieldName: string, value: any) => void;
}

const DynamicFormFieldAirtable: React.FC<DynamicFormFieldProps> = ({ field, value, onChange }) => {
  const [showHelpText, setShowHelpText] = React.useState(false);

  const options = parseFieldOptions(field.options);

  const handleChange = (newValue: any) => {
    onChange(field.fieldName, newValue);
  };

  const renderTextInput = () => (
    <input
      type="text"
      name={field.fieldName}
      value={value || ''}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={field.placeholder}
      required={field.required}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
    />
  );

  const renderNumberInput = () => {
    const min = options?.min !== undefined ? options.min : 0;
    const max = options?.max;
    const step = options?.step || 1;

    return (
      <input
        type="number"
        name={field.fieldName}
        value={value || ''}
        onChange={(e) => handleChange(parseInt(e.target.value) || 0)}
        placeholder={field.placeholder}
        required={field.required}
        min={min}
        max={max}
        step={step}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
      />
    );
  };

  const renderDropdown = () => {
    const dropdownOptions = Array.isArray(options) ? options : [];

    return (
      <select
        name={field.fieldName}
        value={value || ''}
        onChange={(e) => handleChange(e.target.value)}
        required={field.required}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white"
      >
        <option value="">{field.placeholder || `Select ${field.fieldLabel}`}</option>
        {dropdownOptions.map((opt: string, idx: number) => (
          <option key={idx} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  };

  const renderCheckbox = () => (
    <label className="flex items-center space-x-3 cursor-pointer">
      <input
        type="checkbox"
        name={field.fieldName}
        checked={value || false}
        onChange={(e) => handleChange(e.target.checked)}
        className="w-5 h-5 rounded border-gray-300 focus:ring-2 focus:ring-emerald-500 text-emerald-600"
      />
      <span className="text-gray-700">{field.fieldLabel}</span>
    </label>
  );

  const renderTextarea = () => (
    <textarea
      name={field.fieldName}
      value={value || ''}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={field.placeholder}
      required={field.required}
      rows={options?.rows || 4}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
    />
  );

  const renderRadio = () => {
    const radioOptions = Array.isArray(options) ? options : [];

    return (
      <div className="space-y-2">
        {radioOptions.map((opt: string, idx: number) => (
          <label key={idx} className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name={field.fieldName}
              value={opt}
              checked={value === opt}
              onChange={(e) => handleChange(e.target.value)}
              required={field.required}
              className="w-4 h-4 border-gray-300 focus:ring-2 focus:ring-emerald-500 text-emerald-600"
            />
            <span className="text-gray-700">{opt}</span>
          </label>
        ))}
      </div>
    );
  };

  const renderRadioGroup = () => {
    const radioOptions = Array.isArray(options) ? options : [];

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {radioOptions.map((opt: string, idx: number) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleChange(opt)}
            className={`p-4 text-left border-2 rounded-lg transition-all duration-200 ${
              value === opt
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-25'
            }`}
          >
            <span className="font-medium">{opt}</span>
          </button>
        ))}
      </div>
    );
  };

  const renderMultiSelect = () => {
    const multiSelectOptions = Array.isArray(options) ? options : [];
    const selectedValues = Array.isArray(value) ? value : [];

    const handleToggle = (opt: string) => {
      const isSelected = selectedValues.includes(opt);
      const updated = isSelected
        ? selectedValues.filter((v) => v !== opt)
        : [...selectedValues, opt];
      handleChange(updated);
    };

    return (
      <div className="space-y-2">
        {multiSelectOptions.map((opt: string, idx: number) => (
          <label key={idx} className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedValues.includes(opt)}
              onChange={() => handleToggle(opt)}
              className="w-5 h-5 rounded border-gray-300 focus:ring-2 focus:ring-emerald-500 text-emerald-600"
            />
            <span className="text-gray-700">{opt}</span>
          </label>
        ))}
      </div>
    );
  };

  const renderCheckboxGrid = () => {
    const gridOptions = Array.isArray(options) ? options : [];
    const selectedValues = Array.isArray(value) ? value : [];
    const numColumns = field.columns || 2;

    const handleToggle = (opt: string) => {
      const isSelected = selectedValues.includes(opt);
      const updated = isSelected
        ? selectedValues.filter((v) => v !== opt)
        : [...selectedValues, opt];
      handleChange(updated);
    };

    return (
      <div className={`grid grid-cols-1 md:grid-cols-${numColumns} gap-3`}>
        {gridOptions.map((opt: string, idx: number) => {
          const isSelected = selectedValues.includes(opt);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleToggle(opt)}
              className={`p-3 text-left border-2 rounded-lg transition-all duration-200 text-sm ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-25'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                  }`}
                >
                  {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <span>{opt}</span>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderFieldInput = () => {
    const layoutType = field.layoutType || 'standard';

    switch (layoutType) {
      case 'checkbox-grid':
        return renderCheckboxGrid();
      case 'radio-group':
        return renderRadioGroup();
      case 'textarea':
        return renderTextarea();
      default:
        switch (field.fieldType) {
          case 'text':
            return renderTextInput();
          case 'number':
            return renderNumberInput();
          case 'dropdown':
            return renderDropdown();
          case 'checkbox':
            return renderCheckbox();
          case 'textarea':
            return renderTextarea();
          case 'radio':
            return renderRadio();
          case 'multi-select':
            return renderMultiSelect();
          default:
            console.warn(`[DynamicFormField] Unsupported field type: ${field.fieldType}`);
            return renderTextInput();
        }
    }
  };

  if (field.fieldType === 'checkbox') {
    return (
      <div className="mb-6">
        {renderFieldInput()}
        {field.helpText && (
          <p className="mt-2 text-sm text-gray-600">{field.helpText}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold text-gray-700">
            {field.fieldLabel}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </span>
          {field.helpText && (
            <button
              type="button"
              onClick={() => setShowHelpText(!showHelpText)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Show help"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
        </div>
      </label>

      {showHelpText && field.helpText && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          {field.helpText}
        </div>
      )}

      {renderFieldInput()}
    </div>
  );
};

export default DynamicFormFieldAirtable;

// Legacy export for backward compatibility with BusinessTaxDetails and BookkeepingDetails
interface LegacyDynamicFormFieldProps {
  label: string;
  fieldName: string;
  fieldType: 'text' | 'number' | 'dropdown';
  required?: boolean;
  options?: string[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  description?: string;
  className?: string;
}

export const DynamicFormField: React.FC<LegacyDynamicFormFieldProps> = ({
  label,
  fieldName,
  fieldType,
  required = false,
  options = [],
  value,
  onChange,
  placeholder,
  icon,
  description,
  className = ''
}) => {
  if (fieldType === 'dropdown' && options.length > 0) {
    return (
      <div className={`space-y-3 ${className}`}>
        <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
          {icon}
          <span>
            {label} {required && '*'}
          </span>
        </label>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
        <select
          id={fieldName}
          name={fieldName}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
        >
          <option value="">Select...</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (fieldType === 'number') {
    return (
      <div className={`space-y-3 ${className}`}>
        <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
          {icon}
          <span>
            {label} {required && '*'}
          </span>
        </label>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
        <input
          type="number"
          id={fieldName}
          name={fieldName}
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
        />
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
        {icon}
        <span>
          {label} {required && '*'}
        </span>
      </label>
      {description && (
        <p className="text-sm text-gray-600">{description}</p>
      )}
      <input
        type="text"
        id={fieldName}
        name={fieldName}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
      />
    </div>
  );
};
