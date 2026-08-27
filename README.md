# Hvězdy app

PWA motivační aplikace — rodič přiděluje dětem hvězdičky za aktivity, děti si za ně plní přání.

## Architektura

```
pwa-hvezdy/
├── client/           ← React (Vite, TypeScript) — PWA frontend
├── server/           ← Fastify (TypeScript) — REST API + session auth
├── Dockerfile        ← Multi-stage build (client + server → node:alpine)
├── docker-compose.yml ← Lokální dev (PostgreSQL + app)
└── .github/workflows/deploy.yml ← CI/CD → registry.pslib.cloud
```

**Produkce:** Jeden Docker kontejner — Fastify servíruje API (`/api/*`) i statické soubory (React build).

## Tech stack

| Vrstva | Technologie |
|--------|-------------|
| Frontend | React 19, Vite 8, TypeScript, Mantine v9, TanStack Query, react-router v7 |
| Backend | Fastify 5, TypeScript |
| ORM | Drizzle ORM + drizzle-kit (migrace) |
| Databáze | PostgreSQL (poskytuje VPS hosting) |
| Auth | Google OAuth 2.0 → HTTP-only cookie session (v DB) |
| Deploy | GitHub Actions → Docker → registry.pslib.cloud/sandbox/app-133 |

## Lokální vývoj

### Prerekvizity

- Node.js 22+
- Docker (pro PostgreSQL) nebo lokální PostgreSQL instance

### Spuštění (nejjednodušší – celá app v Dockeru)

```bash
# 1. Vytvoř .env v kořeni projektu (viz níže) – docker compose ho načte automaticky
# 2. Build + start (Fastify servíruje API i React na http://localhost:3000)
docker compose up -d --build
```

Migrace se aplikují automaticky při startu serveru (`runMigrations()` v `index.ts`).

> **Windows + Docker Desktop:** port je mapován jako `127.0.0.1:3000:3000` (jen IPv4). Mapování na IPv6 `[::]` totiž forwarding do kontejneru zrušilo (`ERR_CONNECTION_ABORTED` na `localhost`). Otevři **http://localhost:3000**.

### Spuštění (dev režim s hot-reload)

```bash
# 1. Nainstaluj závislosti
cd client && npm install
cd ../server && npm install

# 2. Spusť PostgreSQL (Docker)
docker compose up db -d

# 3. Spusť server (port 3000) – migrace proběhnou při startu
cd server
npm run dev

# 4. Spusť client (port 5173, proxy /api → localhost:3000)
cd ../client
npm run dev
```

> Migrace generuješ přes `npx drizzle-kit generate` (čte `DATABASE_URL`). Drizzle `migrate()` z Windows hostu proti Docker DB se ale zasekává (ECONNRESET) – spolehlivě běží uvnitř Docker sítě (server v kontejneru migruje sám).

### Testy

Vitest (Fastify `app.inject`, reálná PostgreSQL). Kvůli zasekávání migrací z Windows hostu spouštěj testy **uvnitř Docker sítě**:

```bash
docker compose up db -d
docker run --rm --network pwa-hvezdy_default \
  -e DATABASE_URL=postgresql://postgres:postgres@db:5432/hvezdy \
  -v "$PWD/server:/src:ro" node:22-alpine \
  sh -c "cp -r /src /app && cd /app && rm -rf node_modules dist && npm install && npx vitest run"
```

Testy v `server/src/test/`: `auth`, `families`, `children-transactions`, `wishes`, `new-major-refactor`, `self-fulfill` (ověřuje přesný tvar webhook payloadu přes lokální mock server).

### Env proměnné (server)

Pro `docker compose` stačí `.env` v **kořeni projektu** (compose ho načte automaticky). Pro dev režim serveru lze místo toho vytvořit `server/.env` nebo nastavit v shellu:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hvezdy
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
SESSION_SECRET=libovolny-nahodny-retezec
BASE_URL=http://localhost:3000
ADMIN_EMAIL=tvuj@email.com
```

## Produkční env proměnné (VPS Sandbox)

| Proměnná | Popis |
|----------|-------|
| `ConnectionStrings__Sandbox` | PostgreSQL connection string (poskytuje hosting) |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `SESSION_SECRET` | Tajný klíč pro podpis session cookie |
| `BASE_URL` | `https://hvezdy.pslib.cloud` |
| `ADMIN_EMAIL` | Email Google účtu admina |

