# FinalForms

A production-grade, Typeform-inspired conversational form builder SaaS built with tRPC, Drizzle ORM, Next.js, and Express in a Turborepo monorepo.

![CI](https://github.com/hitesh/finalforms/actions/workflows/ci.yml/badge.svg)

---

## 👨‍⚖️ Quick Start for Judges

### 🔑 Demo Credentials

| Field    | Value                  |
| -------- | ---------------------- |
| Email    | `admin@finalforms.com` |
| Password | `password123`          |

### 🚀 Start the App

```bash
# 1. Install dependencies
pnpm install

# 2. Start Docker (Postgres) then seed
docker compose up -d
pnpm --filter @repo/database seed

# 3. Run everything
pnpm dev
```

### 🔗 URLs

- **Frontend**: http://localhost:3000
- **API Docs (Scalar)**: http://localhost:8000/docs
- **OpenAPI JSON**: http://localhost:8000/openapi.json

### 🗺️ Seeded Data Map

| Seeded Form                | URL                    | Feature to Evaluate                            |
| -------------------------- | ---------------------- | ---------------------------------------------- |
| Hogwarts Sorting Ceremony  | `/forms/sorting-hat`   | Drop-off funnel analytics, honeypot protection |
| Night City Glitch Registry | `/forms/cyber-glitch`  | Cyberpunk theme, response limit enforcement    |
| Y-Combinator Application   | Dashboard → forms list | Startup theme, unlisted visibility             |

---

## 🛠️ Tech Stack & Architecture

- **Monorepo Manager**: Turborepo + pnpm workspaces
- **Frontend (`apps/web`)**: Next.js 16 (React 19), Tailwind CSS v4, shadcn/radix primitives
- **API Server (`apps/api`)**: Express + tRPC + Scalar OpenAPI docs at `/docs`
- **Database (`packages/database`)**: PostgreSQL (Docker) via Drizzle ORM
- **Shared Packages**:
  - `@repo/trpc` — tRPC router types shared by web and api
  - `@repo/database` — Drizzle schema models, relations, migrations, seed
  - `@repo/services` — Business logic, JWT auth, email
  - `@repo/logger` — Winston console logger

---

## ✨ Key Features

### Form Builder

- 6 field types: short text, long text, email, number, single select, multi select
- Conditional logic (show/hide fields based on answers)
- Three visual themes: Startup, Hogwarts, Cyberpunk
- Live preview during editing
- Custom URL slugs, expiry dates, response limits

### Form Filler (Public)

- Conversational stepper UI with Framer Motion transitions
- Enter key navigation, keyboard-first UX
- Honeypot bot protection + IP rate limiting
- No login required to submit forms
- Partial progress saved to database per-question

### Analytics Dashboard

- Completion rate metrics
- Per-field drop-off funnel chart
- Choice distribution pie charts (computed server-side)
- Response timeline bucketed by day (`date_trunc`)
- Streaming CSV export with proper escaping

### Security

- Helmet + strict CORS (exact frontend URL, not `*`)
- Zod environment validation at startup
- JWT authentication with `crypto.scryptSync` password hashing
- Form ownership verification on every creator mutation
- Independent rate limiting: 10 submissions per IP per 10 minutes

---

## 📊 Database Schema

5 core tables with Drizzle relations:

1. **`users`** — creators (name, email, password hash)
2. **`forms`** — config (title, status, visibility, theme, slug, limits, expiry)
3. **`form_fields`** — inputs (type, label, required, options, validation rules)
4. **`responses`** — submissions (completion status, respondent email, timestamps)
5. **`response_answers`** — individual answers keyed by fieldId (JSON snapshots)

---

## 🧪 Testing

```bash
# Run integration tests
pnpm turbo test

# Run linter + type checker
pnpm turbo lint typecheck
```

Tests cover:

- Auth flows (register, duplicate email, login, wrong password, protected routes)
- Form submission (valid submit, unpublished rejection, missing required fields, fake fieldId, invalid select option)

---

## 🔄 CI Pipeline

GitHub Actions runs on every push to `main`/`dev` and PRs to `main`:

- `pnpm turbo lint`
- `pnpm turbo typecheck`
- `pnpm turbo test`

---

## 📁 Project Structure

```
trpc-monorepo/
├── apps/
│   ├── api/          # Express + tRPC server
│   └── web/          # Next.js frontend
├── packages/
│   ├── database/     # Drizzle schema, migrations, seed
│   ├── services/     # Business logic (form, user, email)
│   ├── trpc/         # Shared tRPC router definitions
│   ├── logger/       # Winston logger
│   ├── eslint-config/
│   └── typescript-config/
├── turbo.json
└── docker-compose.yml
```
