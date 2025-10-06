import React from 'react';
import { Building, DollarSign, Users, Calendar, TrendingUp, CheckCircle, FileText } from 'lucide-react';
import { FormData } from '../types/quote';

interface BusinessTaxDetailsProps {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
}

const BusinessTaxDetails: React.FC<BusinessTaxDetailsProps> = ({ formData, updateFormData }) => {
  const businessTypes = [
    'Sole Proprietorship',
    'Partnership', 
    'LLC',
    'S-Corporation',
    'C-Corporation',
    'Non-Profit',
    'Other'
  ];

  const entityTypes = [
    'Partnership',
    'LLC',
    'S-Corporation',
    'C-Corporation'
  ];

  const revenueRanges = [
    'Under $50,000',
    '$50,000 - $100,000', 
    '$100,000 - $250,000',
    '$250,000 - $500,000',
    '$500,000 - $1,000,000',
    '$1,000,000 - $5,000,000',
    'Over $5,000,000'
  ];

  const employeeRanges = [
    'Just me',
    '2-5 employees',
    '6-10 employees', 
    '11-25 employees',
    '26-50 employees',
    '51-100 employees',
    'Over 100 employees'
  ];

  const businessIndustries = [
    'Professional Services',
    'Healthcare',
    'Technology',
    'Retail',
    'Construction',
    'Real Estate',
    'Manufacturing',
    'Food & Beverage',
    'Transportation',
    'Financial Services',
    'Education',
    'Consulting',
    'Marketing & Advertising',
    'Non-Profit',
    'Other'
  ];

  const otherSituations = [
    'Multi-state operations',
    'International transactions',
    'Inventory Management',
    'Equipment depreciation',
    'R&D tax credits',
    'Cost Segregation Studies'
  ];

  const toggleOtherSituation = (situation: string) => {
    const current = formData.businessTax?.otherSituations || [];
    const isSelected = current.includes(situation);
    
    const updated = isSelected
      ? current.filter(s => s !== situation)
      : [...current, situation];
    
    updateFormData({ 
      businessTax: { 
        ...formData.businessTax, 
        otherSituations: updated 
      } 
    });
  };

  const toggleAdditionalConsideration = (consideration: string) => {
    const current = formData.businessTax?.additionalConsiderations || [];
    const isSelected = current.includes(consideration);
    
    const updated = isSelected
      ? current.filter(c => c !== consideration)
      : [...current, consideration];
    
    updateFormData({ 
      businessTax: { 
        ...formData.businessTax, 
        additionalConsiderations: updated 
      } 
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Business Tax Services Details
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Tell us about your business so we can provide accurate pricing and service recommendations.
        </p>
      </div>

      {/* Business Name and Annual Revenue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Business Name */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
            <Building className="w-4 h-4 text-emerald-600" />
            <span>Business Name</span>
          </label>
          <input
            type="text"
            value={formData.businessTax?.businessName || ''}
            onChange={(e) => updateFormData({ 
              businessTax: { 
                ...formData.businessTax, 
                businessName: e.target.value 
              } 
            })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            placeholder="Enter your business name"
          />
        </div>

        {/* Annual Revenue */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Annual Revenue *</span>
          </label>
          <select
            value={formData.businessTax?.annualRevenue || ''}
            onChange={(e) => updateFormData({ 
              businessTax: { 
                ...formData.businessTax, 
                annualRevenue: e.target.value 
              } 
            })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            required
          >
            <option value="">Select revenue range</option>
            {revenueRanges.map((range) => (
              <option key={range} value={range}>{range}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Business Type and Business Industry */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Entity Type */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
            <Building className="w-4 h-4 text-emerald-600" />
            <span>Entity Type *</span>
          </label>
          <select
            value={formData.businessTax?.entityType || ''}
            onChange={(e) => updateFormData({ 
              businessTax: { 
                ...formData.businessTax, 
                entityType: e.target.value 
              } 
            })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            required
          >
            <option value="">Select entity type</option>
            {entityTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Business Industry */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
            <Building className="w-4 h-4 text-emerald-600" />
            <span>Business Industry</span>
          </label>
          <select
            value={formData.businessTax?.businessIndustry || ''}
            onChange={(e) => updateFormData({ 
              businessTax: { 
                ...formData.businessTax, 
                businessIndustry: e.target.value 
              } 
            })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          >
            <option value="">Select business industry</option>
            {businessIndustries.map((industry) => (
              <option key={industry} value={industry}>{industry}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tax Year and Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Tax Year Needed</span>
          </label>
          <select
            value={formData.businessTax?.taxYear || ''}
            onChange={(e) => updateFormData({ 
              businessTax: { 
                ...formData.businessTax, 
                taxYear: e.target.value 
              } 
            })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          >
            <option value="">Select tax year</option>
            <option value="2024">2024 (Current Year)</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
            <option value="2021">2021</option>
            <option value="Multiple">Multiple Years</option>
          </select>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>When do you need this completed?</span>
          </label>
          <select
            value={formData.businessTax?.timeline || ''}
            onChange={(e) => updateFormData({ 
              businessTax: { 
                ...formData.businessTax, 
                timeline: e.target.value 
              } 
            })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          >
            <option value="">Select timeline</option>
            <option value="ASAP">As soon as possible</option>
            <option value="1-2 weeks">Within 1-2 weeks</option>
            <option value="3-4 weeks">Within 3-4 weeks</option>
            <option value="Before deadline">Before tax deadline</option>
            <option value="No rush">No specific rush</option>
          </select>
        </div>
      </div>

      {/* Number of Owners */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
          <Users className="w-4 h-4 text-emerald-600" />
          <span>Number of Owners/Partners</span>
        </label>
        <input
          type="number"
          min="1"
          value={formData.businessTax?.numberOfOwners || ''}
          onChange={(e) => updateFormData({ 
            businessTax: { 
              ...formData.businessTax, 
              numberOfOwners: parseInt(e.target.value) || 1 
            } 
          })}
          className="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          placeholder="Enter number of owners"
        />
      </div>

      {/* Number of Employees */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
          <Users className="w-4 h-4 text-emerald-600" />
          <span>Number of Employees</span>
        </label>
        <select
          value={formData.businessTax?.numberOfEmployees || ''}
          onChange={(e) => updateFormData({ 
            businessTax: { 
              ...formData.businessTax, 
              numberOfEmployees: e.target.value 
            } 
          })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
        >
          <option value="">Select employee count</option>
          {employeeRanges.map((range) => (
            <option key={range} value={range}>{range}</option>
          ))}
        </select>
      </div>

      {/* Other Tax Situations */}
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>Other Tax Situations (Select all that apply)</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {otherSituations.map((situation) => {
            const isSelected = (formData.businessTax?.otherSituations || []).includes(situation);
            return (
              <button
                key={situation}
                onClick={() => toggleOtherSituation(situation)}
                className={`p-3 text-left border-2 rounded-lg transition-all duration-200 text-sm ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-25'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                  }`}>
                    {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <span>{situation}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Additional State Count */}
      {(formData.businessTax?.otherSituations || []).includes('Multi-state operations') && (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Number of Additional States (beyond your primary state)
          </label>
          <input
            type="number"
            min="0"
            value={formData.businessTax?.additionalStateCount || ''}
            onChange={(e) => updateFormData({ 
              businessTax: { 
                ...formData.businessTax, 
                additionalStateCount: parseInt(e.target.value) || 0 
              } 
            })}
            className="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            placeholder="Enter number of additional states"
          />
        </div>
      )}

      {/* Additional Considerations */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span>Additional Considerations</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {['First Year Entity', 'Ownership changes', 'Fixed Asset/Equipment acquisitions'].map((consideration) => {
            const isSelected = (formData.businessTax?.additionalConsiderations || []).includes(consideration);
            return (
              <button
                key={consideration}
                onClick={() => toggleAdditionalConsideration(consideration)}
                className={`p-3 text-left border-2 rounded-lg transition-all duration-200 text-sm ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-25'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                  }`}>
                    {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <span>{consideration}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fixed Asset Acquisition Count */}
      {(formData.businessTax?.additionalConsiderations || []).includes('Fixed Asset/Equipment acquisitions') && (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Number of Fixed Asset/Equipment Acquisitions
          </label>
          <input
            type="number"
            min="0"
            value={formData.businessTax?.fixedAssetAcquisitionCount || ''}
            onChange={(e) => updateFormData({ 
              businessTax: { 
                ...formData.businessTax, 
                fixedAssetAcquisitionCount: parseInt(e.target.value) || 0 
              } 
            })}
            className="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            placeholder="Enter number of acquisitions"
          />
        </div>
      )}

      {/* Previous Tax Preparation */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Previous Tax Preparation</h3>
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Who prepared your business taxes last year?
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {['Self-prepared', 'Other CPA/Tax Professional', 'Ledgerly', 'First time filing'].map((option) => (
              <button
                key={option}
                onClick={() => updateFormData({ 
                  businessTax: { 
                    ...formData.businessTax, 
                    previousPreparer: option 
                  } 
                })}
                className={`p-3 text-left border-2 rounded-lg transition-all duration-200 text-sm ${
                  formData.businessTax?.previousPreparer === option
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-25'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Special Circumstances */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">
          Special Circumstances or Questions
        </label>
        <textarea
          value={formData.businessTax?.specialCircumstances || ''}
          onChange={(e) => updateFormData({ 
            businessTax: { 
              ...formData.businessTax, 
              specialCircumstances: e.target.value 
            } 
          })}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
          placeholder="Tell us about any special circumstances, recent changes, or specific questions you have about your business tax situation..."
        />
      </div>

      {/* Information Box */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-emerald-800 mb-2">What's Included in Our Business Tax Service</h3>
            <ul className="space-y-1 text-sm text-emerald-700">
              <li>• Complete business tax return preparation (1120S, 1065, 1120)</li>
              <li>• Quarterly tax compliance and estimated payments</li>
              <li>• Sales tax filing assistance (if applicable)</li>
              <li>• Payroll tax compliance support</li>
              <li>• Strategic tax planning and optimization</li>
              <li>• Entity structure recommendations</li>
              <li>• Year-round business tax advice and support</li>
              <li>• Audit support and representation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessTaxDetails;