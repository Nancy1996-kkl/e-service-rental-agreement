// Oru registered user-ah ADMIN-ah maathum.
//
// 1. Website-la normal-ah Register pannunga (admin-ku use panna pora email)
// 2. Main folder-la run pannunga:  npm run create-admin -- admin@example.com
//
// Remove panna: npm run create-admin -- admin@example.com --remove

import 'dotenv/config';
import { findUserByEmail, updateUser } from '../src/services/userService.js';

const email = process.argv[2];
const remove = process.argv.includes('--remove');
if (!email || !email.includes('@')) {
  console.error('Usage: npm run create-admin -- you@example.com');
  process.exit(1);
}

const user = await findUserByEmail(email);
if (!user) {
  console.error(`❌ No account found for ${email}. Register on the website first, then run this again.`);
  process.exit(1);
}

await updateUser(user.id, { role: remove ? 'client' : 'admin', isActive: true });
console.log(remove ? `✅ ${email} is now a normal client.` : `✅ ${email} is now an ADMIN. Log in and open /admin`);
