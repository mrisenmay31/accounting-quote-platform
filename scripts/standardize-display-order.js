#!/usr/bin/env node

/**
 * Airtable Display Order Standardization Script
 *
 * Purpose: Updates all Display Order values in the Form Fields table to use
 * increments of 10 instead of 1, making it easier to insert new fields in
 * the future without renumbering.
 *
 * Usage:
 *   Dry-run (preview changes):  node scripts/standardize-display-order.js
 *   Apply changes:              node scripts/standardize-display-order.js --apply
 *
 * Requirements:
 *   - Node.js installed
 *   - airtable npm package installed
 *   - Environment variables set in .env file
 */

import Airtable from 'airtable';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');

  if (!fs.existsSync(envPath)) {
    console.error('❌ Error: .env file not found');
    console.error('   Expected location:', envPath);
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');

  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    }
  });
}

// Configuration
loadEnvFile();

const AIRTABLE_API_KEY = process.env.VITE_AIRTABLE_SERVICES_API_KEY;
const AIRTABLE_BASE_ID = process.env.VITE_AIRTABLE_SERVICES_BASE_ID;
const TABLE_NAME = 'Form Fields';

// Validate configuration
if (!AIRTABLE_API_KEY) {
  console.error('❌ Error: VITE_AIRTABLE_SERVICES_API_KEY not found in .env file');
  process.exit(1);
}

if (!AIRTABLE_BASE_ID) {
  console.error('❌ Error: VITE_AIRTABLE_SERVICES_BASE_ID not found in .env file');
  process.exit(1);
}

// Initialize Airtable
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

/**
 * Sleep function for rate limiting
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function to standardize display order
 */
