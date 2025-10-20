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
    const elements: JSX.Element[] = [];
    let currentRowGroup: FormField[] = [];

    // Filter fields by active status and conditional logic
    const visibleFields = formFields.filter(field =>
      field.active && shouldShowField(field, formData.individualTax || {})
    );

    visibleFields.forEach((field, index) => {
      const prevField = index > 0 ? visibleFields[index - 1] : null;

      if (field.sectionHeader && (!prevField || prevField.sectionHeader !== field.sectionHeader)) {
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

      if (field.fieldWidth === 'half' && field.rowGroup !== undefined) {
        currentRowGroup.push(field);

        const nextField = visibleFields[index + 1];
        if (!nextField || nextField.rowGroup !== field.rowGroup) {
          elements.push(renderRowGroup(currentRowGroup));
          currentRowGroup = [];
        }
      } else {
        if (currentRowGroup.length > 0) {
          elements.push(renderRowGroup(currentRowGroup));
          currentRowGroup = [];
        }

        elements.push(
          <div
            key={field.fieldId}
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
    });

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
            <DynamicFormFieldAirtable
              field={field}
              value={getFieldValue(field.fieldName)}
              onChange={handleFieldChange}
            />
          </div>
        ))}
      </div>
    );
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
