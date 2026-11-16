// Templates list ippo fixed illa — server/templates-docx/ folder-la irundhu varum
// (services/templateService.js paarunga).

import { PROPERTY_TYPES as PROPERTY_TYPE_OPTIONS } from '../../../shared/options.js';

export const PROPERTY_TYPES = PROPERTY_TYPE_OPTIONS.map((t) => t.value);

// Wizard steps — order mukkiyam
export const WIZARD_STEPS = ['template', 'details', 'upload', 'rules', 'editor', 'preview', 'download'];
