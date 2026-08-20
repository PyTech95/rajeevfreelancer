# Rajeev Freelancer — PRD

## Original Problem
Deploy the "Rajeev-main" full-stack app (React + FastAPI + MongoDB). Verify-first plan:
Phase 0 (verify locally), Phase 1 (env/secrets), Phase 2 (deploy), Phase 3 (smoke test).
User uploaded the code as a zip and asked to "deploy here" (full stack, default Mongo).

## Architecture
- Frontend: React 19 + CRACO + Tailwind + shadcn/ui + framer-motion + Lenis. All API calls
  via `process.env.REACT_APP_BACKEND_URL` (src/lib/api.js). No hardcoded localhost.
- Backend: FastAPI (uvicorn 0.0.0.0:8001), all routes under `/api`. Motor (async Mongo).
- DB: local MongoDB (MONGO_URL/DB_NAME from env).
- Integrations: Gemini (gemini-3-flash-preview) via emergentintegrations + EMERGENT_LLM_KEY
  for AI location-page content (has deterministic fallback). Optional email notifications
  via Emergent email integration (EMERGENT_EMAIL_KEY, currently blank -> fails gracefully).
  External no-key APIs: exchange rates (open.er-api.com), geo (ipapi.co).

## Core Features
- Programmatic SEO: 7 services × 135 cities (40 countries) location pages, AI-generated + cached in Mongo.
- Public catalog: /api/services, /api/locations, /api/service/{slug}, /api/page/{svc}/{loc}, /api/sitemap.xml, /api/rates, /api/geo.
- Lead capture: POST /api/leads (fires owner email notification, non-blocking).
- Admin (JWT): login, GET /api/leads (paginated), PATCH status, GET /api/admin/stats.

## Env Vars (backend/.env)
MONGO_URL, DB_NAME, CORS_ORIGINS, JWT_SECRET, EMERGENT_LLM_KEY, ADMIN_EMAIL, ADMIN_PASSWORD,
REACT_APP_BACKEND_URL, EMERGENT_EMAIL_KEY (blank), EMAIL_FROM_NAME, OWNER_EMAIL.
Frontend: REACT_APP_BACKEND_URL (protected).

## Status (2026-08-18)
- [x] Phase 0: code unzipped into /app, deps installed, backend boots clean, frontend compiles.
- [x] Phase 1: all env vars wired; JWT_SECRET generated; admin seeded; Mongo connected.
- [x] Phase 3 preview smoke test: catalog, lead write+read, JWT login, admin stats, AI page gen all pass; homepage renders.
- [x] Deployment readiness: passed. Fixed /api/leads pagination blocker (bounded limit/skip).
- [x] Lead email alerts: Resend integrated (email_utils.py, non-blocking via asyncio.to_thread).
      Sends owner notification on every new lead. Keeps existing anti-phishing email scanner.
      RESEND_API_KEY set. Sender: onboarding@resend.dev (test mode). OWNER_EMAIL currently
      rajeev.gits@gmail.com (Resend account owner) because test mode only delivers to the
      account owner until a domain is verified. Verified live send (no error).
- [x] Top-cities warm-up: POST /api/admin/pregenerate + GET /api/admin/pregenerate/status
      (admin-only). Curated TOP_CITY_SLUGS (18 cities) in data.py. Background asyncio task with
      semaphore concurrency (default 3), progress tracked in-process. Admin dashboard has a
      "Warm top cities" button + live progress bar. Tested: 4 pages generated in ~19s.
- [ ] Phase 2: user to click platform Deploy button (frontend + backend + Mongo).

