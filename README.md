# Media Tracker

A full-stack media tracking and collection app built with **React 19** and **ASP.NET Core 10**. Users can search movies, TV shows, and video games from external APIs, organize them into custom lists, and tag them — all with per-user themes, role-based access control, and a production-grade authentication system.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-EF_Core-003B57?logo=sqlite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-deployed-2496ED?logo=docker&logoColor=white)

---

## Live Demo

| Service | URL |
|---------|-----|
| Frontend | https://react-dotnet-website-frontend.onrender.com |
| API Docs (Scalar) | https://react-dotnet-website.onrender.com/scalar/v1 — Interactive API explorer (no login required for browsing) |

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, TypeScript, Vite 7, Tailwind CSS v4, Redux Toolkit, RTK Query, Redux Persist, React Router v7, Framer Motion, @dnd-kit, Recharts, Sonner |
| **Backend** | ASP.NET Core 10, EF Core 10, SQLite, ASP.NET Identity, JWT Bearer Auth, Scalar (OpenAPI), Docker |

---

## Features

### Authentication & Security
- JWT access tokens (15 min expiry) with HttpOnly + SameSite=Strict refresh token cookies (7 day expiry)
- Refresh token rotation on every use — invalidates previous token immediately
- Per-endpoint rate limiting (5 auth attempts/min, 120 general requests/min per user)
- Role-based access control: **Basic**, **Moderator**, **Administrator**
- Secrets managed via `dotnet user-secrets` (dev) and environment variables (prod)

### Media Tracking
- Search **OMDB** (movies & TV) and **RAWG** (video games) via an adapter pattern — adding a new API source requires only a new adapter class
- Persist found items to your own collections; search results are cached to reduce external API usage
- Attach custom tags to any item (public or private)
- Drag-and-drop list reordering with `@dnd-kit`

### List System
- **Standard**: freeform, deletable user lists
- **VisitingStatus**: mutually exclusive status lists auto-seeded per user (e.g. "Want to Watch", "Watching", "Finished")
- **Library**: protected singleton list per user (like a "Liked" collection)
- **Featured**: admin-curated lists displayed site-wide on the homepage
- Visibility per list: Private, Public, or Shared (with per-user permission levels: Viewer / Editor / Manager)

### Intelligent Caching
- Two-tier cache: query result cache (`CacheItem`) and image blob cache (`ImageCache`)
- Configurable TTL per query type (60 days for detail lookups, 7 days for search results)
- LRU eviction fallback; nightly background `CacheEvictionService` cleans expired entries
- Admins can force-refresh cache for any item

### Theming
- Multiple color palettes (ocean, forest, sunset, lavender, and more) with a "glass" modifier
- Day/night variant auto-switches at 7 AM / 8 PM
- Theme preference stored both client-side (Redux Persist) and server-side (per-user)

### Admin Panel
- Manage user roles and account status
- Monitor and cap external API quota usage in real time
- Approve or deny user-submitted media types
- Toggle external API sources on/off
- Edit the homepage featured lists collage

### Accessibility
- Keyboard navigation throughout
- Skip-link to main content
- Semantic HTML and ARIA labels
- See [ACCESSIBILITY.md](ACCESSIBILITY.md) for details

---

## Architecture

```
Browser (React SPA)
  ├── Redux slices      (auth, theme, admin settings — persisted via redux-persist)
  └── RTK Query         (API calls, response caching, automatic token-refresh retry on 401)
        │
        ▼
  ASP.NET Core REST API
        ├── JWT + HttpOnly Refresh Token Auth
        ├── Rate Limiting (per-endpoint, fixed window)
        ├── Service Layer
        │     ├── MediaItemService, MediaListService, CustomTagService
        │     ├── ExternalMediaApiAdapterFactory → OmdbAdapter / RawgAdapter
        │     ├── CacheService (query + image tiers)
        │     └── CacheEvictionService (IHostedService, runs nightly)
        ├── EF Core + SQLite (67+ migrations)
        └── Scalar OpenAPI docs  (/scalar/v1)
```

**Key patterns used:**
- `ServiceResult<T>` + `.ToActionResult()` — consistent controller response shape
- Adapter pattern for external API sources — pluggable without touching core logic
- Unified cache discriminator — single table for multiple cache types
- RTK Query `prepareHeaders` + `baseQuery` wrapper — transparent JWT refresh on 401

