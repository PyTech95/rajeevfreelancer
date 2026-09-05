// Regional landing pages for high-value Western markets (/us, /uk, /de).
// Copy, CTAs, currency, spelling and contact channels are localized per the
// region's business culture (US: direct/ROI, UK: partnership/bespoke, DE: formal/DSGVO).

export const REGIONS = {
  us: {
    code: "us",
    htmlLang: "en-US",
    label: "USA",
    dir: "ltr",
    seo_title: "Hire a Senior Freelancer for Web, SEO & AI — USA | Rajeev Freelancer",
    seo_desc:
      "US startups & SMBs hire Rajeev — a senior freelancer (ex-Google, Accenture) for websites, SEO and AI automation that move revenue. Direct communication, fast delivery, free quote.",
    hero_tag: "Available for US clients · EST–PST overlap daily",
    hero_title: "Results, not decks. Shipped by a senior freelancer.",
    hero_sub:
      "I'm Rajeev — a senior freelancer with 12+ years across Google, Accenture and IOG. US founders and marketing leads hire me to build fast websites, rank them on Google, and automate the busywork with AI. You work with me directly, and every deliverable is tied to a number that matters.",
    cta_primary: "Get a Free Quote Now",
    cta_secondary: "Book a Discovery Call",
    show_whatsapp: false,
    currency_note: "Clear USD pricing, fixed quotes, no hourly billing surprises.",
    proof_title: "Recent outcomes for clients",
    proof: [
      { metric: "3×", label: "organic traffic in 5 months for a D2C brand" },
      { metric: "+52%", label: "conversion rate after a full website rebuild" },
      { metric: "−38%", label: "customer acquisition cost on Google Ads" },
    ],
    approach_title: "Built for how US businesses buy",
    approach: [
      { title: "Direct & fast", text: "You talk to the person doing the work. Same-day replies in US business hours, weekly demo videos, zero account-manager relay." },
      { title: "ROI-first scope", text: "Every proposal leads with the business outcome — leads, revenue, conversion rate — then the technical plan that gets there." },
      { title: "Paperwork handled", text: "US-friendly contracts, W-8BEN on file, invoices in USD via Wise or PayPal. Onboarding takes a day, not a procurement cycle." },
      { title: "Compliance-aware builds", text: "WCAG/ADA-conscious development and Core Web Vitals budgets baked in — the stuff that protects you and ranks you." },
    ],
    services_title: "What US clients hire me for",
    cities_title: "Popular in these US cities",
    cities: [
      { city: "New York", loc: "new-york-usa" },
      { city: "San Francisco", loc: "san-francisco-usa" },
      { city: "Los Angeles", loc: "los-angeles-usa" },
      { city: "Austin", loc: "austin-usa" },
      { city: "Chicago", loc: "chicago-usa" },
      { city: "Seattle", loc: "seattle-usa" },
    ],
    faqs: [
      { q: "How do time zones work with a freelancer based in India?", a: "I keep a daily overlap with EST and PST — typically your morning maps to my evening. Most US clients get same-day replies, and anything sent by your end-of-day is usually done by your next morning." },
      { q: "How do contracts and payments work for US companies?", a: "Simple fixed-price agreements with milestones, a completed W-8BEN for your records, and USD invoices payable by Wise, PayPal or card. No retainers unless you ask for one." },
      { q: "Can you make our website ADA compliant?", a: "Yes. I build to WCAG 2.2 AA — semantic HTML, keyboard navigation, contrast and ARIA where needed — and I audit existing sites against the same standard to reduce legal exposure." },
      { q: "Why hire a freelancer instead of a US agency?", a: "You get senior-only execution at roughly a third of agency rates, with direct communication and week-level turnarounds. Agencies assign juniors; I do the work myself and stand behind it." },
    ],
    contact_title: "Tell me about your project",
    contact_sub: "Two minutes to fill in, a personal reply within one US business day — usually much faster.",
  },

  uk: {
    code: "uk",
    htmlLang: "en-GB",
    label: "UK",
    dir: "ltr",
    seo_title: "Bespoke Freelancer for Web, SEO & AI — UK | Rajeev Freelancer",
    seo_desc:
      "UK businesses work with Rajeev — a senior freelancer (ex-Google, Accenture) for bespoke websites, SEO and AI automation. A reliable long-term partner, not a rotating agency team. Enquire now.",
    hero_tag: "Working with UK clients · GMT/BST overlap all morning",
    hero_title: "A senior freelancer who treats your business like his own.",
    hero_sub:
      "I'm Rajeev — a senior freelancer with 12+ years across Google, Accenture and IOG. UK clients value a proper working relationship: clear briefs, honest advice, and delivery you can plan around. That's exactly how I work — bespoke websites, SEO that compounds, and AI automation that quietly saves hours.",
    cta_primary: "Enquire Now",
    cta_secondary: "Request a Callback",
    show_whatsapp: true,
    currency_note: "Straightforward GBP pricing with milestone-based invoices.",
    proof_title: "Results UK clients care about",
    proof: [
      { metric: "3×", label: "organic traffic in 5 months for a D2C brand" },
      { metric: "42%", label: "of revenue via WhatsApp for an F&B client" },
      { metric: "24/7", label: "AI lead qualification, even out of hours" },
    ],
    approach_title: "A partnership, not a purchase order",
    approach: [
      { title: "Proper discovery", text: "We start with a structured brief and a candid audit. If I'm not the right fit, I'll say so and point you somewhere better." },
      { title: "Regular check-ins", text: "A standing weekly call or written update — your choice — so you always know where things stand without chasing." },
      { title: "UK-ready paperwork", text: "Clear statements of work, UK GDPR-aware data handling, and invoices your finance team won't query." },
      { title: "Bespoke, never templated", text: "Every build is designed around your customers and your market — no off-the-shelf themes with your logo pasted on." },
    ],
    services_title: "Services UK businesses enquire about most",
    cities_title: "Working with clients in",
    cities: [
      { city: "London", loc: "london-uk" },
      { city: "Manchester", loc: "manchester-uk" },
      { city: "Birmingham", loc: "birmingham-uk" },
      { city: "Leeds", loc: "leeds-uk" },
      { city: "Bristol", loc: "bristol-uk" },
      { city: "Edinburgh", loc: "edinburgh-uk" },
    ],
    faqs: [
      { q: "Do you work to UK GDPR?", a: "Yes. Forms, analytics and any data processing are set up with UK GDPR in mind — consent-first tracking, data minimisation, and clear retention. I can also review your current setup." },
      { q: "How does invoicing work for UK companies?", a: "Fixed-price milestones invoiced in GBP, payable by bank transfer via Wise (with proper GBP account details) or card. You receive a proper invoice for every payment." },
      { q: "What about the time difference?", a: "India is 4.5–5.5 hours ahead, so your morning is my afternoon — we share a comfortable overlap every working day, and WhatsApp keeps things moving in between." },
      { q: "Can you support us long term?", a: "Most UK clients stay on a light monthly arrangement: ongoing SEO, iterative improvements and priority support. It's flexible — pause or scale any month." },
    ],
    contact_title: "Tell me what you're working on",
    contact_sub: "A short brief is plenty. I'll come back with an honest view and a clear next step — usually the same working day.",
  },

  de: {
    code: "de",
    htmlLang: "de-DE",
    label: "Deutschland",
    dir: "ltr",
    seo_title: "Senior Freelancer für Web, SEO & KI — Deutschland | Rajeev Freelancer",
    seo_desc:
      "Deutsche Unternehmen arbeiten mit Rajeev — Senior Freelancer (ehemals Google, Accenture) für Websites, SEO und KI-Automatisierung. DSGVO-bewusst, zuverlässig, mit 12+ Jahren Erfahrung. Informationen anfordern.",
    hero_tag: "Für deutsche Unternehmen · Tägliche Überlappung mit CET",
    hero_title: "Senior Freelancer. Messbare Ergebnisse. Verlässliche Zusammenarbeit.",
    hero_sub:
      "Ich bin Rajeev — Senior Freelancer mit über 12 Jahren Erfahrung bei Google, Accenture und IOG. Deutsche Unternehmen schätzen meine strukturierte Arbeitsweise: präzise Angebote, dokumentierte Prozesse, DSGVO-bewusste Umsetzung und Ergebnisse, die sich in Zahlen messen lassen.",
    cta_primary: "Informationen anfordern",
    cta_secondary: "Kontaktformular",
    show_whatsapp: false,
    currency_note: "Feste EUR-Preise, ordentliche Rechnungen, keine versteckten Kosten.",
    proof_title: "Nachweisbare Ergebnisse",
    proof: [
      { metric: "3×", label: "organischer Traffic in 5 Monaten (D2C-Marke)" },
      { metric: "+52%", label: "Conversion-Rate nach Website-Relaunch" },
      { metric: "50k+", label: "App-Downloads für einen Fitness-Client" },
    ],
    approach_title: "Struktur, auf die Sie sich verlassen können",
    approach: [
      { title: "Präzise Spezifikation", text: "Jedes Projekt beginnt mit einem dokumentierten Lastenheft: Ziele, Umfang, Technologie-Stack und Meilensteine — schriftlich, bevor eine Zeile Code entsteht." },
      { title: "DSGVO von Anfang an", text: "Consent-Management, Datenminimierung, Auftragsverarbeitung und Hosting-Optionen in der EU. Datenschutz ist bei mir Teil der Architektur, kein Nachtrag." },
      { title: "Dokumentierte Qualität", text: "Sauberer, kommentierter Code mit Übergabe-Dokumentation. Sie bleiben unabhängig — jede Agentur oder Entwicklerin kann nahtlos übernehmen." },
      { title: "Verlässliche Kommunikation", text: "Fest eingeplante Jour-fixe-Termine, schriftliche Statusberichte und verbindliche Zusagen. Auf Deutsch oder Englisch." },
    ],
    services_title: "Leistungen für den deutschen Markt",
    cities_title: "Kunden in ganz Deutschland",
    cities: [
      { city: "Berlin", loc: "berlin-germany" },
      { city: "München", loc: "munich-germany" },
      { city: "Frankfurt", loc: "frankfurt-germany" },
      { city: "Hamburg", loc: "hamburg-germany" },
      { city: "Köln", loc: "cologne-germany" },
    ],
    faqs: [
      { q: "Ist die Zusammenarbeit DSGVO-konform?", a: "Ja. Ich arbeite mit Auftragsverarbeitungsverträgen (AVV), setze auf Datenminimierung und implementiere Consent-Management nach aktuellem Standard. Tracking erfolgt erst nach Einwilligung." },
      { q: "Was ist mit Impressum und rechtlichen Pflichtseiten?", a: "Jede von mir gelieferte Website enthält Impressum und Datenschutzerklärung an den richtigen Stellen. Die rechtlichen Texte selbst erstellt Ihr Rechtsbeistand oder ein Generator — die technische Einbindung übernehme ich." },
      { q: "Wie funktioniert die Abrechnung?", a: "Festpreis pro Meilenstein, Rechnung in EUR mit ausgewiesener USt.-Behandlung (Reverse Charge bei B2B innerhalb der EU), zahlbar per Überweisung. Keine Stundenzettel-Diskussionen." },
      { q: "In welcher Sprache läuft das Projekt?", a: "Schriftlich gerne auf Deutsch, in Calls auf Deutsch oder Englisch — ganz wie es für Ihr Team am effizientesten ist. Dokumentation liefere ich auf Wunsch zweisprachig." },
    ],
    contact_title: "Beschreiben Sie Ihr Vorhaben",
    contact_sub: "Eine kurze Nachricht genügt. Sie erhalten eine ehrliche Ersteinschätzung — in der Regel noch am selben Werktag.",
    impressum_note:
      "Hinweis: Auf Wunsch liefere ich Ihre Website inklusive korrekt eingebundenem Impressum und Datenschutzerklärung — Pflicht für geschäftliche Websites in Deutschland.",
  },
};

export const REGION_LIST = Object.values(REGIONS);
