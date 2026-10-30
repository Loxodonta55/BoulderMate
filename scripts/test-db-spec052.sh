#!/usr/bin/env bash
# SPEC-052 · KI-Routenerfassung in einem lokalen, frischen Postgres 16 prüfen. Ändert nichts an Supabase.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
export PATH="$PGBIN:$PATH"
WORK="$(mktemp -d)"
PORT="${PORT:-55452}"
RUNAS=()
if [ "$(id -u)" = "0" ]; then
  id bmtest >/dev/null 2>&1 || useradd -M -s /bin/false bmtest
  chown -R bmtest "$WORK"
  RUNAS=(runuser -u bmtest --)
fi
cleanup() { "${RUNAS[@]}" pg_ctl -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT

"${RUNAS[@]}" initdb -D "$WORK/data" -U postgres -A trust >/dev/null
"${RUNAS[@]}" pg_ctl -D "$WORK/data" -o "-p $PORT -k $WORK -c listen_addresses=''" -l "$WORK/log" -w start >/dev/null
PSQL=("${RUNAS[@]}" psql -h "$WORK" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q)

echo "1) Supabase-Nachbau, schema.sql und Vorgänger-Migrationen"
"${PSQL[@]}" < "$ROOT/tests/db/supabase_stub.sql"
# Supabase hat auth.users.created_at; der Nachbau bisher nicht
"${PSQL[@]}" -c "ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();"
"${PSQL[@]}" < "$ROOT/supabase/schema.sql" >/dev/null
"${PSQL[@]}" < "$ROOT/tests/db/spec034_daten.sql"
for f in 20261009_spec034_schreibrechte; do
  "${PSQL[@]}" < "$ROOT/supabase/migrations/$f.sql" >/dev/null
done

echo "2) SPEC-052-Migration zweimal (wiederholbar)"
"${PSQL[@]}" < "$ROOT/supabase/migrations/20261027_spec052_ki_routenerfassung.sql" >/dev/null 2>&1
"${PSQL[@]}" < "$ROOT/supabase/migrations/20261027_spec052_ki_routenerfassung.sql" >/dev/null 2>&1

echo "3) Prüfungen"
OUT="$("${PSQL[@]}" < "$ROOT/tests/db/spec052_ki.sql" 2>&1)" && STATUS=0 || STATUS=$?
echo "$OUT" | grep -E "ok  |FEHLER|ERROR" || true
[ "$STATUS" = "0" ] || { echo "FEHLGESCHLAGEN"; exit 1; }
echo "SPEC-052: alle Prüfungen bestanden"
