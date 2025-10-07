import React from 'react';
import { CheckCircle } from 'lucide-react';

interface IncludedFeaturesCardProps {
  title: string;
  features: string[];
}

const IncludedFeaturesCard: React.FC<IncludedFeaturesCardProps> = ({ title, features }) => {
  if (!title || !features || features.length === 0) {
    return null;
  }

  return (
    <div
      className="rounded-xl border mt-8"
      style={{
        backgroundColor: 'rgba(92, 225, 165, 0.1)',
        borderColor: 'var(--secondary-color, #10b981)',
        padding: '1.5rem',
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: 'var(--secondary-color, #10b981)',
            borderRadius: '50%',
            width: '48px',
            height: '48px',
          }}
        >
          <CheckCircle className="w-6 h-6 text-white" />
        </div>
        <h3
          className="text-xl font-semibold"
          style={{ color: 'var(--primary-color, #1e3a5f)' }}
        >
          {title}
        </h3>
      </div>

      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <span
              className="text-base font-semibold flex-shrink-0"
              style={{
                color: 'var(--secondary-color, #10b981)',
                lineHeight: '1.5rem',
                marginTop: '0.125rem',
              }}
            >
              •
            </span>
            <span
              className="flex-1"
              style={{
                color: 'var(--primary-color, #1e3a5f)',
                lineHeight: '1.5rem',
              }}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default IncludedFeaturesCard;
