// Agreement data-ah clean pannradhu (sanitize) + check pannradhu (validate).
//
// Rendu stage:
// 1. sanitize — draft auto-save-ku. Type maathi, trim panni, length limit podrom.
//    Paadhi type panna data-vum save aaganum, adhanaala inga reject panna maatom.
// 2. validateDetails — "Continue" (next step) pogumbodhu. Ellaa required fields-um correct-ah irukkanum.

import { EMAIL_REGEX, MOBILE_REGEX } from './validators.js';
import { calcEndDate, isValidDateString } from './dateUtils.js';
import { PROPERTY_TYPES } from '../config/templates.js';
import crypto from 'node:crypto';
import { PAYER_OPTIONS, PROPERTY_USE_OPTIONS } from '../../../shared/options.js';
import { MAX_CLAUSES, MAX_CLAUSE_LENGTH } from '../../../shared/terms.js';


const text = (v, max) => (typeof v === 'string' || typeof v === 'number' ? String(v).trim().slice(0, max) : '');
const digits = (v, max) => text(v, max * 2).replace(/[^\d]/g, '').slice(0, max);

const PARTY_FIELDS = ['fullName', 'relationName', 'mobile', 'email', 'address', 'aadhaarLast4'];

export function emptyParty() {
  return Object.fromEntries(PARTY_FIELDS.map((f) => [f, '']));
}

export function emptyProperty() {
  return {
    address: '',
    type: '',
    description: '',
    monthlyRent: '',
    securityDeposit: '',
    startDate: '',
    durationMonths: '11', // Default 11 months
    endDate: '',
  };
}

export function sanitizeParty(input = {}) {
  return {
    fullName: text(input.fullName, 80),
    relationName: text(input.relationName, 80),
    mobile: digits(input.mobile, 10),
    email: text(input.email, 120).toLowerCase(),
    address: text(input.address, 300),
    // Full Aadhaar number store panna maatom — last 4 digits mattum
    // (Thavari full number type pannaalum, kadaisi 4 mattum edukkrom — meedhi discard)
    aadhaarLast4: text(input.aadhaarLast4, 20).replace(/[^\d]/g, '').slice(-4),
  };
}

export function sanitizeProperty(input = {}) {
  const property = {
    address: text(input.address, 300),
    type: PROPERTY_TYPES.includes(input.type) ? input.type : '',
    description: text(input.description, 500),
    monthlyRent: digits(input.monthlyRent, 9),
    securityDeposit: digits(input.securityDeposit, 9),
    startDate: isValidDateString(input.startDate) ? input.startDate : '',
    durationMonths: digits(input.durationMonths, 3),
  };
  // End date-ah frontend anuppinaalum use panna maatom — server-laye calculate pannrom
  property.endDate = calcEndDate(property.startDate, property.durationMonths);
  return property;
}

function validateParty(party, prefix, errors) {
  if (party.fullName.length < 2) errors[`${prefix}.fullName`] = 'Full name is required';
  if (!MOBILE_REGEX.test(party.mobile)) errors[`${prefix}.mobile`] = 'Enter a valid 10-digit mobile number';
  if (party.email && !EMAIL_REGEX.test(party.email)) errors[`${prefix}.email`] = 'Enter a valid email address';
  if (party.address.length < 5) errors[`${prefix}.address`] = 'Address is required';
  if (party.aadhaarLast4 && party.aadhaarLast4.length !== 4) errors[`${prefix}.aadhaarLast4`] = 'Enter exactly 4 digits';
}

// "Continue" pogumbodhu — ellaa details-um complete-ah irukka?
export function validateDetails({ owner, tenant, property }) {
  const errors = {};
  validateParty(owner, 'owner', errors);
  validateParty(tenant, 'tenant', errors);

  if (owner.mobile && owner.mobile === tenant.mobile) {
    errors['tenant.mobile'] = 'Tenant mobile must be different from owner mobile';
  }

  if (property.address.length < 5) errors['property.address'] = 'Property address is required';
  if (!property.type) errors['property.type'] = 'Select the property type';
  if (!(Number(property.monthlyRent) > 0)) errors['property.monthlyRent'] = 'Enter the monthly rent';
  if (property.securityDeposit === '') errors['property.securityDeposit'] = 'Enter the security deposit (0 if none)';
  if (!property.startDate) errors['property.startDate'] = 'Select the agreement start date';
  const months = Number(property.durationMonths);
  if (!Number.isInteger(months) || months < 1 || months > 120)
    errors['property.durationMonths'] = 'Duration must be between 1 and 120 months';

  return errors;
}

// ===== Terms (Step 4) =====

const PAYERS = PAYER_OPTIONS.map((o) => o.value);
const USES = PROPERTY_USE_OPTIONS.map((o) => o.value);
const pick = (value, allowed) => (allowed.includes(value) ? value : '');

export function sanitizeTerms(input = {}) {
  const clauses = Array.isArray(input.additionalClauses) ? input.additionalClauses : [];
  return {
    rentDueDay: digits(input.rentDueDay, 2),
    noticePeriodMonths: digits(input.noticePeriodMonths, 2),
    lockInMonths: digits(input.lockInMonths, 2),
    electricity: pick(input.electricity, PAYERS),
    water: pick(input.water, PAYERS),
    maintenance: pick(input.maintenance, PAYERS),
    propertyUse: pick(input.propertyUse, USES),
    rentIncreasePercent: digits(input.rentIncreasePercent, 2),
    additionalClauses: clauses.slice(0, MAX_CLAUSES).map((c) => ({
      id: typeof c?.id === 'string' && /^[\w-]{1,40}$/.test(c.id) ? c.id : crypto.randomUUID(),
      text: text(c?.text, MAX_CLAUSE_LENGTH),
    })),
  };
}

export function validateTerms(terms) {
  const errors = {};
  if (!terms) return { terms: 'Please fill in the terms' };
  const day = Number(terms.rentDueDay);
  if (!(day >= 1 && day <= 28)) errors['terms.rentDueDay'] = 'Choose a day between 1 and 28';
  const notice = Number(terms.noticePeriodMonths);
  if (terms.noticePeriodMonths === '' || !(notice >= 0 && notice <= 12)) errors['terms.noticePeriodMonths'] = 'Enter 0 to 12 months';
  if (terms.lockInMonths !== '' && Number(terms.lockInMonths) > 60) errors['terms.lockInMonths'] = 'Maximum 60 months';
  if (!terms.electricity) errors['terms.electricity'] = 'Select who pays';
  if (!terms.water) errors['terms.water'] = 'Select who pays';
  if (!terms.maintenance) errors['terms.maintenance'] = 'Select who pays';
  if (!terms.propertyUse) errors['terms.propertyUse'] = 'Select the property use';
  if (terms.rentIncreasePercent !== '' && Number(terms.rentIncreasePercent) > 50) errors['terms.rentIncreasePercent'] = 'Maximum 50%';
  return errors;
}
