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
| Frontend | React 19, Vite 8, TypeScript |
| Backend | Fastify 5, TypeScript |
| ORM | Drizzle ORM + drizzle-kit (migrace) |
| Databáze | PostgreSQL (poskytuje VPS hosting) |
| Auth | Google OAuth 2.0 → HTTP-only cookie session (v DB) |
| Deploy | GitHub Actions → Docker → registry.pslib.cloud/sandbox/app-133 |

## Lokální vývoj

### Prerekvizity

- Node.js 22+
- Docker (pro PostgreSQL) nebo lokální PostgreSQL instance

### Spuštění

```bash
# 1. Nainstaluj závislosti
cd client && npm install
cd ../server && npm install

# 2. Spusť PostgreSQL (Docker)
docker compose up db -d

# 3. Vygeneruj a spusť migrace
cd server
npx drizzle-kit generate
npx drizzle-kit migrate

# 4. Spusť server (port 3000)
npm run dev

# 5. Spusť client (port 5173, proxy /api → localhost:3000)
cd ../client
npm run dev
```

### Env proměnné (server)

Vytvoř `server/.env` nebo nastav v shellu:

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

Definice: `server/src/db/schema.ts`

| Tabulka | Účel |
|---------|------|
| `users` | Uživatelé (Google OAuth, role parent/child, vazba na family) |
| `families` | Rodiny (unikátní 8-znakový kód pro připojení rodičů) |
| `child_invitations` | Jednorázové kódy pro registraci dětí do rodiny |
| `transactions` | Pohyby hvězdiček (±amount, vazba na dítě + autora) |
| `wishes` | Přání (cena, persistence, stav splnění) |
| `activity_types` | Kategorie činností (s výchozím počtem hvězdiček) |
| `sessions` | Session storage (connect-pg-simple) |

## API endpoints

### Auth
- `GET /api/auth/google` — přesměrování na Google OAuth
- `GET /api/auth/callback` — OAuth callback, vytvoření session
- `GET /api/auth/me` — info o přihlášeném uživateli + `isAdmin` flag
- `POST /api/auth/logout` — odhlášení

### Families
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
- `POST /api/transactions` — přidat/odebrat hvězdičky (rodič)

### Wishes
- `GET /api/wishes` — seznam přání (dítě vidí dosažitelnost)
- `POST /api/wishes` — nové přání (rodič i dítě, dítě nemůže nastavit cenu)
- `PATCH /api/wishes/:id` — úprava ceny/persistence (rodič)
- `DELETE /api/wishes/:id` — smazání (rodič)
- `POST /api/wishes/:id/fulfill` — splnění přání, odečte hvězdičky (rodič)
- `GET /api/wishes/fulfilled?childId=X` — historie splněných přání

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

## Další kroky (TODO)

- [ ] Nastavit Google OAuth Console (Authorized redirect URIs: `http://localhost:3000/api/auth/callback` + `https://hvezdy.pslib.cloud/api/auth/callback`)
- [ ] Vygenerovat první Drizzle migraci (`cd server && npx drizzle-kit generate`)
- [ ] Implementovat frontend UI (routing, auth context, stránky pro rodiče/děti)
- [ ] Přidat PWA ikony (`client/public/icons/icon-192.png`, `icon-512.png`)
- [ ] Nastavit VPS env proměnné
- [ ] Přidat GitHub Secret `SANDBOX_BUILD_TOKEN`
- [ ] Otestovat celý deploy flow

## Kontext projektu (pro obnovení práce s LLM)

### Klíčová rozhodnutí

- **Bez Firebase** — původně plánované, přepracováno na vlastní backend (Fastify + PostgreSQL) kvůli hostingu poskytujícímu DB zdarma a přirozenějšímu SQL modelu
- **Jeden kontejner** — Fastify servíruje i React static soubory (žádný nginx, žádný reverzní proxy)
- **Session v DB** — ne JWT; cookie `httpOnly`, `sameSite: lax`, `secure` v produkci; session tabulku vytvoří `connect-pg-simple` automaticky
- **Admin není DB role** — admin je určen env proměnnou `ADMIN_EMAIL`, může být zároveň rodič
- **Balance se nepočítá denormalizovaně** — vždy `SELECT SUM(amount) FROM transactions WHERE child_id = X`
- **Drizzle migrace** — `drizzle-kit generate` vytvoří SQL soubory v `server/src/db/migrations/`, server je aplikuje při startu (`runMigrations()` v `index.ts`)
- **PWA bez vite-plugin-pwa** — Vite 8 nepodporuje plugin; řešeno manuálně (`public/manifest.json` + `public/sw.js` + registrace v `main.tsx`)
- **PostCSS workaround** — Vite 8 v monorepu chybně hledá PostCSS config v parent dirs; opraveno inline `css: { postcss: {} }` ve `vite.config.ts`

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
| Server: Drizzle schema (7 tabulek) | ✅ Hotovo |
| Server: Google OAuth + session plugin | ✅ Hotovo |
| Server: Všechny API routes (auth, families, children, transactions, wishes, activity-types, admin) | ✅ Hotovo |
| Client: Vite config s proxy `/api` | ✅ Hotovo |
| Client: PWA manifest + service worker | ✅ Hotovo |
| Client: UI stránky (routing, komponenty) | ❌ Neimplementováno |
| Dockerfile (multi-stage) | ✅ Hotovo |
| docker-compose (lokální dev) | ✅ Hotovo |
| GitHub Actions workflow | ✅ Hotovo |
| Drizzle migrace (vygenerované SQL) | ❌ Nutno spustit `drizzle-kit generate` |
| Google OAuth nastavení v Console | ❌ Nutno udělat ručně |
| VPS env proměnné | ❌ Nutno nastavit |

### Soubory klíčové pro pochopení backendu

- `server/src/db/schema.ts` — kompletní datový model (tabulky, relace, enumy)
- `server/src/plugins/auth.ts` — middleware `requireAuth`, `requireParent`, `requireAdmin` + user loading z session
- `server/src/routes/wishes.ts` — nejkomplexnější route (fulfill = atomická operace: kontrola balance → insert transakce → update/delete wish)
- `server/src/db/index.ts` — pool + drizzle instance, čte `ConnectionStrings__Sandbox` || `DATABASE_URL`

### Konvence kódu

- ESM (`"type": "module"`) v obou packages
- Importy s `.js` příponou (Node.js ESM requirement)
- Fastify JSON Schema validace na route úrovni (property `schema` v route options)
- Drizzle: `eq()`, `and()`, `sql` template tag pro raw SQL
- Role guards jako `preHandler` hooks na jednotlivých routes

