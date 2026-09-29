import { execFileSync } from 'node:child_process';
import { LIVE_REF } from './context.mjs';

export const LEGACY_FILES = ['index.html', 'privacy.html', 'terms.html', 'contact.html', 'child-safety.html', 'delete-account.html', 'delete-account-received.html'];

export default function legacyUrls(ctx) {
  const errors = LEGACY_FILES.filter((f) => !ctx.exists(f)).map((f) => `missing legacy page ${f}`);
  const liveCname = execFileSync('git', ['show', `${LIVE_REF}:CNAME`], { encoding: 'utf8' });
  if (!ctx.exists('CNAME') || ctx.read('CNAME') !== liveCname) errors.push('CNAME missing or changed from the live site');
  const verify = ctx.exists('index.html') && ctx.doc('index.html').querySelector('meta[name="google-site-verification"]');
  if (verify?.getAttribute('content') !== 'YebptMeSaMRmH9P3XirwODk8zuesbpQQuMm41_QLcAE') errors.push('google-site-verification meta missing on index.html');
  return errors;
}
