// STEP 1 of Google setup — Google account login panni "refresh token" edukkum.
//
// Munnaadi: server/.env-la GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET podanum (DEPLOYMENT.md paarunga).
// Run (main folder-la):  npm run google:auth
//
// Permission: "drive.file" mattum — indha app create panna files-ah mattum dhaan touch pannum,
// unga Drive-la irukka mathha files-ah paakkavum mudiyaadhu.

import 'dotenv/config';
import http from 'node:http';
import { OAuth2Client } from 'google-auth-library';

const PORT = 5051;
const REDIRECT = `http://localhost:${PORT}/oauth2callback`;
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error('❌ GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in server/.env first.');
  process.exit(1);
}

const client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT);
const url = client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/drive.file'],
});

const server = http.createServer(async (req, res) => {
  const { pathname, searchParams } = new URL(req.url, REDIRECT);
  if (pathname !== '/oauth2callback') return res.end();
  try {
    const { tokens } = await client.getToken(searchParams.get('code'));
    res.end('Done! You can close this tab and go back to the terminal.');
    console.log('\n✅ Success! Add this line to server/.env:\n');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
    console.log('Next: npm run google:setup');
  } catch (err) {
    res.end('Something went wrong — check the terminal.');
    console.error('❌', err.message);
  } finally {
    server.close();
  }
});

server.listen(PORT, () => {
  console.log('\n1. Open this link in your browser and sign in with the CLIENT\'s Google account:\n');
  console.log(url);
  console.log('\n2. Allow access. Waiting...');
});
