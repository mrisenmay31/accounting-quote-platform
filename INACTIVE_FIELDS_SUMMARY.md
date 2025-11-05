# Inactive Airtable Fields - Quick Reference

## Overview

This document tracks Airtable fields that exist in the schema but are NOT currently implemented in the application.

## Inactive Fields

### 1. Validation Rules (Form Fields Table)

**Status:** ⚠️ INACTIVE - Planned for Phase 3

**Location:** Form Fields table

**Impact:** HIGH - Users may configure this field expecting it to work

**Action Required:**
- Rename to "Validation Rules (INACTIVE - Phase 3)", OR
- Hide from Airtable views, OR
- Add field description warning

**Why It Exists:**
- Pre-planned for future Phase 3 development
- Allows data structure preparation without code changes later

**Current Workarounds:**
- Use "Required" checkbox for required fields
- Use "Field Type" for type validation
- Use "Field Options" for dropdown validation
- Use "Field Options" JSON for number min/max constraints

**Full Documentation:** `VALIDATION_RULES_STATUS.md`

**User Instructions:** `AIRTABLE_ACTION_ITEMS.md`

## How to Check for Inactive Fields

### In Code
1. Check TypeScript interface (e.g., `FormField` in `src/types/quote.ts`)
2. Verify Airtable fetch includes the field (e.g., `formFieldsService.ts`)
3. Search for field usage in components

### In Airtable
1. Fields that exist in table but not in TypeScript = likely inactive
2. Fields not fetched by API calls = definitely inactive
3. Fields marked as "Phase X" in docs = future feature

## Prevention Strategy

Before adding new Airtable fields:
1. ✅ Add to TypeScript interface
2. ✅ Add to API fetch call
3. ✅ Implement processing logic
4. ✅ Add to documentation
5. ✅ Test end-to-end

OR

1. ❌ Don't add the field yet
2. ✅ Document in "Planned Features" section
3. ✅ Wait until ready to implement

## Red Flags

Watch for these signs of inactive fields:
- Field exists in Airtable but not in code
- Field is fetched but never used
- Field documentation says "Phase X" or "Future"
- Field has no processing logic
- Users report "X doesn't work"

## Maintenance

**Review Schedule:** Before each major release

**Owner:** Development team

**Last Reviewed:** 2025-10-30

---

## Related Documentation

- `VALIDATION_RULES_STATUS.md` - Detailed validation rules analysis
- `AIRTABLE_ACTION_ITEMS.md` - User action items
- `DYNAMIC_FORMS_GUIDE.md` - Form fields guide with phase roadmap
- `ENHANCED_DYNAMIC_FORMS_GUIDE.md` - Enhanced features guide
