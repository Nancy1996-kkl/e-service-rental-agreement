// 🔒 Editor-la irundhu varra HTML-ah clean pannradhu.
// Allowed tags & styles mattum vechukkrom — <script>, onclick, javascript: links maadhiri
// dangerous edhuvum save aagaadhu (XSS attack thadukka).

import sanitizeHtml from 'sanitize-html';
import { normalizePlaceholders } from '../../../shared/placeholders.js';

const COLOR = [/^#[0-9a-f]{3,8}$/i, /^rgba?\(\s*[\d.\s,%]+\)$/i];
const ALLOWED_STYLES = {
  color: COLOR,
  'background-color': COLOR,
  'font-family': [/^[\w\s"',-]{1,80}$/],
  'font-size': [/^\d{1,2}(\.\d{1,2})?(pt|px)$/],
  'text-align': [/^(left|right|center|justify)$/],
  'min-width': [/^\d{1,4}px$/],
  width: [/^\d{1,4}(px|%)$/],
};

export const MAX_CONTENT_LENGTH = 300_000; // ~300 KB

export function sanitizeDocumentHtml(html) {
  const clean = sanitizeHtml(String(html || ''), {
    allowedTags: [
      'h1', 'h2', 'h3', 'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'span', 'mark',
      'ul', 'ol', 'li', 'blockquote', 'hr',
      'table', 'colgroup', 'col', 'thead', 'tbody', 'tr', 'td', 'th',
    ],
    allowedAttributes: {
      '*': ['style'],
      span: ['style', 'data-ph', 'class'],
      td: ['style', 'colspan', 'rowspan'],
      th: ['style', 'colspan', 'rowspan'],
      ol: ['style', 'start', 'class'],
    },
    allowedClasses: { span: ['ph-chip', 'ph-block', 'ph-chip-empty'], ol: ['terms-list'] },
    allowedStyles: { '*': ALLOWED_STYLES },
    allowedSchemes: [],
  });
  // Editor chips → {{placeholder}} — store aagura content template maadhiriye irukkum
  return normalizePlaceholders(clean);
}