## GitHub Secrets

| Secret | Účel |
|--------|------|
| `SANDBOX_BUILD_TOKEN` | Token pro push do registry.pslib.cloud |

## DB schema (Drizzle)

Definice: `server/src/db/schema.ts` · Migrace: `server/src/db/migrations/` (0000–0005)

> **Verze 2 (greenfield):** datový model byl přepracován na zelené louce, stará data se nemigrují.

| Tabulka | Účel |
|---------|------|
| `users` | Uživatelé (Google OAuth, role parent/child, vazba na family) |
| `families` | Rodiny (unikátní 8-znakový kód pro připojení rodičů) |
| `child_invitations` | 12-znakové kódy pro registraci dětí; `usageCount` = kolikrát byl kód použit (vícenásobný) |
| `transactions` | Pohyby hvězdiček (±`amount`, `wishId` u splněných přání, `authorId`) |
| `wishes` | Přání – viz níže (cena, persistence, self-fulfillment + webhook pole) |
| `activity_types` | Kategorie činností (`value` + `direction` = `plus`/`minus`) |
| `sessions` | Session storage (connect-pg-simple) |

**Tabulka `wishes` – klíčová pole:**

| Sloupec | Význam |
|---------|--------|
| `starCost` | Cena v hvězdách (u self-fulfillment = výchozí/child-set cena) |
| `isPersistent` | Opakované přání (po splnění zůstává v seznamu) |
| `isSelfFulfillment` | Speciální přání, které si dítě splní samo a zavolá webhook |
| `multiplier` | Koeficient: `PARAMETR = cena × multiplier` |
| `webhookUrl` | Cíl POST požadavku (nastaví rodič; dítěti se v API nevrací) |
| `webhookSecret` | Tajný klíč posílaný v těle jako `secret` (nikdy se nevrací klientovi) |
| `webhookParamName` | Název JSON klíče pro parametr (např. `minutes`) |

## API endpoints

### Auth
- `GET /api/auth/google` — přesměrování na Google OAuth
- `GET /api/auth/callback` — OAuth callback, vytvoření session
- `GET /api/auth/me` — info o přihlášeném uživateli + `isAdmin` flag
- `POST /api/auth/logout` — odhlášení

### Families
- `GET /api/families/mine` — info o rodině aktuálního uživatele
- `POST /api/families` — založit rodinu (generuje kód)
- `POST /api/families/join` — připojit se kódem (jako rodič)

### Children
- `POST /api/child-invitations` — vygenerovat klíč pro dítě (rodič)
- `GET /api/child-invitations` — seznam klíčů (rodič)
- `DELETE /api/child-invitations/:id` — smazat nepoužitý klíč (rodič)
- `POST /api/children/register` — registrace dítěte klíčem
- `GET /api/children` — seznam dětí v rodině s balance (rodič)
- `DELETE /api/children/:id` — odebrat dítě z rodiny (rodič)

### Transactions
- `GET /api/transactions?childId=X` — výpis pohybů (rodič: libovolné dítě, dítě: jen vlastní)
- `POST /api/transactions` — přidat/odebrat hvězdičky (rodič; `amount` může být záporný, volitelně `wishId`)
- `DELETE /api/transactions/:id` — smazat chybně zadaný pohyb (rodič, v rámci rodiny)

### Wishes
- `GET /api/wishes` — seznam přání (dítě vidí dosažitelnost; `webhookSecret` se nikdy nevrací, dítě nevidí ani `webhookUrl`)
- `POST /api/wishes` — nové přání (rodič i dítě; self-fulfillment/webhook pole nastaví jen rodič)
- `PATCH /api/wishes/:id` — úprava přání (rodič; `webhookSecret` se přepíše jen když je zadán neprázdný)
- `DELETE /api/wishes/:id` — smazání (rodič)
- `POST /api/wishes/:id/fulfill` — rodič splní přání dítěti, odečte hvězdičky
- `POST /api/wishes/:id/self-fulfill` — **dítě** si samo splní speciální přání: `PARAMETR = cena × multiplier`, nejdřív zavolá webhook (`{ child, <webhookParamName>: PARAMETR, secret }`), a při úspěchu odečte hvězdy
- `GET /api/wishes/fulfilled?childId=X` — historie splněných přání (transakce s `wishId`)

