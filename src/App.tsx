import React from 'react';
import QuoteCalculator from './components/QuoteCalculator';
import { TenantProvider, useTenant } from './contexts/TenantContext';
import { Loader2, AlertCircle } from 'lucide-react';

// Detect if we're in local development
const isLocalDevelopment = () => {
  const hostname = window.location.hostname;
  return hostname === 'localhost' ||
         hostname.includes('bolt.new') ||
         hostname.includes('webcontainer') ||
         hostname.includes('127.0.0.1') ||
         hostname.includes('stackblitz.io');
};

const AppContent: React.FC = () => {
  const { tenant, isLoading, error } = useTenant();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading calculator...</p>
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-100 p-8">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Configuration Error</h1>
          <p className="text-gray-600 text-center mb-6">
            {error || 'Unable to load calculator configuration'}
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <p className="font-semibold mb-2">Possible solutions:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Check your URL and try again</li>
              <li>Contact support if the problem persists</li>
              <li>Verify your tenant configuration</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <QuoteCalculator />
    </div>
  );
};

function App() {
  const isLocalDev = isLocalDevelopment();

  if (isLocalDev) {
    // LOCAL DEVELOPMENT: Skip tenant system
    console.log('🔧 Local dev mode - bypassing tenant system');
    console.log('Using environment variables directly from .env file');
    return (
      <div className="min-h-screen bg-gray-50">
        <QuoteCalculator />
      </div>
    );
  }

  // PRODUCTION: Use tenant system
  console.log('📡 Production mode - using tenant system');
  return (
    <TenantProvider>
      <AppContent />
    </TenantProvider>
  );
}

export default App;