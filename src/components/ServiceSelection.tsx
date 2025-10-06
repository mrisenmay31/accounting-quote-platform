import React from 'react';
import { TrendingUp, FileText, Calculator, BookOpen, Star, ArrowRight, Divide as LucideIcon } from 'lucide-react';
import { FormData, ServiceConfig } from '../types/quote';

interface ServiceSelectionProps {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  services: ServiceConfig[];
  isLoading?: boolean;
}

// Icon mapping for Airtable icon names to Lucide React components
const iconMap: Record<string, LucideIcon> = {
  TrendingUp,
  FileText,
  Calculator,
  BookOpen,
  Star
};

const ServiceSelection: React.FC<ServiceSelectionProps> = ({ 
  formData, 
  updateFormData, 
  services, 
  isLoading = false 
}) => {
  // Get icon component from icon name
  const getIconComponent = (iconName: string): LucideIcon => {
    return iconMap[iconName] || FileText; // Default to FileText if icon not found
  };

  const toggleService = (serviceId: string) => {
    const currentServices = formData.services || [];
    const isSelected = currentServices.includes(serviceId);
    
    const newServices = isSelected
      ? currentServices.filter(id => id !== serviceId)
      : [...currentServices, serviceId];
    
    updateFormData({ services: newServices });
  };

  const getColorClasses = (color: string, isSelected: boolean, isFeatured: boolean = false) => {
    const colors = {
      emerald: {
        border: isSelected ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-emerald-200 hover:border-emerald-300',
        bg: isSelected ? 'bg-emerald-50' : 'bg-white hover:bg-emerald-25',
        icon: 'text-emerald-600',
        badge: 'bg-emerald-600 text-white'
      },
      blue: {
        border: isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300',
        bg: isSelected ? 'bg-blue-50' : 'bg-white hover:bg-blue-25',
        icon: 'text-blue-600',
        badge: 'bg-blue-600 text-white'
      },
      purple: {
        border: isSelected ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200 hover:border-purple-300',
        bg: isSelected ? 'bg-purple-50' : 'bg-white hover:bg-purple-25',
        icon: 'text-purple-600',
        badge: 'bg-purple-600 text-white'
      },
      orange: {
        border: isSelected ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-200 hover:border-orange-300',
        bg: isSelected ? 'bg-orange-50' : 'bg-white hover:bg-orange-25',
        icon: 'text-orange-600',
        badge: 'bg-orange-600 text-white'
      },
      gray: {
        border: isSelected ? 'border-gray-500 ring-2 ring-gray-200' : 'border-gray-200 hover:border-gray-300',
        bg: isSelected ? 'bg-gray-50' : 'bg-white hover:bg-gray-25',
        icon: 'text-gray-600',
        badge: 'bg-gray-600 text-white'
      }
    };
    
    return colors[color as keyof typeof colors];
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Which Services Do You Need?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Loading available services...
          </p>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  // Ensure services is an array to prevent runtime errors
  if (!Array.isArray(services) || services.length === 0) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Which Services Do You Need?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            No services are currently available. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Which Services Do You Need?
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Select all the services you're interested in. We'll customize your quote based on your specific needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((service) => {
          const isSelected = formData.services.includes(service.serviceId);
          const colorClasses = getColorClasses(service.color, isSelected, service.featured);
          const Icon = getIconComponent(service.iconName);

          return (
            <div
              key={service.serviceId}
              onClick={() => toggleService(service.serviceId)}
              className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 transform hover:scale-105 ${colorClasses.border} ${colorClasses.bg}`}
            >
              {service.featured && (
                <div className="absolute -top-3 left-6">
                  <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                    <Star className="w-3 h-3" />
                    <span>RECOMMENDED</span>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-4">
                <Icon className="w-12 h-12 text-orange-500 flex-shrink-0" />
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {service.description}
                  </p>
                  
                  <div className="space-y-2">
                    {service.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        <span className="text-sm text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {isSelected && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {formData.services.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-orange-50 border border-emerald-200 rounded-lg p-6">
          <h3 className="font-semibold text-emerald-800 mb-3">Selected Services:</h3>
          <div className="flex flex-wrap gap-2">
            {formData.services.map((serviceId) => {
              const service = services.find(s => s.serviceId === serviceId);
              return (
                <span
                  key={serviceId}
                  className="bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-medium"
                >
                  {service?.title}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceSelection;