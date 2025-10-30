# Scripts Directory

This directory contains utility scripts for managing the Ledgerly Quote Calculator.

## Available Scripts

### standardize-display-order.js

**Purpose:** Updates all Display Order values in the Form Fields table to use increments of 10 instead of 1.

**Why this matters:**
- Makes it easier to insert new fields without renumbering
- Cleaner, more maintainable field ordering
- Standard practice in form builders

**Requirements:**
- Node.js installed
- airtable npm package installed (`npm install`)
- Environment variables configured in `.env` file

**Usage:**

```bash
# Dry-run mode (preview changes without applying)
node scripts/standardize-display-order.js

# Apply mode (actually update Airtable)
node scripts/standardize-display-order.js --apply
```

**What it does:**

1. Loads environment variables from `.env` file
2. Connects to Airtable using your credentials
3. Fetches all Form Fields records
4. Groups fields by Service ID
5. Sorts fields by current Display Order (with record ID as tiebreaker)
6. Calculates new Display Order values: 10, 20, 30, 40, etc.
7. Displays a detailed preview of all changes
8. In apply mode: prompts for confirmation before updating
9. Updates records in batches of 10 (with rate limiting)
10. Displays final results

**Example output:**

```
╔════════════════════════════════════════════════════════════════╗
║  Airtable Display Order Standardization Script                ║
╚════════════════════════════════════════════════════════════════╝

🔍 Running in DRY-RUN mode (no changes will be applied)

📥 Fetching Form Fields records from Airtable...
✓ Found 45 total records

📋 Services found: individual-tax, business-tax, bookkeeping
   Total services: 3

──────────────────────────────────────────────────────────────────
📦 Processing service: individual-tax
   Total records: 20
   ⚡ 20 fields need updating

📊 CHANGES SUMMARY:

Total records to update: 45

Service              | Field Name                          | Old →  New | Active
────────────────────────────────────────────────────────────────────────────────
individual-tax       | filingStatus                        |   1 →   10 | ✓
individual-tax       | annualIncome                        |   2 →   20 | ✓
individual-tax       | incomeTypes                         |   3 →   30 | ✓
...

✅ DRY RUN COMPLETE - No changes applied
   Review the changes above.
   Run with --apply flag to apply changes:

   node scripts/standardize-display-order.js --apply
```

**Safety features:**

- **Dry-run mode by default**: Must explicitly use `--apply` to make changes
- **Confirmation prompt**: Asks for "yes" confirmation before updating
- **Batch processing**: Updates 10 records at a time
- **Rate limiting**: Waits 350ms between batches (respects Airtable limits)
- **Error handling**: Stops on first error to prevent data corruption
- **Detailed logging**: Shows exactly what will change

**When to run:**

- After initial Airtable base setup
- When manually adding many new fields
- Before cloning a base for a new tenant
- After importing fields from CSV
- Periodically to maintain clean numbering

**Troubleshooting:**

If you see "You are not authorized to perform this operation":
- Check that `VITE_AIRTABLE_SERVICES_API_KEY` is correct in `.env`
- Verify the API key has access to the base
- Confirm `VITE_AIRTABLE_SERVICES_BASE_ID` matches your Airtable base

If records aren't updating:
- Check the Form Fields table exists
- Verify field names match (case-sensitive)
- Ensure records have Service ID values
- Review console output for specific errors

**Post-execution:**

After running successfully:
1. Test your forms to verify fields render in correct order
2. Check that conditional logic still works correctly
3. Verify all services display fields properly
4. Test form submissions to ensure no data issues

## Contributing New Scripts

When adding new utility scripts:

1. Use ES module syntax (`import`/`export`)
2. Add executable permissions: `chmod +x scripts/your-script.js`
3. Include detailed comments and documentation
4. Add dry-run mode for destructive operations
5. Implement proper error handling
6. Add rate limiting for API calls
7. Update this README with usage instructions
