# FinalForms - Judge & Developer Guide

![CI](https://github.com/hitesh/finalforms/actions/workflows/ci.yml/badge.svg)

---

## 👨‍⚖️ Judge Guide

> **Start here.** Everything you need to evaluate ChaiForms in under 5 minutes.

### 🔑 Test Credentials
| Field | Value |
|---|---|
| Email | `admin@finalforms.com` |
| Password | `password123` |

### 🚀 Quickstart
```bash
# 1. Install dependencies
pnpm install

# 2. Start Docker (Postgres) — then seed
docker compose up -d
pnpm --filter @repo/database seed

# 3. Run everything
pnpm dev
```
- **Frontend**: http://localhost:3000
- **API + Scalar Docs**: http://localhost:3001/docs
- **OpenAPI JSON**: http://localhost:3001/openapi.json

### 🗺️ What to Test (Seeded Data Map)

| Seeded Form | URL | Feature to Evaluate |
|---|---|---|
| Hogwarts Sorting Ceremony | `/forms/sorting-hat` | Drop-off funnel analytics, honeypot protection |
| Night City Glitch Registry | `/forms/cyber-glitch` | Cyberpunk theme, response limit enforcement |
| Y-Combinator Application | Dashboard → find in forms list | Startup theme, unlisted visibility |

### ✨ Key Features to Verify
1. **Form Filler** → `/forms/sorting-hat` — Framer Motion slide transitions, Enter key nav, conditional logic
2. **Analytics** → Dashboard → Hogwarts form → Analytics tab — funnel chart + pie charts
3. **QR Code** → Dashboard → any form → Settings tab → scroll to bottom
4. **Pricing** → `/pricing` — Mock Stripe checkout flow
5. **API Docs** → http://localhost:3001/docs — All 12 procedures documented
6. **Error Handling** → Send bad Zod input → get structured `{ zodError }` response

---

FinalForms is a production-style, Typeform-inspired conversational form builder SaaS. It is built as a type-safe Turborepo monorepo utilizing **tRPC**, **Drizzle ORM**, **Zod schema validations**, **Next.js App Router (frontend)**, and **Express (backend REST & Scalar documentation)**.

---


## 🛠️ Tech Stack & Architecture

- **Monorepo Manager**: Turborepo / pnpm workspaces.
- **Frontend App (`apps/web`)**: Next.js 16 (React 19) styled with Tailwind CSS (v4) and shadcn/radix primitives.
- **API Server (`apps/api`)**: Node.js Express server mounting tRPC routes for client operations and Scalar OpenAPI documentation at `/docs`.
- **Database (`packages/database`)**: PostgreSQL database running in Docker, queryable via Drizzle ORM.
- **Shared Packages**:
  - `@repo/trpc`: Shared tRPC client/server router specifications.
  - `@repo/database`: Schema models, relations, migrations, and seed scripts.
  - `@repo/services`: User password cryptography & JWT tokens.
  - `@repo/logger`: Winston console logger wrapper.

---

## 🔑 Authentication System

We implemented a custom, lightweight, type-safe authentication workflow suitable for Windows containers without binary dependency overhead:
- **Hashing**: Uses Node's native `crypto.scryptSync` with a salt prefix, avoiding heavy native binaries like `bcrypt`.
- **JWT Tokens**: Created using custom JWT sign/verify logic utilizing `crypto.createHmac` for signature checks.
- **Session Persistence**: Stored on the client using a secure `session_token` cookie. The tRPC context automatically parses this cookie from incoming request headers or query params, establishing `ctx.user` for `protectedProcedure` authorization.

---

## 📊 Database Schema & Mock Seeding

The database contains 5 core tables under a relational schema:
1. **`users`**: Form creators (name, email, password hash, verification status).
2. **`forms`**: Form configuration (title, description, status, visibility, theme layout, custom slug, response limits, expiration dates).
3. **`form_fields`**: Individual form inputs (type, label, placeholder, required flag, ordering, MCQ options array, validation bounds).
4. **`responses`**: Individual response submissions (form relation, completion status, respondent email, partial progress tracking, timestamps).
5. **`response_answers`**: Value inputs corresponding to each field within a response.

### 🌱 Mock Seeding
We wrote a pure JavaScript database seeder (`packages/database/seed-raw.js`) to guarantee lightweight, memory-efficient seeding on Windows. It seeds:
- **1 Default Administrator**: `admin@finalforms.com` / `password123`.
- **3 Detailed Themed Forms**:
  - **Hogwarts Sorting Ceremony** (Theme: Hogwarts, status: Published, visibility: Public, custom slug: `sorting-hat`).
  - **Night City Glitch Registry** (Theme: Cyberpunk, status: Published, visibility: Public, custom slug: `cyber-glitch`).
  - **Y-Combinator Application** (Theme: Startup, status: Published, visibility: Unlisted).
- **65+ Mock Response Submissions**: Configured with a realistic mix of completed submissions and partial draft drop-offs to generate detailed analytics.

---

## 🎨 Layout Themes

Forms render dynamically based on their selected theme:
- **Startup**: Sleek, tech-focused dark navy gradient with modern borders and clean typography.
- **Hogwarts**: Dark magic theme using deep violet gradients, antique gold/bronze badges, gold glowing elements, and elegant serif styles.
- **Cyberpunk**: Monospace fonts, pitch-black panels, neon yellow accents, glowing input borders (`#ffee00`), and a terminal aesthetic.

---

## 🛡️ Anti-Spam & Validation Rules

- **Honeypot Trap**: A hidden form input is embedded on the form filling page. If a bot fills it in, the server immediately rejects the submission as spam.
- **Zod Schema Checking**: Input values are checked on both the client (pre-step transitions) and the server (tRPC endpoints) to match field validations (e.g. required questions, valid emails).
- **IP Rate Limiting**: The server utilizes an in-memory sliding-window bucket to limit requests per IP (10 requests/sec limit) protecting form submissions.

---

## 📈 Form Creator Workspace & Analytics

Visiting `/dashboard/forms/[id]/edit` brings up three tabs:
1. **Build**: Add 8 different field types, adjust required/optional controls, reorder them instantly, and observe live updates on the embedded device simulator.
2. **Settings**: Modify metadata, switch theme layouts, adjust visibility (Public / Unlisted), configure response count limits, set expiry calendar dates, and set up a custom URL slug.
3. **Analytics**:
   - **Metrics Summary**: Completion rates, total views, and average completion counts.
   - **Funnel Drop-off**: A Recharts bar chart plotting user drop-off step-by-step.
   - **Choice Distributions**: Pie charts summarizing MCQ percentages.
   - **CSV Export**: Streams submission lists directly using chunked Express transfers.

---

## 🏃 Running Locally

To run the application locally, make sure your PostgreSQL container is running, then run:

```bash
pnpm dev
```

This starts:
- Next.js Frontend on `http://localhost:3000`
- Express API Server on `http://localhost:3001`
- Scalar API Docs on `http://localhost:3001/docs`

**Testing Credentials**:
- **Email**: `admin@finalforms.com`
- **Password**: `password123`