### Activity Types
- `GET /api/activity-types` — seznam kategorií (rodič)
- `POST /api/activity-types` — nová kategorie (rodič)
- `PATCH /api/activity-types/:id` — úprava (rodič)
- `DELETE /api/activity-types/:id` — smazání (rodič)

### Admin (`ADMIN_EMAIL`)
- `GET/DELETE /api/admin/users[/:id]`
- `GET/POST/PATCH/DELETE /api/admin/families[/:id]`
- `GET/DELETE /api/admin/child-invitations[/:id]`

## Registrační flow

1. Uživatel se přihlásí přes Google → `GET /api/auth/me` vrací `familyId: null`
2. **Rodič:** "Založit rodinu" (`POST /api/families`) nebo "Připojit se" (`POST /api/families/join` + kód)
3. Rodič vygeneruje klíč pro dítě (`POST /api/child-invitations`)
4. **Dítě:** přihlásí se Google → zadá klíč → `POST /api/children/register`

## Self-fulfillment přání + webhook

Speciální typ přání, které si **dítě splní samo** a jeho splnění zavolá externí službu (např. přidání minut času přes Home Assistant webhook).

**Model:** cenu (hvězdy) zadá dítě, koeficient nastaví rodič → `PARAMETR = cena × multiplier`.

**Konfigurace (rodič)** je uložena přímo v tabulce `wishes`: `webhookUrl`, `webhookSecret`, `webhookParamName`, `multiplier`, `isSelfFulfillment`, `isPersistent`.

**Průběh splnění** (`POST /api/wishes/:id/self-fulfill`):
1. Ověří, že je to self-fulfillment přání a dítě má dost hvězd
2. Spočítá `PARAMETR = cena × multiplier`
3. **Nejdřív** zašle HTTP POST na `webhookUrl` (timeout 8 s), až při úspěchu odečte hvězdy (při chybě webhooku 502, hvězdy zůstanou)
4. Tvar těla: `{ "child": <jméno dítěte>, "<webhookParamName>": <PARAMETR>, "secret": <webhookSecret> }`

Příklad odchozího požadavku:

```bash
curl -X POST https://ha.kazda.org/api/webhook/hvezdicky_api_9a8b7c6d5e \
  -H "Content-Type: application/json" \
  -d '{"child":"John Doe","minutes":333,"secret":"THRK2026"}'
```

**Bezpečnost:** `webhookSecret` se nikdy nevrací klientovi (server ho v odpovědích stráví a nabízí jen příznak `hasWebhookSecret`); děti navíc nevidí `webhookUrl`. Při `PATCH` se secret přepíše jen když je zadán neprázdný. URL se validuje na `http/https`.

## Další kroky (TODO)

- [x] Nastavit Google OAuth Console (Authorized redirect URIs: `http://localhost:3000/api/auth/callback` + `https://hvezdy.pslib.cloud/api/auth/callback`)
- [x] Vygenerovat první Drizzle migraci (`cd server && npx drizzle-kit generate`)
- [x] Implementovat frontend UI (routing, auth context, stránky pro rodiče/děti)
- [x] Přidat PWA ikony (`client/public/icons/icon-192.png`, `icon-512.png`)
- [x] Nastavit VPS env proměnné
- [x] Přidat GitHub Secret `SANDBOX_BUILD_TOKEN`
- [x] Otestovat celý deploy flow

## Kontext projektu (pro obnovení práce s LLM)

### Klíčová rozhodnutí

