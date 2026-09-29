import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseHTML } from 'linkedom';

export const LIVE_REF = 'e9f8589'; // last commit of the hand-written site (live on 2026-09-29)

export function makeContext(dist) {
  const docs = new Map();
  return {
    dist,
    exists: (f) => existsSync(join(dist, f)),
    read: (f) => readFileSync(join(dist, f), 'utf8'),
    doc(f) {
      if (!docs.has(f)) docs.set(f, parseHTML(readFileSync(join(dist, f), 'utf8')).document);
      return docs.get(f);
    },
    htmlFiles: () => readdirSync(dist).filter((f) => f.endsWith('.html')),
    legacy(f) {
      const html = execFileSync('git', ['show', `${LIVE_REF}:${f}`], { encoding: 'utf8', maxBuffer: 1 << 26 });
      return parseHTML(html).document;
    },
  };
}

export const norm = (s) => s.replace(/\s+/g, ' ').trim();
