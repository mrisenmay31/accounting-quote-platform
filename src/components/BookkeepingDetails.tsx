import React from 'react';
import { BookOpen, DollarSign, Users, Calendar, TrendingUp, Building, CheckCircle, FileText } from 'lucide-react';
import { FormData, ServiceConfig } from '../types/quote';

interface BookkeepingDetailsProps {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  serviceConfig?: ServiceConfig[];
}

const BookkeepingDetails: React.FC<BookkeepingDetailsProps> = ({ formData, updateFormData, serviceConfig = [] }) => {
  const businessTypes = [
    'Sole Proprietorship',
    'Partnership',
    'LLC',
    'S-Corporation',
    'C-Corporation',
    'Non-Profit',
    'Other'
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

  const bookkeepingMethods = [
    'Excel/Spreadsheets',
    'QuickBooks Online',
    'QuickBooks Desktop',
    'Xero',
    'Other software',
    'No current system'
  ];

  const transactionVolumes = [
    'Under 50 per month',
    '50-100 per month',
    '100-250 per month',
    '250-500 per month',
    '500-1000 per month',
    'Over 1000 per month'
  ];

  const bookkeepingServices = [
    'Monthly bank reconciliation',
    'Accounts payable management',
    'Accounts receivable management',
    'Payroll processing',
    'Inventory tracking',
    'Financial statement preparation',
    'Cash flow reporting',
    'Budget vs actual reporting'
  ];

  const bookkeepingFrequencies = [
    'Weekly',
    'Bi-weekly',
    'Monthly',
    'Quarterly',
    'As needed'
  ];

  const toggleBookkeepingService = (service: string) => {
    const current = formData.bookkeeping?.servicesNeeded || [];
    const isSelected = current.includes(service);
    
    const updated = isSelected
      ? current.filter(s => s !== service)
      : [...current, service];
    
    updateFormData({ 
      bookkeeping: { 
        ...formData.bookkeeping, 
        servicesNeeded: updated 
      } 
    });
  };

  const toggleAdditionalConsideration = (consideration: string) => {
    const current = formData.bookkeeping?.additionalConsiderations || [];
    const isSelected = current.includes(consideration);
    
    const updated = isSelected
      ? current.filter(c => c !== consideration)
      : [...current, consideration];
    
    updateFormData({ 
      bookkeeping: { 
        ...formData.bookkeeping, 
        additionalConsiderations: updated 
      } 
    });
  };
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Bookkeeping Services Details
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Tell us about your bookkeeping needs so we can provide accurate pricing and service recommendations.
        </p>
      </div>

      {/* Business Name - Full Width Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Business Name */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
            <Building className="w-4 h-4 text-emerald-600" />
            <span>Business Name</span>
          </label>
          <input
            type="text"
            value={formData.businessName}
            onChange={(e) => updateFormData({ businessName: e.target.value })}
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
            value={formData.annualRevenue}
            onChange={(e) => updateFormData({ annualRevenue: e.target.value })}
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

      {/* Business Type and Annual Revenue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Business Type */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
            <Building className="w-4 h-4 text-emerald-600" />
            <span>Business Type *</span>
          </label>
          <select
            value={formData.businessType}
            onChange={(e) => updateFormData({ businessType: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            required
          >
            <option value="">Select business type</option>
            {businessTypes.map((type) => (
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
            value={formData.bookkeeping?.businessIndustry || ''}
            onChange={(e) => updateFormData({ 
              bookkeeping: { 
                ...formData.bookkeeping, 
                businessIndustry: e.target.value 
              } 
            })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          >
            <option value="">Select business industry</option>
            <option value="Professional Services">Professional Services</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Technology">Technology</option>
            <option value="Retail">Retail</option>
            <option value="Construction">Construction</option>
            <option value="Real Estate">Real Estate</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Food & Beverage">Food & Beverage</option>
            <option value="Transportation">Transportation</option>
            <option value="Financial Services">Financial Services</option>
            <option value="Education">Education</option>
            <option value="Consulting">Consulting</option>
            <option value="Marketing & Advertising">Marketing & Advertising</option>
            <option value="Non-Profit">Non-Profit</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Current Bookkeeping Status and Current Bookkeeping Method */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Current Bookkeeping Status */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Current Bookkeeping Status</span>
          </label>
          <select
            value={formData.bookkeeping?.currentStatus || ''}
            onChange={(e) => updateFormData({ 
              bookkeeping: { 
                ...formData.bookkeeping, 
                currentStatus: e.target.value 
              } 
            })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          >
            <option value="">Select current status</option>
            <option value="Books are current">Books are current</option>
            <option value="Books need to be caught up">Books need to be caught up</option>
            <option value="Starting from scratch">Starting from scratch</option>
          </select>
        </div>
        {/* Current Bookkeeping Method */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Current Bookkeeping Method</span>
          </label>
          <select
            value={formData.currentBookkeepingMethod}
            onChange={(e) => updateFormData({ currentBookkeepingMethod: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          >
            <option value="">Select current method</option>
            {bookkeepingMethods.map((method) => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Conditional field for months behind */}
      {formData.bookkeeping?.currentStatus === 'Books need to be caught up' && (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>How many months behind are you?</span>
          </label>
          <input
            type="number"
            min="1"
            max="60"
            value={formData.bookkeeping?.monthsBehind || ''}
            onChange={(e) => updateFormData({ 
              bookkeeping: { 
                ...formData.bookkeeping, 
                monthsBehind: e.target.value 
              } 
            })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            placeholder="Enter number of months"
          >
          </input>
        </div>
      )}

      {/* Transaction Volume */}
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          <span>Financial Accounts</span>
        </label>
        <p className="text-sm text-gray-600 mb-4">
          List the total number of business checking, savings, credit cards, and loans
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Bank Accounts
            </label>
            <input
              type="number"
              min="0"
              value={formData.bookkeeping?.bankAccounts || ''}
              onChange={(e) => updateFormData({
                bookkeeping: {
                  ...formData.bookkeeping,
                  bankAccounts: parseInt(e.target.value) || 0
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              placeholder="0"
            />
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Credit Cards
            </label>
            <input
              type="number"
              min="0"
              value={formData.bookkeeping?.creditCards || ''}
              onChange={(e) => updateFormData({
                bookkeeping: {
                  ...formData.bookkeeping,
                  creditCards: parseInt(e.target.value) || 0
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              placeholder="0"
            />
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Bank Loans
            </label>
            <input
              type="number"
              min="0"
              value={formData.bookkeeping?.bankLoans || ''}
              onChange={(e) => updateFormData({
                bookkeeping: {
                  ...formData.bookkeeping,
                  bankLoans: parseInt(e.target.value) || 0
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              placeholder="0"
            />
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <span>Monthly Transaction Volume</span>
        </label>
        <p className="text-sm text-gray-600">
          Across your financial accounts, list your average monthly transaction volume (both deposits and expenses)
        </p>
        
        <div className="space-y-3">
          <input
            type="number"
            min="0"
            value={formData.bookkeeping?.monthlyTransactions || ''}
            onChange={(e) => updateFormData({
              bookkeeping: {
                ...formData.bookkeeping,
                monthlyTransactions: parseInt(e.target.value) || 0
              }
            })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            placeholder="Enter number of transactions"
          />
        </div>
      </div>

      {/* Service Frequency */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>Preferred Bookkeeping Service Frequency</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {['Monthly', 'Quarterly'].map((frequency) => (
            <button
              key={frequency}
              onClick={() => updateFormData({ 
                bookkeeping: { 
                  ...formData.bookkeeping, 
                  servicefrequency: frequency 
                } 
              })}
              className={`p-3 text-center border-2 rounded-lg transition-all duration-200 text-sm ${
                formData.bookkeeping?.servicefrequency === frequency
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-25'
              }`}
            >
              <span className="font-medium">{frequency}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Additional Considerations */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span>Additional Considerations</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {['QuickBooks setup or training', '3rd party app integration', 'Fixed Assets/Equipment', 'Inventory Management'].map((consideration) => {
            const isSelected = (formData.bookkeeping?.additionalConsiderations || []).includes(consideration);
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

      {/* Fixed Assets Count */}
      {(formData.bookkeeping?.additionalConsiderations || []).includes('Fixed Assets/Equipment') && (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Number of Fixed Assets/Equipment
          </label>
          <input
            type="number"
            min="0"
            value={formData.bookkeeping?.fixedassets || ''}
            onChange={(e) => updateFormData({
              bookkeeping: {
                ...formData.bookkeeping,
                fixedassets: parseInt(e.target.value) || 0
              }
            })}
            className="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            placeholder="Enter number of assets"
          />
        </div>
      )}

      {/* Cleanup Hours */}
      {/* Timeline */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>When would you like to start?</span>
        </label>
        <select
          value={formData.bookkeeping?.startTimeline || ''}
          onChange={(e) => updateFormData({ 
            bookkeeping: { 
              ...formData.bookkeeping, 
              startTimeline: e.target.value 
            } 
          })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
        >
          <option value="">Select timeline</option>
          <option value="Immediately">Immediately</option>
          <option value="Within 1 week">Within 1 week</option>
          <option value="Within 2 weeks">Within 2 weeks</option>
          <option value="Within 1 month">Within 1 month</option>
          <option value="Next quarter">Next quarter</option>
          <option value="Flexible">Flexible timing</option>
        </select>
      </div>

      {/* Current Challenges */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">
          Current Bookkeeping Challenges or Goals
        </label>
        <textarea
          value={formData.bookkeeping?.challenges || ''}
          onChange={(e) => updateFormData({ 
            bookkeeping: { 
              ...formData.bookkeeping, 
              challenges: e.target.value 
            } 
          })}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
          placeholder="Tell us about any current bookkeeping challenges, specific goals, or requirements you have..."
        />
      </div>

      {/* Information Box */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-emerald-800 mb-2">{serviceConfig.find(s => s.serviceId === 'bookkeeping')?.includedFeaturesCardTitle || "What's Included in Our Bookkeeping Service"}</h3>
            <ul className="space-y-1 text-sm text-emerald-700">
              {(serviceConfig.find(s => s.serviceId === 'bookkeeping')?.includedFeaturesCardList || [
                'Monthly bank and credit card reconciliation',
                'Transaction categorization and coding',
                'Financial statement preparation (P&L, Balance Sheet)',
                'Accounts payable and receivable management',
                'Monthly financial reports and insights',
                'QuickBooks setup, maintenance, and training',
                'Dedicated bookkeeper and account manager',
                'Secure document portal and communication'
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

export default BookkeepingDetails;