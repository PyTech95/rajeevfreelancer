# Handoff: Port "Rajeev Freelancer" frontend to Next.js (SSR) — reuse this backend

Purpose: paste/upload this file into the NEW Emergent Next.js (`farmnext`) project so the agent
there can rebuild the frontend as server-rendered (SSR/ISR) while reusing THIS project's
FastAPI + MongoDB backend and data. Goal: true server-rendered HTML for all ~1,800 programmatic
city/service pages + blog + case studies (no waiting on client JS).

## 0) First prompt to use in the new project
"Build a Next.js (App Router) app with SSR/ISR. It is the SEO frontend for an existing FastAPI
backend (I'll provide the API base URL). Server-render every page for crawlers, generate dynamic
metadata + JSON-LD per route, and use ISR/on-demand revalidation for the programmatic city pages."
(Mention "Next.js" / "SSR" so the correct template is selected — template is permanent per job.)

## 1) Reuse this backend (do NOT rebuild it)
- Keep this project's FastAPI backend as the API. In the Next.js project set:
  `NEXT_PUBLIC_API_BASE = https://<this-project-domain>/api`  (server + client fetches)
- To share the SAME database instead of the API, copy this project's `MONGO_URL` + `DB_NAME`
  secrets into the new project (per Emergent support). Recommended for reliability: use your own
  MongoDB Atlas cluster and allowlist both apps' egress IPs. For SSR SEO, reusing the API is simpler.
- All backend routes are prefixed `/api`. Health: `GET /api/health`.

## 2) SSR strategy (the whole point)
- Static/marketing pages → SSG or SSR: `/`, `/about`, `/services`, `/pricing`, `/contact`,
  `/case-studies`, `/blog`, `/locations`, `/delhi-ncr`.
- Programmatic pages → ISR (`generateStaticParams` for top cities + `revalidate`, on-demand for the rest):
  - `/[serviceSlug]` (service hub) ← GET /api/service/{service_slug}
  - `/[serviceSlug]/[locSlug]` (city page, ~1,800) ← GET /api/page/{service_slug}/{loc_slug}
  - `/locations/[countrySlug]` ← GET /api/locations
  - `/blog/[slug]` ← GET /api/blog/{slug}; `/case-studies/[slug]` ← GET /api/case-studies/{slug}
- Use Next `generateMetadata()` per route for title/description/canonical/OG/Twitter, and inject
  JSON-LD (Organization, Person, WebSite, LocalBusiness, Service, FAQPage, BreadcrumbList) as
  `<script type="application/ld+json">` server-side (this replaces the current react-helmet-async).
- Language landing pages `/hi /ar /es /fr` with hreflang alternates (reciprocal + x-default).
- Keep `/services/:slug` → redirect to `/[serviceSlug]` (legacy). Keep 404 page.

## 3) Frontend routes to recreate (from current CRA App.js)
```
/                         Home
/about                    About
/services                 ServicesOverview
/services/:slug           -> redirect to /:serviceSlug (legacy)
/locations                LocationsIndex
/locations/:countrySlug   CountryPage
/delhi-ncr                DelhiNCR (special landing)
/contact                  Contact (lead form -> POST /api/leads)
/pricing                  Pricing
/case-studies             CaseStudies ; /case-studies/:slug  CaseStudyDetail
/blog                     BlogIndex ; /blog/:slug  BlogPost
/:serviceSlug             ServiceHub
/:serviceSlug/:locSlug    LocationPage (programmatic, ~1,800)
/admin                    Admin dashboard (JWT) — can stay CSR
/hi /ar /es /fr           LangLanding (localized, hreflang)
* (fallback)              NotFound (404)
```

## 4) Backend API surface (already built here — consume as-is)
Public:
- GET /api/services, /api/locations, /api/service/{slug}, /api/page/{service}/{loc}
- GET /api/settings (site/seo/marketing config), /api/rates, /api/geo
- GET /api/blog, /api/blog/{slug}, /api/case-studies, /api/case-studies/{slug}
- POST /api/leads (name,email,phone?,service?,location?,budget?,message?)
- GET /api/sitemap.xml (dynamic — lists all services/cities/blog/case-studies), GET /api/indexnow-key
Admin (JWT: POST /api/auth/login -> {token}; GET /api/auth/me; Bearer token):
- GET /api/admin/stats, /admin/leads/geo ; GET/PATCH/DELETE /api/leads[/{id}]
- GET/PUT /api/admin/settings/site ; blog & case-studies CRUD (+reorder)
- POST /api/admin/pregenerate (+status), POST /api/admin/digest/send, digest settings
- IndexNow: GET/PUT /api/admin/indexnow, POST /api/admin/indexnow/submit (auto-ping on publish/edit)
- POST /api/admin/upload, GET /api/uploads/{file_id}

## 5) Env vars (backend — already set here; copy only if sharing DB)
MONGO_URL, DB_NAME, JWT_SECRET, EMERGENT_LLM_KEY, ADMIN_EMAIL, ADMIN_PASSWORD, CORS_ORIGINS,
EMAIL_PROVIDER, RESEND_API_KEY, EMAIL_FROM_NAME, OWNER_EMAIL, SENDER_EMAIL
Next.js frontend env: NEXT_PUBLIC_API_BASE (this project's /api URL).
IMPORTANT: add the Next.js app's production origin to this backend's CORS_ORIGINS.

## 6) SEO parity checklist to preserve
- Per-route unique title/description, clean canonical, hreflang (en + hi/ar/es/fr + x-default).
- OG + Twitter card + og:image on every page; robots meta; manifest; apple-touch-icon.
- JSON-LD schemas listed in §2. All <img> need alt. Sitemap from /api/sitemap.xml + robots.txt.
- Keep IndexNow auto-ping (backend already does it on publish/edit).

## 7) How to carry the code over
- Push this current project to GitHub (chat input → "Save to Github"), then share that repo in the
  new Next.js job, OR upload a zip of /app/frontend/src. The new agent reuses components/content
  (data/*, pages/*, i18n) and rewrites routing/metadata to Next.js App Router + SSR.
