# Contact Info - Airtable Form Fields Template

## Quick Setup: Copy & Paste into Airtable

Use this template to quickly create the core contact-info fields in your Form Fields table.

## Core Fields Setup

### Field 1: Email Address

```
Service ID: contact-info
Field Name: email
Field Type: email
Field Label: Email Address
Placeholder: your@email.com
Field Options: [leave empty]
Required: ✓ (checked)
Active: ✓ (checked)
Display Order: 1
Field Width: full
Section Header: Contact Information
Section Icon: mail
Layout Type: standard
Columns: [leave empty]
Row Group: [leave empty]
Airtable Column Name: Email
Conditional Logic: [leave empty]
Help Text: [leave empty]
```

### Field 2: First Name

```
Service ID: contact-info
Field Name: firstName
Field Type: text
Field Label: First Name
Placeholder: John
Field Options: [leave empty]
Required: ✓ (checked)
Active: ✓ (checked)
Display Order: 2
Field Width: half
Section Header: [leave empty]
Section Icon: user
Layout Type: standard
Columns: [leave empty]
Row Group: 1
Airtable Column Name: First Name
Conditional Logic: [leave empty]
Help Text: [leave empty]
```

### Field 3: Last Name

```
Service ID: contact-info
Field Name: lastName
Field Type: text
Field Label: Last Name
Placeholder: Doe
Field Options: [leave empty]
Required: ✓ (checked)
Active: ✓ (checked)
Display Order: 3
Field Width: half
Section Header: [leave empty]
Section Icon: user
Layout Type: standard
Columns: [leave empty]
Row Group: 1
Airtable Column Name: Last Name
Conditional Logic: [leave empty]
Help Text: [leave empty]
```

### Field 4: Phone Number

```
Service ID: contact-info
Field Name: phone
Field Type: phone
Field Label: Phone Number
Placeholder: (555) 123-4567
Field Options: [leave empty]
Required: ☐ (unchecked)
Active: ✓ (checked)
Display Order: 4
Field Width: half
Section Header: [leave empty]
Section Icon: phone
Layout Type: standard
Columns: [leave empty]
Row Group: 2
Airtable Column Name: Phone
Conditional Logic: [leave empty]
Help Text: [leave empty]
```

### Field 5: Business Name (Conditional)

```
Service ID: contact-info
Field Name: businessName
Field Type: text
Field Label: Business Name
Placeholder: Your Business LLC
Field Options: [leave empty]
Required: ☐ (unchecked)
Active: ✓ (checked)
Display Order: 5
Field Width: half
Section Header: [leave empty]
Section Icon: building
Layout Type: standard
Columns: [leave empty]
Row Group: 2
Airtable Column Name: Business Name
Conditional Logic: {"showIf":{"services":{"operator":"includesAny","value":["business-tax","bookkeeping","advisory"]}}}
Help Text: [leave empty]
```

## CSV Import Format

If your Airtable supports CSV import, use this format:

```csv
Service ID,Field Name,Field Type,Field Label,Placeholder,Required,Active,Display Order,Field Width,Section Header,Section Icon,Row Group,Airtable Column Name,Conditional Logic
contact-info,email,email,Email Address,your@email.com,TRUE,TRUE,1,full,Contact Information,mail,,Email,
contact-info,firstName,text,First Name,John,TRUE,TRUE,2,half,,user,1,First Name,
contact-info,lastName,text,Last Name,Doe,TRUE,TRUE,3,half,,user,1,Last Name,
contact-info,phone,phone,Phone Number,(555) 123-4567,FALSE,TRUE,4,half,,phone,2,Phone,
contact-info,businessName,text,Business Name,Your Business LLC,FALSE,TRUE,5,half,,building,2,Business Name,"{""showIf"":{""services"":{""operator"":""includesAny"",""value"":[""business-tax"",""bookkeeping"",""advisory""]}}}"
```

## Visual Layout Preview

The above configuration will produce this layout:

```
┌─────────────────────────────────────────────────────┐
│  Contact Information                                │
├─────────────────────────────────────────────────────┤
│  📧 Email Address *                                 │
│  ┌───────────────────────────────────────────────┐ │
│  │ your@email.com                                │ │
│  └───────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│  👤 First Name *         👤 Last Name *            │
│  ┌────────────────┐      ┌────────────────┐       │
│  │ John           │      │ Doe            │       │
│  └────────────────┘      └────────────────┘       │
├─────────────────────────────────────────────────────┤
│  📞 Phone Number         🏢 Business Name          │
│  ┌────────────────┐      ┌────────────────┐       │
│  │ (555) 123-4567 │      │ Your Business  │       │
│  └────────────────┘      └────────────────┘       │
│                          (only if business service)│
└─────────────────────────────────────────────────────┘
```

