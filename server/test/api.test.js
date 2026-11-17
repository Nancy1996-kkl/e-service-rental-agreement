// End-to-end API tests — server-ah temporary folder-la start panni ellaa mukkiyamana flows-um check.
// Run: npm test  (server folder-la, illa main folder-la)

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const tmp = mkdtempSync(path.join(tmpdir(), 'eservice-test-'));
Object.assign(process.env, {
  NODE_ENV: 'test',
  STORAGE: 'local',
  DATA_DIR: path.join(tmp, 'data'),
  FILES_DIR: path.join(tmp, 'files'),
  FILE_ENCRYPTION_KEY: 'a'.repeat(64),
  JWT_SECRET: 'test-secret-that-is-long-enough-1234567890',
});

const { default: app } = await import('../src/app.js');
const { ensureTemplatesSeeded } = await import('../src/services/templateService.js');
const { updateUser, findUserByEmail } = await import('../src/services/userService.js');

let server;
let base;

before(async () => {
  await ensureTemplatesSeeded();
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(() => {
  server?.close();
  rmSync(tmp, { recursive: true, force: true });
});

// Chinna HTTP helper — cookie-ah nyabagam vechukkum (browser maadhiri)
function client() {
  let cookie = '';
  return async (method, url, body, { form } = {}) => {
    const headers = { Origin: 'http://localhost:5173' };
    if (cookie) headers.Cookie = cookie;
    let payload;
    if (form) payload = form;
    else if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }
    const res = await fetch(base + url, { method, headers, body: payload });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    const type = res.headers.get('content-type') || '';
    const data = type.includes('json') ? await res.json() : Buffer.from(await res.arrayBuffer());
    return { status: res.status, data, headers: res.headers };
  };
}

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(100)]);
const fileForm = (buffer, name, consent = true) => {
  const f = new FormData();
  f.append('consent', String(consent));
  f.append('file', new Blob([buffer]), name);
  return f;
};

const DETAILS = {
  owner: { fullName: 'Ravi Kumar', mobile: '9876543210', address: '12, Main Road, Karaikal', aadhaarLast4: '123456784321' },
  tenant: { fullName: 'Suresh M', mobile: '9123456789', address: '5, North Street, Karaikal' },
  property: { address: '12, Main Road, Karaikal', type: 'house', monthlyRent: '15000', securityDeposit: '50000', startDate: '2027-01-01', durationMonths: '11' },
};
const TERMS = { rentDueDay: '5', noticePeriodMonths: '1', lockInMonths: '0', electricity: 'tenant', water: 'tenant', maintenance: 'owner', propertyUse: 'residential', rentIncreasePercent: '', additionalClauses: [] };

const user = client();
const other = client();
const adminUser = client();
let agreementId;

test('auth: register, validation, duplicate, login', async () => {
  assert.equal((await user('POST', '/auth/register', { fullName: 'A', mobile: '1', email: 'x', password: 'y' })).status, 400);
  const reg = await user('POST', '/auth/register', { fullName: 'Nancy K', mobile: '9876543210', email: 'nancy@test.com', password: 'pass1234' });
  assert.equal(reg.status, 201);
  assert.equal(reg.data.user.passwordHash, undefined);
  assert.equal((await other('POST', '/auth/register', { fullName: 'Other', mobile: '9876543211', email: 'nancy@test.com', password: 'pass1234' })).status, 409);
  assert.equal((await other('POST', '/auth/register', { fullName: 'Other', mobile: '9876543211', email: 'other@test.com', password: 'pass1234' })).status, 201);
  assert.equal((await client()('POST', '/auth/login', { email: 'nancy@test.com', password: 'wrong123' })).status, 401);
});

test('templates: 4 templates with themes', async () => {
  const { data } = await user('GET', '/templates');
  assert.equal(data.templates.length, 4);
  assert.deepEqual(data.templates.map((t) => t.theme), ['classic', 'modern', 'corporate', 'elegant']);
});

test('agreement: create, details, step guards', async () => {
  const created = await user('POST', '/agreements', { templateId: 'house' });
  assert.equal(created.status, 201);
  agreementId = created.data.agreement.id;

  // Details illama next step poga mudiyaadhu
  assert.equal((await user('PUT', `/agreements/${agreementId}`, { currentStep: 'upload' })).status, 400);
  const saved = await user('PUT', `/agreements/${agreementId}`, { ...DETAILS, currentStep: 'upload' });
  assert.equal(saved.status, 200);
  assert.equal(saved.data.agreement.owner.aadhaarLast4, '4321'); // Full Aadhaar store aagaadhu
  assert.equal(saved.data.agreement.property.endDate, '2027-11-30'); // 11 months

  // Vera user paakka mudiyaadhu
  assert.equal((await other('GET', `/agreements/${agreementId}`)).status, 404);
});

