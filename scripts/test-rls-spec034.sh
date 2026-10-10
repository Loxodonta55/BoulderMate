#!/usr/bin/env bash
# SPEC-034 · Schreibrechte in einem lokalen, frischen Postgres 16 prüfen.
# Braucht: initdb, pg_ctl, psql (z. B. apt install postgresql-16). Ändert nichts an Supabase.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
export PATH="$PGBIN:$PATH"
WORK="$(mktemp -d)"
PORT="${PORT:-55434}"
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

echo "1) Supabase-Nachbau und schema.sql"
"${PSQL[@]}" < "$ROOT/tests/db/supabase_stub.sql"
"${PSQL[@]}" < "$ROOT/supabase/schema.sql" >/dev/null
"${PSQL[@]}" < "$ROOT/tests/db/spec034_vorher.sql"
"${PSQL[@]}" < "$ROOT/tests/db/spec034_daten.sql"

echo "2) Migration zweimal (AC-7)"
"${PSQL[@]}" < "$ROOT/supabase/migrations/20261009_spec034_schreibrechte.sql"
"${PSQL[@]}" < "$ROOT/supabase/migrations/20261009_spec034_schreibrechte.sql"

echo "3) Prüfungen AC-1 bis AC-6"
"${PSQL[@]}" < "$ROOT/tests/db/spec034_rls.sql" 2>&1 | grep -E "ok  |FEHLER|ERROR" || true
"${PSQL[@]}" < "$ROOT/tests/db/spec034_rls.sql" >/dev/null 2>&1 || { echo "FEHLGESCHLAGEN"; exit 1; }

echo "4) Notfall-Datei (AC-8), danach Migration erneut"
"${PSQL[@]}" < "$ROOT/supabase/migrations/20261009_spec034_notfall_zurueck.sql"
"${PSQL[@]}" < "$ROOT/tests/db/spec034_notfall_check.sql" 2>&1 | grep -E "ok  |ERROR" || true
"${PSQL[@]}" < "$ROOT/tests/db/spec034_notfall_check.sql" >/dev/null 2>&1 || { echo "NOTFALL FEHLGESCHLAGEN"; exit 1; }
"${PSQL[@]}" < "$ROOT/supabase/migrations/20261009_spec034_schreibrechte.sql"
"${PSQL[@]}" < "$ROOT/tests/db/spec034_rls.sql" >/dev/null 2>&1 || { echo "NACH NOTFALL FEHLGESCHLAGEN"; exit 1; }

echo "5) Weitere Migrationen (SPEC-033/036/038/041/042) zweimal einspielen und prüfen"
for f in 20261009_spec033_sichtbarkeit 20261009_spec036_treff_plus 20261009_spec038_challenge 20261009_spec041_auslastung 20261009_spec042_gruppen; do
  "${PSQL[@]}" < "$ROOT/supabase/migrations/$f.sql"
  "${PSQL[@]}" < "$ROOT/supabase/migrations/$f.sql"
done
"${PSQL[@]}" < "$ROOT/tests/db/weitere_rls.sql" 2>&1 | grep -E "ok  |FEHLER|ERROR" || true
"${PSQL[@]}" < "$ROOT/tests/db/weitere_rls.sql" >/dev/null 2>&1 || { echo "WEITERE FEHLGESCHLAGEN"; exit 1; }

echo "SPEC-034 und weitere Migrationen: alle Prüfungen bestanden"