## Field Type Reference

| Field Type | HTML Input | Use Case | Example |
|------------|------------|----------|---------|
| text | `<input type="text">` | Names, addresses | John Doe |
| email | `<input type="email">` | Email addresses | john@example.com |
| phone | `<input type="tel">` | Phone numbers | (555) 123-4567 |
| number | `<input type="number">` | Counts, quantities | 5 |
| dropdown | `<select>` | Single choice | Small, Medium, Large |
| radio | `<input type="radio">` | Single choice (visible) | Option A, Option B |
| multi-select | `<input type="checkbox">` | Multiple choices | Service 1, Service 2 |
| textarea | `<textarea>` | Long text | Comments, notes |
| checkbox | `<input type="checkbox">` | Boolean yes/no | Agree to terms |

## Field Width Options

| Field Width | Behavior | Use Case |
|-------------|----------|----------|
| full | Takes entire row width | Email, dropdown, textarea |
| half | Takes half row width | First name + last name, phone + business |

**Note**: To place two half-width fields side-by-side, assign them the same Row Group number.

## Row Group Behavior

| Row Group | Result |
|-----------|--------|
| 1 | Groups firstName and lastName side-by-side |
| 2 | Groups phone and businessName side-by-side |
| 3 | Groups next two half-width fields side-by-side |
| [empty] | Field appears alone on its own row |

## Conditional Logic Reference

### Show for specific services

```json
{
  "showIf": {
    "services": {
      "operator": "includesAny",
      "value": ["business-tax", "bookkeeping", "advisory"]
    }
  }
}
```

### Show for single service

```json
{
  "showIf": {
    "services": {
      "operator": "includes",
      "value": "business-tax"
    }
  }
}
```

### Show based on another field value

```json
{
  "showIf": {
    "preferredContactMethod": {
      "operator": "equals",
      "value": "Phone"
    }
  }
}
```

## Validation Rules

| Field Type | Automatic Validation |
|------------|---------------------|
| email | Email format (x@y.z) |
| phone | None (accepts any text) |
| text | None |
| number | Numeric values only |
| Required | Not empty |

## Common Icons

| Icon Name | Visual | Use Case |
|-----------|--------|----------|
| mail | ✉️ | Email |
| user | 👤 | Names |
| phone | 📞 | Phone |
| building | 🏢 | Business |
| briefcase | 💼 | Company |
| map-pin | 📍 | Address |
| calendar | 📅 | Date |
| clock | 🕐 | Time |
| globe | 🌐 | Website |
| info | ℹ️ | Information |

## Testing Checklist

After creating fields, test:

- ✓ All 5 core fields appear on contact page
- ✓ Email, first name, last name are required
- ✓ First name and last name appear side-by-side
- ✓ Phone and business name appear side-by-side
- ✓ Business name only shows when business service selected
- ✓ Email validation rejects invalid formats
- ✓ Required field validation prevents form submission
- ✓ Form data writes to Client Quotes table
- ✓ New columns auto-created in Client Quotes table

## Troubleshooting

### Issue: Fields not appearing

**Solution**: Check:
1. Service ID is exactly `contact-info` (case-sensitive)
2. Active is checked
3. Display Order has a value
4. Clear browser cache

### Issue: Fields appearing in wrong order

**Solution**: Update Display Order values (1, 2, 3, 4, 5...)

### Issue: Fields not side-by-side

**Solution**: Check:
1. Both fields have Field Width: half
2. Both fields have same Row Group number
3. Row Group is not empty

### Issue: Business name showing for all services

**Solution**: Check Conditional Logic JSON is valid and matches format above

### Issue: Email validation not working

**Solution**: Verify Field Type is `email` (not `text`)

## Next Steps

After setting up core fields:

1. Test the contact form in the application
2. Verify data writes to Client Quotes table
3. Add custom fields as needed
4. Configure conditional logic for business-specific fields
5. Customize section headers and icons
6. Add help text for complex fields

## Support

For questions or issues:
1. Refer to DYNAMIC_CONTACT_FORM_SETUP.md for detailed guide
2. Check browser console for errors
3. Verify Airtable API credentials are correct
4. Test with USE_DYNAMIC_CONTACT_FORM feature flag
