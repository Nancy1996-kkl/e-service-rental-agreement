// 🩹 Word (.docx) fix — html-to-docx library create panra file-la sila thappu irukku:
//   1. Table cell width = 0 → MS Word column-ah romba narrow aakki, 100+ empty pages-ah kaattum
//   2. Line spacing value missing → sila Word versions thappa read pannum
//   3. Page settings (sectPr) document-oda start-la irukku — Word rules padi last-la irukkanum
//   4. Properties order thappu (Word strict-ah check pannum)
// Idha ellaam file create aanadhum correct pannrom. (LibreOffice / Google Docs idha ignore pannum,
// adhanaala avangala-la problem theriyaadhu — MS Word-la mattum dhaan.)

import JSZip from 'jszip';

const W = 'w:';
// ECMA-376 schema order (theriyaadha elements last-la)
const ORDER = {
  pPr: ['pStyle', 'keepNext', 'keepLines', 'pageBreakBefore', 'framePr', 'widowControl', 'numPr', 'suppressLineNumbers', 'pBdr', 'shd', 'tabs', 'suppressAutoHyphens', 'kinsoku', 'wordWrap', 'overflowPunct', 'topLinePunct', 'autoSpaceDE', 'autoSpaceDN', 'bidi', 'adjustRightInd', 'snapToGrid', 'spacing', 'ind', 'contextualSpacing', 'mirrorIndents', 'suppressOverlap', 'jc', 'textDirection', 'textAlignment', 'textboxTightWrap', 'outlineLvl', 'divId', 'cnfStyle', 'rPr', 'sectPr', 'pPrChange'],
  rPr: ['rStyle', 'rFonts', 'b', 'bCs', 'i', 'iCs', 'caps', 'smallCaps', 'strike', 'dstrike', 'outline', 'shadow', 'emboss', 'imprint', 'noProof', 'snapToGrid', 'vanish', 'webHidden', 'color', 'spacing', 'w', 'kern', 'position', 'sz', 'szCs', 'highlight', 'u', 'effect', 'bdr', 'shd', 'fitText', 'vertAlign', 'rtl', 'cs', 'em', 'lang', 'eastAsianLayout', 'specVanish', 'oMath'],
  tcPr: ['cnfStyle', 'tcW', 'gridSpan', 'hMerge', 'vMerge', 'tcBorders', 'shd', 'noWrap', 'tcMar', 'textDirection', 'tcFitText', 'vAlign', 'hideMark'],
  tcBorders: ['top', 'start', 'left', 'bottom', 'end', 'right', 'insideH', 'insideV', 'tl2br', 'tr2bl'],
  tblBorders: ['top', 'start', 'left', 'bottom', 'end', 'right', 'insideH', 'insideV'],
  tblCellMar: ['top', 'start', 'left', 'bottom', 'end', 'right'],
  tcMar: ['top', 'start', 'left', 'bottom', 'end', 'right'],
  pBdr: ['top', 'left', 'bottom', 'right', 'between', 'bar'],
  tblPr: ['tblStyle', 'tblpPr', 'tblOverlap', 'bidiVisual', 'tblStyleRowBandSize', 'tblStyleColBandSize', 'tblW', 'jc', 'tblCellSpacing', 'tblInd', 'tblBorders', 'shd', 'tblLayout', 'tblCellMar', 'tblLook'],
};

/** "<a/><b>..</b>" → top-level child elements list */
function splitChildren(xml) {
  const out = [];
  let i = 0;
  while (i < xml.length) {
    const start = xml.indexOf('<', i);
    if (start === -1) break;
    const nameMatch = /^<([\w:]+)/.exec(xml.slice(start));
    if (!nameMatch) break;
    const name = nameMatch[1];
    const tagEnd = xml.indexOf('>', start);
    if (xml[tagEnd - 1] === '/') {
      out.push({ name, xml: xml.slice(start, tagEnd + 1) });
      i = tagEnd + 1;
      continue;
    }
    // Nested same-name tags count pannrom
    let depth = 1;
    let j = tagEnd + 1;
    const re = new RegExp(`<(/?)${name}(?=[\\s>/])[^>]*?(/?)>`, 'g');
    re.lastIndex = j;
    let m;
    while (depth && (m = re.exec(xml))) {
      if (m[1]) depth--;
      else if (!m[2]) depth++;
      j = re.lastIndex;
    }
    out.push({ name, xml: xml.slice(start, j) });
    i = j;
  }
  return out;
}

function reorder(xml, tag) {
  const order = ORDER[tag];
  const rank = (name) => {
    const k = order.indexOf(name.replace(W, ''));
    return k === -1 ? order.length : k;
  };
  return xml.replace(new RegExp(`<${W}${tag}>([\\s\\S]*?)</${W}${tag}>`, 'g'), (whole, inner) => {
    if (inner.includes(`<${W}${tag}>`)) return whole; // nested — thoda vendaam
    const kids = splitChildren(inner);
    // Orey element rendu dhadava irundha first mattum (schema allow pannaadhu)
    const seen = new Set();
    const unique = kids.filter((k) => (seen.has(k.name) ? false : seen.add(k.name)));
    unique.sort((a, b) => rank(a.name) - rank(b.name));
    return `<${W}${tag}>${unique.map((k) => k.xml).join('')}</${W}${tag}>`;
  });
}

export function fixDocumentXml(xml) {
  let out = xml;
  // 1. 0-width cells → width remove (Word table grid-ah use pannum)
  out = out.replace(/<w:tcW w:w="0" w:type="dxa"\/>/g, '');
  // 2. Line spacing value illaama "auto" → normal 1.15 line spacing
  out = out.replace(/<w:spacing((?:(?!w:line=)[^>])*?)w:lineRule="auto"\s*\/>/g, '<w:spacing$1w:line="276" w:lineRule="auto"/>');
  // 5. Dark header cell-la black text → white (CSS variable Word-ku pogala)
  out = out.replace(/<w:tc>[\s\S]*?<\/w:tc>/g, (cell) => {
    const fill = /<w:shd [^>]*w:fill="([0-9a-fA-F]{6})"/.exec(cell)?.[1];
    if (!fill) return cell;
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(fill.slice(i, i + 2), 16));
    const dark = 0.299 * r + 0.587 * g + 0.114 * b < 128;
    return dark ? cell.replace(/<w:color w:val="000000"\/>/g, '<w:color w:val="FFFFFF"/>') : cell;
  });
  // 4. Properties order
  for (const tag of ['tcBorders', 'tblBorders', 'tblCellMar', 'tcMar', 'pBdr', 'rPr', 'tcPr', 'tblPr', 'pPr']) out = reorder(out, tag);
  // 3. sectPr → body-oda last-ku
  const sect = /<w:body>\s*(<w:sectPr>[\s\S]*?<\/w:sectPr>)/.exec(out);
  if (sect) {
    out = out.replace(sect[1], '');
    out = out.replace(/<\/w:body>/, `${sect[1]}</w:body>`);
  }
  return out;
}

export async function fixDocxForWord(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const doc = zip.file('word/document.xml');
  if (doc) zip.file('word/document.xml', fixDocumentXml(await doc.async('string')));
  // Folder entries remove (sila cloud apps-la open aagaadhu)
  Object.keys(zip.files).forEach((name) => zip.files[name].dir && delete zip.files[name]);
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