test('uploads: consent, type check, encryption, access control', async () => {
  const url = `/agreements/${agreementId}/uploads`;
  assert.equal((await user('POST', `${url}/owner_aadhaar`, undefined, { form: fileForm(PNG, 'a.png', false) })).status, 400);
  assert.equal((await user('POST', `${url}/owner_aadhaar`, undefined, { form: fileForm(Buffer.from('<script>'), 'a.pdf') })).status, 400);
  assert.equal((await user('POST', `${url}/owner_aadhaar`, undefined, { form: fileForm(PNG, 'a.png') })).status, 201);
  assert.equal((await user('PUT', `/agreements/${agreementId}`, { currentStep: 'rules' })).status, 400); // Tenant Aadhaar missing
  assert.equal((await user('POST', `${url}/tenant_aadhaar`, undefined, { form: fileForm(PNG, 'b.png') })).status, 201);

  const view = await user('GET', `${url}/owner_aadhaar/file`);
  assert.equal(view.status, 200);
  assert.ok(PNG.equals(view.data)); // Decrypt panna original kidaikkudhu
  assert.equal((await other('GET', `${url}/owner_aadhaar/file`)).status, 404);
});

test('terms + editor: validation and HTML sanitizing', async () => {
  const bad = await user('PUT', `/agreements/${agreementId}`, { terms: { ...TERMS, rentDueDay: '40' }, currentStep: 'editor' });
  assert.equal(bad.status, 400);
  assert.equal((await user('PUT', `/agreements/${agreementId}`, { terms: TERMS, currentStep: 'editor' })).status, 200);

  const xss = await user('PUT', `/agreements/${agreementId}`, {
    editedContent: '<h1 onclick="x()">Title</h1><script>alert(1)</script><p>{{owner_name}} <img src=x onerror=alert(1)></p>',
  });
  assert.equal(xss.data.agreement.editedContent, '<h1>Title</h1><p>{{owner_name}} </p>');
});

test('download: Word file, completed status, reopen', async () => {
  // Preview step reach pannaama download — still allowed only if everything valid; here valid, so check status flow
  assert.equal((await user('PUT', `/agreements/${agreementId}`, { currentStep: 'download' })).status, 200);
  const docx = await user('GET', `/agreements/${agreementId}/download?format=docx`);
  assert.equal(docx.status, 200);
  assert.equal(docx.data.subarray(0, 2).toString(), 'PK'); // .docx = zip
  assert.match(docx.headers.get('content-disposition'), /Rental-Agreement-Suresh-M/);
  // MS Word 100+ empty pages bug thirumba varakoodaadhu
  const { default: JSZip } = await import('jszip');
  const xml = await (await JSZip.loadAsync(docx.data)).file('word/document.xml').async('string');
  assert.doesNotMatch(xml, /<w:tcW w:w="0" w:type="dxa"\/>/, 'no zero-width table cells');
  assert.doesNotMatch(xml, /<w:spacing(?:(?!w:line=)[^>])*w:lineRule="auto"\/>/, 'line spacing has a value');
  assert.match(xml, /<w:sectPr>[\s\S]*<\/w:sectPr>\s*<\/w:body>/, 'page settings at the end');

  const after = await user('GET', `/agreements/${agreementId}`);
  assert.equal(after.data.agreement.status, 'completed');
  assert.equal((await user('PUT', `/agreements/${agreementId}`, { terms: TERMS })).status, 400); // Completed — locked
  assert.equal((await user('PUT', `/agreements/${agreementId}`, { status: 'draft' })).data.agreement.status, 'draft');
});

test('admin: access control, clients, clauses, templates, audit', async () => {
  assert.equal((await user('GET', '/admin/stats')).status, 403); // Normal client — admin illa

  await adminUser('POST', '/auth/register', { fullName: 'Admin', mobile: '9000000000', email: 'admin@test.com', password: 'pass1234' });
  await updateUser((await findUserByEmail('admin@test.com')).id, { role: 'admin' });

  const stats = await adminUser('GET', '/admin/stats');
  assert.equal(stats.status, 200);
  assert.equal(stats.data.stats.agreements, 1);

  // Clause add → client document-la varum
  const clause = await adminUser('POST', '/admin/clauses', { title: 'Sample', text: 'Sample approved clause for {{tenant_name}}.', templates: [] });
  assert.equal(clause.status, 201);
  assert.equal((await user('GET', '/clauses')).data.clauses.length, 1);

  // Admin client Aadhaar paakkalaam → audit log-la varum
  assert.equal((await adminUser('GET', `/agreements/${agreementId}/uploads/owner_aadhaar/file`)).status, 200);
  const audit = await adminUser('GET', '/admin/audit');
  assert.ok(audit.data.actions.some((a) => a.action === 'upload.view'));

  // Used template delete panna mudiyaadhu; template off pannalaam
  assert.equal((await adminUser('DELETE', '/admin/templates/house')).status, 409);
  assert.equal((await adminUser('PATCH', '/admin/templates/custom', { isActive: false })).status, 200);
  assert.equal((await user('GET', '/templates')).data.templates.length, 3);

  // Client disable → avanga login work aagaadhu
  const nancy = await findUserByEmail('nancy@test.com');
  assert.equal((await adminUser('PATCH', `/admin/clients/${nancy.id}`, { isActive: false })).status, 200);
  assert.equal((await user('GET', '/agreements')).status, 403);
  assert.equal((await client()('POST', '/auth/login', { email: 'nancy@test.com', password: 'pass1234' })).status, 403);
});

test('security: cross-site requests blocked', async () => {
  const res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example.com' },
    body: JSON.stringify({ email: 'other@test.com', password: 'pass1234' }),
  });
  assert.equal(res.status, 403);
});
