#!/usr/bin/env bash
# Downloads the official store badge artwork into public/badges/.
# Apple: black "Download on the App Store" (US English), from Apple's marketing guidelines.
# Google: "Get it on Google Play" (English, web colour), from Google's badge package.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/badges"; TMP="$(mktemp -d)"; mkdir -p "$OUT"
curl -fsSL -o "$OUT/app-store.svg" "https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
# Google's package sits behind a signed link that expires, so read the current link from the badges page.
ZIP_URL="$(curl -fsSL "https://play.google.com/intl/en_us/badges/" | grep -oE 'https://storage.googleapis.com/[^"]+\.zip[^"]*' | head -1 | sed 's/&amp;/\&/g')"
curl -fsSL -o "$TMP/gp.zip" "$ZIP_URL"
unzip -o -j -q "$TMP/gp.zip" "Google Play Badge guidelines/Get it on Google Play Badges/Digital/svg/GetItOnGooglePlay_Badge_Web_color_English.svg" -d "$TMP"
cp "$TMP/GetItOnGooglePlay_Badge_Web_color_English.svg" "$OUT/google-play.svg"
chmod 644 "$OUT/app-store.svg" "$OUT/google-play.svg"
rm -rf "$TMP"
grep -q 'viewBox="0 0 119.66407 40"' "$OUT/app-store.svg"
grep -q 'viewBox="0 0 238.96 70.87"' "$OUT/google-play.svg"
echo "badges ok"
