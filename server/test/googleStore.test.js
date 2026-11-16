// Google Sheet / Drive storage logic test — fake Google API vechu (internet / account theva illa)
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.STORAGE = 'google';
Object.assign(process.env, {
  GOOGLE_CLIENT_ID: 'x', GOOGLE_CLIENT_SECRET: 'x', GOOGLE_REFRESH_TOKEN: 'x',
  GOOGLE_SHEET_ID: 'sheet1', GOOGLE_DRIVE_FOLDER_ID: 'folder1',
});

const google = await import('../src/storage/googleStore.js');

// ===== Fake Google APIs (memory-la) =====
function fakeClients() {
  const tabs = new Map(); // name → 2D array
  const files = new Map(); // id → { name, data }
  let nextId = 1;
  const tabOf = (range) => range.split('!')[0];
  const rowOf = (range) => Number((range.split('!')[1] || 'A1').match(/\d+/)[0]);
  return {
    tabs, files,
    sheets: {
      spreadsheets: {
        get: async () => ({ data: { sheets: [...tabs.keys()].map((title) => ({ properties: { title } })) } }),
        batchUpdate: async ({ requestBody }) => { tabs.set(requestBody.requests[0].addSheet.properties.title, []); },
        values: {
          get: async ({ range }) => ({ data: { values: tabs.get(tabOf(range)) || [] } }),
          update: async ({ range, requestBody }) => {
            const rows = tabs.get(tabOf(range)) || [];
            requestBody.values.forEach((r, i) => { rows[i] = r; });
            tabs.set(tabOf(range), rows);
          },
          clear: async ({ range }) => { tabs.set(tabOf(range), (tabs.get(tabOf(range)) || []).slice(0, rowOf(range) - 1)); },
        },
      },
    },
    drive: {
      files: {
        list: async ({ q }) => {
          const name = q.match(/name = '([^']+)'/)[1];
          return { data: { files: [...files].filter(([, f]) => f.name === name).map(([id]) => ({ id })) } };
        },
        create: async ({ requestBody, media }) => {
          const id = `f${nextId++}`;
          files.set(id, { name: requestBody.name, data: await streamToBuffer(media.body) });
          return { data: { id } };
        },
        update: async ({ fileId, media }) => { files.get(fileId).data = await streamToBuffer(media.body); },
        get: async ({ fileId }) => ({ data: files.get(fileId).data }),
        delete: async ({ fileId }) => { files.delete(fileId); },
      },
    },
  };
}
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const c of stream) chunks.push(Buffer.from(c));
  return Buffer.concat(chunks);
}

test('collections: write → read back, readable columns + chunked JSON', async () => {
  const fake = fakeClients();
  google.setClients(fake);
  const big = 'x'.repeat(120000); // 50k cell limit-ah thaandum → chunks
  const items = [
    { id: 'a1', status: 'draft', owner: { fullName: 'Ravi', mobile: '9876543210' }, editedContent: big },
    { id: 'a2', status: 'completed', owner: { fullName: 'Sita' } },
  ];
  await google.writeAll('agreements', items);

  const rows = fake.tabs.get('agreements');
  assert.equal(rows[0][0], 'id');
  assert.ok(rows[0].includes('owner.fullName'));
  assert.equal(rows[1][rows[0].indexOf('owner.fullName')], 'Ravi'); // client Sheet-la paakkalaam
  assert.ok(rows[0].filter((h) => h.startsWith('data_')).length >= 3);
  assert.ok(rows.flat().every((cell) => String(cell).length <= 50000));

  const parsed = google.parseRows(rows);
  assert.deepEqual(parsed.items, items);
});

test('collections: shrinking list clears old rows and old chunk cells', async () => {
  const fake = fakeClients();
  google.setClients(fake);
  await google.writeAll('uploads', [{ id: 'u1', blob: 'y'.repeat(100000) }, { id: 'u2' }, { id: 'u3' }]);
  await google.writeAll('uploads', [{ id: 'u2' }]);
  const parsed = google.parseRows(fake.tabs.get('uploads'));
  assert.deepEqual(parsed.items, [{ id: 'u2' }]);
});

test('files: save, overwrite, read, delete on Drive', async () => {
  const fake = fakeClients();
  google.setClients(fake);
  await google.saveFile('uploads/k1.enc', Buffer.from('hello'));
  await google.saveFile('uploads/k1.enc', Buffer.from('updated'));
  assert.equal(fake.files.size, 1);
  assert.equal((await google.readFile('uploads/k1.enc')).toString(), 'updated');
  await google.deleteFile('uploads/k1.enc');
  assert.equal(fake.files.size, 0);
});
