import React from 'react';

interface DynamicFormFieldProps {
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

export const DynamicFormField: React.FC<DynamicFormFieldProps> = ({
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
