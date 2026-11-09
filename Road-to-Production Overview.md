# Road‑to‑Production Overview

## 1️⃣ Initial Project Bootstrap (already done)
| Item | Status |
|------|--------|
| `npm init -y` | ✅ |
| Add **scripts** (`dev`, `build`, `start`, `seed`) | ✅ |
| Install **dependencies** (`next`, `react`, `prisma`, `tailwindcss`, `next-auth`, `zod`, `zustand`, …) | ✅ |
| Create **`tsconfig.json`** for a TypeScript‑based Next.js app. | ✅ |
| Add **Prisma schema** (`prisma/schema.prisma`) (SQLite `dev.db` + full data model). | ✅ |
| **Dependency install** – still running; you’ll be notified when it finishes. |
| **Project structure** – no source files yet – to be created next. |

## 2️⃣ Core Configuration Files
| File | Purpose |
|------|---------|
| `tailwind.config.js` | Tailwind CSS setup |
| `postcss.config.js` | PostCSS pipeline |
| `next.config.js` | Next.js custom config |
| `.env.local` | Runtime env vars (dev DB, JWT secret) |
| `.eslintrc.json` & `.prettierrc` | Lint/format standards |
| `jest.config.js` | Unit‑test runner |
| `README.md` | Project docs |

*Add the files above and commit them.*

## 3️⃣ Database Preparation
| Step | Command | Explanation |
|------|---------|-------------|
| **Create SQLite DB** (dev) | `npx prisma migrate dev --name init` | Generates `dev.db` and migration files. |
| **Generate Prisma client** | `npx prisma generate` | Makes `@prisma/client` usable in code. |
| **Seed script** (`prisma/seed.ts`) | `npm run seed` | Inserts dummy data for rooms, facilities, meals, users, bookings. |
| **Add `seed` script** | Already added to `package.json` | Run once after migration. |

*Seed data example is included in the file.*

## 4️⃣ Folder Structure (MVC per PRD)
```
hotel-booking/
├─ prisma/
│   ├─ schema.prisma
│   └─ seed.ts
├─ src/
│   ├─ app/
│   │   ├─ (guest)/
│   │   │   ├─ page.tsx               # Home
│   │   │   ├─ rooms/page.tsx        # List + availability
│   │   │   ├─ facilities/page.tsx
│   │   │   ├─ meals/page.tsx
│   │   │   └─ booking/page.tsx      # Booking form
│   │   ├─ (admin)/
│   │   │   └─ admin/
│   │   │       ├─ rooms/…
│   │   │       ├─ facilities/…
│   │   │       ├─ meals/…
│   │   │       └─ bookings/…
│   │   └─ api/
│   │       ├─ availability/route.ts
│   │       ├─ bookings/route.ts
│   │       ├─ facilities/route.ts
│   │       ├─ meals/route.ts
│   │       └─ admin/…
│   ├─ components/
│   │   ├─ RoomCard.tsx
│   │   ├─ FacilityCard.tsx
│   │   ├─ MealCard.tsx
│   │   └─ BookingForm.tsx
│   ├─ lib/
│   │   ├─ prisma.ts                 # Prisma client singleton
│   │   └─ auth.ts                    # NextAuth.js config
│   ├─ middleware.ts                  # Admin‑only guard
│   └─ stores/
│       └─ uiStore.ts                 # Zustand UI state
├─ public/                           # static assets
├─ styles/
│   └─ globals.css                    # Tailwind base imports
├─ .env.local
├─ next.config.js
├─ tailwind.config.js
├─ postcss.config.js
└─ package.json
```

