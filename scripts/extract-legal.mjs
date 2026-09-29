// Writes the Termly-generated bodies of privacy.html / terms.html, exactly as
// they were live at commit e9f8589, to src/content/legal/. Run once; the output
// is committed and must never be hand-edited.
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { parseHTML } from 'linkedom';

const REF = 'e9f8589';
mkdirSync('src/content/legal', { recursive: true });
for (const name of ['privacy', 'terms']) {
  const html = execFileSync('git', ['show', `${REF}:${name}.html`], { encoding: 'utf8', maxBuffer: 1 << 26 });
  const body = parseHTML(html).document.querySelector('.legal-content > [data-custom-class="body"]');
  if (!body) throw new Error(`${name}: Termly body not found`);
  writeFileSync(`src/content/legal/${name}.html`, `${body.outerHTML}\n`);
  console.log(name, body.outerHTML.length, 'chars');
}
