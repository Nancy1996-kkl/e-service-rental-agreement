// ===== SHARED — frontend (client) & backend (server) rendum indha file-ah use pannum =====
// Dropdown options. Inga maathinaa rendu pakkamum maarum.

export const PROPERTY_TYPES = [
  { value: 'house', label: 'Independent House' },
  { value: 'apartment', label: 'Apartment / Flat' },
  { value: 'shop', label: 'Shop' },
  { value: 'office', label: 'Office' },
  { value: 'warehouse', label: 'Warehouse / Godown' },
  { value: 'other', label: 'Other' },
];

export const DURATION_OPTIONS = [
  { value: '11', label: '11 Months' },
  { value: '12', label: '12 Months' },
  { value: '24', label: '24 Months' },
  { value: '36', label: '36 Months' },
];

// Electricity / Water / Maintenance — yaar pay pannanum
export const PAYER_OPTIONS = [
  { value: 'tenant', label: 'Tenant' },
  { value: 'owner', label: 'Owner' },
  { value: 'shared', label: 'Shared equally' },
  { value: 'na', label: 'Not applicable' },
];

export const PROPERTY_USE_OPTIONS = [
  { value: 'residential', label: 'Residential use only' },
  { value: 'commercial', label: 'Commercial / business use only' },
  { value: 'both', label: 'Residential and commercial use' },
];

export const labelOf = (options, value) => options.find((o) => o.value === value)?.label || '';
