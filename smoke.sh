#!/usr/bin/env bash
# Boots `wrangler dev` against local D1 and checks every route.
# Assumes migrations are applied locally: npm run migrate:local
# Usage: ./smoke.sh
set -euo pipefail
PORT=${PORT:-8791}
B="http://localhost:$PORT"
K=$(sed -n 's/^ADMIN_TOKEN="\(.*\)"$/\1/p' .dev.vars)
KE=$(node -e "console.log(encodeURIComponent(process.argv[1]))" "$K")

npm run css >/dev/null
npx wrangler dev --port "$PORT" >/tmp/bikes-smoke.log 2>&1 &
DEV=$!
trap 'kill $DEV 2>/dev/null' EXIT
until curl -sf -o /dev/null "$B/"; do sleep 1; done

code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
cnt() { npx wrangler d1 execute bikes --local --json \
  --command "SELECT COUNT(*) c FROM $1" 2>/dev/null | grep -oE '"c": [0-9]+' | grep -oE '[0-9]+'; }
check() { [ "$2" = "$3" ] || { echo "FAIL $1: got '$2' want '$3'"; exit 1; }; echo "ok $1"; }

check "public page renders"      "$(code "$B/")" "200"
check "public page lists bikes"  "$(curl -s "$B/" | grep -c 'Per mile:')" "$(cnt bikes)"
check "public ships no js"       "$(curl -s "$B/" | grep -c '<script' || true)" "0"
check "static asset served"      "$(code "$B/app.css")" "200"
check "admin needs a token"      "$(code "$B/update")" "404"
check "admin rejects bad token"  "$(code "$B/update?k=nope")" "404"
check "admin opens with token"   "$(code "$B/update?k=$KE")" "200"
check "unknown path 404s"        "$(code "$B/definitely-not-here")" "404"

BEFORE=$(cnt mileage_updates)
check "log mileage"              "$(code -X POST "$B/update/mileage?k=$KE&bike=1" -d 'miles=999')" "200"
check "mileage row written"      "$(cnt mileage_updates)" "$((BEFORE + 1))"

ID=$(npx wrangler d1 execute bikes --local --json --command \
  "SELECT MAX(id) c FROM mileage_updates" 2>/dev/null | grep -oE '"c": [0-9]+' | grep -oE '[0-9]+')
check "delete mileage"           "$(code -X POST "$B/update/delete?k=$KE&bike=1&kind=mileage&id=$ID")" "200"
check "mileage row removed"      "$(cnt mileage_updates)" "$BEFORE"

check "non-numeric mileage 400s" "$(code -X POST "$B/update/mileage?k=$KE&bike=1" -d 'miles=abc')" "400"
check "empty component 400s"     "$(code -X POST "$B/update/component?k=$KE&bike=1" -d 'name=&brand=x&cost=1')" "400"
check "unknown delete kind 400s" "$(code -X POST "$B/update/delete?k=$KE&bike=1&kind=bikes&id=1")" "400"
check "kind cannot inject sql"   "$(code -X POST "$B/update/delete?k=$KE&bike=1&kind=x;DROP+TABLE+bikes&id=1")" "400"
check "tables survived"          "$(npx wrangler d1 execute bikes --local --json --command \
  "SELECT COUNT(*) c FROM sqlite_master WHERE type='table' AND name IN ('bikes','mileage_updates','components','events')" \
  2>/dev/null | grep -oE '"c": [0-9]+' | grep -oE '[0-9]+')" "4"

# --- bike editing and tab switching ---
check "tab panel needs token"    "$(code "$B/update/panel?bike=1")" "404"
check "tab panel returns fragment" "$(curl -s "$B/update/panel?k=$KE&bike=2" | head -c 20 | grep -c 'admin-panel')" "1"
check "tab panel shows that bike" "$(curl -s "$B/update/panel?k=$KE&bike=2" | grep -c 'Kiwi Maddog')" "$(curl -s "$B/update/panel?k=$KE&bike=2" | grep -c 'Kiwi Maddog')"

# The edit endpoint is a full-record overwrite, so snapshot the whole row and
# put it back afterwards rather than restoring field by field.
snap() { npx wrangler d1 execute bikes --local --json --command \
  "SELECT * FROM bikes WHERE id=1" 2>/dev/null \
  | node -e "const j=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log(JSON.stringify(j[0].results[0]))"; }
