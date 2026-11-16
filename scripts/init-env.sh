#!/usr/bin/env bash
# Tworzy lokalny plik `.env` z losowym kluczem AES-256.
# Skrypt odmawia nadpisania istniejącego pliku.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -f .env ]; then
  echo "Plik .env już istnieje — nie nadpisuję." >&2
  exit 1
fi

if ! command -v openssl >/dev/null 2>&1; then
  echo "Brak narzędzia openssl. Zainstaluj je albo wpisz klucz ręcznie do .env." >&2
  exit 1
fi

crypto_key="$(openssl rand -base64 32)"

cat > .env <<EOF
POSTGRES_DB=task_encoder
POSTGRES_USER=task_encoder
POSTGRES_PASSWORD=change-me

DB_URL=jdbc:postgresql://localhost:5432/task_encoder
DB_USERNAME=task_encoder
DB_PASSWORD=change-me

APP_CRYPTO_KEY=${crypto_key}

SPRING_PROFILES_ACTIVE=local
SESSION_COOKIE_SECURE=false
EOF

chmod 600 .env
echo "Utworzono .env z nowym kluczem AES-256 (32 bajty, base64)."
echo "Zachowaj kopię klucza — bez niego zapisane wiadomości pozostaną nieczytelne."
