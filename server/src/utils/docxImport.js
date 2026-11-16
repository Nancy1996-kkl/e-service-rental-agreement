// Word (.docx) → HTML convert pannradhu (mammoth library).
// Editor (TipTap) & preview HTML-la dhaan work aagum, adhanaala template-ah HTML-ah maathi store pannrom.

import mammoth from 'mammoth';
import { PLACEHOLDER_KEYS } from '../config/placeholders.js';

// Word styles → HTML tags
const STYLE_MAP = [
  "p[style-name='Title'] => h1:fresh",
  "p[style-name='Heading 1'] => h1:fresh",
  "p[style-name='Heading 2'] => h2:fresh",
  "p[style-name='Heading 3'] => h3:fresh",
  'u => u',
];

/**
 * buffer (docx file) → { html, placeholders, problems }
 * problems: thappaana / theriyaadha placeholders list — admin fix panna
 */
export async function convertDocxToHtml(buffer) {
  const result = await mammoth.convertToHtml({ buffer }, { styleMap: STYLE_MAP });
  const html = result.value;
  return { html, ...checkPlaceholders(html) };
}

export function checkPlaceholders(html) {
  const found = new Set();
  const problems = [];

  // Sariyaana placeholders: {{owner_name}}
  for (const [, key] of html.matchAll(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi)) {
    if (PLACEHOLDER_KEYS.has(key)) found.add(key);
    else problems.push(`Unknown placeholder {{${key}}} — check the spelling`);
  }

  // Word sila nerathula {{owner_name}}-ah formatting maathi rendu-aa pirichidum:
  // e.g. {{owner_<strong>name</strong>}} → idha kandupidikkrom
  const broken = html.match(/\{\{[^}]*<[^>]+>[^}]*\}\}/g) || [];
  broken.forEach((b) =>
    problems.push(`Broken placeholder "${b.replace(/<[^>]+>/g, '')}" — retype it in Word with the same formatting`)
  );

  return { placeholders: [...found], problems };
}