## Restore + Redeploy Prep (2026-06, fork)
- [x] Code restored from rajeev4-main.zip into /app; deps installed (pip incl. resend, yarn).
- [x] backend/.env reconstructed: new JWT_SECRET generated, EMERGENT_LLM_KEY wired,
      ADMIN_EMAIL=admin@rajeevfreelancer.com / ADMIN_PASSWORD=RajeevAdmin#2026 (new seed).
      RESEND_API_KEY left BLANK (user's key not in zip) -> email sends skip gracefully.
- [x] Smoke test passed: /api/services, admin JWT login, POST /api/leads, /api/sitemap.xml, homepage renders.
- [x] Deployment readiness: PASS (fixed .gitignore blocking .env files: removed .env/.env.*/*.env patterns).
- [x] RESEND_API_KEY re-provided by user and wired (2026-06 fork). Verified live send
      (id returned) + digest sent=true. Still Resend TEST MODE: delivers only to account
      owner (rajeev.gits@gmail.com) until domain verified at resend.com/domains.
- [ ] USER ACTION: click Deploy button.
- [x] Auto-warm top cities on startup (2026-06 fork): _auto_warm_top_cities() fires 10s after
      backend boot when AUTO_WARM_ON_STARTUP=true (default). Checks db.location_pages for
      non-AI top-city pages (18 cities × 8 services = 144 keys) and runs _run_warmup(concurrency 3,
      LLM gate still 1). Idempotent: skips already-AI pages, so redeploys are cheap. Verified live:
      3/144 generated in first minute, 0 failed.
- [x] Fixed route shadowing (deploy lint blocker): moved /admin/blog/reorder and
      /admin/case-studies/reorder above their parameterized {id} routes. Verified via curl.

## Iteration 2 (2026-08-18) — 4 follow-up features
- [x] Lead confirmation email: prospect gets an instant branded confirmation on enquiry
      (email_utils.send_lead_confirmation, fired from create_lead). Skips if no email given.
- [x] Daily lead digest: owner digest of last 24h leads. POST /api/admin/digest/send (manual,
      tested sent=true) + background scheduler (_daily_digest_scheduler) at DIGEST_HOUR_UTC (7).
      "Send digest" button added to admin dashboard.
- [x] Warm ALL cities: pregenerate now accepts {"all": true} -> all 135 cities × 7 services
      (945 pages). "Warm all cities" button added.
- [x] LLM concurrency fix (IMPORTANT): provider allows only 1 concurrent request on this plan
      (429 CONCURRENCY_REQUEST_LIMIT). Added a global asyncio.Semaphore(1) gate around the LLM
      call so parallel warm-ups no longer fall back to templated content. generate_content now
      returns (content, ai_used); pages store `ai_generated` flag. Warm-up skips only AI pages
      and upgrades fallbacks. Verified: pages generate with ai_generated=true, 0 failures.
- [~] Verify sending domain: USER ACTION. Verify rajeevfreelancer.com at resend.com/domains,
      then set SENDER_EMAIL=leads@rajeevfreelancer.com & OWNER_EMAIL=hello@rajeevfreelancer.com.
      Until then, Resend test mode only delivers to the account owner (rajeev.gits@gmail.com),
      so owner alerts + digest work, but prospect confirmation emails won't deliver yet.

## Caveats
- Warm-all of 945 pages is SERIAL (~15-20s/page => a few hours) due to the 1-concurrent LLM
  limit. It runs in the background, is resumable (skips already-AI pages), and never blocks the app.

## Iteration 3 (2026-08-18) — 4 more follow-ups
- [x] LLM concurrency now env-configurable: LLM_CONCURRENCY (default 1) drives the _llm_gate
      semaphore. After a plan upgrade that unlocks parallel requests, bump this to run warm-ups
      in parallel (minutes instead of hours). No code change needed — just the env value.
- [x] Auto-warm on first visit: GET /api/page/{svc}/{loc} now returns the deterministic fallback
      INSTANTLY on first visit (verified ~0.17s) and generates the real AI version in the
      background (_generate_and_cache, guarded by _inflight_pages), so the next visitor gets the
      AI page. Cached fallback pages are also upgraded to AI in the background on any visit.
      Verified: page flipped ai_generated False->True ~16s after first hit.
- [x] Configurable digest timing: digest hour + IANA timezone + enabled stored in db.settings
      (key="digest"). GET/PUT /api/admin/digest/settings (tz validated against zoneinfo).
      Scheduler reads settings each cycle (wakes hourly so changes apply without restart).
      Admin dashboard has an hour dropdown + timezone dropdown + enabled toggle + Save.
      Currently set to 09:00 Asia/Kolkata.
- [~] Domain verification (USER DNS ACTION) + plan upgrade (USER ACCOUNT ACTION): see summary.

## Key env vars added over iterations
RESEND_API_KEY, SENDER_EMAIL, OWNER_EMAIL, EMAIL_FROM_NAME, DIGEST_HOUR_UTC (seed default),
LLM_CONCURRENCY.

## Iteration 10 (2026-08-18) — Ad variants, service images, tracking, testimonials, App Dev
- Ad landing variants: service pages accept ?headline=, ?sub=, ?cta= query params to match ad
  copy (verified live). Drop campaign-specific URLs into Google Ads.
- Per-service hero images: SERVICE_IMAGES map in serviceContent.js; shown in the service hero
  with a "Free quote" badge.
- Conversion tracking: settings.tracking {ga4_id, ads_id, ads_conversion_label} (in admin Site
  Settings). siteConfig.initTracking() injects gtag.js when IDs set; trackConversion() fires
  GA4 generate_lead + Google Ads conversion on ContactForm success. No-ops until IDs are added.
- Testimonials: TESTIMONIALS (sample, replaceable) rendered per service (3 each) + Product/
  Review/AggregateRating JSON-LD.
- NEW SERVICE: "Freelance App Developer" (App Development) added to backend data.py + frontend
  SERVICES + serviceContent (content, image, FAQs). Now 8 services; location pages + dropdown
  + sitemap all include it automatically.
- Verified: 8 services live, app-dev landing page + image + ad-variant override render, tracking
  settings persist, compile clean.
- TODO(user): paste GA4 + Google Ads IDs in admin to activate tracking; replace sample testimonials.


- Contact form: removed the currency selector (INR/USD/etc.) — now a single free-text "Budget
  (optional)" box. Value stored as typed. Removed useCurrency/CURRENCIES usage from the form.
- Service pages (/:serviceSlug) rebuilt as full AdWords-ready landing pages: punchy hero + value
  prop + dual CTAs + trust row, "why this works" benefits, "what's included" deliverables +
  outcome pills, 4-step process, stats, per-service FAQ (with FAQPage JSON-LD), dark contact CTA,
  and the SEO cities list. Unique per-service content in frontend/src/data/serviceContent.js
  (7 services). Kept Service + FAQ + Breadcrumb structured data.
- Nav: "Services" is now a hover dropdown listing all 7 services (short + tagline) + "All services".
- Verified: compile clean, SEO service page renders as a landing page, dropdown trigger present.


- Blog: added 10 more unique, SEO-friendly posts (industry: real estate, clinics/healthcare,
  e-commerce CRO, restaurants; service deep-dives: WhatsApp automation, Shopify SEO, Next.js vs
  React, Google Ads; local: Dubai; + a local-service case study). Now 22 posts total. _seed_blog
  is idempotent (adds missing seeds by slug, never wipes admin edits).
- Languages: real translated landing pages for Hindi, Arabic, Spanish, French at /hi /ar /es /fr
  (frontend/src/data/i18n.js + pages/LangLanding.jsx). Each has translated hero/services/about/
  contact, correct canonical + hreflang alternates (en + 4 langs + x-default), og:locale, and
  Arabic renders full RTL (dir=rtl). Language switcher (globe) added to the main Nav; lang pages
  have their own localized header/switcher. Routes registered top-level to avoid /:serviceSlug
  clash. Sitemap includes the 4 language URLs.
- Verified: 22 posts live, sitemap lang URLs, Arabic RTL page renders correctly, compile clean.
- NOTE: language pages are standalone translated marketing pages (not a full site-wide i18n of
  every page/blog body yet) — deeper translation is progressive. Prerender still deferred.


- Lead geo now also stores geo_lat/geo_lon on create_lead. New admin endpoint
  GET /api/admin/leads/geo returns map points + per-country counts.
- Admin LeadMap.jsx: Leaflet (loaded from CDN, no API key) with OSM tiles, a marker per
  located lead (name/service/city popup) + a top-countries list. Collapsible card.
- Featured posts: blog_posts gained `featured` bool (BlogInput + admin edit checkbox + list
  badge). Existing 2 case studies marked featured. Public /api/blog sorts featured-first and
  supports ?featured=true. Blog index shows a ★ Featured badge.
- Homepage: new "Latest insights" strip (data-testid=home-insights) showing the top 3
  (featured-first) posts, linking to /blog. (Also satisfies the earlier 'latest update on home'.)
- Verified: featured-first ordering, geo points w/ lat-lon (e.g. 41.26,-95.86 Council Bluffs),
  leads/geo endpoint, blog CRUD+featured, nav (Blog present / Locations removed), compile clean.
- STILL PENDING user input: (1) blog topics for more articles; (2) which languages + prerender.


- Homepage: removed the "locations teaser" section (looked cheap). Header nav: removed "Locations",
  added "Blog". Footer: locations kept as "Working areas" (clickable) + all-locations link.
  Locations remain for SEO (routes /locations, /locations/:country, /:svc/:loc still live).
- Blog/Insights: new section. Backend blog_posts collection seeded with 12 UNIQUE hand-written
  articles (Article/Blog/Case Study) from blog_seed.py. Public GET /api/blog (+category filter),
  GET /api/blog/{slug} (+related). Admin CRUD: GET/POST/PUT/DELETE /api/admin/blog. Frontend
  /blog index (filters + cards) and /blog/:slug post (Article JSON-LD + SEO + related). Blog URLs
  added to sitemap; new posts auto-ping IndexNow. Admin BlogManager.jsx (list + create/edit/delete).
- Contact form: budget is now a free-text amount + currency selector (₹/$/£/etc., defaults to the
  visitor's detected currency) instead of a dropdown of tiers; stored as e.g. "₹ 50,000". Services
  dropdown gained "AI Automation" and "Others".
- Lead geo capture: create_lead now records the inquirer's exact location server-side from IP
  (geo_location/geo_city/geo_country/geo_ip), shown in the admin table data + owner email.
  Inquiries stored in Mongo + owner email + prospect auto-reply (existing).
- All verified: 12 posts seeded, blog CRUD round-trip, lead budget+geo stored, contact form + nav
  render (screenshots), frontend compiles clean.
- STILL PENDING user input (deferred): multi-language languages + prerender approach.


- robots.txt at frontend/public/robots.txt (allows all, disallows /admin, links sitemap on prod domain).
- IndexNow: settings key="indexnow" (auto-generated token, enabled flag). GET /api/indexnow-key
  serves the verification key. ping_indexnow() auto-fires when a new city page is first created
  (get_location_page insert) and in a batch after each warm-up run. Admin GET/PUT /api/admin/indexnow
  and POST /api/admin/indexnow/submit. Note: pings only validate from the real production domain
  (preview returns 422 — expected).
- Admin "SEO tools" card (SeoTools.jsx): IndexNow enable/disable + manual URL submit, and a
  Social share preview (LinkedIn / X / WhatsApp cards) that resolves title/description/image for
  any path (fetches AI page meta for city pages).
- PENDING user input: (1) which languages for real multi-language pages; (2) prerender approach.
- Backend site settings: db.settings key="site" with DEFAULT_SITE (seo/contact/social/business).
  Public GET /api/settings; admin GET/PUT /api/admin/settings/site (deep-merge). Sitemap now
  uses seo.canonical_domain (https://rajeevfreelancer.com). Business includes address +
  google_maps_url + map_embed_url; social includes linkedin/github/twitter/instagram/youtube/facebook.
- Frontend SEO: /lib/siteConfig.js (build-time defaults + live override via SettingsContext +
  JSON-LD builders). Seo.jsx now emits canonical (real domain), og:image/title/desc/site_name/locale,
  twitter card+image+site, robots, and hreflang (locales en/hi/ar + x-default).
- Structured data: Organization (ProfessionalService) + WebSite injected globally in App.js;
  Service + Breadcrumb on service pages; Service + LocalBusiness + FAQPage + Breadcrumb on
  location pages (all using the real domain + settings-driven rating/reviews/social).
- Footer: live social icons (LinkedIn/GitHub/etc.) + Google Map embed + map link (from settings).
- Admin: collapsible "Site settings" card (SiteSettings.jsx) editing all 4 groups; persists and
  reflects on the public site. Digest + warm-up controls unchanged.
- Notes (advisory, non-blocking): CSR app — crawlers that don't execute JS see SITE_DEFAULTS
  meta only (Google renders JS, so fine); JSON-LD renders in <body> (Google accepts anywhere).
- Multi-language: locale-ready SEO (hreflang scaffold) is in place; full translated content is a
  separate effort pending chosen languages.

## Backlog / Notes
- Email deliverability to hello@rajeevfreelancer.com: user must verify the domain at
  resend.com/domains, then set SENDER_EMAIL=leads@rajeevfreelancer.com and
  OWNER_EMAIL=hello@rajeevfreelancer.com in backend/.env.
- CORS_ORIGINS currently "*". For hardened prod, set to the deployed frontend origin.
- Change ADMIN_PASSWORD before going live.
- Warm-up progress is in-process (resets on backend restart); fine for on-demand use.

---

## Continuation Session — 2026-08-18 (ported into workspace)
- Uploaded `rajeev2-main` zip unpacked and ported into `/app` over the starter template (backend, frontend, design_guidelines, PRD).
- Env configured in `/app/backend/.env`: JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, EMERGENT_LLM_KEY, email + digest vars. MONGO_URL/DB_NAME preserved.
- Added frontend deps: lenis, react-fast-marquee, react-helmet-async. Added `resend` (backend).
- Verified end-to-end: backend up (8 services, 135 locations, 22 blog posts seeded), admin login works, home page renders.
- Deployment readiness: PASS (no blockers).
- Admin creds in memory/test_credentials.md.

## GEO/AEO Enhancement Session — 2026-08-18
Researched 2026 GEO/AEO + schema best practices and shipped high-impact ranking upgrades:
- robots.txt now explicitly welcomes AI crawlers (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot, etc.) + sitemap.
- Added public/llms.txt (markdown index of brand, services, key pages) for LLM discovery.
- Added site-wide Person schema (E-E-A-T entity: jobTitle, knowsAbout, alumniOf, sameAs) in App.js.
- Home: new visible answer-first FAQ section (8 Q&As) + FAQPage JSON-LD.
- About: new Experience/expertise cards, career timeline, FAQ section + BreadcrumbList & FAQPage JSON-LD.
- Verified JSON-LD injects cleanly per page (no duplicate entities). Frontend compiles.
Note: preview edge serves its own robots.txt (Cloudflare content-signals); our public/robots.txt applies on the deployed custom domain.
Backlog: FAQ+schema on ServicesOverview & Pricing, HowTo/Article schema on blog, GA4 wiring, review/portfolio content depth.

## FAQ/Schema + Home Animation Session — 2026-08-18
- Services page: added case-studies "Proof in numbers" section + Services FAQ (visible) with FAQPage + BreadcrumbList JSON-LD.
- Pricing page: added Pricing FAQ (visible) with FAQPage + BreadcrumbList JSON-LD.
- Blog posts: upgraded schema Article -> BlogPosting (+wordCount, inLanguage, author @id -> Person, BreadcrumbList) and added a visible byline (avatar, author, date, read-time) for E-E-A-T.
- Home animations: new Magnetic + TiltCard components; aurora hero backdrop, magnetic + shine CTAs, 3D-tilt service cards; reduced-motion guard in index.css.
- Verified per-page JSON-LD: Services/Pricing = Person+Breadcrumb+FAQPage; Blog post = BlogPosting+Breadcrumb. Frontend compiles clean; screenshots confirm rendering.
- Analytics: GA4/Ads wiring already present (initTracking/trackConversion) — user must add GA4 ID in Admin > Site Settings (user action, no code needed).

## Case Studies + Reviews + Marquee Session — 2026-08-18
- Case Studies: new data/caseStudies.js (3 studies), /case-studies index + /case-studies/:slug detail pages (Article + BreadcrumbList + CollectionPage schema, animated result counters). Routes added before catch-all in App.js. Added to backend sitemap.
- ServicesOverview proof cards now link to case-study detail pages (+ "All case studies" link).
- Testimonial motion: Home testimonials replaced with react-fast-marquee (pauseOnHover, edge fade), driven by shared REVIEWS.
- Reviews + schema: REVIEWS added in siteConfig; organizationSchema now emits AggregateRating(4.9/96) + 6 Review items (star-rating eligible). NOTE: these are curated/representative reviews — live Google review auto-sync requires Google Places API + Place ID (not wired; user to confirm if wanted).
- Google Business link now on Contact page, Home testimonials header, and Footer (GOOGLE_PROFILE in data/site.js).
- Counters already animate on scroll (Counter.jsx, useInView) — confirmed.
- Verified: frontend compiles clean; screenshots confirm all sections; per-page JSON-LD correct.

## More Case Studies + Filters + OG Images Session — 2026-08-18
- Added 3 new case studies (total 6): 42% revenue via WhatsApp (F&B), 50k+ app downloads (fitness), -38% CAC (Google Ads). Each with numbers, narrative, quote, schema.
- Added `category` field + filter chips (All/SEO/AI/Web/Marketing/App) on /case-studies index.
- Generated 6 branded OG share images (gemini-3.1-flash-image) per case study; wired into Seo image (og:image/twitter:image) on detail pages.
- Removed static og:image/twitter:image from public/index.html so react-helmet-async controls them per page (fixed duplicate og:image -> now exactly 1, correct branded image).
- Sitemap updated to all 6 case-study slugs.
- PENDING (needs user input): Live Google Reviews via Google Places API (New) — requires a server-side Google Maps Platform API key (IP-restricted, Places API New enabled) + the business Place ID. Playbook obtained.

## Nav Link + Metrics Chart + Proof Strip Session — 2026-08-18
- Nav: added "Case studies" to top nav (NAV array -> desktop + mobile menus).
- Case study detail: added animated Before/After bar chart (BeforeAfterChart in CaseStudyDetail.jsx) driven by new `chart` field per case study (before/after/suffix/prefix/higherIsBetter).
- Home: new ProofStrip component (react-fast-marquee of all 6 result metrics, each linking to its case study + "See case studies" CTA) placed under the skill marquee.
- Verified: compiles clean; screenshots confirm nav link, chart animation, and proof strip (no overlap).

## Related Cases + Home Teaser Session — 2026-08-18
- Case study detail counters: confirmed animate on scroll (Counter, verified 0->80% / 0/7->24/7).
- ServiceHub: added "Related results" section filtering CASE_STUDIES by service slug (data-testid service-related-cases) with image cards linking to detail.
- Home: added "Selected work" teaser (top 3 case studies with cover images + metrics, TiltCard) placed before testimonials.
- Verified: compiles clean; screenshots confirm all three.

## Rotation + Logos + PDF Session — 2026-08-18
- Home Selected Work now rotates: localStorage 'sw_rot' offset advances each visit, showing a fresh window of 3 case studies (useMemo).
- Home: added client/industry logos strip ("Teams & brands I've delivered for") with 6 styled representative wordmarks (data-testid home-clients). NOTE: representative brand names, not real client logos.
- Case study detail: "Download PDF" button (jsPDF) generates a clean one-page PDF from case study data (no screenshots/CORS). Verified download (~8KB). Added jspdf dependency.
- Verified: compiles clean; rotation, logos, and PDF all confirmed via automation.

## Share Buttons + Case Study CMS Session — 2026-08-18
- Case studies migrated from static frontend data to MongoDB (backend/case_seed.py seeds 6). Full CRUD:
  - Public: GET /api/case-studies (list+categories), GET /api/case-studies/{slug}.
  - Admin (JWT): GET/POST/PUT/DELETE /api/admin/case-studies. Sitemap now pulls case-study slugs from DB.
- New admin/CaseStudyManager.jsx wired into Admin dashboard (SEO Tools, Blog, Case studies, Lead Map, Site Settings all present) => strong admin panel managing SEO + leads + blog + case studies.
- Frontend public pages (CaseStudies, CaseStudyDetail, Home selected work, ProofStrip, ServiceHub related) now fetch case studies from API with static fallback.
- Share buttons on each case study: LinkedIn, WhatsApp, X, Copy link (data-testid case-share, share-linkedin/whatsapp/x/copy).
- Testing agent: 100% pass (backend pytest 10/10 + UI E2E). test creds unchanged.

## Mobile/Responsive + Floating Buttons Session — 2026-08-18
- Floating actions: Call & WhatsApp are now icon-only round buttons (side by side); Inquiry stays a labelled pill. (components/FloatingActions.jsx)
- Mobile nav: replaced dropdown panel with an app-style slide-in drawer (backdrop, logo header, large nav items w/ arrows, services grid, language chips, Get-a-quote + WhatsApp CTAs) + body scroll lock. (components/Nav.jsx)
- Verified responsive on 390px + 1440px (home, case studies).
- NOTE: object-storage helpers added to backend (server.py) but Image Uploads / Admin Case Preview / Drag Reorder were NOT completed — user redirected to the design/responsive task mid-implementation. These 3 remain pending (storage init not wired at startup; helpers are inert/harmless).

## Image Uploads + Preview + Drag Reorder + Responsive Audit — 2026-08-18
- Object storage wired: POST /api/admin/upload (admin, image only, <8MB) + public GET /api/uploads/{id}; init_storage() at startup (verified 200). Reusable admin/ImageUpload.jsx (upload or paste URL + thumbnail).
- Image uploads live in CaseStudyManager (cover + OG) and BlogManager (cover).
- Live preview panel in CaseStudyManager (case-preview / case-preview-toggle) shows the public card look before publishing.
- Drag reorder: case studies (PUT /api/admin/case-studies/reorder) and blog (PUT /api/admin/blog/reorder). Blog gained an `order` field; list/admin sorts respect it. Native HTML5 drag with grip handles.
- Responsive audit: verified 0 horizontal overflow at 390px across home/about/pricing/services/contact/service pages; floating buttons + mobile drawer consistent.
- Verified: backend curl (upload 200, serve 200), admin UI renders upload+preview+drag; frontend compiles clean.

## Iteration 4 (2026-06 fork) — Ads readiness + NCR SEO + rebrand
- [x] /thank-you page: all 4 lead forms (contact page, homepage form, floating inquiry, call scheduler)
      redirect there on success; fires trackConversion + admin thankyou_code; noindex. Tested E2E.
- [x] Admin-managed tracking (Site settings > Conversion tracking): ga4_id, ads_id,
      ads_conversion_label, gtm_id, meta_pixel_id, head_code, body_code, thankyou_code.
      Runtime injection via siteConfig.js (initTracking/injectHtml/fireThankyouCode) + SPA
      page_view on route change. Verified script execution E2E (testing agent iteration_2: pass).
- [x] Lead validation: POST /api/leads now 422 without email or phone.
- [x] UI fixes from iteration_2 report: modal overlay contrast (bg-ink/85), floating Inquiry pill
      icon-only on mobile, admin settings header mentions tracking.
- [x] Delhi NCR hyperlocal SEO: 63 localities (Gurgaon 18, Delhi 20, Noida 12, Ghaziabad 7,
      Faridabad 6) via data.py NCR_LOCALITIES + Ghaziabad/Faridabad added as cities. Total 200
      locations x 8 services. In sitemap, /locations/india, service hubs. TOP_CITY_SLUGS now 33
      (auto-warm covers NCR). URLs like /freelance-seo-expert/mg-road-gurgaon. Verified live.
- [x] New profile photo (0zkv66rh_image.png) replaced everywhere: nav, home, about, favicon,
      og_image, business.logo (code defaults + stored DB settings).
- [x] SEO rebrand: title "App Developer, Website Development & SEO Marketing Consultant | Rajeev"
      + Delhi NCR description. Updated in DEFAULT_SITE, SITE_DEFAULTS, index.html, stored DB
      settings, Home/About/Contact Seo, footer, personSchema jobTitle, hero copy.
- [x] Homepage "Serving Delhi NCR" section (NcrSection.jsx): 5 city cards, 31 top locality chips
      linking to rotated service x locality pages + "All India locations" link. Verified live.

## Restore + Run Here (2026-06, this session)
- [x] Downloaded rajeevfreelancer-main.zip, unzipped, rsync'd into /app (excluded .env/.git/.emergent/node_modules).
- [x] Rebuilt backend/.env: new JWT_SECRET, EMERGENT_LLM_KEY wired, ADMIN_EMAIL=admin@rajeevfreelancer.com /
      ADMIN_PASSWORD=RajeevAdmin#2026 (seeded), RESEND_API_KEY blank (email skips gracefully),
      AUTO_WARM_ON_STARTUP=false (avoid heavy LLM gen on boot in preview).
- [x] Deps: pip resend==2.37.0 installed (emergentintegrations 0.2.0 + litellm 1.80.0 already coexist in base image); yarn install.
- [x] Both services RUNNING. Startup seeded admin + 22 blog posts + 6 case studies + object storage init.
- [x] Smoke test (external URL): /api/ health, /api/services (8), admin JWT login (token OK),
      POST /api/leads (ok), /api/admin/stats (OK). Homepage renders + talks to backend.
- [x] Deployment readiness: PASS. Fixed .gitignore blocking .env files (removed .env/.env.*/*.env at root).
- [ ] USER ACTION: click platform Deploy button (frontend + backend + Mongo).

## Jeny AI Chat Assistant (2026-08-20)
- "Jeny — Rajeev's AI assistant" chat widget (components/JenyChat.jsx), bottom-left bubble.
  Auto pops up 15s after landing (once per browser session, sessionStorage 'jeny_auto') with a
  free browser-voice greeting (speechSynthesis, mute toggle persisted in localStorage 'jeny_muted').
- Backend: POST /api/chat (SSE streaming, Gemini 3 Flash via emergentintegrations + EMERGENT_LLM_KEY,
  shares _llm_gate semaphore). Sessions stored in db.chat_sessions (session_id from localStorage
  'jeny_sid'); history injected into system prompt (last 12 msgs) so Jeny never re-asks.
- Phone capture: regex on user messages -> phone_captured on session + auto-creates a lead
  ("Website chat visitor (Jeny)", service "Jeny chat lead", fires notify_new_lead) exactly once/session.
  Jeny politely asks for the number until captured, thanks + stops asking after.
- Public GET /api/chat/history/{sid} (returning visitors resume chat). Admin (JWT):
  GET /api/admin/chats (list w/ phone badge, preview), GET/DELETE /api/admin/chats/{sid}.
- Admin panel: new "Jeny chat conversations" card (pages/admin/ChatManager.jsx) — session list,
  full transcript, green "Chat on WhatsApp" button (wa.me, 10-digit numbers auto-prefixed 91), delete.
- English-only replies, quick-suggestion chips, typing indicator, streaming tokens.
- Tested: testing agent iteration_3 — 19/19 backend tests + all frontend flows pass; regression clean.
  Post-test polish: res.ok check in widget, chat-load error toast, +91 badge display.
- Voice + highlights update (same day): key phrases (**WhatsApp number**, **phone number**,
  **free consultation**, service names) rendered bold in brand color (lib/chatText.js, LLM
  instructed to **bold** them; also regex fallback). Voice conversation mode: mic button
  (Web Speech API) — tap once to start; recognized speech auto-sends; Jeny speaks her reply and
  the mic auto-reopens (hands-free loop). Mic auto-starts on chat open for returning voice users
  (localStorage 'jeny_voice'). Graceful: mic hidden if browser lacks SpeechRecognition.
  Verified: highlighting E2E via automation; mic UI renders (real-mic loop untestable headless).

## Chat Alerts + Lead Qualifying (2026-08-20)
- Instant chat-capture alert email (email_utils.send_chat_alert): fires the moment Jeny captures a
  phone number — includes name/phone/budget/service/page, full conversation transcript, and a green
  "Reply on WhatsApp" (wa.me) button + dashboard link. Sent to OWNER_EMAIL (replaces generic
  notify_new_lead for chat leads). Verified live send (test mode delivers to rajeev.gits@gmail.com).
- Jeny lead qualifying: system prompt now asks name early, then phone, then approx budget (one at a
  time, conversational). _extract_chat_info (Gemini flash, JSON) pulls name/budget/service from the
  transcript at phone-capture time -> lead created with real name, "Jeny chat: <service>", budget.
  _update_lead_info backfills name/budget on later messages (capped 5 attempts/session). Session
  stores visitor_name/budget; prompt gets them so Jeny never re-asks. Admin ChatManager shows
  name + budget in list + detail header.
- Verified E2E via curl: "Hi I am Priya... ecommerce website" + "budget 80,000... WhatsApp 98123456xx"
  -> lead {name: Priya, service: Jeny chat: ecommerce website, budget: around 80,000 rupees}.
  Regression: 19/19 jeny pytest suite passes. Test data cleaned.
- DEPLOY: attempted — blocked: first deploy costs 50 ECUs/month, balance 40 ECUs. USER ACTION:
  add credits/upgrade, then re-request deploy.
- RESEND DOMAIN (USER DNS ACTION): verify rajeevfreelancer.com at resend.com/domains, then set
  SENDER_EMAIL=leads@rajeevfreelancer.com in backend/.env to exit test mode.
