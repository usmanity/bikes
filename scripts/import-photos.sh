#!/usr/bin/env bash
# One-time: push the photos that used to live in public/photos into D1 through
# the real upload route. Usage: ./scripts/import-photos.sh <base-url>
# e.g. ./scripts/import-photos.sh http://localhost:8797
set -euo pipefail
BASE="${1:?usage: import-photos.sh <base-url>}"
K=$(sed -n 's/^ADMIN_TOKEN="\(.*\)"$/\1/p' .dev.vars)

# bike id : source file, matching the bikes.photo column as it shipped.
while IFS=: read -r ID FILE; do
  [ -f "$FILE" ] || { echo "skip $ID ($FILE missing)"; continue; }
  # Shrink first: the originals are far larger than the card that shows them,
  # and one exceeds the server's 2MB cap on its own.
  TMP=$(mktemp -t bikephoto).jpg
  sips -Z 1600 -s format jpeg -s formatOptions 80 "$FILE" --out "$TMP" >/dev/null
  CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST \
    "$BASE/update/photo?k=$K&bike=$ID" -F "photo=@$TMP;type=image/jpeg")
  echo "bike $ID <- $FILE  ($(stat -f '%z' "$TMP") bytes)  HTTP $CODE"
  rm -f "$TMP"
done <<'LIST'
1:public/photos/tenways.jpeg
2:public/photos/sirrusx.webp
3:public/photos/surron.jpg
4:public/photos/bigred.jpg
LIST
