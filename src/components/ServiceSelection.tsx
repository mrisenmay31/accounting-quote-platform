import React from 'react';
import * as LucideIcons from 'lucide-react';
import { FormData, ServiceConfig } from '../types/quote';

interface ServiceSelectionProps {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  services: ServiceConfig[];
  isLoading?: boolean;
}

const ServiceSelection: React.FC<ServiceSelectionProps> = ({
  formData,
  updateFormData,
  services,
  isLoading = false
}) => {
  // Get icon component from icon name
  const getIconComponent = (iconName: string) => {
    const Icon = LucideIcons[iconName as keyof typeof LucideIcons] as React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    return Icon || LucideIcons.FileText;
  };

  const toggleService = (serviceId: string) => {
    const currentServices = formData.services || [];
    const isSelected = currentServices.includes(serviceId);

    const newServices = isSelected
      ? currentServices.filter(id => id !== serviceId)
      : [...currentServices, serviceId];

    updateFormData({ services: newServices });
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
          <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full" style={{ borderColor: 'var(--primary-color, #10b981)', borderTopColor: 'transparent' }} />
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
          const Icon = getIconComponent(service.iconName);

          return (
            <div
              key={service.serviceId}
              onClick={() => toggleService(service.serviceId)}
              className="relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 transform hover:scale-105"
              style={{
                borderColor: isSelected ? 'var(--primary-color, #10b981)' : '#e5e7eb',
                backgroundColor: isSelected ? 'var(--tenant-primary-50, #f0fdf4)' : 'white',
                boxShadow: isSelected ? '0 0 0 3px var(--tenant-primary-100, #dcfce7)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'var(--tenant-primary-300, #a7f3d0)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }
              }}
            >
              {service.featured && (
                <div className="absolute -top-3 left-6">
                  <div className="text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1" style={{ backgroundColor: 'var(--secondary-color, #f97316)' }}>
                    <LucideIcons.Star className="w-3 h-3" />
                    <span>RECOMMENDED</span>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-4">
                <Icon className="w-12 h-12 flex-shrink-0" style={{ color: 'var(--primary-color, #10b981)' }} />

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
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--primary-color, #10b981)' }} />
                        <span className="text-sm text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {isSelected && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary-color, #10b981)' }}>
                      <LucideIcons.ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {formData.services.length > 0 && (
        <div className="rounded-lg p-6" style={{
          background: 'linear-gradient(to right, var(--tenant-primary-50, #f0fdf4), var(--tenant-secondary-50, #fff7ed))',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'var(--tenant-primary-200, #d1fae5)',
        }}>
          <h3 className="font-semibold mb-3" style={{ color: 'var(--tenant-primary-800, #065f46)' }}>Selected Services:</h3>
          <div className="flex flex-wrap gap-2">
            {formData.services.map((serviceId) => {
              const service = services.find(s => s.serviceId === serviceId);
              return (
                <span
                  key={serviceId}
                  className="text-white px-3 py-1 rounded-full text-sm font-medium"
                  style={{ backgroundColor: 'var(--primary-color, #10b981)' }}
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