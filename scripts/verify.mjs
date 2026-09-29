// Post-build checks over dist/. Usage: npm run build && npm run verify
import { existsSync } from 'node:fs';
import { makeContext } from './checks/context.mjs';
import checks from './checks/index.mjs';

const dist = process.argv[2] ?? 'dist';
if (!existsSync(dist)) {
  console.error(`${dist}/ not found - run \`npm run build\` first`);
  process.exit(1);
}
const ctx = makeContext(dist);
let failed = 0;
for (const [name, check] of Object.entries(checks)) {
  const errors = check(ctx);
  console.log(`${errors.length ? '✗' : '✓'} ${name}`);
  errors.forEach((e) => console.log(`    ${e}`));
  failed += errors.length;
}
if (failed) {
  console.log(`\n${failed} problem(s)`);
  process.exit(1);
}
console.log('\nall checks passed');
