# FinalForms

A modern AI-powered conversational form builder built with a full-stack TypeScript monorepo architecture using tRPC, Next.js, Express, PostgreSQL, and Drizzle ORM.

---

# ✨ Features

## 🔐 Authentication

* Email/password authentication
* Google OAuth login
* JWT-based auth
* Password reset flow
* Email verification
* Protected routes
* Role-based admin access

---

## 📝 Form Builder

* Create conversational forms
* Dynamic question flows
* Form editing dashboard
* Public form sharing
* Real-time response collection
* AI-friendly conversational UI

---

## 📊 Dashboard

* User dashboard
* Form analytics
* Response management
* Admin panel
* Form editing interface

---

## ⚡ Tech Features

* Monorepo architecture
* End-to-end type safety with tRPC
* PostgreSQL database
* Drizzle ORM + migrations
* Shared packages
* TurboRepo build system
* Modern React UI
* Server-side rendering
* API documentation
* Docker support

---

# 🏗️ Monorepo Structure

```bash
trpc-monorepo/
│
├── apps/
│   ├── api/          # Express + tRPC backend
│   └── web/          # Next.js frontend
│
├── packages/
│   ├── database/     # Drizzle ORM + schema
│   ├── services/     # Business logic
│   ├── trpc/         # Shared tRPC routers
│   ├── logger/       # Logging utilities
│   ├── shared/       # Shared schemas/types
│   └── eslint-config/
│
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

# 🚀 Tech Stack

## Frontend

* Next.js 16
* React 19
* TypeScript
* Tailwind CSS
* tRPC Client

## Backend

* Node.js
* Express.js
* tRPC
* JWT Authentication
* Zod validation

## Database

* PostgreSQL
* Drizzle ORM
* Drizzle Kit

## Dev Tools

* TurboRepo
* PNPM Workspaces
* ESLint
* Prettier
* Husky
* Vitest

---

# ⚙️ Environment Variables

## Root `.env`

```env
DATABASE_URL=your_postgres_url
JWT_SECRET=your_jwt_secret

BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

NEXT_PUBLIC_API_URL=http://localhost:8000/trpc
```

---

# 🛠️ Installation

## 1. Clone repository

```bash
git clone https://github.com/your-username/trpc-monorepo.git
cd trpc-monorepo
```

---

## 2. Install dependencies

```bash
pnpm install
```

---

## 3. Setup environment variables

Create `.env` in the root directory.

---

## 4. Run database migrations

```bash
pnpm db:migrate
```

---

## 5. Start development server

```bash
pnpm run dev
```

---

# 📦 Available Scripts

## Development

```bash
pnpm run dev
```

Runs:

* Next.js frontend
* Express API
* Drizzle Studio

---

## Build

```bash
pnpm run build
```

---

## Database Migration

```bash
pnpm db:migrate
```

---

## Generate Migration

```bash
pnpm db:generate
```

---

## Lint

```bash
pnpm lint
```

---

## Format

```bash
pnpm format
```

---

# 🌐 Deployment

## Frontend (Vercel)

Deploy `apps/web` to Vercel.

Required environment variables:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.up.railway.app/trpc
```

---

## Backend (Railway)

Deploy the monorepo root to Railway.

### Build Command

```bash
pnpm install && pnpm build
```

### Start Command

```bash
cd apps/api && pnpm start
```

### Required Environment Variables

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=your_secret
FRONTEND_URL=https://your-frontend.vercel.app
BASE_URL=https://your-backend.up.railway.app
```

---

# 🗄️ Database

This project uses:

* PostgreSQL
* Drizzle ORM
* SQL migrations

Run Drizzle Studio:

```bash
pnpm --filter @repo/database dev
```

---

# 🔒 Security Features

* JWT Authentication
* CORS protection
* Password hashing
* CSRF protection
* Input validation
* Request rate limiting
* Secure cookies
* Environment validation

---

# 📡 API

The backend exposes:

* tRPC endpoints
* REST-compatible handlers
* OpenAPI docs

### Local API Docs

```txt
http://localhost:8000/docs
```

---

# 🧪 Testing

Run tests:

```bash
pnpm test
```

---

# 🐳 Docker Support

Docker Compose included:

```bash
docker-compose up
```

---

# 📈 Future Improvements

* AI-generated forms
* Response analytics dashboard
* Team collaboration
* Webhooks
* Form templates
* Email campaigns
* Dark mode
* Mobile optimization

---

# 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push branch
5. Open Pull Request

---

# 📄 License

MIT License

---

# 👨‍💻 Author

Built by Hitesh Dhayal

GitHub: [https://github.com/hiteshdhayal](https://github.com/hiteshdhayal)
