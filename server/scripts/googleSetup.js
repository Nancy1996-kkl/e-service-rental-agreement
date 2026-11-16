// STEP 2 of Google setup — Google Sheet & Drive folder create pannum.
//
// Run (main folder-la):  npm run google:setup
// Mudinjadhum print aagura 2 lines-ah server/.env-la podunga, STORAGE=google nu maathunga.

import 'dotenv/config';
import { OAuth2Client } from 'google-auth-library';
import { sheets as sheetsApi } from '@googleapis/sheets';
import { drive as driveApi } from '@googleapis/drive';
import { READABLE_COLUMNS } from '../src/storage/googleStore.js';

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
  console.error('❌ Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REFRESH_TOKEN in server/.env first (npm run google:auth).');
  process.exit(1);
}

const auth = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
auth.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
const sheets = sheetsApi({ version: 'v4', auth });
const drive = driveApi({ version: 'v3', auth });

// 1. Drive folder (Aadhaar files encrypted-ah inga store aagum)
const folder = await drive.files.create({
  requestBody: { name: 'E-Service Rental Agreements — Files', mimeType: 'application/vnd.google-apps.folder' },
  fields: 'id, webViewLink',
});

// 2. Spreadsheet — ovvoru collection-kum oru tab
const tabs = Object.keys(READABLE_COLUMNS);
const sheet = await sheets.spreadsheets.create({
  requestBody: {
    properties: { title: 'E-Service Rental Agreements — Data' },
    sheets: tabs.map((title) => ({ properties: { title, gridProperties: { frozenRowCount: 1 } } })),
  },
  fields: 'spreadsheetId,spreadsheetUrl',
});

// Sheet-ah folder-kulla move pannrom (ellaam oru idathula)
await drive.files.update({ fileId: sheet.data.spreadsheetId, addParents: folder.data.id, fields: 'id' });

console.log('\n✅ Created!');
console.log(`   Sheet:  ${sheet.data.spreadsheetUrl}`);
console.log(`   Folder: ${folder.data.webViewLink}\n`);
console.log('Add these lines to server/.env:\n');
console.log(`GOOGLE_SHEET_ID=${sheet.data.spreadsheetId}`);
console.log(`GOOGLE_DRIVE_FOLDER_ID=${folder.data.id}`);
console.log('STORAGE=google\n');
console.log('Already have local data? Run: npm run google:migrate');
console.log('⚠️  Do NOT share this sheet or folder publicly — it contains personal details.');
