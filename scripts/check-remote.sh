#!/usr/bin/env bash
# Checks a deployed copy of the site. Usage: scripts/check-remote.sh https://host
set -uo pipefail
BASE="${1:?usage: check-remote.sh https://host}"
TMP="$(mktemp)"; trap 'rm -f "$TMP"' EXIT
fail=0
check() { # path, expected HTTP status (after redirects), extended regex the body must match
  local got; got=$(curl -s -L -o "$TMP" -w '%{http_code}' "$BASE$1")
  if [ "$got" != "$2" ] || ! grep -qE "$3" "$TMP"; then echo "✗ $1 → $got (want $2 containing '$3')"; fail=1; else echo "✓ $1"; fi
}
check /                              200 'Social, out loud.'
check /index.html                    200 'Social, out loud.'
for p in privacy privacy.html privacy/; do check "/$p" 200 'PRIVACY POLICY'; done
for p in terms terms.html; do check "/$p" 200 'TERMS OF SERVICE'; done
for p in contact contact.html; do check "/$p" 200 'hear from you'; done
for p in child-safety child-safety.html; do check "/$p" 200 'Child Safety Standards'; done
# Netlify post-processes detected forms: attributes are re-quoted and data-netlify is removed.
for p in delete-account delete-account.html; do check "/$p" 200 "<form[^>]*name=[\"']delete-account[\"']"; done
if curl -s "$BASE/delete-account" | grep -oE '<form[^>]*>' | grep -q 'data-netlify'; then echo "✗ delete-account form was not processed by Netlify Forms"; fail=1; else echo "✓ delete-account form processed by Netlify Forms"; fi
for p in delete-account-received delete-account-received.html; do check "/$p" 200 'Request received'; done
check /features                      200 'Everything you can say'
check /safety                        200 'Tools to keep Cascane yours'
check /sitemap-index.xml             200 'sitemap-0.xml'
check /sitemap-0.xml                 200 'https://www.cascane.app/features'
check /robots.txt                    200 'Sitemap: https://www.cascane.app/sitemap-index.xml'
check /site.webmanifest              200 '"name": "Cascane"'
check /this-page-does-not-exist      404 'Lost signal.'
for f in og.png favicon.ico badges/app-store.svg badges/google-play.svg; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/$f"); [ "$code" = 200 ] && echo "✓ /$f" || { echo "✗ /$f → $code"; fail=1; }
done
echo "x-robots-tag on /: $(curl -sI "$BASE/" | grep -i '^x-robots-tag' | tr -d '\r' || echo '(none)')"
exit $fail
