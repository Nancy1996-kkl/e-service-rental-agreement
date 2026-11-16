// Templates-la use panna allowed placeholders list.
// Word template-la {{owner_name}} maadhiri type pannaa, andha idathula client details varum.
// (Frontend-la values fill pannra logic: client/src/utils/placeholders.js)

export const PLACEHOLDERS = [
  { key: 'agreement_date', label: 'Agreement date (today)' },
  { key: 'owner_name', label: 'Owner name' },
  { key: 'owner_relation', label: "Owner father's / husband's name" },
  { key: 'owner_address', label: 'Owner address' },
  { key: 'owner_mobile', label: 'Owner mobile' },
  { key: 'owner_email', label: 'Owner email' },
  { key: 'owner_aadhaar', label: 'Owner Aadhaar (masked: XXXX XXXX 1234)' },
  { key: 'tenant_name', label: 'Tenant name' },
  { key: 'tenant_relation', label: "Tenant father's / husband's name" },
  { key: 'tenant_address', label: 'Tenant address' },
  { key: 'tenant_mobile', label: 'Tenant mobile' },
  { key: 'tenant_email', label: 'Tenant email' },
  { key: 'tenant_aadhaar', label: 'Tenant Aadhaar (masked)' },
  { key: 'property_address', label: 'Property address' },
  { key: 'property_type', label: 'Property type' },
  { key: 'property_description', label: 'Property details' },
  { key: 'monthly_rent', label: 'Monthly rent (₹15,000)' },
  { key: 'monthly_rent_words', label: 'Monthly rent in words' },
  { key: 'security_deposit', label: 'Security deposit (₹50,000)' },
  { key: 'security_deposit_words', label: 'Security deposit in words' },
  { key: 'agreement_start_date', label: 'Start date' },
  { key: 'agreement_end_date', label: 'End date' },
  { key: 'agreement_duration', label: 'Duration (11 months)' },
  { key: 'terms_and_conditions', label: 'Terms & conditions (from the Terms step)' },
];

export const PLACEHOLDER_KEYS = new Set(PLACEHOLDERS.map((p) => p.key));
