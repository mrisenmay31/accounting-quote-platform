/**
 * IndividualTaxDynamic Component
 * Dynamic form rendering for Individual Tax step using Airtable form fields
 * Replaces hardcoded form fields with data-driven approach
 */

import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { FormData } from '../types/quote';
import { useTenant } from '../contexts/TenantContext';
import { getCachedFormFields, FormField } from '../utils/formFieldsService';
import DynamicFormField from './DynamicFormField';

interface IndividualTaxDynamicProps {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
}

const IndividualTaxDynamic: React.FC<IndividualTaxDynamicProps> = ({
  formData,
  updateFormData,
}) => {
  const { tenant } = useTenant();
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load form fields from Airtable on component mount
  useEffect(() => {
    const loadFormFields = async () => {
      if (!tenant) return;

      try {
        setIsLoadingFields(true);
        setLoadError(null);

        // Use Airtable configuration from tenant
        const airtableConfig = {
          baseId: tenant.airtable.servicesBaseId || tenant.airtable.pricingBaseId,
          apiKey: tenant.airtable.servicesApiKey || tenant.airtable.pricingApiKey,
        };

        console.log('[IndividualTaxDynamic] Loading form fields for individual-tax');

        // Fetch fields from Airtable filtered by service ID
        const fields = await getCachedFormFields(airtableConfig, 'individual-tax');

        setFormFields(fields);
        console.log(`[IndividualTaxDynamic] Loaded ${fields.length} form fields`);
      } catch (error) {
        console.error('[IndividualTaxDynamic] Failed to load form fields:', error);
        setLoadError('Unable to load form fields. Please try again.');
      } finally {
        setIsLoadingFields(false);
      }
    };

    loadFormFields();
  }, [tenant]);

  // Handle field value changes
  const handleFieldChange = (fieldName: string, value: any) => {
    updateFormData({
      individualTax: {
        ...formData.individualTax,
        [fieldName]: value,
      },
    });
  };

  // Get current field value from formData
  const getFieldValue = (fieldName: string): any => {
    return (formData.individualTax as any)?.[fieldName] || '';
  };

  // Loading state
  if (isLoadingFields) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3 mb-8">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--tenant-primary-100, #d1fae5)' }}
          >
            <FileText
              className="w-6 h-6"
              style={{ color: 'var(--tenant-primary-600, #10b981)' }}
            />
          </div>
          <div>
            <h2
              className="text-2xl font-bold"
              style={{ color: 'var(--tenant-primary-900, #064e3b)' }}
            >
              Individual Tax Details
            </h2>
            <p className="text-gray-600">Loading form fields...</p>
          </div>
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

  // Error state
  if (loadError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3 mb-8">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--tenant-primary-100, #d1fae5)' }}
          >
            <FileText
              className="w-6 h-6"
              style={{ color: 'var(--tenant-primary-600, #10b981)' }}
            />
          </div>
          <div>
            <h2
              className="text-2xl font-bold"
              style={{ color: 'var(--tenant-primary-900, #064e3b)' }}
            >
              Individual Tax Details
            </h2>
            <p className="text-gray-600">Please provide your tax information</p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-red-600 hover:text-red-800 font-medium"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // No fields found state
  if (formFields.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3 mb-8">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--tenant-primary-100, #d1fae5)' }}
          >
            <FileText
              className="w-6 h-6"
              style={{ color: 'var(--tenant-primary-600, #10b981)' }}
            />
          </div>
          <div>
            <h2
              className="text-2xl font-bold"
              style={{ color: 'var(--tenant-primary-900, #064e3b)' }}
            >
              Individual Tax Details
            </h2>
            <p className="text-gray-600">Please provide your tax information</p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            No form fields configured for Individual Tax. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  // Main render - dynamic form fields
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-8">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--tenant-primary-100, #d1fae5)' }}
        >
          <FileText
            className="w-6 h-6"
            style={{ color: 'var(--tenant-primary-600, #10b981)' }}
          />
        </div>
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ color: 'var(--tenant-primary-900, #064e3b)' }}
          >
            Individual Tax Details
          </h2>
          <p className="text-gray-600">
            Please provide your tax information to help us calculate your quote
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {formFields.map((field) => (
          <DynamicFormField
            key={field.fieldId}
            field={field}
            value={getFieldValue(field.fieldName)}
            onChange={handleFieldChange}
          />
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> All information provided is confidential and will be used
          solely for preparing your quote.
        </p>
      </div>
    </div>
  );
};

export default IndividualTaxDynamic;
