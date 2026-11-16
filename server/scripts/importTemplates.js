// Word templates-ah website-ku import pannra command.
//
// Usage (server folder-la irundhu):
//   npm run import-templates
//
// Enna pannum: server/templates-docx/ folder-la irukka ellaa .docx files-um
// HTML-ah convert panni save pannum. Pudhu file pottaa pudhu template-ah varum,
// already irukka file-ah maathinaa update aagum.

import { importAllFromFolder, DOCX_DIR } from '../src/services/templateService.js';

const report = await importAllFromFolder();

if (!report.length) {
  console.log(`No .docx files found in ${DOCX_DIR}`);
  process.exit(1);
}

let problemCount = 0;
for (const { id, file, problems } of report) {
  console.log(`${problems.length ? '⚠️ ' : '✅'} ${file}  →  template id: "${id}"`);
  problems.forEach((p) => console.log(`     - ${p}`));
  problemCount += problems.length;
}

console.log(`\nImported ${report.length} template(s).${problemCount ? ` Fix ${problemCount} problem(s) above and run again.` : ''}`);
