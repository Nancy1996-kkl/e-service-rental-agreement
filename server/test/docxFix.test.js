import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixDocumentXml } from '../src/utils/docxFix.js';
import { DEFAULT_CLAUSES } from '../src/services/clauseService.js';

test('docx fix: widths, spacing, order, sectPr, header colour', () => {
  const xml = '<w:document><w:body><w:sectPr><w:pgSz/></w:sectPr>'
    + '<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="40" w:lineRule="auto"/></w:pPr></w:p>'
    + '<w:tbl><w:tr><w:tc><w:tcPr><w:vAlign w:val="top"/><w:tcW w:w="0" w:type="dxa"/><w:shd w:val="clear" w:fill="1e3a5f"/></w:tcPr>'
    + '<w:p><w:r><w:rPr><w:color w:val="000000"/><w:b/></w:rPr><w:t>Head</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body></w:document>';
  const out = fixDocumentXml(xml);
  assert.ok(!out.includes('w:w="0"'));
  assert.match(out, /<w:spacing w:after="40" w:line="276" w:lineRule="auto"\/><w:jc w:val="center"\/>/);
  assert.match(out, /<w:tcPr><w:shd[^>]*\/><w:vAlign[^>]*\/><\/w:tcPr>/);
  assert.match(out, /<w:rPr><w:b\/><w:color w:val="FFFFFF"\/><\/w:rPr>/);
  assert.match(out, /<w:sectPr><w:pgSz\/><\/w:sectPr><\/w:body>/);
});

test('default clauses: client points present', () => {
  const titles = DEFAULT_CLAUSES.map((c) => c.title).join(' | ');
  for (const t of ['Prior Consent', 'Expenses', 'Informing', 'Residential Use Only', 'Additional Occupants']) assert.match(titles, new RegExp(t));
});
