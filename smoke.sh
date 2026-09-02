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

echo "all smoke checks passed"
