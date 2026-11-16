// App-la thirumba thirumba use aagura fixed data — oru idathula vechukkalaam

// Dropdown options — shared/options.js (server-um adhe use pannum)
export { PROPERTY_TYPES, DURATION_OPTIONS, PAYER_OPTIONS, PROPERTY_USE_OPTIONS } from '../../../shared/options.js';

export const APP_NAME = 'E-Service Agreements';

// Templates list ippo server-la irundhu varum (hooks/useTemplates.js) — 4 or 5, admin evlo vechaalum.

// Agreement create panra steps — Home page & wizard rendu-layum use aagum
export const AGREEMENT_STEPS = [
  { title: 'Choose a template', text: 'Pick one of the four agreement formats.' },
  { title: 'Enter details', text: 'Owner, tenant and property information.' },
  { title: 'Upload documents', text: 'Securely upload the required ID proofs.' },
  { title: 'Set the terms', text: 'Duration (e.g. 11 months), rent, deposit and rules.' },
  { title: 'Customize', text: 'Edit the text, fonts and formatting like Word.' },
  { title: 'Preview', text: 'Review the complete agreement before generating.' },
  { title: 'Download', text: 'Get your agreement as Word or PDF.' },
];



// Agreement wizard steps — URL path & label. Order mukkiyam.
export const WIZARD_STEPS = [
  { key: 'template', label: 'Template' },
  { key: 'details', label: 'Details' },
  { key: 'upload', label: 'Documents' },
  { key: 'rules', label: 'Terms' },
  { key: 'editor', label: 'Customize' },
  { key: 'preview', label: 'Preview' },
  { key: 'download', label: 'Download' },
];
