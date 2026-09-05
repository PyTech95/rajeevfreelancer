# Rajeev Freelancer — PRD

## Original Problem Statement
"Rajeev Website — Finish & Deploy": a personal/professional site for Rajeev, cleaned up,
dynamic where it counts (contact form), and deployed. User uploaded the existing full-stack
code as `rajeev-website-6sept-main.zip` and asked to "deploy here".

## What the uploaded app actually is (audited 2026-09-05)
Not a plain portfolio — a mature freelance marketing platform (rajeevfreelancer.com):
- React 19 + CRACO + Tailwind + shadcn/ui + framer-motion + Lenis frontend (112 src files).
- FastAPI backend (server.py 1442 lines) + Motor/MongoDB.
- Programmatic SEO: 8 services x 225 cities location pages (AI-generated via Gemini
  gemini-3-flash-preview through emergentintegrations + EMERGENT_LLM_KEY, cached in Mongo,
  deterministic fallback on first visit).
- Blog (22 seeded posts) + autopilot generator, case studies (Mongo-backed CRUD), admin
  dashboard (JWT) with leads, stats, site settings, SEO tools, IndexNow, digest scheduler.
- Lead capture (POST /api/leads) with geo capture + email notifications (Resend/SMTP —
  currently no key, skips gracefully).

## Personas
- Visitor/prospect: browses services/case studies/blog, submits enquiry.
- Rajeev (admin): manages leads, blog, case studies, settings at /admin.

## Session 2026-09-05 — Port + deploy
- [x] Unzipped upload, ported backend + frontend into /app over the starter template.
- [x] backend/.env wired: MONGO_URL/DB_NAME preserved, new JWT_SECRET, ADMIN_EMAIL/
      ADMIN_PASSWORD, EMERGENT_LLM_KEY, email vars (RESEND blank -> graceful skip).
- [x] Fixed deploy blocker: removed direct-URL litellm pin conflicting with
      emergentintegrations==0.2.0 (known issue from prior session).
- [x] Installed backend (pip) + frontend (yarn) deps; both services running.
- [x] Verified e2e via external URL: /api/health ok, 8 services, 225 locations, 22 blog
      posts, case studies list, lead create (200), admin JWT login + stats, sitemap.xml,
      homepage renders with kinetic hero.

## Backlog / P0-P2
- P0: Deploy via platform (in progress); post-deploy GSC sitemap submit + www redirect.
- P1: Add RESEND_API_KEY / verify sending domain for lead + confirmation emails.
- P1: Set CORS_ORIGINS to the deployed domain; rotate admin password for go-live.
- P2: Warm all cities for AI content; paste GA4/GSC IDs in admin Site Settings.
- P2: WhatsApp lead alerts webhook config (inactive until user enters webhook URL).

## Credentials
See /app/memory/test_credentials.md (admin: rajeev.gits@gmail.com).
