// ===== SHARED — Template-la irukka {{owner_name}} maadhiri placeholders-ah real details-aala replace =====
// Preview (client) & PDF/Word download (server) rendum IDHE code use pannum → rendum exact-ah same-ah varum.
// Allowed placeholders list: server/src/config/placeholders.js

import { calcEndDate, formatDate, formatRupees, todayIso } from './dateUtils.js';
import { PROPERTY_TYPES, labelOf } from './options.js';
import { renderTermsHtml } from './terms.js';

// ===== Number → Indian words (15000 → "Rupees Fifteen Thousand Only") =====
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
  'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const twoDigits = (n) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`);
const threeDigits = (n) =>
  [Math.floor(n / 100) ? `${ONES[Math.floor(n / 100)]} Hundred` : '', n % 100 ? twoDigits(n % 100) : '']
    .filter(Boolean)
    .join(' ');

export function numberToIndianWords(value) {
  let n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 0) return '';
  if (n === 0) return 'Rupees Zero Only';

  const parts = [];
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;

  if (crore) parts.push(`${crore >= 100 ? threeDigits(crore) : twoDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (n) parts.push(threeDigits(n));
  return `Rupees ${parts.join(' ')} Only`;
}

export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

const maskAadhaar = (last4) => (last4 ? `XXXX XXXX ${last4}` : '');
const hasValue = (v) => v !== '' && v != null;

/**
 * Agreement data → { owner_name: 'Ravi', monthly_rent: '₹15,000', ... }
 * data = { owner, tenant, property, terms, templateId }
 */
export function buildPlaceholderValues({ owner = {}, tenant = {}, property = {}, terms, templateId } = {}, { date, standardClauses = [] } = {}) {
  const party = (p, prefix) => ({
    [`${prefix}_name`]: p.fullName,
    [`${prefix}_relation`]: p.relationName,
    [`${prefix}_address`]: p.address,
    [`${prefix}_mobile`]: p.mobile,
    [`${prefix}_email`]: p.email,
    [`${prefix}_aadhaar`]: maskAadhaar(p.aadhaarLast4),
  });

  const values = {
    agreement_date: formatDate(date || todayIso()),
    ...party(owner, 'owner'),
    ...party(tenant, 'tenant'),
    property_address: property.address,
    property_type: labelOf(PROPERTY_TYPES, property.type),
    property_description: property.description,
    monthly_rent: formatRupees(property.monthlyRent),
    monthly_rent_words: hasValue(property.monthlyRent) ? numberToIndianWords(property.monthlyRent) : '',
    security_deposit: formatRupees(property.securityDeposit),
    security_deposit_words: hasValue(property.securityDeposit) ? numberToIndianWords(property.securityDeposit) : '',
    agreement_start_date: formatDate(property.startDate),
    agreement_end_date: formatDate(calcEndDate(property.startDate, property.durationMonths)),
    agreement_duration: property.durationMonths ? `${property.durationMonths} months` : '',
  };

  // Terms list (HTML) — adhukkulla irukka placeholders-um fill pannrom (standard clauses-la irundha)
  const termsHtml = renderTermsHtml(terms, { monthlyRent: property.monthlyRent, templateId, standardClauses });
  values.terms_and_conditions = termsHtml.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (m, key) =>
    key in values && key !== 'terms_and_conditions' ? escapeHtml(values[key] || '') : m
  );

  return values;
}

// Empty-ah irundha, idhu ellaam document-la yellow-ah "[Owner Name]" nu highlight aagum.
// Optional fields (email, relation...) empty-na "—" mattum.
export const REQUIRED_LABELS = {
  owner_name: 'Owner Name', owner_address: 'Owner Address', owner_mobile: 'Owner Mobile',
  tenant_name: 'Tenant Name', tenant_address: 'Tenant Address', tenant_mobile: 'Tenant Mobile',
  property_address: 'Property Address', property_type: 'Property Type',
  monthly_rent: 'Monthly Rent', monthly_rent_words: 'Rent in words',
  security_deposit: 'Security Deposit', security_deposit_words: 'Deposit in words',
  agreement_start_date: 'Start Date', agreement_end_date: 'End Date', agreement_duration: 'Duration',
  terms_and_conditions: 'Terms & conditions — added in the Terms step',
};

// Indha keys-oda value already HTML — escape panna koodaadhu
const HTML_KEYS = new Set(['terms_and_conditions']);

/** Editor save panna <span data-ph="owner_name">..</span> chips-ah thirumba {{owner_name}}-ah maathum */
export function normalizePlaceholders(html) {
  return (html || '').replace(/<span[^>]*data-ph="([a-z0-9_]+)"[^>]*>[\s\S]*?<\/span>/gi, '{{$1}}');
}

/** Template HTML + values → final HTML */
export function fillTemplate(html, values) {
  if (!html) return '';

  const render = (key) => {
    const value = values[key];
    if (!(key in values) && !(key in REQUIRED_LABELS)) {
      return `<span class="ph-missing">{{${escapeHtml(key)}}}</span>`; // Theriyaadha placeholder
    }
    if (!hasValue(value)) {
      return REQUIRED_LABELS[key] ? `<span class="ph-missing">[${REQUIRED_LABELS[key]}]</span>` : '—';
    }
    if (HTML_KEYS.has(key)) return value;
    return escapeHtml(value).replace(/\n/g, '<br>');
  };

  return normalizePlaceholders(html)
    // Block placeholder (terms list) thaniya oru paragraph-la irundha, <p>-ah serthu replace (<p> kulla <ol> vara koodaadhu)
    .replace(/<p[^>]*>\s*\{\{\s*(terms_and_conditions)\s*\}\}\s*<\/p>/g, (_, key) =>
      hasValue(values[key]) ? render(key) : `<p>${render(key)}</p>`)
    .replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_, key) => render(key));
}

/** Fill pannaadha required details list (preview & download check) */
export function findMissing(html, values) {
  const keys = new Set([...normalizePlaceholders(html).matchAll(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi)].map((m) => m[1]));
  return [...keys]
    .filter((key) => (REQUIRED_LABELS[key] && !hasValue(values[key])) || (!(key in values) && !(key in REQUIRED_LABELS)))
    .map((key) => (REQUIRED_LABELS[key] || `Unknown field {{${key}}}`).replace(' — added in the Terms step', ''));
}
