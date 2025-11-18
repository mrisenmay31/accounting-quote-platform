/**
 * Admin Schema Sync Component
 * Provides manual trigger for synchronizing Form Fields to Client Quotes table
 * Displays sync results and detailed feedback
 */

import React, { useState } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Database } from 'lucide-react';
import { useTenant } from '../contexts/TenantContext';
import { getCachedFormFields } from '../utils/formFieldsService';
import { syncFormFieldsToClientQuotes, SchemaSyncResult } from '../utils/airtableSchemaService';

const AdminSchemaSync: React.FC = () => {
  const { tenant } = useTenant();
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SchemaSyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    if (!tenant) {
      setError('Tenant configuration not loaded');
      return;
    }

    setSyncing(true);
    setResult(null);
    setError(null);

    try {
      console.log('[AdminSchemaSync] Starting manual schema sync...');

      const airtableConfig = {
        baseId: tenant.airtable.servicesBaseId || tenant.airtable.pricingBaseId,
        apiKey: tenant.airtable.servicesApiKey || tenant.airtable.pricingApiKey,
      };

      // Fetch all form fields for all services
      const services = ['individual-tax', 'business-tax', 'bookkeeping', 'additional-services'];
      const allFields = [];

      for (const serviceId of services) {
        try {
          const fields = await getCachedFormFields(airtableConfig, serviceId);
          allFields.push(...fields);
          console.log(`[AdminSchemaSync] Loaded ${fields.length} fields for ${serviceId}`);
        } catch (err) {
          console.warn(`[AdminSchemaSync] Could not load fields for ${serviceId}:`, err);
        }
      }

      if (allFields.length === 0) {
        setError('No form fields found to sync');
        setSyncing(false);
        return;
      }

      console.log(`[AdminSchemaSync] Total fields to sync: ${allFields.length}`);

      // Run schema sync
      const syncResult = await syncFormFieldsToClientQuotes(tenant, allFields);

      setResult(syncResult);
      console.log('[AdminSchemaSync] Sync completed:', syncResult);

    } catch (err) {
      console.error('[AdminSchemaSync] Sync failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-6">
          <Database className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Schema Synchronization</h2>
        </div>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">What does this do?</h3>
          <p className="text-sm text-blue-800 mb-2">
            This tool automatically creates columns in your Client Quotes Airtable table based on the fields
            defined in your Form Fields table. This ensures your database schema always matches your form configuration.
          </p>
          <ul className="list-disc list-inside text-sm text-blue-800 space-y-1 ml-2">
            <li>Checks all active form fields across all services</li>
            <li>Creates missing columns in Client Quotes table</li>
            <li>Preserves existing columns (safe to run multiple times)</li>
            <li>Supports all field types (text, number, dropdown, multi-select, etc.)</li>
          </ul>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Requirements</h3>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-2">
            <li>Airtable API key must have <code className="bg-gray-100 px-1 py-0.5 rounded">schema.bases:write</code> permission</li>
            <li>Form Fields table must be configured with active fields</li>
            <li>Client Quotes table must exist in your Airtable base</li>
          </ul>
        </div>

        <button
          onClick={handleSync}
          disabled={syncing || !tenant}
          className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Syncing Schema...' : 'Sync Schema Now'}</span>
        </button>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Sync Failed</h3>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Sync Results</span>
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-gray-900">{result.fieldsChecked}</div>
                  <div className="text-xs text-gray-600">Checked</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-green-600">{result.fieldsCreated}</div>
                  <div className="text-xs text-gray-600">Created</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-blue-600">{result.fieldsAlreadyExist}</div>
                  <div className="text-xs text-gray-600">Already Exist</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-red-600">{result.errors.length}</div>
                  <div className="text-xs text-gray-600">Errors</div>
                </div>
              </div>

              {result.skippedFields.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">
                        {result.skippedFields.length} inactive fields skipped
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {result.createdFields.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Created Fields ({result.createdFields.length})
                  </h4>
                  <div className="bg-white border border-gray-200 rounded p-3 max-h-48 overflow-y-auto">
                    <ul className="space-y-1">
                      {result.createdFields.map((field, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span>{field}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {result.errors.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-red-900 mb-2">
                    Errors ({result.errors.length})
                  </h4>
                  <div className="bg-red-50 border border-red-200 rounded p-3 max-h-48 overflow-y-auto">
                    <ul className="space-y-2">
                      {result.errors.map((err, index) => (
                        <li key={index} className="text-sm text-red-800 flex items-start space-x-2">
                          <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <span>{err}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {result.fieldsCreated > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900 mb-1">Success!</h3>
                    <p className="text-sm text-green-800">
                      {result.fieldsCreated} new {result.fieldsCreated === 1 ? 'field' : 'fields'} added to your Client Quotes table.
                      Your form submissions will now include data for these fields.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {result.fieldsCreated === 0 && result.errors.length === 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">All Up to Date</h3>
                    <p className="text-sm text-blue-800">
                      Your Client Quotes table schema is already in sync with your Form Fields configuration.
                      No changes were needed.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">Troubleshooting</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              <strong>Permission Error:</strong> Ensure your Airtable API key has the <code className="bg-gray-100 px-1 py-0.5 rounded">schema.bases:write</code> scope.
              Generate a new Personal Access Token in your Airtable account settings.
            </p>
            <p>
              <strong>Table Not Found:</strong> Verify that a table named "Client Quotes" exists in your Airtable base.
            </p>
            <p>
              <strong>No Fields Created:</strong> Check that your Form Fields table has active fields with the correct Service ID.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSchemaSync;
