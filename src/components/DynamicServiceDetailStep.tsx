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
    // Filter fields by active status and conditional logic
    const visibleFields = formFields.filter(field =>
      field.active && shouldShowField(field, formData as any)
    );

    // Sort visible fields by Display Order
    const sortedFields = [...visibleFields].sort((a, b) => a.displayOrder - b.displayOrder);

    // Group fields by Row Group number
    const groupedFields: Array<{
      type: 'group' | 'single';
      rowGroup?: number;
      field?: FormField;
      fields?: FormField[];
      sectionHeader?: string;
      sectionIcon?: string;
    }> = [];

    const processedFields = new Set<string>();

    sortedFields.forEach((field) => {
      if (processedFields.has(field.fieldId)) return;

      if (field.rowGroup !== undefined && field.rowGroup !== null) {
        // Find all fields with the same Row Group
        const fieldsInGroup = sortedFields.filter(f =>
          f.rowGroup === field.rowGroup && !processedFields.has(f.fieldId)
        );

        // Sort by Display Order within the group
        fieldsInGroup.sort((a, b) => a.displayOrder - b.displayOrder);

        // Mark all fields in this group as processed
        fieldsInGroup.forEach(f => processedFields.add(f.fieldId));

        // Add as a group
        groupedFields.push({
          type: 'group',
          rowGroup: field.rowGroup,
          fields: fieldsInGroup,
          sectionHeader: field.sectionHeader,
          sectionIcon: field.sectionIcon
        });
      } else {
        // Single field (no group)
        processedFields.add(field.fieldId);
        groupedFields.push({
          type: 'single',
          field: field
        });
      }
    });

    // Track section headers to avoid duplicates
    let lastSectionHeader: string | undefined;

    // Render grouped and single fields
    return groupedFields.map((item, index) => {
      const elements: JSX.Element[] = [];

      // Render section header if it's new
      if (item.type === 'group' && item.sectionHeader && item.sectionHeader !== lastSectionHeader) {
        lastSectionHeader = item.sectionHeader;
        elements.push(
          <div key={`section-group-${item.rowGroup}-${index}`} className="mt-8 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              {item.sectionIcon && (
                <DynamicIcon name={item.sectionIcon} className="w-5 h-5 text-emerald-600" size={20} />
              )}
              <span>{item.sectionHeader}</span>
            </h3>
          </div>
        );
      } else if (item.type === 'single' && item.field?.sectionHeader && item.field.sectionHeader !== lastSectionHeader) {
        lastSectionHeader = item.field.sectionHeader;
        elements.push(
          <div key={`section-single-${item.field.fieldId}`} className="mt-8 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              {item.field.sectionIcon && (
                <DynamicIcon name={item.field.sectionIcon} className="w-5 h-5 text-emerald-600" size={20} />
              )}
              <span>{item.field.sectionHeader}</span>
            </h3>
          </div>
        );
      }

      if (item.type === 'group' && item.fields) {
        const numFields = item.fields.length;
        const gridClass =
          numFields === 2 ? 'grid-cols-1 md:grid-cols-2' :
          numFields === 3 ? 'grid-cols-1 md:grid-cols-3' :
          numFields === 4 ? 'grid-cols-1 md:grid-cols-4' :
          numFields >= 5 ? 'grid-cols-1 md:grid-cols-5' :
          'grid-cols-1';

        elements.push(
          <div
            key={`group-${item.rowGroup}-${index}`}
            className="mb-6 transition-all duration-300 ease-in-out animate-fadeIn"
          >
            <div className={`grid ${gridClass} gap-4`}>
              {item.fields.map(field => (
                <div key={field.fieldId}>
                  <DynamicFormField
                    field={field}
                    value={getFieldValue(field.fieldName)}
                    onChange={handleFieldChange}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      } else if (item.type === 'single' && item.field) {
        // Single field (full width)
        const field = item.field;
        elements.push(
          <div
            key={`single-${field.fieldId}`}
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

      return <React.Fragment key={`fragment-${index}`}>{elements}</React.Fragment>;
    });
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
