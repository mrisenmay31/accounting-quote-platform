import React, { useState } from 'react';
import { Phone, Calendar, CheckCircle, Star, ArrowRight, Send, X, Calculator, Info, ChevronDown, ChevronUp, TrendingUp, Zap, ClipboardCheck, GraduationCap, Code, Clock, RefreshCw, AlertCircle, Mail, Globe, MapPin } from 'lucide-react';
import { FormData, QuoteData } from '../types/quote';
import { useTenant } from '../contexts/TenantContext';

interface QuoteResultsProps {
  formData: FormData;
  quote: QuoteData | null;
  onRecalculate?: () => void;
}

const QuoteResults: React.FC<QuoteResultsProps> = ({ formData, quote, onRecalculate }) => {
  const { tenant, firmInfo } = useTenant();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showRecalculateModal, setShowRecalculateModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const handleSubmitToAirtable = async () => {
    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Quote accepted by user:', { formData, quote });
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error processing quote acceptance:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateLockDate = () => {
    const today = new Date();
    const days = firmInfo?.quoteLockDays || 14;
    const lockDate = new Date(today.setDate(today.getDate() + days));
    return lockDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };


  const handleRecalculateClick = () => {
    setShowRecalculateModal(true);
  };

  const handleConfirmRecalculate = () => {
    setShowRecalculateModal(false);
    if (onRecalculate) {
      onRecalculate();
    }
  };

  const handleCancelRecalculate = () => {
    setShowRecalculateModal(false);
  };

  const handleScheduleConsultation = () => {
    if (firmInfo?.consultationLink) {
      window.open(firmInfo.consultationLink, '_blank', 'noopener,noreferrer');
    } else {
      setShowContactModal(true);
    }
  };

  const generateQuoteId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 7);
    return `Q-${timestamp}-${randomStr}`.toUpperCase();
  };

  if (!quote) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4" style={{ borderColor: 'var(--tenant-primary-600, #10b981)', borderTopColor: 'transparent' }} />
        <p className="text-gray-600">Calculating your personalized quote...</p>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="text-center py-12 space-y-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: 'var(--tenant-primary-100, #d1fae5)' }}>
          <CheckCircle className="w-12 h-12" style={{ color: 'var(--tenant-primary-600, #10b981)' }} />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Quote Submitted Successfully!</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Thank you for your interest in {tenant?.firmName || 'our'} services. We'll review your requirements and
            contact you within 24 hours to discuss your customized quote and next steps.
          </p>
        </div>
        <div className="rounded-lg p-6 max-w-md mx-auto" style={{ backgroundColor: 'var(--tenant-primary-50, #f0fdf4)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--tenant-primary-200, #d1fae5)' }}>
          <h3 className="font-semibold mb-2" style={{ color: 'var(--tenant-primary-800, #065f46)' }}>What happens next?</h3>
          <div className="space-y-2 text-sm" style={{ color: 'var(--tenant-primary-700, #047857)' }}>
            <p>• We'll review your specific requirements</p>
            <p>• A senior advisor will contact you within 24 hours</p>
            <p>• We'll schedule a consultation to discuss your needs</p>
            <p>• You'll receive a detailed proposal and engagement letter</p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="max-w-4xl mx-auto">
      {/* Quote Container */}
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden mb-24">
        {/* Progress Bar */}
        <div className="h-2 rounded-t-2xl" style={{ background: 'linear-gradient(to right, var(--tenant-primary-600, #10b981), var(--tenant-primary-500, #10b981))' }}></div>

        {/* Quote Header */}
        <div className="text-white p-10 text-center" style={{ background: 'linear-gradient(to bottom right, var(--tenant-primary-600, #10b981), var(--tenant-primary-700, #059669))' }}>
          <h1 className="text-4xl font-bold mb-3 tracking-tight">{firmInfo?.quoteHeaderTitle || 'Your Customized Quote'}</h1>
          <p className="text-lg opacity-95 mb-6 max-w-2xl mx-auto">
            {firmInfo?.quoteHeaderSubtitle || `Tailored pricing for ${tenant?.firmName || 'our'} services based on your answers. Lock this quote for ${firmInfo?.quoteLockDays || 14} days.`}
          </p>
          
          {/* Value Outcomes Pills */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
            {firmInfo?.valueProp1Title && (
              <div className="bg-white bg-opacity-20 border border-white border-opacity-30 rounded-xl p-4 flex items-center space-x-3 hover:bg-opacity-30 transition-all duration-300">
                <span className="text-lg flex-shrink-0">{firmInfo.valueProp1Icon || '✓'}</span>
                <span className="text-sm font-medium">{firmInfo.valueProp1Title}</span>
              </div>
            )}
            {firmInfo?.valueProp2Title && (
              <div className="bg-white bg-opacity-20 border border-white border-opacity-30 rounded-xl p-4 flex items-center space-x-3 hover:bg-opacity-30 transition-all duration-300">
                <span className="text-lg flex-shrink-0">{firmInfo.valueProp2Icon || '✓'}</span>
                <span className="text-sm font-medium">{firmInfo.valueProp2Title}</span>
              </div>
            )}
            {firmInfo?.valueProp3Title && (
              <div className="bg-white bg-opacity-20 border border-white border-opacity-30 rounded-xl p-4 flex items-center space-x-3 hover:bg-opacity-30 transition-all duration-300">
                <span className="text-lg flex-shrink-0">{firmInfo.valueProp3Icon || '✓'}</span>
                <span className="text-sm font-medium">{firmInfo.valueProp3Title}</span>
              </div>
            )}
          </div>
        </div>

        {/* Summary Section */}
        <div className="bg-gray-50 p-10 border-b border-gray-200">
          <div className="grid grid-cols-1 gap-6">
            {/* Total Investment Card */}
            <div className="bg-gradient-to-br from-white to-emerald-50/30 rounded-2xl shadow-lg shadow-emerald-500/10 border-2 border-emerald-100 hover:shadow-xl hover:shadow-emerald-500/20 hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
              {/* Animated Top Accent Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 bg-[length:200%_100%] animate-[shimmer_3s_linear_infinite]"></div>

              {/* Card Header */}
              <div className="px-7 pt-7 pb-5 text-center relative">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  Quote Summary
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Total Estimated Investment</h3>
                <p className="text-sm text-gray-600 font-medium">Premium tax advisory partnership</p>
              </div>

              {/* Pricing Hero Section */}
              <div className="px-7 py-6 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 border-y border-emerald-100 relative overflow-hidden">
                {/* Decorative radial glow */}
                <div className="absolute top-[-50%] right-[-20%] w-[300px] h-[300px] bg-emerald-500/8 rounded-full blur-3xl"></div>

                <div className="relative z-10 flex items-stretch justify-center gap-6">
                  {/* Monthly Fees Section */}
                  <div className="flex-1 text-center">
                    <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Monthly Fees</div>
                    <div className="flex items-baseline justify-center space-x-2">
                      <span className="text-4xl font-bold" style={{ background: 'linear-gradient(to bottom right, var(--tenant-primary-700, #047857), var(--tenant-primary-600, #10b981), var(--tenant-primary-500, #10b981))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>${quote.totalMonthlyFees.toLocaleString()}</span>
                      <span className="text-xs text-gray-600 font-semibold">PER MONTH</span>
                    </div>
                  </div>

                  {quote.totalOneTimeFees > 0 && (
                    <>
                      {/* Separator Pill */}
                      <div className="flex items-center">
                        <div className="w-px h-16 bg-gradient-to-b from-transparent via-emerald-300 to-transparent"></div>
                      </div>

                      {/* One-Time Fees Section */}
                      <div className="flex-1 text-center">
                        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">One-Time Fees</div>
                        <div className="flex items-baseline justify-center space-x-2">
                          <span className="text-4xl font-bold bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-500 bg-clip-text text-transparent">${quote.totalOneTimeFees.toLocaleString()}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Trust Section */}
              <div className="px-7 pb-7 pt-6 bg-white">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 text-center">Why Clients Choose Us</div>
                <div className="grid grid-cols-2 gap-2 justify-items-center">
                  {firmInfo?.trustBadge1 && (
                    <div className="flex items-center justify-center gap-2 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg px-2.5 py-1.5 transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-md cursor-default"
                         style={{
                           borderColor: 'var(--tenant-primary-200, #d1fae5)',
                         }}
                         onMouseEnter={(e) => {
                           e.currentTarget.style.background = 'linear-gradient(to bottom right, var(--tenant-primary-50, #f0fdf4), var(--tenant-primary-100, #dcfce7))';
                           e.currentTarget.style.borderColor = 'var(--tenant-primary-300, #a7f3d0)';
                         }}
                         onMouseLeave={(e) => {
                           e.currentTarget.style.background = 'linear-gradient(to bottom right, rgb(249, 250, 251), rgb(243, 244, 246))';
                           e.currentTarget.style.borderColor = 'var(--tenant-primary-200, #d1fae5)';
                         }}>
                      <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--tenant-primary-600, #10b981)' }} />
                      <div className="text-xs leading-tight text-gray-700 font-semibold whitespace-nowrap">
                        {firmInfo.trustBadge1}
                      </div>
                    </div>
                  )}

                  {firmInfo?.trustBadge2 && (
                    <div className="flex items-center justify-center gap-2 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg px-2.5 py-1.5 transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-md cursor-default"
                         style={{
                           borderColor: 'var(--tenant-primary-200, #d1fae5)',
                         }}
                         onMouseEnter={(e) => {
                           e.currentTarget.style.background = 'linear-gradient(to bottom right, var(--tenant-primary-50, #f0fdf4), var(--tenant-primary-100, #dcfce7))';
                           e.currentTarget.style.borderColor = 'var(--tenant-primary-300, #a7f3d0)';
                         }}
                         onMouseLeave={(e) => {
                           e.currentTarget.style.background = 'linear-gradient(to bottom right, rgb(249, 250, 251), rgb(243, 244, 246))';
                           e.currentTarget.style.borderColor = 'var(--tenant-primary-200, #d1fae5)';
                         }}>
                      <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--tenant-primary-600, #10b981)' }} />
                      <div className="text-xs leading-tight text-gray-700 font-semibold whitespace-nowrap">
                        {firmInfo.trustBadge2}
                      </div>
                    </div>
                  )}

                  {firmInfo?.trustBadge3 && (
                    <div className="flex items-center justify-center gap-2 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg px-2.5 py-1.5 transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-md cursor-default"
                         style={{
                           borderColor: 'var(--tenant-primary-200, #d1fae5)',
                         }}
                         onMouseEnter={(e) => {
                           e.currentTarget.style.background = 'linear-gradient(to bottom right, var(--tenant-primary-50, #f0fdf4), var(--tenant-primary-100, #dcfce7))';
                           e.currentTarget.style.borderColor = 'var(--tenant-primary-300, #a7f3d0)';
                         }}
                         onMouseLeave={(e) => {
                           e.currentTarget.style.background = 'linear-gradient(to bottom right, rgb(249, 250, 251), rgb(243, 244, 246))';
                           e.currentTarget.style.borderColor = 'var(--tenant-primary-200, #d1fae5)';
                         }}>
                      <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--tenant-primary-600, #10b981)' }} />
                      <div className="text-xs leading-tight text-gray-700 font-semibold whitespace-nowrap">
                        {firmInfo.trustBadge3}
                      </div>
                    </div>
                  )}

                  {firmInfo?.trustBadge4 && (
                    <div className="flex items-center justify-center gap-2 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg px-2.5 py-1.5 transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-md cursor-default"
                         style={{
                           borderColor: 'var(--tenant-primary-200, #d1fae5)',
                         }}
                         onMouseEnter={(e) => {
                           e.currentTarget.style.background = 'linear-gradient(to bottom right, var(--tenant-primary-50, #f0fdf4), var(--tenant-primary-100, #dcfce7))';
                           e.currentTarget.style.borderColor = 'var(--tenant-primary-300, #a7f3d0)';
                         }}
                         onMouseLeave={(e) => {
                           e.currentTarget.style.background = 'linear-gradient(to bottom right, rgb(249, 250, 251), rgb(243, 244, 246))';
                           e.currentTarget.style.borderColor = 'var(--tenant-primary-200, #d1fae5)';
                         }}>
                      <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--tenant-primary-600, #10b981)' }} />
                      <div className="text-xs leading-tight text-gray-700 font-semibold whitespace-nowrap">
                        {firmInfo.trustBadge4}
                      </div>
                    </div>
                  )}

                  {firmInfo?.trustBadge5 && (
                    <div className="flex items-center justify-center gap-2 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg px-2.5 py-1.5 transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-md cursor-default"
                         style={{
                           borderColor: 'var(--tenant-primary-200, #d1fae5)',
                         }}
                         onMouseEnter={(e) => {
                           e.currentTarget.style.background = 'linear-gradient(to bottom right, var(--tenant-primary-50, #f0fdf4), var(--tenant-primary-100, #dcfce7))';
                           e.currentTarget.style.borderColor = 'var(--tenant-primary-300, #a7f3d0)';
                         }}
                         onMouseLeave={(e) => {
                           e.currentTarget.style.background = 'linear-gradient(to bottom right, rgb(249, 250, 251), rgb(243, 244, 246))';
                           e.currentTarget.style.borderColor = 'var(--tenant-primary-200, #d1fae5)';
                         }}>
                      <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--tenant-primary-600, #10b981)' }} />
                      <div className="text-xs leading-tight text-gray-700 font-semibold whitespace-nowrap">
                        {firmInfo.trustBadge5}
                      </div>
                    </div>
                  )}

                  {firmInfo?.trustBadge6 && (
                    <div className="flex items-center justify-center gap-2 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg px-2.5 py-1.5 transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-md cursor-default"
                         style={{
                           borderColor: 'var(--tenant-primary-200, #d1fae5)',
                         }}
                         onMouseEnter={(e) => {
                           e.currentTarget.style.background = 'linear-gradient(to bottom right, var(--tenant-primary-50, #f0fdf4), var(--tenant-primary-100, #dcfce7))';
                           e.currentTarget.style.borderColor = 'var(--tenant-primary-300, #a7f3d0)';
                         }}
                         onMouseLeave={(e) => {
                           e.currentTarget.style.background = 'linear-gradient(to bottom right, rgb(249, 250, 251), rgb(243, 244, 246))';
                           e.currentTarget.style.borderColor = 'var(--tenant-primary-200, #d1fae5)';
                         }}>
                      <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--tenant-primary-600, #10b981)' }} />
                      <div className="text-xs leading-tight text-gray-700 font-semibold whitespace-nowrap">
                        {firmInfo.trustBadge6}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Services Section */}
        <div className="p-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 pb-3 border-b-4" style={{ borderColor: 'var(--tenant-primary-500, #10b981)' }}>
            Service Breakdown
          </h2>
          
          <div className="space-y-6">
            {quote.services.map((service, index) => (
              <div key={index} className="bg-white border-2 border-gray-200 rounded-xl p-7 hover:shadow-card-hover transition-all duration-300"
                   style={{
                     borderColor: '#e5e7eb',
                   }}
                   onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--tenant-primary-500, #10b981)'}
                   onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
                <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6 pb-4 border-b border-gray-200">
                  <div className="flex-1 mb-4 md:mb-0">
                    <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--tenant-primary-600, #10b981)' }}>{service.name}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{service.description}</p>
                  </div>
                  <div className="text-right">
                    {service.monthlyFee > 0 && (
                      <div className="mb-2">
                        <span className="text-3xl font-bold" style={{ color: 'var(--tenant-primary-600, #10b981)' }}>${service.monthlyFee.toLocaleString()}</span>
                        <span className="text-sm text-gray-500 block mt-1">Monthly fee</span>
                      </div>
                    )}
                    {service.oneTimeFee > 0 && (
                      <div className="mb-2">
                        <span className="text-3xl font-bold" style={{ color: 'var(--tenant-primary-600, #10b981)' }}>${service.oneTimeFee.toLocaleString()}</span>
                        <span className="text-sm text-gray-500 block mt-1">One-time</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
                    {service.name.includes('Individual Tax') && service.pricingFactors ? 'Your Return Includes:' : 'Included:'}
                  </div>
                  <div className="grid gap-3">
                    {service.included.map((item, idx) => (
                      <div key={idx} className="flex items-start space-x-3 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--tenant-primary-500, #10b981)' }} />
                        <span className="leading-relaxed">{item}</span>
                      </div>
                    ))}
                    {service.pricingFactors && service.pricingFactors.map((factor, idx) => (
                      <div key={`factor-${idx}`} className="flex items-start space-x-3 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--tenant-primary-500, #10b981)' }} />
                        <span className="leading-relaxed">{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Guarantee Section */}
        {firmInfo?.promiseCalloutText && (
          <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6 mx-10 my-8">
            <div className="font-bold text-green-800 text-lg mb-2">Our Promise:</div>
            <p className="text-green-700 leading-relaxed">
              {firmInfo.promiseCalloutText}
            </p>
          </div>
        )}

        {/* Testimonials Section */}
        {(firmInfo?.testimonial1Text || firmInfo?.testimonial2Text) && (
          <div className="bg-gray-50 p-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 pb-3 border-b-4" style={{ borderColor: 'var(--tenant-primary-500, #10b981)' }}>
              What Clients Say
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {firmInfo?.testimonial1Text && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="font-bold text-gray-900 mb-2">"{firmInfo.testimonial1Text}"</div>
                  <div className="text-sm text-gray-600">— {firmInfo.testimonial1ClientName}</div>
                </div>
              )}
              {firmInfo?.testimonial2Text && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="font-bold text-gray-900 mb-2">"{firmInfo.testimonial2Text}"</div>
                  <div className="text-sm text-gray-600">— {firmInfo.testimonial2ClientName}</div>
                </div>
              )}
            </div>
          </div>
        )}


        {/* Quote Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-6 text-sm text-gray-600 leading-relaxed">
          <p>
            <span className="font-semibold text-gray-900">Quote Details:</span> This quote is valid until{' '}
            <span className="font-semibold text-gray-900">{calculateLockDate()}</span> ({firmInfo?.quoteLockDays || 14} days).
            All services subject to standard engagement terms and conditions.
            Final pricing may be adjusted based on actual complexity discovered during initial consultation.
          </p>
        </div>

        {/* Actions Bar */}
        <div className="bg-gray-50 border-t border-gray-200 p-6">
          <div className="flex justify-center">
            <button
              onClick={handleRecalculateClick}
              className="inline-flex items-center space-x-2 bg-white border-2 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              style={{
                borderColor: '#e5e7eb',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--tenant-primary-500, #10b981)';
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.backgroundColor = 'white';
              }}>
              <RefreshCw className="w-4 h-4" />
              <span>Recalculate Quote</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sticky CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white bg-opacity-95 backdrop-blur-sm border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 p-4">
          <div className="flex-1 text-center md:text-left">
            <div className="text-xs text-gray-600 mb-1">Today's Total</div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold" style={{ color: 'var(--tenant-primary-600, #10b981)' }}>
                ${quote.totalMonthlyFees.toLocaleString()}
              </span>
              <span className="text-base text-gray-600 font-normal">/mo</span>
              {quote.totalOneTimeFees > 0 && (
                <>
                  <span className="text-lg text-gray-500 font-normal">+</span>
                  <span className="text-2xl font-bold" style={{ color: 'var(--tenant-primary-600, #10b981)' }}>
                    ${quote.totalOneTimeFees.toLocaleString()}
                  </span>
                  <span className="text-base text-gray-600 font-normal">one-time fees</span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={handleSubmitToAirtable}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center space-x-2 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:shadow-lg"
              style={{
                background: isSubmitting
                  ? 'linear-gradient(to right, var(--tenant-primary-400, #34d399), var(--tenant-primary-500, #10b981))'
                  : 'linear-gradient(to right, var(--tenant-primary-600, #10b981), var(--tenant-primary-700, #059669))',
              }}
              onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.background = 'linear-gradient(to right, var(--tenant-primary-700, #059669), var(--tenant-primary-800, #065f46))', e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.background = 'linear-gradient(to right, var(--tenant-primary-600, #10b981), var(--tenant-primary-700, #059669))', e.currentTarget.style.transform = 'scale(1)')}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Accept Quote & Get Started</span>
                </>
              )}
            </button>
            <button
              onClick={handleScheduleConsultation}
              className="inline-flex items-center justify-center space-x-2 bg-white border-2 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              style={{
                borderColor: '#e5e7eb',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--tenant-primary-500, #10b981)';
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.backgroundColor = 'white';
              }}>
              <Calendar className="w-4 h-4" />
              <span>Schedule a Consultation</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recalculate Confirmation Modal */}
      {showRecalculateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--tenant-primary-100, #dcfce7)' }}>
                  <AlertCircle className="w-6 h-6" style={{ color: 'var(--tenant-primary-600, #10b981)' }} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Start Over?</h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-600 leading-relaxed">
                This will clear your current quote and start fresh. Are you sure you want to continue?
              </p>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 rounded-b-2xl flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={handleCancelRecalculate}
                className="px-6 py-3 border-2 border-gray-300 bg-white text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRecalculate}
                className="px-6 py-3 text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg"
                style={{
                  background: 'linear-gradient(to right, var(--tenant-primary-600, #10b981), var(--tenant-primary-700, #059669))',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, var(--tenant-primary-700, #059669), var(--tenant-primary-800, #065f46))';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, var(--tenant-primary-600, #10b981), var(--tenant-primary-700, #059669))';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Yes, Start Over
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Information Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 relative">
              <button
                onClick={() => setShowContactModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--tenant-primary-100, #dcfce7)' }}>
                  <CheckCircle className="w-8 h-8" style={{ color: 'var(--tenant-primary-600, #10b981)' }} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 text-center">Thank You for Your Interest!</h3>
              <p className="text-gray-600 text-center mt-2">
                We'll reach out within 1 business day to schedule your consultation.
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {(firmInfo?.contactEmail || firmInfo?.contactPhone || firmInfo?.website || firmInfo?.officeAddress) ? (
                <div className="bg-gray-50 rounded-xl p-6 border-2" style={{ borderColor: 'var(--tenant-primary-200, #d1fae5)' }}>
                  <h4 className="font-bold text-gray-900 mb-4 text-center">Contact Information</h4>
                  <div className="space-y-3">
                    {firmInfo.contactEmail && (
                      <a
                        href={`mailto:${firmInfo.contactEmail}`}
                        className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--tenant-primary-100, #dcfce7)' }}>
                          <Mail className="w-5 h-5" style={{ color: 'var(--tenant-primary-600, #10b981)' }} />
                        </div>
                        <span className="group-hover:underline break-all">{firmInfo.contactEmail}</span>
                      </a>
                    )}
                    {firmInfo.contactPhone && (
                      <a
                        href={`tel:${firmInfo.contactPhone}`}
                        className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--tenant-primary-100, #dcfce7)' }}>
                          <Phone className="w-5 h-5" style={{ color: 'var(--tenant-primary-600, #10b981)' }} />
                        </div>
                        <span className="group-hover:underline">{firmInfo.contactPhone}</span>
                      </a>
                    )}
                    {firmInfo.website && (
                      <a
                        href={firmInfo.website.startsWith('http') ? firmInfo.website : `https://${firmInfo.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--tenant-primary-100, #dcfce7)' }}>
                          <Globe className="w-5 h-5" style={{ color: 'var(--tenant-primary-600, #10b981)' }} />
                        </div>
                        <span className="group-hover:underline break-all">{firmInfo.website}</span>
                      </a>
                    )}
                    {firmInfo.officeAddress && (
                      <div className="flex items-start gap-3 text-gray-700">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--tenant-primary-100, #dcfce7)' }}>
                          <MapPin className="w-5 h-5" style={{ color: 'var(--tenant-primary-600, #10b981)' }} />
                        </div>
                        <span className="whitespace-pre-line">{firmInfo.officeAddress}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                  <p className="text-gray-700 text-center leading-relaxed">
                    We'll contact you soon at the email you provided in the quote form.
                  </p>
                </div>
              )}

              {quote && (
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Your Quote Reference: <span className="font-bold text-gray-900">{generateQuoteId()}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-center">
              <button
                onClick={() => setShowContactModal(false)}
                className="px-8 py-3 text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg"
                style={{
                  background: 'linear-gradient(to right, var(--tenant-primary-600, #10b981), var(--tenant-primary-700, #059669))',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, var(--tenant-primary-700, #059669), var(--tenant-primary-800, #065f46))';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, var(--tenant-primary-600, #10b981), var(--tenant-primary-700, #059669))';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteResults;