# Task Encoder — szyfrowanie wiadomości

Aplikacja demonstracyjna do szyfrowania, zapisywania i odczytywania wiadomości. Treść jest
szyfrowana po stronie serwera algorytmem AES-256-GCM, a w bazie PostgreSQL przechowywany jest
wyłącznie szyfrogram. Każdy użytkownik widzi tylko własne wiadomości.

Projekt jest odpowiednikiem rozbudowanej aplikacji rekrutacyjnej, napisanym od zera w wersji
**Junior core** dla backendu i **Mid** dla frontendu. Celem jest pokazanie pełnego, działającego
przepływu oraz świadomych uproszczeń względem wersji produkcyjnej.

**Repozytorium:** <https://github.com/Aszlaczek/task-encoder>

[![CI](https://github.com/Aszlaczek/task-encoder/actions/workflows/ci.yml/badge.svg)](https://github.com/Aszlaczek/task-encoder/actions/workflows/ci.yml)

## Status

Etap 10 — CI, dokumentacja API i zrzuty ekranu. Testy: backend **45/45**, frontend RTL **27/27**, E2E **8/8**.

| Etap | Zakres | Status |
|---:|---|---|
| 1 | Inicjalizacja repo, README, `.env.example`, skrypt klucza | ✅ |
| 2 | Spring Boot, PostgreSQL, konta demonstracyjne | ✅ |
| 3 | Logowanie sesyjne i CSRF | ✅ |
| 4 | Szyfrowanie i deszyfrowanie AES-256-GCM | ✅ |
| 5 | Wiadomości, paginacja i usuwanie | ✅ |
| 6 | Docker Compose, nginx i healthchecki | ✅ |
| 7 | Frontend: React, design system, logowanie | ✅ |
| 8 | Frontend: panel szyfrowania i wiadomości | ✅ |
| 9 | Testy RTL i E2E Playwright | ✅ |
| 10 | CI, dokumentacja API i zrzuty ekranu | ✅ |

## Planowany stack

| Warstwa | Technologie |
|---|---|
| Backend | Spring Boot 3.5.16, Java 21, Spring Security, JPA, Flyway, springdoc-openapi |
| Baza | PostgreSQL 16 |
| Frontend | React 19, Vite 7, TypeScript 6, Tailwind CSS 4 |
| Frontend — stan i formularze | TanStack Query, React Router, React Hook Form, Zod |
| Testy | JUnit 5, Mockito, MockMvc, Vitest, Testing Library, Playwright |
| Infra | Docker Compose, nginx, GitHub Actions |

## Zakres funkcjonalny

- logowanie sesyjne na kontach demonstracyjnych `alice` i `bob`,
- szyfrowanie tekstu bez zapisu,
- szyfrowanie z zapisem w bazie,
- deszyfrowanie wklejonego pakietu,
- lista własnych wiadomości z paginacją,
- podgląd pakietu i deszyfrowanie zapisanej wiadomości,
- usuwanie własnej wiadomości,
- walidacja danych, CSRF i spójne odpowiedzi błędów,
- responsywny interfejs z trybem jasnym i ciemnym.

## API

Aktualnie zaimplementowane endpointy:

| Metoda | Ścieżka | Opis |
|---|---|---|
| `GET` | `/api/auth/csrf` | token CSRF i nazwy cookie/nagłówka |
| `POST` | `/api/auth/login` | logowanie sesyjne, zwraca `{ id, username }` |
| `GET` | `/api/auth/me` | dane zalogowanego użytkownika |
| `POST` | `/api/auth/logout` | wylogowanie, `204` |
| `POST` | `/api/crypto/encrypt` | szyfrowanie tekstu bez zapisu, zwraca `{ packet }` |
| `POST` | `/api/crypto/decrypt` | deszyfrowanie pakietu w kontekście zalogowanego użytkownika, zwraca `{ plaintext }` |
| `POST` | `/api/messages` | szyfrowanie z zapisem, zwraca `{ id, createdAt, packet }` (`201`) |
| `GET` | `/api/messages` | lista własnych wiadomości (paginacja `page`, `size`), zwraca podsumowania bez pakietu |
| `GET` | `/api/messages/{id}` | szczegóły własnej wiadomości z pakietem |
| `POST` | `/api/messages/{id}/decrypt` | odszyfrowanie zapisanej wiadomości, zwraca `{ plaintext }` |
| `DELETE` | `/api/messages/{id}` | usunięcie własnej wiadomości, `204` |
| `GET` | `/actuator/health` | healthcheck |

Interaktywna dokumentacja jest generowana z kodu przez springdoc-openapi:

- Swagger UI: <http://localhost:3000/api/docs.html>,
- specyfikacja OpenAPI 3 w JSON: <http://localhost:3000/api/docs>.

Dokumentacja jest publiczna, bo nie zawiera danych użytkowników. Korzystanie z „Try it out”
wymaga jednak zalogowania i nagłówka `X-XSRF-TOKEN` zgodnego z cookie `XSRF-TOKEN`. Przy
uruchomieniu frontendu przez Vite ten sam prefiks `/api` działa pod `http://localhost:5173`.

Mutacje wymagają nagłówka `X-XSRF-TOKEN` zgodnego z cookie `XSRF-TOKEN`. Brak sesji daje
`401 UNAUTHENTICATED`, odrzucony token CSRF `403 CSRF_INVALID`, nieprawidłowy lub cudzy
pakiet szyfrogramu `400 CRYPTO_PAYLOAD_INVALID`, a cudza lub nieistniejąca wiadomość
`404 MESSAGE_NOT_FOUND`. Błędy mają wspólny format:

```json
{
  "code": "INVALID_CREDENTIALS",
  "message": "Nieprawidłowy login lub hasło.",
  "timestamp": "2026-11-16T11:47:09Z",
  "fieldErrors": []
}
```

## Bezpieczeństwo

- AES-256-GCM z losowym nonce (12 B) i tagiem 128 bitów.
- AAD wiąże pakiet z właścicielem — inny użytkownik nie odszyfruje przechwyconego pakietu.
- Właściciel pochodzi wyłącznie z sesji, nigdy z ciała żądania.
- Cudzy i nieistniejący zasób zwracają identyczne `404`.
- Brak jawnej treści wiadomości w bazie i w logach.
- Aplikacja **nie jest E2EE** — backend posiada klucz i widzi tekst jawny.
- Klucz AES jest wymagany przy starcie; brak lub zły klucz blokuje uruchomienie.

## Uruchomienie

Wymagania: JDK 21, Node 22, Docker (z Compose). Przygotuj lokalny plik `.env` (ignorowany przez Git), np. kopiując `.env.example` i uzupełniając wartości:

```bash
cp .env.example .env
```

Wygeneruj klucz AES-256 (32 bajty, Base64) i wpisz go jako `APP_CRYPTO_KEY` w `.env`:

```bash
openssl rand -base64 32
```

### Docker Compose (frontend + backend + baza + nginx)

```bash
docker compose up --build
```

- Aplikacja: `http://localhost:3000` — nginx serwuje zbudowany frontend i przekazuje `/api`
  oraz `/actuator/health` do backendu.
- Healthcheck: `curl http://localhost:3000/actuator/health`
- `APP_CRYPTO_KEY` musi być ustawiony w `.env` (inaczej backend nie wystartuje).
- Zatrzymanie i usunięcie kontenerów: `docker compose down` (wolumen bazy: `docker compose down -v`).

### Frontend (lokalnie)

```bash
cd frontend
npm ci
npm run dev
```

Aplikacja: `http://localhost:5173`. Vite przekazuje `/api` i `/actuator` do
`http://localhost:8080` (można zmienić przez `VITE_API_PROXY_TARGET`), więc backend trzeba
uruchomić osobno.

Struktura frontendu:

| Katalog | Zawartość |
|---|---|
| `app/` | routing, provider zapytań, layout i ochrona tras |
| `features/auth/` | logowanie, sesja, mutacje i ekran logowania |
| `features/crypto/` | formularze szyfrowania i deszyfrowania, zapytania i walidacja |
| `features/messages/` | lista wiadomości, paginacja, podgląd pakietu, deszyfrowanie i usuwanie |
| `features/dashboard/` | panel główny łączący obszary funkcjonalne |
| `shared/api/` | klient JSON, obsługa CSRF i mapowanie błędów |
| `shared/ui/` | design system: przyciski, pola, alerty, karty, paginacja, motyw |
| `shared/lib/` | drobne helpery (`cn`, motyw jasny/ciemny) |
| `test/` | helpery dla testów React Testing Library i stubów `fetch` |
| `styles/` | Tailwind CSS 4 i style bazowe |
| `e2e/` | testy Playwright oraz helpery cyklu życia Docker Compose |
| `playwright.config.ts` | konfiguracja E2E: Chromium, `baseURL`, start i zatrzymanie stosu |

Panel wiadomości korzysta z TanStack Query (klucze z zapytaniami, `placeholderData` przy
paginacji, invalidacja cache po mutacjach). Formularze używają React Hook Form z resolverem Zod,
a błędy pól z backendu są mapowane na odpowiednie kontrolki. Wszystkie operacje wymagające
sesji obsługują `401` przez wygaśnięcie sesji po stronie klienta.

### Lokalnie (bez Compose dla backendu)

Backend wymaga działającego PostgreSQL 16. Samą bazę można uruchomić tak:

```bash
docker run --rm -d --name task-encoder-db \
  -e POSTGRES_DB=task_encoder \
  -e POSTGRES_USER=task_encoder \
  -e POSTGRES_PASSWORD=change-me \
  -p 5432:5432 postgres:16-alpine
```

Następnie:

```bash
cd backend
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
./mvnw spring-boot:run
curl http://localhost:8080/actuator/health
```

### Testy

Testy backendu (jednostkowe i slice) nie wymagają bazy ani Dockera:

```bash
cd backend
./mvnw test
```

Testy RTL, lint, formatowanie i build frontendu:

```bash
cd frontend
npm test
npm run lint
npm run format:check
npm run build
```

Testy komponentów znajdują się obok testowanych modułów (`*.test.tsx`). Poprawki formatowania
można nanieść poleceniem `npm run format`, a automatyczne naprawy lintu `npm run lint:fix`.

Testy end-to-end (Playwright, Chromium) uruchamiamy z katalogu `frontend`. Przed pierwszym
uruchomieniem trzeba zainstalować przeglądarkę:

```bash
cd frontend
npm run test:e2e:install
npm run test:e2e
```

Główny zestaw ma **8 testów**: logowanie, szyfrowanie, wiadomości, izolacja kont i dokumentacja
API. Domyślnie używa `http://127.0.0.1:3000`; adres można nadpisać zmienną `E2E_BASE_URL`.
Jeśli stos już działa, Playwright wykorzystuje go i nie zatrzymuje po testach. W przeciwnym razie
sam uruchamia `docker compose up --build -d`, czeka na healthcheck i wywołuje `docker compose down`
po zakończeniu. Tryb interaktywny uruchamia `npm run test:e2e:ui`.

Osobny przebieg generuje 6 zrzutów ekranu (jasny i ciemny motyw logowania, panel, odszyfrowana
wiadomość, widok mobilny i Swagger UI):

```bash
cd frontend
npm run test:screenshots
```

Pliki trafiają do `frontend/test-results/screenshots/`, który jest ignorowany przez Git. W CI są
publikowane jako artefakt zamiast być commitowane do repozytorium.

## CI

Workflow `.github/workflows/ci.yml` uruchamia się przy pushu i pull requeście do `main` oraz
ręcznie (`workflow_dispatch`). Ma trzy równoległe joby:

| Job | Zakres | Artefakt |
|---|---|---|
| `backend` | `./mvnw -q test` (Java 21) | raport Surefire |
| `frontend` | `format:check`, `lint`, `npm test`, `build` (Node 22) | `frontend/dist` |
| `e2e` | Playwright E2E + zrzuty, Docker Compose | raport HTML, `openapi.json` i PNG |

Klucz `APP_CRYPTO_KEY` jest generowany losowo w kroku E2E (`openssl rand -base64 32`) i nie jest
zapisywany w repozytorium. Nie trzeba dodawać żadnych GitHub Secrets.

## Świadome uproszczenia

Projekt celowo używa prostszych rozwiązań niż wersja referencyjna:

- BCrypt zamiast Argon2id,
- paginacja offsetowa (`page` / `size`) zamiast kursorowej,
- uproszczony format pakietu `v1.<nonce>.<ciphertext+tag>`,
- prosty format błędów JSON zamiast pełnego RFC 9457,
- brak limitera logowania i operacji crypto,
- klucz w zmiennej środowiskowej zamiast pliku sekretu,
- brak publicznej rejestracji, resetu hasła i rotacji kluczy.

## Konta demonstracyjne

Konta są tworzone wyłącznie w profilu `local` (domyślnym podczas pracy lokalnej):

| Login | Hasło |
|---|---|
| `alice` | `AliceDemo123!` |
| `bob` | `BobDemo1234!` |

Poświadczenia są jawne i służą wyłącznie do demonstracji. Nie należy używać ich poza projektem.

## Licencja

Projekt udostępniany na licencji MIT — szczegóły w pliku [`LICENSE`](LICENSE).