BEFORE_ROW=$(snap)
# description is left out so a test can supply its own without duplicating the
# key, which would win the form.get() lookup and silently no-op the check.
FIELDS=$(node -e "const b=JSON.parse(process.argv[1]);
console.log(['name','brand','model','status','bike_type','initial_price','miles_at_acquire']
  .map(k=>k+'='+encodeURIComponent(b[k]??'')).join('&'))" "$BEFORE_ROW")
DESC=$(node -e "console.log('description='+encodeURIComponent(JSON.parse(process.argv[1]).description??''))" "$BEFORE_ROW")

check "edit bike saves" "$(code -X POST "$B/update/bike?k=$KE&bike=1" -d "$FIELDS&description=SMOKE_TEST")" "200"
check "description changed" "$(npx wrangler d1 execute bikes --local --json --command \
  "SELECT description d FROM bikes WHERE id=1" 2>/dev/null | grep -c 'SMOKE_TEST')" "1"
check "edit rejects empty name" "$(code -X POST "$B/update/bike?k=$KE&bike=1" -d 'name=&brand=x&model=y&initial_price=1')" "400"
check "status is constrained" "$(code -X POST "$B/update/bike?k=$KE&bike=1" -d "$FIELDS&$DESC&status=DROP")" "200"
check "bad status fell back"  "$(npx wrangler d1 execute bikes --local --json --command \
  "SELECT status s FROM bikes WHERE id=1" 2>/dev/null | grep -c '"s": "active"')" "1"

# Restore through SQL, not the form. Rebuilding a form body means keeping a
# field list in sync with the form by hand, and this endpoint overwrites every
# column, so any field the list forgets gets silently blanked.
node -e "
const b=JSON.parse(process.argv[1]);
const cols=['name','brand','model','description','status','bike_type','initial_price','miles_at_acquire','photo','acquire_date'];
const lit=v=>v===null||v===undefined?'NULL':typeof v==='number'?v:\"'\"+String(v).replace(/'/g,\"''\")+\"'\";
console.log('UPDATE bikes SET '+cols.map(c=>c+'='+lit(b[c])).join(', ')+' WHERE id=1;')" "$BEFORE_ROW" > /tmp/bikes-restore.sql
npx wrangler d1 execute bikes --local --yes --file=/tmp/bikes-restore.sql >/dev/null 2>&1
# Compare every column, so a forgotten field fails the run instead of hiding.
check "smoke restored the row" "$(node -e "
const a=JSON.parse(process.argv[1]), b=JSON.parse(process.argv[2]);
const diff=Object.keys(a).filter(k=>k!=='updated_at'&&String(a[k])!==String(b[k]));
console.log(diff.length?'drifted: '+diff.join(','):'same')" "$BEFORE_ROW" "$(snap)")" "same"

# --- export seam for ~/projects/data ---
check "export needs a token"     "$(code "$B/api/export")" "404"
check "export rejects bad token" "$(code "$B/api/export?k=nope")" "404"
check "export opens with token"  "$(code "$B/api/export?k=$KE")" "200"

EXPORT=$(curl -s "$B/api/export?k=$KE")
jqish() { node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log($1)" <<<"$EXPORT"; }
check "export names its source"  "$(jqish 'd.source')" "bikes"
check "export counts bikes"      "$(jqish 'd.bikes.length')" "$(cnt bikes)"
check "export counts mileage"    "$(jqish 'd.mileage_updates.length')" "$(cnt mileage_updates)"
check "export counts components" "$(jqish 'd.components.length')" "$(cnt components)"
check "export counts events"     "$(jqish 'd.events.length')" "$(cnt events)"
check "export keeps row ids"     "$(jqish 'd.bikes.every(b=>Number.isInteger(b.id))')" "true"
check "export uses unix seconds" "$(jqish 'd.bikes.every(b=>b.created_at>1e9&&b.created_at<2e9)')" "true"

# Two consecutive pulls must agree on every table, or the consumer would see
# phantom changes. exported_at is provenance and is expected to differ.
strip() { node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));delete d.exported_at;console.log(JSON.stringify(d))"; }
A=$(curl -s "$B/api/export?k=$KE" | strip)
Z=$(curl -s "$B/api/export?k=$KE" | strip)
check "export is stable"         "$([ "$A" = "$Z" ] && echo same || echo differs)" "same"

# --- photos in D1 ---
# Note: this leaves bike 1 with no photo locally. Local D1 is scratch; rebuild
# it with `npm run migrate:local`, the seed file, and ./scripts/import-photos.sh
PNG=/tmp/bikes-smoke-pixel.png
node -e "require('fs').writeFileSync('$PNG',Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==','base64'))"
check "upload needs a token"   "$(code -X POST "$B/update/photo?bike=1" -F "photo=@$PNG")" "404"
check "upload rejects no file" "$(code -X POST "$B/update/photo?k=$KE&bike=1")" "400"
check "upload rejects non-image" "$(code -X POST "$B/update/photo?k=$KE&bike=1" -F "photo=@smoke.sh;type=text/plain")" "400"
check "upload accepts an image" "$(code -X POST "$B/update/photo?k=$KE&bike=1" -F "photo=@$PNG;type=image/png")" "200"
check "photo is served"        "$(code "$B/photos/1")" "200"
check "photo keeps its mime"   "$(curl -sI "$B/photos/1" | grep -ci 'content-type: image/png')" "1"
check "photo is public"        "$(code "$B/photos/1")" "200"
check "versioned url is immutable" "$(curl -sI "$B/photos/1?v=1" | grep -ci 'immutable')" "1"
check "missing photo 404s"     "$(code "$B/photos/999")" "404"
check "bikes query skips bytes" "$(curl -s "$B/api/export?k=$KE" | grep -c 'bytes')" "0"
check "photo removed"          "$(code -X POST "$B/update/photo/remove?k=$KE&bike=1")" "200"
check "removed photo 404s"     "$(code "$B/photos/1")" "404"
rm -f "$PNG"

echo "all smoke checks passed"
