#!/usr/bin/env bash
# Renders public/og.png (1200x630) from scripts/og/og.html with headless Chrome.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files \
  --force-device-scale-factor=1 --window-size=1200,630 --virtual-time-budget=3000 \
  --screenshot="$ROOT/public/og.png" "file://$ROOT/scripts/og/og.html" 2>/dev/null
python3 -c "from PIL import Image; im=Image.open('$ROOT/public/og.png'); assert im.size==(1200,630), im.size; im.convert('RGB').save('$ROOT/public/og.png', optimize=True); print('og.png', im.size)"
