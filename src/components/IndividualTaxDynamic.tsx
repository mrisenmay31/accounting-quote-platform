/**
 * IndividualTaxDynamic Component
 * Dynamic form rendering for Individual Tax step using Airtable form fields
 * Supports complex layouts with section headers, icons, row grouping, and checkbox grids
 */

import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle } from 'lucide-react';
import { FormData, ServiceConfig } from '../types/quote';
import { useTenant } from '../contexts/TenantContext';
import { getCachedFormFields, FormField } from '../utils/formFieldsService';
import DynamicFormFieldAirtable from './DynamicFormField';
import { DynamicIcon } from '../utils/iconMapper';
import { shouldShowField, getFieldsToClear } from '../utils/conditionalLogic';

interface IndividualTaxDynamicProps {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  serviceConfig?: ServiceConfig[];
}

const IndividualTaxDynamic: React.FC<IndividualTaxDynamicProps> = ({
  formData,
  updateFormData,
  serviceConfig = [],
}) => {
  const { tenant, firmInfo } = useTenant();
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadFormFields = async () => {
      if (!tenant) {
        console.log('[IndividualTaxDynamic] Waiting for tenant configuration...');
        return;
      }

      try {
        setIsLoadingFields(true);
        setLoadError(null);

        const airtableConfig = {
          baseId: tenant.airtable.servicesBaseId || tenant.airtable.pricingBaseId,
          apiKey: tenant.airtable.servicesApiKey || tenant.airtable.pricingApiKey,
        };

        console.log('[IndividualTaxDynamic] Loading form fields for individual-tax');

        if (!airtableConfig.baseId) {
          throw new Error('Airtable Base ID is not configured for this tenant. Please contact support.');
        }
        if (!airtableConfig.apiKey) {
          throw new Error('Airtable API Key is not configured for this tenant. Please contact support.');
        }

        const fields = await getCachedFormFields(airtableConfig, 'individual-tax');

        setFormFields(fields);
        console.log(`[IndividualTaxDynamic] Successfully loaded ${fields.length} form fields`);
      } catch (error) {
        console.error('[IndividualTaxDynamic] Failed to load form fields:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setLoadError(`Unable to load form fields: ${errorMessage}`);
      } finally {
        setIsLoadingFields(false);
      }
    };

    loadFormFields();
  }, [tenant]);

  const handleFieldChange = (fieldName: string, value: any) => {
    const currentFormData = formData.individualTax || {};
    const updatedData = {
      ...currentFormData,
      [fieldName]: value,
    };

    // Clear values of conditional fields that should be hidden after this change
    const fieldsToClear = getFieldsToClear(formFields, fieldName, updatedData);
    fieldsToClear.forEach(fieldToClear => {
      updatedData[fieldToClear] = null;
      console.log(`[IndividualTaxDynamic] Clearing hidden field: ${fieldToClear}`);
    });

    updateFormData({
      individualTax: updatedData,
    });
  };

  const getFieldValue = (fieldName: string): any => {
    return (formData.individualTax as any)?.[fieldName] || '';
  };

  if (isLoadingFields) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Individual Tax Preparation Details
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
            Individual Tax Preparation Details
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Help us understand your tax situation
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="font-semibold text-red-900 mb-2">Error Loading Form Fields</h3>
          <p className="text-red-800 mb-3">{loadError}</p>
          {tenant && (
            <div className="text-sm text-red-700 mb-3">
              <p><strong>Debug Information:</strong></p>
              <p>Base ID: {tenant.airtable.servicesBaseId || tenant.airtable.pricingBaseId || 'Not configured'}</p>
              <p>Tenant: {tenant.subdomain}</p>
            </div>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (formFields.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Individual Tax Preparation Details
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Help us understand your tax situation
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            No form fields configured for Individual Tax. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  const renderFields = () => {
    // Filter fields by active status and conditional logic
    const visibleFields = formFields.filter(field =>
      field.active && shouldShowField(field, formData.individualTax || {})
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
                  <DynamicFormFieldAirtable
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
            <DynamicFormFieldAirtable
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

  const includedFeaturesCard = serviceConfig.find(s => s.serviceId === 'individual-tax');

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Individual Tax Preparation Details
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Help us understand your tax situation so we can provide the most accurate pricing and recommendations.
        </p>
      </div>

      {renderFields()}

      {includedFeaturesCard && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-800 mb-2">
                {includedFeaturesCard.includedFeaturesCardTitle || "What's Included in Our Individual Tax Service"}
              </h3>
              <ul className="space-y-1 text-sm text-emerald-700">
                {(includedFeaturesCard.includedFeaturesCardList || [
                  'Complete federal and state tax return preparation',
                  'Tax planning consultation to minimize future liability',
                  'Quarterly estimated tax calculations (if needed)',
                  'Audit support and representation',
                  'Prior year amendments (if needed)',
                  'Secure document portal for easy file sharing',
                  'Year-round tax advice and support'
                ]).map((feature, index) => (
                  <li key={index}>• {feature}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndividualTaxDynamic;