async function standardizeDisplayOrder(dryRun = true) {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  Airtable Display Order Standardization Script                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  if (dryRun) {
    console.log('🔍 Running in DRY-RUN mode (no changes will be applied)\n');
  } else {
    console.log('⚡ Running in APPLY mode (changes will be applied)\n');
  }

  try {
    // 1. Fetch all records
    console.log('📥 Fetching Form Fields records from Airtable...');

    const records = await base(TABLE_NAME).select({
      fields: ['Service ID', 'Field Name', 'Display Order', 'Active']
    }).all();

    console.log(`✓ Found ${records.length} total records\n`);

    if (records.length === 0) {
      console.log('⚠️  No records found. Exiting.');
      return;
    }

    // 2. Group by Service ID
    const serviceGroups = {};
    records.forEach(record => {
      const serviceId = record.fields['Service ID'];
      if (!serviceId) {
        console.warn(`⚠️  Warning: Record ${record.id} has no Service ID, skipping`);
        return;
      }

      if (!serviceGroups[serviceId]) {
        serviceGroups[serviceId] = [];
      }
      serviceGroups[serviceId].push(record);
    });

    const serviceNames = Object.keys(serviceGroups).sort();
    console.log(`📋 Services found: ${serviceNames.join(', ')}`);
    console.log(`   Total services: ${serviceNames.length}\n`);

    // 3. Process each service
    const updates = [];
    const changelog = [];

    for (const serviceId of serviceNames) {
      const serviceRecords = serviceGroups[serviceId];

      console.log(`\n${'─'.repeat(70)}`);
      console.log(`📦 Processing service: ${serviceId}`);
      console.log(`   Total records: ${serviceRecords.length}`);

      // Sort by current Display Order, then by creation date as tiebreaker
      const sorted = serviceRecords.sort((a, b) => {
        const orderA = a.fields['Display Order'] || 999999;
        const orderB = b.fields['Display Order'] || 999999;

        if (orderA !== orderB) {
          return orderA - orderB;
        }

        // Tiebreaker: use record ID (earlier IDs created first)
        return a.id.localeCompare(b.id);
      });

      // Generate new Display Order values
      let hasChanges = false;
      sorted.forEach((record, index) => {
        const oldOrder = record.fields['Display Order'];
        const newOrder = (index + 1) * 10;
        const fieldName = record.fields['Field Name'] || '(unnamed)';
        const isActive = record.fields['Active'] !== false;

        if (oldOrder !== newOrder) {
          hasChanges = true;
          updates.push({
            id: record.id,
            serviceId: serviceId,
            fieldName: fieldName,
            oldOrder: oldOrder,
            newOrder: newOrder,
            isActive: isActive
          });

          changelog.push({
            service: serviceId,
            field: fieldName,
            change: `${oldOrder} → ${newOrder}`
          });
        }
      });

      if (!hasChanges) {
        console.log('   ✓ No changes needed (already standardized)');
      } else {
        console.log(`   ⚡ ${updates.filter(u => u.serviceId === serviceId).length} fields need updating`);
      }
    }

    console.log(`\n${'═'.repeat(70)}\n`);

    // 4. Display changes summary
    if (updates.length === 0) {
      console.log('✅ All Display Order values are already standardized!');
      console.log('   No changes needed.\n');
      return;
    }

    console.log('📊 CHANGES SUMMARY:\n');
    console.log(`Total records to update: ${updates.length}\n`);
    console.log(`${'Service'.padEnd(20)} | ${'Field Name'.padEnd(35)} | ${'Old'.padStart(4)} → ${'New'.padStart(4)} | Active`);
    console.log('─'.repeat(80));

    updates.forEach(update => {
      const serviceTrunc = update.serviceId.length > 18
        ? update.serviceId.substring(0, 18) + '..'
        : update.serviceId;
      const fieldTrunc = update.fieldName.length > 33
        ? update.fieldName.substring(0, 33) + '..'
        : update.fieldName;
      const activeStatus = update.isActive ? '✓' : '✗';

      console.log(
        `${serviceTrunc.padEnd(20)} | ` +
        `${fieldTrunc.padEnd(35)} | ` +
        `${String(update.oldOrder || 'none').padStart(4)} → ` +
        `${String(update.newOrder).padStart(4)} | ` +
        `${activeStatus}`
      );
    });

    console.log('\n');

    // 5. Dry-run exit
    if (dryRun) {
      console.log('✅ DRY RUN COMPLETE - No changes applied');
      console.log('   Review the changes above.');
      console.log('   Run with --apply flag to apply changes:\n');
      console.log('   node scripts/standardize-display-order.js --apply\n');
      return;
    }

    // 6. Confirmation prompt
    console.log('⚠️  WARNING: You are about to modify Airtable records!');
    console.log(`   ${updates.length} records will be updated.\n`);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question('Type "yes" to apply these changes: ', resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'yes') {
      console.log('\n❌ Operation cancelled by user');
      console.log('   No changes were applied.\n');
      return;
    }

    // 7. Apply updates in batches
    console.log('\n🚀 Applying updates to Airtable...\n');

    const batchSize = 10;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(updates.length / batchSize);

      console.log(`   Processing batch ${batchNumber}/${totalBatches} (records ${i + 1}-${Math.min(i + batchSize, updates.length)})...`);

      try {
        const updateRecords = batch.map(update => ({
          id: update.id,
          fields: {
            'Display Order': update.newOrder
          }
        }));

        await base(TABLE_NAME).update(updateRecords);
        successCount += batch.length;
        console.log(`   ✓ Batch ${batchNumber} completed successfully`);

      } catch (error) {
        errorCount += batch.length;
        console.error(`   ✗ Batch ${batchNumber} failed:`, error.message);
        console.error('   Stopping execution to prevent further errors.');
        break;
      }

      // Rate limiting: 3 requests per second max (Airtable limit is 5/sec)
      if (i + batchSize < updates.length) {
        await sleep(350);
      }
    }

    // 8. Final summary
    console.log('\n' + '═'.repeat(70));
    console.log('\n📈 FINAL RESULTS:\n');
    console.log(`   ✓ Successfully updated: ${successCount} records`);
    if (errorCount > 0) {
      console.log(`   ✗ Failed to update: ${errorCount} records`);
    }
    console.log(`   Total processed: ${successCount + errorCount} of ${updates.length}\n`);

    if (successCount === updates.length) {
      console.log('🎉 ALL UPDATES COMPLETED SUCCESSFULLY!\n');
      console.log('Next steps:');
      console.log('  1. Test your forms to verify fields render in correct order');
      console.log('  2. Check that conditional logic still works');
      console.log('  3. Verify all services display fields correctly\n');
    } else {
      console.log('⚠️  Some updates failed. Please review the errors above.\n');
    }

  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run script
const args = process.argv.slice(2);
const dryRun = !args.includes('--apply');

standardizeDisplayOrder(dryRun)
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
