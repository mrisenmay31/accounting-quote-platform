import React from 'react';
import { CheckCircle, X, Phone, Mail, Calendar, TrendingUp, Shield, Users, DollarSign, Star, ArrowRight } from 'lucide-react';
import { FormData } from '../types/quote';

interface AdvisorySalesPageProps {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
}

const AdvisorySalesPage: React.FC<AdvisorySalesPageProps> = ({ formData, updateFormData }) => {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-semibold">
          <Star className="w-4 h-4" />
          <span>LEDGERLY ADVISORY SERVICES</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
          From Tax Stress to <span className="text-emerald-600">Wealth Strategy</span>
        </h1>
        
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Stop Overpaying Uncle Sam. Start Building Real Wealth.
        </p>
      </div>

      {/* Side-by-Side Comparison */}
      <div className="space-y-8">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-emerald-800 mb-3">
              Beyond Traditional Tax Prep
            </h2>
            <p className="text-lg text-emerald-700 max-w-2xl mx-auto">
              We don't just file your taxes; we partner with you year-round to build lasting wealth.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Traditional Tax Prep */}
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-red-800 mb-6 text-center">
              "Traditional" Tax Prep
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-red-800">Discovering tax-saving strategies only after it's too late</span>
              </li>
              <li className="flex items-start space-x-3">
                <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-red-800">Paying more than you legally owe</span>
              </li>
              <li className="flex items-start space-x-3">
                <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-red-800">Making business decisions blind to tax consequences</span>
              </li>
              <li className="flex items-start space-x-3">
                <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-red-800">Feeling lost in shifting tax rules</span>
              </li>
              <li className="flex items-start space-x-3">
                <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-red-800">Only hearing from your accountant once a year</span>
              </li>
            </ul>
            <p className="text-center text-lg text-red-700 font-medium mt-6">
              This reactive approach isn't just stressful—it's expensive.
            </p>
          </div>

          {/* Ledgerly Advisory Services */}
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-emerald-800 mb-6 text-center">
              Ledgerly Advisory Services
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-emerald-800 font-semibold">Proactive Tax Strategy</span>
                  <p className="text-emerald-700 text-sm mt-1">Semi-annual wealth strategy sessions, quarterly check-ins, year-end optimization</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-emerald-800 font-semibold">VIP Access & Support</span>
                  <p className="text-emerald-700 text-sm mt-1">Direct cell access to Mike & Andrew, monthly Q&A calls, unlimited support</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-emerald-800 font-semibold">Full Compliance, Done for You</span>
                  <p className="text-emerald-700 text-sm mt-1">Personal & business tax returns, annual reviews, audit defense readiness</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-emerald-800 font-semibold">Exclusive Member Benefits</span>
                  <p className="text-emerald-700 text-sm mt-1">50% off additional services, priority treatment, advanced strategies</p>
                </div>
              </li>
            </ul>
            <p className="text-center text-lg text-emerald-700 font-medium mt-6">
              A strategic partnership that builds wealth year-round.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvisorySalesPage;