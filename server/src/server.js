import 'dotenv/config'; // .env file-la irukka values load aagum (idhu mothalla varanum)
import { env } from './config/env.js';
import app from './app.js';
import { ensureTemplatesSeeded } from './services/templateService.js';
import { ensureDefaultClauses } from './services/clauseService.js';

// Templates illana templates-docx/ folder-la irundhu load pannittu dhaan server start aagum
await ensureTemplatesSeeded();
await ensureDefaultClauses();

app.listen(env.port, () => {
  console.log(`✅ Server running on http://localhost:${env.port}`);
});
