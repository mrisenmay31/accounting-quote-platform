/**
 * DynamicServiceDetailStep Component
 * Universal form rendering component for any service with form fields in Airtable
 * Automatically loads and renders fields based on serviceId
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { FormData, ServiceConfig } from '../types/quote';
import { useTenant } from '../contexts/TenantContext';
import { getCachedFormFields, FormField } from '../utils/formFieldsService';
import DynamicFormField from './DynamicFormField';
import { DynamicIcon } from '../utils/iconMapper';
import { shouldShowField, getFieldsToClear } from '../utils/conditionalLogic';

interface DynamicServiceDetailStepProps {
  serviceId: string;
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  serviceConfig?: ServiceConfig[];
}

const DynamicServiceDetailStep: React.FC<DynamicServiceDetailStepProps> = ({
  serviceId,
  formData,
  updateFormData,
  serviceConfig = [],
}) => {
  const { tenant } = useTenant();
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Get service info for display
  const service = serviceConfig.find(s => s.serviceId === serviceId);
  const serviceTitle = service?.title || formatServiceTitle(serviceId);
  const serviceDescription = service?.description || `Tell us about your ${formatServiceTitle(serviceId).toLowerCase()} needs`;

  useEffect(() => {
    const loadFormFields = async () => {
      if (!tenant) {
        console.log(`[DynamicServiceDetailStep] Waiting for tenant configuration...`);
        return;
      }

      try {
        setIsLoadingFields(true);
        setLoadError(null);

        const airtableConfig = {
          baseId: tenant.airtable.servicesBaseId || tenant.airtable.pricingBaseId,
          apiKey: tenant.airtable.servicesApiKey || tenant.airtable.pricingApiKey,
        };

        console.log(`[DynamicServiceDetailStep] Loading form fields for ${serviceId}`);

        if (!airtableConfig.baseId) {
          throw new Error('Airtable Base ID is not configured for this tenant. Please contact support.');
        }
        if (!airtableConfig.apiKey) {
          throw new Error('Airtable API Key is not configured for this tenant. Please contact support.');
        }

        const fields = await getCachedFormFields(airtableConfig, serviceId);

        if (fields.length === 0) {
          console.warn(`[DynamicServiceDetailStep] No active fields found for service: ${serviceId}`);
          setLoadError(`No form fields configured for ${serviceTitle}. Please contact support.`);
        }

        setFormFields(fields);
        console.log(`[DynamicServiceDetailStep] Successfully loaded ${fields.length} form fields for ${serviceId}`);
      } catch (error) {
        console.error(`[DynamicServiceDetailStep] Failed to load form fields for ${serviceId}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setLoadError(`Unable to load form fields: ${errorMessage}`);
      } finally {
        setIsLoadingFields(false);
      }
    };

    loadFormFields();
  }, [tenant, serviceId, serviceTitle]);

  const handleFieldChange = (fieldName: string, value: any) => {
    // Use flat formData structure - no service nesting
    const updatedData = {
      ...formData,
      [fieldName]: value,
    };

    // Clear values of conditional fields that should be hidden after this change
    const fieldsToClear = getFieldsToClear(formFields, fieldName, updatedData);
    fieldsToClear.forEach(fieldToClear => {
      updatedData[fieldToClear] = null;
      console.log(`[DynamicServiceDetailStep] Clearing hidden field: ${fieldToClear}`);
    });

    updateFormData(updatedData);
  };

  const getFieldValue = (fieldName: string): any => {
    // Access field values directly from root level (flat structure)
    return (formData as any)[fieldName] || '';
  };

  // Format service ID into readable title
  function formatServiceTitle(sid: string): string {
    return sid
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  if (isLoadingFields) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            {serviceTitle}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Loading form fields...
          </p>
        </div>

        <div className="flex items-center justify-center py-12">
          <div
            className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full"
            style={{ borderColor: 'var(--tenant-primary-200, #a7f3d0)' }}
          />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            {serviceTitle}
          </h2>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium mb-2">Form Configuration Error</p>
          <p className="text-red-600 text-sm">{loadError}</p>
        </div>
      </div>
    );
  }

  if (formFields.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            {serviceTitle}
          </h2>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-medium mb-2">No Form Fields Configured</p>
          <p className="text-yellow-600 text-sm">
            Please contact support to configure form fields for {serviceTitle}.
          </p>
        </div>
      </div>
    );
  }

  const renderFields = () => {
    const elements: JSX.Element[] = [];
    let currentRowGroup: FormField[] = [];

    // Filter fields by active status and conditional logic
    const visibleFields = formFields.filter(field =>
      field.active && shouldShowField(field, formData as any)
    );

    visibleFields.forEach((field, index) => {
      const prevField = index > 0 ? visibleFields[index - 1] : null;

      // Render section header if different from previous field
      if (field.sectionHeader && (!prevField || prevField.sectionHeader !== field.sectionHeader)) {
        // Flush any pending row group before section header
        if (currentRowGroup.length > 0) {
          elements.push(renderRowGroup(currentRowGroup));
          currentRowGroup = [];
        }

        elements.push(
          <div key={`section-${field.fieldId}`} className="mt-8 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              {field.sectionIcon && (
                <DynamicIcon name={field.sectionIcon} className="w-5 h-5 text-emerald-600" size={20} />
              )}
              <span>{field.sectionHeader}</span>
            </h3>
          </div>
        );
      }

      // Handle row grouping for half-width fields
      if (field.fieldWidth === 'half' && field.rowGroup !== undefined) {
        currentRowGroup.push(field);

        const nextField = visibleFields[index + 1];
        if (!nextField || nextField.rowGroup !== field.rowGroup) {
          elements.push(renderRowGroup(currentRowGroup));
          currentRowGroup = [];
        }
      } else {
        // Flush any pending row group
        if (currentRowGroup.length > 0) {
          elements.push(renderRowGroup(currentRowGroup));
          currentRowGroup = [];
        }

        // Render full-width field
        elements.push(
          <div
            key={field.fieldId}
            className="mb-6 transition-all duration-300 ease-in-out animate-fadeIn"
          >
            <DynamicFormField
              field={field}
              value={getFieldValue(field.fieldName)}
              onChange={handleFieldChange}
            />
          </div>
        );
      }
    });

    // Flush any remaining row group
    if (currentRowGroup.length > 0) {
      elements.push(renderRowGroup(currentRowGroup));
    }

    return elements;
  };

  const renderRowGroup = (fields: FormField[]) => {
    const groupKey = fields.map(f => f.fieldId).join('-');

    return (
      <div
        key={`row-${groupKey}`}
        className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6 transition-all duration-300 ease-in-out animate-fadeIn"
      >
        {fields.map((field) => (
          <div key={field.fieldId}>
            <DynamicFormField
              field={field}
              value={getFieldValue(field.fieldName)}
              onChange={handleFieldChange}
            />
          </div>
        ))}
      </div>
    );
  };

  const includedFeaturesCard = serviceConfig.find(s => s.serviceId === serviceId);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          {serviceTitle}
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {serviceDescription}
        </p>
      </div>

      {renderFields()}

      {includedFeaturesCard && includedFeaturesCard.includedFeaturesCardTitle && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-800 mb-2">
                {includedFeaturesCard.includedFeaturesCardTitle}
              </h3>
              {includedFeaturesCard.includedFeaturesCardList && (
                <ul className="space-y-1.5 text-sm text-emerald-700">
                  {includedFeaturesCard.includedFeaturesCardList.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2 text-emerald-500">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicServiceDetailStep;