- **Bez Firebase** — původně plánované, přepracováno na vlastní backend (Fastify + PostgreSQL) kvůli hostingu poskytujícímu DB zdarma a přirozenějšímu SQL modelu
- **Jeden kontejner** — Fastify servíruje i React static soubory (žádný nginx, žádný reverzní proxy)
- **Session v DB** — ne JWT; cookie `httpOnly`, `sameSite: lax`, `secure` v produkci; session tabulku vytvoří `connect-pg-simple` automaticky
- **Admin není DB role** — admin je určen env proměnnou `ADMIN_EMAIL`, může být zároveň rodič
- **Balance se nepočítá denormalizovaně** — vždy `SELECT SUM(amount) FROM transactions WHERE child_id = X`
- **Greenfield v2** — datový model přepsán na zelené louce (bez migrace starých dat); `activity_types` mají `value`+`direction`, `child_invitations` mají `usageCount`, splněná přání se sledují přes `transactions.wishId`
- **Přidat/odebrat hvězdy + mazání** — transakce může mít záporný `amount`; chybně zadaný pohyb lze smazat (`DELETE /api/transactions/:id`, rodič)
- **Self-fulfillment webhook v DB** — URL/secret/param name/multiplier jsou sloupce tabulky `wishes` (ne env); secret se nikdy neposílá klientovi
- **IPv4 port binding** — `docker-compose.yml` mapuje `127.0.0.1:3000:3000`, jinak IPv6 forwarding na Windows shazuje spojení (`ERR_CONNECTION_ABORTED`)
- **Testy uvnitř Docker sítě** — drizzle `migrate()` z Windows hostu proti Docker DB se zasekává; `vitest` má `exclude: ['dist/**']` a běhí single-worker; spouštět uvnitř sítě `pwa-hvezdy_default`
- **Drizzle migrace** — `drizzle-kit generate` vytvoří SQL soubory v `server/src/db/migrations/`, server je aplikuje při startu (`runMigrations()` v `index.ts`)
- **PWA bez vite-plugin-pwa** — Vite 8 nepodporuje plugin; řešeno manuálně (`public/manifest.json` + `public/sw.js` + registrace v `main.tsx`)
- **PostCSS workaround** — Vite 8 v monorepu chybně hledá PostCSS config v parent dirs; opraveno inline PostCSS konfigurací ve `vite.config.ts` s `postcss-preset-mantine` a `postcss-simple-vars`
- **Mantine v9 CSS Modules** — UI knihovna sjednocující designový jazyk celé aplikace; primárně mobilní layout (bottom tab bar, drawery, carousely)
- **TanStack Query jako datová vrstva** — serverová data žijí v query cache (staleTime 30s), ne v custom state; Context+reducer drží jen UI/derivace (role, online stav, aktivní dítě)
- **Žádné offline mutations** — v offline stavu se zápisové akce deaktivují (<OfflineGate>) a uživatel je informován; žádný IndexedDB, Redux Offline ani optimistic updates
- **Service worker multi-strategy** — app shell precache (cache-first), API GET = NetworkFirst s 3s timeoutem + fallback do runtime cache, mutace v offline = syntetická 503 `X-Offline:1`

### Omezení VPS hostingu (Sandbox pslib.cloud)

- Kontejner běží pod Linuxem
- Zápis pouze do `/data`
- PostgreSQL connection string v env `ConnectionStrings__Sandbox`
- Deploy = `docker push registry.pslib.cloud/sandbox/app-133:latest` (hosting si sám pullne nový image)
- Žádný SSH deploy, žádný docker-compose na serveru

### Stav implementace

