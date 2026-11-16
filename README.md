# Task Encoder — szyfrowanie wiadomości

Aplikacja demonstracyjna do szyfrowania, zapisywania i odczytywania wiadomości. Treść jest
szyfrowana po stronie serwera algorytmem AES-256-GCM, a w bazie PostgreSQL przechowywany jest
wyłącznie szyfrogram. Każdy użytkownik widzi tylko własne wiadomości.

Projekt jest odpowiednikiem rozbudowanej aplikacji rekrutacyjnej, napisanym od zera w wersji
**Junior core** dla backendu i **Mid** dla frontendu. Celem jest pokazanie pełnego, działającego
przepływu oraz świadomych uproszczeń względem wersji produkcyjnej.

**Repozytorium:** <https://github.com/Aszlaczek/task-encoder>

## Status

Etap 2 — działający szkielet backendu: Spring Boot, migracja `app_users`, BCrypt, konta
demonstracyjne i healthcheck. Testy jednostkowe: **9/9**.

| Etap | Zakres | Status |
|---:|---|---|
| 1 | Inicjalizacja repo, README, `.env.example`, skrypt klucza | ✅ |
| 2 | Spring Boot, PostgreSQL, konta demonstracyjne | ✅ |
| 3 | Logowanie sesyjne i CSRF | ⏳ |
| 4 | Szyfrowanie i deszyfrowanie AES-256-GCM | ⏳ |
| 5 | Wiadomości, paginacja i usuwanie | ⏳ |
| 6 | Docker Compose, nginx i healthchecki | ⏳ |
| 7 | Frontend: React, design system, logowanie | ⏳ |
| 8 | Frontend: panel szyfrowania i wiadomości | ⏳ |
| 9 | Testy RTL i E2E Playwright | ⏳ |
| 10 | CI, dokumentacja API i zrzuty ekranu | ⏳ |

## Planowany stack

| Warstwa | Technologie |
|---|---|
| Backend | Spring Boot 3.5.16, Java 21, Spring Security, JPA, Flyway |
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

## Bezpieczeństwo

- AES-256-GCM z losowym nonce (12 B) i tagiem 128 bitów.
- AAD wiąże pakiet z właścicielem — inny użytkownik nie odszyfruje przechwyconego pakietu.
- Właściciel pochodzi wyłącznie z sesji, nigdy z ciała żądania.
- Cudzy i nieistniejący zasób zwracają identyczne `404`.
- Brak jawnej treści wiadomości w bazie i w logach.
- Aplikacja **nie jest E2EE** — backend posiada klucz i widzi tekst jawny.
- Klucz AES jest wymagany przy starcie; brak lub zły klucz blokuje uruchomienie.

## Uruchomienie

Wymagania: JDK 21, Node 22, Docker (dla PostgreSQL). Konfigurację środowiska przygotuje:

```bash
./scripts/init-env.sh
```

Skrypt tworzy ignorowany przez Git plik `.env` z losowym kluczem AES-256 (base64, 32 bajty)
i odmawia nadpisania istniejącego pliku.

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

Testy jednostkowe backendu nie wymagają bazy ani Dockera:

```bash
cd backend
./mvnw test
```

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
