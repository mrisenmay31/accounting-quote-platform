/**
 * ContactFormDynamic Component
 * Fully dynamic contact form powered by Airtable Form Fields table
 * Loads fields from Service ID: contact-info
 * Supports sections, conditional logic, and custom field configurations
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { FormData } from '../types/quote';
import { useTenant } from '../contexts/TenantContext';
import { getCachedFormFields, FormField } from '../utils/formFieldsService';
import DynamicFormField from './DynamicFormField';
import { DynamicIcon } from '../utils/iconMapper';

interface ContactFormDynamicProps {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  onNext: () => void;
}

const ContactFormDynamic: React.FC<ContactFormDynamicProps> = ({
  formData,
  updateFormData,
  onNext
}) => {
  const { tenant } = useTenant();
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize contactInfo if it doesn't exist
  useEffect(() => {
    if (!formData.contactInfo) {
      updateFormData({ contactInfo: {} });
    }
  }, []);

  // Fetch contact-info fields from Airtable
  useEffect(() => {
    async function loadFields() {
      if (!tenant) return;

      try {
        setLoading(true);
        setError(null);

        const airtableConfig = {
          baseId: tenant.airtable.servicesBaseId || tenant.airtable.pricingBaseId,
          apiKey: tenant.airtable.servicesApiKey || tenant.airtable.pricingApiKey,
        };

        console.log('[ContactFormDynamic] Loading contact-info fields...');

        const contactFields = await getCachedFormFields(airtableConfig, 'contact-info');

        if (contactFields.length === 0) {
          setError('No contact fields configured. Please contact support.');
          console.warn('[ContactFormDynamic] No active fields found for contact-info');
        } else {
          console.log(`[ContactFormDynamic] Loaded ${contactFields.length} contact fields`);
        }

        setFields(contactFields);
      } catch (err) {
        console.error('[ContactFormDynamic] Failed to load contact fields:', err);
        setError('Unable to load contact form. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadFields();
  }, [tenant]);

  // Handle field value changes
  function handleFieldChange(fieldName: string, value: any) {
    const updatedContactInfo = {
      ...formData.contactInfo,
      [fieldName]: value
    };

    // Also update legacy fields for backward compatibility
    const updates: Partial<FormData> = {
      contactInfo: updatedContactInfo
    };

    // Map to legacy fields
    if (fieldName === 'email') updates.email = value;
    if (fieldName === 'firstName') updates.firstName = value;
    if (fieldName === 'lastName') updates.lastName = value;
    if (fieldName === 'phone') updates.phone = value;

    updateFormData(updates);
  }

  // Check if field should be visible based on conditional logic
  function isFieldVisible(field: FormField): boolean {
    if (!field.conditionalLogic) {
      return true;
    }

    try {
      const logic = typeof field.conditionalLogic === 'string'
        ? JSON.parse(field.conditionalLogic)
        : field.conditionalLogic;

      if (!logic.showIf) {
        return true;
      }

      // Check if showIf references services array
      if (logic.showIf.services) {
        const { operator, value } = logic.showIf.services;
        const selectedServices = formData.services || [];

        if (operator === 'includesAny') {
          return value.some((v: string) => selectedServices.includes(v));
        }

        if (operator === 'includes') {
          return selectedServices.includes(value);
        }
      }

      // Check other conditional logic (field-to-field dependencies)
      const entries = Object.entries(logic.showIf);

      for (const [targetField, condition] of entries) {
        if (targetField === 'services') continue; // Already handled

        const fieldValue = formData.contactInfo[targetField];
        const { operator, value } = condition as any;

        if (operator === 'equals' && fieldValue !== value) {
          return false;
        }

        if (operator === 'includes' && !fieldValue?.includes(value)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.warn('[ContactFormDynamic] Error parsing conditional logic:', field.conditionalLogic, error);
      return true; // Show field if logic is invalid
    }
  }

  // Validate required fields before proceeding
  function handleNext() {
    // Find all visible required fields
    const visibleFields = fields.filter(isFieldVisible);
    const requiredFields = visibleFields.filter(f => f.required);

    // Check if all required fields have values
    const missingFields = requiredFields.filter(field => {
      const value = formData.contactInfo[field.fieldName];
      return !value || (typeof value === 'string' && value.trim() === '');
    });

    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.map(f => f.fieldLabel).join(', ')}`);
      return;
    }

    // Validate email format
    const emailField = fields.find(f => f.fieldType === 'email');
    if (emailField && isFieldVisible(emailField)) {
      const emailValue = formData.contactInfo[emailField.fieldName];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (emailValue && !emailRegex.test(emailValue)) {
        alert('Please enter a valid email address.');
        return;
      }
    }

    onNext();
  }

  // Group fields by section header
  function getSections() {
    const sections: { header?: string; icon?: string; fields: FormField[] }[] = [];
    let currentSection: { header?: string; icon?: string; fields: FormField[] } = { fields: [] };

    fields.forEach(field => {
      // If field has a section header and it's different from current, start new section
      if (field.sectionHeader && field.sectionHeader !== currentSection.header) {
        if (currentSection.fields.length > 0) {
          sections.push(currentSection);
        }
        currentSection = {
          header: field.sectionHeader,
          icon: field.sectionIcon,
          fields: []
        };
      }

      currentSection.fields.push(field);
    });

    // Push final section
    if (currentSection.fields.length > 0) {
      sections.push(currentSection);
    }

    // If no section headers, create single default section
    if (sections.length === 0 && fields.length > 0) {
      sections.push({ header: 'Contact Information', fields });
    }

    return sections;
  }

  // Group fields by row group for side-by-side layout
  function groupFieldsByRow(sectionFields: FormField[]): FormField[][] {
    const visibleFields = sectionFields.filter(isFieldVisible);
    const grouped: FormField[][] = [];
    const rowGroups = new Map<number, FormField[]>();

    visibleFields.forEach(field => {
      // If field has a row group, add to that group
      if (field.rowGroup) {
        if (!rowGroups.has(field.rowGroup)) {
          rowGroups.set(field.rowGroup, []);
        }
        rowGroups.get(field.rowGroup)!.push(field);
      } else {
        // Standalone field
        grouped.push([field]);
      }
    });

    // Add row groups to main array (sorted by row group number)
    const sortedRowGroups = Array.from(rowGroups.entries()).sort((a, b) => a[0] - b[0]);
    sortedRowGroups.forEach(([_, group]) => {
      grouped.push(group);
    });

    return grouped;
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contact form...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Unable to Load Form</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  const sections = getSections();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Let's Get Started
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Tell us about yourself so we can create a personalized quote for your tax and accounting needs.
        </p>
      </div>

      {/* Render each section */}
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="space-y-6">
          {/* Section Header */}
          {section.header && (
            <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
              {section.icon && <DynamicIcon name={section.icon} className="w-6 h-6 text-emerald-600" />}
              <h3 className="text-xl font-semibold text-gray-800">{section.header}</h3>
            </div>
          )}

          {/* Render fields grouped by row */}
          {groupFieldsByRow(section.fields).map((rowFields, rowIndex) => {
            // Determine if this is a side-by-side row
            const isSideBySide = rowFields.length > 1 && rowFields.every(f => f.fieldWidth === 'half');

            if (isSideBySide) {
              // Side-by-side layout
              return (
                <div key={rowIndex} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {rowFields.map(field => (
                    <DynamicFormField
                      key={field.fieldName}
                      field={field}
                      value={formData.contactInfo[field.fieldName]}
                      onChange={(fieldName, value) => handleFieldChange(fieldName, value)}
                    />
                  ))}
                </div>
              );
            } else {
              // Full-width fields
              return (
                <div key={rowIndex} className="space-y-6">
                  {rowFields.map(field => (
                    <DynamicFormField
                      key={field.fieldName}
                      field={field}
                      value={formData.contactInfo[field.fieldName]}
                      onChange={(fieldName, value) => handleFieldChange(fieldName, value)}
                    />
                  ))}
                </div>
              );
            }
          })}
        </div>
      ))}

      {/* Trust Indicator */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-emerald-800 mb-2">Why We Need This Information</h3>
            <p className="text-emerald-700 text-sm leading-relaxed">
              Your contact details help us provide personalized service recommendations and ensure
              you receive your customized quote. We respect your privacy and will never share your
              information with third parties.
            </p>
          </div>
        </div>
      </div>

      {/* Next Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <button
          onClick={handleNext}
          className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
        >
          Continue to Services
        </button>
      </div>
    </div>
  );
};

export default ContactFormDynamic;
