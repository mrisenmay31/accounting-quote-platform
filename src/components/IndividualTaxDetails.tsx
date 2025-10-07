import React from 'react';
import { FileText, DollarSign, Calendar, Home, Briefcase, TrendingUp, Users, CheckCircle, Info } from 'lucide-react';
import { FormData, ServiceConfig } from '../types/quote';
import { useTenant } from '../contexts/TenantContext';

interface IndividualTaxDetailsProps {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  serviceConfig?: ServiceConfig[];
}

const IndividualTaxDetails: React.FC<IndividualTaxDetailsProps> = ({ formData, updateFormData, serviceConfig = [] }) => {
  const { firmInfo } = useTenant();
  const [showDeductionInfo, setShowDeductionInfo] = React.useState(false);

  const filingStatuses = [
    'Single',
    'Married Filing Jointly',
    'Married Filing Separately',
    'Head of Household',
    'Qualifying Widow(er)'
  ];

  const incomeRanges = [
    'Under $25,000',
    '$25,000 - $50,000',
    '$50,000 - $75,000',
    '$75,000 - $100,000',
    '$100,000 - $150,000',
    '$150,000 - $250,000',
    '$250,000 - $500,000',
    'Over $500,000'
  ];

  const incomeTypes = [
    'W-2 wages',
    '1099 income',
    'Social Security',
    'Unemployment',
    'Interest/Dividend Income',
    'Investment income (stocks, bonds)',
    'Retirement distributions',
    'Self-Employment Income (Do not include any income from Partnerships, S-Corps, or C-Corps)'
  ];

  const deductionTypes = [
    'Standard deduction',
    'Itemized deductions',
    'Not sure - need guidance'
  ];

  const taxSituations = [
    'S-Corp/Partnership Income',
    'Publicly Traded Partnership K-1s',
    'Rental Property Income',
    'Farm Income',
    'Cryptocurrency Sales',
    'Gambling Income',
    'Foreign Income'
  ];

  const toggleIncomeType = (type: string) => {
    const current = formData.individualTax?.incomeTypes || [];
    const isSelected = current.includes(type);
    
    const updated = isSelected
      ? current.filter(t => t !== type)
      : [...current, type];
    
    updateFormData({ 
      individualTax: { 
        ...formData.individualTax, 
        incomeTypes: updated 
      } 
    });
  };

  const toggleTaxSituation = (situation: string) => {
    const current = formData.individualTax?.taxSituations || [];
    const isSelected = current.includes(situation);
    
    const updated = isSelected
      ? current.filter(s => s !== situation)
      : [...current, situation];
    
    updateFormData({ 
      individualTax: { 
        ...formData.individualTax, 
        taxSituations: updated 
      } 
    });
  };

  const toggleOtherIncomeType = (type: string) => {
    const current = formData.individualTax?.otherIncomeTypes || [];
    const isSelected = current.includes(type);
    
    const updated = isSelected
      ? current.filter(t => t !== type)
      : [...current, type];
    
    updateFormData({ 
      individualTax: { 
        ...formData.individualTax, 
        otherIncomeTypes: updated 
      } 
    });
  };

  const toggleAdditionalConsideration = (consideration: string) => {
    const current = formData.individualTax?.additionalConsiderations || [];
    const isSelected = current.includes(consideration);
    
    const updated = isSelected
      ? current.filter(c => c !== consideration)
      : [...current, consideration];
    
    updateFormData({ 
      individualTax: { 
        ...formData.individualTax, 
        additionalConsiderations: updated 
      } 
    });
  };
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Filing Status */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Filing Status</span>
          </label>
          <select
            value={formData.individualTax?.filingStatus || ''}
            onChange={(e) => updateFormData({ 
              individualTax: { 
                ...formData.individualTax, 
                filingStatus: e.target.value 
              } 
            })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          >
            <option value="">Select filing status</option>
            {filingStatuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {/* Annual Income */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Annual Income Range</span>
          </label>
          <select
            value={formData.individualTax?.annualIncome || ''}
            onChange={(e) => updateFormData({ 
              individualTax: { 
                ...formData.individualTax, 
                annualIncome: e.target.value 
              } 
            })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          >
            <option value="">Select income range</option>
            {incomeRanges.map((range) => (
              <option key={range} value={range}>{range}</option>
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
            value={formData.individualTax?.taxYear || ''}
            onChange={(e) => updateFormData({ 
              individualTax: { 
                ...formData.individualTax, 
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
            value={formData.individualTax?.timeline || ''}
            onChange={(e) => updateFormData({ 
              individualTax: { 
                ...formData.individualTax, 
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

      {/* Income Types */}
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
          <Briefcase className="w-4 h-4 text-emerald-600" />
          <span>Types of Income (Select all that apply)</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {incomeTypes.map((type) => {
            const isSelected = (formData.individualTax?.incomeTypes || []).includes(type);
            return (
              <button
                key={type}
                onClick={() => toggleIncomeType(type)}
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
                  <span>{type}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Deduction Preference */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Deduction Preference</span>
          </label>
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setShowDeductionInfo(true)}
              onMouseLeave={() => setShowDeductionInfo(false)}
              onClick={() => setShowDeductionInfo(!showDeductionInfo)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
            
            {showDeductionInfo && (
              <div className="absolute left-0 top-6 z-10 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-2">You will most likely itemize your deductions if your qualified expenses (state income and property taxes, mortgage interest, charitable donations, etc.) are MORE than:</p>
                  <ul className="space-y-1">
                    <li>• $14,600 (Filing Single, Married Filing Separately)</li>
                    <li>• $21,900 (Head of Household)</li>
                    <li>• $29,200 (Married Filing Jointly, Qualified Widow(er))</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {deductionTypes.map((type) => (
            <button
              key={type}
              onClick={() => updateFormData({ 
                individualTax: { 
                  ...formData.individualTax, 
                  deductionType: type 
                } 
              })}
              className={`p-4 text-left border-2 rounded-lg transition-all duration-200 ${
                formData.individualTax?.deductionType === type
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-25'
              }`}
            >
              <span className="font-medium">{type}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Interest/Dividend Amount */}
      {/* Interest/Dividend Amount - Only show if Interest/Dividend Income is selected */}
      {(formData.individualTax?.incomeTypes || []).includes('Interest/Dividend Income') && (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Interest/Dividend Income Amount</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {['Less than $1,500', 'Greater than $1,500'].map((amount) => (
              <button
                key={amount}
                onClick={() => updateFormData({ 
                  individualTax: { 
                    ...formData.individualTax, 
                    interestDividendAmount: amount 
                  } 
                })}
                className={`p-4 text-left border-2 rounded-lg transition-all duration-200 ${
                  formData.individualTax?.interestDividendAmount === amount
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-25'
                }`}
              >
                <span className="font-medium">{amount}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tax Situation Complexity */}
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>Other Types of Income (Select all that apply)</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {taxSituations.map((situation) => {
            const isSelected = (formData.individualTax?.otherIncomeTypes || []).includes(situation);
            return (
              <button
                key={situation}
                onClick={() => toggleOtherIncomeType(situation)}
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

      {/* Quantity Fields for Per-Unit Pricing */}
      {(formData.individualTax?.otherIncomeTypes || []).includes('S-Corp/Partnership Income') && (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Number of K-1s
          </label>
          <input
            type="number"
            min="0"
            value={formData.individualTax?.k1Count || ''}
            onChange={(e) => updateFormData({ 
              individualTax: { 
                ...formData.individualTax, 
                k1Count: parseInt(e.target.value) || 0 
              } 
            })}
            className="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            placeholder="Enter number of K-1s"
          />
        </div>
      )}

      {(formData.individualTax?.otherIncomeTypes || []).includes('Rental Property Income') && (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Number of Rental Properties
          </label>
          <input
            type="number"
            min="0"
            value={formData.individualTax?.rentalPropertyCount || ''}
            onChange={(e) => updateFormData({ 
              individualTax: { 
                ...formData.individualTax, 
                rentalPropertyCount: parseInt(e.target.value) || 0 
              } 
            })}
            className="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            placeholder="Enter number of properties"
          />
        </div>
      )}

      {(formData.individualTax?.incomeTypes || []).includes('Self-Employment Income (Do not include any income from Partnerships, S-Corps, or C-Corps)') && (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Number of Self-Employment Businesses
          </label>
          <input
            type="number"
            min="0"
            value={formData.individualTax?.selfEmploymentBusinessCount || ''}
            onChange={(e) => updateFormData({ 
              individualTax: { 
                ...formData.individualTax, 
                selfEmploymentBusinessCount: parseInt(e.target.value) || 0 
              } 
            })}
            className="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            placeholder="Enter number of businesses"
          />
        </div>
      )}

      {/* Additional Tax Considerations */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <Home className="w-5 h-5 text-emerald-600" />
          <span>Additional Considerations</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {['Primary home sale', 'Investment Property sale', 'Income from multiple states', 'Adopted a child', 'Divorce', 'Marriage'].map((consideration) => {
            const isSelected = (formData.individualTax?.additionalConsiderations || []).includes(consideration);
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

      {/* Additional State Count */}
      {(formData.individualTax?.additionalConsiderations || []).includes('Income from multiple states') && (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Number of Additional States (beyond your primary state)
          </label>
          <input
            type="number"
            min="0"
            value={formData.individualTax?.additionalStateCount || ''}
            onChange={(e) => updateFormData({ 
              individualTax: { 
                ...formData.individualTax, 
                additionalStateCount: parseInt(e.target.value) || 0 
              } 
            })}
            className="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            placeholder="Enter number of additional states"
          />
        </div>
      )}

      {/* Other Income Sources */}
      <div className="space-y-4">
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Do you have any other sources of income?
          </label>
          <select
            value={formData.individualTax?.hasOtherIncome || ''}
            onChange={(e) => updateFormData({ 
              individualTax: { 
                ...formData.individualTax, 
                hasOtherIncome: e.target.value 
              } 
            })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          >
            <option value="">Select an option</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        {formData.individualTax?.hasOtherIncome === 'Yes' && (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              Please describe your other sources of income
            </label>
            <textarea
              value={formData.individualTax?.otherIncomeDescription || ''}
              onChange={(e) => updateFormData({ 
                individualTax: { 
                  ...formData.individualTax, 
                  otherIncomeDescription: e.target.value 
                } 
              })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
              placeholder="Please describe any other sources of income not mentioned above..."
            />
          </div>
        )}
      </div>

      {/* Previous Tax Preparation */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Previous Tax Preparation</h3>
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Who prepared your taxes last year?
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {['Self-prepared (TurboTax, etc.)', 'Other CPA/Tax Professional', firmInfo?.firmName || 'Ledgerly', 'First time filing'].map((option) => (
              <button
                key={option}
                onClick={() => updateFormData({
                  individualTax: {
                    ...formData.individualTax,
                    previousPreparer: option
                  }
                })}
                className={`p-3 text-left border-2 rounded-lg transition-all duration-200 text-sm ${
                  formData.individualTax?.previousPreparer === option
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
          value={formData.individualTax?.specialCircumstances || ''}
          onChange={(e) => updateFormData({ 
            individualTax: { 
              ...formData.individualTax, 
              specialCircumstances: e.target.value 
            } 
          })}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
          placeholder="Tell us about any special circumstances, life changes, or specific questions you have about your tax situation..."
        />
      </div>

      {/* Information Box */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-emerald-800 mb-2">{serviceConfig.find(s => s.serviceId === 'individual-tax')?.includedFeaturesCardTitle || "What's Included in Our Individual Tax Service"}</h3>
            <ul className="space-y-1 text-sm text-emerald-700">
              {(serviceConfig.find(s => s.serviceId === 'individual-tax')?.includedFeaturesCardList || [
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
    </div>
  );
};

export default IndividualTaxDetails;