## 5️⃣ Core Feature Implementation
| Feature | Files | Key Logic |
|---------|-------|----------|
| Home page | `src/app/(guest)/page.tsx` | Hero banner, navigation links |
| Room availability | `src/app/api/availability/route.ts` + `src/app/(guest)/rooms/page.tsx` | Prisma query using the PRD overlap formula |
| Room detail | `src/app/api/room-types/[id]/route.ts` + component | Show price, capacity, images |
| Facilities list | `src/app/api/facilities/route.ts` + page | Simple read‑only endpoint |
| Meal schedule & menu | `src/app/api/meals/route.ts` + page | Accept `date` query, return breakfast/lunch/dinner |
| Booking flow | `src/app/api/bookings/route.ts` (POST) + booking page | Zod validation, double‑check availability, generate unique `bookingCode` |
| Booking status | `src/app/api/bookings/[code]/route.ts` (GET) + page | Return booking data & status |
| Admin authentication | `src/lib/auth.ts` (NextAuth credentials) + `middleware.ts` | Protect admin routes, bcrypt‑hashed passwords |
| Admin CRUD UI | Pages under `app/(admin)/admin/...` | React Hook Form + Zod, call admin API endpoints |
| Dashboard | `app/(admin)/admin/dashboard/page.tsx` | Occupancy stats, recent bookings (Prisma aggregates) |
| State management | `src/stores/uiStore.ts` (Zustand) | Selected dates, guest count, temporary form data |
| Styling | Tailwind utility classes everywhere |
| Error handling | Global API `try/catch`, consistent `{ error, code }` JSON |
| Security | CSP headers, rate limiting (optional), no plain passwords |
| Logging | Console + optional `pino` for production |
| Testing | Jest + Supertest for API, React Testing Library for components |
| CI scripts | `npm run lint`, `npm run format` |
| Dockerfile (optional) | For production container |
| Vercel / Railway config | `vercel.json` if deploying to Vercel |

## 6️⃣ Development Workflow
1. **Start DB & seed**
   ```bash
   npx prisma migrate dev --name init   # creates dev.db
   npm run seed                         # loads dummy data
   ```
2. **Run dev server**
   ```bash
   npm run dev
   ```
3. **Iterate** – edit pages/components → hot‑reload.
4. **Run tests** – `npm test`.
5. **Lint & format** – `npm run lint` / `npm run format`.
6. **Build for production** – `npm run build` && `npm start`.

## 7️⃣ Bug‑Free & Stability Checklist
| Category | Checklist Item | How to Verify |
|----------|----------------|---------------|
| Type safety | `tsc --noEmit` passes | No TypeScript errors |
| Schema sync | Prisma client regenerated after every migration | `npm run prisma:generate` runs cleanly |
| Input validation | Zod schemas for all API payloads | Tests with bad data → 400 |
| Auth guard | `middleware.ts` blocks admin routes | Unauthenticated request gets redirected |
| Race conditions | Booking creation runs inside a DB transaction | Concurrent booking test – only one succeeds |
| Performance | API response < 500 ms (indexed queries) | Load test (`ab`/`k6`) |
| Accessibility | Semantic HTML + ARIA, Lighthouse > 90 |
| Responsive UI | Tailwind breakpoints cover mobile/desktop |
| Security | No plain passwords, env secrets hidden, CSP headers | `npm audit` (run `npm audit fix`), inspect headers |
| Error boundaries | React error boundary UI fallback |
| Logging | Central logger includes request ID & stack trace |
| CI/CD | GitHub Actions run install, test, lint, build |
| Deployment | Vercel/Railway env vars set, `prisma migrate deploy` runs |

## 8️⃣ Release Timeline (Suggested Sprints)
| Sprint | Duration | Deliverables |
|--------|----------|--------------|
| 1 – Foundations | 1 week | Tailwind, Prisma DB, seed data, dev server, navigation |
| 2 – Guest Features | 2 weeks | Availability API, rooms page, facilities page, meals page, booking form |
| 3 – Admin Panel | 2 weeks | Login, CRUD UI for rooms/facilities/meals, bookings management, dashboard |
| 4 – Quality & Security | 1 week | Tests, lint, audit fixes, error boundaries, accessibility |
| 5 – CI/CD & Deploy | 1 week | GitHub Actions, Dockerfile (optional), Vercel/Railway deployment, health checks |
| 6 – Polish | 1 week | UI refinements, loading states, SEO meta tags, documentation |

**Total ≈ 8 weeks** – fits the MVP timeframe in the PRD.

## 9️⃣ Next Immediate Actions (to get a runnable app today)
1. **Create the missing config files** (`tailwind.config.js`, `postcss.config.js`, `next.config.js`, `.eslintrc.json`, `jest.config.js`).
2. **Run the Prisma migration & seed** (once `prisma` CLI is available).
3. **Scaffold the folder structure** (`src/app/...`) as shown above.
4. **Add a simple home page** (`src/app/(guest)/page.tsx`) that says *"Welcome to KamarKu"*.
5. **Add the first API route** (`src/app/api/availability/route.ts`) that returns dummy room‑type data from the seed.

These steps will give you a **runnable dev server** with a page and an API returning data, confirming the whole pipeline works before we add the rest of the features.

---

*You can now open this file in your editor to follow the roadmap step‑by‑step.*
