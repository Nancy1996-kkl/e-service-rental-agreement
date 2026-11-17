// 📄 Final agreement document create pannradhu — PDF & Word (.docx).
//
// Flow: template (illa editor-la maathina content) + details → fillTemplate (shared code, preview-um idhe)
//       → full HTML page + shared/agreement-doc.css → PDF (Chrome/Edge vazhiya) / Word (html-to-docx)

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import juice from 'juice';
import HTMLtoDOCX from '@turbodocx/html-to-docx';
import { fixDocxForWord } from '../utils/docxFix.js';
import { getTemplateById } from './templateService.js';
import { listClauses } from './clauseService.js';
import { buildPlaceholderValues, fillTemplate, findMissing } from '../../../shared/placeholders.js';

const DOC_CSS = readFileSync(fileURLToPath(new URL('../../../shared/agreement-doc.css', import.meta.url)), 'utf8');

async function contentFor(agreement) {
  const template = await getTemplateById(agreement.templateId);
  if (!template) throw Object.assign(new Error('Template not found'), { status: 400 });
  const standardClauses = await listClauses({ activeOnly: true });
  const values = buildPlaceholderValues(agreement, { standardClauses });
  return { template, html: agreement.editedContent || template.html, values };
}

/** Fill pannaadha required details list — empty-na ready */
export async function getMissingFields(agreement) {
  const { html, values } = await contentFor(agreement);
  return findMissing(html, values);
}

/** Full HTML page (CSS oda) — PDF-ku */
export async function buildDocumentHtml(agreement) {
  const { template, html, values } = await contentFor(agreement);
  const missing = findMissing(html, values);
  if (missing.length) {
    throw Object.assign(new Error(`Cannot generate: missing ${missing.join(', ')}`), { status: 400 });
  }
  const body = fillTemplate(html, values);
  const theme = template.theme || 'classic';

  return {
    theme,
    html: `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Rental Agreement</title>
<style>
${DOC_CSS}
/* 1st page: design full-bleed (header band) | adutha pages: mela-keezha margin */
@page { size: A4; margin: 14mm 0 12mm; }
@page :first { margin-top: 0; }
.agreement-doc table:last-of-type, .agreement-doc table:last-of-type + p { break-inside: avoid; }
html, body { margin: 0; padding: 0; background: #fff; }
.agreement-doc { width: 210mm; box-sizing: border-box; }
</style></head>
<body><article class="agreement-doc doc-theme-${theme}">${body}</article></body></html>`,
  };
}

// ===== PDF — Chrome / Edge (headless) =====
// Windows-la Microsoft Edge eppovum irukkum, adhanaala periya Chrome download theva illa.
// Vera path venum-na server/.env-la CHROME_PATH=... podunga.
const BROWSER_PATHS = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/microsoft-edge',
].filter(Boolean);

let browserPromise = null;

function getBrowser() {
  if (!browserPromise) {
    const executablePath = BROWSER_PATHS.find((p) => existsSync(p));
    if (!executablePath) {
      throw Object.assign(new Error('PDF needs Google Chrome or Microsoft Edge. Install one, or set CHROME_PATH in server/.env'), { status: 500, expose: true });
    }
    browserPromise = puppeteer
      .launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
      .catch((err) => {
        browserPromise = null;
        throw err;
      });
    // Browser close aanaa thirumba open panna
    browserPromise.then((b) => b.on('disconnected', () => (browserPromise = null))).catch(() => {});
  }
  return browserPromise;
}

export async function generatePdf(agreement) {
  const { html } = await buildDocumentHtml(agreement);
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    // Internet-la irundhu edhuvum load panna koodaadhu (security) — namma HTML mattum
    await page.setRequestInterception(true);
    page.on('request', (r) => (r.url().startsWith('data:') || r.url() === 'about:blank' ? r.continue() : r.abort()));
    await page.setContent(html, { waitUntil: 'load' });
    return Buffer.from(await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true }));
  } finally {
    await page.close();
  }
}

// ===== Word (.docx) =====
export async function generateDocx(agreement) {
  const { html, theme } = await buildDocumentHtml(agreement);
  // CSS class styles-ah ovvoru tag-kum inline style-ah maathrom — Word-la colors/fonts vara
  const inlined = juice(html, { removeStyleTags: true, preserveMediaQueries: false });
  const bodyHtml = inlined.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || inlined;

  const fonts = { classic: 'Times New Roman', modern: 'Calibri', corporate: 'Arial', elegant: 'Georgia' };
  const buffer = await HTMLtoDOCX(bodyHtml, null, {
    orientation: 'portrait',
    pageSize: { width: 11906, height: 16838 }, // A4 (twips)
    margins: { top: 1000, right: 1080, bottom: 1000, left: 1080 },
    font: fonts[theme] || 'Times New Roman',
    fontSize: 22, // half-points → 11pt
    title: 'Rental Agreement',
    table: { row: { cantSplit: true } },
  });
  // MS Word-la 100+ empty pages varaama irukka (utils/docxFix.js paarunga)
  return fixDocxForWord(Buffer.from(buffer));
}

export async function closeBrowser() {
  if (browserPromise) (await browserPromise).close().catch(() => {});
}
