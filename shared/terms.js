// ===== SHARED — Terms & Conditions (Step 4) =====
// User select panna options-ah document-la "Terms and Conditions" list-ah maathradhu.
// Idhu user kudutha FACTS mattum (e.g. "Notice period: 1 month") — legal clauses illa.
// Client-approved standard clauses: Admin Dashboard → Clauses (database-la store aagum)

import { PAYER_OPTIONS, PROPERTY_USE_OPTIONS, labelOf } from './options.js';
import { formatRupees, ordinal } from './dateUtils.js';

export const MAX_CLAUSES = 20;
export const MAX_CLAUSE_LENGTH = 1000;

// Pudhu agreement-ku default values
export function defaultTerms(templateId) {
  return {
    rentDueDay: '5',
    noticePeriodMonths: '1',
    lockInMonths: '0',
    electricity: 'tenant',
    water: 'tenant',
    maintenance: 'tenant',
    propertyUse: templateId === 'commercial' ? 'commercial' : 'residential',
    rentIncreasePercent: '',
    additionalClauses: [], // [{ id, text }] — user add panna extra points
  };
}

const escapeHtml = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const payer = (value) => {
  if (value === 'na') return 'Not applicable.';
  if (value === 'shared') return 'Shared equally by the Owner and the Tenant.';
  const who = labelOf(PAYER_OPTIONS, value);
  return who ? `Paid by the ${who}.` : '';
};

/** terms → [{ label, text }] list (empty items skip aagum) */
export function buildTermItems(terms, { monthlyRent, templateId, standardClauses = [] } = {}) {
  if (!terms) return [];
  const items = [];
  const months = (n) => `${n} month${Number(n) === 1 ? '' : 's'}`;

  if (terms.rentDueDay) {
    const rent = formatRupees(monthlyRent);
    items.push({ label: 'Rent Payment', text: `${rent ? `${rent} per month, ` : ''}on or before the ${ordinal(terms.rentDueDay)} of every month.` });
  }
  if (terms.noticePeriodMonths) items.push({ label: 'Notice Period', text: `${months(terms.noticePeriodMonths)} written notice by either party.` });
  if (Number(terms.lockInMonths) > 0) items.push({ label: 'Lock-in Period', text: `${months(terms.lockInMonths)}.` });
  if (terms.electricity) items.push({ label: 'Electricity Charges', text: payer(terms.electricity) });
  if (terms.water) items.push({ label: 'Water Charges', text: payer(terms.water) });
  if (terms.maintenance) items.push({ label: 'Maintenance Charges', text: payer(terms.maintenance) });
  if (terms.propertyUse) items.push({ label: 'Use of Property', text: `${labelOf(PROPERTY_USE_OPTIONS, terms.propertyUse)}.` });
  if (terms.rentIncreasePercent !== '' && terms.rentIncreasePercent != null) {
    items.push({ label: 'Rent Revision', text: `${terms.rentIncreasePercent}% increase on renewal.` });
  }

  // Admin add panna clauses (endha templates-ku-nu select pannirukkaanga-o adhukku mattum)
  standardClauses
    .filter((c) => c.isActive !== false && (!c.templates?.length || c.templates.includes(templateId)))
    .forEach((c) => items.push({ label: c.title || '', text: c.text }));
  (terms.additionalClauses || []).forEach((c) => c.text?.trim() && items.push({ label: '', text: c.text.trim() }));

  return items;
}

/** Document-la varra HTML list */
export function renderTermsHtml(terms, context) {
  const items = buildTermItems(terms, context);
  if (!items.length) return '';
  const li = items
    .map(({ label, text }) => {
      const body = escapeHtml(text).replace(/\n/g, '<br>');
      return `<li>${label ? `<strong>${escapeHtml(label)}:</strong> ` : ''}${body}</li>`;
    })
    .join('');
  return `<ol class="terms-list">${li}</ol>`;
}