| Část | Stav |
|------|------|
| Monorepo struktura (`client/` + `server/`) | ✅ Hotovo |
| Server: Fastify entry point, plugins, routes | ✅ Hotovo (kompiluje bez chyb) |
| Server: Drizzle schema (7 tabulek, greenfield v2 + webhook pole) | ✅ Hotovo |
| Server: Google OAuth + session plugin | ✅ Hotovo |
| Server: Všechny API routes (auth, families, children, transactions, wishes, activity-types, admin) | ✅ Hotovo |
| Server: Mazání transakcí (`DELETE /api/transactions/:id`) | ✅ Hotovo |
| Server: Self-fulfillment přání + volání webhooku (secret skrytý v API) | ✅ Hotovo |
| Client: Vite config s proxy `/api` | ✅ Hotovo |
| Client: PWA manifest + service worker (multi-strategy) | ✅ Hotovo |
| Client: Mantine v9 tema + providery (Query, Router, Context) | ✅ Hotovo |
| Client: Datová vrstva (apiFetch, TanStack Query hooks, mutations) | ✅ Hotovo |
| Client: Globální stav (Context + reducer, online status) | ✅ Hotovo |
| Client: Routing + guards (RequireAuth/Role/Admin/Onboarded) | ✅ Hotovo |
| Client: AppShell layout + BottomTabs (rodič 4 / dítě 3) | ✅ Hotovo |
| Client: Login + Onboarding (Stepper, PinInput) | ✅ Hotovo |
| Client: Rodičovské stránky (Children, Wishes, Activities, More) | ✅ Hotovo |
| Client: Mazání pohybů + self-fulfillment UI (rodič konfig / dítě splní) | ✅ Hotovo |
| Client: Dětské stránky (MyStars, Wishes, More) | ✅ Hotovo |
| Client: Admin stránky (Users, Families, Invitations) | ✅ Hotovo |
| Client: Sdílené komponenty (StarBalance, DataState, OfflineGate, EmptyState, OnlineStatusBanner) | ✅ Hotovo |
| Dockerfile (multi-stage) | ✅ Hotovo |
| docker-compose (lokální dev) | ✅ Hotovo |
| GitHub Actions workflow | ✅ Hotovo |
| Drizzle migrace (vygenerované SQL) | ✅ 0000–0005 |
| Testy (auth, families, children, wishes, self-fulfill) – běží v Docker síti | ✅ 34 testů |
| Google OAuth nastavení v Console | ✅ Hotovo |
| VPS env proměnné | ✅ Hotovo |

### Soubory klíčové pro pochopení backendu

- `server/src/db/schema.ts` — kompletní datový model (tabulky, relace, enumy)
- `server/src/db/seed.ts` — výchozí data pro `activity_types` + testovací uživatele/rodiny
- `server/src/test/setup.ts` — bootstrap testovací DB (migrace + seed rodiny/uživatelů/přání) + `buildApp(userId)`
- `server/src/plugins/session.ts` — nastavení session storage v PostgreSQL
- `server/src/plugins/auth.ts` — middleware `requireAuth`, `requireParent`, `requireAdmin` + user loading z session
- `server/src/routes/wishes.ts` — nejkomplexnější route (fulfill + self-fulfill s webhookem, serializace skrývající secret)
- `server/src/db/index.ts` — pool + drizzle instance, čte `ConnectionStrings__Sandbox` || `DATABASE_URL`

### Soubory klíčové pro pochopení frontendu

- `client/src/main.tsx` — vstupní bod s providery (Mantine, QueryClient, BrowserRouter, AppProvider) a definicí routes
- `client/src/theme.ts` — Mantine téma (primaryColor grape, defaultRadius md)
- `client/src/state/AppContext.tsx` — globální stav (user, role, isAdmin, activeChildId, online) + reducer
- `client/src/api/client.ts` — `apiFetch()` wrapper (OfflineError, HttpError, credentials include)
- `client/src/api/queries.ts` — TanStack Query hooks pro všechny GET endpointy
- `client/src/api/mutations.ts` — mutation hooks s invalidacemi a notifikacemi
- `client/src/layout/AppShellLayout.tsx` — Mantine AppShell s header + BottomTabs (role-dependent)
- `client/src/routes/guards.tsx` — route guards (RequireAuth, RequireOnboarded, RequireRole, RequireAdmin)
- `client/public/sw.js` — service worker (app-shell precache, NetworkFirst API, StaleWhileRevalidate assets)

### Konvence kódu

- ESM (`"type": "module"`) v obou packages
- Importy s `.js` příponou (Node.js ESM requirement)
- Fastify JSON Schema validace na route úrovni (property `schema` v route options)
- Drizzle: `eq()`, `and()`, `sql` template tag pro raw SQL
- Role guards jako `preHandler` hooks na jednotlivých routes
- Frontend: Mantine CSS Modules pro custom styly (`.module.css`)
- Frontend: TanStack Query hooks pojmenované `use<Entity>()` / `use<Action><Entity>()`
- Frontend: Sdílené komponenty v `src/components/`, stránky v `src/pages/`, layout v `src/layout/`
- Frontend: Offline-aware UI — zápisové akce obaleně `<OfflineGate>`, GET přes `<DataState>` (skeleton/error/offline)

