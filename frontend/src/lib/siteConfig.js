// Build-time SEO/site defaults (kept in sync with backend DEFAULT_SITE). These make the
// first render correct even before the live /api/settings fetch resolves. Admin edits persist
// server-side and hydrate the app at runtime via SettingsContext -> setSiteConfig().

export const SITE_DEFAULTS = {
  seo: {
    site_name: "Rajeev Freelancer",
    default_title: "Rajeev Freelancer — Senior Freelance Engineer & AI/Digital Marketing Consultant",
    default_description:
      "Hire Rajeev — a senior freelance engineer & AI/digital marketing consultant with 12+ years' experience. Web development, software, SEO, AI automation & WhatsApp marketing. Available worldwide.",
    og_image: "https://customer-assets-gfyr7b9c.emergentagent.net/job_rajeev-seo-hub/artifacts/whqtfhxo_image.png",
    canonical_domain: "https://www.rajeevfreelancer.com",
    twitter_handle: "@rajeevfreelancer",
    robots_index: true,
    default_locale: "en",
    locales: ["en", "hi", "ar"],
  },
  contact: {
    name: "Rajeev Freelancer",
    email: "hello@rajeevfreelancer.com",
    phone: "+919711623561",
    whatsapp: "919711623561",
    whatsapp_display: "+91 97116 23561",
  },
  social: { linkedin: "", twitter: "", github: "", instagram: "", youtube: "", facebook: "" },
  business: {
    logo: "https://customer-assets-gfyr7b9c.emergentagent.net/job_rajeev-seo-hub/artifacts/whqtfhxo_image.png",
    rating: "4.9",
    reviews_count: "96",
    founding_year: "2013",
    founder_name: "Rajeev Gits",
    address: "Gurgaon, Haryana, India",
    google_maps_url: "https://www.google.com/maps/place/Gurgaon,+Haryana",
    map_embed_url: "https://www.google.com/maps?q=Gurgaon,Haryana,India&output=embed",
  },
  tracking: { ga4_id: "", ads_id: "", ads_conversion_label: "" },
  marketing: { offers_enabled: true, popup_enabled: true, offers_end_date: "" },
};

let _config = SITE_DEFAULTS;

// Curated client reviews — rendered on-site and emitted as Review schema on the org node
// so star ratings become eligible in search. (For live Google review sync, wire the
// Google Places API with a Place ID — kept manual for now.)
export const REVIEWS = [
  { name: "Priya Nair", role: "Founder, D2C skincare brand", location: "Mumbai, India", rating: 5, img: "https://images.unsplash.com/photo-1573496130141-209d200cebd8?crop=entropy&cs=srgb&fm=jpg&q=85&w=200", quote: "Rajeev rebuilt our site and our organic traffic tripled in five months. He treats your business like his own." },
  { name: "Daniel Roberts", role: "Ops Lead, B2B SaaS", location: "London, UK", rating: 5, img: "https://images.unsplash.com/photo-1622626426572-c268eb006092?crop=entropy&cs=srgb&fm=jpg&q=85&w=200", quote: "The WhatsApp automation alone paid for the whole engagement. Fast, senior, no fluff." },
  { name: "Ahmed Hassan", role: "Director, Retail", location: "Dubai, UAE", rating: 5, img: "https://images.unsplash.com/photo-1589386417686-0d34b5903d23?crop=entropy&cs=srgb&fm=jpg&q=85&w=200", quote: "We hired an agency first and wasted months. Rajeev fixed it in weeks — and explained every decision." },
  { name: "Sofia Marín", role: "Marketing Head, Fintech", location: "Madrid, Spain", rating: 5, img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?crop=entropy&cs=srgb&fm=jpg&q=85&w=200", quote: "Our AI Overview citations went from zero to appearing for our top queries. The GEO work is the real deal." },
  { name: "James Carter", role: "Founder, Home services", location: "Toronto, Canada", rating: 5, img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=srgb&fm=jpg&q=85&w=200", quote: "Clear pricing, quick delivery, and leads coming in on autopilot. Exactly what a lean team needs." },
  { name: "Meera Iyer", role: "COO, Ecommerce", location: "Bangalore, India", rating: 5, img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=srgb&fm=jpg&q=85&w=200", quote: "A faster site and a smarter checkout lifted our conversion by half. Every decision was explained in plain English." },
];

export function getSiteConfig() {
  return _config;
}

function deepMerge(base, override) {
  const out = { ...base };
  for (const k of Object.keys(override || {})) {
    const v = override[k];
    out[k] = v && typeof v === "object" && !Array.isArray(v) && out[k] && typeof out[k] === "object"
      ? deepMerge(out[k], v)
      : v;
  }
  return out;
}

export function setSiteConfig(next) {
  _config = deepMerge(SITE_DEFAULTS, next || {});
  return _config;
}

// Inject Google Analytics 4 / Google Ads gtag.js once, if IDs are configured.
export function initTracking() {
  const t = getSiteConfig().tracking || {};
  const ids = [t.ga4_id, t.ads_id].filter(Boolean);
  if (!ids.length || typeof window === "undefined" || window.__gtagLoaded) return;
  window.__gtagLoaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${ids[0]}`;
  document.head.appendChild(s);
  window.gtag("js", new Date());
  ids.forEach((id) => window.gtag("config", id));
}

// Fire a lead conversion (GA4 generate_lead + Google Ads conversion) on form success.
export function trackConversion(meta = {}) {
  const t = getSiteConfig().tracking || {};
  if (typeof window === "undefined" || !window.gtag) return;
  if (t.ga4_id) window.gtag("event", "generate_lead", meta);
  if (t.ads_id && t.ads_conversion_label) window.gtag("event", "conversion", { send_to: `${t.ads_id}/${t.ads_conversion_label}` });
}

export const canonicalBase = () => (getSiteConfig().seo.canonical_domain || "https://rajeevfreelancer.com").replace(/\/$/, "");

// ---------------- Structured data (JSON-LD) builders ----------------
export function organizationSchema() {
  const c = getSiteConfig();
  const base = canonicalBase();
  const sameAs = Object.values(c.social || {}).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${base}/#organization`,
    name: c.seo.site_name,
    url: base,
    logo: c.business.logo,
    image: c.seo.og_image,
    description: c.seo.default_description,
    email: c.contact.email,
    telephone: c.contact.phone,
    areaServed: "Worldwide",
    foundingDate: c.business.founding_year,
    founder: { "@type": "Person", name: c.business.founder_name },
    ...(sameAs.length ? { sameAs } : {}),
    ...(c.business.rating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: String(c.business.rating),
            reviewCount: String(c.business.reviews_count),
            bestRating: "5",
          },
          review: REVIEWS.map((r) => ({
            "@type": "Review",
            reviewRating: { "@type": "Rating", ratingValue: String(r.rating), bestRating: "5" },
            author: { "@type": "Person", name: r.name },
            reviewBody: r.quote,
          })),
        }
      : {}),
  };
}