---

## Project Structure

```
react-dotnet-website/
├── frontend/
│   └── src/
│       ├── pages/          # 11 route-level page components
│       ├── components/     # Reusable UI (navbar, modals, list rows, search, admin panels)
│       ├── services/       # RTK Query API slice (~40 endpoints across 10 controllers)
│       ├── store/          # Redux slices: authSlice, themeSlice, adminSettingsSlice
│       ├── types/          # TypeScript interfaces mirroring backend DTOs
│       ├── hooks/          # Custom React hooks
│       ├── utils/          # Shared helpers
│       └── constants/      # App-wide constants
│
└── backend/MyDotNetWebsiteApi/
    ├── Controllers/        # 10 controllers (Auth, MediaList, MediaApiRef, CustomTag, User, Admin, ...)
    ├── Services/           # 18 services (business logic layer)
    ├── Models/             # 14 EF Core entity models + join tables
    ├── DTOs/               # Request/response shapes organized by feature
    ├── Data/               # AppDbContext + seeding
    ├── Extensions/         # Startup extension methods (auth, rate limiting, CORS, etc.)
    ├── Migrations/         # EF Core migration history
    └── Dockerfile          # Production container definition
```

---

## Getting Started (Local Development)

### Prerequisites
- [Node.js 20+](https://nodejs.org/) and npm
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- Git

### 1. Clone

```bash
git clone <repo-url>
cd react-dotnet-website
```

### 2. Backend

```bash
cd backend/MyDotNetWebsiteApi

# Set required secrets (never committed to source control)
dotnet user-secrets set "JwtSettings:Secret" "<32+ char secret>"
dotnet user-secrets set "ExternalApiSettings:OmdbApiKey" "<omdb-key>"
dotnet user-secrets set "ExternalApiSettings:RawgApiKey" "<rawg-key>"
dotnet user-secrets set "SeedAdmin:UserName" "admin"
dotnet user-secrets set "SeedAdmin:Email" "admin@example.com"
dotnet user-secrets set "SeedAdmin:Password" "<strong-password>"

# Apply migrations and seed the database
dotnet ef database update

# Run the API
dotnet run
```

API runs at `http://localhost:5198`
Interactive API docs at `http://localhost:5198/scalar/v1`

**External API keys:**
- OMDB: https://www.omdbapi.com/apikey.aspx (free tier available)
- RAWG: https://rawg.io/apidocs (free tier available)

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173` — the `.env.local` file already points to the local backend.

---

## API Overview

Documented interactively at `/scalar/v1`. Controller groups:

| Controller | Responsibility |
|------------|---------------|
| `AuthController` | Register, login, token refresh, logout |
| `MediaListController` | Create/manage lists, add/remove/reorder items |
| `MediaApiRefController` | Search external APIs, persist media items |
| `CustomTagController` | Create, search, and attach tags to items |
| `UserController` | Profile and theme preferences |
| `AdminManageAllUsersController` | User role and status management |
| `ApiUsageController` | External API quota monitoring |
| `ExternalApiSourceController` | API source status and configuration |
| `ImageCacheController` | Proxied and cached image delivery |

---

## Security Highlights

| Concern | Approach |
|---------|----------|
| Token storage | Access token in Redux state (memory); refresh token in **HttpOnly + SameSite=Strict** cookie |
| Token lifetime | Access: 15 min — Refresh: 7 days, rotated on every use |
| CSRF | SameSite=Strict cookie attribute prevents cross-site request forgery |
| XSS | HttpOnly cookie makes refresh token inaccessible to JavaScript |
| Brute force | Fixed-window rate limiting: 5 auth requests/min, configurable per endpoint |
| SQL injection | All queries via EF Core parameterized LINQ — no raw SQL |
| Secrets | `dotnet user-secrets` in dev; environment variables in production (never in source) |
| Authorization | Role-level enforcement via `[Authorize(Policy = ...)]` on all protected endpoints |

---

## Deployment

Hosted on [Render.com](https://render.com) with automatic deploys from GitHub.

| Service | Config |
|---------|--------|
| Backend | Dockerfile build, `backend/MyDotNetWebsiteApi` root, production env vars |
| Frontend | `npm run build` → `dist/`, `frontend` root |

Any push to the main branch triggers a rebuild and redeploy of both services.
