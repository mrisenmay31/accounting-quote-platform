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
      className="rounded-xl p-6 mt-6"
      style={{
        backgroundColor: 'rgba(92, 225, 165, 0.1)',
        border: '1px solid var(--secondary-color, #10b981)',
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div
          className="rounded-full p-3 flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: 'var(--secondary-color, #10b981)',
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

      <ul className="space-y-3 ml-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <span
              className="text-lg font-bold mt-1 flex-shrink-0"
              style={{ color: 'var(--secondary-color, #10b981)' }}
            >
              •
            </span>
            <span
              className="flex-1"
              style={{ color: 'var(--primary-color, #1e3a5f)' }}
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