// Person entity for E-E-A-T & AI knowledge-graph disambiguation.
export function personSchema() {
  const c = getSiteConfig();
  const base = canonicalBase();
  const sameAs = Object.values(c.social || {}).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${base}/#rajeev`,
    name: c.business.founder_name || "Rajeev",
    alternateName: "Rajeev Freelancer",
    jobTitle: "Senior Freelance Engineer & AI / Digital Marketing Consultant",
    description:
      "Senior freelance engineer & AI/digital-marketing consultant with 12+ years' experience (ex-IOG, Accenture, Google). Web & software development, SEO, GEO, AI automation and WhatsApp marketing for businesses worldwide.",
    image: c.business.logo,
    url: base,
    email: c.contact.email,
    telephone: c.contact.phone,
    worksFor: { "@id": `${base}/#organization` },
    knowsAbout: [
      "Search Engine Optimization",
      "Generative Engine Optimization",
      "AI Automation",
      "Web Development",
      "Software Engineering",
      "Digital Marketing",
      "WhatsApp Marketing",
      "React",
      "Python",
    ],
    alumniOf: [
      { "@type": "Organization", name: "IOG" },
      { "@type": "Organization", name: "Accenture" },
      { "@type": "Organization", name: "Google" },
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Gurgaon",
      addressRegion: "Haryana",
      addressCountry: "IN",
    },
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function websiteSchema() {
  const c = getSiteConfig();
  const base = canonicalBase();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${base}/#website`,
    url: base,
    name: c.seo.site_name,
    inLanguage: c.seo.default_locale,
    publisher: { "@id": `${base}/#organization` },
  };
}

export function breadcrumbSchema(items) {
  const base = canonicalBase();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${base}${it.path}`,
    })),
  };
}

export function serviceSchema({ name, description, path, city }) {
  const c = getSiteConfig();
  const base = canonicalBase();
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: name,
    name,
    ...(description ? { description } : {}),
    provider: { "@id": `${base}/#organization`, name: c.seo.site_name },
    ...(city ? { areaServed: { "@type": "City", name: city } } : { areaServed: "Worldwide" }),
    url: `${base}${path}`,
  };
}

export function localBusinessSchema({ city, country, path, name }) {
  const c = getSiteConfig();
  const base = canonicalBase();
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `${c.seo.site_name} — ${city}`,
    image: c.seo.og_image,
    url: `${base}${path}`,
    email: c.contact.email,
    telephone: c.contact.phone,
    priceRange: "$$",
    areaServed: { "@type": "City", name: city },
    address: { "@type": "PostalAddress", addressLocality: city, addressCountry: country },
    ...(name ? { description: name } : {}),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: String(c.business.rating),
      reviewCount: String(c.business.reviews_count),
    },
  };
}

export function faqSchema(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: (faqs || []).map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
